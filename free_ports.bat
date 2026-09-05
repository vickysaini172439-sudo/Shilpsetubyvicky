@echo off
echo ============================================
echo ShilpSetu - Free stuck ports (5180 / 8010)
echo ============================================
echo.
echo This happens when a previous frontend/backend window was
echo closed with the X button instead of properly stopped, and
echo Windows left the process running in the background even
echo though the window is gone.
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5180 ^| findstr LISTENING') do (
    echo Found a leftover process on port 5180 (PID %%a) - closing it...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8010 ^| findstr LISTENING') do (
    echo Found a leftover process on port 8010 (PID %%a) - closing it...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo.
    echo Done - ports 5180 and 8010 are now free.
) else (
    echo.
    echo Nothing was using 5180 or 8010 - they were already free.
)
echo.
echo You can now double-click start_project.bat
pause
