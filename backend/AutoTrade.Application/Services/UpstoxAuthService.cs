using System.Collections.Concurrent;
using System.Security.Cryptography;
using AutoTrade.Application.Exceptions;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class UpstoxAuthService : IUpstoxAuthService
{
    private readonly IConnectionRepository _connectionRepo;
    private readonly IUpstoxClient _upstoxClient;
    private readonly ITradingNotificationService _notificationService;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private readonly ILogger<UpstoxAuthService> _logger;
    private static readonly ConcurrentDictionary<string, DateTime> ValidStates = new();

    public UpstoxAuthService(
        IConnectionRepository connectionRepo,
        IUpstoxClient upstoxClient,
        ITradingNotificationService notificationService,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        ILogger<UpstoxAuthService> logger)
    {
        _connectionRepo = connectionRepo;
        _upstoxClient = upstoxClient;
        _notificationService = notificationService;
        _configuration = configuration;
        _logger = logger;
    }

    public Task<string> GetAuthorizationUrlAsync()
    {
        var stateBytes = RandomNumberGenerator.GetBytes(16);
        var state = Convert.ToHexString(stateBytes).ToLowerInvariant();
        ValidStates[state] = DateTime.UtcNow.AddMinutes(15);

        foreach (var kvp in ValidStates)
        {
            if (kvp.Value < DateTime.UtcNow)
                ValidStates.TryRemove(kvp.Key, out _);
        }

        var url = _upstoxClient.GetAuthorizationUrl(state);
        return Task.FromResult(url);
    }

    public async Task<UpstoxAuthStatusDto> HandleCallbackAsync(string code, string state, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(state) || !ValidStates.TryRemove(state, out var expiry) || expiry < DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid or expired OAuth state parameter during callback.");
            throw new TradingException("Invalid or expired OAuth state parameter. Please try connecting again.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            throw new TradingException("Authorization code was empty or missing from callback.");
        }

        _logger.LogInformation("Exchanging OAuth code with Upstox...");
        var connection = await _upstoxClient.ExchangeCodeForTokenAsync(code, ct);

        try
        {
            var profile = await _upstoxClient.GetProfileAsync(connection.EncryptedAccessToken, ct);
            connection.UserId = profile.UserId;
            connection.UserName = profile.UserName;
            connection.Email = profile.Email;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch user profile details after token exchange.");
        }

        await _connectionRepo.SaveConnectionAsync(connection, ct);
        _logger.LogInformation("Upstox connection saved successfully. User: {UserId}", connection.UserId);

        var status = new UpstoxAuthStatusDto
        {
            IsConnected = true,
            UserId = connection.UserId,
            UserName = connection.UserName,
            Email = connection.Email,
            ExpiresAtUtc = connection.ExpiresAtUtc,
            IsExpired = connection.ExpiresAtUtc <= DateTime.UtcNow,
            Message = "Successfully connected to Upstox."
        };

        await _notificationService.NotifyBrokerConnectionUpdatedAsync(status, ct);
        return status;
    }

    public async Task<UpstoxAuthStatusDto> SetAccessTokenAsync(string accessToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new TradingException("Access token cannot be empty.", "INVALID_TOKEN");
        }

        accessToken = accessToken.Trim();

        var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        var nowIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
        var nextExpiryIst = nowIst.Date.AddDays(1).AddHours(3).AddMinutes(30);
        var expiresAtUtc = TimeZoneInfo.ConvertTimeToUtc(nextExpiryIst, istZone);

        string? userId = null;
        string? userName = null;
        string? email = null;

        try
        {
            var profile = await _upstoxClient.GetProfileAsync(accessToken, ct);
            userId = profile.UserId;
            userName = profile.UserName;
            email = profile.Email;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch user profile for access token. Proceeding with token.");
        }

        var connection = new UpstoxConnection
        {
            EncryptedAccessToken = accessToken,
            ExpiresAtUtc = expiresAtUtc,
            IsActive = true,
            UserId = userId,
            UserName = userName,
            Email = email,
            Broker = "UPSTOX",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        await _connectionRepo.SaveConnectionAsync(connection, ct);
        _logger.LogInformation("Saved manual Upstox token for user: {UserId}", userId ?? "Active");

        var status = new UpstoxAuthStatusDto
        {
            IsConnected = true,
            UserId = userId,
            UserName = userName,
            Email = email,
            ExpiresAtUtc = expiresAtUtc,
            IsExpired = false,
            Message = "Access token successfully activated."
        };

        await _notificationService.NotifyBrokerConnectionUpdatedAsync(status, ct);
        return status;
    }

    public async Task<UpstoxAuthStatusDto> GetStatusAsync(CancellationToken ct = default)
    {
        var connection = await _connectionRepo.GetActiveConnectionAsync(ct);
        if (connection == null || connection.ExpiresAtUtc <= DateTime.UtcNow)
        {
            var configToken = _configuration["Upstox:AccessToken"];
            if (!string.IsNullOrWhiteSpace(configToken))
            {
                try
                {
                    return await SetAccessTokenAsync(configToken, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed auto-activating token from appsettings.json.");
                }
            }

            if (connection == null)
            {
                return new UpstoxAuthStatusDto
                {
                    IsConnected = false,
                    Message = "No active Upstox connection found. Please enter your Access Token or connect via OAuth."
                };
            }
        }

        var isExpired = connection.ExpiresAtUtc <= DateTime.UtcNow;
        return new UpstoxAuthStatusDto
        {
            IsConnected = !isExpired,
            UserId = connection.UserId,
            UserName = connection.UserName,
            Email = connection.Email,
            ExpiresAtUtc = connection.ExpiresAtUtc,
            IsExpired = isExpired,
            Message = isExpired 
                ? "Upstox token expired. Please update your token or reconnect." 
                : "Upstox account is connected and ready for live trading."
        };
    }

    public async Task DisconnectAsync(CancellationToken ct = default)
    {
        var active = await _connectionRepo.GetActiveConnectionAsync(ct);
        if (active != null)
        {
            await _connectionRepo.DeactivateConnectionAsync(active.Id, ct);
            _logger.LogInformation("Disconnected Upstox account id: {Id}", active.Id);
        }

        var status = new UpstoxAuthStatusDto
        {
            IsConnected = false,
            Message = "Upstox account disconnected."
        };
        await _notificationService.NotifyBrokerConnectionUpdatedAsync(status, ct);
    }

    public async Task<string> GetActiveAccessTokenAsync(CancellationToken ct = default)
    {
        var connection = await _connectionRepo.GetActiveConnectionAsync(ct);
        if (connection == null || connection.ExpiresAtUtc <= DateTime.UtcNow)
        {
            var configToken = _configuration["Upstox:AccessToken"];
            if (!string.IsNullOrWhiteSpace(configToken))
            {
                await SetAccessTokenAsync(configToken, ct);
                return configToken;
            }

            throw new TradingException("No active or valid Upstox connection available. Please configure your Access Token.", "NOT_CONNECTED");
        }
        return connection.EncryptedAccessToken;
    }

    public async Task<string?> GetRegisteredIpAsync(CancellationToken ct = default)
    {
        var token = await GetActiveAccessTokenAsync(ct);
        return await _upstoxClient.GetRegisteredIpAsync(token, ct);
    }

    public async Task<string> SetRegisteredIpAsync(string primaryIp, string? secondaryIp = null, CancellationToken ct = default)
    {
        var token = await GetActiveAccessTokenAsync(ct);
        return await _upstoxClient.SetRegisteredIpAsync(token, primaryIp, secondaryIp, ct);
    }
}
