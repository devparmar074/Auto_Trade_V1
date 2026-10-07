using AutoTrade.Domain.Enums;

namespace AutoTrade.Domain.Entities;

public class TradeOrder
{
    public long Id { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string? UpstoxOrderId { get; set; }
    public string InstrumentKey { get; set; } = string.Empty;
    public string TradingSymbol { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public OrderType OrderType { get; set; }
    public string Product { get; set; } = "D";
    public int Quantity { get; set; }
    public int FilledQuantity { get; set; }
    public OrderStatus Status { get; set; }
    public string? UpstoxStatus { get; set; }
    public decimal? PlacedPrice { get; set; }
    public decimal? AverageExecutionPrice { get; set; }
    public DateTime? ExecutionTimeUtc { get; set; }
    public string? StatusMessage { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
