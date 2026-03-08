from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Aapki existing files (Make sure ye ai_engine folder mein hon)
from parser import FinanceParser
from query_builder import SQLGenerator

app = Flask(__name__)
CORS(app)

# AI Models ko globally load karein taake response fast ho
ai_parser = FinanceParser()

@app.route('/generate-sql', methods=['POST'])
def generate_sql():
    try:
        data = request.get_json()
        user_query = data.get('query', '')
        business_id = data.get('business_id', 1)

        # 1. Intent aur Entities extract karein
        parsed_data = ai_parser.parse_query(user_query)
        
        # 2. SQL Query generate karein
        generator = SQLGenerator(business_id=business_id)
        sql = generator.generate_sql(parsed_data)
        
        return jsonify({
            "status": "success",
            "sql": sql,
            "intent": parsed_data.get('intent')
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)