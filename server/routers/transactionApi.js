// Express API for storing transactions with multiple ledger entries
const express = require('express');
const mysql = require('mysql2/promise');
const pool = require('../db');
const router = express.Router();
const cors = require('cors');

// Enable CORS
router.use(cors());

// GET /api/next-transaction-id/:business_id
router.get('/next-transaction-id/:business_id', async (req, res) => {
    const { business_id } = req.params;

    if (!business_id) {
        return res.status(400).json({ error: 'Business ID is required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        
        // Get the maximum frontend_transaction_id for this business
        const [rows] = await conn.execute(
            'SELECT COALESCE(MAX(frontend_transaction_id), 0) as max_id FROM transactions WHERE business_id = ?',
            [business_id]
        );
        
        const nextId = (rows[0].max_id || 0) + 1;
        res.json({ success: true, next_transaction_id: nextId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Function to update account balances
async function updateAccountBalances(conn, business_id) {
    // Get all accounts for this business with their account types
    const [accounts] = await conn.execute(
        `SELECT a.account_id, a.balance, t.type_name, t.type_id
         FROM accounts a
         LEFT JOIN account_types t ON a.type_id = t.type_id
         WHERE a.business_id = ?`,
        [business_id]
    );

    // Update balance for each account
    for (const account of accounts) {
        // Get all transaction entries for this account
        const [entries] = await conn.execute(
            `SELECT te.amount, te.type
             FROM transaction_entries te
             JOIN transactions t ON te.transaction_id = t.transaction_id
             WHERE te.account_id = ? AND t.business_id = ?`,
            [account.account_id, business_id]
        );

        let newBalance = 0;

        // Check if this is an Assets or Expense account (including subtypes)
        const isAssetsAccount = account.type_name === 'Assets' || 
                               account.type_name === 'Fixed Assets' || 
                               account.type_name === 'Current Assets' || 
                               account.type_name === 'Other Assets' ||
                               account.type_id === 3 || // Assets
                               account.type_id === 4 || // Fixed Assets
                               account.type_id === 5 || // Current Assets
                               account.type_id === 11;  // Other Assets

        const isExpenseAccount = account.type_name === 'Expense' || 
                                account.type_name === 'Other Expenses' ||
                                account.type_name === 'Cost Of Goods Sold' ||
                                account.type_id === 2 || // Expense
                                account.type_id === 13 || // Other Expenses
                                account.type_id === 14;   // Cost Of Goods Sold

        if (isAssetsAccount || isExpenseAccount) {
            // For Assets and Expenses: Balance = (add all debits) - (subtract all credits)
            for (const entry of entries) {
                if (entry.type === 'debit') {
                    newBalance += parseFloat(entry.amount);
                } else if (entry.type === 'credit') {
                    newBalance -= parseFloat(entry.amount);
                }
            }
        } else {
            // For other accounts (Income, Liability, Equity): Balance = (add all credits) - (subtract all debits)
            for (const entry of entries) {
                if (entry.type === 'credit') {
                    newBalance += parseFloat(entry.amount);
                } else if (entry.type === 'debit') {
                    newBalance -= parseFloat(entry.amount);
                }
            }
        }

        // Update the account balance
        await conn.execute(
            'UPDATE accounts SET balance = ? WHERE account_id = ?',
            [newBalance, account.account_id]
        );
    }
}

// POST /api/transactions
router.post('/transactions', async (req, res) => {
    const { transaction_id, business_id, description, debit, credit, date, entries } = req.body;

    // Validate input
    if (!business_id || !debit || !credit || !date || !Array.isArray(entries) || entries.length < 2) {
        return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    // Validate that debit and credit totals match
    if (debit !== credit) {
        return res.status(400).json({ error: 'Debit and credit totals must match' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        let insertResult;
        if (transaction_id) {
            // Insert with provided transaction_id
            [insertResult] = await conn.execute(
                'INSERT INTO transactions (frontend_transaction_id, business_id, description, debit, credit, date) VALUES (?, ?, ?, ?, ?, ?)',
                [transaction_id, business_id, description || '', debit, credit, date]
            );
        } else {
            // Insert and let DB auto-generate transaction_id
            [insertResult] = await conn.execute(
                'INSERT INTO transactions (business_id, description, debit, credit, date) VALUES (?, ?, ?, ?, ?)',
                [business_id, description || '', debit, credit, date]
            );
        }

        const new_transaction_id = insertResult.insertId;

        // Insert entries into transaction_entries
        for (const entry of entries) {
            if (!entry.account_id || !entry.amount || !entry.type) {
                await conn.rollback();
                return res.status(400).json({ error: 'Invalid entry in entries' });
            }
            await conn.execute(
                'INSERT INTO transaction_entries (transaction_id, account_id, amount, type) VALUES (?, ?, ?, ?)',
                [new_transaction_id, entry.account_id, entry.amount, entry.type]
            );
        }

        // Update account balances after inserting transaction entries
        await updateAccountBalances(conn, business_id);

        await conn.commit();
        res.json({ success: true, transaction_id: new_transaction_id });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/recalculate-balances/:business_id
router.post('/recalculate-balances/:business_id', async (req, res) => {
    const { business_id } = req.params;

    if (!business_id) {
        return res.status(400).json({ error: 'Business ID is required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Recalculate all account balances for this business
        await updateAccountBalances(conn, business_id);

        await conn.commit();
        res.json({ success: true, message: 'Account balances recalculated successfully' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/account-balances/:business_id
router.get('/account-balances/:business_id', async (req, res) => {
    const { business_id } = req.params;

    if (!business_id) {
        return res.status(400).json({ error: 'Business ID is required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        
        // Get all accounts with their current balances and types
        const [accounts] = await conn.execute(
            `SELECT a.account_id, a.account_name, a.balance, t.type_name, t.type_id
             FROM accounts a
             LEFT JOIN account_types t ON a.type_id = t.type_id
             WHERE a.business_id = ?
             ORDER BY t.type_name, a.account_name`,
            [business_id]
        );

        res.json({ success: true, accounts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;