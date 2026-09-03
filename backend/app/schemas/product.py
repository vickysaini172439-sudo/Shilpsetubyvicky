from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductOut(BaseModel):
    id: int
    name: str
    name_hindi: Optional[str] = None
    description_english: Optional[str] = None
    description_hindi: Optional[str] = None
    material: Optional[str] = None
    category: Optional[str] = None
    craft_type: Optional[str] = None
    price: Optional[float] = None
    status: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
