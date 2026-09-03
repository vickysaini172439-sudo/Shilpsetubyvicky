from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.models.business import Business
from app.models.pricing import PricingRecord
from app.routes.deps import get_current_user
from app.services.pricing_service import suggest_price

router = APIRouter(prefix="/ai", tags=["Pricing"])


class PricingRequest(BaseModel):
    product_id: Optional[int] = None
    material_cost: float
    labour_cost: float
    packaging_cost: float = 0
    other_cost: float = 0
    category: str
    save: bool = False  # if true, also apply recommended_price to the product and log it


@router.post("/pricing")
def get_pricing(data: PricingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = suggest_price(
        db, data.material_cost, data.labour_cost, data.packaging_cost, data.other_cost, data.category
    )

    if data.save and data.product_id:
        product = (
            db.query(Product)
            .join(Business, Product.business_id == Business.id)
            .filter(Product.id == data.product_id, Business.user_id == current_user.id)
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")

        db.add(PricingRecord(
            product_id=product.id,
            material_cost=data.material_cost,
            labour_cost=data.labour_cost,
            packaging_cost=data.packaging_cost,
            other_cost=data.other_cost,
            suggested_min=result["suggested_min"],
            suggested_max=result["suggested_max"],
            recommended_price=result["recommended_price"],
        ))
        product.price = result["recommended_price"]
        db.commit()

    return result
