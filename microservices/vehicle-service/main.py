# microservices/vehicle-service/main.py
from fastapi import FastAPI, HTTPException, Header
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import requests
import os

app = FastAPI(title="Vehicle Service", version="1.0.0")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345@localhost/vms_vehicles")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True)
    license_plate = Column(String)
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    mileage = Column(Integer)
    org_id = Column(Integer)
    status = Column(String, default="AVAILABLE")
    assigned_driver_id = Column(Integer)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "vehicle"}

@app.get("/vehicles")
async def get_vehicles(
    x_user_id: int = Header(...),
    x_user_role: str = Header(...),
    db: Session = next(get_db())
):
    query = db.query(Vehicle)
    
    # Filter based on user role
    if x_user_role == "ADMIN":
        vehicles = query.all()
    elif x_user_role in ["ORG_MANAGER", "GUARD"]:
        # Get user's org_id from user service (simplified)
        vehicles = query.filter(Vehicle.org_id == 1).all()  # Placeholder
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return [
        {
            "id": v.id,
            "vin": v.vin,
            "license_plate": v.license_plate,
            "make": v.make,
            "model": v.model,
            "year": v.year,
            "status": v.status,
            "org_id": v.org_id
        }
        for v in vehicles
    ]

@app.post("/vehicles")
async def create_vehicle(
    vehicle_data: dict,
    x_user_id: int = Header(...),
    x_user_role: str = Header(...),
    db: Session = next(get_db())
):
    # Check permissions
    if x_user_role not in ["ADMIN", "ORG_MANAGER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if VIN already exists
    existing = db.query(Vehicle).filter(Vehicle.vin == vehicle_data["vin"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")
    
    new_vehicle = Vehicle(
        vin=vehicle_data["vin"],
        license_plate=vehicle_data.get("license_plate"),
        make=vehicle_data.get("make"),
        model=vehicle_data.get("model"),
        year=vehicle_data.get("year"),
        mileage=vehicle_data.get("mileage"),
        org_id=vehicle_data.get("org_id")
    )
    
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    
    return {"message": "Vehicle created", "id": new_vehicle.id}

@app.get("/decode-vin/{vin}")
async def decode_vin(vin: str):
    """Decode VIN using NHTSA API"""
    try:
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('Results'):
            result = data['Results'][0]
            return {
                "vin": vin,
                "make": result.get("Make", ""),
                "model": result.get("Model", ""),
                "year": result.get("ModelYear", ""),
                "manufacturer": result.get("Manufacturer", "")
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid VIN")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VIN decode failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)