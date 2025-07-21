// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

/* ---------- Session store ---------- */
const sessionStore = new MySQLStore(
  { schema: { tableName: 'sessions' } },
  pool
);
// 
/* ---------- CORS + JSON ---------- */
app.use(
  cors({
    origin: 'https://smart-financial.netlify.app/', // <-- your frontend URL
    credentials: true,
  })
);
app.use(express.json());

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
      secure: true, // <-- true if using HTTPS
      sameSite: 'none', // <-- for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Routes
const registerRoute = require('./routers/register');
const loginRoute = require('./routers/login');
const businessRoute = require('./routers/business');
const showbusinessesRoute = require('./routers/showbusinesses');
const createnewaccount = require('./routers/createnewaccount');
const list = require('./routers/list');
const searchAccounts = require('./routers/searchAccounts');
const transaction= require('./routers/transactionApi');
const showTransactions = require('./routers/showtransactions');
const authRoutes = require('./routers/auth');

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running!', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ---------- Health check ---------- */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'ERROR' });
  }
});

// API Routes
app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api/business', businessRoute);
app.use('/api/showbusinesses', showbusinessesRoute);
app.use('/api/createnewaccount', createnewaccount);
app.use('/api/accounts-list', list);
app.use('/api/search-accounts', searchAccounts);
app.use('/api', transaction);
app.use('/api', showTransactions);
app.use('/', authRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ Undefined API route: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, () => console.log(`✅ Server running on :${PORT}`));
