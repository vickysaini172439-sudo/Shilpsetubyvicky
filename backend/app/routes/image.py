from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.models.user import User
from app.routes.deps import get_current_user
from app.services.image_service import process_image, background_removal_status
from app.services import gemini_image_service, openai_image_service

router = APIRouter(prefix="/image", tags=["Image Enhancement"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _header_safe(text: str) -> str:
    """HTTP headers must be plain ASCII. Error text can contain quotes,
    newlines or non-English characters, so clean it before sending."""
    if not text:
        return ""
    cleaned = " ".join(str(text).split())
    return cleaned.encode("ascii", "ignore").decode("ascii")[:300]


@router.get("/capabilities")
def capabilities():
    """
    Tells the frontend exactly which photo engines are really available,
    so the app can be honest on screen instead of guessing.

    OpenAI is preferred first now (see config.py's provider comment -
    the user is buying OpenAI credits specifically for this hackathon),
    Gemini second as a free fallback, then the always-available local
    engine last.
    """
    local_available, local_reason = background_removal_status()
    openai_available = openai_image_service.is_configured()
    gemini_available = gemini_image_service.is_configured()
    if openai_available:
        default_engine = "openai"
    elif gemini_available:
        default_engine = "gemini"
    else:
        default_engine = "local"
    return {
        "openai_available": openai_available,
        "gemini_available": gemini_available,
        "background_removal_available": local_available,
        "unavailable_reason": local_reason,
        "default_engine": default_engine,
    }


@router.post("/enhance")
def enhance(
    image: UploadFile = File(...),
    engine: str = Form("auto"),
    remove_bg: bool = Form(False),
    brightness: float = Form(1.15),
    contrast: float = Form(1.15),
    instruction: str = Form(""),
    current_user: User = Depends(get_current_user),
):
    """
    Runs the AI Product Photo Studio.

    engine:
      "auto"   - use OpenAI if configured, else Gemini, else work locally
      "openai" - real AI re-shoot of the photo via OpenAI (needs OPENAI_API_KEY)
      "gemini" - real AI re-shoot of the photo via Gemini (needs AI_API_KEY)
      "local"  - local background removal + brightness/contrast/sharpness

    If the AI engine fails for any reason we do NOT show an error page and
    lose the artisan's work - we quietly fall back to the local engine and
    report honestly in the response headers what actually ran.
    """
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed.")

    contents = image.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="That image file appears to be empty.")

    engine = (engine or "auto").lower()
    if engine == "auto":
        if openai_image_service.is_configured():
            engine = "openai"
        elif gemini_image_service.is_configured():
            engine = "gemini"
        else:
            engine = "local"

    note = ""

    # ---- Real AI path (OpenAI) -----------------------------------------
    if engine == "openai":
        processed, content_type, error = openai_image_service.enhance_product_photo(
            contents, extra_instruction=instruction
        )
        if processed is not None:
            headers = {
                "X-Enhance-Engine": "openai",
                "X-Enhance-Note": _header_safe("Enhanced by OpenAI product photography."),
                "X-Background-Removed-Real-Ai": "true",
            }
            return Response(content=processed, media_type=content_type, headers=headers)

        # OpenAI failed - try the free Gemini key next (if any) before
        # falling all the way back to the local engine, so a temporary
        # OpenAI quota/billing hiccup doesn't waste a perfectly good
        # second AI provider that's already configured.
        if gemini_image_service.is_configured():
            engine = "gemini"
            note = f"OpenAI enhancement unavailable, trying Gemini instead. Reason: {error}"
        else:
            note = f"AI enhancement unavailable, used the local engine instead. Reason: {error}"

    # ---- Real AI path (Gemini) ------------------------------------------
    if engine == "gemini":
        processed, content_type, error = gemini_image_service.enhance_product_photo(
            contents, extra_instruction=instruction
        )
        if processed is not None:
            headers = {
                "X-Enhance-Engine": "gemini",
                "X-Enhance-Note": _header_safe(note or "Enhanced by Gemini AI product photography."),
                "X-Background-Removed-Real-Ai": "true",
            }
            return Response(content=processed, media_type=content_type, headers=headers)

        # Fell through - say why, then carry on with the local engine.
        note = f"AI enhancement unavailable, used the local engine instead. Reason: {error}"

    # ---- Local path ---------------------------------------------------
    processed, content_type, used_real_bg_ai = process_image(
        contents, remove_bg=remove_bg, brightness=brightness, contrast=contrast
    )

    if not note:
        note = (
            "Background removed locally and photo enhanced."
            if used_real_bg_ai
            else "Photo enhanced with brightness, contrast and sharpness."
        )

    headers = {
        "X-Enhance-Engine": "local-ai" if used_real_bg_ai else "basic",
        "X-Enhance-Note": _header_safe(note),
        "X-Background-Removed-Real-Ai": "true" if used_real_bg_ai else "false",
    }
    return Response(content=processed, media_type=content_type, headers=headers)
