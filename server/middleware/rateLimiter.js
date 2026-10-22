const { rateLimit } = require('express-rate-limit');
const pool = require('../db');

/**
 * In-memory sliding window store for 24-hour email verification code tracking
 * Key: lowercase email string
 * Value: array of epoch timestamps [number, number, ...]
 */
const emailVerificationTimestamps = new Map();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_VERIFICATION_PER_24H = 3;

/**
 * Clean up expired timestamps older than 24 hours
 */
function cleanupExpiredTimestamps(email) {
  const now = Date.now();
  const timestamps = emailVerificationTimestamps.get(email) || [];
  const valid = timestamps.filter((t) => now - t < ONE_DAY_MS);
  if (valid.length === 0) {
    emailVerificationTimestamps.delete(email);
    return [];
  }
  emailVerificationTimestamps.set(email, valid);
  return valid;
}

/**
 * Check if an email has exceeded the 3-codes-per-24h limit
 */
async function checkEmailVerificationLimit(rawEmail) {
  if (!rawEmail) return { allowed: true, remaining: MAX_VERIFICATION_PER_24H };

  const email = rawEmail.toLowerCase().trim();
  const validTimestamps = cleanupExpiredTimestamps(email);

  // Check in-memory store first
  if (validTimestamps.length >= MAX_VERIFICATION_PER_24H) {
    const oldest = validTimestamps[0];
    const resetTime = oldest + ONE_DAY_MS;
    const hoursRemaining = Math.max(1, Math.ceil((resetTime - Date.now()) / (60 * 60 * 1000)));

    return {
      allowed: false,
      remaining: 0,
      hoursRemaining,
      resetTime
    };
  }

  // Also query MySQL if database is connected
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count, MIN(requested_at) as oldest FROM (
         SELECT requested_at FROM verification_code_requests 
         WHERE email = ? AND requested_at > NOW() - INTERVAL 24 HOUR
       ) as recent`,
      [email]
    );

    if (rows && rows[0] && rows[0].count >= MAX_VERIFICATION_PER_24H) {
      const dbOldest = new Date(rows[0].oldest).getTime();
      const resetTime = dbOldest + ONE_DAY_MS;
      const hoursRemaining = Math.max(1, Math.ceil((resetTime - Date.now()) / (60 * 60 * 1000)));
      return {
        allowed: false,
        remaining: 0,
        hoursRemaining,
        resetTime
      };
    }
  } catch (dbErr) {
    // If table doesn't exist yet, gracefully fall back to in-memory tracking
  }

  return {
    allowed: true,
    remaining: MAX_VERIFICATION_PER_24H - validTimestamps.length
  };
}

/**
 * Record a verification code request for an email
 */
async function recordEmailVerificationAttempt(rawEmail) {
  if (!rawEmail) return;
  const email = rawEmail.toLowerCase().trim();
  const now = Date.now();

  const current = emailVerificationTimestamps.get(email) || [];
  current.push(now);
  emailVerificationTimestamps.set(email, current);

  // Also record in database if table is available
  try {
    await pool.query(
      `INSERT INTO verification_code_requests (email, requested_at) VALUES (?, NOW())`,
      [email]
    );
  } catch (dbErr) {
    // Attempt to auto-create table if missing
    if (dbErr.code === 'ER_NO_SUCH_TABLE') {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS verification_code_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_time (email, requested_at)
          )
        `);
        await pool.query(
          `INSERT INTO verification_code_requests (email, requested_at) VALUES (?, NOW())`,
          [email]
        );
      } catch (createErr) {
        // Table creation fallback handled silently
      }
    }
  }
}

/**
 * Middleware: Enforces 3 verification codes per 24 hours per email
 */
async function verifyEmail24HourRateLimiter(req, res, next) {
  const email = (req.body?.email || req.query?.email || '').toLowerCase().trim();

  if (!email) {
    return next(); // Let endpoint validation handle missing email
  }

  const check = await checkEmailVerificationLimit(email);

  if (!check.allowed) {
    return res.status(429).json({
      error: `Limit reached: You can only request up to ${MAX_VERIFICATION_PER_24H} verification codes per email in a 24-hour period. Please check your spam folder or try again in ${check.hoursRemaining} hour(s).`,
      hoursRemaining: check.hoursRemaining,
      resetTime: check.resetTime
    });
  }

  // Attach record helper to req so route can record after successful mail delivery
  req.recordVerificationAttempt = () => recordEmailVerificationAttempt(email);
  next();
}

/**
 * 1. Global Rate Limiter: Applied to all /api/* requests
 * 300 requests per 15 minutes per IP
 */
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    error: 'Too many requests from this IP address. Please slow down and try again after 15 minutes.'
  }
});

/**
 * 2. Auth Rate Limiter: Applied to /api/login, /api/register, /api/authreset/*
 * 15 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    error: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

/**
 * 3. Form Submission Limiter: Applied to create business, create account, transactions, contact
 * 40 submissions per 5 minutes per IP
 */
const formLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    error: 'Too many form submissions in a short period. Please wait a few minutes before submitting again.'
  }
});

/**
 * 4. Verification Code Request IP Limiter
 * 5 requests per 15 minutes per IP
 */
const verificationIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    error: 'Too many verification requests from this network. Please wait 15 minutes before trying again.'
  }
});

module.exports = {
  globalApiLimiter,
  authLimiter,
  formLimiter,
  verificationIpLimiter,
  verifyEmail24HourRateLimiter,
  checkEmailVerificationLimit,
  recordEmailVerificationAttempt
};
