from flask import Flask, request, jsonify
from flask_cors import CORS
import sys

sys.stdout = sys.stderr

from parser import FinanceParser
from query_builder import SQLGenerator

app = Flask(__name__)
CORS(app)

# spaCy ek baar load hoga — har request par nahi
ai_parser = FinanceParser()

@app.route('/generate-sql', methods=['POST'])
def ask_ai():
    try:
        data = request.get_json()
        user_query = data.get('query', '')
        business_id = data.get('business_id', 1)

        if not user_query:
            return jsonify({"error": "No query provided"}), 400

        parsed_data = ai_parser.parse_query(user_query)

        # FAQ shortcircuit — koi SQL nahi banta
        if parsed_data.get("intent") == "faq":
            faq_key = parsed_data.get("faq_key")
            from metadata import FAQ_KNOWLEDGE
            answer = FAQ_KNOWLEDGE.get(
                faq_key,
                "Sorry, I don't have information on that topic."
            )
            return jsonify({
                "status":     "success",
                "sql":        None,
                "intent":     "faq",
                "faq_answer": answer,
                "filters":    parsed_data.get("filters", {})
            })

        sql = None
        generator = SQLGenerator(business_id=business_id)

        try:
            sql = generator.generate_sql(parsed_data)
        except Exception as gen_error:
            import traceback
            traceback.print_exc()

        if not sql:
            return jsonify({
                "status":  "success",
                "sql":     None,
                "intent":  parsed_data.get("intent"),
                "filters": parsed_data.get("filters", {}),
                "message": "I couldn't generate a report for that."
            })

        return jsonify({
            "status":  "success",
            "sql":     sql,
            "intent":  parsed_data.get("intent"),
            # filters return karo — aiController suggestions ke liye use karta hai
            "filters": parsed_data.get("filters", {})
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error":   "Internal AI Engine Error",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    print("Smart Financial AI — Ready on port 7860")
    app.run(host='0.0.0.0', port=7860)