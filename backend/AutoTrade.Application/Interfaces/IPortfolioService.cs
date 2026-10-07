using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IPortfolioService
{
    Task<PositionDto> GetPositionAsync(CancellationToken ct = default);
    Task<HoldingDto?> GetHoldingAsync(CancellationToken ct = default);
}
