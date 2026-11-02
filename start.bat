@echo off
echo ==========================================
echo    Qitab-e-Noor - Full System Deploy
echo ==========================================
echo.

:: Kill existing processes
echo [1/4] Stopping existing services...
taskkill /F /IM node.exe
timeout /t 2

:: Start backend
echo [2/4] Starting Backend API (port 3001)...
cd /d "%~dp0server"
start "" node server.js
timeout /t 3

:: Start frontend
echo [3/4] Starting Frontend Web App (port 8081)...
cd /d "%~dp0"
start "" npx expo start --web --port 8081
timeout /t 20

:: Verify
echo [4/4] Verifying services...
echo.
curl -s http://localhost:3001/api/health
if %errorlevel%==0 (
    echo   Backend API:   RUNNING  http://localhost:3001
) else (
    echo   Backend API:   FAILED
)

curl -s http://localhost:8081
if %errorlevel%==0 (
    echo   Frontend Web:  RUNNING  http://localhost:8081
) else (
    echo   Frontend Web:  FAILED
)

echo.
echo ==========================================
echo    DEPLOYMENT COMPLETE
echo ==========================================
echo.
echo   Open browser: http://localhost:8081
echo.
echo   To stop: Close this window or run stop.bat
echo.
pause
