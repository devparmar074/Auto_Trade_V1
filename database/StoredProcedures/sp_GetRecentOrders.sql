CREATE OR ALTER PROCEDURE dbo.sp_GetRecentOrders
    @Count INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Count) *
    FROM TradeOrder
    ORDER BY Id DESC;
END
