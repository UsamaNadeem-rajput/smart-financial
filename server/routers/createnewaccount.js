const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ensure your db.js exports your MariaDB pool
const { handleOpeningBalance } = require('./transactionApi');

router.post('/', async (req, res) => {
  const { account_name, type_id, description, parent_account_id, business_id, opening_balance_debit, opening_balance_credit } = req.body;

  if (!account_name || !type_id || !business_id) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO accounts
  (account_name, type_id, business_id, description, parent_account_id)
VALUES(?, ?, ?, ?, ?)`,
      [account_name, type_id, business_id, description, parent_account_id || null]
    );

    const newAccountId = result.insertId;

    // Handle Opening Balance
    // Accept explicit debit/credit fields as requested
    const debit = parseFloat(opening_balance_debit) || 0;
    const credit = parseFloat(opening_balance_credit) || 0;

    if (debit > 0) {
      // Log debit opening balance
      await handleOpeningBalance(business_id, newAccountId, debit, 'debit');
    } else if (credit > 0) {
      // Log credit opening balance
      await handleOpeningBalance(business_id, newAccountId, credit, 'credit');
    }

    res.json({
      message: 'Account created successfully',
      accountId: newAccountId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

module.exports = router;
