// Express API for ledger balancing functionality
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

// GET /api/ledger-balancing/:business_id
// Returns per-ledger totals (debits, credits), account metadata, and computed closing balance
router.get('/:business_id', async (req, res) => {
    const { business_id } = req.params;
    if (!business_id) return res.status(400).json({ error: 'Business ID is required' });

    let conn;
    try {
        conn = await pool.getConnection();

        // Aggregate totals per account for the business
        const [rows] = await conn.execute(
            `SELECT 
                a.account_id,
                a.account_name,
                t.type_id,
                t.type_name,
                COALESCE(SUM(CASE WHEN te.type = 'debit'  THEN te.amount ELSE 0 END), 0) AS total_debits,
                COALESCE(SUM(CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END), 0) AS total_credits
             FROM accounts a
             LEFT JOIN account_types t ON a.type_id = t.type_id
             LEFT JOIN transaction_entries te ON te.account_id = a.account_id
             LEFT JOIN transactions tr ON tr.transaction_id = te.transaction_id
             WHERE a.business_id = ?
               AND (tr.business_id = ? OR tr.business_id IS NULL)
             GROUP BY a.account_id, a.account_name, t.type_id, t.type_name
             ORDER BY t.type_name, a.account_name`,
            [business_id, business_id]
        );

        // Compute closing balance based on normal balance by type
        const result = rows.map(r => {
            const isAssets = [3,4,5,11].includes(r.type_id) || ['Assets','Fixed Assets','Current Assets','Other Assets'].includes(r.type_name);
            const isExpense = [2,13,14].includes(r.type_id) || ['Expense','Other Expenses','Cost Of Goods Sold'].includes(r.type_name);
            let closing_balance;
            if (isAssets || isExpense) {
                closing_balance = Number(r.total_debits) - Number(r.total_credits);
            } else {
                closing_balance = Number(r.total_credits) - Number(r.total_debits);
            }
            return { ...r, closing_balance };
        });

        // Totals across all ledgers
        const totals = result.reduce((acc, r) => {
            acc.total_debits += Number(r.total_debits);
            acc.total_credits += Number(r.total_credits);
            return acc;
        }, { total_debits: 0, total_credits: 0 });
        const balanced = Math.abs(totals.total_debits - totals.total_credits) < 0.005;

        res.json({ success: true, ledgers: result, totals: { ...totals, balanced } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/ledger-balancing/:business_id/:account_id
// Returns detail entries for a single ledger with running balance
router.get('/:business_id/:account_id', async (req, res) => {
    const { business_id, account_id } = req.params;
    if (!business_id || !account_id) return res.status(400).json({ error: 'Business ID and Account ID are required' });

    let conn;
    try {
        conn = await pool.getConnection();

        // fetch account type for balance direction
        const [[acct]] = await conn.execute(
            `SELECT a.account_id, a.account_name, t.type_id, t.type_name
             FROM accounts a LEFT JOIN account_types t ON a.type_id = t.type_id
             WHERE a.account_id = ? AND a.business_id = ?`,
            [account_id, business_id]
        );
        if (!acct) return res.status(404).json({ error: 'Account not found' });

        const [entries] = await conn.execute(
            `SELECT tr.transaction_id, tr.date, tr.description,
                    te.amount, te.type,
                    opp_account.account_name as opposite_account_name,
                    opp_account.account_id as opposite_account_id
             FROM transaction_entries te
             JOIN transactions tr ON tr.transaction_id = te.transaction_id
             LEFT JOIN transaction_entries opp_te ON opp_te.transaction_id = tr.transaction_id 
                 AND opp_te.entry_id != te.entry_id
             LEFT JOIN accounts opp_account ON opp_account.account_id = opp_te.account_id
             WHERE tr.business_id = ? AND te.account_id = ?
             ORDER BY tr.date, tr.transaction_id, te.entry_id`,
            [business_id, account_id]
        );

        const isAssets = [3,4,5,11].includes(acct.type_id) || ['Assets','Fixed Assets','Current Assets','Other Assets'].includes(acct.type_name);
        const isExpense = [2,13,14].includes(acct.type_id) || ['Expense','Other Expenses','Cost Of Goods Sold'].includes(acct.type_name);

        let running_balance = 0;
        let total_debits = 0;
        let total_credits = 0;
        const detailed = entries.map(e => {
            if (e.type === 'debit') {
                total_debits += Number(e.amount);
                running_balance += (isAssets || isExpense) ? Number(e.amount) : -Number(e.amount);
            } else {
                total_credits += Number(e.amount);
                running_balance += (isAssets || isExpense) ? -Number(e.amount) : Number(e.amount);
            }
            return { ...e, running_balance };
        });

        const closing_balance = (isAssets || isExpense)
            ? total_debits - total_credits
            : total_credits - total_debits;

        res.json({ success: true, account: acct, totals: { total_debits, total_credits, closing_balance }, entries: detailed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
