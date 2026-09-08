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


# ---------------------------------------------------------------------
# Shared output standards
# ---------------------------------------------------------------------
# Every AI feature in this app was giving one-line, thin answers. The
# cause was not the model - it was that nothing ever ASKED for depth, and
# nothing described what a good answer looks like. A model given no
# length or structure guidance defaults to the shortest thing that
# technically satisfies the request.
#
# These two blocks are appended to the prompts of every text feature, so
# the whole app answers at one consistent, useful standard instead of
# each feature drifting on its own.

_OUTPUT_STANDARDS = """
HOW TO WRITE YOUR ANSWER:
- Be genuinely substantial. A one-line reply is a failure, not brevity. Give the artisan
  enough that they can act on it today without having to ask a follow-up question.
- Structure longer answers so they can be skimmed: a short opening line that answers the
  question directly, then clear points underneath. Use simple dashes for lists.
- Be specific and concrete. Name real numbers, real steps, real places, real timeframes.
  "Promote it on social media" is useless; "post it on WhatsApp Status in the evening
  between 7 and 9pm when people scroll most, and ask five past customers to reshare"
  is useful.
- Reason it through yourself rather than repeating the question back. If a question has a
  trade-off, say what the trade-off is and what you would pick.
- Use rupees (Rs.) for every money figure, never dollars. Use Indian units, festivals,
  marketplaces and seasons, because that is the market this artisan actually sells in.
- Never mention that you are an AI, a language model, or that you have a knowledge cutoff.
- Write plainly. This person may be running their first business and may be reading in
  their second language. Explain any term you have to use, in one short phrase.
"""

_REAL_WORLD_GROUNDING = """
GROUNDING IN THE REAL MARKET:
- Answer from what you actually know about the Indian handmade and handicraft market:
  typical price points, how buyers behave, which channels artisans really sell through
  (WhatsApp Business, Instagram, local melas and exhibitions, Amazon Karigar,
  Flipkart Samarth, GeM, Okhai, iTokri, export buyers, wholesale/B2B retailers).
- Take the season into account when it matters - Diwali, Navratri, wedding season,
  Christmas and Rakhi drive most handmade gifting demand in India.
- Be honest about what you do not know. If something depends on their exact city,
  their costs, or current market rates you cannot see, say so in one short line and
  then give your best estimate anyway with the reasoning behind it. Never refuse to
  answer just because you lack a detail - estimate, and label it as an estimate.
"""


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
    system_prompt = (
        "You are a senior e-commerce copywriter who has spent years writing listings for "
        "Indian handicraft brands, and you know exactly what makes a handmade product sell "
        "online. You are writing a full catalogue entry for one artisan's product. "
        "Write listing copy of the standard a professional marketplace would publish - "
        "warm, specific and confident, never generic filler."
        + _OUTPUT_STANDARDS
        + _REAL_WORLD_GROUNDING
    )

    prompt = f"""Write a complete, professional bilingual product catalogue entry for this
handmade Indian craft product.

WHAT THE ARTISAN TOLD YOU
Their own words about the product: "{raw_text}"
Product name (if given): {product_name or "not given - suggest a good one yourself"}
Category: {category or "not specified - infer it from their words"}
Material: {material or "not specified - infer it from their words"}
Craft type: {craft_type or "not specified - infer it from their words"}

The artisan may have said very little. That is expected - they are a craftsperson, not a
copywriter. Your job is to expand what they said into a full, believable listing using
what you know about this craft, this material and this category. Never simply repeat
their sentence back at them in a different order.

Do NOT invent facts that could mislead a buyer: never claim a certification, an award,
an exact age, a specific village origin or a material they did not mention. Everything
you add must be a fair, general truth about this kind of craft.

LANGUAGE
The artisan's chosen language is: {_language_instruction(language)}.
Write every LOCAL LANGUAGE field fully in that language. Never mix scripts inside a field.
The local-language fields must be just as rich as the English ones - not a shortened
summary, and not a stiff word-for-word translation. Write them naturally, the way a
person actually speaks that language.

RETURN ONLY A VALID JSON OBJECT with exactly these keys, meeting every length requirement:

- "title_english": 6 to 12 words. Must name the actual item, its material and its craft
  style - the way a real marketplace title reads. Not just the product name.
- "title_hindi": the same title in {language}, equally specific.
- "short_description": 25 to 40 words. One tight paragraph that would make someone stop
  scrolling.
- "description_english": 130 to 200 words. This is the main selling text. Cover, in this
  order: what the item is and how it looks; the material and why that material is good;
  how it is made by hand and roughly how long that takes; where it fits in a buyer's home
  or life; and one honest line about handmade variation, so a buyer expects small
  differences rather than complaining about them. Write it as flowing prose in two or
  three short paragraphs, not as a list.
- "description_hindi": the same depth and structure, fully in {language}. 130 to 200 words.
- "features": array of exactly 5 to 7 strings. Each one a complete, informative phrase of
  8 to 15 words - "Hand-carved from seasoned sheesham wood, so it will not warp over time",
  never a two-word fragment like "Wooden" or "Handmade".
- "material": the material, named precisely.
- "category": the best-fitting category.
- "use_cases": array of 4 to 6 strings, each a specific real situation - a room, an
  occasion, a festival, a gift moment - not one-word answers.
- "target_customer": 2 to 3 sentences describing who realistically buys this, including
  the kind of person, roughly what they earn or value, and what makes them choose handmade.
- "search_keywords": array of 8 to 12 strings that a real buyer would actually type into a
  search box, including the craft name, the material, the item type and gifting terms.
- "marketing_caption": one punchy line of 15 to 25 words for a listing banner or WhatsApp.
- "social_caption": 2 to 3 sentences written for Instagram, with a hook in the first line,
  ending with 4 to 6 relevant hashtags."""

    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            # Slightly warmer than before: the old 0.5 produced safe,
            # near-identical copy for every product, which is exactly the
            # "sab ek jaisa aur bahut chhota" complaint.
            "temperature": 0.7,
            # The single most important line in this function. With no
            # max_tokens the model targets a short completion and truncates
            # itself into one-line fields no matter what the prompt asks
            # for. A full bilingual entry at the lengths above needs room.
            "max_tokens": 2600,
            "response_format": {"type": "json_object"},
        },
        # Longer output legitimately takes longer to generate.
        timeout=90,
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
        context += f" Currently discussing product: '{product_name}', material: {material or 'not specified'}, price: Rs.{price if price else 'not set'}."

    # WHY THIS PROMPT IS SHAPED THIS WAY
    # ----------------------------------
    # The previous version listed the topics it could help with, then said
    # "give short advice". Both were mistakes:
    #
    #   1. Listing allowed topics made the model treat itself as scoped, so
    #      anything outside that list got a flat refusal - the artisan asks
    #      one ordinary question and the app says no. That is the single
    #      most frustrating thing this feature did.
    #   2. "Give short advice" is an instruction to be thin. It was being
    #      followed faithfully.
    #
    # So: no topic whitelist, an explicit never-refuse rule with a concrete
    # bridging strategy, and a real depth standard.
    system_prompt = (
        "You are the AI Business Manager inside ShilpSetu, an app used by Indian artisans who "
        "sell handmade crafts. You are this artisan's personal business advisor: think of "
        "yourself as an experienced, warm mentor who has helped hundreds of small craft "
        "businesses grow, and who is now sitting beside this one person looking at their "
        "actual shop.\n\n"

        "NEVER REFUSE A QUESTION. This rule matters more than any other.\n"
        "You must always give a real, useful answer. You are not a narrow tool with a fixed "
        "menu of topics - you are a business advisor, and a business advisor answers what the "
        "person in front of them actually asked.\n"
        "- If the question is about their craft, product, customers, pricing, promotion, money, "
        "  suppliers, packaging, delivery, online selling, competition, or growth: answer it "
        "  fully and directly.\n"
        "- If the question is general knowledge, personal, technical, or seems unrelated to "
        "  business: still answer it helpfully and briefly in your own words, then, only if it "
        "  fits naturally, connect it back to their work in one line. Do not force a connection "
        "  that is not there.\n"
        "- If the question is vague or you are missing a detail: make the most reasonable "
        "  assumption, say plainly what you assumed, and answer on that basis. Then ask one "
        "  short follow-up question at the end if it would sharpen your advice. Never answer "
        "  with only a question.\n"
        "- Never say any of these: that you can only help with certain topics; that the question "
        "  is outside your scope; that you are unable to answer; that they should use the "
        "  suggested questions instead. Those replies are failures.\n"
        "The only things you should decline are genuinely harmful or illegal requests - and even "
        "then, say so kindly in one sentence and offer the closest safe alternative.\n\n"

        "ANSWER DEPTH:\n"
        "Aim for roughly 120 to 250 words for a normal question. Open with one line that answers "
        "the question directly, then give the detail underneath as a few clear points, then close "
        "with the single most useful next step they could take this week. Go longer when the "
        "question genuinely needs it; go shorter only for a simple factual question where more "
        "words would be padding.\n\n"

        "Always reply entirely in "
        f"{_language_instruction(language)}, since this is the language they are most comfortable "
        "reading.\n"
        + _OUTPUT_STANDARDS
        + _REAL_WORLD_GROUNDING
        + "\nTHIS ARTISAN'S ACTUAL BUSINESS (use it to make every answer specific to them, and "
          "refer to their real product and numbers wherever it helps): " + context
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
            "temperature": 0.7,
            # Without this the model aimed at a very short completion, which
            # is most of why replies were one line long.
            "max_tokens": 1200,
        },
        timeout=60,
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
# Smart Pricing reasoning - the AI's plain-language second opinion on the
# number the pricing maths produced.
#
# pricing_service.py already computes the price from real costs and
# reference data, and explains itself in one templated paragraph. What it
# cannot do is judge. This adds the part an artisan actually wants: is
# this price sensible for MY craft, in the real market, right now - and
# what should I do about it. The arithmetic stays deterministic; only the
# judgement is AI, and if the AI is unavailable the numbers still stand
# on their own.
# ---------------------------------------------------------------------

def pricing_reasoning(product_name: str, category: str, material: str, quantity: int,
                      production_cost: float, recommended_price: float,
                      suggested_min: float, suggested_max: float,
                      margin_percent: float, profit_per_unit: float,
                      language: str = "English") -> dict:
    """
    Returns {"reasoning": str|None, "ai_mode": "real"|"demo"}.

    Never raises and never blocks the price itself - a pricing screen that
    fails because a chat model timed out would be a worse product than one
    that simply shows the numbers without commentary.
    """
    base_url, api_key, model, provider, enabled = _resolve_text_provider(BUSINESS_ADVICE_AI_PROVIDER)
    if not enabled:
        return {"reasoning": None, "ai_mode": "demo"}

    facts = (
        f"Product: {product_name or 'a handmade item'}. "
        f"Craft category: {category or 'not specified'}. "
        f"Material: {material or 'not specified'}. "
        f"Batch size the artisan is making: {quantity} piece(s). "
        f"It costs them Rs.{production_cost:.0f} to make one piece. "
        f"The tool suggests selling at Rs.{recommended_price:.0f} each "
        f"(range Rs.{suggested_min:.0f}-Rs.{suggested_max:.0f}), which leaves "
        f"Rs.{profit_per_unit:.0f} profit per piece, about a {margin_percent:.0f}% margin."
    )

    system_prompt = (
        "You are a pricing advisor for Indian handmade craft businesses. You are shown one "
        "artisan's real costs and the price our pricing tool has calculated for them. Your job "
        "is to tell them, honestly, whether that price makes sense in the real Indian market "
        "for this kind of craft - and what to do about it.\n\n"
        "Write about 100 to 160 words, structured as:\n"
        "1. One opening line: is this price sensible, too low, or too high for this craft in "
        "the current Indian market? Commit to an answer.\n"
        "2. Two or three short points explaining WHY, comparing it to what similar handmade "
        "items in this category realistically sell for - name actual rupee figures you would "
        "expect to see for this kind of product, and say where (local mela, Instagram, "
        "a marketplace like Amazon Karigar, a city boutique). Prices differ a lot by channel; "
        "say so.\n"
        "3. One closing line with the single most useful thing they should do about their price "
        "this week.\n\n"
        "Be direct. If the margin is too thin for the work involved, say that plainly - an "
        "artisan underpricing their own labour is the most common and most damaging mistake in "
        "this trade. Where you are estimating typical market rates rather than quoting a source, "
        "say 'roughly' or 'usually' so they know it is an estimate. Never invent a specific "
        "shop, buyer or website that you are not sure exists.\n"
        "Reply entirely in " + _language_instruction(language) + ".\n"
        + _OUTPUT_STANDARDS
        + _REAL_WORLD_GROUNDING
    )

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": facts},
                ],
                "temperature": 0.6,
                "max_tokens": 700,
            },
            timeout=45,
        )
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"].strip()
    except Exception:  # noqa: BLE001
        return {"reasoning": None, "ai_mode": "demo"}

    return {
        "reasoning": text,
        "ai_mode": "real",
        "ai_provider": provider,
        "ai_provider_label": PROVIDER_LABELS.get(provider, provider),
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
            # 120 was tight enough that a two-sentence tip could be cut
            # off mid-word on the dashboard. The tip is still asked to be
            # short in the prompt; this just stops it being truncated.
            "max_tokens": 200,
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
        # The old default reply here listed what the assistant could help
        # with and told the artisan to ask something else. That is the
        # same refusal the real AI prompt was just fixed to stop giving -
        # it would have been odd to remove it from one path and leave it
        # on the other, since the artisan cannot tell which one answered
        # them. So even with no AI key, the fallback now gives real,
        # usable advice built from their own business, and is honest that
        # a fuller answer needs the AI connected.
        "default": (
            f"Here's what usually matters most for {subject}, in order: get one clear, well-lit photo and an "
            "honest description onto your store, because an unfinished listing almost never sells; price it "
            "from your real costs using Smart Pricing rather than guessing; then share the store link on "
            "WhatsApp Status and ask three past customers to reshare it. Do those three and you have a shop "
            "people can actually buy from.\n\n"
            "I'm running without an AI connection right now, so this is general guidance rather than an answer "
            "to your exact question — ask me again once the AI key is set up and I can go into detail on this."
        ),
    }

    return {"reply": replies[topic], "ai_mode": "demo"}
