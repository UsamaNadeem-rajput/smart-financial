// Load environment variables from .env file
require('dotenv').config();

const mysql = require('mysql2/promise');

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // e.g., 'containers-us-west-48.railway.app'
  port: process.env.DB_PORT,       // e.g., 3306 or Railway port
  user: process.env.DB_USER,       // your DB username
  password: process.env.DB_PASSWORD, // your DB password
  database: process.env.DB_NAME,   // database name
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

module.exports = pool;
