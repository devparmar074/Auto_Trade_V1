using System.Data;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;
using Dapper;

namespace AutoTrade.Infrastructure.Data.Repositories;

public class StrategyRepository : IStrategyRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public StrategyRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<BotConfig> GetConfigAsync(CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var row = await db.QueryFirstOrDefaultAsync<dynamic>(
            "dbo.sp_GetStrategyConfig",
            commandType: CommandType.StoredProcedure);

        if (row == null)
        {
            return new BotConfig();
        }

        return MapBotConfig(row);
    }

    public async Task<BotConfig> SaveConfigAsync(BotConfig config, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@BotMode", config.BotMode.ToString());
        parameters.Add("@BuyScoreThreshold", config.BuyScoreThreshold);
        parameters.Add("@SellScoreThreshold", config.SellScoreThreshold);
        parameters.Add("@BaseQuantity", config.BaseQuantity);
        parameters.Add("@MaxQuantity", config.MaxQuantity);
        parameters.Add("@StopLossPercent", config.StopLossPercent);
        parameters.Add("@TakeProfitPercent", config.TakeProfitPercent);
        parameters.Add("@TrailingStopPercent", config.TrailingStopPercent);
        parameters.Add("@DailyMaxLossAmount", config.DailyMaxLossAmount);
        parameters.Add("@MaxOrdersPerDay", config.MaxOrdersPerDay);
        parameters.Add("@IsKillSwitchActive", config.IsKillSwitchActive);
        parameters.Add("@UseDynamicCapitalSizing", config.UseDynamicCapitalSizing);
        parameters.Add("@CapitalAllocationPercent", config.CapitalAllocationPercent);
        parameters.Add("@MaxCapitalPerTrade", config.MaxCapitalPerTrade);

        var row = await db.QueryFirstOrDefaultAsync<dynamic>(
            "dbo.sp_SaveStrategyConfig",
            parameters,
            commandType: CommandType.StoredProcedure);

        return row != null ? MapBotConfig(row) : config;
    }

    public async Task<long> InsertSignalAsync(StrategySignalHistory signal, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@InstrumentKey", signal.InstrumentKey);
        parameters.Add("@TradingSymbol", signal.TradingSymbol);
        parameters.Add("@Score", signal.Score);
        parameters.Add("@Recommendation", signal.Recommendation);
        parameters.Add("@Rsi", signal.Rsi);
        parameters.Add("@Ema9", signal.Ema9);
        parameters.Add("@Ema21", signal.Ema21);
        parameters.Add("@Ema50", signal.Ema50);
        parameters.Add("@Vwap", signal.Vwap);
        parameters.Add("@Supertrend", signal.Supertrend);
        parameters.Add("@SupertrendDirection", signal.SupertrendDirection);
        parameters.Add("@SignalFactors", signal.SignalFactors);
        parameters.Add("@RecommendedQuantity", signal.RecommendedQuantity);
        parameters.Add("@ActionTaken", signal.ActionTaken);

        return await db.ExecuteScalarAsync<long>(
            "dbo.sp_InsertStrategySignal",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<StrategySignalHistory>> GetRecentSignalsAsync(string symbol = "IDEA", int limit = 20, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@TradingSymbol", symbol);
        parameters.Add("@Limit", limit);

        return await db.QueryAsync<StrategySignalHistory>(
            "dbo.sp_GetRecentStrategySignals",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    private static BotConfig MapBotConfig(dynamic row)
    {
        var modeStr = (string)(row.BotMode ?? "Manual");
        Enum.TryParse<BotMode>(modeStr, true, out var mode);

        var dict = (IDictionary<string, object?>)row;

        return new BotConfig
        {
            Id = (int)row.Id,
            BotMode = mode,
            BuyScoreThreshold = (decimal)row.BuyScoreThreshold,
            SellScoreThreshold = (decimal)row.SellScoreThreshold,
            BaseQuantity = (int)row.BaseQuantity,
            MaxQuantity = (int)row.MaxQuantity,
            StopLossPercent = (decimal)row.StopLossPercent,
            TakeProfitPercent = (decimal)row.TakeProfitPercent,
            TrailingStopPercent = (decimal)row.TrailingStopPercent,
            DailyMaxLossAmount = (decimal)row.DailyMaxLossAmount,
            MaxOrdersPerDay = (int)row.MaxOrdersPerDay,
            IsKillSwitchActive = (bool)row.IsKillSwitchActive,
            UseDynamicCapitalSizing = dict.ContainsKey("UseDynamicCapitalSizing") && dict["UseDynamicCapitalSizing"] != null ? (bool)dict["UseDynamicCapitalSizing"]! : true,
            CapitalAllocationPercent = dict.ContainsKey("CapitalAllocationPercent") && dict["CapitalAllocationPercent"] != null ? (decimal)dict["CapitalAllocationPercent"]! : 90.00m,
            MaxCapitalPerTrade = dict.ContainsKey("MaxCapitalPerTrade") && dict["MaxCapitalPerTrade"] != null ? (decimal)dict["MaxCapitalPerTrade"]! : 1000.00m,
            CreatedAtUtc = (DateTime)row.CreatedAtUtc,
            UpdatedAtUtc = (DateTime)row.UpdatedAtUtc
        };
    }
}
