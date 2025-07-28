const express = require('express');
const router = express.Router();
const db = require('../db'); // replace with your actual db connection import

router.get('/showtransactions', async (req, res) => {
  const { date, from, to, business_id } = req.query;

  // Validate date range
  let fromDate = from, toDate = to;
  if (!fromDate || !toDate) {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      fromDate = date;
      toDate = date;
    } else {
      return res.status(400).json({ error: 'from and to dates (YYYY-MM-DD) are required' });
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return res.status(400).json({ error: 'from and to must be in YYYY-MM-DD format' });
  }

  try {
    let transactionsQuery =
      `SELECT transaction_id, frontend_transaction_id, DATE_FORMAT(date, '%Y-%m-%d') as date, 
       debit, credit
       FROM transactions 
       WHERE DATE(date) BETWEEN ? AND ?`;
    let queryParams = [fromDate, toDate];
    if (business_id) {
      transactionsQuery += ' AND business_id = ?';
      queryParams.push(business_id);
    }
    transactionsQuery += ' ORDER BY transaction_id DESC';

    const [transactions] = await db.query(transactionsQuery, queryParams);

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
        frontend_transaction_id: tx.frontend_transaction_id,
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