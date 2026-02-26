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

        // Fetch deleted businesses
        const [businesses] = await conn.query(
            'SELECT business_id, business_name, industry, business_type FROM businesses WHERE username = ? AND is_deleted = 1',
            [username]
        );

        // Fetch deleted accounts
        const [accounts] = await conn.query(
            `SELECT a.account_id, a.account_name, a.description, a.balance, b.business_name 
       FROM accounts a 
       JOIN businesses b ON a.business_id = b.business_id 
       WHERE b.username = ? AND a.is_deleted = 1`,
            [username]
        );

        // Fetch deleted transactions
        const [transactions] = await conn.query(
            `SELECT t.transaction_id, t.description, t.debit, t.credit, t.date, b.business_name
       FROM transactions t
       JOIN businesses b ON t.business_id = b.business_id
       WHERE b.username = ? AND t.is_deleted = 1`,
            [username]
        );

        conn.release();

        res.status(200).json({
            businesses,
            accounts,
            transactions
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
