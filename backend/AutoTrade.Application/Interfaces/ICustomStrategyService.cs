using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface ICustomStrategyService
{
    Task<IEnumerable<CustomStrategyDto>> GetAllStrategiesAsync(CancellationToken ct = default);
    Task<CustomStrategyDto?> GetStrategyByIdAsync(int id, CancellationToken ct = default);
    Task<CustomStrategyDto> SaveStrategyAsync(CustomStrategyDto dto, CancellationToken ct = default);
    Task<bool> DeleteStrategyAsync(int id, CancellationToken ct = default);
    Task<CustomStrategyDto> DuplicateStrategyAsync(int id, CancellationToken ct = default);
    Task<ActiveStrategyInfoDto> SetActiveStrategyAsync(string strategyType, int? customStrategyId = null, CancellationToken ct = default);
    Task<ActiveStrategyInfoDto> GetActiveStrategyInfoAsync(CancellationToken ct = default);
    Task<CustomStrategyEvaluationResultDto> EvaluateStrategyAsync(CustomStrategyDto dto, CancellationToken ct = default);
    Task<CustomStrategyEvaluationResultDto?> EvaluateActiveStrategyAsync(CancellationToken ct = default);
}
