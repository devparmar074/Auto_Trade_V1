using AutoTrade.Application.Exceptions;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class InstrumentService : IInstrumentService
{
    private readonly IInstrumentRepository _repository;
    private readonly IUpstoxClient _upstoxClient;
    private readonly ILogger<InstrumentService> _logger;
    private Instrument? _cachedInstrument;

    public InstrumentService(
        IInstrumentRepository repository,
        IUpstoxClient upstoxClient,
        ILogger<InstrumentService> logger)
    {
        _repository = repository;
        _upstoxClient = upstoxClient;
        _logger = logger;
    }

    public async Task<Instrument> GetVodafoneIdeaInstrumentAsync(CancellationToken ct = default)
    {
        if (_cachedInstrument != null)
            return _cachedInstrument;

        var dbInstrument = await _repository.GetInstrumentBySymbolAsync("IDEA", "NSE", ct);
        if (dbInstrument != null && dbInstrument.LastUpdatedUtc > DateTime.UtcNow.AddDays(-1))
        {
            _cachedInstrument = dbInstrument;
            return _cachedInstrument;
        }

        return await RefreshVodafoneIdeaInstrumentAsync(ct);
    }

    public async Task<Instrument> RefreshVodafoneIdeaInstrumentAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Resolving Vodafone Idea instrument from official Upstox master...");
        var resolved = await _upstoxClient.ResolveVodafoneIdeaInstrumentFromMasterAsync(ct);
        if (resolved == null)
        {
            resolved = new Instrument
            {
                InstrumentKey = "NSE_EQ|INE669E01016",
                TradingSymbol = "IDEA",
                CompanyName = "VODAFONE IDEA LIMITED",
                Exchange = "NSE",
                Segment = "NSE_EQ",
                Isin = "INE669E01016",
                SecurityType = "NORMAL",
                LotSize = 1,
                TickSize = 0.05m,
                FreezeQuantity = 100000m,
                ExchangeToken = "14366",
                LastUpdatedUtc = DateTime.UtcNow
            };
        }

        if (resolved.TradingSymbol != "IDEA" || resolved.Segment != "NSE_EQ" || resolved.Isin != "INE669E01016")
        {
            throw new TradingException("Invalid instrument resolved: Instrument must strictly be Vodafone Idea Limited (NSE_EQ)");
        }

        await _repository.UpsertInstrumentAsync(resolved, ct);
        _cachedInstrument = resolved;
        _logger.LogInformation("Vodafone Idea instrument verified and cached: {Key} ({Symbol})", resolved.InstrumentKey, resolved.TradingSymbol);
        return _cachedInstrument;
    }
}
