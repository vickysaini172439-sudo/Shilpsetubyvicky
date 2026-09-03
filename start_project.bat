@echo off
REM ShilpSetu - one-click local dev startup.
REM Opens two windows: one running the backend (FastAPI), one running
REM the frontend (Vite). Close either window to stop that server.

echo Starting ShilpSetu backend...
start "ShilpSetu Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload"

echo Starting ShilpSetu frontend...
start "ShilpSetu Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000/health
echo.
pause
