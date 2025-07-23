const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/search-accounts?query=abc
router.get('/', async (req, res) => {
    const { query, business_id } = req.query;
    if (!query) return res.json([]);
    let sql = "SELECT account_id, account_name FROM accounts WHERE account_name LIKE ?";
    let params = [`%${query}%`];
    if (business_id) {
        sql += " AND business_id = ?";
        params.push(business_id);
    }
    try {
        const [rows] = await pool.query(sql + " LIMIT 10", params);
        res.json(rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;