namespace AutoTrade.Domain.Enums;

public enum TransactionType
{
    BUY = 1,
    SELL = 2
}

public enum OrderType
{
    MARKET = 1,
    LIMIT = 2
}

public enum OrderStatus
{
    Pending = 1,
    Open = 2,
    PartiallyFilled = 3,
    Complete = 4,
    Cancelled = 5,
    Rejected = 6,
    Failed = 7,
    Unknown = 8
}

public enum ProductType
{
    Delivery = 1, // 'D' in Upstox
    Intraday = 2  // 'I' in Upstox
}

public enum MarketStatusState
{
    Open = 1,
    Closed = 2,
    PreOpen = 3,
    PostClose = 4
}
