# metadata.py

DB_KNOWLEDGE = {
    "accounts": {
        "table_name": "accounts",
        "description": "Information about banks, cash, wallets and their balances.",
        "synonyms": ["account", "bank", "cash", "wallet", "balance", "khata", "money"],
        "columns": {
            "account_name": "The identity or label of the account.",
            "balance": "The current total amount available in this account.",
            "description": "Additional notes about the account."
        },
        "mandatory_filters": ["is_deleted = 0", "business_id = {current_business_id}"]
    },
    
    "transactions": {
        "table_name": "transactions",
        "description": "Summary of a financial movement, showing total debit and credit.",
        "synonyms": ["transaction", "transactions", "record", "records", "payment", "payments", "receipt", "receipts", "bill", "invoice", "invoices"],
        "columns": {
            "description": "Short note about the overall transaction.",
            "debit": "The total value coming into the business in this transaction.",
            "credit": "The total value going out of the business in this transaction.",
            "date": "The calendar date when the transaction occurred."
        },
        "mandatory_filters": ["is_deleted = 0", "business_id = {current_business_id}"]
    },
    
    "transaction_entries": {
        "table_name": "transaction_entries",
        "description": "Detailed ledger entries linking specific accounts to debit or credit amounts.",
        "synonyms": ["detail", "split", "ledger entry", "breakdown"],
        "columns": {
            "amount": "The specific numerical value for this part of the transaction.",
            "type": "Defines if the amount is a 'debit' or 'credit'."
        },
        "joins": {
            "transaction_id": "transactions",
            "account_id": "accounts"
        }
    }
}