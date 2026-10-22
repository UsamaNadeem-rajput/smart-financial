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

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanFullName = String(fullname).trim();

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Automatically remove expired pending registrations older than 15 minutes
    conn.query('DELETE FROM pending_registrations WHERE expires_at < NOW()').catch(() => {});

    // 1. Check if email is already registered in actual verified users table
    const [existingEmailRows] = await conn.query(
      'SELECT id, is_verified FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (existingEmailRows.length > 0) {
      const existingUser = existingEmailRows[0];
      if (existingUser.is_verified == 1) {
        conn.release();
        return res.status(409).json({ error: 'Email already registered. Please log in.' });
      }
      // If an old legacy record exists with is_verified = 0, remove it so pending registration takes over cleanly
      await conn.query('DELETE FROM users WHERE id = ? AND is_verified = 0', [existingUser.id]);
    }

    // 2. Check if username is already registered in actual users table
    const [existingUserRows] = await conn.query(
      'SELECT id FROM users WHERE LOWER(username) = ?',
      [cleanUsername.toLowerCase()]
    );
    if (existingUserRows.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    // 3. Check if username is currently pending for a different email
    const [pendingUserRows] = await conn.query(
      'SELECT id FROM pending_registrations WHERE LOWER(username) = ? AND LOWER(email) != ?',
      [cleanUsername.toLowerCase(), cleanEmail]
    );
    if (pendingUserRows.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateCode();

    // 4. Save into pending_registrations for 15 minutes (NOT in users table, and NO session login)
    await conn.query(`
      INSERT INTO pending_registrations (username, full_name, email, password_hash, verification_code, expires_at)
      VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        full_name = VALUES(full_name),
        password_hash = VALUES(password_hash),
        verification_code = VALUES(verification_code),
        expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
    `, [cleanUsername, cleanFullName, cleanEmail, hashedPassword, verificationCode]);

    conn.release();

    console.log(`📩 Pending registration created for ${cleanEmail} (code sent, NOT inserted into users yet)`);

    // 5. Send verification email with 6-digit code
    await sendVerificationEmail({
      to: cleanEmail,
      name: cleanFullName || cleanUsername,
      code: verificationCode
    });

    if (req.recordVerificationAttempt) {
      await req.recordVerificationAttempt();
    }

    // Notice: We intentionally DO NOT set req.session.username here.
    // The user will ONLY be logged in and inserted into users once the code is verified!
    return res.status(201).json({
      message: 'Verification code sent to your email. Please enter the code to complete registration.',
      email: cleanEmail
    });

  } catch (error) {
    if (conn) conn.release();
    console.error('❌ Registration Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
