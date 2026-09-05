import io
from PIL import Image, ImageEnhance, ImageOps, ImageFilter

# "rembg" is a free, local, open-source AI model for background removal
# (it runs on your own machine - no API key needed). It is an OPTIONAL
# feature.
#
# IMPORTANT: rembg is imported LAZILY (only when background removal is
# actually requested), and we catch BaseException, not just Exception.
# Here is why: when its onnxruntime engine is missing, rembg prints a
# help message and calls sys.exit(). That raises SystemExit, which is
# NOT a subclass of Exception - so an ordinary "except Exception" does
# NOT catch it, and the whole backend dies at startup. Importing it
# lazily means a broken rembg can never stop the server from starting.
_rembg_remove = None
_rembg_checked = False
BACKGROUND_REMOVAL_ERROR = None


def _get_rembg():
    """Try to load rembg once, safely. Returns the remove() function, or
    None if it isn't usable on this machine."""
    global _rembg_remove, _rembg_checked, BACKGROUND_REMOVAL_ERROR
    if _rembg_checked:
        return _rembg_remove
    _rembg_checked = True
    try:
        from rembg import remove as rembg_remove
        _rembg_remove = rembg_remove
    except BaseException as exc:  # noqa: BLE001 - must also catch SystemExit
        _rembg_remove = None
        BACKGROUND_REMOVAL_ERROR = f"{type(exc).__name__}: {exc}".strip()
    return _rembg_remove


def background_removal_status():
    """Honest answer for the frontend: is real AI background removal
    available, and if not, why not?"""
    available = _get_rembg() is not None
    return available, BACKGROUND_REMOVAL_ERROR


MAX_DIMENSION = 1600  # keep processed images a reasonable file size


def _load_image(image_bytes: bytes, keep_alpha: bool = False) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)  # fixes sideways phone photos
    return image.convert("RGBA") if keep_alpha else image.convert("RGB")


def _apply_enhancement(image: Image.Image, brightness: float, contrast: float, sharpness: float) -> Image.Image:
    """
    The free, always-available enhancement path (no AI key needed). A
    flat brightness/contrast multiply alone barely changes an already
    reasonably-lit phone photo, which is exactly why this looked like it
    "didn't do anything" - most artisan phone photos are dim, low-contrast
    and slightly soft, not overexposed, so a fixed 1.15x multiplier is too
    timid to be visible. This version auto-adjusts to what the actual
    photo needs (via autocontrast, which stretches each colour channel's
    real range instead of blindly nudging every pixel) BEFORE applying the
    artisan's brightness/contrast sliders on top, and unsharp-masks instead
    of PIL's plain sharpen filter for a cleaner result on fine craft detail.
    """
    if image.width > MAX_DIMENSION or image.height > MAX_DIMENSION:
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

    has_alpha = image.mode == "RGBA"
    rgb = image.convert("RGB")
    alpha = image.getchannel("A") if has_alpha else None

    # Auto-correct first: stretches each channel's histogram to use the
    # full 0-255 range, which fixes the "flat, hazy" look of most indoor
    # phone photos far more effectively than a fixed brightness multiply.
    # Clipping 1% of outlier pixels avoids a single bright glare spot or
    # dark corner from throwing the whole adjustment off.
    rgb = ImageOps.autocontrast(rgb, cutoff=1)

    rgb = ImageEnhance.Brightness(rgb).enhance(brightness)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Color(rgb).enhance(1.08)  # slightly richer colour, stays short of oversaturated

    # Unsharp mask reads as "crisper craft detail" rather than the harsh
    # halo a plain sharpen filter leaves around edges.
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=int(60 * sharpness), threshold=2))

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

    remover = _get_rembg() if remove_bg else None
    if remover is not None:
        image_bytes = remover(image_bytes)
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
