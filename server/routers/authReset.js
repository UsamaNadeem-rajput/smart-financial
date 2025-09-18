// routes/authReset.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();

// --- Mailer config (use env vars in production)
const transporter = nodemailer.createTransport({
  host: "mail.khushifinances.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@khushifinances.com",
    pass: "Usamark@123" 
  }
});

// Reuse your registration code generator pattern
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
}

async function sendResetEmail(to, code, username) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  const html = `
    <p>Hi ${username || ''},</p>
    <p>Your password reset code is: <strong>${code}</strong></p>
    <p>This code is valid for 15 minutes.</p>
    <p>If you did not request this, ignore this email.</p>
    <hr/>
    <small>Or visit: ${frontend}/reset-password</small>
  `;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL || '"Khushi Finances" <support@khushifinances.com>',
    to,
    subject: 'Password reset code',
    html
  });
}

/* POST /api/auth/forgot-password
   Body: { email }
   Response: generic message (do not leak whether email exists)
*/
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, username FROM users WHERE email = ?', [email]);

    // Always return generic message
    if (rows.length === 0) {
      conn.release();
      return res.status(200).json({ message: 'If this email exists, a reset code has been sent.' });
    }

    const user = rows[0];
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await conn.query('UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?', [code, expiry, user.id]);
    conn.release();

    // send email (don't fail the request if mail fails — log instead)
    try {
      await sendResetEmail(email, code, user.username);
    } catch (mailErr) {
      console.error('Reset email send error:', mailErr);
    }

    return res.status(200).json({ message: 'If this email exists, a reset code has been sent.' });
  } catch (err) {
    if (conn) conn.release();
    console.error('Forgot-password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/* POST /api/auth/reset-password
   Body: { email, code, newPassword }
*/
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields required' });

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, reset_code, reset_expires FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'Invalid request' });
    }

    const user = rows[0];

    if (!user.reset_code || !user.reset_expires) {
      conn.release();
      return res.status(400).json({ error: 'No reset requested' });
    }

    // Check expiry
    if (new Date() > new Date(user.reset_expires)) {
      conn.release();
      return res.status(400).json({ error: 'Code expired' });
    }

    if (String(user.reset_code) !== String(code)) {
      conn.release();
      return res.status(400).json({ error: 'Invalid code' });
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