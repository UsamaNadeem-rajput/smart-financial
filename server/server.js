#!/usr/bin/env node
/* --------------------------------------------------
   0.  Passenger-proof CA injection
-------------------------------------------------- */
const fs = require('fs');
const caPath = '/etc/pki/tls/certs/ca-bundle.crt';

try {
  const caBundle = fs.readFileSync(caPath, 'utf8');
  const https = require('https');
  https.globalAgent.options.ca = caBundle.split('-----END CERTIFICATE-----')
    .filter(Boolean)
    .map(cert => cert + '-----END CERTIFICATE-----\n');
  console.log('✅ CA bundle loaded, certs:', https.globalAgent.options.ca.length);
} catch (e) {
  console.error('❌ Could not load CA bundle:', e.message);
  process.exit(1);          // refuse to start
}

require('dotenv').config();
require('./auth');               // passport Google strategy
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;



/* ---------- Trust proxy for OrangeHost ---------- */
app.set('trust proxy', 1);

/* ---------- Session store ---------- */
const sessionStore = new MySQLStore({ schema: { tableName: 'sessions' } }, pool);


/* ---------- CORS + JSON ---------- */
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://khushifinances.com'
    ],
    credentials: true,
  })
);
app.use(express.json());

// Prevent caching on protected routes
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/logoupload', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('logoupload'));

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
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());


/* ---------- Logging ---------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// ✅ CREATE A ROUTER FOR ALL SERVER ROUTES
const serverRouter = express.Router();

/* ---------- Health & Test routes ---------- */
serverRouter.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running', timestamp: new Date().toISOString() });
});

serverRouter.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'ERROR' });
  }
});

/* ---------- API Routes ---------- */
serverRouter.use('/api/register', require('./routers/register'));
serverRouter.use('/api/login', require('./routers/login'));
serverRouter.use('/api/business', require('./routers/business'));
serverRouter.use('/api/showbusinesses', require('./routers/showbusinesses'));
serverRouter.use('/api/createnewaccount', require('./routers/createnewaccount'));
serverRouter.use('/api/accounts-list', require('./routers/list'));
serverRouter.use('/api/account-types', require('./routers/accountTypes'));

serverRouter.use('/api/search-accounts', require('./routers/searchAccounts'));
serverRouter.use('/api', require('./routers/transactionApi'));
serverRouter.use('/api', require('./routers/showtransactions'));
serverRouter.use('/api/auth', require('./routers/auth'));

serverRouter.use('/api/ledger-balancing', require('./routers/ledgerBalancing'));
// serverRouter.use('/api/contact', require('./routers/contact'));
serverRouter.use('/api/verify', require('./routers/verify'));
// oogle Auth Router
serverRouter.use("/api/auth", require("./routers/googleAuth"));
// forgotPassword
serverRouter.use('/api/authreset', require('./routers/authReset'));
serverRouter.use('/api/income-report', require('./routers/incomeReport'));

serverRouter.use('/api/edit-transaction', require('./routers/editTransaction'));
serverRouter.use('/api/balance-sheet', require('./routers/balanceSheet'));




/* ---------- Fallback for API routes ---------- */
serverRouter.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// ✅ MOUNT ROUTER at root

app.use('/', serverRouter);

// ✅ ROOT ROUTE REDIRECT
app.get('/', (req, res) => {
  res.redirect('/api/test');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Available at: https://server.khushifinances.com`);
  console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
});
