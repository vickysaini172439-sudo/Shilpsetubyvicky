from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import Base, engine
from app.models import user, business  # noqa: F401  (import so tables register with Base)
from app.routes import auth, users

app = FastAPI(title="ShilpSetu API", version="0.1.0")

# CORS = Cross-Origin Resource Sharing. Our frontend (localhost:5173) and
# backend (localhost:8000) are different "origins" from the browser's
# point of view, so without this, the browser blocks the frontend from
# calling the backend. This line explicitly allows it during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Creates all database tables (users, businesses, ...) the first time
# the backend starts, if they don't already exist yet.
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/")
def read_root():
    return {"message": "ShilpSetu backend is running", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
