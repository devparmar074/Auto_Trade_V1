using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;

namespace AutoTrade.Application.Interfaces;

public interface ITradeRepository
{
    Task<long> CreateOrderAsync(TradeOrder order, CancellationToken ct = default);
    Task<bool> UpdateOrderStatusAsync(long orderId, string? upstoxOrderId, OrderStatus status, string? upstoxStatus, decimal? executionPrice, DateTime? executionTime, string? message, CancellationToken ct = default);
    Task<TradeOrder?> GetOrderByIdAsync(long orderId, CancellationToken ct = default);
    Task<TradeOrder?> GetOrderByCorrelationIdAsync(string correlationId, CancellationToken ct = default);
    Task<IEnumerable<TradeOrder>> GetRecentOrdersAsync(int count = 20, CancellationToken ct = default);
    Task<long> AddTradeFillAsync(TradeFill fill, CancellationToken ct = default);
    Task<IEnumerable<TradeFill>> GetTradesByOrderIdAsync(long orderId, CancellationToken ct = default);
    Task<long> SavePositionSnapshotAsync(PositionSnapshot snapshot, CancellationToken ct = default);
    Task<PositionSnapshot?> GetLatestPositionSnapshotAsync(string instrumentKey, CancellationToken ct = default);
}
