"""Unified Building Energy Intelligence Platform — Yuva Yodha Challenge 02."""
from flask import Flask, jsonify, request
from flask_cors import CORS
from app.core.config import settings
from app.api.auth import auth_bp
from app.api.bff import bff_bp
from app.modules.occupancy_hvac.router import occupancy_bp
from app.modules.digital_twin.router import digital_twin_bp
from app.modules.fault_detection.router import fault_bp
from app.modules.grid_solar.router import grid_bp
from app.modules.xai_nlq.router import xai_bp
from app.modules.tenant_gamification.router import tenant_bp

def _cors_origin_allowed(origin: str) -> bool:
    """Allow exact matches, localhost, and any *.vercel.app wildcard domain."""
    if not origin:
        return False
        
    # Allow local development origins
    if "localhost" in origin or "127.0.0.1" in origin:
        return True
        
    # Check explicitly allowed origins from settings
    allowed = getattr(settings, "CORS_ORIGINS", [])
    if origin in allowed:
        return True
        
    frontend_url = getattr(settings, "FRONTEND_URL", None)
    if frontend_url and origin.rstrip("/") == frontend_url.rstrip("/"):
        return True
        
    # Allow all Vercel preview and production deployments
    if origin.startswith("https://") and ".vercel.app" in origin:
        return True
        
    return False

def create_app():
    app = Flask(__name__)
    
    # Initialize CORS openly, we will restrict securely via after_request
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Clean CORS header injection (Restored from Vasudha)
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin and _cors_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            
        # Fast response for OPTIONS preflight requests
        if request.method == "OPTIONS":
            response.status_code = 200
        return response

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(bff_bp, url_prefix="/api/v1/bff")
    app.register_blueprint(occupancy_bp, url_prefix="/api/v1/occupancy")
    app.register_blueprint(digital_twin_bp, url_prefix="/api/v1/digital-twin")
    app.register_blueprint(fault_bp, url_prefix="/api/v1/faults")
    app.register_blueprint(grid_bp, url_prefix="/api/v1/grid-solar")
    app.register_blueprint(xai_bp, url_prefix="/api/v1/xai")
    app.register_blueprint(tenant_bp, url_prefix="/api/v1/tenant")

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "unified-bms", "version": "1.2.0", "challenge": "02-smart-buildings"})

    @app.get("/")
    def root():
        return jsonify({
            "name": "Unified Building Energy Intelligence Platform",
            "event": "Yuva Yodha Energy Tech Hackathon",
            "track": "Challenge 02 — Smart Buildings",
            "sponsor": "Schneider Electric",
            "health": "/health",
            "api": "/api/v1",
        })

    return app

app = create_app()