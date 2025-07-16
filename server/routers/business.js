const express = require("express");
const pool = require("../db");
const router = express.Router();

router.post("/", async (req, res) => {
  const username = req.session.username;

  const {
    plan,
    businessName,
    industry,
    businessType,
    ntn,
    address,
    city,
    country,
    phone,
  } = req.body;
  
   if (!username) {
    return res.status(401).json({ error: "Unauthorized: No active session" });
  }

  // Basic validation
  if (
    !plan ||
    !businessName ||
    !businessType ||
    (plan !== "free" && plan !== "premium")
  ) {
    return res.status(400).json({ error: "Required fields missing or invalid" });
  }

  try {
    const conn = await pool.getConnection();

    const sql =
      `INSERT INTO businesses 
        (username,plan, business_name, industry, business_type, ntn_number, address, city, country, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await conn.query(sql, [
      username,
      plan,
      businessName,
      plan === "premium" ? industry : null,
      businessType,
      plan === "premium" ? ntn : null,
      plan === "premium" ? address : null,
      plan === "premium" ? city : null,
      plan === "premium" ? country : null,
      plan === "premium" ? phone : null,
    ]);

    conn.release();

    return res.status(201).json({ message: "Business registered successfully" });
  } catch (error) {
    console.error("Business insert error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
