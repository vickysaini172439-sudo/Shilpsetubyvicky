from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str = "Hindi"
    password: str = Field(min_length=6)

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
