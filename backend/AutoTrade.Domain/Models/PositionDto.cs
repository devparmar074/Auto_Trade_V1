namespace AutoTrade.Domain.Models;

public class PositionDto
{
    public string TradingSymbol { get; set; } = "IDEA";
    public string InstrumentKey { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal CurrentLtp { get; set; }
    public decimal UnrealizedPnL { get; set; }
    public decimal RealizedPnL { get; set; }
    public decimal TotalPnL { get; set; }
    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
}
