// Express API for storing transactions with multiple ledger entries
const express = require('express');
const mysql = require('mysql2/promise');
const pool = require('../db');
const { formLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

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
         WHERE a.business_id = ? AND a.is_deleted = 0`,
        [business_id]
    );

    // Update balance for each account
    for (const account of accounts) {
        // Get all transaction entries for this account
        const [entries] = await conn.execute(
            `SELECT te.amount, te.type
             FROM transaction_entries te
             JOIN transactions t ON te.transaction_id = t.transaction_id
             WHERE te.account_id = ? AND t.business_id = ? AND t.is_deleted = 0`,
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

/**
 * Core function to create a transaction.
 * Can be reused by other backend logic.
 * @param {Object} conn - Active database connection (must be inside a transaction if caller handles it, or stand-alone)
 * @param {Object} data - { transaction_id (optional), business_id, description, debit, credit, date, entries }
 */
async function createTransactionCore(conn, data) {
    const { transaction_id, business_id, description, debit, credit, date, entries } = data;

    // Validate input (Basic validation, caller should ensure deeper validation)
    if (!business_id || !debit || !credit || !date || !Array.isArray(entries) || entries.length < 2) {
        throw new Error('Missing or invalid fields');
    }

    if (parseFloat(debit) !== parseFloat(credit)) {
        throw new Error('Debit and credit totals must match');
    }

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
            throw new Error('Invalid entry in entries');
        }
        await conn.execute(
            'INSERT INTO transaction_entries (transaction_id, account_id, amount, type) VALUES (?, ?, ?, ?)',
            [new_transaction_id, entry.account_id, entry.amount, entry.type]
        );
    }

    // Update account balances after inserting transaction entries
    await updateAccountBalances(conn, business_id);

    return new_transaction_id;
}


/**
 * Handles the creation of an opening balance transaction.
 * @param {number} business_id 
 * @param {number} ledger_id - The ID of the newly created ledger
 * @param {number} amount 
 * @param {string} type - 'debit' or 'credit'
 * @param {string} date - Transaction date
 */
async function handleOpeningBalance(business_id, ledger_id, amount, type, date = new Date()) {
    if (!amount || amount <= 0 || !['debit', 'credit'].includes(type)) {
        return; // Nothing to do
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Check/Create "Opening Balance Equity" ledger
        const equityLedgerName = 'Opening Balance Equity';
        const [existingEquity] = await conn.execute(
            'SELECT account_id FROM accounts WHERE business_id = ? AND account_name = ? AND is_deleted = 0',
            [business_id, equityLedgerName]
        );

        let equityLedgerId;

        if (existingEquity.length > 0) {
            equityLedgerId = existingEquity[0].account_id;
        } else {
            // Create it. Type ID 9 is Equity.
            const [createResult] = await conn.execute(
                'INSERT INTO accounts (account_name, type_id, business_id, description) VALUES (?, ?, ?, ?)',
                [equityLedgerName, 9, business_id, 'System generated account for opening balances']
            );
            equityLedgerId = createResult.insertId;
        }

        // 1.5 Get Next Transaction ID
        const [idRows] = await conn.execute(
            'SELECT COALESCE(MAX(frontend_transaction_id), 0) as max_id FROM transactions WHERE business_id = ?',
            [business_id]
        );
        const nextId = (idRows[0].max_id || 0) + 1;

        // 2. Prepare Transaction
        // If User Ledger is Dr, Equity is Cr. And vice versa.
        const userEntryType = type; // 'debit' or 'credit'
        const equityEntryType = type === 'debit' ? 'credit' : 'debit';

        const transactionData = {
            transaction_id: nextId, // Assign the frontend transaction ID
            business_id,
            description: 'Opening Balance Transaction',
            debit: amount,
            credit: amount,
            date: date,
            entries: [
                { account_id: ledger_id, amount: amount, type: userEntryType },
                { account_id: equityLedgerId, amount: amount, type: equityEntryType }
            ]
        };

        // 3. Execute
        await createTransactionCore(conn, transactionData);

        await conn.commit();
        console.log(`Opening balance processed for ledger ${ledger_id} with Transaction ID ${nextId}`);
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error handling opening balance:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}


// POST /api/transactions
router.post('/transactions', formLimiter, async (req, res) => {
    const transactionData = req.body;

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const new_transaction_id = await createTransactionCore(conn, transactionData);

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
             WHERE a.business_id = ? AND a.is_deleted = 0
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

// Attach helper functions to the router for external use
router.handleOpeningBalance = handleOpeningBalance;
router.createTransactionCore = createTransactionCore;

module.exports = router;