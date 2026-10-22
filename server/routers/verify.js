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

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = rows[0];
    if (user.is_verified == 1) {
      conn.release();
      return res.status(400).json({ error: 'Account is already verified. You can log in.' });
    }

    const newCode = generateCode();
    await conn.query('UPDATE users SET verification_code = ? WHERE LOWER(email) = ?', [newCode, normalizedEmail]);
    conn.release();

    try {
      await sendVerificationEmail({
        to: normalizedEmail,
        name: user.full_name || user.username,
        code: newCode
      });
    } catch (mailErr) {
      console.error('❌ Resend Mailer Error:', mailErr);
      return res.status(500).json({ error: 'Failed to deliver email. Please check your address or try again in a few minutes.' });
    }

    // Record attempt for 24h email rate limit
    if (req.recordVerificationAttempt) {
      await req.recordVerificationAttempt();
    }

    return res.json({ message: 'A fresh verification code has been sent to your email.' });
  } catch (error) {
    console.error('❌ Resend Verification Code Error:', error);
    return res.status(500).json({ error: 'Server or database error. Please try again later.' });
  }
}

// 1. POST /api/verify (Verify code OR handle resend fallback if code is omitted / action is resend)
router.post('/', async (req, res, next) => {
  const { email, code, action, resend } = req.body;

  // Fallback support if called for resend on root endpoint
  if (action === 'resend' || resend === true || (!code && email)) {
    return verifyEmail24HourRateLimiter(req, res, () => processResendVerification(req, res));
  }

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE LOWER(email) = ?', [email.trim().toLowerCase()]);

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    if (user.is_verified == 1) {
      conn.release();
      return res.status(400).json({ error: 'User already verified' });
    }

    if (String(user.verification_code).trim() !== String(code).trim()) {
      conn.release();
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await conn.query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE LOWER(email) = ?', [email.trim().toLowerCase()]);
    conn.release();

    res.json({ message: 'Account verified successfully' });

  } catch (error) {
    console.error('❌ Verification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. POST /api/verify/resend (Dedicated endpoint with 24-hr limit and IP rate limiter)
router.post('/resend', verificationIpLimiter, verifyEmail24HourRateLimiter, processResendVerification);

module.exports = router;
