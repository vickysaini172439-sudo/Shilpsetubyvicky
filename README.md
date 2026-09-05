# ShilpSetu — AI-Powered Virtual Business Manager for Artisans

Smart India Hackathon 2026 — Problem Statement **PS26090**
"AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans"
Ministry of Social Justice and Empowerment

ShilpSetu turns a physical artisan's craft into a market-ready digital business:
photo → AI enhancement → voice/text description → bilingual (Hindi + English)
catalogue → smart pricing → AI business advice → digital storefront → QR code →
market linkage guidance.

## Features

- Artisan registration & login (JWT-based auth, hashed passwords)
- Dashboard with real product stats and a Digital Readiness Score
- Product management (add/edit/delete/draft/publish, photo upload)
- **AI Product Photo Studio** — brightness/contrast/sharpness enhancement (real,
  always on) + AI background removal (real, via the local `rembg` model, when
  installed — otherwise a clearly labeled Demo Mode)
- **AI Multilingual Catalogue** — voice (browser speech-to-text) or typed input
  → structured Hindi + English catalogue fields, editable before saving. Uses a
  real AI API when a key is configured, otherwise a clearly labeled Demo Mode
  template generator
- **Smart Pricing** — cost-plus pricing blended with a small sample/reference
  market price table (clearly labeled as sample data, not live market data)
- **AI Business Manager** — a chat assistant that knows the artisan's business
  and product context, with suggested questions and saved chat history
- **Digital Storefront** — a public, shareable page per business
  (`/store/<slug>`) generated from real database data, with a QR code
  ("Share My Store")
- **Market Linkage** — buyer-type guidance based on the artisan's product
  categories (clearly labeled as guidance, not a live marketplace integration)
- Installable as a Progressive Web App (PWA)

## Technology Stack

| Layer      | Choice                                              |
|------------|------------------------------------------------------|
| Frontend   | React + Vite + Tailwind CSS (mobile-first PWA)       |
| Backend    | Python + FastAPI                                     |
| Database   | SQLite (dev) via SQLAlchemy — portable to PostgreSQL |
| Auth       | JWT + bcrypt password hashing                        |
| Images     | Pillow (enhance) + rembg (optional, local AI bg removal) |
| AI text    | Pluggable service layer — real API (OpenAI-compatible) with automatic Demo Mode fallback |
| Voice      | Browser Web Speech API (no backend cost)              |
| QR Codes   | `qrcode` Python library                               |

## Project Structure

```
SIH project/
├── frontend/           React + Vite app
│   ├── src/
│   │   ├── pages/       one file per screen
│   │   ├── components/  reusable UI pieces (nav, forms, pickers)
│   │   ├── services/    api.js (backend calls), AuthContext.jsx (login state)
│   │   └── constants.js craft categories / states / languages
│   └── public/          manifest.json, icon.svg, sw.js (PWA)
├── backend/
│   ├── app/
│   │   ├── main.py       FastAPI entry point
│   │   ├── models/       SQLAlchemy database tables
│   │   ├── schemas/      Pydantic request/response shapes
│   │   ├── routes/       one file per API area (auth, products, ai, ...)
│   │   ├── services/     business logic (AI, pricing, images, auth, seeding)
│   │   └── database/     SQLAlchemy engine/session setup
│   ├── uploads/           product photos, logos (gitignored)
│   ├── requirements.txt
│   └── .env.example       copy to .env and fill in
├── start_project.bat      one-click local dev startup (Windows)
├── SETUP_GUIDE.md
├── SIH_DEMO_GUIDE.md
└── README.md
```

## Installation

Requires Node.js and Python 3.10+ installed on Windows. See **SETUP_GUIDE.md**
for full beginner-friendly steps. Short version:

```
cd frontend
npm install
npm run dev
```
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```
Or just double-click **start_project.bat** once both are set up once manually.

## Environment Variables (`backend/.env`)

| Variable       | Purpose                                                        |
|----------------|------------------------------------------------------------------|
| `DATABASE_URL` | Where the SQLite database file lives                            |
| `SECRET_KEY`   | Random string used to sign login tokens — auto-generated for you |
| `AI_API_KEY`   | Optional. Leave empty to run AI features in Demo Mode            |
| `DEMO_MODE`    | `true` forces Demo Mode even if a key is set                     |
| `FRONTEND_URL` | Used to build the storefront link encoded in QR codes            |

Never commit the real `.env` file — it's already in `.gitignore`.

## Database

SQLite file at `backend/app.db`, created automatically on first backend start.
Tables: `users`, `businesses`, `products`, `pricing_records`, `market_data`,
`chat_messages`. A small **sample** reference pricing dataset is seeded
automatically on first run (clearly labeled wherever shown as not live data).

## Demo Mode

Every AI feature (catalogue generation, background removal, business advice)
degrades gracefully and honestly when no AI API key / optional model is
configured — a "Demo Mode" badge or note is shown in the UI instead of
pretending the result is from a real model. This means the app is always
demoable, even offline.

## AI configuration

One free Google AI Studio key (`AI_API_KEY` in `backend/.env`) powers all three
AI features — the Photo Studio, catalogue generation and the Business Manager.
Without it the app runs in honest Demo Mode and says so on screen. See
SETUP_GUIDE.md for the two-minute setup.

## Future Improvements

PostgreSQL/Supabase migration, real live market data, ONDC / government
marketplace integration, B2B buyer accounts, order/inventory management,
payments, social post generation, Android packaging (Capacitor), cloud
deployment.
