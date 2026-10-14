USE AutoTradeDb;
GO

-- Add UseDynamicCapitalSizing column if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.StrategyConfig') 
    AND name = 'UseDynamicCapitalSizing'
)
BEGIN
    ALTER TABLE dbo.StrategyConfig 
    ADD UseDynamicCapitalSizing BIT NOT NULL CONSTRAINT DF_StrategyConfig_UseDynamicCapitalSizing DEFAULT 1;
END
GO

-- Add CapitalAllocationPercent column if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.StrategyConfig') 
    AND name = 'CapitalAllocationPercent'
)
BEGIN
    ALTER TABLE dbo.StrategyConfig 
    ADD CapitalAllocationPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_StrategyConfig_CapitalAllocationPercent DEFAULT 90.00;
END
GO

-- Add MaxCapitalPerTrade column if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.StrategyConfig') 
    AND name = 'MaxCapitalPerTrade'
)
BEGIN
    ALTER TABLE dbo.StrategyConfig 
    ADD MaxCapitalPerTrade DECIMAL(18,4) NOT NULL CONSTRAINT DF_StrategyConfig_MaxCapitalPerTrade DEFAULT 1000.00;
END
GO

-- Update sp_GetStrategyConfig
CREATE OR ALTER PROCEDURE sp_GetStrategyConfig
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 * FROM StrategyConfig WHERE Id = 1;
END
GO

-- Update sp_SaveStrategyConfig to accept and persist the new columns
CREATE OR ALTER PROCEDURE sp_SaveStrategyConfig
    @BotMode NVARCHAR(50),
    @BuyScoreThreshold DECIMAL(5,2),
    @SellScoreThreshold DECIMAL(5,2),
    @BaseQuantity INT,
    @MaxQuantity INT,
    @StopLossPercent DECIMAL(5,2),
    @TakeProfitPercent DECIMAL(5,2),
    @TrailingStopPercent DECIMAL(5,2),
    @DailyMaxLossAmount DECIMAL(18,4),
    @MaxOrdersPerDay INT,
    @IsKillSwitchActive BIT,
    @UseDynamicCapitalSizing BIT = 1,
    @CapitalAllocationPercent DECIMAL(5,2) = 90.00,
    @MaxCapitalPerTrade DECIMAL(18,4) = 1000.00
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM StrategyConfig WHERE Id = 1)
    BEGIN
        UPDATE StrategyConfig
        SET BotMode = @BotMode,
            BuyScoreThreshold = @BuyScoreThreshold,
            SellScoreThreshold = @SellScoreThreshold,
            BaseQuantity = @BaseQuantity,
            MaxQuantity = @MaxQuantity,
            StopLossPercent = @StopLossPercent,
            TakeProfitPercent = @TakeProfitPercent,
            TrailingStopPercent = @TrailingStopPercent,
            DailyMaxLossAmount = @DailyMaxLossAmount,
            MaxOrdersPerDay = @MaxOrdersPerDay,
            IsKillSwitchActive = @IsKillSwitchActive,
            UseDynamicCapitalSizing = @UseDynamicCapitalSizing,
            CapitalAllocationPercent = @CapitalAllocationPercent,
            MaxCapitalPerTrade = @MaxCapitalPerTrade,
            UpdatedAtUtc = SYSUTCDATETIME()
        WHERE Id = 1;
    END
    ELSE
    BEGIN
        INSERT INTO StrategyConfig (
            Id, BotMode, BuyScoreThreshold, SellScoreThreshold, BaseQuantity, MaxQuantity, 
            StopLossPercent, TakeProfitPercent, TrailingStopPercent, DailyMaxLossAmount, 
            MaxOrdersPerDay, IsKillSwitchActive, UseDynamicCapitalSizing, CapitalAllocationPercent, MaxCapitalPerTrade
        )
        VALUES (
            1, @BotMode, @BuyScoreThreshold, @SellScoreThreshold, @BaseQuantity, @MaxQuantity, 
            @StopLossPercent, @TakeProfitPercent, @TrailingStopPercent, @DailyMaxLossAmount, 
            @MaxOrdersPerDay, @IsKillSwitchActive, @UseDynamicCapitalSizing, @CapitalAllocationPercent, @MaxCapitalPerTrade
        );
    END

    SELECT TOP 1 * FROM StrategyConfig WHERE Id = 1;
END
GO
