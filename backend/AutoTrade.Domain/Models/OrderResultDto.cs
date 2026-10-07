using AutoTrade.Domain.Enums;

namespace AutoTrade.Domain.Models;

public class OrderResultDto
{
    public bool Success { get; set; }
    public long LocalOrderId { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string? UpstoxOrderId { get; set; }
    public OrderStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public TransactionType TransactionType { get; set; }
    public int Quantity { get; set; }
    public decimal? ExecutionPrice { get; set; }
    public DateTime? ExecutionTimeUtc { get; set; }
    public string? Message { get; set; }
}
