namespace AutoTrade.Domain.Models;

public class StrategyConditionDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Indicator { get; set; } = "MovingAverage"; // "MovingAverage", "PCR", "BollingerBands"
    public string ConditionType { get; set; } = "PriceGreaterThanMa";
    public string TargetSignal { get; set; } = "BUY"; // "BUY", "SELL"
    public bool IsEnabled { get; set; } = true;
    public decimal Weight { get; set; } = 20.0m;

    // Moving Average parameters
    public string? MaType { get; set; } = "SMA"; // "SMA", "EMA"
    public int? Period { get; set; } = 20; // 20, 50, 200
    public int? FastPeriod { get; set; } = 9; // 9, 50
    public int? SlowPeriod { get; set; } = 21; // 21, 200

    // PCR parameters
    public decimal? ThresholdValue { get; set; } = 1.0m;

    // Bollinger Bands parameters
    public decimal? StdDevMultiplier { get; set; } = 2.0m;
}
