from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Agency, Membership
import schemas
import auth

router = APIRouter()

@router.post("/register", response_model=schemas.TokenResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = auth.hash_password(user_data.password)
    user = User(email=user_data.email, hashed_password=hashed, full_name=user_data.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # We don't have a role yet without agency login, return empty tokens or mock
    access_token = auth.create_access_token(data={"sub": user.id})
    refresh_token = auth.create_refresh_token(data={"sub": user.id})
    return {"access_token": access_token, "refresh_token": refresh_token, "role": "client_user"}

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    agency = db.query(Agency).filter(Agency.slug == login_data.agency_slug).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
        
    membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.agency_id == agency.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="User not part of this agency")
        
    access_token = auth.create_access_token(data={"sub": user.id, "agency_id": agency.id, "role": membership.role.value})
    refresh_token = auth.create_refresh_token(data={"sub": user.id})
    return {"access_token": access_token, "refresh_token": refresh_token, "role": membership.role}

@router.post("/refresh")
def refresh(refresh_token: str):
    # Simplistic refresh
    payload = auth.verify_token(refresh_token)
    user_id = payload.get("sub")
    access_token = auth.create_access_token(data={"sub": user_id})
    return {"access_token": access_token}
