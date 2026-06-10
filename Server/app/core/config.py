import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the Server directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL=os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")