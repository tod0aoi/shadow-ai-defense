@echo off
title Shadow AI Defense Platform - SOC Launcher
color 0A

echo =========================================================================
echo    AI-Powered Shadow AI Data Leakage Detection ^& Risk Assessment Platform
echo                    Final-Year Engineering SOC Launcher
echo =========================================================================
echo.

cd /d "%~dp0"

echo [*] Checking Environment & Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [-] Error: Node.js is not found in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

echo [*] Checking Python Environment...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [-] Error: Python is not found in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

echo [*] Building Backend TypeScript (if needed)...
cd /d "%~dp0backend"
if not exist "dist\index.js" (
    echo [*] Transpiling backend TypeScript...
    call npm run build
)

echo [*] Checking Frontend Production Build...
cd /d "%~dp0frontend"
if not exist "build\index.html" (
    echo [*] Building React SOC Frontend...
    call npm run build
)

cd /d "%~dp0backend"
echo.
echo =========================================================================
echo    [+] Starting Unified SOC Platform on http://localhost:5000
echo    [+] Default Credentials:
echo        Admin:   username: admin   ^| password: Admin@12345!
echo        Analyst: username: analyst ^| password: Analyst@12345!
echo =========================================================================
echo.

start "" "http://localhost:5000"
call npm start

pause
