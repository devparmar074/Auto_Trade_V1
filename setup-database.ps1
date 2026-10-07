Write-Host "==========================================" -ForegroundColor Green
Write-Host "   AUTO TRADE - DATABASE SETUP UTILITY    " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host "`n[1/3] Ensuring SQL Server LocalDB instance is running..." -ForegroundColor Yellow
sqllocaldb start MSSQLLocalDB

Write-Host "`n[2/3] Initializing AutoTradeDb schema & base tables..." -ForegroundColor Yellow
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -i "$PSScriptRoot\database\Scripts\00_InitDatabase.sql"

Write-Host "`n[3/3] Initializing CustomStrategy tables & procedures..." -ForegroundColor Yellow
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -d AutoTradeDb -i "$PSScriptRoot\database\Tables\08_CustomStrategy.sql"
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -d AutoTradeDb -i "$PSScriptRoot\database\StoredProcedures\16_StrategyProcedures.sql"
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -d AutoTradeDb -i "$PSScriptRoot\database\StoredProcedures\17_CustomStrategyProcedures.sql"

Write-Host "`nDatabase setup complete! AutoTradeDb is ready for live trading." -ForegroundColor Green
