IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TradeFill')
BEGIN
    CREATE TABLE TradeFill (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        TradeOrderId BIGINT NOT NULL FOREIGN KEY REFERENCES TradeOrder(Id),
        UpstoxOrderId NVARCHAR(100) NOT NULL,
        UpstoxTradeId NVARCHAR(100) NOT NULL,
        Quantity INT NOT NULL,
        Price DECIMAL(18,4) NOT NULL,
        TradedAtUtc DATETIME2 NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_TradeFill_TradeOrderId ON TradeFill(TradeOrderId);
END
