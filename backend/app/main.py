from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# This is the entry point of our backend. Running "uvicorn app.main:app --reload"
# starts this file and turns it into a live web server.
app = FastAPI(title="ShilpSetu API", version="0.1.0")

# CORS = Cross-Origin Resource Sharing. Our frontend (localhost:5173) and
# backend (localhost:8000) are technically two different "origins" from the
# browser's point of view, so without this, the browser blocks the frontend
# from calling the backend. This line explicitly allows our frontend to talk
# to our backend during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "ShilpSetu backend is running", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
