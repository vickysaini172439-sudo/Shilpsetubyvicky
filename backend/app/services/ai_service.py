import json
import re
import requests

from app.config import CATALOGUE_AI_PROVIDER, BUSINESS_ADVICE_AI_PROVIDER, _resolve_text_provider

# Each text feature (catalogue, business advice) independently resolves
# its own provider settings from app/config.py - see
# CATALOGUE_AI_PROVIDER / BUSINESS_ADVICE_AI_PROVIDER there. Both Gemini
# and OpenAI speak the same "/chat/completions" request shape, which is
# exactly why this file never needs an if/else per provider - only the
# base URL, key and model name change.
PROVIDER_LABELS = {"gemini": "Google Gemini", "openai": "OpenAI"}

# Languages we can write a catalogue in. "Hinglish" is Hindi written in
# English letters (e.g. "Yeh handmade jute bag hai") - extremely common
# in everyday Indian messaging, and much easier to read for someone who
# speaks Hindi but is faster typing on an English keyboard.
SUPPORTED_OUTPUT_LANGUAGES = {
    "Hindi": "Hindi, written in Devanagari script",
    "Hinglish": (
        "Hinglish - conversational Hindi written using English (Roman) letters, "
        "the way Indians write on WhatsApp. Do NOT use Devanagari script"
    ),
    "English": "English",
    "Bengali": "Bengali, written in Bengali script",
    "Tamil": "Tamil, written in Tamil script",
    "Telugu": "Telugu, written in Telugu script",
    "Marathi": "Marathi, written in Devanagari script",
    "Gujarati": "Gujarati, written in Gujarati script",
    "Punjabi": "Punjabi, written in Gurmukhi script",
    "Kannada": "Kannada, written in Kannada script",
    "Malayalam": "Malayalam, written in Malayalam script",
    "Odia": "Odia, written in Odia script",
}


def _language_instruction(language: str) -> str:
    return SUPPORTED_OUTPUT_LANGUAGES.get(language or "Hindi", SUPPORTED_OUTPUT_LANGUAGES["Hindi"])


def _has_devanagari(text: str) -> bool:
    return bool(re.search(r"[ऀ-ॿ]", text or ""))


def generate_catalogue(raw_text: str, product_name: str, category: str, material: str,
                       craft_type: str, language: str = "Hindi") -> dict:
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
    base_url, api_key, model, provider, enabled = _resolve_text_provider(CATALOGUE_AI_PROVIDER)
    if enabled:
        try:
            return _real_catalogue(raw_text, product_name, category, material, craft_type,
                                    language, base_url, api_key, model, provider)
        except Exception:
            pass

    return _mock_catalogue(raw_text, product_name, category, material, craft_type, language)


def _real_catalogue(raw_text, product_name, category, material, craft_type, language,
                     base_url, api_key, model, provider) -> dict:
    prompt = f"""You are helping a marginalized Indian artisan create a professional
bilingual (Hindi + English) product catalogue entry for an e-commerce marketplace.

Artisan's own words about the product: "{raw_text}"
Product name (if given): {product_name or "not given, please suggest one"}
Category: {category or "not specified"}
Material: {material or "not specified"}
Craft type: {craft_type or "not specified"}

The artisan's chosen language is: {_language_instruction(language)}.
Write every "local language" field in that language, and never mix scripts.

Return ONLY a valid JSON object with exactly these keys:
title_english, title_hindi (this is the LOCAL LANGUAGE title - write it in
{language}), short_description, description_english, description_hindi (the
LOCAL LANGUAGE description - write it in {language}), features (array of 3-5
short strings), material, category, use_cases (array of strings),
target_customer (string), search_keywords (array of 5-8 strings),
marketing_caption (string, under 25 words), social_caption (string, with 2-3
relevant hashtags)."""

    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
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
    data["ai_provider"] = provider
    data["ai_provider_label"] = PROVIDER_LABELS.get(provider, provider)
    data["language"] = language
    return data


def _mock_catalogue(raw_text, product_name, category, material, craft_type, language="Hindi") -> dict:
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

    # Which field does the artisan's own text belong in? If they typed
    # Devanagari it is clearly the local-language field. If they chose
    # Hinglish, their Roman-letter text IS the local language, so it goes
    # there too - this is the case that used to be handled wrongly.
    if language == "Hinglish":
        is_local_input = not _has_devanagari(raw_text) and bool(raw_text)
    else:
        is_local_input = _has_devanagari(raw_text)
    is_hindi_input = is_local_input

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
        "language": language,
    }


# ---------------------------------------------------------------------
# AI Business Manager - answers an artisan's business questions using
# their own business/product context, so it's not a generic chatbot.
# ---------------------------------------------------------------------

def business_advice(question: str, business_name: str, category: str, product_name: str, price,
                    material: str, language: str = "English") -> dict:
    base_url, api_key, model, provider, enabled = _resolve_text_provider(BUSINESS_ADVICE_AI_PROVIDER)
    if enabled:
        try:
            return _real_business_advice(question, business_name, category, product_name, price,
                                          material, language, base_url, api_key, model, provider)
        except Exception:
            pass
    return _mock_business_advice(question, business_name, category, product_name, price, material)


def _real_business_advice(question, business_name, category, product_name, price, material, language,
                           base_url, api_key, model, provider) -> dict:
    context = f"Business: '{business_name}', category: {category or 'not specified'}."
    if product_name:
        context += f" Currently discussing product: '{product_name}', material: {material or 'not specified'}, price: ₹{price if price else 'not set'}."

    system_prompt = (
        "You are a friendly, practical AI Business Manager chatbot for a marginalized Indian "
        "artisan running a small handmade-goods business. You can answer ANY question they ask "
        "about: their PRODUCT (materials, quality, how to describe or improve it), their BUSINESS "
        "(customers, promotion, packaging, selling online or B2B, growth), and their BUDGET/FINANCES "
        "(pricing, costs, profit margin, saving, simple bookkeeping, affordable next steps). "
        "Give short, concrete, encouraging advice in simple, everyday language - avoid business "
        "jargon and avoid large financial words a first-time business owner may not know; explain "
        "any term you must use in one plain phrase. Always reply entirely in "
        f"{_language_instruction(language)}, since this is the language they are most comfortable "
        "reading. Use rupee amounts (₹) for any money example, not dollars. " + context
    )

    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
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
    return {
        "reply": reply,
        "ai_mode": "real",
        "ai_provider": provider,
        "ai_provider_label": PROVIDER_LABELS.get(provider, provider),
        "language": language,
    }


# ---------------------------------------------------------------------
# Proactive Business Insight - the "smarter, not just reactive" AI. The
# Business Manager chatbot above only speaks when the artisan asks it
# something; this instead looks at their REAL data every time they open
# the dashboard and surfaces ONE short, specific, actionable observation
# without being asked - e.g. "you have 2 unpublished drafts" rather than
# waiting for the artisan to think to ask "how am I doing?".
# ---------------------------------------------------------------------

def generate_business_insight(business_name: str, category: str, total_products: int,
                               published_count: int, draft_count: int, avg_price,
                               price_min, price_max, readiness_score: int,
                               top_missing_step: str, language: str = "English") -> dict:
    base_url, api_key, model, provider, enabled = _resolve_text_provider(BUSINESS_ADVICE_AI_PROVIDER)
    if enabled:
        try:
            return _real_business_insight(
                business_name, category, total_products, published_count, draft_count,
                avg_price, price_min, price_max, readiness_score, top_missing_step,
                language, base_url, api_key, model, provider,
            )
        except Exception:
            pass
    return _mock_business_insight(total_products, published_count, draft_count, readiness_score, top_missing_step)


def _real_business_insight(business_name, category, total_products, published_count, draft_count,
                            avg_price, price_min, price_max, readiness_score, top_missing_step,
                            language, base_url, api_key, model, provider) -> dict:
    price_line = (
        f"Average published price: Rs.{avg_price:.0f} (range Rs.{price_min:.0f}-Rs.{price_max:.0f})."
        if avg_price else "No prices set on published products yet."
    )
    data_summary = (
        f"Business: '{business_name}', category: {category or 'not specified'}. "
        f"{total_products} total product(s): {published_count} published, {draft_count} draft. "
        f"{price_line} Digital readiness score: {readiness_score}/100. "
        f"Most important thing still missing: {top_missing_step or 'nothing - fully set up'}."
    )

    system_prompt = (
        "You are a proactive AI business coach for a small Indian artisan's handmade-goods "
        "shop, embedded on their dashboard. You are given a snapshot of their REAL current "
        "data. Without being asked a question, generate exactly ONE short, specific, "
        "genuinely useful observation or suggestion based on THIS data - not generic advice. "
        "Reference an actual number from the data (a count, a price, the score) so it feels "
        "personal, not templated. Maximum 2 short sentences. Encouraging tone, plain language, "
        "no jargon. Reply entirely in " + _language_instruction(language) + ". "
        "Use Rs. for money. Data snapshot: " + data_summary
    )

    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [{"role": "system", "content": system_prompt},
                         {"role": "user", "content": "Give me today's insight."}],
            "temperature": 0.7,
            "max_tokens": 120,
        },
        timeout=20,
    )
    response.raise_for_status()
    tip = response.json()["choices"][0]["message"]["content"].strip()
    return {
        "tip": tip,
        "ai_mode": "real",
        "ai_provider": provider,
        "ai_provider_label": PROVIDER_LABELS.get(provider, provider),
    }


def _mock_business_insight(total_products, published_count, draft_count, readiness_score, top_missing_step) -> dict:
    """
    Rule-based fallback so the dashboard never shows a broken/empty
    insight card, even offline or before an AI key is configured - picks
    the single highest-priority real issue from the artisan's own data.
    """
    if total_products == 0:
        tip = "Add your first product to get started — even one good photo and a price is enough to open your store."
    elif draft_count > 0:
        tip = f"You have {draft_count} draft product{'s' if draft_count != 1 else ''} waiting — publish {'them' if draft_count != 1 else 'it'} so buyers can actually find {'them' if draft_count != 1 else 'it'}."
    elif readiness_score < 100 and top_missing_step:
        tip = f"You're at {readiness_score}% digital readiness — next up: {top_missing_step.lower()}."
    else:
        tip = f"Your store looks fully set up with {published_count} published product{'s' if published_count != 1 else ''} — now's a good time to focus on promotion and finding new buyers."
    return {"tip": tip, "ai_mode": "demo"}


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
