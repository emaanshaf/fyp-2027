@echo off
echo Stopping all Qitab-e-Noor services...
taskkill /F /IM node.exe >nul 2>&1
echo All services stopped.
timeout /t 2 >nul
