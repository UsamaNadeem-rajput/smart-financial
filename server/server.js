// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

/* ---------- Trust proxy for Railway ---------- */
app.set('trust proxy', 1); // ✅ Required for secure cookies to work on Railway

/* ---------- Session store ---------- */
const sessionStore = new MySQLStore({ schema: { tableName: 'sessions' } }, pool);

/* ---------- CORS + JSON ---------- */
app.use(
  cors({
    origin: 'https://smart-financial.netlify.app', // ✅ Your frontend
    credentials: true,
  })
);
app.use(express.json());

// Prevent caching on protected routes
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
/* ---------- Session ---------- */
app.use(
  session({
    key: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,         // ✅ Must be true for production HTTPS
      sameSite: 'none',     // ✅ Must be 'none' for cross-origin
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* ---------- Logging ---------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

/* ---------- Health & Test ---------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running', timestamp: new Date().toISOString() });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'ERROR' });
  }
});

/* ---------- Routes ---------- */
app.use('/api/register', require('./routers/register'));
app.use('/api/login', require('./routers/login'));
app.use('/api/business', require('./routers/business'));
app.use('/api/showbusinesses', require('./routers/showbusinesses'));
app.use('/api/createnewaccount', require('./routers/createnewaccount'));
app.use('/api/accounts-list', require('./routers/list'));
app.use('/api/search-accounts', require('./routers/searchAccounts'));
app.use('/api', require('./routers/transactionApi'));
app.use('/api', require('./routers/showtransactions'));
app.use('/api/auth', require('./routers/auth')); // ✅ Mounted under /api

/* ---------- Fallback ---------- */
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

app.listen(PORT, () => console.log(`✅ Server running on :${PORT}`));
