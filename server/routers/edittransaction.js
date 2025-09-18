const express = require("express");
const router = express.Router();
const pool = require("../db"); // tumhara DB connection

// âœ… Get a transaction by transaction_id + business_id
router.get("/:transactionId/:businessId", async (req, res) => {
  const { transactionId, businessId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT t.transaction_id, t.business_id, t.date, te.entry_id, te.account_id, a.account_name, te.amount, te.type
      FROM transactions t
      JOIN transaction_entries te ON t.transaction_id = te.transaction_id
      JOIN accounts a ON te.account_id = a.account_id
      WHERE t.transaction_id = ? AND t.business_id = ?
      `,
      [transactionId, businessId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // ðŸ”¹ Structure response
    const transaction = {
      transaction_id: rows[0].transaction_id,
      business_id: rows[0].business_id,
      date: rows[0].date,
      entries: rows.map((r) => ({
        entry_id: r.entry_id,
        account_id: r.account_id,
        account_name: r.account_name,
        amount: r.amount,
        type: r.type,
      })),
    };

    res.json({ success: true, transaction });
  } catch (err) {
    console.error("Error fetching transaction:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ✅ Update a transaction (only debit/credit)
router.put("/:transactionId/:businessId", async (req, res) => {
  const { transactionId, businessId } = req.params;
  const { entries } = req.body;

  if (!entries || entries.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No entries provided" });
  }

  try {
    // ✅ 1. Calculate totals
    const debitTotal = entries
      .filter(e => e.type === "debit")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const creditTotal = entries
      .filter(e => e.type === "credit")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // ✅ 2. Update main transactions table (ONLY debit/credit columns)
    await pool.query(
      `UPDATE transactions 
       SET debit = ?, credit = ?, updated_at = NOW() 
       WHERE transaction_id = ? AND business_id = ?`,
      [debitTotal, creditTotal, transactionId, businessId]
    );

    // ✅ 3. Update entries (delete + insert fresh)
    await pool.query(
      `DELETE FROM transaction_entries WHERE transaction_id = ?`,
      [transactionId]
    );

    for (const entry of entries) {
      await pool.query(
        `INSERT INTO transaction_entries (transaction_id, account_id, amount, type)
         VALUES (?, ?, ?, ?)`,
        [transactionId, entry.account_id, entry.amount, entry.type]
      );
    }

    res.json({ success: true, message: "✅ Debit/Credit updated successfully" });
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;