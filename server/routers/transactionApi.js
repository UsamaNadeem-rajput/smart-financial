// Express API for storing transactions with multiple ledger entries
const express = require('express');
const mysql = require('mysql2/promise');
const pool = require('../db');
const router = express.Router();
const cors = require('cors');

// Enable CORS
router.use(cors());

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
                'INSERT INTO transactions (id_from_front_end, business_id, description, debit, credit, date) VALUES (?, ?, ?, ?, ?, ?)',
                [transaction_id, business_id, description || '', debit, credit, date]
            );
        } else {
            // Insert and let DB auto-generate transaction_id
            [insertResult] = await conn.execute(
                'INSERT INTO transactions (business_id, description, debit, credit, date) VALUES (?, ?, ?, ?, ?)',
                [business_id, description || '', debit, credit, date]
            );
        }

        const new_transaction_id = transaction_id || insertResult.insertId;

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