from datetime import datetime
from flask import Blueprint, jsonify, request, g
from app.core.security import login_required, require_building_access
from app.core.models import db, User, TenantProfile

tenant_bp = Blueprint("tenant", __name__)

BADGES = [
    {"id": "b1", "name": "Early Bird", "description": "Arrived before peak load window 5 days", "icon": "sunrise"},
    {"id": "b2", "name": "Setback Star", "description": "Supported setback in empty zones", "icon": "thermometer"},
    {"id": "b3", "name": "Week Warrior", "description": "Top 20% savings this week", "icon": "trophy"},
]

CHALLENGES = [
    {"id": "c1", "title": "Friday Floor Challenge", "description": "Floor 3 vs Floor 2 — lowest kWh per person", "points": 50, "status": "active"},
    {"id": "c2", "title": "Phantom Load Hunt", "description": "Unplug idle chargers and monitors after hours", "points": 30, "status": "active"},
]

@tenant_bp.route("/<building_id>/me", methods=["GET"])
@login_required
def me(building_id):
    err = require_building_access(building_id)
    if err: return err
    
    user = User.query.get(g.user_id)
    profile = user.tenant_profile
    
    if not profile:
        profile = TenantProfile(user_id=user.id, green_points=50, energy_saved_kwh=5.0, floor_number=1)
        db.session.add(profile)
        db.session.commit()
        
    return jsonify({
        "building_id": building_id,
        "user_id": user.id,
        "display_name": user.full_name,
        "kwh_this_week": 42.5, 
        "energy_saved_kwh": profile.energy_saved_kwh,
        "co2_avoided_kg": round(profile.energy_saved_kwh * 0.82, 1),
        "vs_building_avg_pct": -18,
        "points": profile.green_points,
        "rank_on_floor": 2,
        "rank_in_building": 7,
        "badges": BADGES,
        "streak_days": 12,
        "tips_completed": 8,
        "challenges": CHALLENGES,
    })

@tenant_bp.route("/<building_id>/leaderboard", methods=["GET"])
@login_required
def leaderboard(building_id):
    if building_id != "ALL":
        err = require_building_access(building_id)
        if err: return err
        tenants = User.query.filter(User.role == 'tenant', User.buildings.any(id=building_id)).all()
    else:
        tenants = User.query.filter(User.role == 'tenant').all()

    entries = []
    for t in tenants:
        profile = t.tenant_profile
        if not profile:
            profile = TenantProfile(user_id=t.id, green_points=120, energy_saved_kwh=10.5, floor_number=1)
            db.session.add(profile)
            db.session.commit()
            
        entries.append({
            "name": t.full_name or t.email.split('@')[0],
            "energy_saved_kwh": profile.energy_saved_kwh,
            "co2_avoided_kg": round(profile.energy_saved_kwh * 0.82, 1),
            "points": profile.green_points,
            "floor": str(profile.floor_number)
        })
        
    entries.sort(key=lambda x: x["points"], reverse=True)
    for idx, item in enumerate(entries):
        item["rank"] = idx + 1

    return jsonify({
        "building_id": building_id,
        "period": "this_week",
        "entries": entries
    })

@tenant_bp.route("/<building_id>/nudges", methods=["GET"])
@login_required
def nudges(building_id):
    err = require_building_access(building_id)
    if err: return err
    return jsonify({
        "nudges": [
            {"id": "n1", "text": "Turn off AC 15 min before leaving — save ~1.2 kWh", "potential_points": 30, "category": "hvac"},
            {"id": "n2", "text": "Enable auto-dim after 7 PM in your zone", "potential_points": 20, "category": "lighting"},
        ]
    })

# --- NEW ROUTE: PERSIST GREEN POINTS TO DATABASE ---
@tenant_bp.route("/<building_id>/log-action", methods=["POST"])
@login_required
def log_action(building_id):
    err = require_building_access(building_id)
    if err: return err
    
    data = request.get_json(silent=True) or {}
    points_to_add = int(data.get("points", 0))
    
    user = User.query.get(g.user_id)
    profile = user.tenant_profile
    
    # Auto-create profile if missing
    if not profile:
        profile = TenantProfile(user_id=user.id, green_points=50, energy_saved_kwh=5.0, floor_number=1)
        db.session.add(profile)
        
    # Apply points to database
    profile.green_points += points_to_add
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": f"+{points_to_add} green credits saved to database!",
        "new_total": profile.green_points
    })