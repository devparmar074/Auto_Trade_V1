namespace AutoTrade.Domain.Models;

public class UpstoxFundsDto
{
    public decimal AvailableMargin { get; set; }
    public decimal UsedMargin { get; set; }
    public decimal PayinAmount { get; set; }
    public decimal SpanMargin { get; set; }
    public decimal AdhocMargin { get; set; }
    public decimal NotionalCash { get; set; }
    public decimal ExposureMargin { get; set; }
    public bool IsLive { get; set; } = true;
    public string? StatusMessage { get; set; }
    public DateTime RetrievedAtUtc { get; set; } = DateTime.UtcNow;
}
