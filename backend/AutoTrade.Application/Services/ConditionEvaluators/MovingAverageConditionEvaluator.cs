using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Services.ConditionEvaluators;

public class MovingAverageConditionEvaluator : ICustomConditionEvaluator
{
    public string IndicatorName => "MovingAverage";

    public ConditionEvaluationResultDto Evaluate(StrategyConditionDto condition, IndicatorContext context)
    {
        var result = new ConditionEvaluationResultDto
        {
            ConditionId = condition.Id,
            Indicator = condition.Indicator,
            ConditionType = condition.ConditionType,
            TargetSignal = condition.TargetSignal,
            Weight = condition.Weight,
            IsMet = false,
            PointsAwarded = 0m
        };

        if (context.Candles.Count < 5)
        {
            result.Description = "Insufficient candle history for Moving Average";
            result.Details = "At least 5 candles required";
            return result;
        }

        var isEma = string.Equals(condition.MaType, "EMA", StringComparison.OrdinalIgnoreCase);
        var price = context.CurrentPrice;

        switch (condition.ConditionType)
        {
            case "PriceGreaterThanMa":
            {
                var period = condition.Period ?? 20;
                var ma = isEma ? context.GetEma(period) : context.GetSma(period);
                var typeStr = isEma ? "EMA" : "SMA";
                result.Description = $"Price > {period} {typeStr}";

                if (ma.HasValue && price > ma.Value)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price (₹{price:F2}) > {period} {typeStr} (₹{ma.Value:F2})";
                }
                else
                {
                    result.Details = $"Price (₹{price:F2}) <= {period} {typeStr} (₹{ma?.ToString("F2") ?? "N/A"})";
                }
                break;
            }

            case "PriceLessThanMa":
            {
                var period = condition.Period ?? 20;
                var ma = isEma ? context.GetEma(period) : context.GetSma(period);
                var typeStr = isEma ? "EMA" : "SMA";
                result.Description = $"Price < {period} {typeStr}";

                if (ma.HasValue && price < ma.Value)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price (₹{price:F2}) < {period} {typeStr} (₹{ma.Value:F2})";
                }
                else
                {
                    result.Details = $"Price (₹{price:F2}) >= {period} {typeStr} (₹{ma?.ToString("F2") ?? "N/A"})";
                }
                break;
            }

            case "FastMaGreaterThanSlowMa":
            {
                var fastP = condition.FastPeriod ?? 9;
                var slowP = condition.SlowPeriod ?? 21;
                var typeStr = isEma ? "EMA" : "SMA";
                result.Description = $"{fastP} {typeStr} > {slowP} {typeStr}";

                var fastMa = isEma ? context.GetEma(fastP) : context.GetSma(fastP);
                var slowMa = isEma ? context.GetEma(slowP) : context.GetSma(slowP);

                if (fastMa.HasValue && slowMa.HasValue && fastMa.Value > slowMa.Value)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"{fastP} {typeStr} (₹{fastMa.Value:F2}) > {slowP} {typeStr} (₹{slowMa.Value:F2})";
                }
                else
                {
                    result.Details = $"{fastP} {typeStr} (₹{fastMa?.ToString("F2") ?? "N/A"}) <= {slowP} {typeStr} (₹{slowMa?.ToString("F2") ?? "N/A"})";
                }
                break;
            }

            case "FastMaCrossAboveSlowMa":
            {
                var fastP = condition.FastPeriod ?? 9;
                var slowP = condition.SlowPeriod ?? 21;
                var typeStr = isEma ? "EMA" : "SMA";
                result.Description = $"{fastP} {typeStr} crosses above {slowP} {typeStr}";

                var currFast = isEma ? context.GetEma(fastP) : context.GetSma(fastP);
                var currSlow = isEma ? context.GetEma(slowP) : context.GetSma(slowP);
                var prevFast = isEma ? context.GetPreviousEma(fastP) : context.GetPreviousSma(fastP);
                var prevSlow = isEma ? context.GetPreviousEma(slowP) : context.GetPreviousSma(slowP);

                if (currFast.HasValue && currSlow.HasValue && prevFast.HasValue && prevSlow.HasValue)
                {
                    // Bullish Golden Crossover: currently above, previously below or equal
                    if (currFast.Value > currSlow.Value && prevFast.Value <= prevSlow.Value)
                    {
                        result.IsMet = true;
                        result.PointsAwarded = condition.Weight;
                        result.Details = $"Crossover confirmed: {fastP} crossed above {slowP} ({currFast.Value:F2} > {currSlow.Value:F2})";
                    }
                    else if (currFast.Value > currSlow.Value)
                    {
                        // Already trending above (award partial 60% points if desired or full if trending)
                        result.IsMet = true;
                        result.PointsAwarded = condition.Weight;
                        result.Details = $"{fastP} {typeStr} is currently above {slowP} {typeStr} (trend active)";
                    }
                    else
                    {
                        result.Details = $"No crossover: {fastP} {typeStr} ({currFast.Value:F2}) is below {slowP} {typeStr} ({currSlow.Value:F2})";
                    }
                }
                else
                {
                    result.Details = "Insufficient historical periods for crossover detection";
                }
                break;
            }

            case "FastMaCrossBelowSlowMa":
            {
                var fastP = condition.FastPeriod ?? 9;
                var slowP = condition.SlowPeriod ?? 21;
                var typeStr = isEma ? "EMA" : "SMA";
                result.Description = $"{fastP} {typeStr} crosses below {slowP} {typeStr}";

                var currFast = isEma ? context.GetEma(fastP) : context.GetSma(fastP);
                var currSlow = isEma ? context.GetEma(slowP) : context.GetSma(slowP);
                var prevFast = isEma ? context.GetPreviousEma(fastP) : context.GetPreviousSma(fastP);
                var prevSlow = isEma ? context.GetPreviousEma(slowP) : context.GetPreviousSma(slowP);

                if (currFast.HasValue && currSlow.HasValue && prevFast.HasValue && prevSlow.HasValue)
                {
                    // Bearish Death Crossover: currently below, previously above or equal
                    if (currFast.Value < currSlow.Value && prevFast.Value >= prevSlow.Value)
                    {
                        result.IsMet = true;
                        result.PointsAwarded = condition.Weight;
                        result.Details = $"Bearish crossover: {fastP} crossed below {slowP} ({currFast.Value:F2} < {currSlow.Value:F2})";
                    }
                    else if (currFast.Value < currSlow.Value)
                    {
                        result.IsMet = true;
                        result.PointsAwarded = condition.Weight;
                        result.Details = $"{fastP} {typeStr} is currently below {slowP} {typeStr} (downtrend active)";
                    }
                    else
                    {
                        result.Details = $"No cross below: {fastP} {typeStr} ({currFast.Value:F2}) is above {slowP} {typeStr} ({currSlow.Value:F2})";
                    }
                }
                else
                {
                    result.Details = "Insufficient historical periods for crossover detection";
                }
                break;
            }

            default:
                result.Description = $"Unknown MA condition: {condition.ConditionType}";
                result.Details = "Unsupported condition type";
                break;
        }

        return result;
    }
}
