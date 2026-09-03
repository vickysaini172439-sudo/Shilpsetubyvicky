import re
import random
import string
from sqlalchemy.orm import Session
from app.models.business import Business


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "store"


def make_unique_slug(db: Session, business_name: str) -> str:
    """Turns 'Shilp Crafts' into 'shilp-crafts', adding a random suffix
    if that name is already taken by another artisan's store."""
    base = slugify(business_name)
    slug = base
    while db.query(Business).filter(Business.slug == slug).first():
        suffix = "".join(random.choices(string.digits, k=4))
        slug = f"{base}-{suffix}"
    return slug
