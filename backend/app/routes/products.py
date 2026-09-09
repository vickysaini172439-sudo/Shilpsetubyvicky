import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductOut
from app.routes.deps import get_current_user
from app.services.stored_image import prepare_image, ImageRejected, ALLOWED_UPLOAD_TYPES

router = APIRouter(prefix="/products", tags=["Products"])

MAX_IMAGE_SIZE_MB = 5


def read_upload(image: UploadFile):
    """
    Turns an uploaded file into (bytes, mime) ready for the database.

    This used to write the file to backend/uploads/ and return a path.
    That path stopped resolving the moment anything redeployed, because
    Render rebuilds the filesystem from the repo every time - so every
    photo an artisan had ever uploaded disappeared, while the database
    kept pointing at it. See services/stored_image.py for the full story.
    """
    if image.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed.")
    try:
        return prepare_image(image.file.read(), max_upload_mb=MAX_IMAGE_SIZE_MB)
    except ImageRejected as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def image_url_for(product_id: int) -> str:
    """
    The public URL for a product's photo, with a short random tag on the
    end. The tag changes every time a new photo is saved, which is what
    lets the response itself be cached for a week without an artisan
    uploading a replacement and still seeing the old one.
    """
    return f"/products/{product_id}/image?v={uuid.uuid4().hex[:8]}"


@router.get("/{product_id}/image")
def get_product_image(product_id: int, db: Session = Depends(get_db)):
    """
    Serves a product photo.

    Deliberately PUBLIC and unauthenticated: the storefront at /store/<slug>
    is meant to be opened by customers who have no account, and an image
    that 401s would make every published product look broken to exactly
    the people it is for. Only the bytes are exposed, and only for a
    product id someone already has.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or not product.image_data:
        raise HTTPException(status_code=404, detail="No image for this product.")

    return Response(
        content=product.image_data,
        media_type=product.image_mime or "image/jpeg",
        # The bytes at this URL only change when the artisan uploads a new
        # photo, and doing so rewrites image_url with a fresh version tag,
        # so this can be cached hard.
        headers={"Cache-Control": "public, max-age=604800"},
    )


def require_business(current_user: User):
    if not current_user.business:
        raise HTTPException(status_code=400, detail="Please complete your business profile first.")
    return current_user.business


@router.get("", response_model=List[ProductOut])
def list_products(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business(current_user)
    query = db.query(Product).filter(Product.business_id == business.id)
    if status:
        query = query.filter(Product.status == status)
    return query.order_by(Product.created_at.desc()).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = require_business(current_user)
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.post("", response_model=ProductOut)
def create_product(
    name: str = Form(...),
    name_hindi: Optional[str] = Form(None),
    description_english: Optional[str] = Form(None),
    description_hindi: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    craft_type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    features: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    status: str = Form("draft"),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business(current_user)

    image_bytes = image_mime = None
    if image and image.filename:
        image_bytes, image_mime = read_upload(image)

    product = Product(
        business_id=business.id,
        name=name,
        name_hindi=name_hindi,
        description_english=description_english,
        description_hindi=description_hindi,
        material=material,
        category=category,
        craft_type=craft_type,
        price=price,
        features=features,
        caption=caption,
        stock_quantity=stock_quantity,
        status=status,
        image_data=image_bytes,
        image_mime=image_mime,
    )
    db.add(product)
    # The image URL contains the product's own id, which the database only
    # assigns on flush - so the row has to exist before the URL can be
    # written onto it.
    db.flush()
    if image_bytes:
        product.image_url = image_url_for(product.id)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    name: str = Form(...),
    name_hindi: Optional[str] = Form(None),
    description_english: Optional[str] = Form(None),
    description_hindi: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    craft_type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    features: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    status: str = Form("draft"),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business(current_user)
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    product.name = name
    product.name_hindi = name_hindi
    product.description_english = description_english
    product.description_hindi = description_hindi
    product.material = material
    product.category = category
    product.craft_type = craft_type
    product.price = price
    product.status = status

    # The three catalogue-richness fields are updated ONLY when the caller
    # actually sends them. Every other field above is overwritten
    # unconditionally, which is fine because every existing screen submits
    # them all - but Photo Studio saves a product by posting just the
    # basics plus a new image. If these behaved the same way, saving an
    # enhanced photo would silently erase the features and caption the AI
    # Catalogue had written, and the artisan would never know why their
    # store page went empty.
    if features is not None:
        product.features = features
    if caption is not None:
        product.caption = caption
    if stock_quantity is not None:
        product.stock_quantity = stock_quantity

    if image and image.filename:
        product.image_data, product.image_mime = read_upload(image)
        # A new URL each time, so a browser holding the previous photo in
        # cache fetches the new one instead of showing the old.
        product.image_url = image_url_for(product.id)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = require_business(current_user)
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted."}
