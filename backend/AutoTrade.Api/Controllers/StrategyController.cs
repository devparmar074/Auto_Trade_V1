using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace AutoTrade.Api.Controllers;

[ApiController]
[Route("api/vi/strategy")]
public class StrategyController : ControllerBase
{
    private readonly IStrategyService _strategyService;
    private readonly ILogger<StrategyController> _logger;

    public StrategyController(
        IStrategyService strategyService,
        ILogger<StrategyController> logger)
    {
        _strategyService = strategyService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the latest multi-factor technical analysis and composite strategy score for Vodafone Idea.
    /// </summary>
    [HttpGet("score")]
    public async Task<ActionResult<StrategyScoreDto>> GetScore(CancellationToken ct)
    {
        var score = await _strategyService.GetCurrentScoreAsync(ct);
        return Ok(score);
    }

    /// <summary>
    /// Fetches historical and intraday candlestick data formatted for TradingView charts.
    /// </summary>
    [HttpGet("candles")]
    public async Task<ActionResult<IEnumerable<Candle>>> GetCandles(
        [FromQuery] string interval = "1minute",
        [FromQuery] int limit = 200,
        CancellationToken ct = default)
    {
        var candles = await _strategyService.GetCandlesAsync(interval, limit, ct);
        return Ok(candles);
    }

    /// <summary>
    /// Retrieves current bot configuration (BotMode, thresholds, Stop Loss, Trailing SL, Max Daily Loss).
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<BotConfig>> GetConfig(CancellationToken ct)
    {
        var config = await _strategyService.GetBotConfigAsync(ct);
        return Ok(config);
    }

    /// <summary>
    /// Updates bot configuration, risk parameters, and operational mode.
    /// </summary>
    [HttpPost("config")]
    public async Task<ActionResult<BotConfig>> UpdateConfig(
        [FromBody] BotConfig config,
        CancellationToken ct)
    {
        var updated = await _strategyService.UpdateBotConfigAsync(config, ct);
        return Ok(updated);
    }

    /// <summary>
    /// Immediate Emergency Kill Switch: disarms bot execution and optionally liquidates open positions at market.
    /// </summary>
    [HttpPost("kill-switch")]
    public async Task<ActionResult> TriggerKillSwitch(
        [FromQuery] bool closeOpenPositions = false,
        CancellationToken ct = default)
    {
        _logger.LogWarning("EMERGENCY KILL SWITCH TRIGGERED (closeOpenPositions: {Close})", closeOpenPositions);
        var success = await _strategyService.ActivateKillSwitchAsync(closeOpenPositions, ct);
        return Ok(new { success, message = "Emergency kill switch activated. All automated trading halted." });
    }

    /// <summary>
    /// Retrieves audit log of recent strategy signals and bot executions.
    /// </summary>
    [HttpGet("signals")]
    public async Task<ActionResult<IEnumerable<StrategySignalHistory>>> GetRecentSignals(
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var signals = await _strategyService.GetRecentSignalsAsync(limit, ct);
        return Ok(signals);
    }
}
