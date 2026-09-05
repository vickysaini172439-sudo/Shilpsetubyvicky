@echo off
echo ============================================
echo ShilpSetu - Testing your Google AI key
echo ============================================
echo.
echo This checks that your key works and finds the exact
echo model names your key is allowed to use.
echo It saves everything to ai_report.txt
echo.
cd /d %~dp0backend
call venv\Scripts\activate
python test_ai.py
echo.
echo ============================================
echo Done. Tell Claude "report is ready" and it will
echo read ai_report.txt and fix the settings for you.
echo ============================================
pause
