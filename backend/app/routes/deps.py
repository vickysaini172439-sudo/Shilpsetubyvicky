from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

# This tells FastAPI's auto-generated docs page (/docs) where a login
# request would go. Our frontend calls /auth/login directly instead of
# using this, but FastAPI's security tooling still needs a tokenUrl.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Reads the "Authorization: Bearer <token>" header sent by the frontend,
    decodes it, and returns the matching User row - or raises a 401 error
    if the token is missing, invalid, or expired.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
    )
    if not token:
        raise credentials_error

    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error

    return user
