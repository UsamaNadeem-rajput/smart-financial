const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

// Use Railway-assigned port or fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.onrender.com'], // add your frontend prod URL
  credentials: true
}));
app.use(express.json());

app.use(
  session({
    secret: 'your-secret-key', // In production, use a strong secret stored in environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
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

// Route mounting
app.use('/', authRoutes); 
app.use('/api', showTransactions);
app.use('/api/accounts-list', list);
app.use('/api/createnewaccount', createnewaccount);
app.use('/showbusinesses', showbusinessesRoute);
app.use('/business', businessRoute);
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/api/search-accounts', searchAccounts);
app.use('/api', transaction);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
