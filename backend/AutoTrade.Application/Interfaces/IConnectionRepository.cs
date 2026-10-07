using AutoTrade.Domain.Entities;

namespace AutoTrade.Application.Interfaces;

public interface IConnectionRepository
{
    Task SaveConnectionAsync(UpstoxConnection connection, CancellationToken ct = default);
    Task<UpstoxConnection?> GetActiveConnectionAsync(CancellationToken ct = default);
    Task DeactivateConnectionAsync(int id, CancellationToken ct = default);
}
