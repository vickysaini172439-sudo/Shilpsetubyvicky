from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.services.slug_service import make_unique_slug

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")

    user = User(
        name=data.name,
        phone=data.phone,
        email=data.email,
        preferred_language=data.preferred_language,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.flush()  # assigns user.id without fully committing yet

    business = Business(
        user_id=user.id,
        business_name=data.business_name,
        craft_category=data.craft_category,
        description=data.description,
        location=data.location,
        state=data.state,
        slug=make_unique_slug(db, data.business_name),
    )
    db.add(business)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect phone number or password.")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)
