import os

from dotenv import load_dotenv

# Reads fastapi-service/.env (copy .env.example to .env)
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/student_expense_tracker")

# Must match JWT_SECRET of the Express backend (same default as backend/middleware/auth.js)
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_secret_in_env")

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
