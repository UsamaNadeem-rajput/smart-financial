const express = require("express");
const router = express.Router();
const pool = require("../db"); // tumhara DB connection

// âœ… Get a transaction by transaction_id + business_id
router.get("/:transactionId/:businessId", async (req, res) => {
  const { transactionId, businessId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT t.transaction_id, t.frontend_transaction_id, t.business_id, t.date, te.entry_id, te.account_id, a.account_name, te.amount, te.type
      FROM transactions t
      JOIN transaction_entries te ON t.transaction_id = te.transaction_id
      JOIN accounts a ON te.account_id = a.account_id
      WHERE t.transaction_id = ? AND t.business_id = ? AND t.is_deleted = 0 AND a.is_deleted = 0
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
      frontend_transaction_id: rows[0].frontend_transaction_id || rows[0].transaction_id,
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


// ✅ Update a transaction (preserve transaction_id and existing entry_id where possible)
router.put("/:transactionId/:businessId", async (req, res) => {
  const { transactionId, businessId } = req.params;
  const { entries } = req.body;

  if (!entries || entries.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No entries provided" });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ✅ 1. Calculate totals
      const debitTotal = entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      const creditTotal = entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      // ✅ 2. Update main transactions table (ONLY debit/credit columns)
      await conn.query(
        `UPDATE transactions 
         SET debit = ?, credit = ?, updated_at = NOW() 
         WHERE transaction_id = ? AND business_id = ?`,
        [debitTotal, creditTotal, transactionId, businessId]
      );

      // ✅ 3. Validate that all accounts exist under the same business (ledger must be available)
      for (const entry of entries) {
        const [acctRows] = await conn.query(
          `SELECT account_id FROM accounts WHERE account_id = ? AND business_id = ? AND is_deleted = 0`,
          [entry.account_id, businessId]
        );
        if (!acctRows.length) {
          await conn.rollback();
          return res.status(400).json({
            success: false,
            message: `Invalid ledger: account_id ${entry.account_id} not found for business ${businessId}`,
          });
        }
      }

      // ✅ 4. Preserve existing entry_ids: update existing, insert new, delete removed
      const [existing] = await conn.query(
        `SELECT entry_id FROM transaction_entries WHERE transaction_id = ?`,
        [transactionId]
      );
      const existingIds = new Set(existing.map((r) => r.entry_id));
      const payloadIds = new Set(
        entries.filter((e) => e.entry_id).map((e) => e.entry_id)
      );

      // Update or insert
      for (const entry of entries) {
        if (entry.entry_id && existingIds.has(entry.entry_id)) {
          // Update existing entry in place
          await conn.query(
            `UPDATE transaction_entries
             SET account_id = ?, amount = ?, type = ?
             WHERE entry_id = ? AND transaction_id = ?`,
            [
              entry.account_id,
              entry.amount,
              entry.type,
              entry.entry_id,
              transactionId,
            ]
          );
        } else {
          // Insert new entry (new entry_id)
          await conn.query(
            `INSERT INTO transaction_entries (transaction_id, account_id, amount, type)
             VALUES (?, ?, ?, ?)`,
            [transactionId, entry.account_id, entry.amount, entry.type]
          );
        }
      }

      // Delete entries removed in payload
      for (const id of existingIds) {
        if (!payloadIds.has(id)) {
          await conn.query(
            `DELETE FROM transaction_entries WHERE entry_id = ? AND transaction_id = ?`,
            [id, transactionId]
          );
        }
      }

      await conn.commit();
      res.json({ success: true, message: "✅ Transaction updated successfully" });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("Error updating transaction:", err);
      res.status(500).json({ success: false, message: "Server error" });
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
