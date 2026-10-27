@echo off
cd /d "%~dp0"
echo Care for You: http://localhost:8765/index.html  (close this window to stop)
start "" http://localhost:8765/index.html
python -m http.server 8765 --bind 127.0.0.1
pause
