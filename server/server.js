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

/* ---------- Middleware ---------- */
app.use(
  cors({
    origin: ['https://alamsherbaloch.com'], // Hostinger front-end
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    key: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,          // required for HTTPS
      sameSite: 'None',      // required for cross-origin cookies
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
const transaction = require('./routers/transactionApi');
const showTransactions = require('./routers/showtransactions');
const authRoutes = require('./routers/auth');
app.use('/', authRoutes);
app.use('/api', showTransactions);
app.use('/api/accounts-list', list);
app.use('/api/createnewaccount', createnewaccount);
app.use('/api/showbusinesses', showbusinessesRoute);
app.use('/api/business', businessRoute);
app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api/search-accounts', searchAccounts);
app.use('/api', transaction);

/* ---------- Health check ---------- */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'ERROR' });
  }
});

/* ---------- Start ---------- */
app.listen(PORT, () => console.log(`✅ Server running on :${PORT}`));
