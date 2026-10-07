IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StrategySignalHistory')
BEGIN
    CREATE TABLE StrategySignalHistory (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        InstrumentKey NVARCHAR(100) NOT NULL,
        TradingSymbol NVARCHAR(50) NOT NULL,
        Score DECIMAL(5,2) NOT NULL,
        Recommendation NVARCHAR(50) NOT NULL,
        Rsi DECIMAL(8,4) NULL,
        Ema9 DECIMAL(18,4) NULL,
        Ema21 DECIMAL(18,4) NULL,
        Ema50 DECIMAL(18,4) NULL,
        Vwap DECIMAL(18,4) NULL,
        Supertrend DECIMAL(18,4) NULL,
        SupertrendDirection NVARCHAR(10) NULL,
        SignalFactors NVARCHAR(MAX) NULL,
        RecommendedQuantity INT NOT NULL DEFAULT 1,
        ActionTaken NVARCHAR(50) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_StrategySignalHistory_Symbol_Date ON StrategySignalHistory(TradingSymbol, CreatedAtUtc DESC);
END
