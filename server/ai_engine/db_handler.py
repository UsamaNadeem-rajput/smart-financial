import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseHandler:
    def __init__(self):
        try:
            # Connecting to your Live OrangeHost MariaDB
            self.conn = mysql.connector.connect(
                host=os.getenv("DB_HOST"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME"),
                port=int(os.getenv("DB_PORT", 3306))
            )
            self.cursor = self.conn.cursor(dictionary=True)
            print("Successfully connected to Live Database.")
        except Exception as e:
            print(f"Database Connection Failed: {str(e)}")

    def fetch_data(self, sql_query):
        try:
            self.cursor.execute(sql_query)
            return self.cursor.fetchall()
        except Exception as e:
            return f"SQL Error: {str(e)}"