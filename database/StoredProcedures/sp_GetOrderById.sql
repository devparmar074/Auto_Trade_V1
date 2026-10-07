CREATE OR ALTER PROCEDURE dbo.sp_GetOrderById
    @OrderId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM TradeOrder
    WHERE Id = @OrderId;
END
