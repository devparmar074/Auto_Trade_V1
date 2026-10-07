IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Instrument')
BEGIN
    CREATE TABLE Instrument (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        InstrumentKey NVARCHAR(100) NOT NULL UNIQUE,
        TradingSymbol NVARCHAR(50) NOT NULL,
        CompanyName NVARCHAR(200) NOT NULL,
        Exchange NVARCHAR(20) NOT NULL DEFAULT 'NSE',
        Segment NVARCHAR(20) NOT NULL DEFAULT 'NSE_EQ',
        Isin NVARCHAR(50) NOT NULL,
        SecurityType NVARCHAR(50) NOT NULL DEFAULT 'NORMAL',
        LotSize INT NOT NULL DEFAULT 1,
        TickSize DECIMAL(18,4) NOT NULL DEFAULT 0.05,
        FreezeQuantity DECIMAL(18,2) NOT NULL DEFAULT 100000.0,
        ExchangeToken NVARCHAR(50) NULL,
        LastUpdatedUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Instrument_Symbol_Exchange ON Instrument(TradingSymbol, Exchange);
END
