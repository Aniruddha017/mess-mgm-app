import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.profile import Profile, UserRole, UserStatus
from app.schemas import UserLogin, UserRegister, Token, ProfileOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Auto-generate user ID or use email prefix
    user_id = str(uuid.uuid4())[:8].upper()
    
    # Default: first user or admin can be active, students/managers created by demo can be active or pending approval
    # For frictionless demo, if admin role or specific demo users -> active, otherwise active for now or pending
    user_status = UserStatus.ACTIVE
    
    profile = Profile(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        dietary_pref=user_data.dietary_pref,
        status=user_status
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    access_token = create_access_token(data={"sub": profile.id, "role": profile.role, "name": profile.name})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": profile.id,
            "name": profile.name,
            "email": profile.email,
            "role": profile.role,
            "dietary_pref": profile.dietary_pref,
            "status": profile.status
        }
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status == UserStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval by the College Administrator."
        )
        
    access_token = create_access_token(data={"sub": user.id, "role": user.role, "name": user.name})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "dietary_pref": user.dietary_pref,
            "status": user.status
        }
    }

@router.get("/me", response_model=ProfileOut)
def get_me(current_user: Profile = Depends(get_current_user)):
    return current_user

