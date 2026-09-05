@echo off
echo ============================================
echo ShilpSetu - Reset to a Fresh Application
echo ============================================
echo.
echo This will PERMANENTLY DELETE:
echo   - all artisan accounts and their businesses
echo   - all products
echo   - all saved pricing calculations
echo   - the whole AI business manager chat history
echo   - every uploaded product photo and logo
echo.
echo This will KEEP:
echo   - all of your code
echo   - the sample market pricing data
echo.
echo TIP: close the backend window first if it is running.
echo.
set /p CONFIRM="Type YES (in capitals) to continue: "
if not "%CONFIRM%"=="YES" (
    echo.
    echo Cancelled. Nothing was deleted.
    pause
    exit /b
)
echo.
cd /d %~dp0backend
call venv\Scripts\activate
python reset_data.py
echo.
echo ============================================
echo Done. Start the app again with start_project.bat
echo and register a brand new account.
echo ============================================
pause
