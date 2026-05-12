const axios = require('axios');
const db = require('../db');
const {
    getSuggestions,
    getFailureSuggestions,
    getNoRecordsSuggestions
} = require('./suggestionEngine');

const handleChat = async (req, res) => {
    try {
        const { user_query, confirm_transaction } = req.body;
        const business_id =
            req.session?.business_id || req.body?.business_id;

        if (!business_id) {
            return res.status(401).json({
                error: 'Unauthorized: No active business session found.'
            });
        }
        if (!user_query && !confirm_transaction) {
            return res.status(400).json({
                error: 'Bad Request: user_query is required.'
            });
        }

        if (confirm_transaction) {
            return await _executeInsert(confirm_transaction, business_id, res);
        }

        const hf_url =
            "https://usamark123-smart-financial-ai.hf.space/generate-sql";
        const aiResponse = await axios.post(hf_url, {
            query: user_query,
            business_id: Number(business_id)
        });

        const aiData = aiResponse.data;
        const aiFilters = aiData.filters || {};
        const aiIntent = aiData.intent || 'data_query';

        // ── FAQ ───────────────────────────────────────────────────
        if (!aiData.sql) {
            if (aiData.intent === "faq" && aiData.faq_answer) {
                return res.json({
                    response_type: "general",
                    response: aiData.faq_answer,
                    showSuggestions: true,
                    suggestions: getSuggestions('faq', {}, '', {})
                });
            }
            return res.json({
                response_type: "general",
                response:
                    "❓ I couldn't understand your query.\n\n" +
                    "Try rephrasing or use one of the suggestions below.",
                showSuggestions: true,
                suggestions: getFailureSuggestions(user_query)
            });
        }

        const sqlResult = aiData.sql;

        // ── Phase 4B: Add Transaction ─────────────────────────────
        if (sqlResult && typeof sqlResult === 'object'
            && sqlResult.type === 'add_transaction') {

            if (!sqlResult.amount) {
                return res.json({
                    response_type: "general",
                    response:
                        "❓ I couldn't identify the amount.\n\n" +
                        "**Example:** *Add rent expense 25000 paid from cash*",
                    showSuggestions: true,
                    suggestions: [
                        'Add rent expense 25000 paid from cash',
                        'Pay salary 50000 from bank account',
                        'Show accounts'
                    ]
                });
            }

            if (Number(sqlResult.amount) <= 0) {
                return res.json({
                    response_type: "general",
                    response: "❌ Transaction amount must be greater than zero.",
                    showSuggestions: true,
                    suggestions: [
                        'Add rent expense 25000 paid from cash',
                        'Show transactions',
                        'Financial summary'
                    ]
                });
            }

            let debitAccount = null;
            let creditAccount = null;
            let debitSuggestions = [];
            let creditSuggestions = [];

            if (sqlResult.debit_hint) {
                const result = await findAccountFuzzy(
                    sqlResult.debit_hint, business_id
                );
                debitAccount = result.account;
                debitSuggestions = result.suggestions;
            }

            if (sqlResult.credit_hint) {
                const result = await findAccountFuzzy(
                    sqlResult.credit_hint, business_id
                );
                creditAccount = result.account;
                creditSuggestions = result.suggestions;
            }

            if (!debitAccount && !creditAccount) {
                const availableAccounts =
                    await getAvailableAccounts(business_id);
                return res.json({
                    response_type: "account_not_found",
                    message:
                        "❓ I couldn't identify the accounts for " +
                        "this transaction.\n\n" +
                        `Searched for: *debit="${sqlResult.debit_hint || 'unknown'}"*, ` +
                        `*credit="${sqlResult.credit_hint || 'unknown'}"*`,
                    available_accounts: availableAccounts,
                    hint:
                        "Please retry using one of the account " +
                        "names listed below, or type **'show accounts'**.",
                    showSuggestions: true,
                    suggestions: ['Show accounts', 'Financial summary']
                });
            }

            if (!debitAccount || !creditAccount) {
                const missing = !debitAccount ? 'debit' : 'credit';
                const missingHint = !debitAccount
                    ? sqlResult.debit_hint
                    : sqlResult.credit_hint;
                const rawList = !debitAccount
                    ? debitSuggestions : creditSuggestions;
                const showList = rawList.length > 0
                    ? rawList
                    : (await getAvailableAccounts(business_id))
                        .map(a => a.name);

                return res.json({
                    response_type: "account_not_found",
                    message:
                        `❓ Found the **${missing === 'debit' ? 'credit' : 'debit'
                        }** account but couldn't identify the **${missing}** ` +
                        `account: *"${missingHint}"*`,
                    showSuggestions: true,
                    suggestions: showList,
                    hint:
                        "Did you mean one of these? " +
                        "Please retry with the exact account name."
                });
            }

            const confirmData = {
                amount: sqlResult.amount,
                description: sqlResult.description,
                transaction_date: sqlResult.transaction_date || null,
                debit_account_id: debitAccount.account_id,
                debit_account_name: debitAccount.account_name,
                credit_account_id: creditAccount.account_id,
                credit_account_name: creditAccount.account_name,
            };

            return res.json({
                response_type: "confirm_transaction",
                confirm_required: true,
                confirm_data: confirmData
            });
        }

        // ── Phase 3: Financial Summary ────────────────────────────
        if (sqlResult && typeof sqlResult === 'object'
            && sqlResult.type === 'financial_summary') {

            const [incomeResult, expenseResult, countResult] =
                await Promise.all([
                    db.execute(sqlResult.sql_income),
                    db.execute(sqlResult.sql_expense),
                    db.execute(sqlResult.sql_count)
                ]);

            const totalIncome =
                Number(incomeResult[0][0]?.total_income || 0);
            const totalExpense =
                Number(expenseResult[0][0]?.total_expense || 0);
            const netProfit = totalIncome - totalExpense;

            // "2026-01" → "January 2026" format karo
            const period = _formatPeriod(sqlResult.period);

            return res.json({
                response_type: "financial_summary",
                summary: {
                    income: totalIncome,
                    expense: totalExpense,
                    profit: netProfit,
                    count: Number(
                        countResult[0][0]?.total_transactions || 0
                    ),
                    period
                },
                showSuggestions: false
            });
        }

        // ── Phase 1 & 2: Normal Data Query ───────────────────────
        const [rows] = await db.execute(sqlResult);
        const totalCount = rows.length;

        if (totalCount === 0) {
            return res.json({
                response_type: "general",
                response:
                    "📭 No matching records found for your query.\n\n" +
                    "This could mean:\n" +
                    "• No data exists for this time period\n" +
                    "• The filter is too specific",
                showSuggestions: true,
                suggestions: getNoRecordsSuggestions(
                    _detectResultType(sqlResult), aiFilters
                )
            });
        }

        const sampleRow = rows[0];

        // Transactions result
        if (sampleRow.transaction_id !== undefined) {
            const totalSum = rows.reduce(
                (sum, row) => sum + Number(row.amount || 0), 0
            );

            const transactions = rows.map(row => ({
                date: !isNaN(new Date(row.date))
                    ? new Date(row.date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    })
                    : 'N/A',
                transaction_id: row.frontend_transaction_id
                    || row.transaction_id,
                description: row.description || '—',
                amount: Number(row.amount || 0),
                db_id: row.transaction_id
            }));

            return res.json({
                response_type: "transactions",
                total_count: totalCount,
                total_sum: totalSum,
                transactions,
                showSuggestions: false
            });
        }

        // Accounts result
        if (sampleRow.account_name !== undefined
            || sampleRow.name !== undefined) {
            const accounts = rows.map(row => ({
                name: row.account_name || row.name || 'Account',
                balance: Number(row.balance || 0),
                type_id: row.type_id || null
            }));

            return res.json({
                response_type: "accounts",
                total_count: totalCount,
                accounts,
                showSuggestions: false
            });
        }

        return res.json({
            response_type: "general",
            response: `Found ${totalCount} result(s).`,
            showSuggestions: false
        });

    } catch (err) {
        console.error('Error in aiController:', err.message);
        console.error('Full error:', err.stack);
        res.status(500).json({
            error: 'AI processing failed.',
            exact_node_error: err.message,
            stack: err.stack,
            hugging_face_response: err.response
                ? err.response.data
                : "No response from HF"
        });
    }
};

// ════════════════════════════════════════════════════════════════
// _formatPeriod — "2026-01" → "January 2026"
// ════════════════════════════════════════════════════════════════
function _formatPeriod(raw) {
    if (!raw || raw === "All Time") return "All Time";

    // "2026-01" → "January 2026"
    if (/^\d{4}-\d{2}$/.test(raw)) {
        const [year, month] = raw.split('-');
        const months = [
            '', 'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'
        ];
        return `${months[parseInt(month)]} ${year}`;
    }

    // "2026" → "Year 2026"
    if (/^\d{4}$/.test(raw)) return `Year ${raw}`;

    // Range ya exact — as-is return
    return raw;
}

// ════════════════════════════════════════════════════════════════
// findAccountFuzzy — 4-level search
// ════════════════════════════════════════════════════════════════
async function findAccountFuzzy(hint, business_id) {
    const [fullMatch] = await db.execute(
        `SELECT account_id, account_name, type_id
         FROM accounts
         WHERE business_id = ? AND is_deleted = 0
           AND account_name LIKE ? LIMIT 1`,
        [business_id, `%${hint}%`]
    );
    if (fullMatch.length > 0)
        return { account: fullMatch[0], suggestions: [] };

    const skipWords = [
        'account', 'accounts', 'the', 'my', 'our',
        'main', 'primary', 'from', 'into', 'and',
        'using', 'via', 'through', 'paid', 'payment'
    ];
    const words = hint.toLowerCase().split(' ')
        .filter(w => w.length >= 3 && !skipWords.includes(w));

    for (const word of words) {
        const [wordMatch] = await db.execute(
            `SELECT account_id, account_name, type_id
             FROM accounts
             WHERE business_id = ? AND is_deleted = 0
               AND account_name LIKE ? LIMIT 1`,
            [business_id, `%${word}%`]
        );
        if (wordMatch.length > 0)
            return { account: wordMatch[0], suggestions: [] };
    }

    if (words.length > 0) {
        const [firstWordMatch] = await db.execute(
            `SELECT account_id, account_name, type_id
             FROM accounts
             WHERE business_id = ? AND is_deleted = 0
               AND account_name LIKE ? LIMIT 3`,
            [business_id, `%${words[0]}%`]
        );
        if (firstWordMatch.length > 0) {
            return {
                account: firstWordMatch[0],
                suggestions: firstWordMatch.map(r => r.account_name)
            };
        }
    }

    const [recent] = await db.execute(
        `SELECT DISTINCT a.account_name
         FROM accounts a
         LEFT JOIN transaction_entries te
             ON a.account_id = te.account_id
         LEFT JOIN transactions t
             ON te.transaction_id = t.transaction_id
         WHERE a.business_id = ? AND a.is_deleted = 0
         ORDER BY t.date DESC LIMIT 5`,
        [business_id]
    );
    return {
        account: null,
        suggestions: recent.map(r => r.account_name)
    };
}

// ════════════════════════════════════════════════════════════════
// getAvailableAccounts
// ════════════════════════════════════════════════════════════════
async function getAvailableAccounts(business_id) {
    const [accounts] = await db.execute(
        `SELECT a.account_name, at.type_name
         FROM accounts a
         LEFT JOIN account_types at ON a.type_id = at.type_id
         WHERE a.business_id = ? AND a.is_deleted = 0
           AND a.is_active   = 1
         ORDER BY at.type_name, a.account_name LIMIT 10`,
        [business_id]
    );
    return accounts.map(r => ({
        name: r.account_name,
        type_name: r.type_name || 'Account'
    }));
}

// ════════════════════════════════════════════════════════════════
// _detectResultType
// ════════════════════════════════════════════════════════════════
function _detectResultType(sql) {
    if (typeof sql !== 'string') return '';
    const lower = sql.toLowerCase();
    if (lower.includes('from transactions') ||
        lower.includes('from `transactions`')) return 'transactions';
    if (lower.includes('from accounts') ||
        lower.includes('from `accounts`')) return 'accounts';
    return '';
}

// ════════════════════════════════════════════════════════════════
// _executeInsert — Atomic double-entry write
// ════════════════════════════════════════════════════════════════
async function _executeInsert(confirmData, business_id, res) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            amount, description,
            debit_account_id, credit_account_id,
            transaction_date
        } = confirmData;

        if (!amount || !debit_account_id || !credit_account_id) {
            await conn.rollback();
            conn.release();
            return res.json({
                response_type: "general",
                response: "❌ Transaction incomplete — account IDs missing."
            });
        }

        if (Number(amount) <= 0) {
            await conn.rollback();
            conn.release();
            return res.json({
                response_type: "general",
                response: "❌ Amount must be greater than zero."
            });
        }

        const [maxRow] = await conn.execute(
            `SELECT COALESCE(MAX(frontend_transaction_id), 0) AS max_fid
             FROM transactions
             WHERE business_id = ? AND is_deleted = 0`,
            [business_id]
        );
        const newFrontendId = maxRow[0].max_fid + 1;
        const txDate = transaction_date
            || new Date().toISOString().split('T')[0];

        // transactions table mein debit aur credit dono same amount
        // Double-entry rule: total debit = total credit
        const [txResult] = await conn.execute(
            `INSERT INTO transactions
                (business_id, frontend_transaction_id,
                 description, date, debit, credit, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [business_id, newFrontendId, description, txDate,
                amount, amount]
        );
        const newTransactionId = txResult.insertId;

        await conn.execute(
            `INSERT INTO transaction_entries
                (transaction_id, account_id, amount, type)
             VALUES (?, ?, ?, 'debit')`,
            [newTransactionId, debit_account_id, amount]
        );

        await conn.execute(
            `INSERT INTO transaction_entries
                (transaction_id, account_id, amount, type)
             VALUES (?, ?, ?, 'credit')`,
            [newTransactionId, credit_account_id, amount]
        );

        await conn.execute(
            `UPDATE accounts SET balance = balance + ?
             WHERE account_id = ?`,
            [amount, debit_account_id]
        );
        await conn.execute(
            `UPDATE accounts SET balance = balance - ?
             WHERE account_id = ?`,
            [amount, credit_account_id]
        );

        await conn.commit();
        conn.release();

        return res.json({
            response_type: "transaction_success",
            result: {
                frontend_transaction_id: newFrontendId,
                date: txDate,
                amount: Number(amount),
                description,
                debit_account_name: confirmData.debit_account_name,
                credit_account_name: confirmData.credit_account_name
            },
            showSuggestions: true,
            suggestions: [
                'Show recent transactions',
                'Financial summary',
                'Show accounts'
            ]
        });

    } catch (insertErr) {
        await conn.rollback();
        conn.release();
        console.error('INSERT failed:', insertErr.message);
        return res.status(500).json({
            response_type: "general",
            response: "❌ Transaction could not be posted. Please try again.",
            error: insertErr.message
        });
    }
}

module.exports = { handleChat };