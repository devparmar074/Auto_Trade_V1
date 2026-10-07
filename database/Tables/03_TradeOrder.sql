IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TradeOrder')
BEGIN
    CREATE TABLE TradeOrder (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        CorrelationId NVARCHAR(100) NOT NULL UNIQUE,
        UpstoxOrderId NVARCHAR(100) NULL,
        InstrumentKey NVARCHAR(100) NOT NULL,
        TradingSymbol NVARCHAR(50) NOT NULL,
        TransactionType INT NOT NULL,
        OrderType INT NOT NULL,
        Product NVARCHAR(10) NOT NULL DEFAULT 'D',
        Quantity INT NOT NULL,
        FilledQuantity INT NOT NULL DEFAULT 0,
        Status INT NOT NULL,
        UpstoxStatus NVARCHAR(100) NULL,
        PlacedPrice DECIMAL(18,4) NULL,
        AverageExecutionPrice DECIMAL(18,4) NULL,
        ExecutionTimeUtc DATETIME2 NULL,
        StatusMessage NVARCHAR(1000) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_TradeOrder_UpstoxOrderId ON TradeOrder(UpstoxOrderId);
    CREATE INDEX IX_TradeOrder_CreatedAtUtc ON TradeOrder(CreatedAtUtc DESC);
END
