@echo off
REM Removes the firewall rules added by allow-dev-ports.bat.
REM
REM Worth running when you are done developing: the rules let anything on your
REM network reach the dev server and the API, and the API is running with a
REM development JWT secret.
REM
REM RIGHT-CLICK THIS FILE AND CHOOSE "RUN AS ADMINISTRATOR".

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   This needs administrator rights.
  echo   Right-click remove-dev-ports.bat and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

netsh advfirewall firewall delete rule name="Expo Metro 8081"
netsh advfirewall firewall delete rule name="Qitab API 3001"

echo.
echo Rules removed.
echo.
pause
