@echo off
REM ShilpSetu - one-click local dev startup.
REM Opens two windows: one running the backend (FastAPI), one running
REM the frontend (Vite). Close either window to stop that server.

echo Checking ports 5180 and 8010 are free (closing any leftover
echo processes from a previous run that didn't shut down cleanly)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5180 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8010 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
echo.

echo Starting ShilpSetu backend...
start "ShilpSetu Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8010"

echo Starting ShilpSetu frontend...
start "ShilpSetu Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:5180
echo Backend:  http://127.0.0.1:8010/health
echo.
pause
