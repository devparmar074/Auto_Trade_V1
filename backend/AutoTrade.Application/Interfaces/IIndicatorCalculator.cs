using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public interface IIndicatorCalculator
{
    TechnicalIndicators CalculateIndicators(IList<Candle> candles);
    decimal? CalculateRsi(IList<decimal> closePrices, int period = 14);
    decimal? CalculateEma(IList<decimal> prices, int period);
    decimal? CalculateVwap(IList<Candle> intradayCandles);
    (decimal? Value, string Direction) CalculateSupertrend(IList<Candle> candles, int period = 10, decimal multiplier = 3.0m);
}
