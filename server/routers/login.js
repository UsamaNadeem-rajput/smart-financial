const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate inputs
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const conn = await pool.getConnection();

    // 2. Find user by email
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();

    // 3. If not found, return error
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // 4. Compare password using bcrypt
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.username = user.username;

    // 5. Send success response (you can also generate a JWT token here)
    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/session', (req, res) => {
  if (req.session && req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

module.exports = router;
