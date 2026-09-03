import io
from PIL import Image, ImageEnhance, ImageOps

# "rembg" is a free, local, open-source AI model for background removal
# (it runs on your own machine - no API key, no internet needed after
# its one-time model download). It's an OPTIONAL install: if it's not
# present, background removal quietly falls back to "Demo Mode" instead
# of crashing, and the frontend is told the truth via bg_removal_available.
try:
    from rembg import remove as rembg_remove
    BACKGROUND_REMOVAL_AVAILABLE = True
except ImportError:
    BACKGROUND_REMOVAL_AVAILABLE = False

MAX_DIMENSION = 1600  # keep processed images a reasonable file size


def _load_image(image_bytes: bytes, keep_alpha: bool = False) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)  # fixes sideways phone photos
    return image.convert("RGBA") if keep_alpha else image.convert("RGB")


def _apply_enhancement(image: Image.Image, brightness: float, contrast: float, sharpness: float) -> Image.Image:
    if image.width > MAX_DIMENSION or image.height > MAX_DIMENSION:
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

    has_alpha = image.mode == "RGBA"
    rgb = image.convert("RGB")
    alpha = image.getchannel("A") if has_alpha else None

    rgb = ImageEnhance.Brightness(rgb).enhance(brightness)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Sharpness(rgb).enhance(sharpness)

    if has_alpha:
        rgb.putalpha(alpha)
    return rgb


def process_image(image_bytes: bytes, remove_bg: bool, brightness: float, contrast: float, sharpness: float = 1.15):
    """
    Runs the "AI Product Photo Studio" pipeline: optional background
    removal, then brightness/contrast/sharpness enhancement.
    Returns (processed_bytes, content_type, used_real_ai_for_background).
    """
    used_real_ai = False

    if remove_bg and BACKGROUND_REMOVAL_AVAILABLE:
        image_bytes = rembg_remove(image_bytes)
        used_real_ai = True
        image = _load_image(image_bytes, keep_alpha=True)
    else:
        image = _load_image(image_bytes, keep_alpha=False)

    image = _apply_enhancement(image, brightness, contrast, sharpness)

    output = io.BytesIO()
    if image.mode == "RGBA":
        image.save(output, format="PNG")
        content_type = "image/png"
    else:
        image.save(output, format="JPEG", quality=90)
        content_type = "image/jpeg"

    return output.getvalue(), content_type, used_real_ai
