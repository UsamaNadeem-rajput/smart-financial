const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db");

const router = express.Router();

// ✅ Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const fullname = profile.displayName;
        const googleId = profile.id;

        const conn = await pool.getConnection();

        // Check if user already exists
        const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);

        let user;
        if (rows.length > 0) {
          user = rows[0];
        } else {
          // Create new user without password
          const [result] = await conn.query(
            "INSERT INTO users (username, full_name, email, provider, is_verified) VALUES (?, ?, ?, ?, ?)",
            [googleId, fullname, email, "google", 1]
          );
          user = { id: result.insertId, username: googleId, full_name: fullname, email };
        }

        conn.release();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ✅ Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// ✅ Google login route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// ✅ Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "https://khushifinances.com/login" }),
  (req, res) => {
    // Successful login → redirect frontend
    res.redirect("https://khushifinances.com/business");
  }
);

// ✅ Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("https://khushifinances.com");
  });
});

module.exports = router;
