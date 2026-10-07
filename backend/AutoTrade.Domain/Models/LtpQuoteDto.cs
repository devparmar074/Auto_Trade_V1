namespace AutoTrade.Domain.Models;

public class LtpQuoteDto
{
    public string TradingSymbol { get; set; } = "IDEA";
    public string CompanyName { get; set; } = "Vodafone Idea Limited";
    public string InstrumentKey { get; set; } = string.Empty;
    public decimal Ltp { get; set; }
    public decimal ClosePrice { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal OpenPrice { get; set; }
    public decimal HighPrice { get; set; }
    public decimal LowPrice { get; set; }
    public long Volume { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
