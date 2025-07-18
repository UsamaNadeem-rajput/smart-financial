// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'https://smart-financial-vj.netlify.app'], // replace with your frontend URL
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Connect routes
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
