using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public record UpstoxOrderPlacementResult(bool Success, string? UpstoxOrderId, string? Message);
public record UpstoxOrderDetails(string OrderId, string Status, decimal? AveragePrice, int FilledQuantity, string? StatusMessage);

public interface IUpstoxClient
{
    string GetAuthorizationUrl(string state);
    Task<UpstoxConnection> ExchangeCodeForTokenAsync(string code, CancellationToken ct = default);
    Task<UpstoxAuthStatusDto> GetProfileAsync(string accessToken, CancellationToken ct = default);
    Task<LtpQuoteDto> GetQuoteAsync(string instrumentKey, string? accessToken = null, CancellationToken ct = default);
    Task<string> GetMarketStatusAsync(string exchange = "NSE", string? accessToken = null, CancellationToken ct = default);
    Task<UpstoxOrderPlacementResult> PlaceOrderAsync(string accessToken, PlaceOrderRequest request, Instrument instrument, CancellationToken ct = default);
    Task<UpstoxOrderDetails?> GetOrderDetailsAsync(string accessToken, string upstoxOrderId, CancellationToken ct = default);
    Task<IEnumerable<TradeFill>> GetOrderTradesAsync(string accessToken, string upstoxOrderId, CancellationToken ct = default);
    Task<PositionDto?> GetVodafoneIdeaPositionAsync(string accessToken, string instrumentKey, CancellationToken ct = default);
    Task<HoldingDto?> GetVodafoneIdeaHoldingAsync(string accessToken, string isin, CancellationToken ct = default);
    Task<Instrument?> ResolveVodafoneIdeaInstrumentFromMasterAsync(CancellationToken ct = default);
    Task<string?> GetRegisteredIpAsync(string accessToken, CancellationToken ct = default);
    Task<string> SetRegisteredIpAsync(string accessToken, string primaryIp, string? secondaryIp = null, CancellationToken ct = default);
    Task<List<Candle>> GetIntradayCandlesAsync(string instrumentKey, string interval = "1minute", CancellationToken ct = default);
    Task<List<Candle>> GetHistoricalCandlesAsync(string instrumentKey, string interval, DateTime toDate, DateTime fromDate, CancellationToken ct = default);
}
