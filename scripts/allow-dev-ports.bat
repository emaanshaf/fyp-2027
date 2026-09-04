@echo off
REM Opens the two ports a phone needs to reach this machine's dev servers.
REM
REM Windows Firewall blocks inbound connections to ports with no allow rule, so
REM Expo Go can fetch nothing and simply times out with no useful error.
REM
REM   8081 - Metro, serves the JS bundle to Expo Go
REM   3001 - the Qitab-e-Noor API the app calls
REM
REM Private profile only: this opens the ports to your own network, not to
REM public Wi-Fi. Run scripts\remove-dev-ports.bat when you are finished.
REM
REM RIGHT-CLICK THIS FILE AND CHOOSE "RUN AS ADMINISTRATOR".

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   This needs administrator rights.
  echo   Right-click allow-dev-ports.bat and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

echo Adding firewall rules...

netsh advfirewall firewall delete rule name="Expo Metro 8081" >nul 2>&1
netsh advfirewall firewall delete rule name="Qitab API 3001" >nul 2>&1

netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081 profile=private
netsh advfirewall firewall add rule name="Qitab API 3001" dir=in action=allow protocol=TCP localport=3001 profile=private

echo.
echo Done. Reopen the app in Expo Go:
echo     exp://192.168.0.138:8081
echo.
pause
