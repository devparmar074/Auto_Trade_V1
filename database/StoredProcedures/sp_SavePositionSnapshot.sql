CREATE OR ALTER PROCEDURE dbo.sp_SavePositionSnapshot
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @Quantity INT,
    @AveragePrice DECIMAL(18,4),
    @CurrentLtp DECIMAL(18,4),
    @UnrealizedPnL DECIMAL(18,4),
    @RealizedPnL DECIMAL(18,4),
    @TotalPnL DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO PositionSnapshot (
        InstrumentKey,
        TradingSymbol,
        Quantity,
        AveragePrice,
        CurrentLtp,
        UnrealizedPnL,
        RealizedPnL,
        TotalPnL,
        SnapshotTimeUtc
    )
    VALUES (
        @InstrumentKey,
        @TradingSymbol,
        @Quantity,
        @AveragePrice,
        @CurrentLtp,
        @UnrealizedPnL,
        @RealizedPnL,
        @TotalPnL,
        SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS SnapshotId;
END
