/****************************************************
 *  0.  Raw Google OAuth logger
 ****************************************************/
// Minimal process-level handlers (no verbose dumps)
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION');
});
process.on('unhandledRejection', () => {
  console.error('UNHANDLED REJECTION');
});
const OAuth2 = require('oauth').OAuth2;
const originalExecute = OAuth2.prototype._executeRequest;
OAuth2.prototype._executeRequest = function (httpMethod, options, postBody, callback) {
  console.log('>>> OAuth2 request:', options.host + options.path);
  if (postBody) console.log('>>> postBody:', postBody);

  const originalCb = callback;
  callback = function (err, body, res) {
    console.log('<<< Google response status:', res?.statusCode);
    console.log('<<< Google response body:', body || err?.data || err);
    originalCb(err, body, res);
  };
  originalExecute.call(this, httpMethod, options, postBody, callback);
};

/****************************************************
 *  1.  Imports
 ****************************************************/
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

/****************************************************
 *  2.  Google Strategy (space removed)
 ****************************************************/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://server.khushifinances.com/api/auth/google/callback", // <-- NO SPACE
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth: profile received");

        // look-up user
        const [rows] = await pool.query(
          "SELECT * FROM users WHERE email = ?",
          [profile.emails[0].value]
        );

        if (rows.length) {
          console.log("Google OAuth: existing user");
          return done(null, rows[0]);
        }

        // create user
        const username = profile.emails[0].value.split('@')[0];
        const fullName = profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`;

        const [res] = await pool.query(
          `INSERT INTO users (username, full_name, email, provider, is_verified, created_at, updated_at)
           VALUES (?, ?, ?, 'google', 1, NOW(), NOW())`,
          [username, fullName, profile.emails[0].value]
        );

        const newUser = {
          id: res.insertId,
          username,
          full_name: fullName,
          email: profile.emails[0].value,
          provider: 'google',
          is_verified: 1
        };
        console.log("Google OAuth: new user created");
        return done(null, newUser);

      } catch (err) {
        console.error("Google OAuth error");
        return done(err, null);
      }
    }
  )
);

/****************************************************
 *  3.  Session serialisation (unchanged)
 ****************************************************/
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) return done(null, false); // silently kill ghost session
    done(null, rows[0]);
  } catch (e) {
    done(e);
  }
});