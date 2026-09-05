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
You should see `Uvicorn running on http://127.0.0.1:8010`. Leave this window
open — closing it stops your backend. Test it by opening
`http://127.0.0.1:8010/health` in a browser — you should see
`{"status":"healthy"}`.

## 3. Start the frontend (in a SECOND PowerShell window)

```
cd "C:\Users\khushboo\SIH project\frontend"
npm install       (only needed again if package.json changed)
npm run dev
```
You should see a `Local: http://localhost:5180/` link. Open it in your
browser.

## 4. Or use the shortcut

Once you've done steps 2 and 3 manually at least once (so `venv` and
`node_modules` exist), you can just double-click **start_project.bat** in
the project's root folder — it opens both servers for you automatically.

## How the pieces connect

- Your browser talks to the **frontend** at `localhost:5180`.
- The frontend calls the **backend** at `localhost:8010` for anything
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
| Port already in use | Something else is already running on 5180/8010 | Close the other program, or ask for help changing the port |

If something else goes wrong: copy the **exact** red error text from the
terminal (or a screenshot) and ask — don't guess or rewrite things blindly.

## Turning on the real AI (optional, free, 2 minutes)

Without a key, ShilpSetu still runs — it just says "Demo Mode" honestly
wherever a real AI would have been used. To switch the real AI on:

1. Open <https://aistudio.google.com/apikey> and sign in with any Google account.
2. Click **Create API key** and copy it.
3. Open `backend/.env` in Notepad.
4. Put the key after `AI_API_KEY=` so the line looks like
   `AI_API_KEY=AIzaSy...your-key...`
5. Make sure the next line says `DEMO_MODE=auto`.
6. Save the file and restart the backend window.

That one key switches on all three AI features:

| Feature | What changes |
| --- | --- |
| AI Photo Studio | Real AI re-shoots the photo — clean studio background, corrected lighting, sharper craft detail |
| Catalogue | Real translation into Hindi, Hinglish or any listed language |
| AI Business Manager | Real answers instead of template replies |

If the key is wrong or the internet is down, nothing breaks — the app
falls back to the offline engine and tells you on screen what happened.

## Speaking instead of typing

Anywhere you see a 🎙️ button you can speak instead of typing. This uses
the browser's own speech engine, so it is free and needs no setup — but
it only works in **Chrome or Edge**, and needs an internet connection.
The first time, the browser will ask permission to use the microphone.

**Hinglish** is offered as a language throughout. It means Hindi written
in English letters ("Yeh handmade jute bag hai") — much faster than
installing a Devanagari keyboard, and what most people actually type.

## Using OpenAI/ChatGPT instead of Gemini for one feature (optional)

Gemini alone already powers every AI feature for free. Only do this if
you specifically want to compare ChatGPT's answers for the Catalogue or
the AI Business Manager.

1. Create billing at <https://platform.openai.com/> (OpenAI has no free
   tier - a card is required).
2. Create a key at <https://platform.openai.com/api-keys>.
3. In `backend/.env`, add: `OPENAI_API_KEY=sk-...your-key...`
4. Set which feature should use it, e.g.:
   `BUSINESS_ADVICE_AI_PROVIDER=openai`
   (leave `CATALOGUE_AI_PROVIDER=gemini` if you only want to switch one)
5. Restart the backend.

Each screen now honestly shows which provider actually answered
("Google Gemini" / "OpenAI" / "Demo Mode").
