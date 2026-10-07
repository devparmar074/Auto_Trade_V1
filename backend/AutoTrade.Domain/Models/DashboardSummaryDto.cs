namespace AutoTrade.Domain.Models;

public class DashboardSummaryDto
{
    public bool BrokerConnected { get; set; }
    public string? BrokerUserId { get; set; }
    public string? BrokerUserName { get; set; }
    public DateTime? TokenExpiresAtUtc { get; set; }
    public string MarketStatus { get; set; } = "CLOSED";
    public LtpQuoteDto? Quote { get; set; }
    public PositionDto? Position { get; set; }
    public HoldingDto? Holding { get; set; }
    public OrderResultDto? LastOrder { get; set; }
}
