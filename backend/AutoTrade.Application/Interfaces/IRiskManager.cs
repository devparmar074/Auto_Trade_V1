using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public record RiskEvaluationResult(
    bool ShouldExitPosition,
    string? ExitReason,
    bool IsCircuitBreakerTripped,
    string? Message,
    decimal PnlPercent,
    decimal PnlAmount);

public interface IRiskManager
{
    RiskEvaluationResult EvaluatePositionRisk(PositionDto? position, decimal currentLtp, BotConfig config);
    bool CheckDailyCircuitBreaker(decimal dailyRealizedPnl, BotConfig config);
    void UpdatePositionPeakPrice(decimal currentLtp);
    void ResetPositionTracking();
}
