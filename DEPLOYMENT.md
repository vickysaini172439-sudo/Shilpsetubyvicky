# ShilpSetu — Live Deployment

Everything below is the free-tier setup: total hosting cost is zero.

## Live addresses

| Piece | Where it runs | Address |
|---|---|---|
| Backend (FastAPI) | Render, free plan, Singapore region | https://shilpsetu-backend.onrender.com |
| API docs | Render (same service) | https://shilpsetu-backend.onrender.com/docs |
| Database (Postgres) | Supabase, free plan, Mumbai (ap-south-1) | managed by Supabase |
| Frontend (React + Vite) | Vercel, free Hobby plan | see the Vercel dashboard |

## How a deploy happens

Both hosts watch the `main` branch of this repository. Pushing to `main`
automatically rebuilds and redeploys the backend on Render and the
frontend on Vercel. There is no manual deploy step.

- Backend build command: `pip install -r backend/requirements-deploy.txt`
- Backend start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- `requirements-deploy.txt` is `requirements.txt` minus `rembg`, which
  would not fit in the free plan's 512MB of RAM.

## The sleep problem, and the fix

A free Render web service goes to sleep after about 15 minutes with no
traffic. The next request then waits roughly 50 seconds while the service
restarts. During judging that reads as a broken app.

The fix is to send the backend a small request every few minutes so the
idle timer never reaches 15 minutes. The endpoint to ping is:

    https://shilpsetu-backend.onrender.com/health

It returns a tiny "ok" response and touches no database, so pinging it
costs effectively nothing.

**Before a demo:** open the frontend once about a minute beforehand. If
the backend had gone to sleep, that first visit wakes it, and everything
after it is fast.

## Environment variables

Secrets are never committed. They live in the Render dashboard
(Environment tab) for the backend, and in the Vercel project settings for
the frontend. `backend/.env.example` lists what the backend expects;
`frontend/.env.production` holds only the public backend URL.
