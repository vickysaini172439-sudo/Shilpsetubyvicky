"""
Checks that the Gemini API key in backend/.env actually works, and writes
the result to ai_report.txt in the project folder.

It also lists every model the key can use, which is how we confirm the
exact model names to put in .env - Google renames these from time to
time, and guessing is what causes mysterious "model not found" errors.

Run it with test_ai.bat, or directly:  python test_ai.py
"""

import json
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.config import (  # noqa: E402
    AI_API_KEY, AI_API_BASE_URL, AI_MODEL,
    GEMINI_API_BASE, GEMINI_IMAGE_MODEL, DEMO_MODE,
)
from app.services import gemini_image_service  # noqa: E402

# There is no single global "AI_ENABLED" anymore - each feature resolves
# its own enabled state (see app/config._resolve_text_provider). For this
# report, "can we call real AI at all" just needs a key + not forced into
# Demo Mode, which is what gemini_image_service.is_configured() already
# checks for the image path.
AI_ENABLED = gemini_image_service.is_configured()

REPORT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai_report.txt")
lines = []


def log(text=""):
    print(text)
    lines.append(str(text))


log("==== SHILPSETU AI KEY TEST ====")
log()

if not AI_API_KEY:
    log("RESULT: FAIL - no AI_API_KEY found in backend/.env")
else:
    log(f"Key found: {AI_API_KEY[:6]}...{AI_API_KEY[-4:]}  (length {len(AI_API_KEY)})")
log(f"DEMO_MODE resolved to: {DEMO_MODE}")
log(f"AI_ENABLED (can we call real AI?): {AI_ENABLED}")
log(f"Text endpoint : {AI_API_BASE_URL}   model={AI_MODEL}")
log(f"Image endpoint: {GEMINI_API_BASE}   model={GEMINI_IMAGE_MODEL}")
log()

# ---- 1. Which models does this key actually have? -------------------
log("---- 1. MODELS AVAILABLE TO THIS KEY ----")
text_models, image_models = [], []
try:
    r = requests.get(
        f"{GEMINI_API_BASE}/models",
        headers={"x-goog-api-key": AI_API_KEY},
        timeout=30,
    )
    log(f"HTTP {r.status_code}")
    if r.status_code == 200:
        for m in r.json().get("models", []):
            name = m.get("name", "").replace("models/", "")
            methods = m.get("supportedGenerationMethods", []) or m.get(
                "supportedActions", []
            )
            log(f"  {name}   -> {', '.join(methods) if methods else '(no methods listed)'}")
            if "generateContent" in methods:
                (image_models if "image" in name else text_models).append(name)
    else:
        log(r.text[:800])
except Exception as exc:  # noqa: BLE001
    log(f"ERROR contacting Google: {exc}")
log()

# ---- 2. Does a real text call work? ---------------------------------
log("---- 2. TEXT TEST (used by Catalogue + Business Manager) ----")
try:
    r = requests.post(
        f"{AI_API_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": AI_MODEL,
            "messages": [{"role": "user", "content": "Reply with exactly: SHILPSETU OK"}],
        },
        timeout=60,
    )
    log(f"HTTP {r.status_code}")
    if r.status_code == 200:
        log("REPLY: " + r.json()["choices"][0]["message"]["content"].strip()[:120])
        log("RESULT: TEXT AI WORKS")
    else:
        log(r.text[:800])
        log("RESULT: TEXT AI FAILED")
except Exception as exc:  # noqa: BLE001
    log(f"ERROR: {exc}")
log()

# ---- 3. Does the image model accept a request? ----------------------
log("---- 3. IMAGE TEST (used by AI Photo Studio) ----")
try:
    import base64
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (240, 240), (170, 140, 100)).save(buf, format="JPEG")
    sample = base64.b64encode(buf.getvalue()).decode()

    r = requests.post(
        f"{GEMINI_API_BASE}/models/{GEMINI_IMAGE_MODEL}:generateContent",
        headers={"x-goog-api-key": AI_API_KEY, "Content-Type": "application/json"},
        json={
            "contents": [{"parts": [
                {"text": "Place this object on a clean white studio background."},
                {"inline_data": {"mime_type": "image/jpeg", "data": sample}},
            ]}],
            "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
        },
        timeout=120,
    )
    log(f"HTTP {r.status_code}")
    if r.status_code == 200:
        found = False
        for c in r.json().get("candidates", []):
            for part in (c.get("content") or {}).get("parts", []):
                blob = part.get("inline_data") or part.get("inlineData")
                if blob and blob.get("data"):
                    found = True
                    log(f"Image returned: {len(blob['data'])} base64 characters")
        log("RESULT: IMAGE AI WORKS" if found else "RESULT: replied, but sent no image")
    else:
        log(r.text[:800])
        log("RESULT: IMAGE AI FAILED")
except Exception as exc:  # noqa: BLE001
    log(f"ERROR: {exc}")

log()
log("---- SUGGESTED .env SETTINGS BASED ON WHAT YOUR KEY SUPPORTS ----")
log(f"text models seen : {', '.join(text_models[:12]) if text_models else 'none detected'}")
log(f"image models seen: {', '.join(image_models[:12]) if image_models else 'none detected'}")

with open(REPORT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines))
print(f"\nSaved report to {os.path.abspath(REPORT)}")
