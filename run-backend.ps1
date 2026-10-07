Write-Host "Starting Auto Trade Backend API..." -ForegroundColor Cyan
cd backend/AutoTrade.Api
dotnet run --urls "http://localhost:5000"
