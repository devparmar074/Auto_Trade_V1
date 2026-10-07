using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Interfaces;

public class IndicatorContext
{
    public IList<Candle> Candles { get; set; } = new List<Candle>();
    public decimal CurrentPrice { get; set; }
    public Candle? LatestCandle => Candles.Count > 0 ? Candles[^1] : null;
    public Candle? PreviousCandle => Candles.Count > 1 ? Candles[^2] : null;

    // Cache computed indicator values to avoid recalculation across conditions
    private readonly Dictionary<string, decimal?> _computedValues = new();
    private readonly Dictionary<string, (decimal Upper, decimal Middle, decimal Lower, decimal Bandwidth)> _bollingerCache = new();

    public decimal? GetSma(int period)
    {
        var key = $"SMA_{period}";
        if (_computedValues.TryGetValue(key, out var val)) return val;

        if (Candles.Count < period) return null;
        var slice = Candles.TakeLast(period).Select(c => c.Close);
        var result = Math.Round(slice.Average(), 2);
        _computedValues[key] = result;
        return result;
    }

    public decimal? GetPreviousSma(int period)
    {
        var key = $"PREV_SMA_{period}";
        if (_computedValues.TryGetValue(key, out var val)) return val;

        if (Candles.Count <= period) return null;
        var slice = Candles.Take(Candles.Count - 1).TakeLast(period).Select(c => c.Close);
        var result = Math.Round(slice.Average(), 2);
        _computedValues[key] = result;
        return result;
    }

    public decimal? GetEma(int period)
    {
        var key = $"EMA_{period}";
        if (_computedValues.TryGetValue(key, out var val)) return val;

        if (Candles.Count < period) return null;
        decimal multiplier = 2m / (period + 1m);
        decimal ema = Candles.Take(period).Select(c => c.Close).Average();

        for (int i = period; i < Candles.Count; i++)
        {
            ema = ((Candles[i].Close - ema) * multiplier) + ema;
        }

        var result = Math.Round(ema, 2);
        _computedValues[key] = result;
        return result;
    }

    public decimal? GetPreviousEma(int period)
    {
        var key = $"PREV_EMA_{period}";
        if (_computedValues.TryGetValue(key, out var val)) return val;

        if (Candles.Count <= period) return null;
        decimal multiplier = 2m / (period + 1m);
        var count = Candles.Count - 1;
        decimal ema = Candles.Take(period).Select(c => c.Close).Average();

        for (int i = period; i < count; i++)
        {
            ema = ((Candles[i].Close - ema) * multiplier) + ema;
        }

        var result = Math.Round(ema, 2);
        _computedValues[key] = result;
        return result;
    }

    public (decimal Upper, decimal Middle, decimal Lower, decimal Bandwidth)? GetBollingerBands(int period = 20, decimal multiplier = 2.0m)
    {
        var key = $"BB_{period}_{multiplier}";
        if (_bollingerCache.TryGetValue(key, out var cached)) return cached;

        if (Candles.Count < period) return null;

        var prices = Candles.TakeLast(period).Select(c => (double)c.Close).ToList();
        double mean = prices.Average();
        double sumSq = prices.Sum(d => Math.Pow(d - mean, 2));
        double stdDev = Math.Sqrt(sumSq / period);

        decimal middle = Math.Round((decimal)mean, 2);
        decimal upper = Math.Round(middle + (multiplier * (decimal)stdDev), 2);
        decimal lower = Math.Round(middle - (multiplier * (decimal)stdDev), 2);
        decimal bandwidth = middle > 0 ? Math.Round(((upper - lower) / middle) * 100m, 2) : 0m;

        var res = (upper, middle, lower, bandwidth);
        _bollingerCache[key] = res;
        return res;
    }

    public (decimal Upper, decimal Middle, decimal Lower, decimal Bandwidth)? GetPreviousBollingerBands(int period = 20, decimal multiplier = 2.0m)
    {
        var key = $"PREV_BB_{period}_{multiplier}";
        if (_bollingerCache.TryGetValue(key, out var cached)) return cached;

        if (Candles.Count <= period) return null;

        var prices = Candles.Take(Candles.Count - 1).TakeLast(period).Select(c => (double)c.Close).ToList();
        double mean = prices.Average();
        double sumSq = prices.Sum(d => Math.Pow(d - mean, 2));
        double stdDev = Math.Sqrt(sumSq / period);

        decimal middle = Math.Round((decimal)mean, 2);
        decimal upper = Math.Round(middle + (multiplier * (decimal)stdDev), 2);
        decimal lower = Math.Round(middle - (multiplier * (decimal)stdDev), 2);
        decimal bandwidth = middle > 0 ? Math.Round(((upper - lower) / middle) * 100m, 2) : 0m;

        var res = (upper, middle, lower, bandwidth);
        _bollingerCache[key] = res;
        return res;
    }

    // PCR value and historical values for direction
    public decimal PcrCurrent { get; set; } = 1.05m;
    public decimal PcrPrevious { get; set; } = 0.98m;
}

public interface ICustomConditionEvaluator
{
    string IndicatorName { get; }
    ConditionEvaluationResultDto Evaluate(StrategyConditionDto condition, IndicatorContext context);
}
