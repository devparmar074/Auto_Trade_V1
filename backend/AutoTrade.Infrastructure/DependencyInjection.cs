using AutoTrade.Application.Interfaces;
using AutoTrade.Application.Services;
using AutoTrade.Application.Services.ConditionEvaluators;
using AutoTrade.Infrastructure.BackgroundServices;
using AutoTrade.Infrastructure.Data;
using AutoTrade.Infrastructure.Data.Repositories;
using AutoTrade.Infrastructure.Services;
using AutoTrade.Infrastructure.Upstox;
using AutoTrade.Infrastructure.Upstox.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AutoTrade.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Options
        services.Configure<UpstoxConfig>(configuration.GetSection(UpstoxConfig.SectionName));

        // Security
        services.AddSingleton<ITokenEncryptor, AesTokenEncryptor>();

        // Database
        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
        services.AddScoped<IConnectionRepository, ConnectionRepository>();
        services.AddScoped<IInstrumentRepository, InstrumentRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();

        // Upstox Client
        services.AddHttpClient<IUpstoxClient, UpstoxClient>();

        // SignalR Notification Service
        services.AddSingleton<ITradingNotificationService, SignalRTradingNotificationService>();

        // Application Services
        services.AddScoped<IInstrumentService, InstrumentService>();
        services.AddScoped<IUpstoxAuthService, UpstoxAuthService>();
        services.AddScoped<IMarketDataService, MarketDataService>();
        services.AddScoped<IPortfolioService, PortfolioService>();
        services.AddScoped<IOrderService, OrderService>();

        // Strategy & Risk Management Services (Default)
        services.AddScoped<IStrategyRepository, StrategyRepository>();
        services.AddSingleton<IIndicatorCalculator, IndicatorCalculator>();
        services.AddSingleton<IStrategyEngine, StrategyEngine>();
        services.AddSingleton<IRiskManager, RiskManager>();
        services.AddScoped<IStrategyService, StrategyService>();

        // Custom Strategy Builder & Evaluator Layer
        services.AddScoped<ICustomStrategyRepository, CustomStrategyRepository>();
        services.AddSingleton<ICustomConditionEvaluator, MovingAverageConditionEvaluator>();
        services.AddSingleton<ICustomConditionEvaluator, PcrConditionEvaluator>();
        services.AddSingleton<ICustomConditionEvaluator, BollingerBandsConditionEvaluator>();
        services.AddSingleton<ICustomStrategyEngine, CustomStrategyEngine>();
        services.AddScoped<ICustomStrategyService, CustomStrategyService>();

        // SignalR
        services.AddSignalR();

        // Background services
        services.AddHostedService<MarketFeedBackgroundService>();
        services.AddHostedService<StrategyExecutionBackgroundService>();

        return services;
    }
}
