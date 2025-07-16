const express = require("express");
const pool = require("../db"); // Your DB connection (mysql2/promise)
const { compareSync } = require("bcrypt");
const router = express.Router();

router.get("/", async (req, res) => {
  const username = req.session.username;

  if (!username) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const conn = await pool.getConnection();
    console.log("User we : "+username)
    const [rows] = await conn.query(
      "SELECT * FROM businesses WHERE username = ?",
      [username]
    );
    conn.release();

    if (rows.length === 0) {
      return res.status(200).json({ businesses: [] }); // don't send 404, just empty array
    }

    return res.status(200).json({ businesses: rows });
  } catch (error) {
    console.error("Business fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
