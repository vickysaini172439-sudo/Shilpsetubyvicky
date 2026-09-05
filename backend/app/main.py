from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.db import Base, engine, SessionLocal
from app.models import user, business, product, pricing, market_data, chat_message  # noqa: F401
from app.routes import (
    auth, users, products, image, ai,
    pricing as pricing_routes, business_manager, store, dashboard, market,
)
from app.services.seed_service import seed_market_data_if_empty
from app.database.migrations import run_migrations

app = FastAPI(title="ShilpSetu API", version="0.1.0")

# CORS = Cross-Origin Resource Sharing. Our frontend (localhost:5180) and
# backend (localhost:8010) are different "origins" from the browser's
# point of view, so without this, the browser blocks the frontend from
# calling the backend. expose_headers lets the frontend read our custom
# "was this real AI or demo mode" header on image responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5180", "http://127.0.0.1:5180"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Background-Removed-Real-Ai",
        "X-Enhance-Engine",
        "X-Enhance-Note",
    ],
)

# Creates all database tables the first time the backend starts, if they
# don't already exist yet.
Base.metadata.create_all(bind=engine)

# Adds any columns that were introduced after the database file was first
# created, so existing accounts and products survive an app update.
run_migrations(engine)

# Fills the sample/reference pricing table once, if it's empty.
with SessionLocal() as _db:
    seed_market_data_if_empty(_db)

# Makes anything saved in backend/uploads/ available at a public URL.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(image.router)
app.include_router(ai.router)
app.include_router(pricing_routes.router)
app.include_router(business_manager.router)
app.include_router(store.business_router)
app.include_router(store.store_router)
app.include_router(dashboard.router)
app.include_router(market.router)


@app.get("/")
def read_root():
    return {"message": "ShilpSetu backend is running", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
