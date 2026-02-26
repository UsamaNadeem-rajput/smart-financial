const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    const username = req.session?.username || req.user?.username;
    if (!username) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT id, username, full_name, email, provider FROM users WHERE username = ?', [username]);
        conn.release();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
