namespace AutoTrade.Domain.Models;

public class RiskAlertDto
{
    public string AlertType { get; set; } = string.Empty; // "STOP_LOSS", "TAKE_PROFIT", "TRAILING_SL", "CIRCUIT_BREAKER", "KILL_SWITCH"
    public string Message { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal TriggerPrice { get; set; }
    public decimal PnlAmount { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
