using AutoTrade.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Infrastructure.BackgroundServices;

public class StrategyExecutionBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<StrategyExecutionBackgroundService> _logger;

    public StrategyExecutionBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<StrategyExecutionBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("StrategyExecutionBackgroundService starting...");

        // Initial brief delay before starting cycle
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var marketDataService = scope.ServiceProvider.GetRequiredService<IMarketDataService>();
                var strategyService = scope.ServiceProvider.GetRequiredService<IStrategyService>();
                var customStrategyService = scope.ServiceProvider.GetRequiredService<ICustomStrategyService>();

                // Check Indian equity market trading hours (09:15 - 15:30 IST Mon-Fri)
                if (!marketDataService.IsIndianMarketHours())
                {
                    _logger.LogInformation("NSE Market is CLOSED. Strategy execution and candle API polling are suspended.");
                    await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
                    continue;
                }

                var status = await marketDataService.GetMarketStatusAsync(stoppingToken);
                if (!status.Contains("OPEN", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Market status is {Status}. Strategy execution suspended.", status);
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                    continue;
                }

                await strategyService.RunStrategyCycleAsync(stoppingToken);
                await customStrategyService.EvaluateActiveStrategyAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error occurred during strategy execution cycle. Retrying in next interval.");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("StrategyExecutionBackgroundService stopped.");
    }
}
