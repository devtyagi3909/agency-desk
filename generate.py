import os

os.system("rm -f backend/main.py backend/models.py backend/tests/test_isolation.py")
os.makedirs("backend/routers", exist_ok=True)
os.makedirs("backend/tests", exist_ok=True)
os.makedirs("frontend", exist_ok=True)
print("Files prepared")
