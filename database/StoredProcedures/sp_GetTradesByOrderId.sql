CREATE OR ALTER PROCEDURE dbo.sp_GetTradesByOrderId
    @TradeOrderId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM TradeFill
    WHERE TradeOrderId = @TradeOrderId
    ORDER BY TradedAtUtc ASC;
END
