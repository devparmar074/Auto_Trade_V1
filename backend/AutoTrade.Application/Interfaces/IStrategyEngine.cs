using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IStrategyEngine
{
    StrategyScoreDto Evaluate(IList<Candle> candles, decimal currentLtp, BotConfig config, decimal? availableFunds = null);
    int CalculateQuantity(decimal score, BotConfig config);
    int CalculateQuantity(decimal score, BotConfig config, decimal currentLtp, decimal? availableFunds = null);
}
