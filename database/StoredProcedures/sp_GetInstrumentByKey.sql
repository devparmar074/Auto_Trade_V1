CREATE OR ALTER PROCEDURE dbo.sp_GetInstrumentByKey
    @InstrumentKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM Instrument
    WHERE InstrumentKey = @InstrumentKey;
END
