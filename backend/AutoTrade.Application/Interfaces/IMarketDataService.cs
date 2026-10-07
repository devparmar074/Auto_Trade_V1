using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IMarketDataService
{
    Task<LtpQuoteDto> GetVodafoneIdeaQuoteAsync(CancellationToken ct = default);
    Task<string> GetMarketStatusAsync(CancellationToken ct = default);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default);
    bool IsIndianMarketHours();
}

