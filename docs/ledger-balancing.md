### Ledger Balancing Logic

This document explains how ledger balancing is computed using tables `transactions` and `transaction_entries`.

Key rules:
- Double-entry constraint: sum(debits) == sum(credits) across all entries for a business.
- Normal balances:
  - Assets, Expenses: debit-normal ⇒ closing = debits − credits.
  - Liabilities, Equity, Income: credit-normal ⇒ closing = credits − debits.

Per-ledger aggregation (All Ledgers):
```sql
SELECT 
  a.account_id,
  a.account_name,
  t.type_id,
  t.type_name,
  COALESCE(SUM(CASE WHEN te.type = 'debit'  THEN te.amount ELSE 0 END), 0) AS total_debits,
  COALESCE(SUM(CASE WHEN te.type = 'credit' THEN te.amount ELSE 0 END), 0) AS total_credits
FROM accounts a
LEFT JOIN account_types t ON a.type_id = t.type_id
LEFT JOIN transaction_entries te ON te.account_id = a.account_id
LEFT JOIN transactions tr ON tr.transaction_id = te.transaction_id
WHERE a.business_id = :business_id
  AND (tr.business_id = :business_id OR tr.business_id IS NULL)
GROUP BY a.account_id, a.account_name, t.type_id, t.type_name
ORDER BY t.type_name, a.account_name;
```

Compute closing balance per row using account type (see rules above). Totals for the page are the sum of all per-ledger debits and credits; the page is Balanced if totals are equal.

Single ledger detail with running balance:
```sql
SELECT tr.transaction_id, tr.date, tr.description, te.amount, te.type
FROM transaction_entries te
JOIN transactions tr ON tr.transaction_id = te.transaction_id
WHERE tr.business_id = :business_id AND te.account_id = :account_id
ORDER BY tr.date, tr.transaction_id, te.entry_id;
```

Running balance update rule:
- For Assets/Expenses: running += debit; running −= credit.
- For others: running += credit; running −= debit.

Closing balance for the ledger follows the same rule:
- Assets/Expenses: closing = total_debits − total_credits.
- Others: closing = total_credits − total_debits.

Endpoints added:
- GET `/api/ledger-balancing/:business_id` → list of ledgers with totals and closing balances, plus overall totals and balanced flag.
- GET `/api/ledger-balancing/:business_id/:account_id` → detailed entries with running balance and totals for a single ledger.


