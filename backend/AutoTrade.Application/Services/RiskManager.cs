using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class RiskManager : IRiskManager
{
    private readonly ILogger<RiskManager> _logger;
    private decimal _peakPrice = 0m;

    public RiskManager(ILogger<RiskManager> logger)
    {
        _logger = logger;
    }

    public void UpdatePositionPeakPrice(decimal currentLtp)
    {
        if (currentLtp > _peakPrice)
        {
            _peakPrice = currentLtp;
        }
    }

    public void ResetPositionTracking()
    {
        _peakPrice = 0m;
    }

    public bool CheckDailyCircuitBreaker(decimal dailyRealizedPnl, BotConfig config)
    {
        if (dailyRealizedPnl <= -config.DailyMaxLossAmount)
        {
            _logger.LogWarning("CIRCUIT BREAKER TRIGGERED: Daily loss (₹{Loss:F2}) exceeded limit (₹{Limit:F2})",
                dailyRealizedPnl, config.DailyMaxLossAmount);
            return true;
        }
        return false;
    }

    public RiskEvaluationResult EvaluatePositionRisk(PositionDto? position, decimal currentLtp, BotConfig config)
    {
        if (position == null || position.Quantity <= 0 || position.AveragePrice <= 0)
        {
            ResetPositionTracking();
            return new RiskEvaluationResult(false, null, false, null, 0m, 0m);
        }

        var entryPrice = position.AveragePrice;
        if (_peakPrice == 0m || _peakPrice < entryPrice)
        {
            _peakPrice = Math.Max(entryPrice, currentLtp);
        }
        else if (currentLtp > _peakPrice)
        {
            _peakPrice = currentLtp;
        }

        var pnlAmount = (currentLtp - entryPrice) * position.Quantity;
        var pnlPercent = entryPrice > 0 ? ((currentLtp - entryPrice) / entryPrice) * 100m : 0m;

        // 1. Hard Stop-Loss Check
        if (config.StopLossPercent > 0)
        {
            var stopLossThreshold = -config.StopLossPercent;
            if (pnlPercent <= stopLossThreshold)
            {
                var stopPrice = entryPrice * (1m - (config.StopLossPercent / 100m));
                _logger.LogWarning("RISK ALERT: Stop-loss breached! PnL: {Pnl:F2}% (Limit: -{Limit:F2}%). Current: ₹{Ltp}, Stop: ₹{Stop:F2}",
                    pnlPercent, config.StopLossPercent, currentLtp, stopPrice);

                return new RiskEvaluationResult(
                    true, 
                    "STOP_LOSS", 
                    false, 
                    $"Stop-loss breached ({pnlPercent:F2}% <= -{config.StopLossPercent:F2}%). Exiting position at ₹{currentLtp:F2}",
                    pnlPercent, 
                    pnlAmount);
            }
        }

        // 2. Trailing Stop-Loss Check (Only active when in profit)
        if (config.TrailingStopPercent > 0 && _peakPrice > entryPrice)
        {
            var dropFromPeakPercent = ((_peakPrice - currentLtp) / _peakPrice) * 100m;
            if (dropFromPeakPercent >= config.TrailingStopPercent && currentLtp > entryPrice)
            {
                _logger.LogInformation("RISK ALERT: Trailing stop triggered! Price dropped {Drop:F2}% from peak ₹{Peak:F2} to ₹{Ltp:F2}",
                    dropFromPeakPercent, _peakPrice, currentLtp);

                return new RiskEvaluationResult(
                    true, 
                    "TRAILING_SL", 
                    false, 
                    $"Trailing stop locked in profit. Dropped {dropFromPeakPercent:F2}% from peak ₹{_peakPrice:F2} to ₹{currentLtp:F2}",
                    pnlPercent, 
                    pnlAmount);
            }
        }

        // 3. Take-Profit Target Check
        if (config.TakeProfitPercent > 0)
        {
            if (pnlPercent >= config.TakeProfitPercent)
            {
                _logger.LogInformation("TARGET REACHED: Take-profit triggered! PnL: +{Pnl:F2}% >= +{Target:F2}% at ₹{Ltp:F2}",
                    pnlPercent, config.TakeProfitPercent, currentLtp);

                return new RiskEvaluationResult(
                    true, 
                    "TAKE_PROFIT", 
                    false, 
                    $"Target profit reached (+{pnlPercent:F2}% >= +{config.TakeProfitPercent:F2}%). Taking profit at ₹{currentLtp:F2}",
                    pnlPercent, 
                    pnlAmount);
            }
        }

        return new RiskEvaluationResult(false, null, false, "Position within normal risk bounds.", pnlPercent, pnlAmount);
    }
}
