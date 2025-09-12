const express = require("express");
const passport = require("passport");
const router = express.Router();

// Route to initiate Google OAuth
router.get("/google", (req, res, next) => {
  console.log("Initiating Google OAuth...");
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});

// Google OAuth callback route
router.get("/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: "https://khushifinances.com/login?error=auth_failed" 
  }),
  (req, res) => {
    console.log("Google OAuth callback successful");
    console.log("User:", req.user);
    
    // Successful authentication, redirect to frontend
    res.redirect("https://khushifinances.com/dashboard?auth=success");
  }
);

// Route to check authentication status
router.get("/status", (req, res) => {
  console.log("Auth status check - User:", req.user);
  console.log("Session:", req.session);
  
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