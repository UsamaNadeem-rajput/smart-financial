const express = require("express");
const pool = require("../db");
const router = express.Router();


// ========================= CREATE BUSINESS =========================
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
    return res
      .status(400)
      .json({ error: "Required fields missing or invalid" });
  }

  try {
    const conn = await pool.getConnection();

    const sql = `
      INSERT INTO businesses 
      (username, plan, business_name, industry, business_type, ntn_number, address, city, country, phone, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

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



// ========================= UPDATE BUSINESS =========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
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

  try {
    const conn = await pool.getConnection();

    const sql = `
      UPDATE businesses
      SET plan = ?, business_name = ?, industry = ?, business_type = ?, 
          ntn_number = ?, address = ?, city = ?, country = ?, phone = ?
      WHERE business_id = ? AND username = ? AND is_deleted = 0
    `;

    const result = await conn.query(sql, [
      plan,
      businessName,
      plan === "premium" ? industry : null,
      businessType,
      plan === "premium" ? ntn : null,
      plan === "premium" ? address : null,
      plan === "premium" ? city : null,
      plan === "premium" ? country : null,
      plan === "premium" ? phone : null,
      id,
      username,
    ]);

    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Business not found or already deleted" });
    }

    return res.json({ message: "Business updated successfully" });
  } catch (error) {
    console.error("Business update error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// ========================= SOFT DELETE BUSINESS =========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const username = req.session.username;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized: No active session" });
  }

  try {
    const conn = await pool.getConnection();

    const sql = `
      UPDATE businesses 
      SET is_deleted = 1
      WHERE business_id = ? AND username = ? AND is_deleted = 0
    `;

    const result = await conn.query(sql, [id, username]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Business not found or already deleted" });
    }

    return res.json({ message: "Business soft deleted successfully" });
  } catch (error) {
    console.error("Business delete error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
