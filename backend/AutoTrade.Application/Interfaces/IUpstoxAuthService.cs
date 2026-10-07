using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IUpstoxAuthService
{
    Task<string> GetAuthorizationUrlAsync();
    Task<UpstoxAuthStatusDto> HandleCallbackAsync(string code, string state, CancellationToken ct = default);
    Task<UpstoxAuthStatusDto> GetStatusAsync(CancellationToken ct = default);
    Task DisconnectAsync(CancellationToken ct = default);
    Task<string> GetActiveAccessTokenAsync(CancellationToken ct = default);
    Task<UpstoxAuthStatusDto> SetAccessTokenAsync(string accessToken, CancellationToken ct = default);
    Task<string?> GetRegisteredIpAsync(CancellationToken ct = default);
    Task<string> SetRegisteredIpAsync(string primaryIp, string? secondaryIp = null, CancellationToken ct = default);
}
