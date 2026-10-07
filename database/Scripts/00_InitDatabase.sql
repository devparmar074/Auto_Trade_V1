IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AutoTradeDb')
BEGIN
    CREATE DATABASE AutoTradeDb;
END
GO

USE AutoTradeDb;
GO

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

GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Instrument')
BEGIN
    CREATE TABLE Instrument (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        InstrumentKey NVARCHAR(100) NOT NULL UNIQUE,
        TradingSymbol NVARCHAR(50) NOT NULL,
        CompanyName NVARCHAR(200) NOT NULL,
        Exchange NVARCHAR(20) NOT NULL DEFAULT 'NSE',
        Segment NVARCHAR(20) NOT NULL DEFAULT 'NSE_EQ',
        Isin NVARCHAR(50) NOT NULL,
        SecurityType NVARCHAR(50) NOT NULL DEFAULT 'NORMAL',
        LotSize INT NOT NULL DEFAULT 1,
        TickSize DECIMAL(18,4) NOT NULL DEFAULT 0.05,
        FreezeQuantity DECIMAL(18,2) NOT NULL DEFAULT 100000.0,
        ExchangeToken NVARCHAR(50) NULL,
        LastUpdatedUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Instrument_Symbol_Exchange ON Instrument(TradingSymbol, Exchange);
END

GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TradeOrder')
BEGIN
    CREATE TABLE TradeOrder (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        CorrelationId NVARCHAR(100) NOT NULL UNIQUE,
        UpstoxOrderId NVARCHAR(100) NULL,
        InstrumentKey NVARCHAR(100) NOT NULL,
        TradingSymbol NVARCHAR(50) NOT NULL,
        TransactionType INT NOT NULL,
        OrderType INT NOT NULL,
        Product NVARCHAR(10) NOT NULL DEFAULT 'D',
        Quantity INT NOT NULL,
        FilledQuantity INT NOT NULL DEFAULT 0,
        Status INT NOT NULL,
        UpstoxStatus NVARCHAR(100) NULL,
        PlacedPrice DECIMAL(18,4) NULL,
        AverageExecutionPrice DECIMAL(18,4) NULL,
        ExecutionTimeUtc DATETIME2 NULL,
        StatusMessage NVARCHAR(1000) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_TradeOrder_UpstoxOrderId ON TradeOrder(UpstoxOrderId);
    CREATE INDEX IX_TradeOrder_CreatedAtUtc ON TradeOrder(CreatedAtUtc DESC);
END

GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TradeFill')
BEGIN
    CREATE TABLE TradeFill (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        TradeOrderId BIGINT NOT NULL FOREIGN KEY REFERENCES TradeOrder(Id),
        UpstoxOrderId NVARCHAR(100) NOT NULL,
        UpstoxTradeId NVARCHAR(100) NOT NULL,
        Quantity INT NOT NULL,
        Price DECIMAL(18,4) NOT NULL,
        TradedAtUtc DATETIME2 NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_TradeFill_TradeOrderId ON TradeFill(TradeOrderId);
END

GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PositionSnapshot')
BEGIN
    CREATE TABLE PositionSnapshot (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        InstrumentKey NVARCHAR(100) NOT NULL,
        TradingSymbol NVARCHAR(50) NOT NULL,
        Quantity INT NOT NULL,
        AveragePrice DECIMAL(18,4) NOT NULL,
        CurrentLtp DECIMAL(18,4) NOT NULL,
        UnrealizedPnL DECIMAL(18,4) NOT NULL,
        RealizedPnL DECIMAL(18,4) NOT NULL,
        TotalPnL DECIMAL(18,4) NOT NULL,
        SnapshotTimeUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_PositionSnapshot_InstrumentKey ON PositionSnapshot(InstrumentKey, SnapshotTimeUtc DESC);
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_AddTradeFill
    @TradeOrderId BIGINT,
    @UpstoxOrderId NVARCHAR(100),
    @UpstoxTradeId NVARCHAR(100),
    @Quantity INT,
    @Price DECIMAL(18,4),
    @TradedAtUtc DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM TradeFill WHERE UpstoxTradeId = @UpstoxTradeId)
    BEGIN
        INSERT INTO TradeFill (
            TradeOrderId,
            UpstoxOrderId,
            UpstoxTradeId,
            Quantity,
            Price,
            TradedAtUtc,
            CreatedAtUtc
        )
        VALUES (
            @TradeOrderId,
            @UpstoxOrderId,
            @UpstoxTradeId,
            @Quantity,
            @Price,
            @TradedAtUtc,
            SYSUTCDATETIME()
        );

        SELECT SCOPE_IDENTITY() AS FillId;
    END
    ELSE
    BEGIN
        SELECT Id AS FillId FROM TradeFill WHERE UpstoxTradeId = @UpstoxTradeId;
    END
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_CreateTradeOrder
    @CorrelationId NVARCHAR(100),
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @TransactionType INT,
    @OrderType INT,
    @Product NVARCHAR(10),
    @Quantity INT,
    @PlacedPrice DECIMAL(18,4) = NULL,
    @Status INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO TradeOrder (
        CorrelationId,
        InstrumentKey,
        TradingSymbol,
        TransactionType,
        OrderType,
        Product,
        Quantity,
        FilledQuantity,
        Status,
        PlacedPrice,
        CreatedAtUtc,
        UpdatedAtUtc
    )
    VALUES (
        @CorrelationId,
        @InstrumentKey,
        @TradingSymbol,
        @TransactionType,
        @OrderType,
        @Product,
        @Quantity,
        0,
        @Status,
        @PlacedPrice,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS OrderId;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_DeactivateUpstoxConnection
    @Id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Id IS NOT NULL
        UPDATE UpstoxConnection SET IsActive = 0, UpdatedAtUtc = SYSUTCDATETIME() WHERE Id = @Id;
    ELSE
        UPDATE UpstoxConnection SET IsActive = 0, UpdatedAtUtc = SYSUTCDATETIME() WHERE IsActive = 1;
END

GO

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

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetInstrumentByKey
    @InstrumentKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM Instrument
    WHERE InstrumentKey = @InstrumentKey;
END

GO

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

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetLatestPositionSnapshot
    @InstrumentKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM PositionSnapshot
    WHERE InstrumentKey = @InstrumentKey
    ORDER BY SnapshotTimeUtc DESC;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetOrderByCorrelationId
    @CorrelationId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM TradeOrder
    WHERE CorrelationId = @CorrelationId;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetOrderById
    @OrderId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM TradeOrder
    WHERE Id = @OrderId;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetRecentOrders
    @Count INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Count) *
    FROM TradeOrder
    ORDER BY Id DESC;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTradesByOrderId
    @TradeOrderId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM TradeFill
    WHERE TradeOrderId = @TradeOrderId
    ORDER BY TradedAtUtc ASC;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_SavePositionSnapshot
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @Quantity INT,
    @AveragePrice DECIMAL(18,4),
    @CurrentLtp DECIMAL(18,4),
    @UnrealizedPnL DECIMAL(18,4),
    @RealizedPnL DECIMAL(18,4),
    @TotalPnL DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO PositionSnapshot (
        InstrumentKey,
        TradingSymbol,
        Quantity,
        AveragePrice,
        CurrentLtp,
        UnrealizedPnL,
        RealizedPnL,
        TotalPnL,
        SnapshotTimeUtc
    )
    VALUES (
        @InstrumentKey,
        @TradingSymbol,
        @Quantity,
        @AveragePrice,
        @CurrentLtp,
        @UnrealizedPnL,
        @RealizedPnL,
        @TotalPnL,
        SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS SnapshotId;
END

GO

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

GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateTradeOrderStatus
    @OrderId BIGINT,
    @UpstoxOrderId NVARCHAR(100) = NULL,
    @Status INT,
    @UpstoxStatus NVARCHAR(100) = NULL,
    @AverageExecutionPrice DECIMAL(18,4) = NULL,
    @ExecutionTimeUtc DATETIME2 = NULL,
    @StatusMessage NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TradeOrder
    SET UpstoxOrderId = COALESCE(@UpstoxOrderId, UpstoxOrderId),
        Status = @Status,
        UpstoxStatus = COALESCE(@UpstoxStatus, UpstoxStatus),
        AverageExecutionPrice = COALESCE(@AverageExecutionPrice, AverageExecutionPrice),
        ExecutionTimeUtc = COALESCE(@ExecutionTimeUtc, ExecutionTimeUtc),
        StatusMessage = COALESCE(@StatusMessage, StatusMessage),
        UpdatedAtUtc = SYSUTCDATETIME()
    WHERE Id = @OrderId;

    SELECT @@ROWCOUNT AS RowsAffected;
END

GO

CREATE OR ALTER PROCEDURE dbo.sp_UpsertInstrument
    @InstrumentKey NVARCHAR(100),
    @TradingSymbol NVARCHAR(50),
    @CompanyName NVARCHAR(200),
    @Exchange NVARCHAR(20),
    @Segment NVARCHAR(20),
    @Isin NVARCHAR(50),
    @SecurityType NVARCHAR(50),
    @LotSize INT,
    @TickSize DECIMAL(18,4),
    @FreezeQuantity DECIMAL(18,2),
    @ExchangeToken NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Instrument WHERE InstrumentKey = @InstrumentKey)
    BEGIN
        UPDATE Instrument
        SET TradingSymbol = @TradingSymbol,
            CompanyName = @CompanyName,
            Exchange = @Exchange,
            Segment = @Segment,
            Isin = @Isin,
            SecurityType = @SecurityType,
            LotSize = @LotSize,
            TickSize = @TickSize,
            FreezeQuantity = @FreezeQuantity,
            ExchangeToken = @ExchangeToken,
            LastUpdatedUtc = SYSUTCDATETIME()
        WHERE InstrumentKey = @InstrumentKey;
    END
    ELSE
    BEGIN
        INSERT INTO Instrument (
            InstrumentKey,
            TradingSymbol,
            CompanyName,
            Exchange,
            Segment,
            Isin,
            SecurityType,
            LotSize,
            TickSize,
            FreezeQuantity,
            ExchangeToken,
            LastUpdatedUtc
        )
        VALUES (
            @InstrumentKey,
            @TradingSymbol,
            @CompanyName,
            @Exchange,
            @Segment,
            @Isin,
            @SecurityType,
            @LotSize,
            @TickSize,
            @FreezeQuantity,
            @ExchangeToken,
            SYSUTCDATETIME()
        );
    END
END

GO

