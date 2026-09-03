import os
from pathlib import Path
from dotenv import load_dotenv

# Load variables from the ".env" file in backend/ into the environment,
# so os.environ.get(...) below can see them.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
AI_API_KEY = os.environ.get("AI_API_KEY", "")
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true" or not AI_API_KEY

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days - fine for a hackathon demo
