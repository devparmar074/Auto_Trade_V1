CREATE OR ALTER PROCEDURE dbo.sp_CreateTradeOrder
    @CorrelationId NVARCHAR(100),
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @TransactionType INT,
    @OrderType INT,
    @Product NVARCHAR(10),
    @Quantity INT,
    @PlacedPrice DECIMAL(18,4) = NULL,
    @Status INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO TradeOrder (
        CorrelationId,
        InstrumentKey,
        TradingSymbol,
        TransactionType,
        OrderType,
        Product,
        Quantity,
        FilledQuantity,
        Status,
        PlacedPrice,
        CreatedAtUtc,
        UpdatedAtUtc
    )
    VALUES (
        @CorrelationId,
        @InstrumentKey,
        @TradingSymbol,
        @TransactionType,
        @OrderType,
        @Product,
        @Quantity,
        0,
        @Status,
        @PlacedPrice,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS OrderId;
END
