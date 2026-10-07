using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class StrategyService : IStrategyService
{
    private readonly IStrategyEngine _strategyEngine;
    private readonly IRiskManager _riskManager;
    private readonly IStrategyRepository _strategyRepo;
    private readonly IInstrumentService _instrumentService;
    private readonly IMarketDataService _marketDataService;
    private readonly IPortfolioService _portfolioService;
    private readonly IOrderService _orderService;
    private readonly IUpstoxClient _upstoxClient;
    private readonly IUpstoxAuthService _authService;
    private readonly ITradingNotificationService _notificationService;
    private readonly ILogger<StrategyService> _logger;

    private StrategyScoreDto? _cachedScore;
    private DateTime _lastEvaluatedUtc = DateTime.MinValue;

    public StrategyService(
        IStrategyEngine strategyEngine,
        IRiskManager riskManager,
        IStrategyRepository strategyRepo,
        IInstrumentService instrumentService,
        IMarketDataService marketDataService,
        IPortfolioService portfolioService,
        IOrderService orderService,
        IUpstoxClient upstoxClient,
        IUpstoxAuthService authService,
        ITradingNotificationService notificationService,
        ILogger<StrategyService> logger)
    {
        _strategyEngine = strategyEngine;
        _riskManager = riskManager;
        _strategyRepo = strategyRepo;
        _instrumentService = instrumentService;
        _marketDataService = marketDataService;
        _portfolioService = portfolioService;
        _orderService = orderService;
        _upstoxClient = upstoxClient;
        _authService = authService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<StrategyScoreDto> GetCurrentScoreAsync(CancellationToken ct = default)
    {
        if (_cachedScore != null && _lastEvaluatedUtc > DateTime.UtcNow.AddSeconds(-5))
        {
            return _cachedScore;
        }

        await RunStrategyCycleAsync(ct);
        return _cachedScore ?? new StrategyScoreDto();
    }

    public async Task<IEnumerable<Candle>> GetCandlesAsync(string interval = "1minute", int limit = 200, CancellationToken ct = default)
    {
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);
        var candles = await _upstoxClient.GetIntradayCandlesAsync(instrument.InstrumentKey, interval, ct);
        if (candles == null || candles.Count == 0)
        {
            // Fallback to recent historical days
            var toDate = DateTime.UtcNow.Date;
            var fromDate = toDate.AddDays(-7);
            candles = await _upstoxClient.GetHistoricalCandlesAsync(instrument.InstrumentKey, interval, toDate, fromDate, ct);
        }

        return candles.TakeLast(limit);
    }

    public async Task<BotConfig> GetBotConfigAsync(CancellationToken ct = default)
    {
        return await _strategyRepo.GetConfigAsync(ct);
    }

    public async Task<BotConfig> UpdateBotConfigAsync(BotConfig config, CancellationToken ct = default)
    {
        var saved = await _strategyRepo.SaveConfigAsync(config, ct);
        await _notificationService.NotifyBotConfigUpdatedAsync(saved, ct);
        return saved;
    }

    public async Task<bool> ActivateKillSwitchAsync(bool closeOpenPositions = false, CancellationToken ct = default)
    {
        _logger.LogCritical("EMERGENCY KILL SWITCH TRIGGERED! Disarming all automated bot trading.");

        var config = await _strategyRepo.GetConfigAsync(ct);
        config.IsKillSwitchActive = true;
        config.BotMode = BotMode.Manual;
        await _strategyRepo.SaveConfigAsync(config, ct);

        await _notificationService.NotifyBotConfigUpdatedAsync(config, ct);
        await _notificationService.NotifyRiskAlertAsync(new RiskAlertDto
        {
            AlertType = "KILL_SWITCH",
            Message = "EMERGENCY KILL SWITCH ACTIVATED! Bot has been switched to Manual and disarmed.",
            TimestampUtc = DateTime.UtcNow
        }, ct);

        if (closeOpenPositions)
        {
            try
            {
                var pos = await _portfolioService.GetPositionAsync(ct);
                if (pos.Quantity > 0)
                {
                    _logger.LogWarning("Kill switch closing open position: {Qty} shares of IDEA", pos.Quantity);
                    await _orderService.ExecuteOrderAsync(new PlaceOrderRequest
                    {
                        TransactionType = TransactionType.SELL,
                        OrderType = OrderType.MARKET,
                        Quantity = pos.Quantity,
                        Product = "D",
                        CorrelationId = $"KILL_{DateTime.UtcNow.Ticks}"
                    }, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to close open positions during kill switch.");
            }
        }

        return true;
    }

    public async Task<IEnumerable<StrategySignalHistory>> GetRecentSignalsAsync(int limit = 20, CancellationToken ct = default)
    {
        return await _strategyRepo.GetRecentSignalsAsync("IDEA", limit, ct);
    }

    public async Task RunStrategyCycleAsync(CancellationToken ct = default)
    {
        try
        {
            var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);
            var quote = await _marketDataService.GetVodafoneIdeaQuoteAsync(ct);
            var currentLtp = quote.Ltp;

            var config = await _strategyRepo.GetConfigAsync(ct);
            var candles = await _upstoxClient.GetIntradayCandlesAsync(instrument.InstrumentKey, "1minute", ct);

            if (candles == null || candles.Count == 0)
            {
                var toDate = DateTime.UtcNow.Date;
                var fromDate = toDate.AddDays(-7);
                candles = await _upstoxClient.GetHistoricalCandlesAsync(instrument.InstrumentKey, "1minute", toDate, fromDate, ct);
            }

            var score = _strategyEngine.Evaluate(candles, currentLtp, config);
            _cachedScore = score;
            _lastEvaluatedUtc = DateTime.UtcNow;

            await _notificationService.NotifyStrategyScoreUpdatedAsync(score, ct);

            // Log signal
            var signal = new StrategySignalHistory
            {
                InstrumentKey = instrument.InstrumentKey,
                TradingSymbol = instrument.TradingSymbol,
                Score = score.Score,
                Recommendation = score.RecommendationText,
                Rsi = score.Indicators.Rsi,
                Ema9 = score.Indicators.Ema9,
                Ema21 = score.Indicators.Ema21,
                Ema50 = score.Indicators.Ema50,
                Vwap = score.Indicators.Vwap,
                Supertrend = score.Indicators.Supertrend,
                SupertrendDirection = score.Indicators.SupertrendDirection,
                SignalFactors = string.Join("; ", score.SignalFactors),
                RecommendedQuantity = score.RecommendedQuantity,
                ActionTaken = "NONE"
            };

            // Evaluate positions & risk
            PositionDto? position = null;
            try
            {
                position = await _portfolioService.GetPositionAsync(ct);
            }
            catch { }

            var riskEval = _riskManager.EvaluatePositionRisk(position, currentLtp, config);

            // Check if Kill Switch is active
            if (config.IsKillSwitchActive)
            {
                signal.ActionTaken = "SKIPPED_KILL_SWITCH";
                await _strategyRepo.InsertSignalAsync(signal, ct);
                return;
            }

            // Mode 1: Fully Automated Execution
            if (config.BotMode == BotMode.FullyAutomated)
            {
                // First: Check position exit conditions (SL, TP, Trailing SL)
                if (position != null && position.Quantity > 0 && riskEval.ShouldExitPosition)
                {
                    _logger.LogWarning("BOT AUTO-EXIT TRIGGERED ({Reason}): Exiting {Qty} shares", 
                        riskEval.ExitReason, position.Quantity);

                    await _orderService.ExecuteOrderAsync(new PlaceOrderRequest
                    {
                        TransactionType = TransactionType.SELL,
                        OrderType = OrderType.MARKET,
                        Quantity = position.Quantity,
                        Product = "D",
                        CorrelationId = $"BOT_EXIT_{riskEval.ExitReason}_{DateTime.UtcNow.Ticks}"
                    }, ct);

                    signal.ActionTaken = $"AUTO_EXIT_{riskEval.ExitReason}";
                    await _notificationService.NotifyRiskAlertAsync(new RiskAlertDto
                    {
                        AlertType = riskEval.ExitReason ?? "RISK_EXIT",
                        Message = riskEval.Message ?? "Position closed by automated risk management.",
                        CurrentPrice = currentLtp,
                        PnlAmount = riskEval.PnlAmount,
                        TimestampUtc = DateTime.UtcNow
                    }, ct);
                }
                // Second: Check BUY entry conditions if flat
                else if ((position == null || position.Quantity == 0) && score.Score >= config.BuyScoreThreshold)
                {
                    var isCircuitTripped = _riskManager.CheckDailyCircuitBreaker(position?.RealizedPnL ?? 0m, config);
                    if (!isCircuitTripped)
                    {
                        var buyQty = score.RecommendedQuantity;
                        _logger.LogInformation("BOT AUTO-BUY TRIGGERED: Score {Score} >= {Thresh}. Buying {Qty} shares",
                            score.Score, config.BuyScoreThreshold, buyQty);

                        await _orderService.ExecuteOrderAsync(new PlaceOrderRequest
                        {
                            TransactionType = TransactionType.BUY,
                            OrderType = OrderType.MARKET,
                            Quantity = buyQty,
                            Product = "D",
                            CorrelationId = $"BOT_BUY_{DateTime.UtcNow.Ticks}"
                        }, ct);

                        signal.ActionTaken = "AUTO_BUY";
                    }
                    else
                    {
                        signal.ActionTaken = "SKIPPED_CIRCUIT_BREAKER";
                    }
                }
                // Third: Check SELL exit conditions if holding position and score turned strongly bearish
                else if (position != null && position.Quantity > 0 && score.Score <= config.SellScoreThreshold)
                {
                    _logger.LogInformation("BOT AUTO-SELL TRIGGERED: Bearish Score {Score} <= {Thresh}. Selling {Qty} shares",
                        score.Score, config.SellScoreThreshold, position.Quantity);

                    await _orderService.ExecuteOrderAsync(new PlaceOrderRequest
                    {
                        TransactionType = TransactionType.SELL,
                        OrderType = OrderType.MARKET,
                        Quantity = position.Quantity,
                        Product = "D",
                        CorrelationId = $"BOT_BEAR_SELL_{DateTime.UtcNow.Ticks}"
                    }, ct);

                    signal.ActionTaken = "AUTO_SELL_BEARISH";
                }
            }
            // Mode 2: Semi-Auto Alerts
            else if (config.BotMode == BotMode.SemiAuto)
            {
                if (score.Score >= config.BuyScoreThreshold)
                {
                    signal.ActionTaken = "ALERT_BUY";
                    await _notificationService.NotifyRiskAlertAsync(new RiskAlertDto
                    {
                        AlertType = "BUY_SIGNAL",
                        Message = $"Strong Buy Opportunity! AI Score: {score.Score} (Recommended Qty: {score.RecommendedQuantity})",
                        CurrentPrice = currentLtp,
                        TimestampUtc = DateTime.UtcNow
                    }, ct);
                }
                else if (score.Score <= config.SellScoreThreshold && position != null && position.Quantity > 0)
                {
                    signal.ActionTaken = "ALERT_SELL";
                    await _notificationService.NotifyRiskAlertAsync(new RiskAlertDto
                    {
                        AlertType = "SELL_SIGNAL",
                        Message = $"Bearish Reversal Alert! AI Score: {score.Score}. Consider exiting {position.Quantity} shares.",
                        CurrentPrice = currentLtp,
                        TimestampUtc = DateTime.UtcNow
                    }, ct);
                }
            }

            await _strategyRepo.InsertSignalAsync(signal, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error occurred during strategy evaluation cycle.");
        }
    }
}
