@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD=python"
if exist "..\.venv\Scripts\python.exe" (
    set "PYTHON_CMD=..\.venv\Scripts\python.exe"
)

echo Starting local web server on port 8000...
echo Open on this computer: http://127.0.0.1:8000/
echo Open on mobile (same LAN): http://192.168.31.96:8000/
echo If that IP does not work, run ipconfig and use your current IPv4 address.
echo.

"%PYTHON_CMD%" -m http.server 8000 --bind 0.0.0.0

pause
