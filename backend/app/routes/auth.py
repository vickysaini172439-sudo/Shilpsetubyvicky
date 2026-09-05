from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.user import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    SecurityQuestionResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    hash_security_answer,
    verify_security_answer,
)
from app.services.slug_service import make_unique_slug
from app.services.security_questions import SECURITY_QUESTIONS, get_question

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")

    if get_question(data.security_question) is None:
        raise HTTPException(status_code=400, detail="Please choose one of the security questions from the list.")

    user = User(
        name=data.name,
        phone=data.phone,
        email=data.email,
        preferred_language=data.preferred_language,
        password_hash=hash_password(data.password),
        security_question=data.security_question,
        security_answer_hash=hash_security_answer(data.security_answer),
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


# ---------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------
# Why security questions and not an OTP? Our users are artisans in rural
# areas, often on shared or basic phones, sometimes with no reliable
# network. A security question works fully offline and costs nothing,
# while an SMS gateway needs credit and coverage. The answer is stored
# hashed, never in plain text.
#
# To stop someone simply guessing an answer over and over, we allow a
# limited number of wrong attempts per phone number before making them
# wait. This is kept in memory, which is fine for a single-server app.

_failed_attempts: dict[str, int] = {}
MAX_ATTEMPTS = 5


@router.get("/security-questions")
def list_security_questions():
    """The questions an artisan can choose from while registering."""
    return {"questions": SECURITY_QUESTIONS}


@router.post("/forgot-password", response_model=SecurityQuestionResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Step 1: given a phone number, return the security question that
    account chose, so they can prove who they are."""
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone number.")

    if not user.security_question or not user.security_answer_hash:
        raise HTTPException(
            status_code=400,
            detail=(
                "This account was created before security questions were added, "
                "so it cannot be recovered automatically. Please register again "
                "or contact support."
            ),
        )

    if _failed_attempts.get(data.phone, 0) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect answers. Please try again later.",
        )

    question = get_question(user.security_question)
    if question is None:
        raise HTTPException(status_code=400, detail="This account's security question is no longer available.")

    return SecurityQuestionResponse(
        question_id=question["id"],
        question_en=question["question_en"],
        question_hi=question["question_hi"],
    )


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Step 2: check the answer, then set the new password."""
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone number.")

    if _failed_attempts.get(data.phone, 0) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect answers. Please try again later.",
        )

    if not verify_security_answer(data.answer, user.security_answer_hash):
        _failed_attempts[data.phone] = _failed_attempts.get(data.phone, 0) + 1
        remaining = MAX_ATTEMPTS - _failed_attempts[data.phone]
        detail = "That answer is not correct."
        if remaining > 0:
            detail += f" You have {remaining} attempt(s) left."
        raise HTTPException(status_code=401, detail=detail)

    user.password_hash = hash_password(data.new_password)
    db.commit()
    _failed_attempts.pop(data.phone, None)  # clear the counter on success

    return {"message": "Your password has been reset. You can now log in with your new password."}
