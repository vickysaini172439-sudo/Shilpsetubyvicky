import os
import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductOut
from app.routes.deps import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

# Where uploaded product photos are saved on disk. main.py serves this
# folder publicly at http://localhost:8010/uploads/... so the frontend
# can display the images directly.
UPLOAD_DIR = "uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_MB = 5


def save_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed.")

    contents = image.file.read()
    if len(contents) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be smaller than {MAX_IMAGE_SIZE_MB}MB.")

    ext = (image.filename.split(".")[-1] if "." in image.filename else "jpg").lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(contents)

    return f"/uploads/products/{filename}"


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
    status: str = Form("draft"),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business(current_user)
    image_url = save_image(image) if image and image.filename else None

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
        status=status,
        image_url=image_url,
    )
    db.add(product)
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

    if image and image.filename:
        product.image_url = save_image(image)

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
