# DeadZone — Start all services in PowerShell
# This script opens separate windows for each service

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DeadZone Setup — Starting all services" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$projectRoot = "C:\Users\harsh\OneDrive\Desktop\Sanket Setu"
Set-Location $projectRoot

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Cyan
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and run this script again.`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Docker is running`n" -ForegroundColor Green

# Terminal 1: CouchDB
Write-Host "Starting Terminal 1: CouchDB..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\infra'; docker-compose up"
Start-Sleep -Seconds 3

# Terminal 2: Seed Data
Write-Host "Starting Terminal 2: Seed Data..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\api'; Write-Host 'Waiting for CouchDB...' -ForegroundColor Cyan; Start-Sleep 5; Write-Host 'Running seed script...' -ForegroundColor Cyan; pnpm seed; Write-Host '[OK] Seed data loaded. You can close this window.' -ForegroundColor Green; Read-Host 'Press Enter to exit'"
Start-Sleep -Seconds 2

# Terminal 3: API Server
Write-Host "Starting Terminal 3: API Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\api'; pnpm dev"
Start-Sleep -Seconds 2

# Terminal 4: Dashboard
Write-Host "Starting Terminal 4: Dashboard..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\dashboard'; pnpm dev"
Start-Sleep -Seconds 2

# Terminal 5: Mobile Frontend
Write-Host "Starting Terminal 5: Mobile Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\mobile'; pnpm dev"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "All services starting..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Terminal 1: CouchDB (docker-compose)" -ForegroundColor Cyan
Write-Host "Terminal 2: Seed Data" -ForegroundColor Cyan
Write-Host "Terminal 3: API Server on ws://localhost:4000" -ForegroundColor Cyan
Write-Host "Terminal 4: Dashboard on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Terminal 5: Frontend on http://localhost:5173" -ForegroundColor Cyan

Write-Host "`nOnce all terminals show 'ready' messages, open:" -ForegroundColor Yellow
Write-Host "  http://localhost:5173`n" -ForegroundColor Green

Write-Host "Then follow the SETUP_GUIDE.md instructions to test.`n" -ForegroundColor Yellow

Read-Host "Press Enter to close this window"
