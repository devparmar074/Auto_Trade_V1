using System.Data;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Dapper;

namespace AutoTrade.Infrastructure.Data.Repositories;

public class CustomStrategyRepository : ICustomStrategyRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public CustomStrategyRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<CustomStrategy>> GetAllAsync(CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryAsync<CustomStrategy>(
            "dbo.sp_GetCustomStrategies",
            commandType: CommandType.StoredProcedure);
    }

    public async Task<CustomStrategy?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<CustomStrategy>(
            "dbo.sp_GetCustomStrategyById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<CustomStrategy> SaveAsync(CustomStrategy strategy, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var p = new DynamicParameters();
        p.Add("@Id", strategy.Id);
        p.Add("@Name", strategy.Name);
        p.Add("@Description", strategy.Description);
        p.Add("@CombinationMode", strategy.CombinationMode);
        p.Add("@BuyThreshold", strategy.BuyThreshold);
        p.Add("@SellThreshold", strategy.SellThreshold);
        p.Add("@ConfigJson", strategy.ConfigJson);

        return await db.QuerySingleAsync<CustomStrategy>(
            "dbo.sp_SaveCustomStrategy",
            p,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var affected = await db.ExecuteAsync(
            "dbo.sp_DeleteCustomStrategy",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
        return affected > 0;
    }

    public async Task<ActiveStrategyInfoDto> SetActiveStrategyAsync(string strategyType, int? customStrategyId = null, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var p = new DynamicParameters();
        p.Add("@StrategyType", strategyType);
        p.Add("@CustomStrategyId", customStrategyId);

        await db.ExecuteAsync(
            "dbo.sp_SetActiveStrategy",
            p,
            commandType: CommandType.StoredProcedure);

        return await GetActiveStrategyInfoAsync(ct);
    }

    public async Task<ActiveStrategyInfoDto> GetActiveStrategyInfoAsync(CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var result = await db.QueryFirstOrDefaultAsync<ActiveStrategyInfoDto>(
            "dbo.sp_GetActiveStrategyInfo",
            commandType: CommandType.StoredProcedure);

        return result ?? new ActiveStrategyInfoDto();
    }
}
