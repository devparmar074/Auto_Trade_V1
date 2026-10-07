using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace AutoTrade.Api.Controllers;

[ApiController]
[Route("api/vi")]
public class VodafoneIdeaController : ControllerBase
{
    private readonly IMarketDataService _marketDataService;
    private readonly IPortfolioService _portfolioService;
    private readonly IOrderService _orderService;
    private readonly IInstrumentService _instrumentService;
    private readonly ILogger<VodafoneIdeaController> _logger;

    public VodafoneIdeaController(
        IMarketDataService marketDataService,
        IPortfolioService portfolioService,
        IOrderService orderService,
        IInstrumentService instrumentService,
        ILogger<VodafoneIdeaController> logger)
    {
        _marketDataService = marketDataService;
        _portfolioService = portfolioService;
        _orderService = orderService;
        _instrumentService = instrumentService;
        _logger = logger;
    }

    [HttpGet("quote")]
    public async Task<ActionResult<LtpQuoteDto>> GetQuote()
    {
        var quote = await _marketDataService.GetVodafoneIdeaQuoteAsync();
        return Ok(quote);
    }

    [HttpGet("market-status")]
    public async Task<ActionResult<string>> GetMarketStatus()
    {
        var status = await _marketDataService.GetMarketStatusAsync();
        return Ok(new { status });
    }

    [HttpGet("position")]
    public async Task<ActionResult<PositionDto>> GetPosition()
    {
        var position = await _portfolioService.GetPositionAsync();
        return Ok(position);
    }

    [HttpGet("holding")]
    public async Task<ActionResult<HoldingDto>> GetHolding()
    {
        var holding = await _portfolioService.GetHoldingAsync();
        return Ok(holding);
    }

    [HttpGet("instrument")]
    public async Task<ActionResult<Instrument>> GetInstrument()
    {
        var instrument = await _instrumentService.GetVodafoneIdeaInstrumentAsync();
        return Ok(instrument);
    }

    [HttpPost("order")]
    public async Task<ActionResult<OrderResultDto>> PlaceOrder([FromBody] PlaceOrderRequest request)
    {
        _logger.LogInformation("Received {Type} order for {Qty} shares", request.TransactionType, request.Quantity);
        var result = await _orderService.ExecuteOrderAsync(request);
        return Ok(result);
    }

    [HttpGet("order/{id:long}")]
    public async Task<ActionResult<TradeOrder>> GetOrder(long id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound(new { message = $"Order #{id} not found." });
        return Ok(order);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<TradeOrder>>> GetOrders([FromQuery] int limit = 10)
    {
        var orders = await _orderService.GetRecentOrdersAsync(limit);
        return Ok(orders);
    }

    [HttpGet("order/{id:long}/trades")]
    public async Task<ActionResult<IEnumerable<TradeFill>>> GetOrderTrades(long id)
    {
        var trades = await _orderService.GetOrderTradesAsync(id);
        return Ok(trades);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboard()
    {
        var dashboard = await _marketDataService.GetDashboardSummaryAsync();
        return Ok(dashboard);
    }
}
