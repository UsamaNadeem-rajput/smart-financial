const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/search-accounts?query=abc
router.get('/', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    try {
        const [rows] = await pool.query(
            "SELECT account_id, account_name FROM accounts WHERE account_name LIKE ? LIMIT 10",
            [`%${query}%`]
        );
        res.json(rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;