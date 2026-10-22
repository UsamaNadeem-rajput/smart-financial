#!/usr/bin/env node
/* --------------------------------------------------
   0.  Passenger-proof CA injection
-------------------------------------------------- */
const fs = require('fs');
const caPath = '/etc/pki/tls/certs/ca-bundle.crt';

if (fs.existsSync(caPath)) {
  try {
    const caBundle = fs.readFileSync(caPath, 'utf8');
    const https = require('https');
    https.globalAgent.options.ca = caBundle.split('-----END CERTIFICATE-----')
                                          .filter(Boolean)
                                          .map(cert => cert + '-----END CERTIFICATE-----\n');
    console.log('✅ CA bundle loaded, certs:', https.globalAgent.options.ca.length);
  } catch (e) {
    console.error('❌ Could not load CA bundle:', e.message);
  }
} else {
  console.log('ℹ️ Running in dev mode (no ca-bundle required)');
}

require('dotenv').config();
require('./auth');               // passport Google strategy
const express   = require('express');
const cors      = require('cors');
const session   = require('express-session');
const MySQLStore= require('express-mysql-session')(session);
const pool      = require('./db');
const passport  = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;



/* ---------- Trust proxy for OrangeHost ---------- */
app.set('trust proxy', 1);

/* ---------- Session store ---------- */
const sessionStore = new MySQLStore({ schema: { tableName: 'sessions' } }, pool);


/* ---------- CORS + JSON ---------- */
const allowedOrigins = [
  'http://localhost:5173',
  'https://khushifinances.com',
  'https://www.khushifinances.com'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-user-session']
  })
);
app.use(express.json());

// Graceful JSON parse error handler (prevents unhandled SyntaxError stack traces in stderr.log)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn(`⚠️ Malformed JSON received on ${req.method} ${req.url}`);
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  next(err);
});

// Global Input Sanitization & Anti-Injection Middleware:
// Strips null bytes (\0) to prevent SQL/XSS evasion attacks across all inputs
function sanitizeInput(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/\0/g, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeInput(obj[key]);
    }
  }
  return obj;
}

app.use((req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);

  // Security Headers against XSS, Clickjacking and MIME-Sniffing
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('X-XSS-Protection', '1; mode=block');
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

// Session fallback for cross-site / third-party cookie restrictions (e.g. localhost -> server)
app.use((req, res, next) => {
  if (!req.session?.username && req.headers['x-user-session']) {
    req.session.username = String(req.headers['x-user-session']).trim();
  }
  next();
});


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

const { formLimiter } = require('./middleware/rateLimiter');

/* ---------- API Routes ---------- */
serverRouter.use('/api/register', require('./routers/register'));
serverRouter.use('/api/login', require('./routers/login'));
serverRouter.use('/api/business', formLimiter, require('./routers/business'));
serverRouter.use('/api/showbusinesses', require('./routers/showbusinesses'));
serverRouter.use('/api/createnewaccount', formLimiter, require('./routers/createnewaccount'));
serverRouter.use('/api/accounts-list', require('./routers/list'));
serverRouter.use('/api/accounts', formLimiter, require('./routers/accounts'));
serverRouter.use('/api/account-types', require('./routers/accountTypes'));

serverRouter.use('/api/search-accounts', require('./routers/searchAccounts'));
serverRouter.use('/api', require('./routers/transactionApi'));
serverRouter.use('/api', require('./routers/showtransactions'));
serverRouter.use('/api/auth', require('./routers/auth'));

serverRouter.use('/api/ledger-balancing', require('./routers/ledgerBalancing'));
// serverRouter.use('/api/contact', require('./routers/contact'));
serverRouter.use('/api/verify', require('./routers/verify'));
// Google Auth Router
serverRouter.use("/api/auth", require("./routers/googleAuth"));
// forgotPassword
serverRouter.use('/api/authreset', require('./routers/authReset'));
serverRouter.use('/api/income-report', require('./routers/incomeReport'));

serverRouter.use('/api/edit-transaction', formLimiter, require('./routers/editTransaction'));
serverRouter.use('/api/balance-sheet', require('./routers/balanceSheet'));
serverRouter.use('/api/ai', require('./routers/aiRoutes'));

serverRouter.use('/api/profile', require('./routers/profile'));
serverRouter.use('/api/history', require('./routers/history'));



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
