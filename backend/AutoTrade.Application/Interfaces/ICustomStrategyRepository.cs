using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface ICustomStrategyRepository
{
    Task<IEnumerable<CustomStrategy>> GetAllAsync(CancellationToken ct = default);
    Task<CustomStrategy?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CustomStrategy> SaveAsync(CustomStrategy strategy, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<ActiveStrategyInfoDto> SetActiveStrategyAsync(string strategyType, int? customStrategyId = null, CancellationToken ct = default);
    Task<ActiveStrategyInfoDto> GetActiveStrategyInfoAsync(CancellationToken ct = default);
}
