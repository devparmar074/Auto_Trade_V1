CREATE OR ALTER PROCEDURE dbo.sp_GetActiveUpstoxConnection
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 
        Id,
        EncryptedAccessToken,
        EncryptedRefreshToken,
        ExpiresAtUtc,
        IsActive,
        UserId,
        UserName,
        Email,
        Broker,
        UserType,
        CreatedAtUtc,
        UpdatedAtUtc
    FROM UpstoxConnection
    WHERE IsActive = 1
    ORDER BY Id DESC;
END
