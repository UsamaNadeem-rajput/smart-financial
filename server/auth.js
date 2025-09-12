const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://server.khushifinances.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile);
        
        // Check if user already exists
        const [existingUser] = await pool.query(
          "SELECT * FROM users WHERE email = ? OR (provider = 'google' AND email = ?)",
          [profile.emails[0].value, profile.emails[0].value]
        );

        if (existingUser.length > 0) {
          // User exists, update provider if needed
          const user = existingUser[0];
          
          if (user.provider === 'local') {
            // Update to allow both local and google login
            await pool.query(
              "UPDATE users SET provider = 'google' WHERE id = ?",
              [user.id]
            );
          }
          
          console.log("Existing user found:", user);
          return done(null, user);
        }

        // Create new user
        const username = profile.emails[0].value.split('@')[0]; // Use email prefix as username
        const fullName = profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`;
        
        const [result] = await pool.query(
          `INSERT INTO users (username, full_name, email, provider, is_verified, created_at, updated_at) 
           VALUES (?, ?, ?, 'google', 1, NOW(), NOW())`,
          [username, fullName, profile.emails[0].value]
        );

        const newUser = {
          id: result.insertId,
          username: username,
          full_name: fullName,
          email: profile.emails[0].value,
          provider: 'google',
          is_verified: 1
        };

        console.log("New user created:", newUser);
        return done(null, newUser);

      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (user.length > 0) {
      console.log("Deserializing user:", user[0]);
      done(null, user[0]);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error, null);
  }
});