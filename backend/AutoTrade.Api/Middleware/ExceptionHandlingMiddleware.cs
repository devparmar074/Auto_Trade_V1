using System.Net;
using System.Text.Json;
using AutoTrade.Application.Exceptions;

namespace AutoTrade.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (TradingException tex)
        {
            _logger.LogWarning("Trading exception handled: {Code} - {Message}", tex.ErrorCode, tex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

            var response = new
            {
                success = false,
                errorCode = tex.ErrorCode,
                message = tex.Message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled server error processing request: {Path}", context.Request.Path);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new
            {
                success = false,
                errorCode = "INTERNAL_SERVER_ERROR",
                message = "An unexpected error occurred while processing your request. Please try again."
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
