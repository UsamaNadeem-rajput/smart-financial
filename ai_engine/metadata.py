# metadata.py

# ── DB_KNOWLEDGE ──────────────────────────────────────────────────
# Maps table names to their synonyms, columns, and mandatory filters.
# parser.py uses this to detect which table the user is asking about.
# Every table has mandatory_filters — these are ALWAYS added to SQL
# regardless of what the user types. This prevents cross-tenant leaks.

DB_KNOWLEDGE = {
    "accounts": {
        "table_name": "accounts",
        "description": "Information about all accounts including banks, cash, wallets and their balances.",
        "synonyms": [
            # Direct names
            "account", "accounts",
            # Bank related
            "bank", "bank account", "bank accounts",
            # Cash related
            "cash", "cash account", "petty cash",
            # Wallet / balance
            "wallet", "balance", "balances",
            # Ledger related
            "ledger", "ledgers", "chart of accounts",
            # List queries
            "accounts list", "all accounts", "my accounts",
            "show accounts", "list accounts",
            # Urdu/common terms
            "khata", "khate",
            # Income/Expense accounts
            "income account", "income accounts",
            "expense account", "expense accounts",
            "asset account", "asset accounts",
            "liability account", "liability accounts",
        ],
        "columns": {
            "account_name": "The name or label of the account.",
            "balance": "The current total amount available in this account.",
            "description": "Additional notes about the account."
        },
        "mandatory_filters": ["is_deleted = 0", "business_id = {current_business_id}"]
    },

    "transactions": {
        "table_name": "transactions",
        "description": "Financial transactions showing movements of money in and out of the business.",
        "synonyms": [
            # Direct names
            "transaction", "transactions",
            # Records
            "record", "records", "entry", "entries",
            # Payments
            "payment", "payments", "paid", "pay",
            # Receipts
            "receipt", "receipts", "received",
            # Documents
            "bill", "bills", "invoice", "invoices",
            # History
            "history", "activity", "activities",
            "movement", "movements",
            # Journal
            "journal", "journal entry", "journal entries",
            "posting", "postings",
            # General
            "all transactions", "my transactions",
            "show transactions", "list transactions",
            "financial activity", "money movement",
            # Specific type queries
            "expense transactions", "income transactions",
            "debit transactions", "credit transactions",
            # Urdu/common terms
            "lena dena", "hisab",
        ],
        "columns": {
            "description": "Short note about what the transaction was for.",
            "date": "The calendar date when the transaction occurred.",
            "frontend_transaction_id": "The user-facing sequential transaction number."
        },
        "mandatory_filters": ["is_deleted = 0", "business_id = {current_business_id}"]
    },

    "transaction_entries": {
        "table_name": "transaction_entries",
        "description": "Detailed per-account entries linking specific accounts to debit or credit amounts.",
        "synonyms": [
            "detail", "details", "split", "splits",
            "ledger entry", "ledger entries",
            "breakdown", "line item", "line items",
            "entry detail", "entry details"
        ],
        "columns": {
            "amount": "The specific monetary value for this entry.",
            "type": "Defines if this entry is a debit or credit."
        },
        "joins": {
            "transaction_id": "transactions",
            "account_id": "accounts"
        }
    }
}


# ── ACCOUNT_SYNONYMS ──────────────────────────────────────────────
# Maps keywords a user might type → the actual account_name in the DB.
# Used by parser.py to detect which account the user is referring to.
# IMPORTANT: The values here must match your actual account names
# in the accounts table exactly (case-insensitive LIKE is used).
# Update this list to match your real account names.

ACCOUNT_SYNONYMS = {

    # ── Cash ──────────────────────────────────────────────────────
    "cash":                 "Cash",
    "cash account":         "Cash",
    "cash in hand":         "Cash",
    "petty cash":           "Petty Cash",
    "petty":                "Petty Cash",
    "small cash":           "Petty Cash",

    # ── Bank ──────────────────────────────────────────────────────
    "bank":                 "Bank",
    "bank account":         "Bank",
    "hbl":                  "HBL Bank",
    "meezan":               "Meezan Bank",
    "ubl":                  "UBL Bank",
    "mcb":                  "MCB Bank",
    "allied":               "Allied Bank",
    "habib":                "HBL Bank",

    # ── Income / Revenue ──────────────────────────────────────────
    "sales":                "Sales Revenue",
    "sale":                 "Sales Revenue",
    "revenue":              "Sales Revenue",
    "sales revenue":        "Sales Revenue",
    "income":               "Income",
    "service income":       "Service Income",
    "service revenue":      "Service Revenue",
    "consulting":           "Consulting Revenue",
    "fees":                 "Service Income",
    "fee income":           "Service Income",
    "commission":           "Commission Income",
    "other income":         "Other Income",

    # ── Expenses ──────────────────────────────────────────────────
    "rent":                 "Rent Expense",
    "rent expense":         "Rent Expense",
    "office rent":          "Rent Expense",
    "shop rent":            "Rent Expense",

    "salary":               "Salary Expense",
    "salaries":             "Salary Expense",
    "wages":                "Salary Expense",
    "wage":                 "Salary Expense",
    "payroll":              "Salary Expense",
    "staff salary":         "Salary Expense",
    "employee salary":      "Salary Expense",

    "electricity":          "Electricity Expense",
    "electricity bill":     "Electricity Expense",
    "electric":             "Electricity Expense",
    "power bill":           "Electricity Expense",
    "wapda":                "Electricity Expense",
    "k-electric":           "Electricity Expense",

    "utilities":            "Utilities Expense",
    "utility":              "Utilities Expense",
    "utility bill":         "Utilities Expense",
    "utility bills":        "Utilities Expense",

    "telephone":            "Telephone Expense",
    "phone":                "Telephone Expense",
    "phone bill":           "Telephone Expense",
    "mobile bill":          "Telephone Expense",
    "internet":             "Internet Expense",
    "internet bill":        "Internet Expense",
    "broadband":            "Internet Expense",

    "fuel":                 "Fuel Expense",
    "petrol":               "Fuel Expense",
    "diesel":               "Fuel Expense",
    "transport":            "Transport Expense",
    "transportation":       "Transport Expense",
    "travel":               "Travel Expense",
    "travelling":           "Travel Expense",

    "repair":               "Repair & Maintenance",
    "repairs":              "Repair & Maintenance",
    "maintenance":          "Repair & Maintenance",
    "repair and maintenance": "Repair & Maintenance",

    "printing":             "Printing & Stationery",
    "stationery":           "Printing & Stationery",
    "office supplies":      "Printing & Stationery",
    "supplies":             "Printing & Stationery",

    "tax":                  "Tax Expense",
    "taxes":                "Tax Expense",
    "income tax":           "Income Tax Expense",
    "sales tax":            "Sales Tax Expense",
    "withholding tax":      "Withholding Tax",

    "insurance":            "Insurance Expense",
    "depreciation":         "Depreciation Expense",
    "amortization":         "Amortization Expense",

    "advertising":          "Advertising Expense",
    "marketing":            "Marketing Expense",
    "promotion":            "Advertising Expense",

    "miscellaneous":        "Miscellaneous Expense",
    "misc":                 "Miscellaneous Expense",
    "general expense":      "General Expense",
    "other expense":        "Other Expense",
    "other expenses":       "Other Expense",

    # ── Cost of Goods Sold ────────────────────────────────────────
    "cogs":                 "Cost of Goods Sold",
    "cost of goods":        "Cost of Goods Sold",
    "cost of goods sold":   "Cost of Goods Sold",
    "purchase":             "Purchases",
    "purchases":            "Purchases",
    "buying":               "Purchases",

    # ── Fixed Assets ──────────────────────────────────────────────
    "equipment":            "Equipment",
    "machinery":            "Machinery",
    "machine":              "Machinery",
    "laptop":               "Computers",
    "computer":             "Computers",
    "computers":            "Computers",
    "server":               "Computers",
    "printer":              "Office Equipment",
    "office equipment":     "Office Equipment",
    "furniture":            "Furniture & Fixtures",
    "fixtures":             "Furniture & Fixtures",
    "vehicle":              "Vehicles",
    "vehicles":             "Vehicles",
    "car":                  "Vehicles",
    "van":                  "Vehicles",
    "land":                 "Land",
    "building":             "Building",
    "property":             "Building",

    # ── Current Assets ────────────────────────────────────────────
    "receivable":           "Accounts Receivable",
    "accounts receivable":  "Accounts Receivable",
    "debtors":              "Accounts Receivable",
    "debtor":               "Accounts Receivable",
    "customer balance":     "Accounts Receivable",

    "inventory":            "Inventory",
    "stock":                "Inventory",
    "goods":                "Inventory",
    "merchandise":          "Inventory",
    "prepaid":              "Prepaid Expenses",
    "advance":              "Advances",
    "advances":             "Advances",

    # ── Liabilities ───────────────────────────────────────────────
    "payable":              "Accounts Payable",
    "accounts payable":     "Accounts Payable",
    "creditors":            "Accounts Payable",
    "creditor":             "Accounts Payable",
    "supplier balance":     "Accounts Payable",

    "loan":                 "Loan Payable",
    "loans":                "Loan Payable",
    "bank loan":            "Bank Loan",
    "borrowing":            "Loan Payable",
    "overdraft":            "Bank Overdraft",

    "tax payable":          "Tax Payable",
    "salary payable":       "Salaries Payable",
    "accrued expenses":     "Accrued Expenses",
    "accrued":              "Accrued Expenses",

    # ── Equity ────────────────────────────────────────────────────
    "capital":              "Owner Equity",
    "equity":               "Owner Equity",
    "owner equity":         "Owner Equity",
    "owner capital":        "Owner Equity",
    "share capital":        "Share Capital",
    "drawings":             "Drawings",
    "drawing":              "Drawings",
    "withdrawal":           "Drawings",
    "retained earnings":    "Retained Earnings",
    "profit reserve":       "Retained Earnings",
}


# ── ACCOUNT_TYPE_IDS ──────────────────────────────────────────────
# Maps account category names to their type_id values in the DB.
# Used by query_builder.py to build correct financial summary SQL.
# These IDs come directly from the account_types table.
# Income  = type_id 1 (Income) + 12 (Other Incomes)
# Expense = type_id 2 (Expense) + 13 (Other Expenses) + 14 (COGS)

ACCOUNT_TYPE_IDS = {
    "income":    [1, 12],       # Income + Other Incomes
    "expense":   [2, 13, 14],   # Expense + Other Expenses + COGS
    "assets":    [3, 4, 5],     # Assets + Fixed Assets + Current Assets
    "liability": [6, 7, 8],     # Liability + Current + Non-Current
    "equity":    [9],           # Equity only
}


# ── SUMMARY_PHRASES ───────────────────────────────────────────────
# If any of these phrases appear in the user query, the intent is
# immediately classified as "financial_summary" — skipping all
# table detection logic. This is checked FIRST in parse_query().
# Add more phrases here if users commonly ask in different ways.

SUMMARY_PHRASES = [
    # Direct summary requests
    "financial summary",
    "summary",
    "financial report",
    "business summary",

    # Profit queries
    "profit",
    "net profit",
    "gross profit",
    "profit and loss",
    "p&l",
    "pnl",
    "profit loss",

    # Income queries
    "total income",
    "how much income",
    "how much earned",
    "total earnings",
    "total revenue",
    "how much revenue",

    # Expense queries
    "total expense",
    "total expenses",
    "how much spent",
    "how much expense",
    "total spending",

    # Combined
    "income and expense",
    "income vs expense",
    "income and expenses",
    "revenue and expenses",

    # Period-specific (these overlap with relative dates — both get extracted)
    "profit this month",
    "profit last month",
    "profit this year",
    "profit last year",
    "summary this month",
    "summary last month",
    "summary this year",
    "monthly summary",
    "yearly summary",
    "annual summary",
]


# ── FAQ_KNOWLEDGE ─────────────────────────────────────────────────
# Static accounting knowledge base.
# Key = keyword to match in user query (lowercase).
# Value = full English explanation to return directly.
# No SQL is generated for FAQ responses — answer comes straight
# from this dictionary. Checked SECOND in parse_query() after
# financial_summary check, before table detection.

FAQ_KNOWLEDGE = {

    "trial balance": """📚 **What is a Trial Balance?**

A Trial Balance is an accounting statement that lists the debit and credit balances of all accounts at a specific date.

**Purpose:** To verify that total debits equal total credits across all accounts.
**If they don't match:** An error exists somewhere in the posted entries.
**When prepared:** Typically at month-end or year-end before generating final reports.
**Note:** A balanced trial balance does not guarantee there are no errors — only that debits equal credits.""",

    "balance sheet": """📚 **What is a Balance Sheet?**

A Balance Sheet is a financial statement showing the financial position of a business at a specific date.

**Three main sections:**
- **Assets** — What the business owns (cash, equipment, receivables)
- **Liabilities** — What the business owes (loans, payables, accruals)
- **Equity** — The owner's stake in the business (capital minus drawings)

**Fundamental equation:** Assets = Liabilities + Equity
**Also called:** Statement of Financial Position""",

    "income statement": """📚 **What is an Income Statement?**

An Income Statement shows the revenues earned and expenses incurred during a specific accounting period.

**Calculates:** Net Profit = Total Income - Total Expenses
**Also called:** Profit & Loss Statement, P&L, Statement of Operations
**Time period:** Monthly, quarterly, or yearly — unlike a Balance Sheet which is a snapshot.""",

    "double entry": """📚 **What is Double Entry Bookkeeping?**

Double Entry is the foundation of modern accounting. Every financial transaction affects at least two accounts — one is debited and one is credited by the same amount.

**Golden Rule:** For every debit, there must be an equal credit.
**Example — Cash sale of PKR 1,000:**
  - Debit:  Cash Account     PKR 1,000  (asset increases)
  - Credit: Sales Revenue    PKR 1,000  (income increases)

**Why it matters:** Keeps the accounting equation balanced at all times.""",

    "debit credit": """📚 **What is the difference between Debit and Credit?**

| Account Type | To Increase | To Decrease |
|---|---|---|
| Assets | Debit ↑ | Credit ↓ |
| Expenses | Debit ↑ | Credit ↓ |
| Liabilities | Credit ↑ | Debit ↓ |
| Income / Revenue | Credit ↑ | Debit ↓ |
| Equity | Credit ↑ | Debit ↓ |

**Memory tip:** Assets and Expenses increase with Debit. Liabilities, Income, and Equity increase with Credit.""",

    "journal entry": """📚 **What is a Journal Entry?**

A journal entry is the first step in the accounting cycle — recording a transaction in the General Journal before posting it to individual ledgers.

**Standard format:**
  Date | Account Name       | Debit  | Credit
  -----|--------------------|--------|--------
  ...  | Debit Account      | Amount |
  ...  |   Credit Account   |        | Amount

**Rules:**
- Debit account is always written first
- Credit account is indented below
- Total debits must equal total credits in every entry""",

    "ledger": """📚 **What is a Ledger?**

A Ledger contains a separate page (or account) for every account in the chart of accounts. All journal entries are posted here.

**Types:**
- **General Ledger** — Contains all accounts of the business
- **Subsidiary Ledger** — Detailed records for specific accounts (e.g. individual customer balances)

**Purpose:** Track the running balance of each account and see all transactions affecting it.
**Ledger balancing** shows opening balance + debits - credits = closing balance.""",

    "accounts receivable": """📚 **What is Accounts Receivable?**

Accounts Receivable represents money owed TO the business by its customers — for goods or services delivered on credit.

**Account type:** Current Asset
**Normal balance:** Debit
**Example:** You deliver goods to a customer today and they will pay in 30 days — that amount is recorded in Accounts Receivable.
**Also called:** Debtors, Trade Receivables""",

    "accounts payable": """📚 **What is Accounts Payable?**

Accounts Payable represents money the business OWES to its suppliers — for goods or services received on credit.

**Account type:** Current Liability
**Normal balance:** Credit
**Example:** You receive raw materials from a supplier today and pay them in 30 days — that amount is recorded in Accounts Payable.
**Also called:** Creditors, Trade Payables""",

    "depreciation": """📚 **What is Depreciation?**

Depreciation is the systematic allocation of a fixed asset's cost over its useful life. As assets age and wear out, their value decreases — depreciation records this reduction.

**Assets that depreciate:** Machinery, vehicles, computers, furniture, buildings.
**Assets that do NOT depreciate:** Land.

**Standard journal entry:**
  - Debit:  Depreciation Expense     (income statement impact)
  - Credit: Accumulated Depreciation (balance sheet — contra asset)

**Methods:** Straight-line, reducing balance, units of production.""",

    "cash flow": """📚 **What is Cash Flow?**

Cash flow tracks the actual movement of cash into and out of a business — regardless of when income was earned or expenses were accrued.

**Three categories:**
- **Operating Activities** — Cash from day-to-day business operations (sales, salaries, rent)
- **Investing Activities** — Cash from buying or selling long-term assets (equipment, property)
- **Financing Activities** — Cash from loans, repayments, owner contributions or drawings

**Why it matters:** A business can be profitable on paper but still run out of cash.""",

    "cost of goods sold": """📚 **What is Cost of Goods Sold (COGS)?**

COGS is the direct cost of producing or purchasing the goods that were sold during a period.

**Formula:** Opening Stock + Purchases During Period - Closing Stock = COGS
**Account type:** Expense (type_id 14 in this system)
**Appears on:** Income Statement — deducted from Revenue to calculate Gross Profit.

**Gross Profit = Revenue - COGS**
**Net Profit   = Gross Profit - Operating Expenses""",

    "general journal": """📚 **What is a General Journal?**

The General Journal is the book of original entry — every transaction is first recorded here in chronological order before being posted to the ledger.

**Contains:** Date, account names, debit amount, credit amount, and a brief description.
**In this system:** Every posted transaction appears in the General Journal report automatically.""",

    "chart of accounts": """📚 **What is a Chart of Accounts?**

A Chart of Accounts is the complete list of all account names used by a business, organized by category.

**Standard categories:**
1. Assets
2. Liabilities
3. Equity
4. Income / Revenue
5. Expenses

**In this system:** Type "show accounts" to see your full chart of accounts.""",

    "working capital": """📚 **What is Working Capital?**

Working Capital measures a business's short-term financial health — its ability to pay short-term obligations.

**Formula:** Working Capital = Current Assets - Current Liabilities
**Positive working capital:** Business can pay its short-term debts — healthy.
**Negative working capital:** Business may struggle to meet short-term obligations — risky.""",

    "equity": """📚 **What is Equity?**

Equity (also called Owner's Equity or Capital) is the owner's residual interest in the business after all liabilities are deducted from assets.

**Formula:** Equity = Assets - Liabilities
**Increases when:** Owner invests capital, or business makes a profit.
**Decreases when:** Owner makes drawings, or business makes a loss.
**Components:** Capital + Retained Earnings - Drawings""",

    "opening balance": """📚 **What is an Opening Balance?**

An Opening Balance is the balance of an account at the beginning of a new accounting period — it equals the closing balance of the previous period.

**In this system:** Opening balances are posted as transactions to set up a new business or new accounting year.
**Why important:** Ensures continuity between accounting periods.""",

    "gross profit": """📚 **What is Gross Profit?**

Gross Profit is the profit earned after deducting the direct cost of goods sold from revenue — before deducting operating expenses.

**Formula:** Gross Profit = Net Revenue - Cost of Goods Sold (COGS)
**Gross Profit Margin:** (Gross Profit / Revenue) × 100
**Example:** Revenue PKR 500,000 - COGS PKR 300,000 = Gross Profit PKR 200,000""",

    "net profit": """📚 **What is Net Profit?**

Net Profit (also called Net Income or Bottom Line) is the final profit after deducting ALL expenses — including operating expenses, interest, and tax.

**Formula:** Net Profit = Total Revenue - Total Expenses
**Net Profit Margin:** (Net Profit / Revenue) × 100
**If negative:** It is called a Net Loss.""",
}


# ── ADD_TRANSACTION_PHRASES ───────────────────────────────────────
# If any of these phrases appear in the user query, the intent is
# classified as "add_transaction". Checked THIRD in parse_query()
# after financial_summary and FAQ checks.
# These must come before table detection — "add expense" contains
# "expense" which would otherwise match the accounts table.

ADD_TRANSACTION_PHRASES = [

    # ── Direct post/add/record commands ──────────────────────────
    "add transaction",    "post transaction",   "record transaction",
    "new transaction",    "create transaction",  "enter transaction",
    "add entry",          "post entry",          "record entry",
    "new entry",

    # ── Expense posting ───────────────────────────────────────────
    "add expense",        "record expense",      "post expense",
    "add an expense",     "post an expense",     "create expense",
    "enter expense",

    # ── Income posting ────────────────────────────────────────────
    "add income",         "record income",       "post income",
    "add revenue",        "record revenue",      "post revenue",
    "add sales",          "record sales",

    # ── Pay / Payment language ────────────────────────────────────
    # "paid from"  catches: "paid 5000 from cash"
    # "pay"        catches: "pay salary", "pay rent", "pay 5000"
    # "paying"     catches: "paying rent 25000"
    "paid from",          "paid using",          "paid via",
    "paid in cash",       "paid by cash",
    "pay salary",         "pay rent",            "pay wages",
    "pay expense",        "pay bill",            "pay for",
    "payment from",       "payment via",         "payment using",
    "payment of",

    # ── Purchase / Buy language ───────────────────────────────────
    "purchased from",     "purchase from",       "bought from",
    "buy from",
    "purchased",          "purchase",            "buying",
    "purchase worth",     "bought worth",

    # ── Received / Deposited ─────────────────────────────────────
    "received in",        "received into",       "deposited in",
    "deposited into",     "received from",
    "deposit",

    # ── Sell / Sales ─────────────────────────────────────────────
    "sell goods",         "sell products",       "sold goods",
    "sold products",      "goods sold",
    "sell on credit",     "sold on credit",
    "sell worth",         "sold worth",

    # ── "using X" / "via X" — credit account indicator ───────────
    "using cash",         "using bank",          "using petty cash",
    "via bank",           "via cash",            "via petty",
    "through bank",       "through cash",

    # ── Spent / Expense language ──────────────────────────────────
    "spent on",           "spend on",
    "i spent",            "we spent",

    # ── "on credit" — receivable transactions ────────────────────
    "on credit to",       "on credit",           "credit to",

    # ── Urdu / common terms ───────────────────────────────────────
    "jama karo",          "darj karo",           "likho",
    "kharch kiya",        "ada kiya",

    # ── Salary / wages specific ───────────────────────────────────
    "salary of",          "wages of",            "salary expense",
]