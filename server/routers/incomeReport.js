// module.exports = router;
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

    // UPDATED QUERY: Uses SUM() and GROUP BY directly in SQL
    // Filters for Type 1 (Income) and Type 2 (Expense) inside the query
    const [accountRows] = await conn.execute(
      `SELECT 
        a.account_id,
        a.account_name,
        COALESCE(t.type_id, a.type_id) as type_id,
        COALESCE(t.type_name, 'Unknown') as type_name,
        SUM(CASE WHEN te.type = 'debit' THEN te.amount ELSE 0 END) as total_debit,
        SUM(CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END) as total_credit
       FROM transactions tr
       INNER JOIN transaction_entries te ON tr.transaction_id = te.transaction_id
       INNER JOIN accounts a ON te.account_id = a.account_id
       LEFT JOIN account_types t ON a.type_id = t.type_id
       WHERE tr.business_id = ?
         AND DATE(tr.date) >= ?
         AND DATE(tr.date) <= ?
         AND tr.is_deleted = 0
         AND a.is_deleted = 0
         AND (COALESCE(t.type_id, a.type_id) IN (1, 2)) -- Only fetch Income (1) and Expense (2)
       GROUP BY a.account_id, a.account_name, t.type_id, t.type_name, a.type_id
       ORDER BY type_id, a.account_name`,
      [business_id, fromDate, toDateStr]
    );

    // Calculate balances per ledger from SQL results
    const incomeData = [];
    const expenseData = [];

    // Process each aggregated ledger row
    accountRows.forEach(row => {
      const typeId = Number(row.type_id);

      // Strict Mode Logic (Same as original)
      // Only include pure Income (1) and Expense (2) types
      let isIncome = [1].includes(typeId) || ['Income'].includes(row.type_name);
      let isExpense = [2].includes(typeId) || ['Expense'].includes(row.type_name);

      // Fallback Logic (Same as original)
      if (!isIncome && !isExpense) {
        if ([1].includes(typeId)) isIncome = true;
        else if ([2].includes(typeId)) isExpense = true;
      }

      if (!isIncome && !isExpense) return;

      // Get totals directly from SQL columns
      const totalDebits = Number(row.total_debit || 0);
      const totalCredits = Number(row.total_credit || 0);

      if (Math.abs(totalDebits) > 0 || Math.abs(totalCredits) > 0) {
        let balance = 0;
        if (isIncome) {
          balance = totalCredits - totalDebits;
        } else if (isExpense) {
          balance = totalDebits - totalCredits;
        }

        const entry = {
          ledger_id: row.account_id,
          ledger_name: row.account_name,
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
