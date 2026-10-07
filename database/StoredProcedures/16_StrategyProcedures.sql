CREATE OR ALTER PROCEDURE sp_GetStrategyConfig
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 * FROM StrategyConfig WHERE Id = 1;
END
GO

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
    @IsKillSwitchActive BIT
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
            UpdatedAtUtc = SYSUTCDATETIME()
        WHERE Id = 1;
    END
    ELSE
    BEGIN
        INSERT INTO StrategyConfig (Id, BotMode, BuyScoreThreshold, SellScoreThreshold, BaseQuantity, MaxQuantity, StopLossPercent, TakeProfitPercent, TrailingStopPercent, DailyMaxLossAmount, MaxOrdersPerDay, IsKillSwitchActive)
        VALUES (1, @BotMode, @BuyScoreThreshold, @SellScoreThreshold, @BaseQuantity, @MaxQuantity, @StopLossPercent, @TakeProfitPercent, @TrailingStopPercent, @DailyMaxLossAmount, @MaxOrdersPerDay, @IsKillSwitchActive);
    END

    SELECT TOP 1 * FROM StrategyConfig WHERE Id = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_InsertStrategySignal
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @Score DECIMAL(5,2),
    @Recommendation NVARCHAR(50),
    @Rsi DECIMAL(8,4) = NULL,
    @Ema9 DECIMAL(18,4) = NULL,
    @Ema21 DECIMAL(18,4) = NULL,
    @Ema50 DECIMAL(18,4) = NULL,
    @Vwap DECIMAL(18,4) = NULL,
    @Supertrend DECIMAL(18,4) = NULL,
    @SupertrendDirection NVARCHAR(10) = NULL,
    @SignalFactors NVARCHAR(MAX) = NULL,
    @RecommendedQuantity INT = 1,
    @ActionTaken NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO StrategySignalHistory (
        InstrumentKey, TradingSymbol, Score, Recommendation, Rsi, Ema9, Ema21, Ema50, Vwap, Supertrend, SupertrendDirection, SignalFactors, RecommendedQuantity, ActionTaken, CreatedAtUtc
    )
    VALUES (
        @InstrumentKey, @TradingSymbol, @Score, @Recommendation, @Rsi, @Ema9, @Ema21, @Ema50, @Vwap, @Supertrend, @SupertrendDirection, @SignalFactors, @RecommendedQuantity, @ActionTaken, SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS Id;
END
GO

CREATE OR ALTER PROCEDURE sp_GetRecentStrategySignals
    @TradingSymbol NVARCHAR(50) = 'IDEA',
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Limit) * 
    FROM StrategySignalHistory 
    WHERE TradingSymbol = @TradingSymbol
    ORDER BY Id DESC;
END
GO
