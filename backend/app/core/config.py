import os

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "unified_bms-unified_bms-demo-secret-2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 480
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    CORS_ORIGINS = ["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"]
    
    # NEW: Database connection string (Replace with your Neon/Supabase URL in production)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://user:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

settings = Settings()