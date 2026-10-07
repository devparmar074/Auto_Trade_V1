# Auto Trade Architecture

Auto Trade follows **Clean Architecture** with a streamlined, modular monolith design.

```text
Web / Mobile Clients
        │  (REST & SignalR WebSockets)
        ▼
   AutoTrade.Api
        │
        ▼
AutoTrade.Application (Services & Use Cases)
   ├── InstrumentService
   ├── OrderService (Idempotency & Execution)
   ├── MarketDataService
   ├── PortfolioService
   └── UpstoxAuthService
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
AutoTrade.Infrastructure    AutoTrade.Domain
   ├── UpstoxClient (v2 APIs)       └── Entities & Value Objects
   ├── Dapper Repositories
   ├── SignalR TradingHub
   └── AES Token Encryption
        │
        ▼
SQL Server (AutoTradeDb)
```

---

## Future Score-Based Strategy Engine Architecture

The system is designed so that the initial manual quantity (`1`) can seamlessly transition to automated score-based trading without touching the order execution pipeline:

```text
[ Market Feeds ] ──► [ Indicator Engine ]
                             │
                             ▼
                     [ Scoring Engine ]
                             │
                             ▼
                 [ Quantity / Risk Calculator ]
                             │
                             ▼
                    PlaceOrderRequest
                 {
                   Quantity = CalculatedQuantity,
                   TransactionType = Signal.BUY_OR_SELL,
                   OrderType = MARKET,
                   Product = "D"
                 }
                             │
                             ▼
                    IOrderService.ExecuteOrderAsync()
                             │
                             ▼
                     Upstox Live Order
```
