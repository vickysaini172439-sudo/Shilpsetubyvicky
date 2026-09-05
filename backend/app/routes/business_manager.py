from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.models.chat_message import ChatMessage
from app.routes.deps import get_current_user
from app.services.ai_service import business_advice, generate_business_insight

router = APIRouter(prefix="/ai", tags=["AI Business Manager"])


class ChatRequest(BaseModel):
    message: str
    product_id: Optional[int] = None


@router.post("/business-advice")
def chat(data: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = current_user.business
    product = None
    if data.product_id:
        product = db.query(Product).filter(
            Product.id == data.product_id,
            Product.business_id == (business.id if business else None),
        ).first()

    db.add(ChatMessage(
        user_id=current_user.id,
        product_id=product.id if product else None,
        role="user",
        message=data.message,
    ))

    result = business_advice(
        question=data.message,
        business_name=business.business_name if business else "your business",
        category=(product.category if product else (business.craft_category if business else None)),
        product_name=product.name if product else None,
        price=product.price if product else None,
        material=product.material if product else None,
        # Answer in whichever language the artisan registered with, so a
        # Hindi or Hinglish speaker gets advice they can actually read.
        language=current_user.preferred_language or "English",
    )

    db.add(ChatMessage(
        user_id=current_user.id,
        product_id=product.id if product else None,
        role="assistant",
        message=result["reply"],
    ))
    db.commit()

    return result


@router.get("/business-insight")
def get_business_insight(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    The 'proactive AI' feature for the dashboard: instead of waiting for the
    artisan to ask a question, this looks at their REAL current data (how
    many products, how many are still drafts, their price range, their
    digital readiness score) and returns one short, specific, unprompted
    tip - the same idea as a good in-app coach that notices things for you.
    """
    business = current_user.business
    products = db.query(Product).filter(Product.business_id == business.id).all() if business else []
    published = [p for p in products if p.status == "published"]
    drafts = [p for p in products if p.status != "published"]
    prices = [p.price for p in published if p.price]

    # Same 8-point readiness check used by /dashboard/readiness, kept in
    # sync manually since it's a small, stable list - duplicating it here
    # avoids a route-to-route import for one shared computation.
    checks = {
        "Business profile complete": bool(
            business and business.business_name and business.craft_category
            and business.description and business.location and business.state
        ),
        "Product photo uploaded": any(p.image_url for p in published),
        "Professional description": any((p.description_english or "").strip() for p in published),
        "Hindi catalogue": any(p.name_hindi and (p.description_hindi or "").strip() for p in published),
        "English catalogue": any(
            p.name and (p.description_english or "").strip() and p.category and p.material for p in published
        ),
        "Price set": any(p.price for p in published),
        "Contact details": bool(current_user.email or (business and business.whatsapp_number)),
        "Digital storefront published": bool(business and business.is_published and published),
    }
    done_count = sum(1 for v in checks.values() if v)
    readiness_score = round((done_count / len(checks)) * 100)
    next_steps = [label for label, done in checks.items() if not done]

    return generate_business_insight(
        business_name=business.business_name if business else "your business",
        category=business.craft_category if business else None,
        total_products=len(products),
        published_count=len(published),
        draft_count=len(drafts),
        avg_price=(sum(prices) / len(prices)) if prices else None,
        price_min=min(prices) if prices else None,
        price_max=max(prices) if prices else None,
        readiness_score=readiness_score,
        top_missing_step=next_steps[0] if next_steps else None,
        language=current_user.preferred_language or "English",
    )


@router.get("/business-advice/history")
def get_history(
    product_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if product_id:
        query = query.filter(ChatMessage.product_id == product_id)
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    return [{"role": m.role, "message": m.message, "created_at": m.created_at} for m in messages]
