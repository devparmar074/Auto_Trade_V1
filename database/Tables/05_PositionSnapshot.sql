IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PositionSnapshot')
BEGIN
    CREATE TABLE PositionSnapshot (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        InstrumentKey NVARCHAR(100) NOT NULL,
        TradingSymbol NVARCHAR(50) NOT NULL,
        Quantity INT NOT NULL,
        AveragePrice DECIMAL(18,4) NOT NULL,
        CurrentLtp DECIMAL(18,4) NOT NULL,
        UnrealizedPnL DECIMAL(18,4) NOT NULL,
        RealizedPnL DECIMAL(18,4) NOT NULL,
        TotalPnL DECIMAL(18,4) NOT NULL,
        SnapshotTimeUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_PositionSnapshot_InstrumentKey ON PositionSnapshot(InstrumentKey, SnapshotTimeUtc DESC);
END
