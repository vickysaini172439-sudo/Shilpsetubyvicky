from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.db import Base, engine, SessionLocal
from app.models import user, business, product, pricing, market_data, chat_message  # noqa: F401
from app.routes import auth, users, products, image, ai, pricing as pricing_routes, business_manager
from app.services.seed_service import seed_market_data_if_empty

app = FastAPI(title="ShilpSetu API", version="0.1.0")

# CORS = Cross-Origin Resource Sharing. Our frontend (localhost:5173) and
# backend (localhost:8000) are different "origins" from the browser's
# point of view, so without this, the browser blocks the frontend from
# calling the backend. expose_headers lets the frontend read our custom
# "was this real AI or demo mode" header on image responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Background-Removed-Real-Ai"],
)

# Creates all database tables the first time the backend starts, if they
# don't already exist yet.
Base.metadata.create_all(bind=engine)

# Fills the sample/reference pricing table once, if it's empty, so Smart
# Pricing has something to compare against from day one.
with SessionLocal() as _db:
    seed_market_data_if_empty(_db)

# Makes anything saved in backend/uploads/ available at a public URL,
# e.g. a file at uploads/products/abc.jpg becomes reachable at
# http://localhost:8000/uploads/products/abc.jpg
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(image.router)
app.include_router(ai.router)
app.include_router(pricing_routes.router)
app.include_router(business_manager.router)


@app.get("/")
def read_root():
    return {"message": "ShilpSetu backend is running", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
