const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateCode, sendResetEmail } = require('../mailer');
const {
  verifyEmail24HourRateLimiter,
  verificationIpLimiter
} = require('../middleware/rateLimiter');
const router = express.Router();

/* POST /api/authreset/forgot-password
   Body: { email }
   Response: generic message (do not leak whether email exists)
*/
router.post('/forgot-password', verificationIpLimiter, verifyEmail24HourRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT id, username, is_verified FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    // 1. Strictly verify that account exists in database
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'No account found with this email address. Please check your email or create an account.' });
    }

    const user = rows[0];

    // 2. Account must be verified
    if (user.is_verified != 1) {
      conn.release();
      return res.status(400).json({ error: 'This account is not verified yet. Please register or complete verification first.' });
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await conn.query('UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?', [code, expiry, user.id]);
    conn.release();

    try {
      await sendResetEmail({ to: cleanEmail, username: user.username, code });
      if (req.recordVerificationAttempt) {
        await req.recordVerificationAttempt();
      }
    } catch (mailErr) {
      console.error('❌ Reset email send error:', mailErr.message || mailErr);
      return res.status(500).json({ error: 'Failed to deliver reset email. Please try again in a moment.' });
    }

    return res.status(200).json({ message: 'Reset code has been sent to your email. Please check your inbox.' });
  } catch (err) {
    if (conn) conn.release();
    console.error('❌ Forgot-password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/* POST /api/auth/reset-password
   Body: { email, code, newPassword }
*/
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields required' });

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanCode = String(code).trim();

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT id, reset_code, reset_expires FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = rows[0];

    if (!user.reset_code || !user.reset_expires) {
      conn.release();
      return res.status(400).json({ error: 'No reset requested for this account' });
    }

    // Check expiry
    if (new Date() > new Date(user.reset_expires)) {
      conn.release();
      return res.status(400).json({ error: 'Reset code has expired (15-minute limit). Please request a new code.' });
    }

    if (String(user.reset_code).trim() !== cleanCode) {
      conn.release();
      return res.status(400).json({ error: 'Invalid reset code. Please check your email and try again.' });
    }

    // Update password (hash) + clear reset fields
    const hashed = await bcrypt.hash(newPassword, 10);
    await conn.query('UPDATE users SET password_hash = ?, reset_code = NULL, reset_expires = NULL, password_changed_at = NOW() WHERE id = ?', [hashed, user.id]);

    // OPTIONAL: destroy sessions for this user (depends on your session store) — see note below

    conn.release();
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    if (conn) conn.release();
    console.error('Reset-password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;