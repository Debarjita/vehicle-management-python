# microservices/organization-service/main.py
from fastapi import FastAPI, HTTPException, Header
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from typing import Optional, List
import os

app = FastAPI(title="Organization Service", version="1.0.0")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345@localhost/vms_org")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    account = Column(String)
    website = Column(String)
    fuel_reimbursement_policy = Column(String, default="1000")
    speed_limit_policy = Column(String)
    parent_id = Column(Integer, ForeignKey("organizations.id"))
    
    children = relationship("Organization", cascade="all, delete-orphan")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "organization"}

@app.get("/organizations")
async def get_organizations(
    x_user_id: int = Header(...),
    x_user_role: str = Header(...),
    db: Session = next(get_db())
):
    if x_user_role not in ["ADMIN", "ORG_MANAGER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Root organizations (no parent)
    orgs = db.query(Organization).filter(Organization.parent_id.is_(None)).all()
    
    def serialize_org(org):
        return {
            "id": org.id,
            "name": org.name,
            "account": org.account,
            "website": org.website,
            "fuel_reimbursement_policy": org.fuel_reimbursement_policy,
            "speed_limit_policy": org.speed_limit_policy,
            "parent_id": org.parent_id,
            "children": [serialize_org(child) for child in org.children]
        }
    
    return [serialize_org(org) for org in orgs]

@app.post("/organizations")
async def create_organization(
    org_data: dict,
    x_user_id: int = Header(...),
    x_user_role: str = Header(...),
    db: Session = next(get_db())
):
    if x_user_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can create organizations")
    
    # Check if organization name already exists
    existing = db.query(Organization).filter(Organization.name == org_data["name"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization name already exists")
    
    new_org = Organization(
        name=org_data["name"],
        account=org_data["account"],
        website=org_data["website"],
        fuel_reimbursement_policy=org_data.get("fuel_reimbursement_policy", "1000"),
        speed_limit_policy=org_data.get("speed_limit_policy"),
        parent_id=org_data.get("parent_id")
    )
    
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    return {"message": "Organization created", "id": new_org.id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)