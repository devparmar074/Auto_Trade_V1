using AutoTrade.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Infrastructure.BackgroundServices;

public class MarketFeedBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MarketFeedBackgroundService> _logger;

    public MarketFeedBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MarketFeedBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MarketFeedBackgroundService starting (1-second live streaming)...");

        DateTime lastMarketStatusCheck = DateTime.MinValue;
        string currentMarketStatus = "CLOSED";

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var marketDataService = scope.ServiceProvider.GetRequiredService<IMarketDataService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<ITradingNotificationService>();

                // Pre-check trading hours: if outside trading hours (or weekend), do NOT hit broker APIs
                if (!marketDataService.IsIndianMarketHours())
                {
                    if (currentMarketStatus != "CLOSED")
                    {
                        currentMarketStatus = "CLOSED";
                        await notificationService.NotifyMarketStatusUpdatedAsync("CLOSED", stoppingToken);
                    }
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                    continue;
                }

                // Periodically verify exchange market status every 30 seconds
                if (DateTime.UtcNow - lastMarketStatusCheck > TimeSpan.FromSeconds(30))
                {
                    currentMarketStatus = await marketDataService.GetMarketStatusAsync(stoppingToken);
                    await notificationService.NotifyMarketStatusUpdatedAsync(currentMarketStatus, stoppingToken);
                    lastMarketStatusCheck = DateTime.UtcNow;
                }

                if (!currentMarketStatus.Contains("OPEN", StringComparison.OrdinalIgnoreCase))
                {
                    // Market is paused/closed (e.g. holiday or pre-market)
                    await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
                    continue;
                }

                // Fetch real-time live quote and broadcast via SignalR every second
                var quote = await marketDataService.GetVodafoneIdeaQuoteAsync(stoppingToken);
                if (quote != null)
                {
                    await notificationService.NotifyLtpUpdatedAsync(quote, stoppingToken);
                }

                // 1-second cadence like a real trading platform
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "MarketFeed tick update encountered an error. Retrying in 1 second.");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }
    }
}
