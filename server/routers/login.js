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

    // 5. Set session with username
    req.session.username = user.username;
    console.log('Session set in login:', req.session);

    // 6. Send success response
    res.status(200).json({ message: 'Login successful', username: user.username });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/session', (req, res) => {
  console.log('Session check:', req.session);
  if (req.session && req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

module.exports = router;