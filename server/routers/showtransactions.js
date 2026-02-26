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
      `SELECT t.transaction_id, t.frontend_transaction_id, DATE_FORMAT(t.date, '%Y-%m-%d') as date, 
       t.debit, t.credit
       FROM transactions t
       JOIN businesses b ON t.business_id = b.business_id
       WHERE DATE(t.date) BETWEEN ? AND ?
       AND t.is_deleted = 0
       AND b.is_deleted = 0`;
    let queryParams = [fromDate, toDate];
    if (business_id) {
      transactionsQuery += ' AND t.business_id = ?';
      queryParams.push(business_id);
    }
    transactionsQuery += ' ORDER BY t.transaction_id DESC';

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
       WHERE te.transaction_id IN (?)
         AND a.is_deleted = 0
         AND t.is_deleted = 0`,
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

// DELETE /api/delete-transaction/:transaction_id
router.delete('/delete-transaction/:transaction_id', async (req, res) => {
  const { transaction_id } = req.params;
  const { business_id } = req.query;

  if (!transaction_id || !business_id) {
    return res.status(400).json({ error: 'transaction_id and business_id are required' });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Soft delete the transaction by setting is_deleted = 1
    const [result] = await conn.execute(
      'UPDATE transactions SET is_deleted = 1 WHERE transaction_id = ? AND business_id = ? AND is_deleted = 0',
      [transaction_id, business_id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Transaction not found or already deleted' });
    }

    // 2. We must update the ledger balances because this transaction is now deleted.
    // The easiest way to safely rebuild balances is to reuse the recalculate functionality
    // (We'll reproduce the updateAccountBalances logic here to ensure isolation)

    // Get all accounts for this business
    const [accounts] = await conn.execute(
      `SELECT a.account_id, a.balance, t.type_name, t.type_id
         FROM accounts a
         LEFT JOIN account_types t ON a.type_id = t.type_id
         WHERE a.business_id = ? AND a.is_deleted = 0`,
      [business_id]
    );

    // Update balance for each account using ONLY is_deleted = 0 transactions
    for (const account of accounts) {
      const [entries] = await conn.execute(
        `SELECT te.amount, te.type
             FROM transaction_entries te
             JOIN transactions t ON te.transaction_id = t.transaction_id
             WHERE te.account_id = ? AND t.business_id = ? AND t.is_deleted = 0`,
        [account.account_id, business_id]
      );

      let newBalance = 0;
      const isAssetsAccount = account.type_name === 'Assets' ||
        account.type_name === 'Fixed Assets' || account.type_name === 'Current Assets' || account.type_name === 'Other Assets' ||
        account.type_id === 3 || account.type_id === 4 || account.type_id === 5 || account.type_id === 11;

      const isExpenseAccount = account.type_name === 'Expense' ||
        account.type_name === 'Other Expenses' || account.type_name === 'Cost Of Goods Sold' ||
        account.type_id === 2 || account.type_id === 13 || account.type_id === 14;

      if (isAssetsAccount || isExpenseAccount) {
        for (const entry of entries) {
          if (entry.type === 'debit') newBalance += parseFloat(entry.amount);
          else if (entry.type === 'credit') newBalance -= parseFloat(entry.amount);
        }
      } else {
        for (const entry of entries) {
          if (entry.type === 'credit') newBalance += parseFloat(entry.amount);
          else if (entry.type === 'debit') newBalance -= parseFloat(entry.amount);
        }
      }

      await conn.execute('UPDATE accounts SET balance = ? WHERE account_id = ?', [newBalance, account.account_id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Transaction soft-deleted successfully and balances recalculated.' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;