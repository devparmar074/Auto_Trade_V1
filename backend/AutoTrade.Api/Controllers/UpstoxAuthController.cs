using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace AutoTrade.Api.Controllers;

[ApiController]
[Route("api/upstox")]
public class UpstoxAuthController : ControllerBase
{
    private readonly IUpstoxAuthService _authService;
    private readonly ILogger<UpstoxAuthController> _logger;

    public UpstoxAuthController(IUpstoxAuthService authService, ILogger<UpstoxAuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpGet("connect")]
    public async Task<IActionResult> Connect([FromQuery] bool redirect = true)
    {
        var authUrl = await _authService.GetAuthorizationUrlAsync();
        if (redirect)
        {
            return Redirect(authUrl);
        }
        return Ok(new { authorizationUrl = authUrl });
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
    {
        _logger.LogInformation("Received Upstox OAuth callback.");
        var status = await _authService.HandleCallbackAsync(code, state);

        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Auto Trade - Upstox Connected</title>
    <meta http-equiv='refresh' content='2;url=http://localhost:5173/' />
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
        .card {{ background: #1e293b; padding: 2.5rem; border-radius: 12px; border: 1px solid #334155; text-align: center; max-width: 450px; }}
        .badge {{ background: #10b981; color: #fff; padding: 0.35rem 0.75rem; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; }}
        h2 {{ margin: 1.25rem 0 0.5rem; }}
        p {{ color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; }}
        a {{ color: #38bdf8; text-decoration: none; font-weight: 500; }}
    </style>
</head>
<body>
    <div class='card'>
        <span class='badge'>Connected</span>
        <h2>Upstox Account Connected!</h2>
        <p>User: <strong>{status.UserName ?? status.UserId ?? "Active"}</strong></p>
        <p>Redirecting back to Auto Trade dashboard...</p>
        <p><a href='http://localhost:5173/'>Click here if not redirected automatically</a></p>
    </div>
</body>
</html>";

        return Content(html, "text/html");
    }

    [HttpGet("status")]
    public async Task<ActionResult<UpstoxAuthStatusDto>> GetStatus()
    {
        var status = await _authService.GetStatusAsync();
        return Ok(status);
    }

    public record SetTokenRequest(string AccessToken);

    [HttpPost("token")]
    public async Task<ActionResult<UpstoxAuthStatusDto>> SetToken([FromBody] SetTokenRequest req)
    {
        var status = await _authService.SetAccessTokenAsync(req.AccessToken);
        return Ok(status);
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        await _authService.DisconnectAsync();
        return Ok(new { success = true, message = "Successfully disconnected from Upstox." });
    }

    [HttpGet("ip")]
    public async Task<IActionResult> GetRegisteredIp()
    {
        var ipInfo = await _authService.GetRegisteredIpAsync();
        return Content(ipInfo ?? "{}", "application/json");
    }

    public record SetIpRequest(string PrimaryIp, string? SecondaryIp = null);

    [HttpPut("ip")]
    public async Task<IActionResult> SetRegisteredIp([FromBody] SetIpRequest req)
    {
        var result = await _authService.SetRegisteredIpAsync(req.PrimaryIp, req.SecondaryIp);
        return Content(result, "application/json");
    }
}
