CREATE OR ALTER PROCEDURE dbo.sp_SaveUpstoxConnection
    @EncryptedAccessToken NVARCHAR(MAX),
    @EncryptedRefreshToken NVARCHAR(MAX) = NULL,
    @ExpiresAtUtc DATETIME2,
    @UserId NVARCHAR(100) = NULL,
    @UserName NVARCHAR(200) = NULL,
    @Email NVARCHAR(200) = NULL,
    @UserType NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE UpstoxConnection 
    SET IsActive = 0, UpdatedAtUtc = SYSUTCDATETIME()
    WHERE IsActive = 1;

    INSERT INTO UpstoxConnection (
        EncryptedAccessToken,
        EncryptedRefreshToken,
        ExpiresAtUtc,
        IsActive,
        UserId,
        UserName,
        Email,
        UserType,
        CreatedAtUtc,
        UpdatedAtUtc
    )
    VALUES (
        @EncryptedAccessToken,
        @EncryptedRefreshToken,
        @ExpiresAtUtc,
        1,
        @UserId,
        @UserName,
        @Email,
        @UserType,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS ConnectionId;
END
