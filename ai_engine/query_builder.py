import metadata
from metadata import DB_KNOWLEDGE, ACCOUNT_TYPE_IDS

class SQLGenerator:
    def __init__(self, business_id):
        self.business_id = int(business_id)

    def generate_sql(self, parsed_data):
        intent = parsed_data.get("intent", "data_query")

        if intent == "financial_summary":
            return self._build_summary_sql(parsed_data)

        if intent == "add_transaction":
            return {
                "type":        "add_transaction",
                "amount":      parsed_data.get("amount"),
                "debit_hint":  parsed_data.get("debit_hint"),
                "credit_hint": parsed_data.get("credit_hint"),
                "description": parsed_data.get("description", "Transaction"),
                "transaction_date": parsed_data.get("transaction_date")
            }

        # ── Normal Data Query ─────────────────────────────────────
        tables  = parsed_data.get('intent_tables', [])
        filters = parsed_data.get('filters', {})

        if not tables:
            return None

        target_table = None
        if 'TRANSACTIONS' in tables:
            target_table = 'transactions'
        elif 'ACCOUNTS' in tables:
            target_table = 'accounts'

        if not target_table:
            return None

        amounts      = filters.get('amounts', [])
        account_name = filters.get('account_name')
        needs_join   = bool(account_name) and target_table == 'transactions'

        prefix     = "t" if target_table == "transactions" else target_table
        conditions = [
            f"{prefix}.business_id = {self.business_id}",
            f"{prefix}.is_deleted = 0"
        ]

        dates = filters.get('dates', [])
        if dates:
            d   = dates[0]
            col = "t.date" if needs_join else "date"
            if d['type'] == 'month':
                conditions.append(f"{col} LIKE '{d['value']}%'")
            elif d['type'] == 'year':
                conditions.append(f"YEAR({col}) = {d['value']}")
            elif d['type'] == 'exact':
                conditions.append(f"{col} = '{d['value']}'")
            elif d['type'] == 'range':
                conditions.append(
                    f"{col} BETWEEN '{d['start']}' AND '{d['end']}'"
                )

        if amounts:
            a = amounts[0]
            if target_table == 'accounts':
                conditions.append(f"balance {a['operator']} {a['value']}")
            else:
                conditions.append(
                    f"(t.debit {a['operator']} {a['value']} "
                    f"OR t.credit {a['operator']} {a['value']})"
                )

        if account_name and needs_join:
            conditions.append(f"a.account_name LIKE '%{account_name}%'")

        where = " AND ".join(conditions)

        if target_table == 'transactions':
            # ── FIX: t.description added to SELECT ───────────────
            # Pehle description missing tha — isliye table mein
            # "—" show hota tha (aiController mein row.description
            # undefined tha → fallback '—' render hota tha)
            select_cols = """
                t.transaction_id,
                t.frontend_transaction_id,
                t.date,
                t.description,
                COALESCE(SUM(CASE WHEN te.type = 'debit'
                            THEN te.amount ELSE 0 END), 0) AS amount
            """

            if needs_join:
                sql = f"""
                    SELECT {select_cols}
                    FROM transactions t
                    LEFT JOIN transaction_entries te
                        ON t.transaction_id = te.transaction_id
                    JOIN accounts a ON te.account_id = a.account_id
                    WHERE {where}
                    AND a.account_name LIKE '%{account_name}%'
                    GROUP BY t.transaction_id,
                             t.frontend_transaction_id,
                             t.date,
                             t.description
                    ORDER BY t.date DESC
                    LIMIT 100
                """
            else:
                sql = f"""
                    SELECT {select_cols}
                    FROM transactions t
                    LEFT JOIN transaction_entries te
                        ON t.transaction_id = te.transaction_id
                    WHERE {where}
                    GROUP BY t.transaction_id,
                             t.frontend_transaction_id,
                             t.date,
                             t.description
                    ORDER BY t.date DESC
                    LIMIT 50
                """

        elif target_table == 'accounts':
            sql = f"""
                SELECT * FROM `accounts`
                WHERE {where}
                ORDER BY account_name ASC
                LIMIT 50
            """
        else:
            sql = f"SELECT * FROM `{target_table}` WHERE {where} LIMIT 50"

        return sql.strip()

    def _build_summary_sql(self, parsed_data):
        filters     = parsed_data.get('filters', {})
        dates       = filters.get('dates', [])
        income_ids  = ACCOUNT_TYPE_IDS['income']
        expense_ids = ACCOUNT_TYPE_IDS['expense']

        date_condition = ""
        if dates:
            d = dates[0]
            if d['type'] == 'month':
                date_condition = f"AND t.date LIKE '{d['value']}%'"
            elif d['type'] == 'year':
                date_condition = f"AND YEAR(t.date) = {d['value']}"
            elif d['type'] == 'exact':
                date_condition = f"AND t.date = '{d['value']}'"
            elif d['type'] == 'range':
                date_condition = (
                    f"AND t.date BETWEEN '{d['start']}' AND '{d['end']}'"
                )

        income_ids_str  = ",".join(map(str, income_ids))
        expense_ids_str = ",".join(map(str, expense_ids))

        sql_income = f"""
            SELECT COALESCE(SUM(te.amount), 0) AS total_income
            FROM transaction_entries te
            JOIN transactions t ON te.transaction_id = t.transaction_id
            JOIN accounts a ON te.account_id = a.account_id
            WHERE t.business_id = {self.business_id}
            AND t.is_deleted = 0
            AND a.type_id IN ({income_ids_str})
            AND te.type = 'credit'
            {date_condition}
        """

        sql_expense = f"""
            SELECT COALESCE(SUM(te.amount), 0) AS total_expense
            FROM transaction_entries te
            JOIN transactions t ON te.transaction_id = t.transaction_id
            JOIN accounts a ON te.account_id = a.account_id
            WHERE t.business_id = {self.business_id}
            AND t.is_deleted = 0
            AND a.type_id IN ({expense_ids_str})
            AND te.type = 'debit'
            {date_condition}
        """

        sql_count = f"""
            SELECT COUNT(*) AS total_transactions
            FROM transactions t
            WHERE t.business_id = {self.business_id}
            AND t.is_deleted = 0
            {date_condition}
        """

        if dates:
            d = dates[0]
            if   d['type'] == 'month': period = d['value']
            elif d['type'] == 'year':  period = d['value']
            elif d['type'] == 'range': period = f"{d['start']} to {d['end']}"
            elif d['type'] == 'exact': period = d['value']
            else:                      period = "All Time"
        else:
            period = "All Time"

        return {
            "type":        "financial_summary",
            "sql_income":  sql_income.strip(),
            "sql_expense": sql_expense.strip(),
            "sql_count":   sql_count.strip(),
            "period":      period
        }