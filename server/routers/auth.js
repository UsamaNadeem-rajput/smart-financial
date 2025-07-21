// routers/auth.js
const express = require('express');
const router = express.Router();

// Logout route (example)
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid'); // or your session cookie name
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
