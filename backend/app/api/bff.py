from flask import Blueprint, jsonify, g
from app.core.security import login_required, require_building_access
from app.core.models import Building

bff_bp = Blueprint("bff", __name__)

@bff_bp.route("/buildings/lookup", methods=["GET"])
@login_required
def buildings_lookup():
    """Allows any authenticated user to fetch names of buildings they are authorized to see."""
    if g.role == "super_admin":
        buildings = Building.query.all()
    else:
        buildings = Building.query.filter(Building.id.in_(g.building_ids)).all()
    return jsonify([{"id": b.id, "name": b.name, "city": b.city} for b in buildings])

def _safe_modules():
    return {
        "occupancy_hvac": {
            "status": "healthy",
            "occupied_rooms": 14,
            "total_rooms": 24,
            "savings_kwh_today": 412,
            "label": "14/24 occupied · 412 kWh saved",
        },
        "digital_twin": {
            "status": "warning",
            "epi": 148,
            "target_epi": 120,
            "label": "EPI 148 vs ECBC 120 · 4 retrofit options",
        },
        "fault_detection": {
            "status": "warning",
            "healthy": 9,
            "warning": 1,
            "critical": 0,
            "label": "1 warning — Chiller-1 (+14%)",
        },
        "grid_solar": {
            "status": "healthy",
            "self_consumption_pct": 72,
            "battery_soc_pct": 68,
            "label": "72% self-consumption · Battery 68%",
        },
        "xai": {
            "status": "healthy",
            "recent_explanations": 18,
            "label": "18 decisions explained today",
        },
        "tenant": {
            "status": "healthy",
            "active_participants": 64,
            "label": "64 tenants engaged this week",
        },
    }

@bff_bp.route("/dashboard-summary/<building_id>", methods=["GET"])
@login_required
def dashboard_summary(building_id):
    # Block tenants from accessing facility command center metrics
    if g.role == "tenant":
        return jsonify({
            "detail": "Access restricted. Tenants can only view personal metrics and challenges within the Tenant Hub."
        }), 403

    if building_id != "ALL":
        err = require_building_access(building_id)
        if err:
            return err
        building = Building.query.filter_by(id=building_id).first()
        b_name = building.name if building else building_id
        b_city = building.city if building else "—"
        b_area = building.area_m2 if building else 0
        b_floors = building.floors if building else 0
    else:
        if g.role != "super_admin":
            return jsonify({"detail": "Unauthorized access to global view"}), 403
        b_name = "Global Portfolio — All Buildings"
        b_city = "Multi-Region"
        b_area = 40500
        b_floors = 14

    return jsonify(
        {
            "building_id": building_id,
            "building_name": b_name,
            "city": b_city,
            "area_m2": b_area,
            "floors": b_floors,
            "timestamp": "2026-09-22T12:00:00Z",
            "kpis": {
                "energy_today_kwh": 5526 if building_id == "ALL" else 1842,
                "savings_today_kwh": 1236 if building_id == "ALL" else 412,
                "savings_today_inr": 8652 if building_id == "ALL" else 2884,
                "savings_pct_week": 31.9,
                "co2_avoided_kg": 1014 if building_id == "ALL" else 338,
                "peak_demand_kw": 858 if building_id == "ALL" else 286,
                "self_consumption_pct": 72,
                "open_faults": 3 if building_id == "ALL" else 1,
                "occupied_pct": 58,
            },
            "modules": _safe_modules(),
            "active_alerts": [
                {
                    "id": "a1",
                    "module": "fault_detection",
                    "severity": "yellow",
                    "message": f"[{b_name}] Chiller power draw +14% above baseline — inspect condenser",
                    "timestamp": "2026-09-22T08:15:00Z",
                },
            ],
            "hourly_load": [
                {
                    "hour": h,
                    "kwh": round(
                        (40
                        + (35 if 9 <= h <= 17 else 10)
                        + (h % 3) * 4
                        + (12 if h == 14 else 0)) * (3 if building_id == "ALL" else 1),
                        1,
                    ),
                }
                for h in range(24)
            ],
            "performance_pillars": {
                "energy_saved_pct_week": 31.9,
                "comfort_score": 92,
                "cooling_water_status": "Cooling-aware",
                "retrofit_status": "ECBC gap tracked",
                "occupied_pct": 58,
            },
            "standards_note": "ECBC baselines, occupant comfort, kWh and peak-demand reduction",
        }
    )