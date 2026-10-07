namespace AutoTrade.Domain.Models;

public class CustomStrategyEvaluationResultDto
{
    public int? StrategyId { get; set; }
    public string StrategyName { get; set; } = string.Empty;
    public string CombinationMode { get; set; } = "WEIGHTED_SCORE";
    public decimal BuyScore { get; set; }
    public decimal MaxBuyScore { get; set; }
    public decimal SellScore { get; set; }
    public decimal MaxSellScore { get; set; }
    public decimal BuyThreshold { get; set; }
    public decimal SellThreshold { get; set; }
    public string Signal { get; set; } = "HOLD"; // "BUY", "HOLD", "SELL"
    public decimal CurrentPrice { get; set; }
    public DateTime EvaluatedAtUtc { get; set; } = DateTime.UtcNow;

    // Detailed explanation of every condition evaluated
    public List<ConditionEvaluationResultDto> BuyConditionResults { get; set; } = new();
    public List<ConditionEvaluationResultDto> SellConditionResults { get; set; } = new();

    // Summary lines for quick UI rendering
    public List<string> Explanations { get; set; } = new();
}

public class ConditionEvaluationResultDto
{
    public string ConditionId { get; set; } = string.Empty;
    public string Indicator { get; set; } = string.Empty;
    public string ConditionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetSignal { get; set; } = "BUY"; // "BUY" or "SELL"
    public bool IsMet { get; set; }
    public decimal Weight { get; set; }
    public decimal PointsAwarded { get; set; }
    public string Details { get; set; } = string.Empty; // e.g. "Price (12.95) > 20 SMA (12.89)"
}
