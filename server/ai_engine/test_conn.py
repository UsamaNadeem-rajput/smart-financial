import mysql.connector
import os
from dotenv import load_dotenv

# .env file load karna
load_dotenv()

try:
    print("Connecting to OrangeHost MariaDB...")
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT"))
    )
    if connection.is_connected():
        print("✅ SUCCESS: Connected to Live Database!")
        connection.close()
except Exception as e:
    print(f"❌ ERROR: Could not connect. Details: {e}")