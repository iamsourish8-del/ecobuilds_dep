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
    
    # Get database URL from Render environment, fallback to local SQLite
    db_url = os.getenv("DATABASE_URL", "sqlite:///local_ecobuilds.db")
    
    # SQLAlchemy requires 'postgresql://' but some cloud providers set 'postgres://'
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Apply connection pooling options ONLY for PostgreSQL (Supabase) in production
    if "postgresql" in db_url:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,    # Drops dead connections gracefully
            "pool_recycle": 300,      # Refreshes connections every 5 mins
            "pool_size": 10,          # Keeps 10 warm connections ready
            "max_overflow": 20,       # Allows up to 20 overflow connections during spikes
        }
    else:
        # SQLite does not use these pooling arguments
        SQLALCHEMY_ENGINE_OPTIONS = {}

settings = Settings()