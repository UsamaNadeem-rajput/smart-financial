const express = require('express');
const router = express.Router();
const pool = require('../db');

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

// PUT /api/accounts/:accountId - Update an existing account
router.put('/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const { account_name, type_id, description } = req.body;

    if (!account_name || !type_id) {
        return res.status(400).json({ success: false, message: 'Account name and type are required' });
    }

    try {
        const [result] = await pool.query(
            "UPDATE accounts SET account_name = ?, type_id = ?, description = ? WHERE account_id = ? AND is_deleted = 0",
            [account_name.trim(), type_id, description || '', accountId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Account not found or already deleted' });
        }

        res.json({ success: true, message: 'Account updated successfully' });
    } catch (err) {
        console.error('Failed to update account:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/accounts/:accountId
router.delete('/:accountId', async (req, res) => {
    const { accountId } = req.params;

    try {
        // Soft delete the account
        const [result] = await pool.query(
            "UPDATE accounts SET is_deleted = 1 WHERE account_id = ? AND is_deleted = 0",
            [accountId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Account not found or already deleted' });
        }

        res.json({ success: true, message: 'Account soft-deleted successfully' });
    } catch (err) {
        console.error('Failed to soft delete account:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
