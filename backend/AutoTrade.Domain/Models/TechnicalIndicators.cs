namespace AutoTrade.Domain.Models;

public class TechnicalIndicators
{
    public decimal? Rsi { get; set; }
    public decimal? Ema9 { get; set; }
    public decimal? Ema21 { get; set; }
    public decimal? Ema50 { get; set; }
    public decimal? Vwap { get; set; }
    public decimal? Supertrend { get; set; }
    public string SupertrendDirection { get; set; } = "FLAT"; // "BULLISH", "BEARISH", "FLAT"
    public decimal? VolumeRatio { get; set; }
}
