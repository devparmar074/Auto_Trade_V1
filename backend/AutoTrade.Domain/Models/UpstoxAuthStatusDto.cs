namespace AutoTrade.Domain.Models;

public class UpstoxAuthStatusDto
{
    public bool IsConnected { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsExpired { get; set; }
    public string? Message { get; set; }
}
