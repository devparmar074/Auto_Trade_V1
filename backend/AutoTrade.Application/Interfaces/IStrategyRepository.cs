using AutoTrade.Domain.Entities;

namespace AutoTrade.Application.Interfaces;

public interface IStrategyRepository
{
    Task<BotConfig> GetConfigAsync(CancellationToken ct = default);
    Task<BotConfig> SaveConfigAsync(BotConfig config, CancellationToken ct = default);
    Task<long> InsertSignalAsync(StrategySignalHistory signal, CancellationToken ct = default);
    Task<IEnumerable<StrategySignalHistory>> GetRecentSignalsAsync(string symbol = "IDEA", int limit = 20, CancellationToken ct = default);
}
