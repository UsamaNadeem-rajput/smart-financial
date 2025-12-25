// Express API for income report functionality
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Explicit CORS headers for credentials
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'https://khushifinances.com'];
  
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// GET /api/income-report/:business_id?fromMonth=YYYY-MM&toMonth=YYYY-MM
// Returns month-wise income and expense ledger balances
router.get('/:business_id', async (req, res) => {
  const { business_id } = req.params;
  const { fromMonth, toMonth, onDate, fromDate: fromDateQuery, toDate: toDateQuery } = req.query;

  if (!business_id) {
    return res.status(400).json({ error: 'Business ID is required' });
  }

  if (!onDate && !(fromDateQuery && toDateQuery) && !(fromMonth && toMonth)) {
    return res.status(400).json({ error: 'Provide either onDate (YYYY-MM-DD), fromDate/toDate (YYYY-MM-DD), or fromMonth/toMonth (YYYY-MM)' });
  }

  // Validate date format
  if (onDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(onDate)) {
      return res.status(400).json({ error: 'onDate must be in YYYY-MM-DD format' });
    }
  }
  if (fromDateQuery || toDateQuery) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDateQuery || '') || !/^\d{4}-\d{2}-\d{2}$/.test(toDateQuery || '')) {
      return res.status(400).json({ error: 'fromDate and toDate must be in YYYY-MM-DD format' });
    }
    if (fromDateQuery > toDateQuery) {
      return res.status(400).json({ error: 'fromDate must be before or equal to toDate' });
    }
  }
  if (!onDate && !(fromDateQuery && toDateQuery)) {
    if (!/^\d{4}-\d{2}$/.test(fromMonth || '') || !/^\d{4}-\d{2}$/.test(toMonth || '')) {
      return res.status(400).json({ error: 'fromMonth and toMonth must be in YYYY-MM format' });
    }
  }

  let conn;
  try {
    conn = await pool.getConnection();

    let fromDate;
    let toDateStr;
    if (onDate) {
      fromDate = onDate;
      toDateStr = onDate;
    } else if (fromDateQuery && toDateQuery) {
      fromDate = fromDateQuery;
      toDateStr = toDateQuery;
    } else {
      const f = `${fromMonth}-01`;
      const t = new Date(`${toMonth}-01`);
      t.setMonth(t.getMonth() + 1);
      t.setDate(0);
      fromDate = f;
      toDateStr = `${toMonth}-${String(t.getDate()).padStart(2, '0')}`;
    }

    // Get all income and expense ledgers for this business
    const [ledgers] = await conn.execute(
      `SELECT 
        a.account_id,
        a.account_name,
        COALESCE(t.type_id, a.type_id) as type_id,
        COALESCE(t.type_name, 'Unknown') as type_name
       FROM accounts a
       LEFT JOIN account_types t ON a.type_id = t.type_id
       WHERE a.business_id = ?
         AND (t.type_id IN (1, 2) OR a.type_id IN (1, 2))
       ORDER BY COALESCE(t.type_id, a.type_id), a.account_name`,
      [business_id]
    );

    // Get all transaction entries in the date range first, then filter by account type
    // This helps us see all transactions and then filter for income/expense
    const [allEntries] = await conn.execute(
      `SELECT 
        tr.transaction_id,
        tr.date,
        te.account_id,
        te.amount,
        te.type,
        a.account_name,
        a.type_id as account_type_id,
        COALESCE(t.type_id, a.type_id) as type_id,
        COALESCE(t.type_name, 'Unknown') as type_name
       FROM transactions tr
       INNER JOIN transaction_entries te ON tr.transaction_id = te.transaction_id
       INNER JOIN accounts a ON te.account_id = a.account_id
       LEFT JOIN account_types t ON a.type_id = t.type_id
       WHERE tr.business_id = ?
         AND DATE(tr.date) >= ?
         AND DATE(tr.date) <= ?
       ORDER BY tr.date, tr.transaction_id`,
      [business_id, fromDate, toDateStr]
    );
    
    // Filter for income/expense accounts only
    // We use all entries here to ensure we don't miss any data due to type mismatches
    // The filtering happens naturally in the ledger loop below where we only iterate over income/expense ledgers
    const transactions = allEntries;

    // Aggregate totals per account across the selected date range
    const accountTotals = {};

    transactions.forEach(trans => {
      const accountId = trans.account_id;
      const accountName = trans.account_name;
      const typeId = trans.type_id;
      const typeName = trans.type_name;
      if (!accountTotals[accountId]) {
        accountTotals[accountId] = {
          account_id: accountId,
          account_name: accountName,
          type_id: typeId,
          type_name: typeName,
          debits: 0,
          credits: 0
        };
      }
      if (trans.type === 'debit') {
        accountTotals[accountId].debits += Number(trans.amount);
      } else {
        accountTotals[accountId].credits += Number(trans.amount);
      }
    });

    // Calculate balances per ledger across selected date(s)
    const incomeData = [];
    const expenseData = [];

    // Process each ledger
    ledgers.forEach(ledger => {
      const typeId = Number(ledger.type_id);
      
      // Standard definition of Income and Expense - STRICT MODE requested by user
      // Only include pure Income (1) and Expense (2) types
      // Exclude: Other Incomes (12), Other Expenses (14), Cost Of Goods Sold (13)
      let isIncome = [1].includes(typeId) || ['Income'].includes(ledger.type_name);
      let isExpense = [2].includes(typeId) || ['Expense'].includes(ledger.type_name);
      
      // Strict Mode: Only show true P&L accounts
      // However, if a user manually selected an account type that ISN'T normally income/expense but the ledger query returned it
      // (because we filtered the ledger query to ONLY income/expense types), we should trust the ledger query.
      if (!isIncome && !isExpense) {
         // Fallback: if it's in the list of "ledgers", it MUST be an income/expense account based on our SQL query
         // So we force categorize it based on type_id if possible
         
         // If for some reason typeId is weird, let's re-check
         if ([1].includes(typeId)) isIncome = true;
         else if ([2].includes(typeId)) isExpense = true;
      }

      if (!isIncome && !isExpense) return; // Should theoretically never happen given the SQL query

      const totals = accountTotals[ledger.account_id] || { debits: 0, credits: 0 };
      if (Math.abs(totals.debits) > 0 || Math.abs(totals.credits) > 0) {
        let balance = 0;
        if (isIncome) {
          balance = totals.credits - totals.debits;
        } else if (isExpense) {
          balance = totals.debits - totals.credits;
        }
        const entry = {
          ledger_id: ledger.account_id,
          ledger_name: ledger.account_name,
          balance: balance
        };
        if (isIncome) {
          incomeData.push(entry);
        } else if (isExpense) {
          expenseData.push(entry);
        }
      }
    });

    // Calculate totals
    const incomeTotal = incomeData.reduce((sum, entry) => sum + Math.abs(entry.balance), 0);
    const expenseTotal = expenseData.reduce((sum, entry) => sum + Math.abs(entry.balance), 0);
    const netProfitLoss = incomeTotal - expenseTotal;

    res.json({
      success: true,
      income: incomeData,
      expense: expenseData,
      totals: {
        income: incomeTotal,
        expense: expenseTotal,
        netProfitLoss: netProfitLoss
      },
      dateRange: {
        fromMonth,
        toMonth,
        onDate: onDate || null,
        fromDate: fromDate,
        toDate: toDateStr
      }
    });
  } catch (err) {
    console.error('Income report error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
