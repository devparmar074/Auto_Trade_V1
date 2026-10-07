using AutoTrade.Domain.Entities;

namespace AutoTrade.Application.Interfaces;

public interface IInstrumentService
{
    Task<Instrument> GetVodafoneIdeaInstrumentAsync(CancellationToken ct = default);
    Task<Instrument> RefreshVodafoneIdeaInstrumentAsync(CancellationToken ct = default);
}
