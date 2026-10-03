import os
from sqlalchemy.pool import NullPool

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
    
    db_url = os.getenv("DATABASE_URL", "sqlite:///local_ecobuilds.db")
    
    # Standardize postgres protocol prefix
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    # Append TCP keepalive parameters for PostgreSQL to prevent silent SSL drops
    if "postgresql" in db_url and "keepalives" not in db_url:
        separator = "&" if "?" in db_url else "?"
        db_url += f"{separator}keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=5"
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    if "postgresql" in db_url:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "poolclass": NullPool,   # Offloads connection management to Supabase PgBouncer to eliminate dead SSL sockets
            "pool_pre_ping": True,  # Verifies connection health before executing queries
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {}

settings = Settings()