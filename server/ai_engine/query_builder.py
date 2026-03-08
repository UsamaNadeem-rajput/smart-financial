import metadata
from metadata import DB_KNOWLEDGE

class SQLGenerator:
    def __init__(self, business_id):
        self.business_id = int(business_id)

    def generate_sql(self, parsed_data):
        tables = parsed_data.get('intent_tables', [])
        filters = parsed_data.get('filters', {})
        
        if not tables:
            return None # Agar koi table hi na pehchani jaye

        # Table Mapping Logic
        target_table = None
        if 'TRANSACTIONS' in tables:
            target_table = DB_KNOWLEDGE['transactions']['table_name']
        elif 'ACCOUNTS' in tables:
            target_table = DB_KNOWLEDGE['accounts']['table_name']

        if not target_table:
            return None

        # Base Query
        base_query = f"SELECT * FROM `{target_table}`"
        
        # Security Filters (Business ID & Is Deleted)
        conditions = [
            f"business_id = {self.business_id}", 
            "is_deleted = 0"
        ]
        
        # 1. Date Logic
        if filters.get('dates'):
            date_val = str(filters['dates'][0]).lower()
            if 'yesterday' in date_val:
                conditions.append("date = CURDATE() - INTERVAL 1 DAY")
            elif 'today' in date_val:
                conditions.append("date = CURDATE()")

        # 5. Amount Logic (Table-Specific Filtering)
      
        if filters.get('amounts') and len(filters['amounts']) > 0:
            try:
                raw_amount = str(filters['amounts'][0]).replace(',', '')
                amount = float(raw_amount)
                
                if target_table == 'accounts':
                    # column name 'balance' hai
                    conditions.append(f"balance >= {amount}")
                else:
                    conditions.append(f"(debit >= {amount} OR credit >= {amount})")
                    
            except ValueError:
                pass

        # Final SQL Construction
        final_query = f"{base_query} WHERE {' AND '.join(conditions)} LIMIT 50;"
        return final_query