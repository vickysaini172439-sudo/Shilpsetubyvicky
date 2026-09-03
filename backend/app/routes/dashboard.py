from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.routes.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/readiness")
def get_readiness(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Calculates the Digital Readiness Score from REAL data - not a fake
    number. Each of these 8 checks is worth an equal share of 100 points.
    """
    business = current_user.business
    products = db.query(Product).filter(Product.business_id == business.id).all() if business else []
    published = [p for p in products if p.status == "published"]

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
    score = round((done_count / len(checks)) * 100)

    return {
        "score": score,
        "checklist": [{"label": k, "done": v} for k, v in checks.items()],
        "next_steps": [label for label, done in checks.items() if not done],
    }
