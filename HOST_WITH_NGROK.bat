@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Safari Lanka - Host with ngrok

cls
echo ================================================================
echo   SAFARI LANKA - HOST FULL WEBSITE WITH NGROK
echo ================================================================
echo.
echo This starts:
echo   1. Spring Boot backend on localhost:8080
echo   2. Vite frontend on localhost:5173
echo   3. One public ngrok HTTPS tunnel to port 5173
echo   4. Spring Boot continues using your LOCAL MySQL database on 3306
echo.
echo IMPORTANT: MySQL Server must already be running.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Install Node.js, reopen Command Prompt, then try again.
  pause
  exit /b 1
)

where ngrok >nul 2>nul
if errorlevel 1 (
  echo [ERROR] ngrok was not found in PATH.
  echo.
  echo Install ngrok first. On Windows you can use:
  echo   winget install ngrok -s msstore
  echo.
  echo Then add your ngrok authtoken ONCE:
  echo   ngrok config add-authtoken YOUR_AUTHTOKEN
  echo.
  pause
  exit /b 1
)

echo Starting Safari Lanka in ngrok hosting mode...
echo.
npm run host:ngrok

if errorlevel 1 (
  echo.
  echo [ERROR] Hosting mode stopped with an error.
  echo Check MySQL, Java 17, Node.js, ports 5173/8080 and ngrok authentication.
)

echo.
pause
endlocal
