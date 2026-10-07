using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace AutoTrade.Api.Controllers;

[ApiController]
[Route("api/vi/custom-strategies")]
public class CustomStrategyController : ControllerBase
{
    private readonly ICustomStrategyService _strategyService;
    private readonly ILogger<CustomStrategyController> _logger;

    public CustomStrategyController(
        ICustomStrategyService strategyService,
        ILogger<CustomStrategyController> logger)
    {
        _strategyService = strategyService;
        _logger = logger;
    }

    /// <summary>
    /// Returns all saved custom strategy presets.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomStrategyDto>>> GetAll(CancellationToken ct)
    {
        var list = await _strategyService.GetAllStrategiesAsync(ct);
        return Ok(list);
    }

    /// <summary>
    /// Retrieves a specific custom strategy by ID with its conditions.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomStrategyDto>> GetById(int id, CancellationToken ct)
    {
        var strategy = await _strategyService.GetStrategyByIdAsync(id, ct);
        if (strategy == null)
        {
            return NotFound(new { message = $"Custom Strategy #{id} not found." });
        }
        return Ok(strategy);
    }

    /// <summary>
    /// Creates or updates a custom strategy preset.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CustomStrategyDto>> Save([FromBody] CustomStrategyDto dto, CancellationToken ct)
    {
        var saved = await _strategyService.SaveStrategyAsync(dto, ct);
        return Ok(saved);
    }

    /// <summary>
    /// Deletes a custom strategy preset.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await _strategyService.DeleteStrategyAsync(id, ct);
        if (!deleted)
        {
            return NotFound(new { message = $"Custom Strategy #{id} not found." });
        }
        return Ok(new { success = true, message = $"Strategy #{id} deleted successfully." });
    }

    /// <summary>
    /// Duplicates an existing preset as a new copy.
    /// </summary>
    [HttpPost("{id:int}/duplicate")]
    public async Task<ActionResult<CustomStrategyDto>> Duplicate(int id, CancellationToken ct)
    {
        var copy = await _strategyService.DuplicateStrategyAsync(id, ct);
        return Ok(copy);
    }

    /// <summary>
    /// Sets a custom strategy as the currently active strategy.
    /// </summary>
    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult<ActiveStrategyInfoDto>> Activate(int id, CancellationToken ct)
    {
        var activeInfo = await _strategyService.SetActiveStrategyAsync("CUSTOM", id, ct);
        return Ok(activeInfo);
    }

    /// <summary>
    /// Deactivates custom strategy mode and switches back to the Default Strategy.
    /// </summary>
    [HttpPost("deactivate")]
    public async Task<ActionResult<ActiveStrategyInfoDto>> Deactivate(CancellationToken ct)
    {
        var activeInfo = await _strategyService.SetActiveStrategyAsync("DEFAULT", null, ct);
        return Ok(activeInfo);
    }

    /// <summary>
    /// Returns which strategy is currently active (DEFAULT or CUSTOM).
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<ActiveStrategyInfoDto>> GetActiveStrategyInfo(CancellationToken ct)
    {
        var activeInfo = await _strategyService.GetActiveStrategyInfoAsync(ct);
        return Ok(activeInfo);
    }

    /// <summary>
    /// Evaluates the currently active strategy if it is set to CUSTOM.
    /// </summary>
    [HttpGet("active/evaluate")]
    public async Task<ActionResult<CustomStrategyEvaluationResultDto?>> EvaluateActive(CancellationToken ct)
    {
        var result = await _strategyService.EvaluateActiveStrategyAsync(ct);
        return Ok(result);
    }

    /// <summary>
    /// Live simulation / preview evaluation of any strategy configuration on real-time market candles.
    /// </summary>
    [HttpPost("evaluate")]
    public async Task<ActionResult<CustomStrategyEvaluationResultDto>> Evaluate(
        [FromBody] CustomStrategyDto dto, 
        CancellationToken ct)
    {
        var result = await _strategyService.EvaluateStrategyAsync(dto, ct);
        return Ok(result);
    }
}
