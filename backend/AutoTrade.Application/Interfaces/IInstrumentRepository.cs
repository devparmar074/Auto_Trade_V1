using AutoTrade.Domain.Entities;

namespace AutoTrade.Application.Interfaces;

public interface IInstrumentRepository
{
    Task UpsertInstrumentAsync(Instrument instrument, CancellationToken ct = default);
    Task<Instrument?> GetInstrumentBySymbolAsync(string symbol, string exchange = "NSE", CancellationToken ct = default);
    Task<Instrument?> GetInstrumentByKeyAsync(string instrumentKey, CancellationToken ct = default);
}
