const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();
const nodemailer = require('nodemailer');

// Nodemailer transporter (OrangeHost SMTP)
const transporter = nodemailer.createTransport({
  host: "mail.khushifinances.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@khushifinances.com",
    pass: "Usamark@123" 
  }
});

// Generate 6 digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // 🔹 Send email (new addition)
    await transporter.sendMail({
      from: '"Khushi Finances" <support@khushifinances.com>',
      to: email,
      subject: "Verify your account",
      text: `Your verification code is: ${verificationCode}`
    });

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification code.', username });

  } catch (error) {
    console.error('❌ Registration Error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
