const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/account-types
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM account_types');
        res.json({ accountTypes: rows });
    } catch (err) {
        console.error('Failed to fetch account types:', err);
        res.status(500).json({ message: 'Failed to fetch account types' });
    }
});

module.exports = router;
