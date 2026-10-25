from pymongo import MongoClient

from config import MONGO_URI

_client = None


def get_db():
    """Connects to the same MongoDB database that the Express backend uses."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client.get_default_database(default="student_expense_tracker")
