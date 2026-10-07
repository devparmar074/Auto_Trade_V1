namespace AutoTrade.Domain.Entities;

public class StrategySignalHistory
{
    public long Id { get; set; }
    public string InstrumentKey { get; set; } = string.Empty;
    public string TradingSymbol { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public decimal? Rsi { get; set; }
    public decimal? Ema9 { get; set; }
    public decimal? Ema21 { get; set; }
    public decimal? Ema50 { get; set; }
    public decimal? Vwap { get; set; }
    public decimal? Supertrend { get; set; }
    public string? SupertrendDirection { get; set; }
    public string? SignalFactors { get; set; }
    public int RecommendedQuantity { get; set; } = 1;
    public string? ActionTaken { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
