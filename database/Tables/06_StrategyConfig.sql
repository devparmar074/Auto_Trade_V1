IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StrategyConfig')
BEGIN
    CREATE TABLE StrategyConfig (
        Id INT PRIMARY KEY DEFAULT 1,
        BotMode NVARCHAR(50) NOT NULL DEFAULT 'Manual',
        BuyScoreThreshold DECIMAL(5,2) NOT NULL DEFAULT 60.00,
        SellScoreThreshold DECIMAL(5,2) NOT NULL DEFAULT -40.00,
        BaseQuantity INT NOT NULL DEFAULT 1,
        MaxQuantity INT NOT NULL DEFAULT 10,
        StopLossPercent DECIMAL(5,2) NOT NULL DEFAULT 2.00,
        TakeProfitPercent DECIMAL(5,2) NOT NULL DEFAULT 4.00,
        TrailingStopPercent DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        DailyMaxLossAmount DECIMAL(18,4) NOT NULL DEFAULT 500.00,
        MaxOrdersPerDay INT NOT NULL DEFAULT 20,
        IsKillSwitchActive BIT NOT NULL DEFAULT 0,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    INSERT INTO StrategyConfig (Id, BotMode, BuyScoreThreshold, SellScoreThreshold, BaseQuantity, MaxQuantity, StopLossPercent, TakeProfitPercent, TrailingStopPercent, DailyMaxLossAmount, MaxOrdersPerDay, IsKillSwitchActive)
    VALUES (1, 'Manual', 60.00, -40.00, 1, 10, 2.00, 4.00, 1.00, 500.00, 20, 0);
END
