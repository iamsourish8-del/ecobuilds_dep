# seed.py
from app.main import app
from app.core.models import db, User, Building, Room, Equipment
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
    
    if User.query.filter_by(email="admin@demo.com").first():
        print("Database already seeded! Skipping safe seeder.")
    else:
        print("Running initial safe seeding...")
        admin = User(
            id="admin-001",
            email="admin@demo.com",
            password_hash=generate_password_hash("admin123"),
            full_name="System Administrator",
            role="super_admin"
        )
        db.session.add(admin)
        db.session.commit()
        
        b1 = Building(id="bldg-aspiria-01", name="Aspiria Campus — Building A", city="Pune", area_m2=12500, floors=6)
        b2 = Building(id="bldg-capgemini-pune", name="Capgemini Pune Campus", city="Pune", area_m2=28000, floors=8)
        db.session.add_all([b1, b2])
        db.session.commit()

        aspiria_rooms = [
            Room(building_id=b1.id, name="Conference A", floor="1", zone="Meeting", occupied=True, temperature_c=24.1, setpoint_c=23.0, co2_ppm=620),
            Room(building_id=b1.id, name="Conference B", floor="1", zone="Meeting", occupied=False, temperature_c=26.8, setpoint_c=27.0, co2_ppm=410, energy_delta_kwh=-1.4),
            Room(building_id=b1.id, name="Reception Lobby", floor="1", zone="Public", occupied=True, temperature_c=24.5, setpoint_c=24.0, co2_ppm=580),
            Room(building_id=b1.id, name="Open Office North", floor="2", zone="Office", occupied=True, temperature_c=23.5, setpoint_c=23.0, co2_ppm=710),
        ]
        db.session.add_all(aspiria_rooms)

        fm = User(id="fm-001", email="facility@demo.com", password_hash=generate_password_hash("demo123"), full_name="Priya Sharma", role="facility_manager")
        fm.buildings.extend([b1, b2])

        tenant = User(id="tn-001", email="tenant@demo.com", password_hash=generate_password_hash("demo123"), full_name="Arjun Mehta", role="tenant")
        tenant.buildings.append(b1)
        
        maintenance = User(id="mt-001", email="maintenance@demo.com", password_hash=generate_password_hash("demo123"), full_name="Mike Tech", role="maintenance")
        maintenance.buildings.append(b1)
        
        db.session.add_all([fm, tenant, maintenance])
        db.session.commit()
        print("Seeding completed successfully!")