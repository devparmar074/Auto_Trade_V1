using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AutoTrade.Application.Exceptions;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AutoTrade.Infrastructure.Upstox;

public class UpstoxClient : IUpstoxClient
{
    private readonly HttpClient _httpClient;
    private readonly UpstoxConfig _config;
    private readonly ILogger<UpstoxClient> _logger;

    public UpstoxClient(
        HttpClient httpClient,
        IOptions<UpstoxConfig> config,
        ILogger<UpstoxClient> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _logger = logger;
    }

    public string GetAuthorizationUrl(string state)
    {
        var redirect = Uri.EscapeDataString(_config.RedirectUri);
        return $"{_config.AuthDialogUrl}?response_type=code&client_id={_config.ApiKey}&redirect_uri={redirect}&state={state}";
    }

    public async Task<UpstoxConnection> ExchangeCodeForTokenAsync(string code, CancellationToken ct = default)
    {
        var requestUrl = $"{_config.BaseUrl}/login/authorization/token";

        var body = new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _config.ApiKey,
            ["client_secret"] = _config.ApiSecret,
            ["redirect_uri"] = _config.RedirectUri,
            ["grant_type"] = "authorization_code"
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
        {
            Content = new FormUrlEncodedContent(body)
        };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Upstox token exchange failed: {Status} {Response}", response.StatusCode, content);
            throw new TradingException($"Upstox token exchange failed: {response.StatusCode} - {content}");
        }

        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        var accessToken = root.GetProperty("access_token").GetString() 
            ?? throw new TradingException("Access token missing in Upstox token response.");

        string? refreshToken = null;
        if (root.TryGetProperty("refresh_token", out var refreshProp))
        {
            refreshToken = refreshProp.GetString();
        }

        string? userId = null;
        if (root.TryGetProperty("user_id", out var userProp))
        {
            userId = userProp.GetString();
        }

        string? userName = null;
        if (root.TryGetProperty("user_name", out var userNameProp))
        {
            userName = userNameProp.GetString();
        }

        string? email = null;
        if (root.TryGetProperty("email", out var emailProp))
        {
            email = emailProp.GetString();
        }

        var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        var nowIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
        var nextExpiryIst = nowIst.Date.AddDays(1).AddHours(3).AddMinutes(30);
        var expiresAtUtc = TimeZoneInfo.ConvertTimeToUtc(nextExpiryIst, istZone);

        return new UpstoxConnection
        {
            EncryptedAccessToken = accessToken,
            EncryptedRefreshToken = refreshToken,
            ExpiresAtUtc = expiresAtUtc,
            IsActive = true,
            UserId = userId,
            UserName = userName,
            Email = email,
            Broker = "UPSTOX",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
    }

    public async Task<UpstoxAuthStatusDto> GetProfileAsync(string accessToken, CancellationToken ct = default)
    {
        var requestUrl = $"{_config.BaseUrl}/user/profile";
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            throw new TradingException($"Failed to retrieve Upstox user profile: {response.StatusCode} - {err}");
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");

        return new UpstoxAuthStatusDto
        {
            IsConnected = true,
            UserId = data.TryGetProperty("user_id", out var u) ? u.GetString() : null,
            UserName = data.TryGetProperty("user_name", out var n) ? n.GetString() : null,
            Email = data.TryGetProperty("email", out var e) ? e.GetString() : null,
            Message = "Profile active"
        };
    }

    public async Task<LtpQuoteDto> GetQuoteAsync(string instrumentKey, string? accessToken = null, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/market-quote/quotes?instrument_key={Uri.EscapeDataString(instrumentKey)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(accessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            return await GetLtpOnlyAsync(instrumentKey, accessToken, ct);
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");

        foreach (var property in data.EnumerateObject())
        {
            var quoteElem = property.Value;
            var lastPrice = quoteElem.TryGetProperty("last_price", out var lp) ? lp.GetDecimal() : 0m;
            var closePrice = quoteElem.TryGetProperty("close_price", out var cp) ? cp.GetDecimal() : lastPrice;
            var ohlc = quoteElem.TryGetProperty("ohlc", out var ohlcElem) ? ohlcElem : default;
            var openPrice = ohlc.ValueKind != JsonValueKind.Undefined && ohlc.TryGetProperty("open", out var op) ? op.GetDecimal() : 0m;
            var highPrice = ohlc.ValueKind != JsonValueKind.Undefined && ohlc.TryGetProperty("high", out var hp) ? hp.GetDecimal() : 0m;
            var lowPrice = ohlc.ValueKind != JsonValueKind.Undefined && ohlc.TryGetProperty("low", out var lop) ? lop.GetDecimal() : 0m;
            var close = ohlc.ValueKind != JsonValueKind.Undefined && ohlc.TryGetProperty("close", out var clp) ? clp.GetDecimal() : closePrice;
            var volume = quoteElem.TryGetProperty("volume", out var vol) ? vol.GetInt64() : 0;

            var change = close > 0 ? lastPrice - close : 0m;
            var changePercent = close > 0 ? (change / close) * 100m : 0m;

            return new LtpQuoteDto
            {
                TradingSymbol = "IDEA",
                CompanyName = "Vodafone Idea Limited",
                InstrumentKey = instrumentKey,
                Ltp = lastPrice,
                ClosePrice = close,
                Change = change,
                ChangePercent = changePercent,
                OpenPrice = openPrice,
                HighPrice = highPrice,
                LowPrice = lowPrice,
                Volume = volume,
                Timestamp = DateTime.UtcNow
            };
        }

        return await GetLtpOnlyAsync(instrumentKey, accessToken, ct);
    }

    private async Task<LtpQuoteDto> GetLtpOnlyAsync(string instrumentKey, string? accessToken, CancellationToken ct)
    {
        var url = $"{_config.BaseUrl}/market-quote/ltp?instrument_key={Uri.EscapeDataString(instrumentKey)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(accessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            throw new TradingException($"Failed fetching LTP from Upstox: {response.StatusCode} - {err}");
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");

        foreach (var property in data.EnumerateObject())
        {
            var ltpElem = property.Value;
            var lastPrice = ltpElem.GetProperty("last_price").GetDecimal();
            var cp = ltpElem.TryGetProperty("cp", out var cpProp) ? cpProp.GetDecimal() : lastPrice;
            var change = cp > 0 ? lastPrice - cp : 0m;
            var changePercent = cp > 0 ? (change / cp) * 100m : 0m;

            return new LtpQuoteDto
            {
                TradingSymbol = "IDEA",
                CompanyName = "Vodafone Idea Limited",
                InstrumentKey = instrumentKey,
                Ltp = lastPrice,
                ClosePrice = cp,
                Change = change,
                ChangePercent = changePercent,
                Timestamp = DateTime.UtcNow
            };
        }

        throw new TradingException($"No quote data returned for instrument {instrumentKey}");
    }

    public async Task<string> GetMarketStatusAsync(string exchange = "NSE", string? accessToken = null, CancellationToken ct = default)
    {
        try
        {
            var url = $"{_config.BaseUrl}/market/status/{exchange}";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrEmpty(accessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            }
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await _httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                return "UNKNOWN";
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("data", out var data))
            {
                if (data.TryGetProperty("status", out var s))
                {
                    var status = s.GetString() ?? "CLOSED";
                    if (status.Contains("OPEN", StringComparison.OrdinalIgnoreCase)) return "OPEN";
                    if (status.Contains("CLOSE", StringComparison.OrdinalIgnoreCase)) return "CLOSED";
                    return status;
                }
            }
            return "UNKNOWN";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed checking Upstox market status for {Exchange}", exchange);
            return "UNKNOWN";
        }
    }

    public async Task<UpstoxOrderPlacementResult> PlaceOrderAsync(
        string accessToken, 
        PlaceOrderRequest request, 
        Instrument instrument, 
        CancellationToken ct = default)
    {
        var payload = new Dictionary<string, object>
        {
            ["quantity"] = request.Quantity,
            ["product"] = string.IsNullOrWhiteSpace(request.Product) ? "D" : request.Product,
            ["validity"] = "DAY",
            ["price"] = request.OrderType == Domain.Enums.OrderType.LIMIT ? (request.Price ?? 0m) : 0m,
            ["tag"] = (request.CorrelationId?.Length > 20 ? request.CorrelationId[..20] : request.CorrelationId) ?? "AutoTrade",
            ["instrument_token"] = instrument.InstrumentKey,
            ["order_type"] = request.OrderType == Domain.Enums.OrderType.LIMIT ? "LIMIT" : "MARKET",
            ["transaction_type"] = request.TransactionType == Domain.Enums.TransactionType.BUY ? "BUY" : "SELL",
            ["disclosed_quantity"] = 0,
            ["trigger_price"] = 0,
            ["is_amo"] = false
        };

        var jsonBody = JsonSerializer.Serialize(payload);

        // Try standard BaseUrl first (api.upstox.com/v2), then fallback to HftBaseUrl (api-hft.upstox.com/v2)
        var endpointsToTry = new[]
        {
            $"{_config.BaseUrl}/order/place",
            $"{_config.HftBaseUrl}/order/place"
        };

        string lastResponseContent = string.Empty;

        foreach (var url in endpointsToTry)
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            _logger.LogInformation("Submitting LIVE order to Upstox endpoint {Url} for {Symbol} ({Type} {Qty} shares)", 
                url, instrument.TradingSymbol, request.TransactionType, request.Quantity);

            var response = await _httpClient.SendAsync(httpRequest, ct);
            var responseContent = await response.Content.ReadAsStringAsync(ct);
            lastResponseContent = responseContent;

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseContent);
                if (doc.RootElement.TryGetProperty("data", out var data))
                {
                    var upstoxOrderId = data.TryGetProperty("order_id", out var idProp) ? idProp.GetString() : null;
                    return new UpstoxOrderPlacementResult(true, upstoxOrderId, "Order accepted by Upstox");
                }
                return new UpstoxOrderPlacementResult(false, null, "Unexpected response from Upstox");
            }

            _logger.LogWarning("Upstox PlaceOrder failed at {Url}: {StatusCode} {Response}", url, response.StatusCode, responseContent);
        }

        var friendlyMessage = ExtractUpstoxErrorMessage(lastResponseContent);
        return new UpstoxOrderPlacementResult(false, null, friendlyMessage);
    }

    private static string ExtractUpstoxErrorMessage(string responseContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseContent);
            if (doc.RootElement.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array)
            {
                foreach (var err in errors.EnumerateArray())
                {
                    var code = err.TryGetProperty("errorCode", out var c) ? c.GetString() : null;
                    var msg = err.TryGetProperty("message", out var m) ? m.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(msg))
                    {
                        if (code == "UDAPI1154")
                        {
                            return $"Upstox Static IP Required ({code}): {msg}. Please whitelist your IP in Upstox Developer Console (My Apps -> Static IP).";
                        }
                        return $"Upstox Error: {msg}" + (string.IsNullOrWhiteSpace(code) ? "" : $" ({code})");
                    }
                }
            }
            if (doc.RootElement.TryGetProperty("message", out var topMsg))
            {
                return $"Upstox Error: {topMsg.GetString()}";
            }
        }
        catch
        {
        }

        return string.IsNullOrWhiteSpace(responseContent) ? "Order failed at Upstox broker." : $"Upstox error: {responseContent}";
    }

    public async Task<UpstoxOrderDetails?> GetOrderDetailsAsync(string accessToken, string upstoxOrderId, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/order/history?order_id={Uri.EscapeDataString(upstoxOrderId)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var latestHistory = data.EnumerateArray().FirstOrDefault();
        if (latestHistory.ValueKind == JsonValueKind.Undefined) return null;

        var status = latestHistory.TryGetProperty("status", out var s) ? s.GetString() ?? "OPEN" : "OPEN";
        var avgPrice = latestHistory.TryGetProperty("average_price", out var p) ? p.GetDecimal() : (decimal?)null;
        var filledQty = latestHistory.TryGetProperty("filled_quantity", out var f) ? f.GetInt32() : 0;
        var statusMsg = latestHistory.TryGetProperty("status_message", out var sm) ? sm.GetString() : null;

        return new UpstoxOrderDetails(upstoxOrderId, status, avgPrice, filledQty, statusMsg);
    }

    public async Task<IEnumerable<TradeFill>> GetOrderTradesAsync(string accessToken, string upstoxOrderId, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/order/trades/get-trades-for-order?order_id={Uri.EscapeDataString(upstoxOrderId)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            return Enumerable.Empty<TradeFill>();
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return Enumerable.Empty<TradeFill>();
        }

        var list = new List<TradeFill>();
        foreach (var item in data.EnumerateArray())
        {
            var tradeId = item.TryGetProperty("trade_id", out var t) ? t.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
            var qty = item.TryGetProperty("quantity", out var q) ? q.GetInt32() : 0;
            var price = item.TryGetProperty("trade_price", out var tp) ? tp.GetDecimal() : 0m;
            var tradedAt = item.TryGetProperty("trade_time", out var tt) && DateTime.TryParse(tt.GetString(), out var dt) ? dt.ToUniversalTime() : DateTime.UtcNow;

            list.Add(new TradeFill
            {
                UpstoxOrderId = upstoxOrderId,
                UpstoxTradeId = tradeId,
                Quantity = qty,
                Price = price,
                TradedAtUtc = tradedAt,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        return list;
    }

    public async Task<PositionDto?> GetVodafoneIdeaPositionAsync(string accessToken, string instrumentKey, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/portfolio/short-term-positions";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var pos in data.EnumerateArray())
        {
            var key = pos.TryGetProperty("instrument_token", out var k) ? k.GetString() : null;
            var symbol = pos.TryGetProperty("trading_symbol", out var s) ? s.GetString() : null;

            if (key == instrumentKey || symbol == "IDEA")
            {
                var qty = pos.TryGetProperty("quantity", out var q) ? q.GetInt32() : 0;
                var avgPrice = pos.TryGetProperty("buy_price", out var bp) ? bp.GetDecimal() : (pos.TryGetProperty("day_buy_price", out var dbp) ? dbp.GetDecimal() : 0m);
                var ltp = pos.TryGetProperty("last_price", out var lp) ? lp.GetDecimal() : 0m;
                var unpnl = pos.TryGetProperty("unrealised", out var u) ? u.GetDecimal() : 0m;
                var rpnl = pos.TryGetProperty("realised", out var r) ? r.GetDecimal() : 0m;
                var pnl = pos.TryGetProperty("pnl", out var p) ? p.GetDecimal() : (unpnl + rpnl);

                return new PositionDto
                {
                    TradingSymbol = "IDEA",
                    InstrumentKey = instrumentKey,
                    Quantity = qty,
                    AveragePrice = avgPrice,
                    CurrentLtp = ltp,
                    UnrealizedPnL = unpnl,
                    RealizedPnL = rpnl,
                    TotalPnL = pnl,
                    LastUpdatedUtc = DateTime.UtcNow
                };
            }
        }

        return null;
    }

    public async Task<HoldingDto?> GetVodafoneIdeaHoldingAsync(string accessToken, string isin, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/portfolio/long-term-holdings";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var hold in data.EnumerateArray())
        {
            var itemIsin = hold.TryGetProperty("isin", out var i) ? i.GetString() : null;
            var symbol = hold.TryGetProperty("trading_symbol", out var s) ? s.GetString() : null;

            if (itemIsin == isin || symbol == "IDEA")
            {
                var qty = hold.TryGetProperty("quantity", out var q) ? q.GetInt32() : 0;
                var avgPrice = hold.TryGetProperty("average_price", out var ap) ? ap.GetDecimal() : 0m;
                var ltp = hold.TryGetProperty("last_price", out var lp) ? lp.GetDecimal() : 0m;
                var pnl = hold.TryGetProperty("pnl", out var p) ? p.GetDecimal() : 0m;
                var cp = hold.TryGetProperty("close_price", out var c) ? c.GetDecimal() : 0m;
                var key = hold.TryGetProperty("instrument_token", out var k) ? k.GetString() ?? $"NSE_EQ|{isin}" : $"NSE_EQ|{isin}";

                return new HoldingDto
                {
                    TradingSymbol = "IDEA",
                    InstrumentKey = key,
                    Isin = isin,
                    Quantity = qty,
                    AveragePrice = avgPrice,
                    CurrentLtp = ltp,
                    Pnl = pnl,
                    ClosePrice = cp
                };
            }
        }

        return null;
    }

    public async Task<Instrument?> ResolveVodafoneIdeaInstrumentFromMasterAsync(CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Downloading official Upstox NSE instrument master: {Url}", _config.InstrumentMasterUrl);
            using var response = await _httpClient.GetAsync(_config.InstrumentMasterUrl, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed downloading Upstox instrument master: {Status}", response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            await using var gzipStream = new GZipStream(stream, CompressionMode.Decompress);
            using var jsonDoc = await JsonDocument.ParseAsync(gzipStream, cancellationToken: ct);

            foreach (var elem in jsonDoc.RootElement.EnumerateArray())
            {
                var segment = elem.TryGetProperty("segment", out var s) ? s.GetString() : null;
                var symbol = elem.TryGetProperty("trading_symbol", out var sym) ? sym.GetString() : null;
                var isin = elem.TryGetProperty("isin", out var isinProp) ? isinProp.GetString() : null;
                var name = (elem.TryGetProperty("name", out var n) ? n.GetString() : string.Empty) ?? string.Empty;

                if (segment == "NSE_EQ" && (symbol == "IDEA" || isin == "INE669E01016" || name.Contains("VODAFONE IDEA", StringComparison.OrdinalIgnoreCase)))
                {
                    var instrumentKey = elem.GetProperty("instrument_key").GetString() ?? "NSE_EQ|INE669E01016";
                    var lotSize = elem.TryGetProperty("lot_size", out var ls) ? ls.GetInt32() : 1;
                    var tickSize = elem.TryGetProperty("tick_size", out var ts) ? ts.GetDecimal() : 0.05m;
                    var freezeQty = elem.TryGetProperty("freeze_quantity", out var fq) ? fq.GetDecimal() : 100000m;
                    var token = elem.TryGetProperty("exchange_token", out var et) ? et.GetString() : null;
                    var secType = elem.TryGetProperty("security_type", out var st) ? st.GetString() ?? "NORMAL" : "NORMAL";

                    return new Instrument
                    {
                        InstrumentKey = instrumentKey,
                        TradingSymbol = symbol ?? "IDEA",
                        CompanyName = name,
                        Exchange = "NSE",
                        Segment = segment,
                        Isin = isin ?? "INE669E01016",
                        SecurityType = secType,
                        LotSize = lotSize,
                        TickSize = tickSize,
                        FreezeQuantity = freezeQty,
                        ExchangeToken = token,
                        LastUpdatedUtc = DateTime.UtcNow
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while downloading and parsing Upstox instrument master.");
        }

        return null;
    }

    public async Task<string?> GetRegisteredIpAsync(string accessToken, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/user/ip";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return content;
    }

    public async Task<string> SetRegisteredIpAsync(string accessToken, string primaryIp, string? secondaryIp = null, CancellationToken ct = default)
    {
        var url = $"{_config.BaseUrl}/user/ip";
        var payload = new Dictionary<string, string?>
        {
            ["primary_ip"] = primaryIp.Trim()
        };
        if (!string.IsNullOrWhiteSpace(secondaryIp))
        {
            payload["secondary_ip"] = secondaryIp.Trim();
        }

        using var request = new HttpRequestMessage(HttpMethod.Put, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            var msg = ExtractUpstoxErrorMessage(content);
            throw new TradingException($"Failed updating static IP in Upstox: {msg}");
        }

        return content;
    }

    public async Task<List<Candle>> GetIntradayCandlesAsync(string instrumentKey, string interval = "1minute", CancellationToken ct = default)
    {
        var encodedKey = Uri.EscapeDataString(instrumentKey);
        var url = $"{_config.BaseUrl}/historical-candle/intraday/{encodedKey}/{interval}";

        return await FetchAndParseCandlesAsync(url, ct);
    }

    public async Task<List<Candle>> GetHistoricalCandlesAsync(string instrumentKey, string interval, DateTime toDate, DateTime fromDate, CancellationToken ct = default)
    {
        var encodedKey = Uri.EscapeDataString(instrumentKey);
        var toStr = toDate.ToString("yyyy-MM-dd");
        var fromStr = fromDate.ToString("yyyy-MM-dd");
        var url = $"{_config.BaseUrl}/historical-candle/{encodedKey}/{interval}/{toStr}/{fromStr}";

        return await FetchAndParseCandlesAsync(url, ct);
    }

    private async Task<List<Candle>> FetchAndParseCandlesAsync(string url, CancellationToken ct)
    {
        var result = new List<Candle>();
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await _httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Upstox historical candle fetch failed from {Url}: {Status}", url, response.StatusCode);
                return result;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("data", out var dataElem) &&
                dataElem.TryGetProperty("candles", out var candlesElem) &&
                candlesElem.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in candlesElem.EnumerateArray())
                {
                    if (item.GetArrayLength() >= 6)
                    {
                        var timeStr = item[0].GetString();
                        if (DateTime.TryParse(timeStr, out var parsedTime))
                        {
                            result.Add(new Candle
                            {
                                TimestampUtc = parsedTime.ToUniversalTime(),
                                Open = item[1].GetDecimal(),
                                High = item[2].GetDecimal(),
                                Low = item[3].GetDecimal(),
                                Close = item[4].GetDecimal(),
                                Volume = item[5].GetInt64(),
                                OpenInterest = item.GetArrayLength() > 6 ? item[6].GetInt64() : 0
                            });
                        }
                    }
                }
            }

            // Upstox returns newest first; reverse so that candles are in chronological ascending order
            result.Reverse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed downloading or parsing candles from {Url}", url);
        }

        return result;
    }
}
