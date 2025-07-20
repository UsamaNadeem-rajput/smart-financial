const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize session store
const sessionStore = new MySQLStore({}, pool);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://alamsherbaloch.com',
      'https://smart-financial-production.up.railway.app',
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-123',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
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

// Error-handling middleware to prevent crashes
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});