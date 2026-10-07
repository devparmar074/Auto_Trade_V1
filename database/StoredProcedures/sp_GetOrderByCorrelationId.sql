CREATE OR ALTER PROCEDURE dbo.sp_GetOrderByCorrelationId
    @CorrelationId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM TradeOrder
    WHERE CorrelationId = @CorrelationId;
END
