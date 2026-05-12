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

// GET /api/income-report/:business_id
router.get('/:business_id', async (req, res) => {
  const { business_id } = req.params;
  const { fromMonth, toMonth, onDate, fromDate: fromDateQuery, toDate: toDateQuery } = req.query;

  if (!business_id) {
    return res.status(400).json({ error: 'Business ID is required' });
  }

  // Date Logic validation
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

  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Fetch Main Ledgers (Income:1, Expense:2, COGS:14) within Date Range
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
         AND (COALESCE(t.type_id, a.type_id) IN (1, 2, 14))
       GROUP BY a.account_id, a.account_name, t.type_id, t.type_name, a.type_id
       ORDER BY type_id, a.account_name`,
      [business_id, fromDate, toDateStr]
    );

    // 2. Fetch OPENING Inventory (< fromDate)
    const [openingInvRows] = await conn.execute(
      `SELECT COALESCE(SUM(
        CASE WHEN te.type = 'debit' THEN te.amount ELSE 0 END -
        CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END
      ), 0) as balance
       FROM transactions tr
       INNER JOIN transaction_entries te ON tr.transaction_id = te.transaction_id
       INNER JOIN accounts a ON te.account_id = a.account_id
       WHERE tr.business_id = ?
         AND DATE(tr.date) < ?
         AND tr.is_deleted = 0
         AND a.is_deleted = 0
         AND LOWER(a.account_name) LIKE '%inventory%'`,
      [business_id, fromDate]
    );
    const openingInventory = Number(openingInvRows[0]?.balance || 0);

    // 3. Fetch CLOSING Inventory (<= toDateStr)
    const [closingInvRows] = await conn.execute(
      `SELECT COALESCE(SUM(
        CASE WHEN te.type = 'debit' THEN te.amount ELSE 0 END -
        CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END
      ), 0) as balance
       FROM transactions tr
       INNER JOIN transaction_entries te ON tr.transaction_id = te.transaction_id
       INNER JOIN accounts a ON te.account_id = a.account_id
       WHERE tr.business_id = ?
         AND DATE(tr.date) <= ?
         AND tr.is_deleted = 0
         AND a.is_deleted = 0
         AND LOWER(a.account_name) LIKE '%inventory%'`,
      [business_id, toDateStr]
    );
    const closingInventory = Number(closingInvRows[0]?.balance || 0);

    // Categories Arrays
    const incomeData = [];
    const expenseData = [];
    const cogsData = [];

    // 4. Process Each Ledger (STRICT PROFESSIONAL RULE - NO Math.abs)
    accountRows.forEach(row => {
      const typeId = Number(row.type_id);

      let isIncome = [1].includes(typeId) || ['Income'].includes(row.type_name);
      let isExpense = [2].includes(typeId) || ['Expense'].includes(row.type_name);
      let isCOGS = [14].includes(typeId) || ['Cost Of Goods Sold'].includes(row.type_name);

      if (!isIncome && !isExpense && !isCOGS) return;

      const totalDebits = Number(row.total_debit || 0);
      const totalCredits = Number(row.total_credit || 0);

      // Sirf wo ledgers push karein jin mein koi activity hui ho
      if (totalDebits > 0 || totalCredits > 0) {

        let balance = 0;

        // STRICT ACCOUNTING LOGIC
        if (isIncome) {
          balance = totalCredits - totalDebits; // Income Rule
        } else if (isExpense || isCOGS) {
          balance = totalDebits - totalCredits; // Expense & COGS Rule
        }

        const entry = {
          ledger_id: row.account_id,
          ledger_name: row.account_name,
          balance: balance // Agar user ne galat entry ki hogi, to ye balance Negative (-) mein jayega
        };

        if (isIncome) incomeData.push(entry);
        else if (isExpense) expenseData.push(entry);
        else if (isCOGS) cogsData.push(entry);
      }
    });

    // 5. Calculate Totals (Sub-totals)
    const incomeTotal = incomeData.reduce((sum, entry) => sum + entry.balance, 0);
    const expenseTotal = expenseData.reduce((sum, entry) => sum + entry.balance, 0);
    const totalPurchases = cogsData.reduce((sum, entry) => sum + entry.balance, 0);

    // 6. THE SMART COGS SWITCH (Perpetual vs Periodic Logic)
    // Check kar raha hai ke kya user ne specifically "Cost Of Goods Sold" naam ka koi ledger banaya hai
    const hasDirectCOGSLedger = cogsData.some(entry =>
      entry.ledger_name.trim().toLowerCase() === 'cost of goods sold'
    );

    let calculatedCOGS = 0;
    let finalOpeningInventory = openingInventory;
    let finalClosingInventory = closingInventory;

    if (hasDirectCOGSLedger) {
      // PERPETUAL SYSTEM (Bypass inventory formula)
      calculatedCOGS = totalPurchases;
      // UI ke visual math ko theek rakhne ke liye inventory ko zero bheja ja raha hai
      finalOpeningInventory = 0;
      finalClosingInventory = 0;
    } else {
      // PERIODIC SYSTEM (Apply standard formula)
      calculatedCOGS = openingInventory + totalPurchases - closingInventory;
    }

    // 7. Final Profit Calculations
    const grossProfit = incomeTotal - calculatedCOGS;
    const netProfitLoss = grossProfit - expenseTotal;

    res.json({
      success: true,
      income: incomeData,
      expense: expenseData,
      totals: {
        income: incomeTotal,
        expense: expenseTotal,
        netProfitLoss: netProfitLoss
      },
      merchandisingData: {
        openingInventory: finalOpeningInventory,
        closingInventory: finalClosingInventory,
        cogsData,
        totalPurchases,
        calculatedCOGS,
        grossProfit
      },
      dateRange: {
        fromDate,
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