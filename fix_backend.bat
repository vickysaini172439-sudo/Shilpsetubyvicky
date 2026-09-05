@echo off
echo ============================================
echo ShilpSetu - Backend Fix and Self-Test
echo ============================================
echo.
cd /d %~dp0backend

echo Step 1: The old database file can be deleted if it is causing
echo trouble - but that PERMANENTLY DELETES every account, product and
echo photo you have entered. Press Enter to keep your data.
echo.
if not exist app.db goto skipdb
set /p WIPEDB="Delete the database and start completely fresh? Type YES to delete, or press Enter to keep it: "
if /i "%WIPEDB%"=="YES" del /f app.db
if /i "%WIPEDB%"=="YES" echo Old app.db deleted.
if /i not "%WIPEDB%"=="YES" echo Keeping your existing database.
:skipdb
echo.

echo Step 2: Activating the virtual environment...
call venv\Scripts\activate
echo.

echo Step 3: Installing every required package, one at a time,
echo so a single problem package can't block the rest...
echo.
for /f "usebackq delims=" %%i in ("requirements.txt") do (
    echo --- installing %%i ---
    pip install "%%i"
)
echo.

echo Step 4: Self-test - actually trying to load the backend app,
echo the same way it loads it for real. If this prints "BACKEND
echo READY", everything is correctly installed. If it prints a
echo red error instead, copy that error and send it to Claude.
echo.
python -c "import app.main; print('=== BACKEND READY: all modules loaded successfully ===')"
echo.

echo ============================================
echo If you saw BACKEND READY above:
echo   1. Close this window.
echo   2. Double-click start_project.bat
echo   3. Open http://localhost:5180 in your browser.
echo.
echo If you saw an error instead:
echo   Copy the full red error text and send it to Claude.
echo ============================================
pause
