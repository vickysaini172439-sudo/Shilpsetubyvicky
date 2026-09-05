@echo off
echo ============================================
echo ShilpSetu - Backend Diagnostic
echo ============================================
echo.
echo Running a full check and saving the result to
echo backend_report.txt so Claude can read it directly.
echo.
cd /d %~dp0backend
call venv\Scripts\activate

> "%~dp0backend_report.txt" (
  echo ==== PYTHON VERSION ====
)
python --version >> "%~dp0backend_report.txt" 2>&1

echo. >> "%~dp0backend_report.txt"
echo ==== INSTALLED PACKAGES ==== >> "%~dp0backend_report.txt"
pip list >> "%~dp0backend_report.txt" 2>&1

echo. >> "%~dp0backend_report.txt"
echo ==== IMPORT TEST (the important part) ==== >> "%~dp0backend_report.txt"
python -c "import app.main; print('BACKEND READY: all modules loaded successfully')" >> "%~dp0backend_report.txt" 2>&1

echo. >> "%~dp0backend_report.txt"
echo ==== PORT CHECK ==== >> "%~dp0backend_report.txt"
netstat -aon | findstr ":8010 :5180" >> "%~dp0backend_report.txt" 2>&1

echo.
echo ============================================
echo Report saved to backend_report.txt
echo.
echo Result of the import test:
echo.
type "%~dp0backend_report.txt" | findstr /C:"BACKEND READY" /C:"Error" /C:"error"
echo.
echo Now just tell Claude "report is ready" and it will
echo read the file itself - no copy-pasting needed.
echo ============================================
pause
