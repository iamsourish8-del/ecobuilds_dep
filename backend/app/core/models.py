from flask_sqlalchemy import SQLAlchemy
import uuid

db = SQLAlchemy()

# Junction Table for Many-to-Many User-Building relationships
user_buildings = db.Table('user_buildings',
    db.Column('user_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('building_id', db.String(36), db.ForeignKey('buildings.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(50)) # 'tenant', 'facility_manager', 'super_admin'
    
    # Relationships
    buildings = db.relationship('Building', secondary=user_buildings, backref=db.backref('users', lazy='dynamic'))
    tenant_profile = db.relationship('TenantProfile', backref='user', uselist=False)
    manager_profile = db.relationship('ManagerProfile', backref='user', uselist=False)

class Building(db.Model):
    __tablename__ = 'buildings'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(150), nullable=False)
    city = db.Column(db.String(100))
    area_m2 = db.Column(db.Integer)
    floors = db.Column(db.Integer)

class TenantProfile(db.Model):
    __tablename__ = 'tenant_profiles'
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    green_points = db.Column(db.Integer, default=0)
    energy_saved_kwh = db.Column(db.Float, default=0.0)
    floor_number = db.Column(db.Integer)

class ManagerProfile(db.Model):
    __tablename__ = 'manager_profiles'
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    receive_sms_alerts = db.Column(db.Boolean, default=False)

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = db.Column(db.String(36), db.ForeignKey('buildings.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    floor = db.Column(db.String(10))
    zone = db.Column(db.String(50))
    occupied = db.Column(db.Boolean, default=True)
    temperature_c = db.Column(db.Float, default=24.0)
    setpoint_c = db.Column(db.Float, default=23.0)
    light_level_pct = db.Column(db.Integer, default=80)
    lighting_state = db.Column(db.String(20), default="on")
    co2_ppm = db.Column(db.Integer, default=600)
    energy_delta_kwh = db.Column(db.Float, default=0.0)

class Equipment(db.Model):
    __tablename__ = 'equipment'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = db.Column(db.String(36), db.ForeignKey('buildings.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    eq_type = db.Column(db.String(50))
    status = db.Column(db.String(20), default="green")
    power_draw_kw = db.Column(db.Float, default=0.0)
    baseline_kw = db.Column(db.Float, default=0.0)
    suspected_cause = db.Column(db.String(255), nullable=True)
    recommended_action = db.Column(db.String(255), nullable=True)