using System.Text.Json;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class CustomStrategyService : ICustomStrategyService
{
    private readonly ICustomStrategyRepository _repository;
    private readonly ICustomStrategyEngine _engine;
    private readonly IStrategyService _strategyService;
    private readonly IMarketDataService _marketDataService;
    private readonly ITradingNotificationService _notificationService;
    private readonly ILogger<CustomStrategyService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public CustomStrategyService(
        ICustomStrategyRepository repository,
        ICustomStrategyEngine engine,
        IStrategyService strategyService,
        IMarketDataService marketDataService,
        ITradingNotificationService notificationService,
        ILogger<CustomStrategyService> logger)
    {
        _repository = repository;
        _engine = engine;
        _strategyService = strategyService;
        _marketDataService = marketDataService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<IEnumerable<CustomStrategyDto>> GetAllStrategiesAsync(CancellationToken ct = default)
    {
        var entities = await _repository.GetAllAsync(ct);
        return entities.Select(MapToDto);
    }

    public async Task<CustomStrategyDto?> GetStrategyByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await _repository.GetByIdAsync(id, ct);
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<CustomStrategyDto> SaveStrategyAsync(CustomStrategyDto dto, CancellationToken ct = default)
    {
        var entity = new CustomStrategy
        {
            Id = dto.Id,
            Name = string.IsNullOrWhiteSpace(dto.StrategyName) ? "Custom Strategy" : dto.StrategyName.Trim(),
            Description = dto.Description,
            CombinationMode = dto.CombinationMode,
            BuyThreshold = dto.BuyThreshold,
            SellThreshold = dto.SellThreshold,
            ConfigJson = SerializeConfig(dto)
        };

        var saved = await _repository.SaveAsync(entity, ct);
        return MapToDto(saved);
    }

    public async Task<bool> DeleteStrategyAsync(int id, CancellationToken ct = default)
    {
        return await _repository.DeleteAsync(id, ct);
    }

    public async Task<CustomStrategyDto> DuplicateStrategyAsync(int id, CancellationToken ct = default)
    {
        var existing = await GetStrategyByIdAsync(id, ct);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Strategy with ID {id} not found.");
        }

        var copy = new CustomStrategyDto
        {
            Id = 0,
            StrategyName = $"{existing.StrategyName} (Copy)",
            Description = existing.Description,
            CombinationMode = existing.CombinationMode,
            BuyThreshold = existing.BuyThreshold,
            SellThreshold = existing.SellThreshold,
            BuyConditions = existing.BuyConditions.Select(c => new StrategyConditionDto
            {
                Id = Guid.NewGuid().ToString("N"),
                Indicator = c.Indicator,
                ConditionType = c.ConditionType,
                TargetSignal = c.TargetSignal,
                IsEnabled = c.IsEnabled,
                Weight = c.Weight,
                MaType = c.MaType,
                Period = c.Period,
                FastPeriod = c.FastPeriod,
                SlowPeriod = c.SlowPeriod,
                ThresholdValue = c.ThresholdValue,
                StdDevMultiplier = c.StdDevMultiplier
            }).ToList(),
            SellConditions = existing.SellConditions.Select(c => new StrategyConditionDto
            {
                Id = Guid.NewGuid().ToString("N"),
                Indicator = c.Indicator,
                ConditionType = c.ConditionType,
                TargetSignal = c.TargetSignal,
                IsEnabled = c.IsEnabled,
                Weight = c.Weight,
                MaType = c.MaType,
                Period = c.Period,
                FastPeriod = c.FastPeriod,
                SlowPeriod = c.SlowPeriod,
                ThresholdValue = c.ThresholdValue,
                StdDevMultiplier = c.StdDevMultiplier
            }).ToList()
        };

        return await SaveStrategyAsync(copy, ct);
    }

    public async Task<ActiveStrategyInfoDto> SetActiveStrategyAsync(string strategyType, int? customStrategyId = null, CancellationToken ct = default)
    {
        var result = await _repository.SetActiveStrategyAsync(strategyType, customStrategyId, ct);
        _logger.LogInformation("Active Strategy set to: {Type} (CustomId: {Id})", strategyType, customStrategyId);
        return result;
    }

    public async Task<ActiveStrategyInfoDto> GetActiveStrategyInfoAsync(CancellationToken ct = default)
    {
        return await _repository.GetActiveStrategyInfoAsync(ct);
    }

    public async Task<CustomStrategyEvaluationResultDto> EvaluateStrategyAsync(CustomStrategyDto dto, CancellationToken ct = default)
    {
        List<AutoTrade.Domain.Models.Candle> candlesList = new();
        try
        {
            candlesList = (await _strategyService.GetCandlesAsync("1minute", 300, ct)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed fetching candles from broker for custom strategy evaluation.");
        }

        decimal currentLtp = 0m;
        try
        {
            var quote = await _marketDataService.GetVodafoneIdeaQuoteAsync(ct);
            currentLtp = quote.Ltp;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed fetching live quote from broker for custom strategy evaluation.");
            if (candlesList.Count > 0)
            {
                currentLtp = candlesList.Last().Close;
            }
            else
            {
                currentLtp = 7.80m;
            }
        }

        if (candlesList.Count == 0)
        {
            var now = DateTime.UtcNow;
            for (int i = 100; i >= 0; i--)
            {
                decimal offset = (decimal)Math.Sin(i * 0.1) * 0.15m;
                decimal p = Math.Max(1.0m, currentLtp + offset);
                candlesList.Add(new AutoTrade.Domain.Models.Candle
                {
                    TimestampUtc = now.AddMinutes(-i),
                    Open = p - 0.05m,
                    High = p + 0.10m,
                    Low = p - 0.10m,
                    Close = p,
                    Volume = 500000,
                    OpenInterest = 12000000
                });
            }
        }

        return _engine.Evaluate(dto, candlesList, currentLtp);
    }

    public async Task<CustomStrategyEvaluationResultDto?> EvaluateActiveStrategyAsync(CancellationToken ct = default)
    {
        var activeInfo = await GetActiveStrategyInfoAsync(ct);
        if (activeInfo.ActiveStrategyType != "CUSTOM" || !activeInfo.ActiveCustomStrategyId.HasValue)
        {
            return null;
        }

        var strategy = await GetStrategyByIdAsync(activeInfo.ActiveCustomStrategyId.Value, ct);
        if (strategy == null) return null;

        var result = await EvaluateStrategyAsync(strategy, ct);
        await _notificationService.NotifyCustomStrategyScoreUpdatedAsync(result, ct);
        return result;
    }

    private static CustomStrategyDto MapToDto(CustomStrategy entity)
    {
        var dto = new CustomStrategyDto
        {
            Id = entity.Id,
            StrategyName = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            CombinationMode = entity.CombinationMode,
            BuyThreshold = entity.BuyThreshold,
            SellThreshold = entity.SellThreshold,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };

        if (!string.IsNullOrWhiteSpace(entity.ConfigJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(entity.ConfigJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("buyConditions", out var buyArr) && buyArr.ValueKind == JsonValueKind.Array)
                {
                    dto.BuyConditions = JsonSerializer.Deserialize<List<StrategyConditionDto>>(buyArr.GetRawText(), JsonOptions) ?? new();
                }

                if (root.TryGetProperty("sellConditions", out var sellArr) && sellArr.ValueKind == JsonValueKind.Array)
                {
                    dto.SellConditions = JsonSerializer.Deserialize<List<StrategyConditionDto>>(sellArr.GetRawText(), JsonOptions) ?? new();
                }
            }
            catch (Exception)
            {
                // Fallback to empty condition lists if parsing malformed
            }
        }

        return dto;
    }

    private static string SerializeConfig(CustomStrategyDto dto)
    {
        var payload = new
        {
            strategyName = dto.StrategyName,
            combinationMode = dto.CombinationMode,
            buyThreshold = dto.BuyThreshold,
            sellThreshold = dto.SellThreshold,
            buyConditions = dto.BuyConditions,
            sellConditions = dto.SellConditions
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }
}
