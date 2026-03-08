from parser import FinanceParser
from query_builder import SQLGenerator

# Dummy business ID for testing
CURRENT_BUSINESS_ID = 1

parser = FinanceParser()
generator = SQLGenerator(business_id=CURRENT_BUSINESS_ID)

query = "Show me bank transactions of yesterday above 5000"
parsed_data = parser.parse_query(query)
sql = generator.generate_sql(parsed_data)

print(f"User Query: {query}")
print(f"Generated SQL: {sql}")