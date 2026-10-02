from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional
import jwt
from flask import request, jsonify, g
from app.core.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode["type"] = "refresh"
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def get_token_from_header() -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    return auth[7:] if auth.startswith("Bearer ") else None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"detail": "Not authenticated"}), 401
        try:
            payload = decode_token(token)
            g.user_id = payload.get("sub")
            g.role = payload.get("role")
            g.building_ids = payload.get("building_ids", [])
            if not g.user_id or not g.role:
                return jsonify({"detail": "Invalid token"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"detail": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"detail": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def roles_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated(*args, **kwargs):
            if g.role not in allowed_roles:
                return jsonify({"detail": f"Role '{g.role}' not permitted"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def require_building_access(building_id: str):
    if g.role == "super_admin":
        return None
    if building_id not in g.building_ids:
        # BETTER PROFESSIONAL ERROR MESSAGE
        return jsonify({
            "detail": "You do not have permission to view this facility. Please select an authorized building from the navigation menu."
        }), 403
    return None