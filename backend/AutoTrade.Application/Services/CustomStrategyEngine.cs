using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class CustomStrategyEngine : ICustomStrategyEngine
{
    private readonly IEnumerable<ICustomConditionEvaluator> _evaluators;
    private readonly ILogger<CustomStrategyEngine> _logger;

    public CustomStrategyEngine(
        IEnumerable<ICustomConditionEvaluator> evaluators,
        ILogger<CustomStrategyEngine> logger)
    {
        _evaluators = evaluators;
        _logger = logger;
    }

    public CustomStrategyEvaluationResultDto Evaluate(
        CustomStrategyDto strategy, 
        IList<Candle> candles, 
        decimal currentLtp)
    {
        var result = new CustomStrategyEvaluationResultDto
        {
            StrategyId = strategy.Id > 0 ? strategy.Id : null,
            StrategyName = strategy.StrategyName,
            CombinationMode = strategy.CombinationMode,
            BuyThreshold = strategy.BuyThreshold,
            SellThreshold = strategy.SellThreshold,
            CurrentPrice = currentLtp,
            EvaluatedAtUtc = DateTime.UtcNow
        };

        if (candles == null || candles.Count < 5)
        {
            result.Signal = "HOLD";
            result.Explanations.Add("Insufficient candle data for technical evaluation (minimum 5 candles required).");
            return result;
        }

        // Initialize Context
        var context = new IndicatorContext
        {
            Candles = candles,
            CurrentPrice = currentLtp
        };

        decimal buyScore = 0m;
        decimal maxBuyScore = 0m;
        var buyAllMet = true;
        var buyAnyMet = false;

        // Evaluate BUY conditions
        foreach (var cond in strategy.BuyConditions.Where(c => c.IsEnabled))
        {
            maxBuyScore += cond.Weight;
            var evaluator = _evaluators.FirstOrDefault(e => 
                string.Equals(e.IndicatorName, cond.Indicator, StringComparison.OrdinalIgnoreCase));

            if (evaluator != null)
            {
                var condResult = evaluator.Evaluate(cond, context);
                result.BuyConditionResults.Add(condResult);

                if (condResult.IsMet)
                {
                    buyScore += condResult.PointsAwarded;
                    buyAnyMet = true;
                    result.Explanations.Add($"✓ [BUY] {condResult.Description}: +{condResult.PointsAwarded:F0} pts ({condResult.Details})");
                }
                else
                {
                    buyAllMet = false;
                    result.Explanations.Add($"✗ [BUY] {condResult.Description}: 0 pts ({condResult.Details})");
                }
            }
            else
            {
                buyAllMet = false;
                result.Explanations.Add($"? [BUY] Unsupported indicator evaluator: {cond.Indicator}");
            }
        }

        result.BuyScore = Math.Round(buyScore, 1);
        result.MaxBuyScore = maxBuyScore > 0 ? maxBuyScore : 100m;

        decimal sellScore = 0m;
        decimal maxSellScore = 0m;
        var sellAllMet = true;
        var sellAnyMet = false;

        // Evaluate SELL conditions
        foreach (var cond in strategy.SellConditions.Where(c => c.IsEnabled))
        {
            maxSellScore += cond.Weight;
            var evaluator = _evaluators.FirstOrDefault(e => 
                string.Equals(e.IndicatorName, cond.Indicator, StringComparison.OrdinalIgnoreCase));

            if (evaluator != null)
            {
                var condResult = evaluator.Evaluate(cond, context);
                result.SellConditionResults.Add(condResult);

                if (condResult.IsMet)
                {
                    sellScore += condResult.PointsAwarded;
                    sellAnyMet = true;
                    result.Explanations.Add($"✓ [SELL] {condResult.Description}: +{condResult.PointsAwarded:F0} pts ({condResult.Details})");
                }
                else
                {
                    sellAllMet = false;
                    result.Explanations.Add($"✗ [SELL] {condResult.Description}: 0 pts ({condResult.Details})");
                }
            }
            else
            {
                sellAllMet = false;
                result.Explanations.Add($"? [SELL] Unsupported indicator evaluator: {cond.Indicator}");
            }
        }

        result.SellScore = Math.Round(sellScore, 1);
        result.MaxSellScore = maxSellScore > 0 ? maxSellScore : 100m;

        // Determine Signal based on Combination Mode
        switch (strategy.CombinationMode.ToUpperInvariant())
        {
            case "AND_LOGIC":
                if (strategy.BuyConditions.Any(c => c.IsEnabled) && buyAllMet)
                {
                    result.Signal = "BUY";
                }
                else if (strategy.SellConditions.Any(c => c.IsEnabled) && sellAllMet)
                {
                    result.Signal = "SELL";
                }
                else
                {
                    result.Signal = "HOLD";
                }
                break;

            case "OR_LOGIC":
                if (buyAnyMet && !sellAnyMet)
                {
                    result.Signal = "BUY";
                }
                else if (sellAnyMet && !buyAnyMet)
                {
                    result.Signal = "SELL";
                }
                else
                {
                    result.Signal = "HOLD";
                }
                break;

            case "WEIGHTED_SCORE":
            default:
                if (result.BuyScore >= strategy.BuyThreshold && result.BuyScore > result.SellScore)
                {
                    result.Signal = "BUY";
                }
                else if (result.SellScore >= strategy.SellThreshold && result.SellScore > result.BuyScore)
                {
                    result.Signal = "SELL";
                }
                else
                {
                    result.Signal = "HOLD";
                }
                break;
        }

        _logger.LogInformation("Custom Strategy '{Name}' evaluated: Signal={Signal}, BuyScore={Buy}/{MaxBuy}, SellScore={Sell}/{MaxSell}",
            strategy.StrategyName, result.Signal, result.BuyScore, result.MaxBuyScore, result.SellScore, result.MaxSellScore);

        return result;
    }
}
