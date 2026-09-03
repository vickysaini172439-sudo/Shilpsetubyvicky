from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.routes.deps import get_current_user
from app.services.ai_service import generate_catalogue

router = APIRouter(prefix="/ai", tags=["AI"])


class CatalogueRequest(BaseModel):
    raw_text: str
    product_name: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None


@router.post("/catalog")
def create_catalog(data: CatalogueRequest, current_user: User = Depends(get_current_user)):
    return generate_catalogue(
        raw_text=data.raw_text,
        product_name=data.product_name,
        category=data.category,
        material=data.material,
        craft_type=data.craft_type,
    )
