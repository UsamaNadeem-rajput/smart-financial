// routers/auth.js
const express = require('express');
const router = express.Router();

// Logout route (example)
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed");
    res.clearCookie('connect.sid', { path: '/' }); // important!
    res.status(200).send("Logged out");
  });
});

module.exports = router;