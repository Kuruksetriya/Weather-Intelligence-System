@echo off
echo Starting Weather Intelligence Backend Server...
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
