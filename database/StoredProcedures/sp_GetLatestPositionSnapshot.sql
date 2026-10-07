CREATE OR ALTER PROCEDURE dbo.sp_GetLatestPositionSnapshot
    @InstrumentKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM PositionSnapshot
    WHERE InstrumentKey = @InstrumentKey
    ORDER BY SnapshotTimeUtc DESC;
END
