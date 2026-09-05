"""
AI Product Photo Studio - the real-AI engine.

Sends the artisan's ordinary phone photo to Google's Gemini image model
along with a fixed, carefully written product-photography prompt, and
gets back a clean catalogue-quality photo.

Why a FIXED prompt instead of letting the user type one: the artisan
should not have to learn prompt engineering. They press one button. The
prompt below is the product decision - it is tuned to improve the photo
WITHOUT altering the craft itself, which matters enormously here: the
slight irregularities of handmade work are the value, and an AI that
"beautifies" them into something machine-perfect would be misrepresenting
the product to a buyer.
"""

import base64
import io

import requests
from PIL import Image, ImageOps

from app.config import AI_API_KEY, GEMINI_API_BASE, GEMINI_IMAGE_MODEL, DEMO_MODE
from app.services.photo_prompt import PRODUCT_PHOTO_PROMPT

# Longest edge we upload. Keeps the request fast on a slow connection
# and well under the API's size limits.
MAX_UPLOAD_DIMENSION = 1024
REQUEST_TIMEOUT = 90  # image generation is slower than text


def is_configured() -> bool:
    """True when a real Gemini call is actually possible."""
    return bool(AI_API_KEY) and not DEMO_MODE


def _prepare_upload(image_bytes: bytes):
    """Shrink very large phone photos before uploading, and normalise
    orientation so a sideways photo is not 'fixed' into a sideways
    catalogue image."""
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    if max(image.size) > MAX_UPLOAD_DIMENSION:
        image.thumbnail((MAX_UPLOAD_DIMENSION, MAX_UPLOAD_DIMENSION))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=92)
    return buffer.getvalue(), "image/jpeg"


def _extract_image(payload: dict):
    """
    Pull the returned image out of Gemini's response.

    Note: the REST API accepts snake_case in requests but answers in
    camelCase, so we accept both spellings rather than assuming one.
    """
    for candidate in payload.get("candidates", []) or []:
        parts = (candidate.get("content") or {}).get("parts", []) or []
        for part in parts:
            blob = part.get("inline_data") or part.get("inlineData")
            if blob and blob.get("data"):
                mime = blob.get("mime_type") or blob.get("mimeType") or "image/png"
                return base64.b64decode(blob["data"]), mime
    return None, None


def enhance_product_photo(image_bytes: bytes, extra_instruction: str = ""):
    """
    Returns (processed_bytes, content_type, error_message).

    On success error_message is None. On ANY failure we return the error
    text instead of raising, so the route can fall back to the local
    engine and still tell the artisan the truth about what happened.
    """
    if not is_configured():
        return None, None, "No AI key configured (running in Demo Mode)."

    try:
        upload_bytes, upload_mime = _prepare_upload(image_bytes)
    except Exception as exc:  # noqa: BLE001
        return None, None, f"Could not read that image file: {exc}"

    prompt = PRODUCT_PHOTO_PROMPT
    if extra_instruction:
        prompt += f"\n\nADDITIONAL REQUEST FROM THE ARTISAN:\n{extra_instruction.strip()}"

    url = f"{GEMINI_API_BASE}/models/{GEMINI_IMAGE_MODEL}:generateContent"
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": upload_mime,
                            "data": base64.b64encode(upload_bytes).decode("utf-8"),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }

    try:
        response = requests.post(
            url,
            headers={"x-goog-api-key": AI_API_KEY, "Content-Type": "application/json"},
            json=body,
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.Timeout:
        return None, None, "The AI took too long to respond. Please try again."
    except requests.exceptions.RequestException as exc:
        return None, None, f"Could not reach the AI service: {exc}"

    if response.status_code != 200:
        detail = ""
        try:
            detail = (response.json().get("error") or {}).get("message", "")
        except Exception:  # noqa: BLE001
            detail = response.text[:200]

        # Unlike Gemini's TEXT models, the image model has no free tier as
        # of when this was written - it needs a Google Cloud project with
        # billing enabled, even though the same API key works for free on
        # the Catalogue/Business Manager text features. A 400/403 whose
        # message mentions billing/quota/permission is almost always that,
        # not a bug in this app - surface it plainly instead of a raw
        # error code, so it isn't mistaken for "the AI is broken".
        lowered = detail.lower()
        if response.status_code in (400, 403, 429) and any(
            kw in lowered for kw in ("billing", "quota", "permission", "not enabled", "free tier", "free_tier")
        ):
            return None, None, (
                "This Google account doesn't have billing enabled for AI image generation "
                "(Gemini's photo AI is a paid feature, unlike the free text AI). "
                f"Google's message: {detail or 'no further detail returned'}"
            )
        return None, None, f"AI service error {response.status_code}: {detail}"

    try:
        payload = response.json()
    except ValueError:
        return None, None, "The AI sent back a response we could not read."

    image_out, mime_out = _extract_image(payload)
    if image_out is None:
        # The model answered with text instead of an image - usually a
        # safety refusal. Surface its own words rather than a blank error.
        note = ""
        for candidate in payload.get("candidates", []) or []:
            for part in (candidate.get("content") or {}).get("parts", []) or []:
                if part.get("text"):
                    note = part["text"].strip()[:180]
                    break
        return None, None, note or "The AI did not return an edited image."

    return image_out, mime_out, None
