using AutoTrade.Domain.Enums;

namespace AutoTrade.Domain.Entities;

public class BotConfig
{
    public int Id { get; set; } = 1;
    public BotMode BotMode { get; set; } = BotMode.Manual;
    public decimal BuyScoreThreshold { get; set; } = 60.00m;
    public decimal SellScoreThreshold { get; set; } = -40.00m;
    public int BaseQuantity { get; set; } = 1;
    public int MaxQuantity { get; set; } = 10;
    public decimal StopLossPercent { get; set; } = 2.00m;
    public decimal TakeProfitPercent { get; set; } = 4.00m;
    public decimal TrailingStopPercent { get; set; } = 1.00m;
    public decimal DailyMaxLossAmount { get; set; } = 500.00m;
    public int MaxOrdersPerDay { get; set; } = 20;
    public bool IsKillSwitchActive { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
