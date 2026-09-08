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
from app.services.ai_service import pricing_reasoning

router = APIRouter(prefix="/ai", tags=["Pricing"])


class PricingRequest(BaseModel):
    product_id: Optional[int] = None
    material_cost: float
    labour_cost: float
    packaging_cost: float = 0
    other_cost: float = 0
    category: str
    # How many pieces the artisan is making in this batch. Artisans think
    # in batches ("I'm making twenty of these for the mela"), not in single
    # abstract units, and a shop asking for twenty expects a different rate
    # from one walk-in buyer. Defaults to 1 so older clients still work.
    quantity: int = 1
    save: bool = False  # if true, also apply recommended_price to the product and log it


@router.post("/pricing")
def get_pricing(data: PricingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = suggest_price(
        db, data.material_cost, data.labour_cost, data.packaging_cost, data.other_cost,
        data.category, quantity=data.quantity,
    )

    # Load the product first (not only when saving) so the AI's second
    # opinion can name the actual item and material instead of reasoning
    # about an anonymous "handmade product".
    product = None
    if data.product_id:
        product = (
            db.query(Product)
            .join(Business, Product.business_id == Business.id)
            .filter(Product.id == data.product_id, Business.user_id == current_user.id)
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")

    # The AI judges the number the maths produced - is this realistic for
    # this craft in the real market? Failure here is non-fatal by design:
    # pricing_reasoning() swallows its own errors and returns None, so the
    # artisan always still gets their price.
    ai = pricing_reasoning(
        product_name=product.name if product else "",
        category=data.category,
        material=(product.material if product else "") or "",
        quantity=result["quantity"],
        production_cost=result["production_cost"],
        recommended_price=result["recommended_price"],
        suggested_min=result["suggested_min"],
        suggested_max=result["suggested_max"],
        margin_percent=result["margin_percent"],
        profit_per_unit=result["profit_per_unit"],
        language=current_user.preferred_language or "English",
    )
    result["ai_reasoning"] = ai.get("reasoning")
    result["ai_mode"] = ai.get("ai_mode", "demo")
    result["ai_provider_label"] = ai.get("ai_provider_label")

    if data.save and product:
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
