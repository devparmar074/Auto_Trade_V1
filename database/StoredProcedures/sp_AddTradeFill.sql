CREATE OR ALTER PROCEDURE dbo.sp_AddTradeFill
    @TradeOrderId BIGINT,
    @UpstoxOrderId NVARCHAR(100),
    @UpstoxTradeId NVARCHAR(100),
    @Quantity INT,
    @Price DECIMAL(18,4),
    @TradedAtUtc DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM TradeFill WHERE UpstoxTradeId = @UpstoxTradeId)
    BEGIN
        INSERT INTO TradeFill (
            TradeOrderId,
            UpstoxOrderId,
            UpstoxTradeId,
            Quantity,
            Price,
            TradedAtUtc,
            CreatedAtUtc
        )
        VALUES (
            @TradeOrderId,
            @UpstoxOrderId,
            @UpstoxTradeId,
            @Quantity,
            @Price,
            @TradedAtUtc,
            SYSUTCDATETIME()
        );

        SELECT SCOPE_IDENTITY() AS FillId;
    END
    ELSE
    BEGIN
        SELECT Id AS FillId FROM TradeFill WHERE UpstoxTradeId = @UpstoxTradeId;
    END
END
