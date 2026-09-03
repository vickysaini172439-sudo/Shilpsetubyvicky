from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.schemas.user import UserOut, UpdateProfileRequest
from app.routes.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        current_user.name = data.name
    if data.email is not None:
        current_user.email = data.email
    if data.preferred_language is not None:
        current_user.preferred_language = data.preferred_language

    business = current_user.business
    if business:
        if data.business_name is not None:
            business.business_name = data.business_name
        if data.craft_category is not None:
            business.craft_category = data.craft_category
        if data.description is not None:
            business.description = data.description
        if data.location is not None:
            business.location = data.location
        if data.state is not None:
            business.state = data.state

    db.commit()
    db.refresh(current_user)
    return current_user
