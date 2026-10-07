namespace AutoTrade.Domain.Models;

public class CustomStrategyDto
{
    public int Id { get; set; }
    public string StrategyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public string CombinationMode { get; set; } = "WEIGHTED_SCORE"; // "WEIGHTED_SCORE", "AND_LOGIC", "OR_LOGIC"
    public decimal BuyThreshold { get; set; } = 75.0m;
    public decimal SellThreshold { get; set; } = 30.0m;
    public List<StrategyConditionDto> BuyConditions { get; set; } = new();
    public List<StrategyConditionDto> SellConditions { get; set; } = new();
    public DateTime? CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class ActiveStrategyInfoDto
{
    public string ActiveStrategyType { get; set; } = "DEFAULT"; // "DEFAULT" or "CUSTOM"
    public int? ActiveCustomStrategyId { get; set; }
    public string ActiveCustomStrategyName { get; set; } = "Default Strategy (Multi-Factor)";
    public decimal BuyThreshold { get; set; } = 60.0m;
    public decimal SellThreshold { get; set; } = -40.0m;
    public string CombinationMode { get; set; } = "WEIGHTED_SCORE";
}
