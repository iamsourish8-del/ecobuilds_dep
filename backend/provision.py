from app.main import app
from app.core.models import db, User, Building, Room
from werkzeug.security import generate_password_hash

def onboard_new_client():
    with app.app_context():
        # 1. Create the Building
        new_bldg = Building(name="TechPark Tower 1", city="Bangalore", area_m2=45000, floors=12)
        db.session.add(new_bldg)
        db.session.flush() # Flushes to get the new_bldg.id without committing yet
        
        # 2. Add Rooms (Usually parsed from a client's CSV file)
        rooms_to_add = [
            Room(building_id=new_bldg.id, name="Lobby", floor="G", zone="Public"),
            Room(building_id=new_bldg.id, name="Server Room", floor="1", zone="IT"),
            # ... loop through CSV to add hundreds of rooms
        ]
        db.session.add_all(rooms_to_add)
        
        # 3. Create the Facility Manager
        new_manager = User(
            email="admin@techpark.com",
            password_hash=generate_password_hash("secure_password_123"),
            full_name="Rajesh Kumar",
            role="facility_manager"
        )
        new_manager.buildings.append(new_bldg)
        db.session.add(new_manager)
        
        # 4. Save everything to PostgreSQL
        db.session.commit()
        print(f"Successfully provisioned {new_bldg.name} with manager {new_manager.email}!")

if __name__ == "__main__":
    onboard_new_client()