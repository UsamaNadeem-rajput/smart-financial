const express = require("express");
const router = express.Router();
const pool = require("../db"); // MariaDB pool

// GET /api/list?businessId=...
router.get("/:businessId", async (req, res) => {
  console.log("Business ID: " + req.params.businessId);
  try {
    const [rows] = await pool.query(
      `SELECT a.*, t.type_name
      FROM accounts a
      JOIN businesses b ON a.business_id = b.business_id
      LEFT JOIN account_types t ON a.type_id = t.type_id
      WHERE a.business_id = ? AND a.is_deleted = 0 AND b.is_deleted = 0`,
      [req.params.businessId]
    );
    return res.status(200).json({ accounts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
});

module.exports = router;
