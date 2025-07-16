const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ensure your db.js exports your MariaDB pool

router.post('/', async (req, res) => {
    const { account_name, type_id, description, parent_account_id, business_id } = req.body;

    if (!account_name || !type_id || !business_id) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    try {
    const [result] = await pool.query(
      `INSERT INTO accounts 
       (account_name, type_id, business_id, description, parent_account_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [account_name, type_id, business_id, description, parent_account_id || null]
    );
    res.json({ 
      message: 'Account created successfully',
      accountId: result.insertId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

module.exports = router;
