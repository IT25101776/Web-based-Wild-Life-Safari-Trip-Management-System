@echo off
cd /d "%~dp0"
title Safari Lanka

where node >nul 2>nul
if errorlevel 1 (
  echo [SAFARI] Node.js was not found. Install Node.js LTS first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [SAFARI] npm was not found. Reinstall Node.js LTS and enable PATH.
  pause
  exit /b 1
)

call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [SAFARI] Development server stopped with error code %EXIT_CODE%.
  pause
)
exit /b %EXIT_CODE%
