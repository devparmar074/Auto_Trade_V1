using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class PortfolioService : IPortfolioService
{
    private readonly IUpstoxClient _upstoxClient;
    private readonly IInstrumentService _instrumentService;
    private readonly IUpstoxAuthService _authService;
    private readonly ILogger<PortfolioService> _logger;

    public PortfolioService(
        IUpstoxClient upstoxClient,
        IInstrumentService instrumentService,
        IUpstoxAuthService authService,
        ILogger<PortfolioService> logger)
    {
        _upstoxClient = upstoxClient;
        _instrumentService = instrumentService;
        _authService = authService;
        _logger = logger;
    }

    public async Task<PositionDto> GetPositionAsync(CancellationToken ct = default)
    {
        var token = await _authService.GetActiveAccessTokenAsync(ct);
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);

        var position = await _upstoxClient.GetVodafoneIdeaPositionAsync(token, instrument.InstrumentKey, ct);
        if (position != null) return position;

        var holding = await _upstoxClient.GetVodafoneIdeaHoldingAsync(token, instrument.Isin, ct);
        if (holding != null && holding.Quantity > 0)
        {
            return new PositionDto
            {
                TradingSymbol = "IDEA",
                InstrumentKey = instrument.InstrumentKey,
                Quantity = holding.Quantity,
                AveragePrice = holding.AveragePrice,
                CurrentLtp = holding.CurrentLtp,
                UnrealizedPnL = holding.Pnl,
                RealizedPnL = 0m,
                TotalPnL = holding.Pnl,
                LastUpdatedUtc = DateTime.UtcNow
            };
        }

        return new PositionDto
        {
            TradingSymbol = "IDEA",
            InstrumentKey = instrument.InstrumentKey,
            Quantity = 0,
            AveragePrice = 0m,
            CurrentLtp = 0m,
            UnrealizedPnL = 0m,
            RealizedPnL = 0m,
            TotalPnL = 0m,
            LastUpdatedUtc = DateTime.UtcNow
        };
    }

    public async Task<HoldingDto?> GetHoldingAsync(CancellationToken ct = default)
    {
        var token = await _authService.GetActiveAccessTokenAsync(ct);
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);
        return await _upstoxClient.GetVodafoneIdeaHoldingAsync(token, instrument.Isin, ct);
    }
}
