from datetime import datetime
from flask import Blueprint, jsonify, request, g
from app.core.security import login_required, roles_required, require_building_access
from app.core.models import db, Room

occupancy_bp = Blueprint("occupancy", __name__)

OVERRIDE_LOG = [] # Kept for audit trail purposes

@occupancy_bp.route("/<building_id>/status", methods=["GET"])
@login_required
def get_status(building_id):
    if building_id != "ALL":
        err = require_building_access(building_id)
        if err: return err
        rooms = Room.query.filter_by(building_id=building_id).all()
    else:
        if g.role != "super_admin":
            return jsonify({"detail": "Unauthorized access to global view"}), 403
        rooms = Room.query.all()

    if not rooms:
        return jsonify({
            "building_id": building_id,
            "total_rooms": 0,
            "occupied_rooms": 0,
            "setback_rooms": 0,
            "savings_kwh_today": 0.0,
            "savings_inr_today": 0.0,
            "avg_co2_ppm": 400,
            "comfort_score": 100,
            "rooms": [],
        })

    room_list = [{
        "room_id": r.id,
        "name": r.name,
        "floor": r.floor,
        "zone": r.zone,
        "occupied": r.occupied,
        "temperature_c": r.temperature_c,
        "setpoint_c": r.setpoint_c,
        "light_level_pct": r.light_level_pct,
        "lighting_state": r.lighting_state,
        "co2_ppm": r.co2_ppm,
        "energy_delta_kwh": r.energy_delta_kwh,
    } for r in rooms]

    occupied_count = sum(1 for r in rooms if r.occupied)
    setback_count = sum(1 for r in rooms if not r.occupied)
    
    # Calculate savings dynamically based on rooms in setback
    savings = sum(abs(r.energy_delta_kwh) for r in rooms if r.energy_delta_kwh < 0)

    return jsonify({
        "building_id": building_id,
        "total_rooms": len(rooms),
        "occupied_rooms": occupied_count,
        "setback_rooms": setback_count,
        "savings_kwh_today": round(savings, 1),
        "savings_inr_today": round(savings * 7.5, 0), # Assumes 7.5 INR per kWh
        "avg_co2_ppm": round(sum(r.co2_ppm for r in rooms) / len(rooms)) if rooms else 400,
        "comfort_score": 92 if setback_count < len(rooms) else 100,
        "rooms": room_list,
    })

@occupancy_bp.route("/<building_id>/override", methods=["POST"])
@roles_required("facility_manager", "super_admin", "maintenance")
def override_room(building_id):
    if building_id != "ALL":
        err = require_building_access(building_id)
        if err: return err
        
    body = request.get_json(silent=True) or {}
    room_id = body.get("room_id")
    action = body.get("action")
    reason = body.get("reason", "Manual Manager Override")

    # Fetch the exact room from the database
    room = Room.query.filter_by(id=room_id).first()
    if not room:
        return jsonify({"status": "error", "message": "Room not found in database."}), 404

    # Apply database mutations based on the override action
    if action == "force_setback":
        room.occupied = False
        room.setpoint_c = 27.0
        room.energy_delta_kwh = -2.5 # Simulate energy saving when forcing setback
        room.lighting_state = "off"
    elif action == "restore_comfort":
        room.occupied = True
        room.setpoint_c = 23.0
        room.energy_delta_kwh = 0.0 # Clear savings metric when restoring comfort
        room.lighting_state = "on"

    db.session.commit()

    entry = {
        "room_id": room_id,
        "action": action,
        "reason": reason,
        "overridden_by": getattr(g, "user_id", "unknown"),
        "building_id": room.building_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    OVERRIDE_LOG.append(entry)

    return jsonify({
        "status": "success",
        "message": "Room updated in database successfully. UI will now reflect changes.",
        "room_state": {"occupied": room.occupied, "setpoint_c": room.setpoint_c}
    })

@occupancy_bp.route("/<building_id>/savings", methods=["GET"])
@login_required
def get_savings(building_id):
    # (Keep your existing savings chart logic here)
    if building_id != "ALL":
        err = require_building_access(building_id)
        if err: return err
    return jsonify({
        "building_id": building_id,
        "daily": [{"date":"2026-09-16","kwh":380,"inr":2660,"baseline_kwh":560}],
        "baseline_fixed_schedule_kwh_week": 4095,
        "actual_kwh_week": 2860,
        "savings_pct": 30.2,
        "by_floor": [{"floor":"1","kwh_saved":95}],
    })

@occupancy_bp.route("/<building_id>/overrides", methods=["GET"])
@login_required
def list_overrides(building_id):
    if building_id != "ALL":
        err = require_building_access(building_id)
        if err: return err
    items = [e for e in OVERRIDE_LOG if building_id == "ALL" or e.get("building_id") == building_id]
    return jsonify({"building_id": building_id, "overrides": items[-20:]})