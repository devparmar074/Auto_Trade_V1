using AutoTrade.Application.Exceptions;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class OrderService : IOrderService
{
    private readonly ITradeRepository _tradeRepo;
    private readonly IInstrumentService _instrumentService;
    private readonly IUpstoxClient _upstoxClient;
    private readonly IUpstoxAuthService _authService;
    private readonly ITradingNotificationService _notificationService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        ITradeRepository tradeRepo,
        IInstrumentService instrumentService,
        IUpstoxClient upstoxClient,
        IUpstoxAuthService authService,
        ITradingNotificationService notificationService,
        ILogger<OrderService> logger)
    {
        _tradeRepo = tradeRepo;
        _instrumentService = instrumentService;
        _upstoxClient = upstoxClient;
        _authService = authService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<OrderResultDto> ExecuteOrderAsync(PlaceOrderRequest request, CancellationToken ct = default)
    {
        if (request.Quantity <= 0)
        {
            throw new TradingException("Order quantity must be greater than 0.", "INVALID_QUANTITY");
        }

        var correlationId = string.IsNullOrWhiteSpace(request.CorrelationId) 
            ? Guid.NewGuid().ToString("N") 
            : request.CorrelationId.Trim();

        var existingOrder = await _tradeRepo.GetOrderByCorrelationIdAsync(correlationId, ct);
        if (existingOrder != null)
        {
            _logger.LogWarning("Duplicate order request detected for CorrelationId {CorrelationId}. Returning existing order status.", correlationId);
            return MapToDto(existingOrder);
        }

        var accessToken = await _authService.GetActiveAccessTokenAsync(ct);
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync(ct);
        if (instrument.TradingSymbol != "IDEA" || instrument.Segment != "NSE_EQ")
        {
            throw new TradingException("Safety validation failure: Auto Trade only supports Vodafone Idea (NSE: IDEA).", "UNAUTHORIZED_INSTRUMENT");
        }

        var localOrder = new TradeOrder
        {
            CorrelationId = correlationId,
            InstrumentKey = instrument.InstrumentKey,
            TradingSymbol = instrument.TradingSymbol,
            TransactionType = request.TransactionType,
            OrderType = request.OrderType,
            Product = string.IsNullOrWhiteSpace(request.Product) ? "D" : request.Product,
            Quantity = request.Quantity,
            FilledQuantity = 0,
            Status = OrderStatus.Pending,
            PlacedPrice = request.Price ?? 0m,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        var localOrderId = await _tradeRepo.CreateOrderAsync(localOrder, ct);
        localOrder.Id = localOrderId;

        _logger.LogInformation("Created local order #{OrderId} (Correlation: {CorrelationId}) for {Type} {Qty} shares of {Symbol}",
            localOrderId, correlationId, request.TransactionType, request.Quantity, instrument.TradingSymbol);

        UpstoxOrderPlacementResult upstoxResult;
        try
        {
            upstoxResult = await _upstoxClient.PlaceOrderAsync(accessToken, request, instrument, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while placing order to Upstox for local order #{OrderId}", localOrderId);
            await _tradeRepo.UpdateOrderStatusAsync(
                localOrderId, 
                null, 
                OrderStatus.Failed, 
                "NETWORK_OR_API_ERROR", 
                null, 
                null, 
                $"Failed sending order to Upstox: {ex.Message}", 
                ct);

            localOrder.Status = OrderStatus.Failed;
            localOrder.StatusMessage = ex.Message;
            var failedDto = MapToDto(localOrder);
            await _notificationService.NotifyOrderUpdatedAsync(failedDto, ct);
            return failedDto;
        }

        if (!upstoxResult.Success || string.IsNullOrWhiteSpace(upstoxResult.UpstoxOrderId))
        {
            _logger.LogWarning("Upstox rejected order #{OrderId}: {Message}", localOrderId, upstoxResult.Message);
            await _tradeRepo.UpdateOrderStatusAsync(
                localOrderId, 
                null, 
                OrderStatus.Rejected, 
                "REJECTED", 
                null, 
                null, 
                upstoxResult.Message ?? "Order rejected by broker", 
                ct);

            localOrder.Status = OrderStatus.Rejected;
            localOrder.StatusMessage = upstoxResult.Message;
            var rejectedDto = MapToDto(localOrder);
            await _notificationService.NotifyOrderUpdatedAsync(rejectedDto, ct);
            return rejectedDto;
        }

        var upstoxOrderId = upstoxResult.UpstoxOrderId;
        localOrder.UpstoxOrderId = upstoxOrderId;
        localOrder.Status = OrderStatus.Open;

        await _tradeRepo.UpdateOrderStatusAsync(
            localOrderId, 
            upstoxOrderId, 
            OrderStatus.Open, 
            "put order req received", 
            null, 
            null, 
            "Order accepted by Upstox", 
            ct);

        try
        {
            await Task.Delay(500, ct);
            var details = await _upstoxClient.GetOrderDetailsAsync(accessToken, upstoxOrderId, ct);
            var trades = await _upstoxClient.GetOrderTradesAsync(accessToken, upstoxOrderId, ct);

            decimal? avgExecutionPrice = details?.AveragePrice;
            var status = details?.Status != null ? MapUpstoxStatus(details.Status) : OrderStatus.Open;
            DateTime? executionTime = null;

            foreach (var trade in trades)
            {
                trade.TradeOrderId = localOrderId;
                await _tradeRepo.AddTradeFillAsync(trade, ct);
                executionTime = trade.TradedAtUtc;
            }

            if (trades.Any() && avgExecutionPrice == null)
            {
                avgExecutionPrice = trades.Average(t => t.Price);
            }

            if (status == OrderStatus.Complete && avgExecutionPrice.HasValue)
            {
                localOrder.AverageExecutionPrice = avgExecutionPrice;
                localOrder.ExecutionTimeUtc = executionTime ?? DateTime.UtcNow;
            }

            localOrder.Status = status;
            localOrder.UpstoxStatus = details?.Status ?? "OPEN";
            localOrder.StatusMessage = details?.StatusMessage ?? "Order placed successfully";

            await _tradeRepo.UpdateOrderStatusAsync(
                localOrderId,
                upstoxOrderId,
                localOrder.Status,
                localOrder.UpstoxStatus,
                localOrder.AverageExecutionPrice,
                localOrder.ExecutionTimeUtc,
                localOrder.StatusMessage,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not immediately retrieve trade details for order {UpstoxOrderId}", upstoxOrderId);
        }

        var resultDto = MapToDto(localOrder);
        await _notificationService.NotifyOrderUpdatedAsync(resultDto, ct);
        return resultDto;
    }

    public async Task<TradeOrder?> GetOrderByIdAsync(long id, CancellationToken ct = default)
    {
        return await _tradeRepo.GetOrderByIdAsync(id, ct);
    }

    public async Task<IEnumerable<TradeOrder>> GetRecentOrdersAsync(int limit = 10, CancellationToken ct = default)
    {
        return await _tradeRepo.GetRecentOrdersAsync(limit, ct);
    }

    public async Task<IEnumerable<TradeFill>> GetOrderTradesAsync(long orderId, CancellationToken ct = default)
    {
        return await _tradeRepo.GetTradesByOrderIdAsync(orderId, ct);
    }

    private static OrderResultDto MapToDto(TradeOrder order)
    {
        return new OrderResultDto
        {
            Success = order.Status == OrderStatus.Complete || order.Status == OrderStatus.Open || order.Status == OrderStatus.PartiallyFilled,
            LocalOrderId = order.Id,
            CorrelationId = order.CorrelationId,
            UpstoxOrderId = order.UpstoxOrderId,
            Status = order.Status,
            TransactionType = order.TransactionType,
            Quantity = order.Quantity,
            ExecutionPrice = order.AverageExecutionPrice ?? order.PlacedPrice,
            ExecutionTimeUtc = order.ExecutionTimeUtc,
            Message = order.StatusMessage
        };
    }

    private static OrderStatus MapUpstoxStatus(string upstoxStatus)
    {
        var s = upstoxStatus.ToLowerInvariant();
        if (s.Contains("complete")) return OrderStatus.Complete;
        if (s.Contains("open") || s.Contains("trigger pending")) return OrderStatus.Open;
        if (s.Contains("cancelled")) return OrderStatus.Cancelled;
        if (s.Contains("rejected")) return OrderStatus.Rejected;
        if (s.Contains("partially") || s.Contains("part_filled")) return OrderStatus.PartiallyFilled;
        return OrderStatus.Open;
    }
}
