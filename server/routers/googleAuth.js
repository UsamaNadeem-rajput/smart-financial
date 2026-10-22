const express = require("express");
const passport = require("passport");
const router = express.Router();

// Route to initiate Google OAuth
router.get("/google", (req, res, next) => {
  console.log("Initiating Google OAuth...");
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account" // Always prompt user to select account or switch accounts
  })(req, res, next);
});

// Google OAuth callback route
router.get("/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: "https://khushifinances.com/login?error=auth_failed" 
  }),
  (req, res) => {
    console.log("Google OAuth callback successful");
    // user is now in req.user (existing or brand-new)
    if (req.user) {
      req.session.username = req.user.username || req.user.full_name || req.user.email;
      req.session.userId = req.user.id;
    }
    
    // Explicitly save session before redirecting to prevent race condition with MySQL session store
    req.session.save((err) => {
      if (err) {
        console.error("Session save error on Google OAuth callback:", err);
      }
      const username = req.session?.username || req.user?.username || "";
      const frontendUrl = process.env.FRONTEND_URL || "https://khushifinances.com";
      res.redirect(`${frontendUrl}/list?username=${encodeURIComponent(username)}`);
    });
  }
);

// Route to check authentication status
router.get("/status", (req, res) => {
  console.log("Auth status check");
  
  if (req.user) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        email: req.user.email,
        provider: req.user.provider,
        is_verified: req.user.is_verified
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Session cleanup failed" });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;