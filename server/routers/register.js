const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateCode, sendVerificationEmail } = require('../mailer');
const { verifyEmail24HourRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.post('/', verifyEmail24HourRateLimiter, async (req, res) => {
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
    const verificationCode = generateCode();

    const [result] = await conn.query(
      'INSERT INTO users (username, full_name, email, password_hash, is_verified, verification_code) VALUES (?, ?, ?, ?, ?, ?)',
      [username, fullname, email, hashedPassword, 0, verificationCode]
    );

    conn.release();

    // ⚠️ Purana session wala code keep kar raha hoon
    req.session.username = username;
    req.session.userId = result.insertId;

    console.log('✅ Registered');

    // 🔹 Send beautifully formatted verification email with highlighted code
    await sendVerificationEmail({
      to: email,
      name: fullname || username,
      code: verificationCode
    });

    if (req.recordVerificationAttempt) {
      await req.recordVerificationAttempt();
    }

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification code.', username });

  } catch (error) {
    console.error('❌ Registration Error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
