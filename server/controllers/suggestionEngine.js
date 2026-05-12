// suggestionEngine.js
// ─────────────────────────────────────────────────────────────────
// Yeh file har response ke saath 2-3 relevant follow-up suggestions
// generate karta hai. Suggestions intent aur filters ke basis par
// dynamically banti hain — static list nahi hai.
//
// Kyun alag file?
// aiController.js already bohat bara hai. Suggestion logic alag
// rakhne se dono files focused rehti hain — ek responsibility each.
// Future mein suggestions improve karna ho toh sirf yeh file touch.
// ─────────────────────────────────────────────────────────────────

// ── Main function ─────────────────────────────────────────────────
// Parameters:
//   intent      = "financial_summary" | "data_query" | "add_transaction" | "faq"
//   filters     = { dates: [...], amounts: [...] }  parsed filters from AI
//   result_type = "transactions" | "accounts" | "financial_summary" | etc
//   extra       = optional extra context (e.g. period string)
//
// Returns: Array of 2-3 suggestion strings
// ─────────────────────────────────────────────────────────────────

function getSuggestions(intent, filters = {}, result_type = '', extra = {}) {

    // Period string nikalo agar date filter tha
    // "2026-01" → "in January"
    // "2026" → "this year"
    // "" → "" (no date context)
    const period = _buildPeriodLabel(filters.dates);

    // Intent ke basis par suggestions choose karo
    switch (intent) {

        // ── Financial Summary ke baad ─────────────────────────────
        // User ne summary dekhi — ab detailed data dekhna chahega
        case 'financial_summary':
            return _buildSummarysuggestions(period, extra);

        // ── Transaction list ke baad ──────────────────────────────
        case 'data_query':
            if (result_type === 'transactions') {
                return _buildTransactionSuggestions(period, filters);
            }
            if (result_type === 'accounts') {
                return _buildAccountSuggestions();
            }
            return _buildDefaultSuggestions();

        // ── Transaction post ke baad ──────────────────────────────
        // User ne transaction post kiya — verification dekhna chahega
        case 'add_transaction':
            return [
                period
                    ? `Show transactions ${period}`
                    : 'Show recent transactions',
                'Financial summary',
                'Show accounts'
            ];

        // ── FAQ ke baad ───────────────────────────────────────────
        // User ne concept seekha — related concept ya data dekhna chahega
        case 'faq':
            return [
                'What is double entry',
                'Financial summary',
                'Show transactions'
            ];

        default:
            return _buildDefaultSuggestions();
    }
}

// ── Failure suggestions ───────────────────────────────────────────
// Yeh tab use hoti hain jab query fail ho
// User ko relevant alternatives dikhao — "I don't know" nahi
//
// Parameters:
//   failed_query = jo query fail hui (hint ke liye)
// Returns: Array of helpful suggestion strings
// ─────────────────────────────────────────────────────────────────

function getFailureSuggestions(failed_query = '') {
    const q = failed_query.toLowerCase();

    // Query mein kuch keywords hain?
    // Unke basis par relevant suggestions do
    if (q.includes('transaction') || q.includes('record') || q.includes('payment')) {
        return [
            'Show transactions',
            'Show transactions in January',
            'Financial summary'
        ];
    }

    if (q.includes('account') || q.includes('balance') || q.includes('ledger')) {
        return [
            'Show accounts',
            'Show transactions',
            'Financial summary'
        ];
    }

    if (q.includes('profit') || q.includes('income') ||
        q.includes('expense') || q.includes('summary')) {
        return [
            'Financial summary',
            'Profit this month',
            'Total income this year'
        ];
    }

    if (q.includes('add') || q.includes('post') ||
        q.includes('record') || q.includes('paid')) {
        return [
            'Add rent expense 25000 paid from cash',
            'Add salary 50000 from bank',
            'Show accounts'
        ];
    }

    // Koi keyword nahi mila — generic helpful suggestions
    return _buildDefaultSuggestions();
}

// ── No records found suggestions ─────────────────────────────────
// Jab query sahi ban gayi lekin DB mein koi record nahi mila
// User ko alternative filters suggest karo
//
// Parameters:
//   result_type = "transactions" | "accounts"
//   filters     = jo filters apply hue the
// ─────────────────────────────────────────────────────────────────

function getNoRecordsSuggestions(result_type = '', filters = {}) {

    if (result_type === 'transactions') {
        const suggestions = ['Show all transactions'];

        // Agar date filter tha — without date suggest karo
        if (filters.dates && filters.dates.length > 0) {
            suggestions.push('Show transactions this year');
        }

        // Agar amount filter tha — lower amount suggest karo
        if (filters.amounts && filters.amounts.length > 0) {
            suggestions.push('Show all transactions');
        }

        suggestions.push('Financial summary');
        return suggestions.slice(0, 3);
    }

    if (result_type === 'accounts') {
        return [
            'Show all accounts',
            'Show transactions',
            'Financial summary'
        ];
    }

    return _buildDefaultSuggestions();
}


// ════════════════════════════════════════════════════════════════
// PRIVATE HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function _buildSummarysuggestions(period, extra) {
    const suggestions = [];

    // Period-specific drill-down
    if (period) {
        suggestions.push(`Show transactions ${period}`);
        suggestions.push(`Show income accounts`);
    } else {
        suggestions.push('Profit this month');
        suggestions.push('Profit this year');
    }

    suggestions.push('Show expense accounts');
    return suggestions.slice(0, 3);
}

function _buildTransactionSuggestions(period, filters) {
    const suggestions = [];

    // Agar date filter tha — same period ka summary suggest karo
    if (period) {
        suggestions.push(`Financial summary ${period}`);
        suggestions.push(`Show transactions above 10000 ${period}`);
    } else {
        suggestions.push('Show transactions this month');
        suggestions.push('Financial summary');
    }

    suggestions.push('Show accounts');
    return suggestions.slice(0, 3);
}

function _buildAccountSuggestions() {
    return [
        'Show transactions',
        'Financial summary',
        'Profit this month'
    ];
}

function _buildDefaultSuggestions() {
    return [
        'Show transactions',
        'Financial summary',
        'Show accounts'
    ];
}

// Date array se human-readable period string banao
// [{"type":"month","value":"2026-01"}] → "in January 2026"
// [{"type":"year","value":"2026"}] → "this year"
// [] → ""
function _buildPeriodLabel(dates = []) {
    if (!dates || dates.length === 0) return '';

    const d = dates[0];

    if (d.type === 'month') {
        // "2026-01" → "January 2026"
        const [year, month] = d.value.split('-');
        const monthNames = [
            '', 'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'
        ];
        return `in ${monthNames[parseInt(month)]} ${year}`;
    }

    if (d.type === 'year') {
        const currentYear = new Date().getFullYear().toString();
        return d.value === currentYear ? 'this year' : `in ${d.value}`;
    }

    if (d.type === 'range') {
        return `from ${d.start} to ${d.end}`;
    }

    if (d.type === 'exact') {
        return `on ${d.value}`;
    }

    return '';
}


module.exports = {
    getSuggestions,
    getFailureSuggestions,
    getNoRecordsSuggestions
};