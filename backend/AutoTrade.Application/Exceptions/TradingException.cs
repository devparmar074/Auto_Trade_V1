namespace AutoTrade.Application.Exceptions;

public class TradingException : Exception
{
    public string ErrorCode { get; }

    public TradingException(string message, string errorCode = "TRADING_ERROR", Exception? inner = null) 
        : base(message, inner)
    {
        ErrorCode = errorCode;
    }
}
