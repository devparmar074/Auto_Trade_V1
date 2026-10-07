using System.Text.Json.Serialization;
using AutoTrade.Domain.Enums;

namespace AutoTrade.Domain.Models;

public class PlaceOrderRequest
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionType TransactionType { get; set; } = TransactionType.BUY;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderType OrderType { get; set; } = OrderType.MARKET;

    public int Quantity { get; set; } = 1;
    public string Product { get; set; } = "D";
    public decimal? Price { get; set; } = 0;
    public string? CorrelationId { get; set; }
}
