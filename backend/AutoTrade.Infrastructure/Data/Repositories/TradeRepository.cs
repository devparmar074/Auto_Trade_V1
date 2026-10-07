using System.Data;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;
using Dapper;

namespace AutoTrade.Infrastructure.Data.Repositories;

public class TradeRepository : ITradeRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public TradeRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<long> CreateOrderAsync(TradeOrder order, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@CorrelationId", order.CorrelationId);
        parameters.Add("@InstrumentKey", order.InstrumentKey);
        parameters.Add("@TradingSymbol", order.TradingSymbol);
        parameters.Add("@TransactionType", (int)order.TransactionType);
        parameters.Add("@OrderType", (int)order.OrderType);
        parameters.Add("@Product", order.Product);
        parameters.Add("@Quantity", order.Quantity);
        parameters.Add("@PlacedPrice", order.PlacedPrice);
        parameters.Add("@Status", (int)order.Status);

        return await db.ExecuteScalarAsync<long>(
            "dbo.sp_CreateTradeOrder", 
            parameters, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> UpdateOrderStatusAsync(
        long orderId, 
        string? upstoxOrderId, 
        OrderStatus status, 
        string? upstoxStatus, 
        decimal? executionPrice, 
        DateTime? executionTime, 
        string? message, 
        CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@OrderId", orderId);
        parameters.Add("@UpstoxOrderId", upstoxOrderId);
        parameters.Add("@Status", (int)status);
        parameters.Add("@UpstoxStatus", upstoxStatus);
        parameters.Add("@AverageExecutionPrice", executionPrice);
        parameters.Add("@ExecutionTimeUtc", executionTime);
        parameters.Add("@StatusMessage", message);

        var rows = await db.ExecuteScalarAsync<int>(
            "dbo.sp_UpdateTradeOrderStatus", 
            parameters, 
            commandType: CommandType.StoredProcedure);

        return rows > 0;
    }

    public async Task<TradeOrder?> GetOrderByIdAsync(long orderId, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<TradeOrder>(
            "dbo.sp_GetOrderById", 
            new { OrderId = orderId }, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<TradeOrder?> GetOrderByCorrelationIdAsync(string correlationId, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<TradeOrder>(
            "dbo.sp_GetOrderByCorrelationId", 
            new { CorrelationId = correlationId }, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<TradeOrder>> GetRecentOrdersAsync(int count = 20, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryAsync<TradeOrder>(
            "dbo.sp_GetRecentOrders", 
            new { Count = count }, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<long> AddTradeFillAsync(TradeFill fill, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@TradeOrderId", fill.TradeOrderId);
        parameters.Add("@UpstoxOrderId", fill.UpstoxOrderId);
        parameters.Add("@UpstoxTradeId", fill.UpstoxTradeId);
        parameters.Add("@Quantity", fill.Quantity);
        parameters.Add("@Price", fill.Price);
        parameters.Add("@TradedAtUtc", fill.TradedAtUtc);

        return await db.ExecuteScalarAsync<long>(
            "dbo.sp_AddTradeFill", 
            parameters, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<TradeFill>> GetTradesByOrderIdAsync(long orderId, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryAsync<TradeFill>(
            "dbo.sp_GetTradesByOrderId", 
            new { TradeOrderId = orderId }, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<long> SavePositionSnapshotAsync(PositionSnapshot snapshot, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@InstrumentKey", snapshot.InstrumentKey);
        parameters.Add("@TradingSymbol", snapshot.TradingSymbol);
        parameters.Add("@Quantity", snapshot.Quantity);
        parameters.Add("@AveragePrice", snapshot.AveragePrice);
        parameters.Add("@CurrentLtp", snapshot.CurrentLtp);
        parameters.Add("@UnrealizedPnL", snapshot.UnrealizedPnL);
        parameters.Add("@RealizedPnL", snapshot.RealizedPnL);
        parameters.Add("@TotalPnL", snapshot.TotalPnL);

        return await db.ExecuteScalarAsync<long>(
            "dbo.sp_SavePositionSnapshot", 
            parameters, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<PositionSnapshot?> GetLatestPositionSnapshotAsync(string instrumentKey, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<PositionSnapshot>(
            "dbo.sp_GetLatestPositionSnapshot", 
            new { InstrumentKey = instrumentKey }, 
            commandType: CommandType.StoredProcedure);
    }
}
