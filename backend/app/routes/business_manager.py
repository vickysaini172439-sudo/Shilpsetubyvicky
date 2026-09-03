from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.models.chat_message import ChatMessage
from app.routes.deps import get_current_user
from app.services.ai_service import business_advice

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
    )

    db.add(ChatMessage(
        user_id=current_user.id,
        product_id=product.id if product else None,
        role="assistant",
        message=result["reply"],
    ))
    db.commit()

    return result


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
