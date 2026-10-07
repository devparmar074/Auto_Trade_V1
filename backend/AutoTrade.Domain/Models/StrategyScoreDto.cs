using AutoTrade.Domain.Enums;

namespace AutoTrade.Domain.Models;

public class StrategyScoreDto
{
    public decimal Score { get; set; } // -100 to +100
    public StrategyRecommendation Recommendation { get; set; }
    public string RecommendationText { get; set; } = "NEUTRAL";
    public TechnicalIndicators Indicators { get; set; } = new();
    public List<string> SignalFactors { get; set; } = new();
    public int RecommendedQuantity { get; set; } = 1;
    public decimal CurrentPrice { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;
}
