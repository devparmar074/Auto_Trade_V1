CREATE OR ALTER PROCEDURE dbo.sp_UpsertInstrument
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @CompanyName NVARCHAR(200),
    @Exchange NVARCHAR(20),
    @Segment NVARCHAR(20),
    @Isin NVARCHAR(50),
    @SecurityType NVARCHAR(50),
    @LotSize INT,
    @TickSize DECIMAL(18,4),
    @FreezeQuantity DECIMAL(18,2),
    @ExchangeToken NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Instrument WHERE InstrumentKey = @InstrumentKey)
    BEGIN
        UPDATE Instrument
        SET TradingSymbol = @TradingSymbol,
            CompanyName = @CompanyName,
            Exchange = @Exchange,
            Segment = @Segment,
            Isin = @Isin,
            SecurityType = @SecurityType,
            LotSize = @LotSize,
            TickSize = @TickSize,
            FreezeQuantity = @FreezeQuantity,
            ExchangeToken = @ExchangeToken,
            LastUpdatedUtc = SYSUTCDATETIME()
        WHERE InstrumentKey = @InstrumentKey;
    END
    ELSE
    BEGIN
        INSERT INTO Instrument (
            InstrumentKey,
            TradingSymbol,
            CompanyName,
            Exchange,
            Segment,
            Isin,
            SecurityType,
            LotSize,
            TickSize,
            FreezeQuantity,
            ExchangeToken,
            LastUpdatedUtc
        )
        VALUES (
            @InstrumentKey,
            @TradingSymbol,
            @CompanyName,
            @Exchange,
            @Segment,
            @Isin,
            @SecurityType,
            @LotSize,
            @TickSize,
            @FreezeQuantity,
            @ExchangeToken,
            SYSUTCDATETIME()
        );
    END
END
