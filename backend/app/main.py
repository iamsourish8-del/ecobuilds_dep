"""Unified Building Energy Intelligence Platform — Yuva Yodha Challenge 02."""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from app.core.config import settings
from app.core.models import db

from app.api.auth import auth_bp
from app.api.bff import bff_bp
from app.api.admin import admin_bp
from app.modules.occupancy_hvac.router import occupancy_bp
from app.modules.digital_twin.router import digital_twin_bp
from app.modules.fault_detection.router import fault_bp
from app.modules.grid_solar.router import grid_bp
from app.modules.xai_nlq.router import xai_bp
from app.modules.tenant_gamification.router import tenant_bp

def _cors_origin_allowed(origin: str) -> bool:
    if not origin: return False
    if "localhost" in origin or "127.0.0.1" in origin: return True
    allowed = getattr(settings, "CORS_ORIGINS", [])
    if origin in allowed: return True
    frontend_url = getattr(settings, "FRONTEND_URL", None)
    if frontend_url and origin.rstrip("/") == frontend_url.rstrip("/"): return True
    if origin.startswith("https://") and ".vercel.app" in origin: return True
    return False

def create_app():
    app = Flask(__name__)
    
    # --- CLOUD & LOCAL DATABASE ROUTING ---
    # Retrieve Render's environment variable
    database_url = os.environ.get("DATABASE_URL")
    
    if database_url:
        # Fix Supabase's 'postgres://' connection string for SQLAlchemy compatibility
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Fallback to local settings when running locally
        app.config['SQLALCHEMY_DATABASE_URI'] = settings.SQLALCHEMY_DATABASE_URI
        
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = settings.SQLALCHEMY_TRACK_MODIFICATIONS
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin and _cors_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        if request.method == "OPTIONS": response.status_code = 200
        return response

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(bff_bp, url_prefix="/api/v1/bff")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(occupancy_bp, url_prefix="/api/v1/occupancy")
    app.register_blueprint(digital_twin_bp, url_prefix="/api/v1/digital-twin")
    app.register_blueprint(fault_bp, url_prefix="/api/v1/faults")
    app.register_blueprint(grid_bp, url_prefix="/api/v1/grid-solar")
    app.register_blueprint(xai_bp, url_prefix="/api/v1/xai")
    app.register_blueprint(tenant_bp, url_prefix="/api/v1/tenant")

    @app.get("/api/v1/keepalive")
    def keepalive():
        return jsonify({"status": "awake", "service": "ecobuilds-bms"})

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "unified-bms", "version": "1.2.0"})

    @app.get("/")
    def root():
        return jsonify({"name": "EcoBuilds Platform", "health": "/health", "api": "/api/v1"})

    return app

app = create_app()