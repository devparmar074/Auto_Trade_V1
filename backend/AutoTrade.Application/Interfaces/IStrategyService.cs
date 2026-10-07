using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IStrategyService
{
    Task<StrategyScoreDto> GetCurrentScoreAsync(CancellationToken ct = default);
    Task<IEnumerable<Candle>> GetCandlesAsync(string interval = "1minute", int limit = 200, CancellationToken ct = default);
    Task<BotConfig> GetBotConfigAsync(CancellationToken ct = default);
    Task<BotConfig> UpdateBotConfigAsync(BotConfig config, CancellationToken ct = default);
    Task<bool> ActivateKillSwitchAsync(bool closeOpenPositions = false, CancellationToken ct = default);
    Task<IEnumerable<StrategySignalHistory>> GetRecentSignalsAsync(int limit = 20, CancellationToken ct = default);
    Task RunStrategyCycleAsync(CancellationToken ct = default);
}
