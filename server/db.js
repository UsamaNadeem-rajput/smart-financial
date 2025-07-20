require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database connected');
    await conn.query('SELECT 1'); // Test query
    conn.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    setTimeout(() => {
      console.log('Retrying database connection...');
      pool.getConnection().catch(err => console.error('Retry failed:', err));
    }, 5000); // Retry after 5 seconds
  }
})();

module.exports = pool;