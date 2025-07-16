// test-db.js
const pool = require('./db');

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected");
    conn.release();
  } catch (err) {
    console.error("❌ DB connection error", err);
  }
})();
