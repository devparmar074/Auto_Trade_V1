using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Services.ConditionEvaluators;

public class PcrConditionEvaluator : ICustomConditionEvaluator
{
    public string IndicatorName => "PCR";

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

        var threshold = condition.ThresholdValue ?? 1.0m;
        var pcr = context.PcrCurrent;
        var prevPcr = context.PcrPrevious;

        switch (condition.ConditionType)
        {
            case "PcrGreaterThan":
            {
                result.Description = $"PCR > {threshold:F2}";
                if (pcr > threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR ({pcr:F2}) > configured threshold ({threshold:F2})";
                }
                else
                {
                    result.Details = $"PCR ({pcr:F2}) <= configured threshold ({threshold:F2})";
                }
                break;
            }

            case "PcrLessThan":
            {
                result.Description = $"PCR < {threshold:F2}";
                if (pcr < threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR ({pcr:F2}) < configured threshold ({threshold:F2})";
                }
                else
                {
                    result.Details = $"PCR ({pcr:F2}) >= configured threshold ({threshold:F2})";
                }
                break;
            }

            case "PcrIncreasing":
            {
                result.Description = "PCR is increasing";
                if (pcr > prevPcr)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR rose from {prevPcr:F2} to {pcr:F2} (+{(pcr - prevPcr):F2})";
                }
                else
                {
                    result.Details = $"PCR did not increase ({pcr:F2} <= {prevPcr:F2})";
                }
                break;
            }

            case "PcrDecreasing":
            {
                result.Description = "PCR is decreasing";
                if (pcr < prevPcr)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR fell from {prevPcr:F2} to {pcr:F2} (-{(prevPcr - pcr):F2})";
                }
                else
                {
                    result.Details = $"PCR did not decrease ({pcr:F2} >= {prevPcr:F2})";
                }
                break;
            }

            case "PcrCrossAbove":
            {
                result.Description = $"PCR crosses above {threshold:F2}";
                if (pcr > threshold && prevPcr <= threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR crossed above {threshold:F2} (from {prevPcr:F2} to {pcr:F2})";
                }
                else if (pcr > threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR is above {threshold:F2} ({pcr:F2})";
                }
                else
                {
                    result.Details = $"PCR is below {threshold:F2} ({pcr:F2})";
                }
                break;
            }

            case "PcrCrossBelow":
            {
                result.Description = $"PCR crosses below {threshold:F2}";
                if (pcr < threshold && prevPcr >= threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR crossed below {threshold:F2} (from {prevPcr:F2} to {pcr:F2})";
                }
                else if (pcr < threshold)
                {
                    result.IsMet = true;
                    result.PointsAwarded = condition.Weight;
                    result.Details = $"PCR is below {threshold:F2} ({pcr:F2})";
                }
                else
                {
                    result.Details = $"PCR is above {threshold:F2} ({pcr:F2})";
                }
                break;
            }

            default:
                result.Description = $"Unknown PCR condition: {condition.ConditionType}";
                result.Details = "Unsupported condition type";
                break;
        }

        return result;
    }
}
