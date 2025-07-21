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
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ],
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
      secure: false, // Set to false for local development
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

app.use('/', authRoutes); // or app.use('/api', authRoutes);
app.use('/api', showTransactions);
app.use('/api/accounts-list', list);
app.use('/api/createnewaccount', createnewaccount); // 👈 backend endpoint
app.use('/api/showbusinesses', showbusinessesRoute);
app.use('/api/business', businessRoute);
app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api/search-accounts', searchAccounts);
app.use('/api', transaction );

/* ---------- Health check ---------- */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'ERROR' });
  }
});

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running!', 
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

app.listen(PORT, () => console.log(`✅ Server running on :${PORT}`));
