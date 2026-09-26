from database import get_engine, get_session_local
from models import User
from auth import verify_password
import sys

SessionLocal = get_session_local()
db = SessionLocal()
user = db.query(User).filter(User.email == "admin@alpha.com").first()
if not user:
    print("User not found!")
    sys.exit(1)

print("Hashed:", user.hashed_password)
print("Verify:", verify_password("password123", user.hashed_password))
