const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { username, fullname, email, password } = req.body;

  if (!username || !fullname || !email || !password) {
    return res.status(400).json({ error: 'Please fill all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    const [rows1] = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows1.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Username already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO users (username, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [username, fullname, email, hashedPassword]
    );

    conn.release(); // ✅ release first

    req.session.username = username;
    req.session.userId = result.insertId; // ✅ store userId too

    console.log('✅ Registered:', username);
    res.status(201).json({ message: 'User registered successfully', username });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
