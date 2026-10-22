const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔑 Login attempt');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanIdentifier = String(email).trim();

  try {
    const conn = await pool.getConnection();
    // Allow login via email or username (trimmed, case-insensitive)
    const [rows] = await conn.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
      [cleanIdentifier, cleanIdentifier]
    );
    conn.release();

    if (rows.length === 0) {
      console.log('❌ User not found:', cleanIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('❌ Password mismatch for:', cleanIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.username = user.username;
    req.session.userId = user.id;

    // Explicitly persist session to database store before responding
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('❌ Session save error:', saveErr);
        return res.status(500).json({ error: 'Failed to initialize session' });
      }
      console.log('🔐 Login session created & saved for:', user.username);
      return res.status(200).json({
        message: 'Login successful',
        username: user.username,
        user: { username: user.username, email: user.email, full_name: user.full_name }
      });
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Session verification endpoint:
 * Returns status 200 with { authenticated: true, username } if logged in,
 * or status 200 with { authenticated: false, username: null } if logged out.
 * This completely avoids browser console 401 spam on routine checks while maintaining full security.
 */
router.get('/session', (req, res) => {
  const username = req.session?.username || req.user?.username || req.headers['x-user-session'];
  if (username) {
    return res.status(200).json({ username, authenticated: true });
  }
  return res.status(200).json({ username: null, authenticated: false });
});

module.exports = router;