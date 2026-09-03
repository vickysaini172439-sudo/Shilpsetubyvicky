import json
import re
import requests

from app.config import AI_API_KEY, DEMO_MODE

# Points at any OpenAI-compatible "/v1/chat/completions" endpoint.
# OpenAI itself works, but for a student project a free-tier provider
# like Groq (groq.com) is a great option - same API shape, no cost to
# start. Just set AI_API_KEY (and optionally AI_API_BASE_URL / AI_MODEL
# below via app/config.py later) in backend/.env once you have a key.
AI_API_BASE_URL = "https://api.openai.com/v1"
AI_MODEL = "gpt-4o-mini"


def _has_devanagari(text: str) -> bool:
    return bool(re.search(r"[ऀ-ॿ]", text or ""))


def generate_catalogue(raw_text: str, product_name: str, category: str, material: str, craft_type: str) -> dict:
    """
    Turns what an artisan spoke/typed about their product into a
    structured, editable Hindi + English catalogue entry.

    Tries a real AI API call first (only if a key is configured and
    DEMO_MODE is off). If that's unavailable OR fails for any reason
    (no internet, bad key, rate limit), it quietly falls back to a
    clearly-labeled template-based "Demo Mode" generator instead of
    crashing - this is what keeps the SIH demo working even with no
    internet connection at the venue.
    """
    if AI_API_KEY and not DEMO_MODE:
        try:
            return _real_catalogue(raw_text, product_name, category, material, craft_type)
        except Exception:
            pass

    return _mock_catalogue(raw_text, product_name, category, material, craft_type)


def _real_catalogue(raw_text, product_name, category, material, craft_type) -> dict:
    prompt = f"""You are helping a marginalized Indian artisan create a professional
bilingual (Hindi + English) product catalogue entry for an e-commerce marketplace.

Artisan's own words about the product: "{raw_text}"
Product name (if given): {product_name or "not given, please suggest one"}
Category: {category or "not specified"}
Material: {material or "not specified"}
Craft type: {craft_type or "not specified"}

Return ONLY a valid JSON object with exactly these keys:
title_english, title_hindi, short_description, description_english,
description_hindi (in Hindi/Devanagari script), features (array of 3-5 short
strings), material, category, use_cases (array of strings), target_customer
(string), search_keywords (array of 5-8 strings), marketing_caption (string,
under 25 words), social_caption (string, with 2-3 relevant hashtags)."""

    response = requests.post(
        f"{AI_API_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": AI_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "response_format": {"type": "json_object"},
        },
        timeout=30,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    data["ai_mode"] = "real"
    return data


def _mock_catalogue(raw_text, product_name, category, material, craft_type) -> dict:
    """
    A deterministic, template-based stand-in for a real AI call - not a
    real model, just Python string formatting. It reshapes what the
    artisan already said into the catalogue structure so the app is
    always demoable with zero setup. IMPORTANT HONESTY NOTE: it cannot
    genuinely translate between Hindi and English (that needs a real AI
    model) - so it only fills in whichever language field matches what
    was actually said, and leaves the other for the artisan to add.
    """
    raw_text = (raw_text or "").strip()
    is_hindi_input = _has_devanagari(raw_text)

    fallback_name = product_name or (raw_text[:40].strip() if raw_text else "Handcrafted Product")
    material_txt = material or "quality materials"
    craft_txt = (craft_type or "traditional handcraft techniques").lower()
    category_txt = category or "handicraft"

    short_description = (
        f"A handcrafted {category_txt.lower()} piece made using {material_txt.lower()}, "
        f"created with {craft_txt}."
    )

    return {
        "title_english": fallback_name if not is_hindi_input else "",
        "title_hindi": fallback_name if is_hindi_input else "",
        "short_description": short_description,
        "description_english": raw_text if not is_hindi_input else short_description,
        "description_hindi": raw_text if is_hindi_input else "",
        "features": [
            f"Made from {material_txt}",
            f"Crafted using {craft_txt}",
            "One-of-a-kind handmade piece",
        ],
        "material": material_txt,
        "category": category_txt,
        "use_cases": ["Home decor", "Gifting"],
        "target_customer": "Buyers who value authentic, handmade Indian craftsmanship",
        "search_keywords": [w for w in [category, material, craft_type, "handmade", "Indian craft"] if w],
        "marketing_caption": f"Handmade with heart — {fallback_name}, straight from an Indian artisan's workshop.",
        "social_caption": f"✨ {fallback_name} — handcrafted, one-of-a-kind. #HandmadeInIndia #SupportArtisans",
        "ai_mode": "demo",
    }
