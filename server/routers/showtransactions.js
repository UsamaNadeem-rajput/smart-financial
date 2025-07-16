const express = require('express');
const router = express.Router();
const db = require('../db'); // replace with your actual db connection import

// GET /api/showtransactions?date=YYYY-MM-DD
// router.get('/showtransactions', async (req, res) => {
//   const { date } = req.query;
//   if (!date) {
//     return res.status(400).json({ error: 'Date is required' });
//   }

//   try {
//     // Step 1: Get all transactions for the selected date
//     const [transactions] = await db.query(
//       `SELECT transaction_id, DATE(date) as date FROM transactions WHERE date = ? ORDER BY transaction_id DESC`,
//       [date]
//     );

//     if (transactions.length === 0) return res.json([]);

//     const transactionIds = transactions.map(t => t.transaction_id);

//     // Step 2: Get all entries and join with account names
//     const [entries] = await db.query(
//       `SELECT 
//          te.transaction_id,
//          te.amount,
//          te.type,
//          a.account_name,
//          DATE(t.date) as transaction_date
//        FROM transaction_entries te
//        JOIN accounts a ON te.account_id = a.account_id
//        JOIN transactions t ON te.transaction_id = t.transaction_id
//        WHERE te.transaction_id IN (?)`,
//       [transactionIds]
//     );

//     // Step 3: Group entries by transaction
//     const grouped = transactions.map(tx => ({
//       transaction_id: tx.transaction_id,
//       date: String(tx.date), // force date to string
//       entries: entries.filter(e => e.transaction_id === tx.transaction_id).map(e => ({
//         ...e,
//         transaction_date: String(e.transaction_date) // force entry date to string
//       }))
//     }));

//     res.json(grouped);
//   } catch (err) {
//     console.error('Error fetching transactions:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.get('/showtransactions', async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
  }

  try {
    const [transactions] = await db.query(
      `SELECT transaction_id, DATE_FORMAT(date, '%Y-%m-%d') as date, 
       debit, credit
       FROM transactions 
       WHERE DATE(date) = ? 
       ORDER BY transaction_id DESC`,
      [date]
    );

    if (transactions.length === 0) return res.json({ entries: [], totals: { debit: 0, credit: 0 } });

    const transactionIds = transactions.map(t => t.transaction_id);

    const [entries] = await db.query(
      `SELECT 
         te.transaction_id,
         te.amount,
         te.type,
         a.account_name,
         DATE_FORMAT(t.date, '%Y-%m-%d') as transaction_date
       FROM transaction_entries te
       JOIN accounts a ON te.account_id = a.account_id
       JOIN transactions t ON te.transaction_id = t.transaction_id
       WHERE te.transaction_id IN (?)`,
      [transactionIds]
    );

    const totals = transactions.reduce((acc, tx) => ({
      debit: acc.debit + parseFloat(tx.debit || 0),
      credit: acc.credit + parseFloat(tx.credit || 0),
    }), { debit: 0, credit: 0 });

    const grouped = transactions.map(tx => {
      const txEntries = entries.filter(e => e.transaction_id === tx.transaction_id).map(e => ({
        ...e,
        transaction_date: e.transaction_date,
      }));
      const txTotals = {
        debit: txEntries.reduce((sum, e) => e.type === 'debit' ? sum + parseFloat(e.amount) : sum, 0),
        credit: txEntries.reduce((sum, e) => e.type === 'credit' ? sum + parseFloat(e.amount) : sum, 0),
      };
      return {
        transaction_id: tx.transaction_id,
        date: tx.date,
        entries: txEntries,
        totals: txTotals,
      };
    });

    res.json({ entries: grouped, totals });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
