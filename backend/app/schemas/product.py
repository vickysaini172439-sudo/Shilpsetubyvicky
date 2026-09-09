from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProductImageOut(BaseModel):
    """One extra view of a product. Deliberately carries no bytes - only
    where to fetch them - so listing products never serialises photos."""

    id: int
    url: str

    class Config:
        from_attributes = True


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
    # One feature per line; the frontend splits on newlines.
    features: Optional[str] = None
    caption: Optional[str] = None
    stock_quantity: Optional[int] = None
    status: str
    # The cover photo - the one on every card and thumbnail.
    image_url: Optional[str] = None
    # Any further views of the same piece, in the artisan's chosen order.
    # Defaults to empty, so a product saved before galleries existed
    # deserialises exactly as it always did.
    gallery: List[ProductImageOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
