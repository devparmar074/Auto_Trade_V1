using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResultDto> ExecuteOrderAsync(PlaceOrderRequest request, CancellationToken ct = default);
    Task<TradeOrder?> GetOrderByIdAsync(long id, CancellationToken ct = default);
    Task<IEnumerable<TradeOrder>> GetRecentOrdersAsync(int limit = 10, CancellationToken ct = default);
    Task<IEnumerable<TradeFill>> GetOrderTradesAsync(long orderId, CancellationToken ct = default);
}
