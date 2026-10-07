using AutoTrade.Application.Interfaces;
using AutoTrade.Application.Exceptions;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class MarketDataService : IMarketDataService
{
    private readonly IUpstoxClient _upstoxClient;
    private readonly IInstrumentService _instrumentService;
    private readonly IUpstoxAuthService _authService;
    private readonly IPortfolioService _portfolioService;
    private readonly ITradeRepository _tradeRepository;
    private readonly ILogger<MarketDataService> _logger;

    public MarketDataService(
        IUpstoxClient upstoxClient,
        IInstrumentService instrumentService,
        IUpstoxAuthService authService,
        IPortfolioService portfolioService,
        ITradeRepository tradeRepository,
        ILogger<MarketDataService> logger)
    {
        _upstoxClient = upstoxClient;
        _instrumentService = instrumentService;
        _authService = authService;
        _portfolioService = portfolioService;
        _tradeRepository = tradeRepository;
        _logger = logger;
    }

    private static LtpQuoteDto? _lastKnownQuote;

    public async Task<LtpQuoteDto> GetVodafoneIdeaQuoteAsync(CancellationToken ct = default)
    {
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);
        string? token = null;
        try { token = await _authService.GetActiveAccessTokenAsync(ct); } catch { }

        try
        {
            var quote = await _upstoxClient.GetQuoteAsync(instrument.InstrumentKey, token, ct);
            if (quote != null)
            {
                _lastKnownQuote = quote;
                return quote;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed getting live quote for {InstrumentKey}", instrument.InstrumentKey);
        }

        // Fallback to latest intraday candle close so price stays updated even if token is unauthorized
        try
        {
            var candles = await _upstoxClient.GetIntradayCandlesAsync(instrument.InstrumentKey, "1minute", ct);
            var latest = candles.LastOrDefault();
            if (latest != null)
            {
                var fallbackQuote = new LtpQuoteDto
                {
                    TradingSymbol = instrument.TradingSymbol,
                    CompanyName = instrument.CompanyName,
                    InstrumentKey = instrument.InstrumentKey,
                    Ltp = latest.Close,
                    ClosePrice = latest.Close,
                    OpenPrice = latest.Open,
                    HighPrice = latest.High,
                    LowPrice = latest.Low,
                    Volume = latest.Volume,
                    Timestamp = latest.TimestampUtc
                };
                _lastKnownQuote = fallbackQuote;
                return fallbackQuote;
            }
        }
        catch { }

        return _lastKnownQuote ?? throw new TradingException("No quote data available.");
    }

    public bool IsIndianMarketHours()
    {
        TimeZoneInfo istZone;
        try
        {
            istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
        catch
        {
            istZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
        }

        var nowIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

        // Saturday and Sunday are market closed
        if (nowIst.DayOfWeek == DayOfWeek.Saturday || nowIst.DayOfWeek == DayOfWeek.Sunday)
        {
            return false;
        }

        // NSE normal equity trading hours: 09:15 AM to 03:30 PM IST
        var marketOpen = new TimeSpan(9, 15, 0);
        var marketClose = new TimeSpan(15, 30, 0);

        return nowIst.TimeOfDay >= marketOpen && nowIst.TimeOfDay <= marketClose;
    }

    public async Task<string> GetMarketStatusAsync(CancellationToken ct = default)
    {
        // Pre-check trading hours: if outside trading hours, immediately return CLOSED without hitting broker API
        if (!IsIndianMarketHours())
        {
            return "CLOSED";
        }

        string? token = null;
        try { token = await _authService.GetActiveAccessTokenAsync(ct); } catch { }

        try
        {
            var rawStatus = await _upstoxClient.GetMarketStatusAsync("NSE", token, ct);
            if (rawStatus.Contains("OPEN", StringComparison.OrdinalIgnoreCase))
            {
                return "OPEN";
            }
            if (rawStatus.Contains("CLOSE", StringComparison.OrdinalIgnoreCase))
            {
                return "CLOSED";
            }
            return "OPEN"; // During market hours default to OPEN
        }
        catch
        {
            return "OPEN";
        }
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default)
    {
        var authStatus = await _authService.GetStatusAsync(ct);
        var marketStatus = await GetMarketStatusAsync(ct);
        
        LtpQuoteDto? quote = null;
        try { quote = await GetVodafoneIdeaQuoteAsync(ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Could not fetch quote for dashboard summary."); }

        PositionDto? position = null;
        HoldingDto? holding = null;
        if (authStatus.IsConnected)
        {
            try { position = await _portfolioService.GetPositionAsync(ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not fetch position for dashboard summary."); }

            try { holding = await _portfolioService.GetHoldingAsync(ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not fetch holding for dashboard summary."); }
        }

        var recentOrders = await _tradeRepository.GetRecentOrdersAsync(1, ct);
        var lastOrder = recentOrders.FirstOrDefault();
        OrderResultDto? lastOrderDto = null;
        if (lastOrder != null)
        {
            lastOrderDto = new OrderResultDto
            {
                Success = lastOrder.Status == Domain.Enums.OrderStatus.Complete || lastOrder.Status == Domain.Enums.OrderStatus.Open,
                LocalOrderId = lastOrder.Id,
                CorrelationId = lastOrder.CorrelationId,
                UpstoxOrderId = lastOrder.UpstoxOrderId,
                Status = lastOrder.Status,
                TransactionType = lastOrder.TransactionType,
                Quantity = lastOrder.Quantity,
                ExecutionPrice = lastOrder.AverageExecutionPrice ?? lastOrder.PlacedPrice,
                ExecutionTimeUtc = lastOrder.ExecutionTimeUtc,
                Message = lastOrder.StatusMessage
            };
        }

        return new DashboardSummaryDto
        {
            BrokerConnected = authStatus.IsConnected,
            BrokerUserId = authStatus.UserId,
            BrokerUserName = authStatus.UserName,
            TokenExpiresAtUtc = authStatus.ExpiresAtUtc,
            MarketStatus = marketStatus,
            Quote = quote,
            Position = position,
            Holding = holding,
            LastOrder = lastOrderDto
        };
    }
}
