import os

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "unified_bms-unified_bms-demo-secret-2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 480
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    CORS_ORIGINS = ["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"]
    
    # Safe Local Fallback: Uses SQLite locally, but Render will still use its live Supabase DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///local_ecobuilds.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

settings = Settings()