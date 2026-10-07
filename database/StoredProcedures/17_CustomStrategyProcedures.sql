-- Stored procedures for CustomStrategy table and active strategy tracking

CREATE OR ALTER PROCEDURE dbo.sp_GetCustomStrategies
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id,
        Name,
        Description,
        IsActive,
        CombinationMode,
        BuyThreshold,
        SellThreshold,
        ConfigJson,
        CreatedAtUtc,
        UpdatedAtUtc
    FROM dbo.CustomStrategy
    ORDER BY Id ASC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetCustomStrategyById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id,
        Name,
        Description,
        IsActive,
        CombinationMode,
        BuyThreshold,
        SellThreshold,
        ConfigJson,
        CreatedAtUtc,
        UpdatedAtUtc
    FROM dbo.CustomStrategy
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SaveCustomStrategy
    @Id INT = 0,
    @Name NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @CombinationMode NVARCHAR(30) = 'WEIGHTED_SCORE',
    @BuyThreshold DECIMAL(5,2) = 75.00,
    @SellThreshold DECIMAL(5,2) = 30.00,
    @ConfigJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF @Id > 0 AND EXISTS (SELECT 1 FROM dbo.CustomStrategy WHERE Id = @Id)
    BEGIN
        UPDATE dbo.CustomStrategy
        SET 
            Name = @Name,
            Description = @Description,
            CombinationMode = @CombinationMode,
            BuyThreshold = @BuyThreshold,
            SellThreshold = @SellThreshold,
            ConfigJson = @ConfigJson,
            UpdatedAtUtc = SYSUTCDATETIME()
        WHERE Id = @Id;

        SELECT 
            Id, Name, Description, IsActive, CombinationMode, BuyThreshold, SellThreshold, ConfigJson, CreatedAtUtc, UpdatedAtUtc
        FROM dbo.CustomStrategy
        WHERE Id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.CustomStrategy (Name, Description, IsActive, CombinationMode, BuyThreshold, SellThreshold, ConfigJson, CreatedAtUtc, UpdatedAtUtc)
        VALUES (@Name, @Description, 0, @CombinationMode, @BuyThreshold, @SellThreshold, @ConfigJson, SYSUTCDATETIME(), SYSUTCDATETIME());

        DECLARE @NewId INT = SCOPE_IDENTITY();
        SELECT 
            Id, Name, Description, IsActive, CombinationMode, BuyThreshold, SellThreshold, ConfigJson, CreatedAtUtc, UpdatedAtUtc
        FROM dbo.CustomStrategy
        WHERE Id = @NewId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteCustomStrategy
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.CustomStrategy WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetActiveStrategy
    @StrategyType NVARCHAR(20), -- 'DEFAULT' or 'CUSTOM'
    @CustomStrategyId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Update CustomStrategy IsActive flags
    IF @StrategyType = 'CUSTOM' AND @CustomStrategyId IS NOT NULL
    BEGIN
        UPDATE dbo.CustomStrategy SET IsActive = 0;
        UPDATE dbo.CustomStrategy SET IsActive = 1 WHERE Id = @CustomStrategyId;
    END
    ELSE
    BEGIN
        UPDATE dbo.CustomStrategy SET IsActive = 0;
    END

    -- Return the updated active strategy details
    SELECT 
        @StrategyType AS ActiveStrategyType,
        @CustomStrategyId AS ActiveCustomStrategyId,
        c.Name AS CustomStrategyName
    FROM (SELECT 1 AS dummy) d
    LEFT JOIN dbo.CustomStrategy c ON c.Id = @CustomStrategyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetActiveStrategyInfo
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActiveCustomId INT = (SELECT TOP 1 Id FROM dbo.CustomStrategy WHERE IsActive = 1);
    
    IF @ActiveCustomId IS NOT NULL
    BEGIN
        SELECT 
            'CUSTOM' AS ActiveStrategyType,
            c.Id AS ActiveCustomStrategyId,
            c.Name AS ActiveCustomStrategyName,
            c.BuyThreshold,
            c.SellThreshold,
            c.CombinationMode,
            c.ConfigJson
        FROM dbo.CustomStrategy c
        WHERE c.Id = @ActiveCustomId;
    END
    ELSE
    BEGIN
        SELECT 
            'DEFAULT' AS ActiveStrategyType,
            CAST(NULL AS INT) AS ActiveCustomStrategyId,
            'Default Strategy (Multi-Factor)' AS ActiveCustomStrategyName,
            60.00 AS BuyThreshold,
            -40.00 AS SellThreshold,
            'WEIGHTED_SCORE' AS CombinationMode,
            CAST(NULL AS NVARCHAR(MAX)) AS ConfigJson;
    END
END
GO
