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

        await conn.commit();
        res.json({ success: true, transaction_id: new_transaction_id });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;