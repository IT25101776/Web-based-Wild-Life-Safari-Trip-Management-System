@echo off
setlocal
where mvn >nul 2>nul
if %errorlevel%==0 (
  mvn %*
  exit /b %errorlevel%
)

set MAVEN_VERSION=3.9.9
set TOOLS_DIR=%~dp0.mvn-local
set MAVEN_HOME=%TOOLS_DIR%\apache-maven-%MAVEN_VERSION%
if exist "%MAVEN_HOME%\bin\mvn.cmd" goto runmaven

echo Maven was not found in PATH.
echo Downloading Apache Maven %MAVEN_VERSION% locally for this project...
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip' -OutFile '%TOOLS_DIR%\maven.zip'; Expand-Archive -Force '%TOOLS_DIR%\maven.zip' '%TOOLS_DIR%'"
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo.
  echo Could not download Maven automatically.
  echo Install Apache Maven and make sure the mvn command works, then run this file again.
  pause
  exit /b 1
)

:runmaven
call "%MAVEN_HOME%\bin\mvn.cmd" %*
exit /b %errorlevel%
