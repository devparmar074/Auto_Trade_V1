namespace AutoTrade.Domain.Entities;

public class CustomStrategy
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public string CombinationMode { get; set; } = "WEIGHTED_SCORE";
    public decimal BuyThreshold { get; set; } = 75.0m;
    public decimal SellThreshold { get; set; } = 30.0m;
    public string ConfigJson { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
