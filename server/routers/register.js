const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { username, fullname, email, password } = req.body;

  console.log('📝 Registration attempt for:', { username, email, fullname });

  if (!username || !fullname || !email || !password) {
    return res.status(400).json({ error: 'Please fill all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const conn = await pool.getConnection();

    // Check if email already exists
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const [rows1] = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows1.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Username already registered' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO users (username, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [username, fullname, email, hashedPassword]
    );

    console.log('✅ User created successfully:', { username, email, userId: result.insertId });

    // Create session
    req.session.username = username;
    console.log('🔐 Register session created:', req.session.username);

    conn.release();
    res.status(201).json({ message: 'User registered successfully', username });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    
    // Check for specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('email')) {
        return res.status(409).json({ error: 'Email already registered' });
      } else if (error.message.includes('username')) {
        return res.status(409).json({ error: 'Username already registered' });
      }
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;