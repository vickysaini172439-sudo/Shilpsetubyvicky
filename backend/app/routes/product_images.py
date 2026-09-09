"""
Extra photos for a product - the gallery.

Kept in its own module rather than added to routes/products.py, which is
already long and handles the cover photo. These routes share that file's
prefix, so they land on the same /products/... paths; FastAPI is happy to
serve one prefix from two routers.

The cover photo is untouched by everything here. That is the whole design:
a product's main image keeps working exactly as it did, and a gallery is
something a product may additionally have.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product, ProductImage
from app.schemas.product import ProductOut
from app.routes.deps import get_current_user
from app.routes.products import read_upload, require_business

router = APIRouter(prefix="/products", tags=["Product Photos"])

# Enough for any craft to show itself properly - front, back, detail,
# scale, in-use - without letting one product fill the database. The
# limit is stated to the artisan rather than silently enforced.
MAX_GALLERY_PHOTOS = 8


def _owned_product(product_id: int, current_user: User, db: Session) -> Product:
    business = require_business(current_user)
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.business_id == business.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.get("/{product_id}/images/{image_id}")
def get_gallery_image(product_id: int, image_id: int, db: Session = Depends(get_db)):
    """
    Serves one gallery photo.

    Public and unauthenticated for the same reason the cover photo is: the
    storefront is meant to be opened from a WhatsApp link by someone with
    no account, and a photo that 401s would make a real shop look broken.

    Filtering on product_id as well as image_id is not redundant - it stops
    a guessed id returning a photo that belongs to a different product.
    """
    photo = (
        db.query(ProductImage)
        .filter(ProductImage.id == image_id, ProductImage.product_id == product_id)
        .first()
    )
    if not photo or not photo.image_data:
        raise HTTPException(status_code=404, detail="No such photo.")

    return Response(
        content=photo.image_data,
        media_type=photo.image_mime or "image/jpeg",
        # These bytes are immutable: replacing a view deletes the row and
        # adds a new one with a new id, so this URL can never go stale.
        headers={"Cache-Control": "public, max-age=604800, immutable"},
    )


@router.post("/{product_id}/images", response_model=ProductOut)
def add_gallery_images(
    product_id: int,
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Adds one or more extra views to a product.

    Returns the whole updated product rather than just the new photos, so
    the screen that called this can replace its copy outright instead of
    stitching a partial response into what it already had.
    """
    product = _owned_product(product_id, current_user, db)

    incoming = [image for image in images if image and image.filename]
    if not incoming:
        raise HTTPException(status_code=400, detail="No photos were sent.")

    already = len(product.gallery)
    if already + len(incoming) > MAX_GALLERY_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A product can have up to {MAX_GALLERY_PHOTOS} extra photos. "
                f"This one already has {already}."
            ),
        )

    # Carry on from the highest position in use, so new views are appended
    # rather than colliding with the order the artisan already chose.
    next_position = max((photo.position or 0) for photo in product.gallery) + 1 if product.gallery else 0

    for offset, image in enumerate(incoming):
        # read_upload downscales, strips EXIF rotation and re-encodes to
        # JPEG - the same treatment the cover photo gets, so a gallery
        # cannot become the thing that fills the database.
        data, mime = read_upload(image)
        db.add(
            ProductImage(
                product_id=product.id,
                image_data=data,
                image_mime=mime,
                position=next_position + offset,
            )
        )

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}/images/{image_id}", response_model=ProductOut)
def delete_gallery_image(
    product_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes one extra view. The cover photo is not reachable from here."""
    product = _owned_product(product_id, current_user, db)

    photo = (
        db.query(ProductImage)
        .filter(ProductImage.id == image_id, ProductImage.product_id == product.id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="No such photo.")

    db.delete(photo)
    db.commit()
    db.refresh(product)
    return product
