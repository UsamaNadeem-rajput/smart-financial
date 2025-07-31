const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/search-accounts?query=abc&business_id=123
router.get('/', async (req, res) => {
    const { query, business_id } = req.query;
    if (!query) return res.json([]);
    
    try {
        let sql = "SELECT account_id, account_name, balance FROM accounts WHERE account_name LIKE ?";
        let params = [`%${query}%`];
        
        // Add business_id filter if provided
        if (business_id) {
            sql += " AND business_id = ?";
            params.push(business_id);
        }
        
        sql += " ORDER BY account_name LIMIT 10";
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;