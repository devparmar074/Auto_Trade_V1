using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Models;

namespace AutoTrade.Application.Services;

public class IndicatorCalculator : IIndicatorCalculator
{
    public TechnicalIndicators CalculateIndicators(IList<Candle> candles)
    {
        var result = new TechnicalIndicators();
        if (candles == null || candles.Count == 0) return result;

        var closes = candles.Select(c => c.Close).ToList();

        // 1. RSI (14)
        result.Rsi = CalculateRsi(closes, 14);

        // 2. EMAs (9, 21, 50)
        result.Ema9 = CalculateEma(closes, 9);
        result.Ema21 = CalculateEma(closes, 21);
        result.Ema50 = CalculateEma(closes, 50);

        // 3. VWAP
        result.Vwap = CalculateVwap(candles);

        // 4. Supertrend (10, 3)
        var (supertrendVal, direction) = CalculateSupertrend(candles, 10, 3.0m);
        result.Supertrend = supertrendVal;
        result.SupertrendDirection = direction;

        // 5. Volume Ratio (Latest volume / 20-period SMA volume)
        if (candles.Count >= 2)
        {
            var latestVol = candles[^1].Volume;
            var avgVolSlice = candles.TakeLast(Math.Min(20, candles.Count)).Select(c => c.Volume);
            var avgVol = avgVolSlice.Average();
            result.VolumeRatio = avgVol > 0 ? Math.Round((decimal)latestVol / (decimal)avgVol, 2) : 1.0m;
        }

        return result;
    }

    public decimal? CalculateRsi(IList<decimal> closePrices, int period = 14)
    {
        if (closePrices == null || closePrices.Count <= period) return null;

        decimal totalGain = 0m;
        decimal totalLoss = 0m;

        for (int i = 1; i <= period; i++)
        {
            decimal change = closePrices[i] - closePrices[i - 1];
            if (change > 0) totalGain += change;
            else totalLoss += Math.Abs(change);
        }

        decimal avgGain = totalGain / period;
        decimal avgLoss = totalLoss / period;

        for (int i = period + 1; i < closePrices.Count; i++)
        {
            decimal change = closePrices[i] - closePrices[i - 1];
            decimal gain = change > 0 ? change : 0m;
            decimal loss = change < 0 ? Math.Abs(change) : 0m;

            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        }

        if (avgLoss == 0m) return 100m;
        decimal rs = avgGain / avgLoss;
        decimal rsi = 100m - (100m / (1m + rs));
        return Math.Round(rsi, 2);
    }

    public decimal? CalculateEma(IList<decimal> prices, int period)
    {
        if (prices == null || prices.Count < period) return null;

        decimal multiplier = 2m / (period + 1m);
        decimal ema = prices.Take(period).Average();

        for (int i = period; i < prices.Count; i++)
        {
            ema = ((prices[i] - ema) * multiplier) + ema;
        }

        return Math.Round(ema, 2);
    }

    public decimal? CalculateVwap(IList<Candle> intradayCandles)
    {
        if (intradayCandles == null || intradayCandles.Count == 0) return null;

        decimal cumulativeTypicalPriceVolume = 0m;
        long cumulativeVolume = 0;

        foreach (var candle in intradayCandles)
        {
            decimal typicalPrice = (candle.High + candle.Low + candle.Close) / 3m;
            cumulativeTypicalPriceVolume += typicalPrice * candle.Volume;
            cumulativeVolume += candle.Volume;
        }

        if (cumulativeVolume == 0) return null;
        return Math.Round(cumulativeTypicalPriceVolume / cumulativeVolume, 2);
    }

    public (decimal? Value, string Direction) CalculateSupertrend(IList<Candle> candles, int period = 10, decimal multiplier = 3.0m)
    {
        if (candles == null || candles.Count <= period) return (null, "FLAT");

        // Calculate ATR
        var atrValues = new List<decimal>();
        for (int i = 1; i < candles.Count; i++)
        {
            var high = candles[i].High;
            var low = candles[i].Low;
            var prevClose = candles[i - 1].Close;

            var tr = Math.Max(high - low, Math.Max(Math.Abs(high - prevClose), Math.Abs(low - prevClose)));
            atrValues.Add(tr);
        }

        if (atrValues.Count < period) return (null, "FLAT");

        decimal currentAtr = atrValues.Take(period).Average();
        for (int i = period; i < atrValues.Count; i++)
        {
            currentAtr = ((currentAtr * (period - 1)) + atrValues[i]) / period;
        }

        var latest = candles[^1];
        var hl2 = (latest.High + latest.Low) / 2m;
        var upperBand = hl2 + (multiplier * currentAtr);
        var lowerBand = hl2 - (multiplier * currentAtr);

        if (latest.Close > upperBand)
        {
            return (Math.Round(lowerBand, 2), "BULLISH");
        }
        if (latest.Close < lowerBand)
        {
            return (Math.Round(upperBand, 2), "BEARISH");
        }

        return (latest.Close >= hl2 ? Math.Round(lowerBand, 2) : Math.Round(upperBand, 2), 
                latest.Close >= hl2 ? "BULLISH" : "BEARISH");
    }
}
