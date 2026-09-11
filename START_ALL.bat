@echo off
REM DeadZone — Start all services
REM This script opens 5 new terminal windows, each running one service

echo.
echo ========================================
echo DeadZone Setup — Starting all services
echo ========================================
echo.

cd /d "C:\Users\harsh\OneDrive\Desktop\Sanket Setu"

REM Check for Docker
echo Checking Docker...
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop, then run this script again.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Terminal 1: CouchDB
echo Starting Terminal 1: CouchDB...
start "CouchDB" cmd /k "cd /d C:\Users\harsh\OneDrive\Desktop\Sanket Setu\infra && docker-compose up && pause"
timeout /t 3 /nobreak

REM Terminal 2: Seed Data
echo Starting Terminal 2: Seed Data...
start "Seed Data" cmd /k "cd /d C:\Users\harsh\OneDrive\Desktop\Sanket Setu\apps\api && echo Waiting for CouchDB to start... && timeout /t 5 /nobreak && pnpm seed && echo. && echo [OK] Seed data loaded. Close this window to continue. && pause"
timeout /t 2 /nobreak

REM Terminal 3: API Server
echo Starting Terminal 3: API Server...
start "API Server" cmd /k "cd /d C:\Users\harsh\OneDrive\Desktop\Sanket Setu\apps\api && pnpm dev"
timeout /t 2 /nobreak

REM Terminal 4: Dashboard
echo Starting Terminal 4: Dashboard...
start "Dashboard" cmd /k "cd /d C:\Users\harsh\OneDrive\Desktop\Sanket Setu\apps\dashboard && pnpm dev"
timeout /t 2 /nobreak

REM Terminal 5: Mobile Frontend
echo Starting Terminal 5: Mobile Frontend...
start "Mobile Frontend" cmd /k "cd /d C:\Users\harsh\OneDrive\Desktop\Sanket Setu\apps\mobile && pnpm dev"

echo.
echo ========================================
echo All services starting...
echo ========================================
echo.
echo Terminal 1: CouchDB (docker-compose)
echo Terminal 2: Seed Data
echo Terminal 3: API Server on ws://localhost:4000
echo Terminal 4: Dashboard on http://localhost:3000
echo Terminal 5: Frontend on http://localhost:5173
echo.
echo Once all terminals show ready messages, open:
echo   http://localhost:5173
echo.
echo Then follow the SETUP_GUIDE.md instructions to test.
echo.
pause
