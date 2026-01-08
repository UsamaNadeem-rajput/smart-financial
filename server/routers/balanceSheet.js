// server/routers/balanceSheet.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Explicit CORS headers for credentials
router.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:5173', 'https://khushifinances.com', 'https://server.khushifinances.com'];

    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});

// Impact Analysis:
// 1. Potential Risks: Minimal. This is a read-only operation. 
//    Dependence on 'account_types' table naming conventions (Assets, Liabilities, etc.) is handled by flexible string matching.
// 2. Efficiency Strategy: 
//    - Uses SQL GROUP BY and SUM to aggregate millions of transactions into a few ledger rows.
//    - Fetches account types once per request (cached in memory if needed, but negligible).
//    - Performs categorization and formatting in-memory which is V8 optimized.

/**
 * GET /api/balance-sheet/:business_id
 * Query Params: targetDate (YYYY-MM-DD)
 */
router.get('/:business_id', async (req, res) => {
    const { business_id } = req.params;
    const { targetDate } = req.query;

    if (!business_id || !targetDate) {
        return res.status(400).json({ error: 'Business ID and targetDate are required.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // 1. Fetch Account Types to ensure we can map them correctly
        // We need to know which type_id corresponds to Asset, Liability, Equity, Income, Expense
        const [types] = await conn.query('SELECT type_id, type_name FROM account_types');

        // Map types for easy lookup. Normalize names to lowercase singular/plural handling
        // We look for keywords like "asset", "liabilit", "equity", "income", "expense"
        const typeMap = types.reduce((acc, t) => {
            const name = t.type_name.toLowerCase();
            if (name.includes('asset')) acc[t.type_id] = 'asset';
            else if (name.includes('liabilit')) acc[t.type_id] = 'liability';
            else if (name.includes('equity') || name.includes('capital')) acc[t.type_id] = 'equity';
            else if (name.includes('income') || name.includes('revenue')) acc[t.type_id] = 'income';
            else if (name.includes('expense')) acc[t.type_id] = 'expense';
            return acc;
        }, {});

        // 2. Optimized SQL Query
        // Join transactions -> transaction_entries -> accounts
        // Filter by business_id and date
        // Group by account_id to get total debit/credit per ledger
        const sql = `
            SELECT 
                a.account_id,
                a.account_name,
                a.type_id,
                SUM(CASE WHEN te.type = 'debit' THEN te.amount ELSE 0 END) as total_debit,
                SUM(CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END) as total_credit
            FROM transactions t
            JOIN transaction_entries te ON t.transaction_id = te.transaction_id
            JOIN accounts a ON te.account_id = a.account_id
            WHERE t.business_id = ? 
            AND t.date <= ?
            GROUP BY a.account_id, a.account_name, a.type_id
        `;

        const [rows] = await conn.execute(sql, [business_id, targetDate]);

        // 3. Process Results
        const assets = [];
        const liabilities = [];
        const equity = [];

        let totalIncome = 0;
        let totalExpense = 0;

        rows.forEach(row => {
            const category = typeMap[row.type_id];
            const debit = parseFloat(row.total_debit || 0);
            const credit = parseFloat(row.total_credit || 0);

            if (!category) return; // Skip unknown types

            let balance = 0;
            const ledger = { name: row.account_name, balance: 0 };

            switch (category) {
                case 'asset':
                    // Asset Nature: Debit. Balance = Dr - Cr
                    balance = debit - credit;
                    if (balance !== 0) {
                        ledger.balance = balance;
                        assets.push(ledger);
                    }
                    break;
                case 'liability':
                    // Liability Nature: Credit. Balance = Cr - Dr
                    balance = credit - debit;
                    if (balance !== 0) {
                        ledger.balance = balance;
                        liabilities.push(ledger);
                    }
                    break;
                case 'equity':
                    // Equity Nature: Credit. Balance = Cr - Dr
                    balance = credit - debit;
                    if (balance !== 0) {
                        ledger.balance = balance;
                        equity.push(ledger);
                    }
                    break;
                case 'income':
                    // Income Nature: Credit. Used for Net Profit calc.
                    // Net Effect on Profit = Credit - Debit
                    totalIncome += (credit - debit);
                    break;
                case 'expense':
                    // Expense Nature: Debit. Used for Net Profit calc.
                    // Net Effect on Profit = Debit - Credit (reduces profit)
                    // Wait, standard logic: Net Profit = Total Income (Cr) - Total Expense (Dr)
                    // Let's stick to: Income contributes (Cr - Dr) to profit.
                    // Expense contributes (Dr - Cr) to reduce profit.
                    totalExpense += (debit - credit);
                    break;
            }
        });

        // 4. Calculate Net Profit/Loss
        // Net Profit = Income - Expense
        const netProfit = totalIncome - totalExpense;

        // Add Net Profit to Equity
        equity.push({
            name: netProfit >= 0 ? "Net Profit" : "Net Loss",
            balance: netProfit // If negative, it reduces equity (Liability/Equity section sum)
        });

        // 5. Calculate Final Totals
        const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
        const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

        const response = {
            assets,
            liabilities,
            equity,
            totals: {
                total_assets: totalAssets,
                total_liabilities_equity: totalLiabilities + totalEquity
            }
        };

        res.json(response);

    } catch (err) {
        console.error('Balance Sheet Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
