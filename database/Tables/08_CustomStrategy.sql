IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomStrategy')
BEGIN
    CREATE TABLE CustomStrategy (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 0,
        CombinationMode NVARCHAR(30) NOT NULL DEFAULT 'WEIGHTED_SCORE', -- 'WEIGHTED_SCORE', 'AND_LOGIC', 'OR_LOGIC'
        BuyThreshold DECIMAL(5,2) NOT NULL DEFAULT 75.00,
        SellThreshold DECIMAL(5,2) NOT NULL DEFAULT 30.00,
        ConfigJson NVARCHAR(MAX) NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- Seed Preset 1: MA + PCR + Bollinger Trend (Balanced)
    INSERT INTO CustomStrategy (Name, Description, IsActive, CombinationMode, BuyThreshold, SellThreshold, ConfigJson)
    VALUES (
        'MA + PCR + Bollinger Trend (Balanced)',
        'Combines 20 MA trend, 9/21 MA crossover, Put-Call Ratio confirmation, and Bollinger Band squeeze breakout.',
        0,
        'WEIGHTED_SCORE',
        75.00,
        30.00,
        '{
            "strategyName": "MA + PCR + Bollinger Trend (Balanced)",
            "combinationMode": "WEIGHTED_SCORE",
            "buyThreshold": 75.0,
            "sellThreshold": 30.0,
            "buyConditions": [
                {
                    "id": "c1",
                    "indicator": "MovingAverage",
                    "conditionType": "PriceGreaterThanMa",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 20.0,
                    "maType": "SMA",
                    "period": 20
                },
                {
                    "id": "c2",
                    "indicator": "MovingAverage",
                    "conditionType": "FastMaCrossAboveSlowMa",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 25.0,
                    "fastPeriod": 9,
                    "slowPeriod": 21,
                    "maType": "EMA"
                },
                {
                    "id": "c3",
                    "indicator": "PCR",
                    "conditionType": "PcrGreaterThan",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 20.0,
                    "thresholdValue": 1.0
                },
                {
                    "id": "c4",
                    "indicator": "BollingerBands",
                    "conditionType": "BbSqueeze",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 15.0,
                    "period": 20,
                    "stdDevMultiplier": 2.0
                },
                {
                    "id": "c5",
                    "indicator": "BollingerBands",
                    "conditionType": "PriceCrossAboveMiddle",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 20.0,
                    "period": 20,
                    "stdDevMultiplier": 2.0
                }
            ],
            "sellConditions": [
                {
                    "id": "c6",
                    "indicator": "MovingAverage",
                    "conditionType": "PriceLessThanMa",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 25.0,
                    "maType": "SMA",
                    "period": 20
                },
                {
                    "id": "c7",
                    "indicator": "MovingAverage",
                    "conditionType": "FastMaCrossBelowSlowMa",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 30.0,
                    "fastPeriod": 9,
                    "slowPeriod": 21,
                    "maType": "EMA"
                },
                {
                    "id": "c8",
                    "indicator": "PCR",
                    "conditionType": "PcrLessThan",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 20.0,
                    "thresholdValue": 1.0
                },
                {
                    "id": "c9",
                    "indicator": "BollingerBands",
                    "conditionType": "PriceCrossBelowMiddle",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 25.0,
                    "period": 20,
                    "stdDevMultiplier": 2.0
                }
            ]
        }'
    );

    -- Seed Preset 2: Golden Cross Momentum (50/200 MA)
    INSERT INTO CustomStrategy (Name, Description, IsActive, CombinationMode, BuyThreshold, SellThreshold, ConfigJson)
    VALUES (
        'Golden Cross Momentum (50/200 MA)',
        'Classic institutional trend-following strategy using 50 MA and 200 MA crossovers with PCR expansion confirmation.',
        0,
        'WEIGHTED_SCORE',
        70.00,
        35.00,
        '{
            "strategyName": "Golden Cross Momentum (50/200 MA)",
            "combinationMode": "WEIGHTED_SCORE",
            "buyThreshold": 70.0,
            "sellThreshold": 35.0,
            "buyConditions": [
                {
                    "id": "c10",
                    "indicator": "MovingAverage",
                    "conditionType": "FastMaGreaterThanSlowMa",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 35.0,
                    "fastPeriod": 50,
                    "slowPeriod": 200,
                    "maType": "SMA"
                },
                {
                    "id": "c11",
                    "indicator": "MovingAverage",
                    "conditionType": "PriceGreaterThanMa",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 25.0,
                    "period": 50,
                    "maType": "SMA"
                },
                {
                    "id": "c12",
                    "indicator": "PCR",
                    "conditionType": "PcrIncreasing",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 20.0
                },
                {
                    "id": "c13",
                    "indicator": "BollingerBands",
                    "conditionType": "PriceNearLowerBand",
                    "targetSignal": "BUY",
                    "isEnabled": true,
                    "weight": 20.0,
                    "period": 20,
                    "stdDevMultiplier": 2.0
                }
            ],
            "sellConditions": [
                {
                    "id": "c14",
                    "indicator": "MovingAverage",
                    "conditionType": "FastMaCrossBelowSlowMa",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 40.0,
                    "fastPeriod": 50,
                    "slowPeriod": 200,
                    "maType": "SMA"
                },
                {
                    "id": "c15",
                    "indicator": "PCR",
                    "conditionType": "PcrDecreasing",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 30.0
                },
                {
                    "id": "c16",
                    "indicator": "BollingerBands",
                    "conditionType": "PriceNearUpperBand",
                    "targetSignal": "SELL",
                    "isEnabled": true,
                    "weight": 30.0,
                    "period": 20,
                    "stdDevMultiplier": 2.0
                }
            ]
        }'
    );
END
