CREATE OR ALTER PROCEDURE dbo.sp_GetInstrumentBySymbol
    @TradingSymbol NVARCHAR(50),
    @Exchange NVARCHAR(20) = 'NSE'
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM Instrument
    WHERE TradingSymbol = @TradingSymbol AND Exchange = @Exchange;
END
