# ShilpSetu — Live Deployment

Everything below runs on free plans. Total hosting cost: zero.

## Live addresses

| Piece | Where it runs | Address |
|---|---|---|
| Backend (FastAPI) | Render, free plan, Singapore | https://shilpsetu-backend.onrender.com |
| API docs | Render (same service) | https://shilpsetu-backend.onrender.com/docs |
| Database (Postgres) | Supabase, free plan, Mumbai (ap-south-1) | project `cfaoxjakcaxefqpsuozd` |
| Frontend (React + Vite) | Vercel, free Hobby plan | see the Vercel dashboard |

## How a deploy happens

Both hosts watch the `main` branch of this repository. Pushing to `main`
rebuilds and redeploys automatically — there is no manual deploy step.

- Backend build command: `pip install -r backend/requirements-deploy.txt`
- Backend start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- `requirements-deploy.txt` is `requirements.txt` minus `rembg`, which
  will not fit in the free plan's 512MB of RAM.

## The sleep problem, and the fix

A free Render web service sleeps after about 15 minutes with no traffic.
The next request then waits roughly 50 seconds while it restarts, which
during judging reads as a broken app.

**The fix, already set up:** the Supabase database pings the backend
itself, every 5 minutes, using `pg_cron` (a scheduler that runs inside
Postgres) and `pg_net` (which makes the HTTP request). The backend
therefore never sits idle long enough to fall asleep.

The job is called `keep-backend-awake`:

```sql
-- what was run once, to create it
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'keep-backend-awake',
  '*/5 * * * *',
  $$select net.http_get(url := 'https://shilpsetu-backend.onrender.com/health')$$
);
```

Useful commands:

```sql
-- is the job scheduled and active?
select jobid, jobname, schedule, active from cron.job;

-- did recent runs succeed?
select jobid, status, start_time from cron.job_run_details
order by start_time desc limit 10;

-- what did the backend actually answer? (200 = awake and healthy)
select id, status_code, error_msg, created from net._http_response
order by id desc limit 10;

-- to switch it off (e.g. after the hackathon)
select cron.unschedule('keep-backend-awake');
```

Two reasons this is better than an external ping service: it needs no
extra account, and a free Supabase project pauses after a week of
inactivity — this job counts as activity, so it keeps the database awake
as well as the backend.

**Belt and braces before a demo:** open the frontend once a minute
beforehand. Everything after that first visit is fast.

## Environment variables

Secrets are never committed. They live in the Render dashboard
(Environment tab) for the backend and in the Vercel project settings for
the frontend. `backend/.env.example` lists what the backend expects;
`frontend/.env.production` holds only the public backend URL.

`DATABASE_URL` on Render points at the Supabase Postgres above. The app
falls back to a local SQLite file only when `DATABASE_URL` is unset, which
is what local development uses.
