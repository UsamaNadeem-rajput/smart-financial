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
  const { fromMonth, toMonth } = req.query;

  if (!business_id) {
    return res.status(400).json({ error: 'Business ID is required' });
  }

  if (!fromMonth || !toMonth) {
    return res.status(400).json({ error: 'fromMonth and toMonth (YYYY-MM format) are required' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}$/.test(fromMonth) || !/^\d{4}-\d{2}$/.test(toMonth)) {
    return res.status(400).json({ error: 'fromMonth and toMonth must be in YYYY-MM format' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Calculate start and end dates for the month range
    const fromDate = `${fromMonth}-01`;
    const toDate = new Date(`${toMonth}-01`);
    toDate.setMonth(toDate.getMonth() + 1);
    toDate.setDate(0); // Last day of the month
    const toDateStr = `${toMonth}-${String(toDate.getDate()).padStart(2, '0')}`;

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

    // Group transactions by account and month
    const accountMonthData = {};

    transactions.forEach(trans => {
      const accountId = trans.account_id;
      const accountName = trans.account_name;
      const typeId = trans.type_id;
      const typeName = trans.type_name;
      const date = new Date(trans.date);
      // Use UTC to avoid timezone shifts pushing dates to previous month
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      
      if (!accountMonthData[accountId]) {
        accountMonthData[accountId] = {
          account_id: accountId,
          account_name: accountName,
          type_id: typeId,
          type_name: typeName,
          months: {}
        };
      }

      if (!accountMonthData[accountId].months[monthKey]) {
        accountMonthData[accountId].months[monthKey] = {
          month: monthKey,
          debits: 0,
          credits: 0
        };
      }

      if (trans.type === 'debit') {
        accountMonthData[accountId].months[monthKey].debits += Number(trans.amount);
      } else {
        accountMonthData[accountId].months[monthKey].credits += Number(trans.amount);
      }
    });

    // Calculate balances for each ledger-month combination
    const incomeData = [];
    const expenseData = [];

    // Generate all months in range
    const months = [];
    const [fromYear, fromMonthNum] = fromMonth.split('-').map(Number);
    const [toYear, toMonthNum] = toMonth.split('-').map(Number);
    
    let year = fromYear;
    let month = fromMonthNum;
    
    while (year < toYear || (year === toYear && month <= toMonthNum)) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      months.push(monthKey);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

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

      // For each month in range, calculate balance
      months.forEach(month => {
        // Ensure strictly string comparison for keys if needed, though JS handles number keys as strings
        const monthData = accountMonthData[ledger.account_id]?.months[month] || {
          month,
          debits: 0,
          credits: 0
        };

        // Calculate balance based on account type
        let balance = 0;
        if (isIncome) {
          // Income: credit-normal (credits - debits)
          balance = monthData.credits - monthData.debits;
        } else if (isExpense) {
          // Expense: debit-normal (debits - credits)
          balance = monthData.debits - monthData.credits;
        }

        // Only include if there are transactions in this month OR if the user wants to see zero balances (implied by "not showing data")
        // For now, we keep the non-zero check but lower the threshold or debug
        if (Math.abs(monthData.debits) > 0 || Math.abs(monthData.credits) > 0) {
          const entry = {
            ledger_id: ledger.account_id,
            ledger_name: ledger.account_name,
            month: month,
            balance: balance
          };

          if (isIncome) {
            incomeData.push(entry);
          } else if (isExpense) {
            expenseData.push(entry);
          }
        }
      });
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
        toMonth
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
