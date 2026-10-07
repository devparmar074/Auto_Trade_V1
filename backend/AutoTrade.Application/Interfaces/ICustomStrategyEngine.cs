using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface ICustomStrategyEngine
{
    CustomStrategyEvaluationResultDto Evaluate(CustomStrategyDto strategy, IList<Candle> candles, decimal currentLtp);
}
