using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface ITradingNotificationService
{
    Task NotifyLtpUpdatedAsync(LtpQuoteDto quote, CancellationToken ct = default);
    Task NotifyOrderUpdatedAsync(OrderResultDto order, CancellationToken ct = default);
    Task NotifyPositionUpdatedAsync(PositionDto position, CancellationToken ct = default);
    Task NotifyMarketStatusUpdatedAsync(string status, CancellationToken ct = default);
    Task NotifyBrokerConnectionUpdatedAsync(UpstoxAuthStatusDto status, CancellationToken ct = default);
    Task NotifyStrategyScoreUpdatedAsync(StrategyScoreDto score, CancellationToken ct = default);
    Task NotifyCustomStrategyScoreUpdatedAsync(CustomStrategyEvaluationResultDto result, CancellationToken ct = default);
    Task NotifyBotConfigUpdatedAsync(AutoTrade.Domain.Entities.BotConfig config, CancellationToken ct = default);
    Task NotifyRiskAlertAsync(RiskAlertDto alert, CancellationToken ct = default);
}

