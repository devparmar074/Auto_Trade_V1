namespace AutoTrade.Domain.Entities;

public class Instrument
{
    public long Id { get; set; }
    public string InstrumentKey { get; set; } = string.Empty;
    public string TradingSymbol { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Exchange { get; set; } = "NSE";
    public string Segment { get; set; } = "NSE_EQ";
    public string Isin { get; set; } = string.Empty;
    public string SecurityType { get; set; } = "NORMAL";
    public int LotSize { get; set; } = 1;
    public decimal TickSize { get; set; } = 0.05m;
    public decimal FreezeQuantity { get; set; } = 100000m;
    public string? ExchangeToken { get; set; }
    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
}
