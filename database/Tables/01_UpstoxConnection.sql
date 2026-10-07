IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UpstoxConnection')
BEGIN
    CREATE TABLE UpstoxConnection (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EncryptedAccessToken NVARCHAR(MAX) NOT NULL,
        EncryptedRefreshToken NVARCHAR(MAX) NULL,
        ExpiresAtUtc DATETIME2 NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        UserId NVARCHAR(100) NULL,
        UserName NVARCHAR(200) NULL,
        Email NVARCHAR(200) NULL,
        Broker NVARCHAR(50) NOT NULL DEFAULT 'UPSTOX',
        UserType NVARCHAR(50) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_UpstoxConnection_IsActive ON UpstoxConnection(IsActive);
END
