from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str = "Hindi"
    password: str = Field(min_length=6)

    # Lets the artisan recover the account if they forget their password.
    security_question: str
    security_answer: str = Field(min_length=2)

    business_name: str
    craft_category: str
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class BusinessOut(BaseModel):
    id: int
    business_name: str
    craft_category: str
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    slug: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str
    business: Optional[BusinessOut] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    preferred_language: Optional[str] = None
    business_name: Optional[str] = None
    craft_category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    """Step 1: the artisan tells us their phone number, and we tell them
    which security question they chose when registering."""
    phone: str


class SecurityQuestionResponse(BaseModel):
    question_id: str
    question_en: str
    question_hi: str


class ResetPasswordRequest(BaseModel):
    """Step 2: they answer the question and set a new password."""
    phone: str
    answer: str
    new_password: str = Field(min_length=6)
