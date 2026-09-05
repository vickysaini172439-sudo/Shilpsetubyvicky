from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.routes.deps import get_current_user
from app.services.ai_service import generate_catalogue, PROVIDER_LABELS
from app.config import CATALOGUE_AI_PROVIDER, BUSINESS_ADVICE_AI_PROVIDER, _resolve_text_provider

router = APIRouter(prefix="/ai", tags=["AI"])


class CatalogueRequest(BaseModel):
    raw_text: str
    product_name: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    # Which language the local-language fields should be written in.
    # Left empty, we use whatever the artisan chose when registering.
    language: Optional[str] = None


@router.post("/catalog")
def create_catalog(data: CatalogueRequest, current_user: User = Depends(get_current_user)):
    return generate_catalogue(
        raw_text=data.raw_text,
        product_name=data.product_name,
        category=data.category,
        material=data.material,
        craft_type=data.craft_type,
        language=data.language or current_user.preferred_language or "Hindi",
    )


@router.get("/text-capabilities")
def text_capabilities():
    """
    Tells the frontend, honestly, which real AI provider (if any) is
    actually configured for each text feature - so the UI can show
    "Gemini" / "OpenAI" / "Demo Mode" instead of guessing.
    """
    def describe(provider_name):
        _, _, _, provider, enabled = _resolve_text_provider(provider_name)
        return {
            "provider": provider,
            "provider_label": PROVIDER_LABELS.get(provider, provider),
            "enabled": enabled,
        }

    return {
        "catalogue": describe(CATALOGUE_AI_PROVIDER),
        "business_advice": describe(BUSINESS_ADVICE_AI_PROVIDER),
    }
