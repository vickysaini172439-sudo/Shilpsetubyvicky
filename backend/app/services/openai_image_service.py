"""
AI Product Photo Studio - the OpenAI engine.

Mirrors gemini_image_service.py exactly (same fixed prompt from
photo_prompt.py, same return shape: (processed_bytes, content_type,
error_message)) so routes/image.py can treat either provider
interchangeably. OpenAI's image model is reached through the
/v1/images/edits endpoint, which is a different shape from the
chat-completions endpoint used for text (multipart form upload with the
photo as a file, not a JSON body with base64 inline) - that's the main
reason this needs its own module rather than reusing ai_service.py's
_resolve_text_provider() plumbing.
"""

import base64
import io

import requests
from PIL import Image, ImageOps

from app.config import OPENAI_API_KEY, OPENAI_API_BASE_URL, OPENAI_IMAGE_MODEL, DEMO_MODE
from app.services.photo_prompt import PRODUCT_PHOTO_PROMPT

MAX_UPLOAD_DIMENSION = 1024
REQUEST_TIMEOUT = 90  # image generation is slower than text


def is_configured() -> bool:
    """True when a real OpenAI call is actually possible."""
    return bool(OPENAI_API_KEY) and not DEMO_MODE


def _prepare_upload(image_bytes: bytes):
    """
    Shrink very large phone photos before uploading, normalise
    orientation, and convert to PNG - the images/edits endpoint has
    historically been strict about accepting PNG input, so PNG is the
    safest common format rather than assuming JPEG/WEBP always work.
    """
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    if image.mode not in ("RGB", "RGBA", "L"):
        image = image.convert("RGBA")
    if max(image.size) > MAX_UPLOAD_DIMENSION:
        image.thumbnail((MAX_UPLOAD_DIMENSION, MAX_UPLOAD_DIMENSION))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def enhance_product_photo(image_bytes: bytes, extra_instruction: str = ""):
    """
    Returns (processed_bytes, content_type, error_message) - same shape
    as gemini_image_service.enhance_product_photo(), so routes/image.py
    can call whichever provider is configured without an if/else on the
    return type. On ANY failure we return the error text instead of
    raising, so the route can fall back (to Gemini, then to the local
    engine) and still tell the artisan the truth about what happened.
    """
    if not is_configured():
        return None, None, "No OpenAI key configured."

    try:
        upload_bytes = _prepare_upload(image_bytes)
    except Exception as exc:  # noqa: BLE001
        return None, None, f"Could not read that image file: {exc}"

    prompt = PRODUCT_PHOTO_PROMPT
    if extra_instruction:
        prompt += f"\n\nADDITIONAL REQUEST FROM THE ARTISAN:\n{extra_instruction.strip()}"

    url = f"{OPENAI_API_BASE_URL}/images/edits"

    try:
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            files={"image": ("photo.png", upload_bytes, "image/png")},
            data={
                "model": OPENAI_IMAGE_MODEL,
                "prompt": prompt,
                "size": "1024x1024",
                "quality": "medium",
                "n": 1,
            },
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.Timeout:
        return None, None, "The AI took too long to respond. Please try again."
    except requests.exceptions.RequestException as exc:
        return None, None, f"Could not reach the AI service: {exc}"

    if response.status_code != 200:
        detail = ""
        code = ""
        try:
            error_obj = response.json().get("error") or {}
            detail = error_obj.get("message", "")
            code = (error_obj.get("code") or error_obj.get("type") or "").lower()
        except Exception:  # noqa: BLE001
            detail = response.text[:200]

        # OpenAI's own error codes make a billing/quota problem easy to
        # tell apart from a genuine bug - surface it plainly instead of
        # a raw error string, same idea as the Gemini service's check.
        lowered = (detail + " " + code).lower()
        if response.status_code in (400, 401, 403, 429) and any(
            kw in lowered
            for kw in ("insufficient_quota", "billing", "hard_limit", "exceeded your current quota", "invalid_api_key")
        ):
            return None, None, (
                "This OpenAI account doesn't have enough credit/billing set up for image "
                "generation, or the API key is invalid. Add credit at "
                f"platform.openai.com/settings/billing. OpenAI's message: {detail or 'no further detail returned'}"
            )
        return None, None, f"AI service error {response.status_code}: {detail}"

    try:
        payload = response.json()
    except ValueError:
        return None, None, "The AI sent back a response we could not read."

    items = payload.get("data") or []
    if not items or not items[0].get("b64_json"):
        return None, None, "The AI did not return an edited image."

    try:
        image_out = base64.b64decode(items[0]["b64_json"])
    except Exception as exc:  # noqa: BLE001
        return None, None, f"Could not decode the AI's image response: {exc}"

    return image_out, "image/png", None
