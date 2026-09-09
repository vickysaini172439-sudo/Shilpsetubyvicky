"""
Preparing uploaded images to be stored in the DATABASE rather than on disk.

WHY IMAGES MOVED OUT OF THE FILESYSTEM
--------------------------------------
Product photos and business logos were written to backend/uploads/ and
served from there. That works locally and fails completely once deployed,
because Render's filesystem is ephemeral: it is rebuilt from the repo on
every deploy, so every uploaded file is destroyed the next time anything
ships.

The evidence was unambiguous. The same URL that returned 200 OK:

    GET /uploads/products/3168303f....jpg  200 OK    (8 Sep, 13:33)

returned 404 the next morning after the day's deploys:

    GET /uploads/products/3168303f....jpg  404 Not Found  (9 Sep, 05:08)

Nothing in the display code was wrong. The bytes were gone, and the
database still held image_url values pointing at files that no longer
existed - which is why every product rendered as a broken-image icon and
the public store looked empty to a visitor.

WHY THE DATABASE AND NOT OBJECT STORAGE
---------------------------------------
Supabase Storage or S3 would be the textbook answer, and at real scale
they are the right one. Here they would each mean a new bucket, a new
service key, a new environment variable and a new failure mode - and this
project has just spent hours on a silent misconfiguration of exactly that
shape.

The Postgres database is already configured, already persistent, already
backed up, and already the thing every other piece of product data lives
in. Storing a handful of downscaled photos in it needs one migration and
no new credentials. At this app's scale - a few hundred products, each
image capped at roughly 300KB by the resizing below - that is a sound
trade, and it fails in no new ways.

If the catalogue ever grows into thousands of products, move the bytes to
object storage and keep the same public URLs; the routes that serve them
are already an indirection, so nothing outside this module has to change.
"""

import io

from PIL import Image, ImageOps

# Longest edge we keep. A phone camera photo is often 3000px+, which is far
# more than a product card or a detail view will ever display, and storing
# that in a database row would be wasteful for no visible benefit.
MAX_DIMENSION = 1200

# JPEG quality. 85 is the usual sweet spot: visually indistinguishable
# from the original at this size, roughly a fifth of the bytes.
JPEG_QUALITY = 85

ALLOWED_UPLOAD_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ImageRejected(Exception):
    """Raised with a message meant to be shown to the artisan as-is."""


def prepare_image(raw: bytes, max_upload_mb: int = 5) -> tuple[bytes, str]:
    """
    Validates, downscales and re-encodes an uploaded image, returning
    (bytes, mime_type) ready to be written to a database column.

    Everything comes out as JPEG. Photo Studio returns PNG, and a
    background-removed PNG can carry transparency, so any alpha channel is
    flattened onto white here - a catalogue photo wants a solid background
    anyway, and leaving alpha in would render as black on some surfaces.
    """
    if not raw:
        raise ImageRejected("That image file appears to be empty.")

    if len(raw) > max_upload_mb * 1024 * 1024:
        raise ImageRejected(f"Image must be smaller than {max_upload_mb}MB.")

    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except Exception:  # noqa: BLE001
        raise ImageRejected("That file could not be read as an image.")

    # Phones record orientation in EXIF rather than rotating the pixels, so
    # without this a photo taken sideways stays sideways forever.
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:  # noqa: BLE001
        pass  # a missing or malformed EXIF block is not worth failing over

    if image.mode in ("RGBA", "LA", "P"):
        image = image.convert("RGBA")
        backdrop = Image.new("RGB", image.size, (255, 255, 255))
        backdrop.paste(image, mask=image.split()[-1])
        image = backdrop
    elif image.mode != "RGB":
        image = image.convert("RGB")

    if max(image.size) > MAX_DIMENSION:
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue(), "image/jpeg"
