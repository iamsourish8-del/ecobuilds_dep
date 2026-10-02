from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash
from app.core.security import login_required, roles_required
from app.core.models import db, Building, User, Room, Equipment

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/buildings", methods=["GET"])
@roles_required("super_admin")
def get_buildings():
    buildings = Building.query.all()
    return jsonify([{"id": b.id, "name": b.name, "city": b.city, "area_m2": b.area_m2, "floors": b.floors} for b in buildings])

@admin_bp.route("/buildings", methods=["POST"])
@roles_required("super_admin")
def add_building():
    data = request.get_json(silent=True) or {}
    
    b_name = data.get("name")
    b_city = data.get("city")
    b_area = int(data.get("area_m2", 12500))
    b_floors = int(data.get("floors", 6))

    new_bldg = Building(
        name=b_name,
        city=b_city,
        area_m2=b_area,
        floors=b_floors
    )
    db.session.add(new_bldg)
    
    # Automatically assign building to the admin creating it
    admin_user = User.query.get(g.user_id)
    if admin_user:
        admin_user.buildings.append(new_bldg)
        
    db.session.flush() # Flush to get new_bldg.id

    # MANUALLY ADDED ROOMS FROM THE ADMIN FORM
    custom_rooms = data.get("rooms", [])
    for r in custom_rooms:
        if r.get("name"):
            db.session.add(Room(
                building_id=new_bldg.id,
                name=r.get("name"),
                floor=str(r.get("floor", "1")),
                zone=r.get("zone", "Office"),
                occupied=r.get("occupied", True),
                temperature_c=float(r.get("temperature_c", 23.5)),
                setpoint_c=float(r.get("setpoint_c", 23.0)),
                co2_ppm=int(r.get("co2_ppm", 600))
            ))

    # MANUALLY ADDED EQUIPMENT FROM THE ADMIN FORM
    custom_eqs = data.get("equipment", [])
    for eq in custom_eqs:
        if eq.get("name"):
            db.session.add(Equipment(
                building_id=new_bldg.id,
                name=eq.get("name"),
                eq_type=eq.get("eq_type", "chiller"),
                status=eq.get("status", "green"),
                power_draw_kw=float(eq.get("power_draw_kw", 115.0)),
                baseline_kw=float(eq.get("baseline_kw", 120.0))
            ))

    db.session.commit()
    
    return jsonify({"status": "success", "message": f"Building '{new_bldg.name}' created with custom rooms and equipment!", "id": new_bldg.id})

@admin_bp.route("/users", methods=["POST"])
@roles_required("super_admin")
def add_user():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    
    if User.query.filter_by(email=email).first():
        return jsonify({"status": "error", "message": "Account with this email already exists!"}), 400
    
    new_user = User(
        email=email,
        password_hash=generate_password_hash(data.get("password")),
        full_name=data.get("full_name"),
        role=data.get("role")
    )
    
    building_ids = data.get("building_ids", [])
    if isinstance(building_ids, str):
        building_ids = [building_ids]
        
    for b_id in building_ids:
        building = Building.query.get(b_id)
        if building:
            new_user.buildings.append(building)
            
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"status": "success", "message": f"Account for '{new_user.full_name}' created successfully!"})