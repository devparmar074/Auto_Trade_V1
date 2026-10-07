# Auto Trade

Auto Trade is a high-performance, real-money trading platform built with **.NET 10 (C#)**, **SQL Server + Dapper**, **React + Vite (TypeScript)**, and **React Native (TypeScript)**, connecting directly to the **live Upstox API v2**.

Initially dedicated exclusively to **Vodafone Idea Limited (NSE: IDEA)** with real live BUY and SELL order execution, real-time LTP quotes, position tracking, and P&L calculation.

---

## Key Features

* **Real Broker Integration**: Connects to your live Upstox trading account via official OAuth 2.0 (no paper/mock trading).
* **Vodafone Idea Equity Only**: Dynamically resolves and validates Vodafone Idea Limited (`NSE_EQ|INE669E01016`) from the Upstox instrument master.
* **Configurable Quantity**: Starts with a default of **1 share** for initial live testing, with clean domain models ready for future score-based quantity calculation (`Quantity = StrategyEngine.CalculateQuantity(score)`).
* **One-Click Live Execution with Safety Confirmation**: Instant BUY and SELL order execution with an explicit **"Confirm Live Order"** safety prompt.
* **Idempotency & Duplicate Order Protection**: Prevents double clicks, duplicate submissions, and network retries using client `CorrelationId` and transaction tracking.
* **Real-time Streaming**: Backend manages market feeds and broadcasts live LTP, position, and order updates to Web and Mobile via **SignalR WebSockets**.
* **Zero Secret Exposure**: Upstox API keys, client secrets, and access tokens are strictly encrypted and managed server-side.

---

## Project Structure

```text
Auto_Trade_V1/
├── backend/
│   ├── AutoTrade.sln
│   ├── AutoTrade.Domain/          # Enums, Entities, DTOs & Models
│   ├── AutoTrade.Application/     # Services, Interfaces, Business Logic
│   ├── AutoTrade.Infrastructure/  # Upstox v2 Client, Dapper Repos, SignalR, AES Encryption
│   └── AutoTrade.Api/             # ASP.NET Core Web API (.NET 10) & Controllers
├── web/
│   └── auto-trade-web/            # React + TypeScript + Vite UI
├── mobile/
│   └── auto-trade-mobile/         # React Native + TypeScript App
├── database/
│   ├── Tables/                    # UpstoxConnection, Instrument, TradeOrder, TradeFill, PositionSnapshot
│   ├── StoredProcedures/          # Dapper stored procedures
│   └── Scripts/                   # 00_InitDatabase.sql
├── docs/
│   ├── UPSTOX_SETUP.md            # OAuth app configuration, Redirect URI & Static IP guide
│   └── ARCHITECTURE.md            # System architecture, order lifecycle & scoring readiness
└── README.md
```

---

## Quickstart

### 1. Database Setup (SQL Server)
Ensure SQL Server (or LocalDB) is running:
```powershell
# Start LocalDB instance if not started
sqllocaldb start MSSQLLocalDB

# Initialize database schema and stored procedures
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -i "database\Scripts\00_InitDatabase.sql"
```

### 2. Configure Upstox Credentials
Open `backend/AutoTrade.Api/appsettings.json` and insert your Upstox Developer credentials:
```json
{
  "Upstox": {
    "ApiKey": "YOUR_UPSTOX_API_KEY",
    "ApiSecret": "YOUR_UPSTOX_API_SECRET",
    "RedirectUri": "https://localhost:5001/api/upstox/callback"
  }
}
```

### 3. Run Backend API
```powershell
cd backend/AutoTrade.Api
dotnet run
```
Backend API will start at `https://localhost:5001` and `http://localhost:5000`.
Swagger UI: `http://localhost:5000/swagger`

### 4. Run Web Application
```powershell
cd web/auto-trade-web
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Run Mobile Application
```powershell
cd mobile/auto-trade-mobile
npm run start
```

---

## Live Trading Workflow

1. Open `http://localhost:5173`.
2. Click **Connect Upstox** to log in through the official Upstox OAuth portal.
3. Observe live LTP and market status for Vodafone Idea.
4. Set your desired quantity (default is `1`).
5. Click **BUY** or **SELL**.
6. Review the **Confirm Live Order** safety prompt.
7. Click **Confirm Live Order** &rarr; Order is executed live on Upstox!
8. View real-time Order ID, execution price, position update, and live P&L.
