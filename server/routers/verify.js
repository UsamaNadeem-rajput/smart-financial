const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    if (user.is_verified) {
      conn.release();
      return res.status(400).json({ error: 'User already verified' });
    }

    if (user.verification_code !== code) {
      conn.release();
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await conn.query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?', [email]);
    conn.release();

    res.json({ message: 'Account verified successfully' });

  } catch (error) {
    console.error('❌ Verification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
