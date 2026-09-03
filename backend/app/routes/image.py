from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.models.user import User
from app.routes.deps import get_current_user
from app.services.image_service import process_image, BACKGROUND_REMOVAL_AVAILABLE

router = APIRouter(prefix="/image", tags=["Image Enhancement"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.get("/capabilities")
def capabilities():
    """Lets the frontend honestly show whether background removal is
    running real AI or Demo Mode, instead of guessing."""
    return {"background_removal_available": BACKGROUND_REMOVAL_AVAILABLE}


@router.post("/enhance")
def enhance(
    image: UploadFile = File(...),
    remove_bg: bool = Form(False),
    brightness: float = Form(1.15),
    contrast: float = Form(1.15),
    current_user: User = Depends(get_current_user),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed.")

    contents = image.file.read()
    processed, content_type, used_real_ai = process_image(
        contents, remove_bg=remove_bg, brightness=brightness, contrast=contrast
    )

    headers = {"X-Background-Removed-Real-Ai": "true" if used_real_ai else "false"}
    return Response(content=processed, media_type=content_type, headers=headers)
