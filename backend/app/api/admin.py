from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash
from app.core.security import login_required, roles_required
from app.core.models import db, Building, User, Room, Equipment

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/buildings", methods=["GET"])
@login_required  
def get_buildings():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify([]), 404
    if user.role == "super_admin":
        buildings = Building.query.all()
    else:
        buildings = user.buildings
    return jsonify([{"id": str(b.id), "name": b.name, "city": b.city, "area_m2": b.area_m2, "floors": b.floors} for b in buildings])

@admin_bp.route("/buildings", methods=["POST"])
@roles_required("super_admin")
def add_building():
    data = request.get_json(silent=True) or {}
    b_name = data.get("name")
    b_city = data.get("city")
    b_area = int(data.get("area_m2", 12500))
    b_floors = int(data.get("floors", 6))
    b_ecbc = bool(data.get("is_ecbc_compliant", False))

    new_bldg = Building(
        name=b_name, 
        city=b_city, 
        area_m2=b_area, 
        floors=b_floors,
        is_ecbc_compliant=b_ecbc
    )
    db.session.add(new_bldg)
    
    admin_user = User.query.get(g.user_id)
    if admin_user:
        admin_user.buildings.append(new_bldg)
        
    db.session.flush()

    for r in data.get("rooms", []):
        if r.get("name"):
            db.session.add(Room(
                building_id=new_bldg.id, name=r.get("name"), floor=str(r.get("floor", "1")),
                zone=r.get("zone", "Office"), occupied=r.get("occupied", True),
                temperature_c=float(r.get("temperature_c", 23.5)), setpoint_c=float(r.get("setpoint_c", 23.0)), co2_ppm=int(r.get("co2_ppm", 600))
            ))

    for eq in data.get("equipment", []):
        if eq.get("name"):
            db.session.add(Equipment(
                building_id=new_bldg.id, name=eq.get("name"), eq_type=eq.get("eq_type", "chiller"),
                status=eq.get("status", "green"), power_draw_kw=float(eq.get("power_draw_kw", 115.0)), baseline_kw=float(eq.get("baseline_kw", 120.0))
            ))

    db.session.commit()
    return jsonify({"status": "success", "message": f"Building '{new_bldg.name}' created!", "id": str(new_bldg.id)})

@admin_bp.route("/users", methods=["POST"])
@roles_required("super_admin")
def add_user():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    
    if User.query.filter_by(email=email).first():
        return jsonify({"status": "error", "message": "Account already exists!"}), 400
    
    new_user = User(
        email=email, password_hash=generate_password_hash(data.get("password")),
        full_name=data.get("full_name"), role=data.get("role")
    )
    
    building_ids = data.get("building_ids", [])
    if isinstance(building_ids, str): 
        building_ids = [building_ids]
        
    for b_id in building_ids:
        b = Building.query.get(b_id)
        if b: 
            new_user.buildings.append(b)
            
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"status": "success", "message": f"Account '{new_user.full_name}' created!"})

@admin_bp.route("/region/summary", methods=["GET"])
@roles_required("super_admin")
def region_summary():
    try:
        buildings = Building.query.all()
        all_users = User.query.all()
        
        # Build map with string keys to handle integer, UUID, or string IDs cleanly
        bldg_map = {str(b.id): {"facility_manager": [], "maintenance": [], "tenant": []} for b in buildings}
        
        for u in all_users:
            role = getattr(u, 'role', '')
            if role in ["facility_manager", "maintenance", "tenant"]:
                u_info = {"name": getattr(u, 'full_name', '') or getattr(u, 'email', ''), "email": getattr(u, 'email', '')}
                try:
                    user_bldgs = u.buildings
                except Exception:
                    user_bldgs = []
                for b in user_bldgs:
                    b_id = str(b.id)
                    if b_id in bldg_map:
                        bldg_map[b_id][role].append(u_info)
                        
        b_list = []
        for b in buildings:
            b_id = str(b.id)
            managers = bldg_map.get(b_id, {}).get("facility_manager", [])
            maintenance = bldg_map.get(b_id, {}).get("maintenance", [])
            tenants = bldg_map.get(b_id, {}).get("tenant", [])
            
            ecbc_compliant = bool(getattr(b, 'is_ecbc_compliant', False))
            area = int(getattr(b, 'area_m2', 0) or 0)
            is_operational = bool(managers and maintenance and tenants)
            
            b_list.append({
                "id": str(b.id),
                "name": b.name,
                "city": b.city,
                "area_m2": area,
                "managers": managers,
                "maintenance": maintenance,
                "tenants": tenants,
                "status": "Operational" if is_operational else "Not Operational",
                "ecbc_compliant": ecbc_compliant,
                "savings_ytd": int(area * 8.5)
            })
            
        compliant_count = sum(1 for b in b_list if b["ecbc_compliant"])
        compliance_pct = int((compliant_count / len(buildings)) * 100) if buildings else 0
        total_tenants = sum(len(b["tenants"]) for b in b_list)
        
        return jsonify({
            "region_name": "Global Platform Operations",
            "kpis": {
                "total_buildings": len(buildings),
                "total_tenants": total_tenants,
                "regional_savings_kwh": sum(b["savings_ytd"] for b in b_list),
                "ecbc_compliance_pct": compliance_pct,
            },
            "buildings": b_list
        })
    except Exception as e:
        return jsonify({
            "region_name": "Global Platform Operations",
            "kpis": {"total_buildings": 0, "total_tenants": 0, "regional_savings_kwh": 0, "ecbc_compliance_pct": 0},
            "buildings": [],
            "error": str(e)
        }), 200

@admin_bp.route("/buildings/<building_id>/compliance", methods=["PATCH"])
@roles_required("super_admin")
def update_building_compliance(building_id):
    data = request.get_json(silent=True) or {}
    building = Building.query.get(building_id)
    if not building:
        return jsonify({"status": "error", "message": "Building not found"}), 404
        
    building.is_ecbc_compliant = bool(data.get("is_ecbc_compliant", False))
    db.session.commit()
    return jsonify({"status": "success", "message": f"Compliance updated for {building.name}", "is_ecbc_compliant": building.is_ecbc_compliant})