Write-Host "==========================================" -ForegroundColor Green
Write-Host "       AUTO TRADE - 1-CLICK LAUNCHER      " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# 1. Start SQL Server LocalDB
Write-Host "[1/3] Ensuring SQL Server LocalDB is active..." -ForegroundColor Yellow
sqllocaldb start MSSQLLocalDB

# 2. Launch Backend API in separate window
Write-Host "[2/3] Launching Auto Trade Backend API (http://localhost:5000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend/AutoTrade.Api'; Write-Host '--- Auto Trade Backend API (http://localhost:5000) ---' -ForegroundColor Cyan; dotnet run --urls 'http://localhost:5000'"

# 3. Launch Web Frontend in separate window
Write-Host "[3/3] Launching Web Frontend (http://localhost:5173)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/web/auto-trade-web'; Write-Host '--- Auto Trade Web (http://localhost:5173) ---' -ForegroundColor Cyan; npm run dev"

# Wait 2 seconds and open browser
Start-Sleep -Seconds 2
Write-Host "Opening Dashboard in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "Auto Trade is live and running!" -ForegroundColor Green
