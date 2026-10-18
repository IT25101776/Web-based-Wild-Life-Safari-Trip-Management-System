@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Safari Lanka - Setup Database

set "SQL_FILE=%~dp0database\SAFARI_LANKA_FULL.sql"
set "MYSQL_EXE="

cls
echo ================================================================
echo   SAFARI LANKA - DATABASE SETUP
echo ================================================================
echo.
echo Database : safari_lanka
echo Username : root
echo Password : 1234
echo SQL file : database\SAFARI_LANKA_FULL.sql
echo.

if not exist "%SQL_FILE%" (
    echo [ERROR] SQL file was not found:
    echo %SQL_FILE%
    echo.
    pause
    exit /b 1
)

where mysql >nul 2>nul
if not errorlevel 1 set "MYSQL_EXE=mysql"

if not defined MYSQL_EXE if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
if not defined MYSQL_EXE if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not defined MYSQL_EXE if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"

if not defined MYSQL_EXE (
    echo [ERROR] MySQL command-line client was not found.
    echo.
    echo You can import the same file using MySQL Workbench:
    echo   1. Open MySQL Workbench.
    echo   2. Connect as root with password 1234.
    echo   3. File ^> Open SQL Script.
    echo   4. Open database\SAFARI_LANKA_FULL.sql.
    echo   5. Click Execute.
    echo.
    pause
    exit /b 1
)

echo WARNING: This full SQL file recreates the safari_lanka database.
echo Existing safari_lanka data will be replaced by the SQL file contents.
echo.
set /p "CONFIRM=Type YES to continue: "
if /I not "%CONFIRM%"=="YES" (
    echo Cancelled. No database changes were made.
    echo.
    pause
    exit /b 0
)

echo.
echo Importing database...
"%MYSQL_EXE%" -u root -p1234 < "%SQL_FILE%"
if errorlevel 1 (
    echo.
    echo [ERROR] Database import failed.
    echo Make sure MySQL Server is running and root password is 1234.
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   SUCCESS - safari_lanka database is ready
echo ================================================================
echo.
pause
endlocal
