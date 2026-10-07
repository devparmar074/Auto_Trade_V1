CREATE OR ALTER PROCEDURE dbo.sp_UpdateTradeOrderStatus
    @OrderId BIGINT,
    @UpstoxOrderId NVARCHAR(100) = NULL,
    @Status INT,
    @UpstoxStatus NVARCHAR(100) = NULL,
    @AverageExecutionPrice DECIMAL(18,4) = NULL,
    @ExecutionTimeUtc DATETIME2 = NULL,
    @StatusMessage NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TradeOrder
    SET UpstoxOrderId = COALESCE(@UpstoxOrderId, UpstoxOrderId),
        Status = @Status,
        UpstoxStatus = COALESCE(@UpstoxStatus, UpstoxStatus),
        AverageExecutionPrice = COALESCE(@AverageExecutionPrice, AverageExecutionPrice),
        ExecutionTimeUtc = COALESCE(@ExecutionTimeUtc, ExecutionTimeUtc),
        StatusMessage = COALESCE(@StatusMessage, StatusMessage),
        UpdatedAtUtc = SYSUTCDATETIME()
    WHERE Id = @OrderId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
