namespace AutoTrade.Domain.Entities;

public class TradeFill
{
    public long Id { get; set; }
    public long TradeOrderId { get; set; }
    public string UpstoxOrderId { get; set; } = string.Empty;
    public string UpstoxTradeId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public DateTime TradedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
