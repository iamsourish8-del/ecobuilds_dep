from flask import Blueprint, jsonify, request, g
from app.core.security import login_required, require_building_access
from app.core.models import User, Building

fault_bp = Blueprint("faults", __name__)
EQUIPMENT = [
    {"equipment_id":"ch-01","name":"Chiller-1 (Trane 250 TR)","type":"chiller","status":"yellow","power_draw_kw":142.5,"baseline_kw":125.0,"deviation_pct":14.0,"runtime_hours":18420,"suspected_cause":"Condenser fouling or low refrigerant — elevated power for 3 consecutive days","recommended_action":"Inspect condenser coils; check refrigerant charge within 7 days","last_service":"2026-06-12"},
    {"equipment_id":"ch-02","name":"Chiller-2 (Trane 250 TR)","type":"chiller","status":"green","power_draw_kw":118.0,"baseline_kw":120.0,"deviation_pct":-1.7,"runtime_hours":16200,"suspected_cause":None,"recommended_action":None,"last_service":"2026-07-01"},
    {"equipment_id":"ahu-01","name":"AHU Floor-1","type":"ahu","status":"green","power_draw_kw":22.1,"baseline_kw":21.5,"deviation_pct":2.8,"runtime_hours":9800,"suspected_cause":None,"recommended_action":None,"last_service":"2026-08-15"},
    {"equipment_id":"ahu-02","name":"AHU Floor-2","type":"ahu","status":"green","power_draw_kw":18.2,"baseline_kw":17.8,"deviation_pct":2.2,"runtime_hours":9600,"suspected_cause":None,"recommended_action":None,"last_service":"2026-08-15"},
    {"equipment_id":"ahu-03","name":"AHU Floor-3","type":"ahu","status":"green","power_draw_kw":16.5,"baseline_kw":16.2,"deviation_pct":1.9,"runtime_hours":9400,"suspected_cause":None,"recommended_action":None,"last_service":"2026-08-20"},
    {"equipment_id":"pump-01","name":"Primary CHW Pump-1","type":"pump","status":"green","power_draw_kw":11.0,"baseline_kw":10.8,"deviation_pct":1.9,"runtime_hours":20100,"suspected_cause":None,"recommended_action":None,"last_service":"2026-05-20"},
    {"equipment_id":"pump-02","name":"Secondary CHW Pump-1","type":"pump","status":"green","power_draw_kw":8.4,"baseline_kw":8.2,"deviation_pct":2.4,"runtime_hours":19800,"suspected_cause":None,"recommended_action":None,"last_service":"2026-05-20"},
    {"equipment_id":"ct-01","name":"Cooling Tower-1","type":"cooling_tower","status":"green","power_draw_kw":15.2,"baseline_kw":15.0,"deviation_pct":1.3,"runtime_hours":17500,"suspected_cause":None,"recommended_action":None,"last_service":"2026-04-10"},
    {"equipment_id":"vrf-04","name":"VRF Zone Floor-4","type":"vrf","status":"green","power_draw_kw":28.5,"baseline_kw":29.0,"deviation_pct":-1.7,"runtime_hours":7200,"suspected_cause":None,"recommended_action":None,"last_service":"2026-09-01"},
    {"equipment_id":"fa-01","name":"Fresh Air AHU","type":"ahu","status":"green","power_draw_kw":9.8,"baseline_kw":9.5,"deviation_pct":3.2,"runtime_hours":11200,"suspected_cause":None,"recommended_action":None,"last_service":"2026-07-22"},
]

@fault_bp.route("/<building_id>/health", methods=["GET"])
@login_required
def health(building_id):
    err = require_building_access(building_id)
    if err: return err
    
    # Dynamically extract all maintenance users assigned to this specific building
    maintenance_users = User.query.filter(User.role == 'maintenance', User.buildings.any(Building.id == building_id)).all()
    maintenance_contacts = [{"name": m.full_name, "email": m.email, "phone": "+91 (982) 555-0194"} for m in maintenance_users]

    return jsonify({
        "building_id": building_id,
        "healthy_count": sum(1 for e in EQUIPMENT if e["status"]=="green"),
        "warning_count": sum(1 for e in EQUIPMENT if e["status"]=="yellow"),
        "critical_count": sum(1 for e in EQUIPMENT if e["status"]=="red"),
        "equipment": EQUIPMENT,
        "maintenance_contacts": maintenance_contacts
    })

@fault_bp.route("/<building_id>/equipment/<equipment_id>/trend", methods=["GET"])
@login_required
def trend(building_id, equipment_id):
    err = require_building_access(building_id)
    if err: return err
    eq = next((e for e in EQUIPMENT if e["equipment_id"]==equipment_id), None)
    baseline = eq["baseline_kw"] if eq else 100
    elev = 14 if eq and eq["status"]=="yellow" else 0
    points = []
    for i in range(168):
        day = 16 + i // 24
        hour = i % 24
        noise = (i % 7) * 0.4
        val = baseline + (elev if i > 72 else elev * 0.3) + noise
        points.append({"ts": f"2026-09-{min(day,22):02d}T{hour:02d}:00:00", "value": round(val, 1)})
    return jsonify({"equipment_id":equipment_id,"baseline":baseline,"anomaly_threshold":round(baseline*1.1,1),"points":points})

@fault_bp.route("/<building_id>/equipment/<equipment_id>/resolve", methods=["POST"])
@login_required
def resolve_fault(building_id, equipment_id):
    if getattr(g, "role", "") != "maintenance":
        return jsonify({"detail": "Unauthorized. Only Maintenance personnel can run diagnostics and resolve faults."}), 403
        
    err = require_building_access(building_id)
    if err: return err

    eq = next((e for e in EQUIPMENT if e["equipment_id"] == equipment_id), None)
    if not eq:
        return jsonify({"error": "Equipment not found"}), 404

    eq["status"] = "green"
    eq["power_draw_kw"] = round(eq["baseline_kw"] * 1.01, 1)
    eq["deviation_pct"] = 1.0
    eq["suspected_cause"] = None
    eq["recommended_action"] = None
    eq["last_service"] = "Just now"

    return jsonify({"status": "success", "message": "Diagnostics complete."})