import os

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "unified_bms-unified_bms-demo-secret-2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 480
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Safe Local Fallback: Uses SQLite locally, but Render will still use its live Supabase DATABASE_URL
    db_url = os.getenv("DATABASE_URL", "sqlite:///local_ecobuilds.db")
    
    # Crucial safety net: SQLAlchemy drops support for "postgres://" prefix, requires "postgresql://"
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

settings = Settings()