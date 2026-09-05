import os
from pathlib import Path
from dotenv import load_dotenv

# Load variables from the ".env" file in backend/ into the environment,
# so os.environ.get(...) below can see them.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Primary database is Supabase (hosted Postgres) as of 2026-09-05 - set
# via DATABASE_URL in backend/.env (see .env.example for the connection
# string format). Falls back to a local SQLite file only if DATABASE_URL
# is left unset, e.g. for fully-offline development.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# ---------------------------------------------------------------------
# AI configuration - two swappable providers
# ---------------------------------------------------------------------
# Gemini (free, recommended default) and OpenAI/ChatGPT (paid, needs
# billing enabled on platform.openai.com) can each be used independently
# for the two text features. This lets you run everything for free on
# Gemini, and optionally switch just one feature to OpenAI later to
# compare answer quality - without touching any code.

# ---- Provider 1: Google Gemini --------------------------------------
# Free key: https://aistudio.google.com/apikey
AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_API_BASE_URL = os.environ.get(
    "AI_API_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"
)
AI_MODEL = os.environ.get("AI_MODEL", "gemini-2.5-flash")

# Gemini's native (non-OpenAI-shaped) endpoint - the only one that can
# edit images, so the Photo Studio always uses Gemini regardless of the
# text provider settings below.
GEMINI_API_BASE = os.environ.get(
    "GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta"
)
# "gemini-2.5-flash-image" was the preview-era model name (2025) this app
# originally shipped with. Google has since promoted the GA successor to
# "gemini-3.1-flash-image" (the old preview name may now 404 or error, which
# is a likely cause if Photo Studio silently falls back to the local engine
# every time). Override via GEMINI_IMAGE_MODEL in .env if Google renames it
# again - check https://ai.google.dev/gemini-api/docs/models for the current
# name before assuming the code is broken.
GEMINI_IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")

# ---- Provider 2: OpenAI / ChatGPT ------------------------------------
# Paid key: https://platform.openai.com/api-keys (needs billing enabled -
# there is no free tier like Gemini's).
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE_URL = os.environ.get("OPENAI_API_BASE_URL", "https://api.openai.com/v1")
# "gpt-5.6-luna" - confirmed 2026-09-05 directly on the user's own
# OpenAI business pricing dashboard ("Fast, affordable model for
# everyday work" - exactly this app's use case: short catalogue text,
# short chat replies, one-line insight tips). $0.20/1M input,
# $1.20/1M output - about 25-75x cheaper than gpt-4o-mini for the kind
# of short responses this app generates. Since it's visible on the
# user's own account (not just a training-data guess), the earlier
# "stay conservative" concern doesn't apply here - fall back to
# "gpt-4o-mini" in .env only if this ever 404s for some reason.
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")
# Image edit model for the OpenAI photo-enhancement path (used by
# openai_image_service.py). Same reasoning as above: "gpt-image-1" is
# the established, broadly-available name; "gpt-image-2" is newer and
# reportedly cheaper/better but override it here once you've confirmed
# your account has access, rather than defaulting to it blind.
OPENAI_IMAGE_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")

# ---- Which provider each feature uses --------------------------------
# Defaults to "openai" - the user is buying OpenAI credits specifically
# for this hackathon, so OpenAI is now the PRIMARY provider for every
# text feature (Catalogue, Business Manager, the Insight card). Gemini
# is kept fully working as a free automatic fallback (see
# routes/image.py and ai_service.py) rather than removed - if the
# OpenAI key runs out of credit mid-hackathon or hits a rate limit,
# nothing breaks, it just quietly uses the free Gemini path instead.
# Set either of these to "gemini" in .env to flip a single feature back.
CATALOGUE_AI_PROVIDER = os.environ.get("CATALOGUE_AI_PROVIDER", "openai").strip().lower()
BUSINESS_ADVICE_AI_PROVIDER = os.environ.get("BUSINESS_ADVICE_AI_PROVIDER", "openai").strip().lower()

# DEMO_MODE controls whether we are allowed to call a real AI at all.
#   auto  (recommended) -> real AI whenever a feature's chosen provider
#                           has a key, Demo Mode otherwise
#   true                -> force Demo Mode even if keys are present
#   false               -> force real AI (will error visibly if a key is bad)
_demo_setting = os.environ.get("DEMO_MODE", "auto").strip().lower()
DEMO_MODE = _demo_setting == "true"  # "auto" and "false" both mean: don't force it


def _resolve_text_provider(provider_name: str):
    """
    Returns (base_url, api_key, model, provider_label, enabled) for
    whichever provider a feature is configured to use.

    If the feature wants OpenAI but no OpenAI key is configured, this
    automatically falls back to Gemini (when that key IS present)
    instead of going straight to Demo Mode - OpenAI is the preferred
    provider now, but a free working Gemini key is a strictly better
    fallback than no real AI at all.
    """
    if provider_name == "openai":
        if OPENAI_API_KEY:
            return OPENAI_API_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL, "openai", not DEMO_MODE
        if AI_API_KEY:
            return AI_API_BASE_URL, AI_API_KEY, AI_MODEL, "gemini", not DEMO_MODE
        return OPENAI_API_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL, "openai", False
    enabled = bool(AI_API_KEY) and not DEMO_MODE
    return AI_API_BASE_URL, AI_API_KEY, AI_MODEL, "gemini", enabled

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days - fine for a hackathon demo

# The frontend's public URL - used to build the storefront link that
# gets encoded into each business's QR code.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5180")
