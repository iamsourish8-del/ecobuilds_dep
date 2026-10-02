from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash
from app.core.security import create_access_token, create_refresh_token, login_required
from app.core.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {} if request.is_json else request.form
    email = (data.get("username") or data.get("email", "")).strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"detail": "Incorrect email or password"}), 401
        
    building_ids = [b.id for b in user.buildings]

    token_data = {"sub": user.id, "role": user.role, "building_ids": building_ids}
    
    return jsonify({
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token({"sub": user.id}),
        "token_type": "bearer", 
        "role": user.role, 
        "full_name": user.full_name,
        "building_ids": building_ids, 
        "user_id": user.id,
    })

@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user_id": g.user_id, "role": g.role, "building_ids": g.building_ids})