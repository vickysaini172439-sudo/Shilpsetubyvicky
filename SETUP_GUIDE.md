# ShilpSetu — Beginner Setup Guide (Windows)

This assumes you have **Node.js** and **Python 3.10+** installed. If a
command below says "not recognized," that's what's missing — install it
from nodejs.org / python.org first (check "Add to PATH" during Python
install).

## 1. Open the project folder

Open PowerShell, then:
```
cd "C:\Users\khushboo\SIH project"
```

## 2. Start the backend (do this once, then every time you work on the project)

```
cd backend
python -m venv venv          (only the very first time)
venv\Scripts\activate
pip install -r requirements.txt   (only needed again if requirements.txt changed)
uvicorn app.main:app --reload
```
You should see `Uvicorn running on http://127.0.0.1:8000`. Leave this window
open — closing it stops your backend. Test it by opening
`http://127.0.0.1:8000/health` in a browser — you should see
`{"status":"healthy"}`.

## 3. Start the frontend (in a SECOND PowerShell window)

```
cd "C:\Users\khushboo\SIH project\frontend"
npm install       (only needed again if package.json changed)
npm run dev
```
You should see a `Local: http://localhost:5173/` link. Open it in your
browser.

## 4. Or use the shortcut

Once you've done steps 2 and 3 manually at least once (so `venv` and
`node_modules` exist), you can just double-click **start_project.bat** in
the project's root folder — it opens both servers for you automatically.

## How the pieces connect

- Your browser talks to the **frontend** at `localhost:5173`.
- The frontend calls the **backend** at `localhost:8000` for anything
  involving data (login, products, AI features).
- The backend stores everything in a single file, `backend/app.db`
  (SQLite) — created automatically the first time you start it.
- Uploaded photos and logos are saved in `backend/uploads/`.
- AI API keys (optional) live in `backend/.env` — never in the code itself.

## Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| "Could not reach the server" in the app | Backend isn't running | Check/restart the backend PowerShell window |
| `ModuleNotFoundError: No module named 'X'` | New Python packages weren't installed | `pip install -r requirements.txt` (venv activated) |
| `'npm'`/`'python'` not recognized | Not installed, or not on PATH | Install Node.js / Python, restart PowerShell |
| Backend error mentioning a database table/column | Database is out of date with newer code | Stop backend, delete `backend/app.db`, restart (recreates it fresh — you'll need to re-register) |
| Port already in use | Something else is already running on 5173/8000 | Close the other program, or ask for help changing the port |

If something else goes wrong: copy the **exact** red error text from the
terminal (or a screenshot) and ask — don't guess or rewrite things blindly.
