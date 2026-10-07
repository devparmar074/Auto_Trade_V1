using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Services.ConditionEvaluators;

public class BollingerBandsConditionEvaluator : ICustomConditionEvaluator
{
    public string IndicatorName => "BollingerBands";

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

        var period = condition.Period ?? 20;
        var mult = condition.StdDevMultiplier ?? 2.0m;

        var bb = context.GetBollingerBands(period, mult);
        var prevBb = context.GetPreviousBollingerBands(period, mult);
        var price = context.CurrentPrice;
        var prevPrice = context.PreviousCandle?.Close ?? price;

        if (!bb.HasValue)
        {
            result.Description = $"Bollinger Bands ({period}, {mult})";
            result.Details = "Insufficient historical candles for BB calculation";
            return result;
        }

        var (upper, middle, lower, bandwidth) = bb.Value;

        switch (condition.ConditionType)
        {
            case "BbSqueeze":
            {
                result.Description = $"BB Squeeze detected (Bandwidth contracting)";
                // A squeeze occurs when bandwidth is unusually narrow (e.g. < 2.5% on a low priced stock) or narrowing compared to previous
                var isSqueezing = prevBb.HasValue ? bandwidth <= prevBb.Value.Bandwidth || bandwidth < 2.5m : bandwidth < 2.5m;
                if (isSqueezing)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Bandwidth compressed at {bandwidth:F2}% (Upper: ₹{upper:F2}, Lower: ₹{lower:F2})";
                }
                else
                {
                    result.Details = $"Bandwidth expanding at {bandwidth:F2}% (no squeeze)";
                }
                break;
            }

            case "PriceCrossAboveMiddle":
            {
                result.Description = "Price crosses above BB Middle (20 SMA)";
                if (prevBb.HasValue && price > middle && prevPrice <= prevBb.Value.Middle)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price crossed above Middle Band: ₹{price:F2} > ₹{middle:F2} (prev ₹{prevPrice:F2})";
                }
                else if (price > middle)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price is currently above Middle Band: ₹{price:F2} > ₹{middle:F2}";
                }
                else
                {
                    result.Details = $"Price is below Middle Band: ₹{price:F2} <= ₹{middle:F2}";
                }
                break;
            }

            case "PriceCrossBelowMiddle":
            {
                result.Description = "Price crosses below BB Middle (20 SMA)";
                if (prevBb.HasValue && price < middle && prevPrice >= prevBb.Value.Middle)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price crossed below Middle Band: ₹{price:F2} < ₹{middle:F2} (prev ₹{prevPrice:F2})";
                }
                else if (price < middle)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price is currently below Middle Band: ₹{price:F2} < ₹{middle:F2}";
                }
                else
                {
                    result.Details = $"Price is above Middle Band: ₹{price:F2} >= ₹{middle:F2}";
                }
                break;
            }

            case "PriceNearLowerBand":
            {
                result.Description = "Price near lower band (support)";
                // Within 0.8% of lower band
                var nearLowerThreshold = lower * 1.008m;
                if (price <= nearLowerThreshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price (₹{price:F2}) is near or at Lower Band (₹{lower:F2})";
                }
                else
                {
                    result.Details = $"Price (₹{price:F2}) is above Lower Band buffer (₹{nearLowerThreshold:F2})";
                }
                break;
            }

            case "PriceNearUpperBand":
            {
                result.Description = "Price near upper band (resistance)";
                // Within 0.8% of upper band
                var nearUpperThreshold = upper * 0.992m;
                if (price >= nearUpperThreshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price (₹{price:F2}) is near or at Upper Band (₹{upper:F2})";
                }
                else
                {
                    result.Details = $"Price (₹{price:F2}) is below Upper Band buffer (₹{nearUpperThreshold:F2})";
                }
                break;
            }

            case "PriceCrossUpperBand":
            {
                result.Description = "Price crosses upper band (breakout)";
                if (price >= upper)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price broke above Upper Band: ₹{price:F2} >= ₹{upper:F2}";
                }
                else
                {
                    result.Details = $"Price within bands: ₹{price:F2} < ₹{upper:F2}";
                }
                break;
            }

            case "PriceCrossLowerBand":
            {
                result.Description = "Price crosses lower band (breakdown)";
                if (price <= lower)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"Price broke below Lower Band: ₹{price:F2} <= ₹{lower:F2}";
                }
                else
                {
                    result.Details = $"Price within bands: ₹{price:F2} > ₹{lower:F2}";
                }
                break;
            }

            default:
                result.Description = $"Unknown BB condition: {condition.ConditionType}";
                result.Details = "Unsupported condition type";
                break;
        }

        return result;
    }
}
