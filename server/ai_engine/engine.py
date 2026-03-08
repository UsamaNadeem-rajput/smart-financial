# ai_engine/engine.py
from parser import FinanceParser
from query_builder import SQLGenerator
from db_handler import DatabaseHandler

class SmartFinancialAI:
    def __init__(self, business_id):
        self.parser = FinanceParser()
        self.generator = SQLGenerator(business_id=business_id)
        self.db = DatabaseHandler()

    # ask function

    # ai_engine/engine.py

    def ask(self, user_query):
        parsed_data = self.parser.parse_query(user_query)
        print(f"DEBUG - Parsed Data: {parsed_data}") 
        
        sql = self.generator.generate_sql(parsed_data)
        print(f"DEBUG - Generated SQL: {sql}") 

        if not sql:
            return "I couldn't generate a report for that. Try asking about transactions or funds."

        raw_data = self.db.fetch_data(sql)
        
        if isinstance(raw_data, list) and len(raw_data) > 0:
            total_count = len(raw_data)
            
            # Check which table data we got (Accounts or Transactions)
            sample_row = raw_data[0]
            
            if 'account_name' in sample_row or 'name' in sample_row:
                # ACCOUNTS Table Response
                response = f"I've found **{total_count} account(s)** related to your request.\n\n"
                for row in raw_data[:5]:
                    name = row.get('account_name') or row.get('name') or "Account"
                    bal = row.get('balance') or row.get('opening_balance') or 0
                    response += f"• **{name}**: Balance: {float(bal):,.2f}\n"
            else:
                # TRANSACTIONS Table Response
                total_sum = sum([float(row.get('debit', 0) or row.get('credit', 0)) for row in raw_data])
                response = f"I found **{total_count} transaction(s)** totaling **{total_sum:,.2f}**.\n\n"
                for row in raw_data[:5]:
                    date = row.get('date', 'N/A')
                    desc = row.get('description') or "Transaction"
                    amt = row.get('debit') if row.get('debit', 0) > 0 else row.get('credit', 0)
                    response += f"• **{date}**: {desc} (Amount: {float(amt):,.2f})\n"
            
            if total_count > 5:
                response += f"\n*...and {total_count - 5} more entries.*"
            return response
            
        return "I couldn't find any matching records in the database."

# Final Test
# ai_engine/engine.py

if __name__ == "__main__":
    import sys
    # Command line args: python engine.py <business_id> <query>
    if len(sys.argv) > 2:
        bid = sys.argv[1]
        user_query = sys.argv[2]
        
        ai = SmartFinancialAI(business_id=bid)
        print(ai.ask(user_query))
    else:
        # Default test logic
        ai = SmartFinancialAI(business_id=1)
        print(ai.ask("Show all my transactions"))