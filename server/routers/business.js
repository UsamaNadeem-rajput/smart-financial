const express = require("express");
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// ✅ Configure Multer for Logo Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "logoupload/"); // Save in root-level logoupload folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Prevent duplicate names
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
});


// ========================= CREATE BUSINESS =========================
router.post("/", upload.single("logo"), async (req, res) => {
  const username = req.session.username;
  const logoUrl = req.file ? `/logoupload/${req.file.filename}` : null;

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
      (username, plan, business_name, industry, business_type, ntn_number, address, city, country, phone, logo_url, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
      logoUrl,
    ]);

    conn.release();

    return res.status(201).json({ message: "Business registered successfully" });
  } catch (error) {
    console.error("Business insert error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// ========================= UPDATE BUSINESS =========================
// ========================= UPDATE BUSINESS =========================
router.put("/:id", upload.single("logo"), async (req, res) => {
  const { id } = req.params;
  const username = req.session.username;
  const newLogoUrl = req.file ? `/logoupload/${req.file.filename}` : null;

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

    // Dynamically build query depending on whether a new logo is uploaded
    let sql, params;

    if (newLogoUrl) {
      sql = `
        UPDATE businesses
        SET plan = ?, business_name = ?, industry = ?, business_type = ?, 
            ntn_number = ?, address = ?, city = ?, country = ?, phone = ?, logo_url = ?
        WHERE business_id = ? AND username = ? AND is_deleted = 0
      `;
      params = [
        plan,
        businessName,
        plan === "premium" ? industry : null,
        businessType,
        plan === "premium" ? ntn : null,
        plan === "premium" ? address : null,
        plan === "premium" ? city : null,
        plan === "premium" ? country : null,
        plan === "premium" ? phone : null,
        newLogoUrl,
        id,
        username,
      ];
    } else {
      sql = `
        UPDATE businesses
        SET plan = ?, business_name = ?, industry = ?, business_type = ?, 
            ntn_number = ?, address = ?, city = ?, country = ?, phone = ?
        WHERE business_id = ? AND username = ? AND is_deleted = 0
      `;
      params = [
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
      ];
    }

    const result = await conn.query(sql, params);

    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Business not found or already deleted" });
    }

    return res.json({ message: "Business updated successfully", logoUrl: newLogoUrl });
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


// ========================= LOGO PROXY (Bypasses CORS for static files) =========================
const fs = require("fs");
router.get("/logo-proxy/:filename", (req, res) => {
  const { filename } = req.params;

  // Security: Only allow access to files in the logoupload directory
  const safeName = path.basename(filename); // Prevent path traversal
  const filePath = path.join(__dirname, "..", "logoupload", safeName);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Logo not found" });
  }

  // Determine content type based on extension
  const ext = path.extname(safeName).toLowerCase();
  const contentTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  };
  const contentType = contentTypes[ext] || "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

module.exports = router;
