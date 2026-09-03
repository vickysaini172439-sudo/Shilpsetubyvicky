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


# ---------------------------------------------------------------------
# AI Business Manager - answers an artisan's business questions using
# their own business/product context, so it's not a generic chatbot.
# ---------------------------------------------------------------------

def business_advice(question: str, business_name: str, category: str, product_name: str, price, material: str) -> dict:
    if AI_API_KEY and not DEMO_MODE:
        try:
            return _real_business_advice(question, business_name, category, product_name, price, material)
        except Exception:
            pass
    return _mock_business_advice(question, business_name, category, product_name, price, material)


def _real_business_advice(question, business_name, category, product_name, price, material) -> dict:
    context = f"Business: '{business_name}', category: {category or 'not specified'}."
    if product_name:
        context += f" Currently discussing product: '{product_name}', material: {material or 'not specified'}, price: ₹{price if price else 'not set'}."

    system_prompt = (
        "You are a friendly, practical AI Business Manager helping a marginalized Indian artisan "
        "grow their small handmade-goods business. Give short, concrete, encouraging advice in "
        "simple language (avoid business jargon). " + context
    )

    response = requests.post(
        f"{AI_API_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            "temperature": 0.6,
        },
        timeout=30,
    )
    response.raise_for_status()
    reply = response.json()["choices"][0]["message"]["content"]
    return {"reply": reply, "ai_mode": "real"}


def _match_topic(question: str) -> str:
    q = (question or "").lower()
    if any(k in q for k in ["promot", "marketing", "advertis"]):
        return "promote"
    if any(k in q for k in ["customer", "buyer", "who"]):
        return "customer"
    if "packag" in q:
        return "package"
    if any(k in q for k in ["unique", "special", "stand out", "different"]):
        return "unique"
    if any(k in q for k in ["sell online", "marketplace", "website", "online"]):
        return "sell_online"
    if any(k in q for k in ["b2b", "wholesale", "bulk", "retailer"]):
        return "b2b"
    if any(k in q for k in ["price", "pricing", "cost"]):
        return "price"
    return "default"


def _mock_business_advice(question, business_name, category, product_name, price, material) -> dict:
    """
    Keyword-matched, template-based advice built from the artisan's OWN
    business/product data (not generic filler) - a reasonable stand-in
    for a real AI reply when no API key is configured yet.
    """
    topic = _match_topic(question)
    subject = product_name or f"your {(category or 'craft').lower()} products"

    replies = {
        "promote": (
            f"To promote {subject}, try this: share clear photos on WhatsApp Status and Instagram with a short story "
            "about how it's made, ask happy customers for photos/reviews you can repost, and put your Digital Store's "
            "QR code on packaging and at local fairs so people can order again later."
        ),
        "customer": (
            f"For {subject}, your best customers are usually: people who value handmade/authentic products (often "
            "urban buyers aged 25-45 looking for home decor or gifts), local shops wanting unique stock, and "
            "event/wedding planners looking for gifting items in bulk."
        ),
        "package": (
            "Keep packaging simple but sturdy: a plain kraft box or cloth wrap suits the handmade feel, add a small "
            "printed card with your business name and a one-line story, and cushion fragile items with paper or "
            "cloth rather than plastic where you can — buyers notice eco-friendly touches."
        ),
        "unique": (
            f"What makes {subject} stand out is the story: it's handmade by you"
            + (f", using {material}" if material else "")
            + " — not mass-produced. Lean into that in your descriptions and captions; buyers pay more for "
            "authenticity, not just the object itself."
        ),
        "sell_online": (
            "Start with what's easiest: share your Digital Store link (from 'My Digital Store') on WhatsApp and "
            "Instagram, look into marketplaces like Amazon Karigar, Flipkart Samarth, or GeM if you qualify, and "
            "always publish a listing with a clear photo, price and description first — an unfinished listing "
            "rarely sells."
        ),
        "b2b": (
            f"For B2B/wholesale buyers, prepare: consistent quality at volume, a simple price list with bulk "
            f"discounts, clear delivery timelines, and your GST details if registered. Check the 'Market Linkage' "
            f"page for buyer types that typically suit {(category or 'your category').lower()}."
        ),
        "price": (
            "Use the Smart Pricing tool with your real material, labour and packaging costs instead of guessing — "
            "it suggests a competitive range. As a rule of thumb, price to cover your costs plus at least 40-50% "
            "margin for your time and profit."
        ),
        "default": (
            f"I can help with promotion, packaging, pricing, finding customers, or preparing for B2B buyers for "
            f"{subject} — try asking something like \"How should I promote this product?\" or use the suggested "
            f"questions below."
        ),
    }

    return {"reply": replies[topic], "ai_mode": "demo"}
