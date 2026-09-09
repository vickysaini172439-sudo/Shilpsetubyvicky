import io
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import qrcode

from app.database.db import get_db
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.schemas.product import ProductOut
from app.routes.deps import get_current_user
from app.config import FRONTEND_URL
from app.services.stored_image import prepare_image, ImageRejected, ALLOWED_UPLOAD_TYPES

# Two routers in one file: "business_router" is for the LOGGED-IN artisan
# managing their own storefront settings; "store_router" is PUBLIC - no
# login required - since anyone with the link/QR code should be able to
# view a published storefront.
business_router = APIRouter(prefix="/business", tags=["Storefront Settings"])
store_router = APIRouter(prefix="/store", tags=["Public Storefront"])

ALLOWED_IMAGE_TYPES = ALLOWED_UPLOAD_TYPES


def _business_out(business: Business) -> dict:
    return {
        "business_name": business.business_name,
        "craft_category": business.craft_category,
        "description": business.description,
        "location": business.location,
        "state": business.state,
        "slug": business.slug,
        "logo_url": business.logo_url,
        "whatsapp_number": business.whatsapp_number,
        "instagram_url": business.instagram_url,
        "facebook_url": business.facebook_url,
        "is_published": business.is_published,
    }


class StorefrontSettings(BaseModel):
    whatsapp_number: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    is_published: Optional[bool] = None


@business_router.get("/storefront")
def get_my_storefront(current_user: User = Depends(get_current_user)):
    if not current_user.business:
        raise HTTPException(status_code=400, detail="Please complete your business profile first.")
    return _business_out(current_user.business)


@business_router.put("/storefront")
def update_storefront(
    data: StorefrontSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = current_user.business
    if not business:
        raise HTTPException(status_code=400, detail="Please complete your business profile first.")

    if data.whatsapp_number is not None:
        business.whatsapp_number = data.whatsapp_number
    if data.instagram_url is not None:
        business.instagram_url = data.instagram_url
    if data.facebook_url is not None:
        business.facebook_url = data.facebook_url
    if data.is_published is not None:
        business.is_published = data.is_published

    db.commit()
    db.refresh(business)
    return _business_out(business)


@business_router.post("/logo")
def upload_logo(logo: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = current_user.business
    if not business:
        raise HTTPException(status_code=400, detail="Please complete your business profile first.")
    if logo.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed.")

    # Stored in the database rather than on disk. A logo written to the
    # filesystem is destroyed by the next deploy, which is what left every
    # storefront showing a broken image - see services/stored_image.py.
    try:
        business.logo_data, business.logo_mime = prepare_image(logo.file.read(), max_upload_mb=3)
    except ImageRejected as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # The tag changes on every upload so a cached copy of the old logo is
    # never shown after a new one is saved.
    business.logo_url = f"/store/{business.slug}/logo?v={uuid.uuid4().hex[:8]}"
    db.commit()
    db.refresh(business)
    return _business_out(business)


@store_router.get("/{slug}/logo")
def get_store_logo(slug: str, db: Session = Depends(get_db)):
    """
    Serves a business logo. Public and unauthenticated, like the storefront
    it appears on - a customer opening a shared link has no account, and a
    logo that 401s would make the page look broken to exactly the people
    it is meant for.
    """
    business = db.query(Business).filter(Business.slug == slug).first()
    if not business or not business.logo_data:
        raise HTTPException(status_code=404, detail="No logo for this store.")

    return Response(
        content=business.logo_data,
        media_type=business.logo_mime or "image/jpeg",
        headers={"Cache-Control": "public, max-age=604800"},
    )


@store_router.get("/{slug}")
def get_public_store(slug: str, db: Session = Depends(get_db)):
    """Public storefront data - no login required. Only shows published products."""
    business = db.query(Business).filter(Business.slug == slug).first()
    if not business or not business.is_published:
        raise HTTPException(status_code=404, detail="This store is not available.")

    products = (
        db.query(Product)
        .filter(Product.business_id == business.id, Product.status == "published")
        .order_by(Product.created_at.desc())
        .all()
    )

    return {
        "business": _business_out(business),
        "products": [ProductOut.model_validate(p).model_dump(mode="json") for p in products],
    }


@store_router.get("/{slug}/qr")
def get_store_qr(slug: str, db: Session = Depends(get_db)):
    """Generates a QR code image (PNG) pointing to the public storefront link."""
    business = db.query(Business).filter(Business.slug == slug).first()
    if not business:
        raise HTTPException(status_code=404, detail="Store not found.")

    store_url = f"{FRONTEND_URL}/store/{slug}"
    img = qrcode.make(store_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
