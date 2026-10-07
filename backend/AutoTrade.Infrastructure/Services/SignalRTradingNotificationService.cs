using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;
using AutoTrade.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Infrastructure.Services;

public class SignalRTradingNotificationService : ITradingNotificationService
{
    private readonly IHubContext<TradingHub> _hubContext;
    private readonly ILogger<SignalRTradingNotificationService> _logger;

    public SignalRTradingNotificationService(
        IHubContext<TradingHub> hubContext,
        ILogger<SignalRTradingNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyLtpUpdatedAsync(LtpQuoteDto quote, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("LtpUpdated", quote, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting LtpUpdated SignalR message."); }
    }

    public async Task NotifyOrderUpdatedAsync(OrderResultDto order, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("OrderUpdated", order, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting OrderUpdated SignalR message."); }
    }

    public async Task NotifyPositionUpdatedAsync(PositionDto position, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("PositionUpdated", position, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting PositionUpdated SignalR message."); }
    }

    public async Task NotifyMarketStatusUpdatedAsync(string status, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("MarketStatusUpdated", status, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting MarketStatusUpdated SignalR message."); }
    }

    public async Task NotifyBrokerConnectionUpdatedAsync(UpstoxAuthStatusDto status, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("BrokerConnectionUpdated", status, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting BrokerConnectionUpdated SignalR message."); }
    }

    public async Task NotifyStrategyScoreUpdatedAsync(StrategyScoreDto score, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("StrategyScoreUpdated", score, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting StrategyScoreUpdated SignalR message."); }
    }

    public async Task NotifyCustomStrategyScoreUpdatedAsync(CustomStrategyEvaluationResultDto result, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("CustomStrategyScoreUpdated", result, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting CustomStrategyScoreUpdated SignalR message."); }
    }

    public async Task NotifyBotConfigUpdatedAsync(AutoTrade.Domain.Entities.BotConfig config, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("BotConfigUpdated", config, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting BotConfigUpdated SignalR message."); }
    }

    public async Task NotifyRiskAlertAsync(RiskAlertDto alert, CancellationToken ct = default)
    {
        try { await _hubContext.Clients.All.SendAsync("RiskAlert", alert, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed broadcasting RiskAlert SignalR message."); }
    }
}

