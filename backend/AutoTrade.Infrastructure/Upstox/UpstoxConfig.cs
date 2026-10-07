namespace AutoTrade.Infrastructure.Upstox;

public class UpstoxConfig
{
    public const string SectionName = "Upstox";

    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = "https://localhost:5001/api/upstox/callback";
    public string BaseUrl { get; set; } = "https://api.upstox.com/v2";
    public string HftBaseUrl { get; set; } = "https://api-hft.upstox.com/v2";
    public string AuthDialogUrl { get; set; } = "https://api.upstox.com/v2/login/authorization/dialog";
    public string InstrumentMasterUrl { get; set; } = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";
    public string? AccessToken { get; set; }
    public string EncryptionKey { get; set; } = "AutoTradeLiveTradingKey_2026_SecureKey";
}
