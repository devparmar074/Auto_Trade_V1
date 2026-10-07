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

## Quickstart & Setup (Personal Laptop)

### 1. Prerequisites
Ensure you have the following installed on your laptop:
* [.NET 10 SDK](https://dotnet.microsoft.com/download)
* [Node.js (v18+)](https://nodejs.org/)
* [SQL Server Express / LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) (comes standard with Visual Studio or as standalone download)

---

### 2. One-Time Setup

1. **Install Web Frontend Dependencies**:
   ```powershell
   cd web/auto-trade-web
   npm install
   cd ../..
   ```

2. **Initialize Database (`AutoTradeDb`)**:
   Run the automated database setup script from the root:
   ```powershell
   .\setup-database.ps1
   ```
   *(This starts LocalDB, creates `AutoTradeDb`, all schema tables, preset custom strategies, and stored procedures in seconds).*

---

### 3. Launching Auto Trade (1-Click)

From the project root directory, run:
```powershell
.\start-all.ps1
```
*(Or double-click `run.bat`)*

This script automatically:
1. Starts LocalDB.
2. Launches the Backend API at `http://localhost:5000`.
3. Launches the Frontend Web Dashboard at `http://localhost:5173`.
4. Opens your browser directly to the Auto Trade workstation.

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
