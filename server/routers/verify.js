const express = require('express');
const pool = require('../db');
const { generateCode, sendVerificationEmail } = require('../mailer');
const {
  verifyEmail24HourRateLimiter,
  verificationIpLimiter
} = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * Core handler to process verification code resend
 */
async function processResendVerification(req, res) {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required to resend verification code' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Check pending_registrations first
    const [pendingRows] = await conn.query(
      'SELECT * FROM pending_registrations WHERE LOWER(email) = ?',
      [normalizedEmail]
    );

    if (pendingRows.length > 0) {
      const pending = pendingRows[0];
      const newCode = generateCode();

      await conn.query(
        'UPDATE pending_registrations SET verification_code = ?, expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
        [newCode, pending.id]
      );
      conn.release();

      try {
        await sendVerificationEmail({
          to: normalizedEmail,
          name: pending.full_name || pending.username,
          code: newCode
        });
      } catch (mailErr) {
        console.error('❌ Resend Mailer Error:', mailErr.message || mailErr);
        return res.status(500).json({ error: 'Failed to deliver email. Please try again in a moment.' });
      }

      if (req.recordVerificationAttempt) {
        await req.recordVerificationAttempt();
      }

      return res.json({ message: 'A fresh verification code has been sent to your email.' });
    }

    // 2. Check users table
    const [rows] = await conn.query('SELECT id, is_verified FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (rows.length > 0 && rows[0].is_verified == 1) {
      conn.release();
      return res.status(400).json({ error: 'Account is already verified. You can log in.' });
    }

    conn.release();
    return res.status(404).json({ error: 'No pending registration found with this email address. Please register first.' });
  } catch (error) {
    if (conn) conn.release();
    console.error('❌ Resend Verification Code Error:', error);
    return res.status(500).json({ error: 'Server or database error. Please try again later.' });
  }
}

// 1. POST /api/verify (Verify code OR handle resend fallback if code is omitted / action is resend)
router.post('/', async (req, res) => {
  const { email, code, action, resend } = req.body;

  // Fallback support if called for resend on root endpoint
  if (action === 'resend' || resend === true || (!code && email)) {
    return verifyEmail24HourRateLimiter(req, res, () => processResendVerification(req, res));
  }

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanCode = String(code).trim();

  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Check pending_registrations table first (user not yet in users table)
    const [pendingRows] = await conn.query(
      'SELECT * FROM pending_registrations WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (pendingRows.length > 0) {
      const pending = pendingRows[0];

      // Check if registration code has expired (past 15 minutes)
      if (pending.expires_at && new Date(pending.expires_at) < new Date()) {
        await conn.query('DELETE FROM pending_registrations WHERE id = ?', [pending.id]);
        conn.release();
        return res.status(400).json({ error: 'Verification code has expired (15-minute limit). Please request a new code or register again.' });
      }

      if (String(pending.verification_code).trim() !== cleanCode) {
        conn.release();
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Check if username collision occurred in users table in the meantime
      const [taken] = await conn.query(
        'SELECT id FROM users WHERE LOWER(username) = ?',
        [pending.username.toLowerCase()]
      );
      let finalUsername = pending.username;
      if (taken.length > 0) {
        finalUsername = `${pending.username}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // ✅ NOW and ONLY NOW insert the verified user into the official users table
      const [insertResult] = await conn.query(
        `INSERT INTO users (username, full_name, email, password_hash, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [finalUsername, pending.full_name, pending.email, pending.password_hash]
      );

      // Clean up from pending_registrations
      await conn.query('DELETE FROM pending_registrations WHERE id = ?', [pending.id]);
      conn.release();

      // ✅ Establish authenticated login session now that verification passed
      req.session.username = finalUsername;
      req.session.userId = insertResult.insertId;
      await new Promise((resolve) => req.session.save(resolve));

      console.log(`🎉 User ${finalUsername} (${cleanEmail}) verified and officially inserted into users table!`);

      return res.status(200).json({
        message: 'Account verified and registered successfully!',
        username: finalUsername
      });
    }

    // 2. Check users table
    const [rows] = await conn.query('SELECT id, username, is_verified FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (rows.length > 0 && rows[0].is_verified == 1) {
      conn.release();
      return res.status(400).json({ error: 'User is already verified. Please log in.' });
    }

    conn.release();
    return res.status(404).json({ error: 'No pending registration found for this email. Please register first.' });

  } catch (error) {
    if (conn) conn.release();
    console.error('❌ Verification Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. POST /api/verify/resend (Dedicated endpoint with 24-hr limit and IP rate limiter)
router.post('/resend', verificationIpLimiter, verifyEmail24HourRateLimiter, processResendVerification);

module.exports = router;
