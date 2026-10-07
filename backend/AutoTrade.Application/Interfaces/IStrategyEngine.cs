using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IStrategyEngine
{
    StrategyScoreDto Evaluate(IList<Candle> candles, decimal currentLtp, BotConfig config);
    int CalculateQuantity(decimal score, BotConfig config);
}
