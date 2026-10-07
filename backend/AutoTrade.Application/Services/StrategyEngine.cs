using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Domain.Enums;
using AutoTrade.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AutoTrade.Application.Services;

public class StrategyEngine : IStrategyEngine
{
    private readonly IIndicatorCalculator _calculator;
    private readonly ILogger<StrategyEngine> _logger;

    public StrategyEngine(IIndicatorCalculator calculator, ILogger<StrategyEngine> logger)
    {
        _calculator = calculator;
        _logger = logger;
    }

    public StrategyScoreDto Evaluate(IList<Candle> candles, decimal currentLtp, BotConfig config)
    {
        var result = new StrategyScoreDto
        {
            CurrentPrice = currentLtp,
            CalculatedAtUtc = DateTime.UtcNow
        };

        if (candles == null || candles.Count < 10)
        {
            result.Score = 0;
            result.Recommendation = StrategyRecommendation.Neutral;
            result.RecommendationText = "NEUTRAL";
            result.SignalFactors.Add("Insufficient historical candle data for evaluation.");
            result.RecommendedQuantity = config.BaseQuantity;
            return result;
        }

        var indicators = _calculator.CalculateIndicators(candles);
        result.Indicators = indicators;

        decimal totalScore = 0m;
        var factors = new List<string>();

        // 1. RSI Scoring (Weight: +/- 25 points)
        if (indicators.Rsi.HasValue)
        {
            var rsi = indicators.Rsi.Value;
            if (rsi < 30)
            {
                totalScore += 25;
                factors.Add($"RSI oversold ({rsi:F1} < 30) - strong reversal buy signal");
            }
            else if (rsi > 70)
            {
                totalScore -= 25;
                factors.Add($"RSI overbought ({rsi:F1} > 70) - potential exhaustion/sell signal");
            }
            else if (rsi >= 55)
            {
                totalScore += 15;
                factors.Add($"RSI bullish momentum ({rsi:F1})");
            }
            else if (rsi <= 45)
            {
                totalScore -= 15;
                factors.Add($"RSI bearish momentum ({rsi:F1})");
            }
            else
            {
                factors.Add($"RSI neutral ({rsi:F1})");
            }
        }

        // 2. EMA Trend Alignment (Weight: +/- 35 points)
        if (indicators.Ema9.HasValue && indicators.Ema21.HasValue)
        {
            var ema9 = indicators.Ema9.Value;
            var ema21 = indicators.Ema21.Value;
            var ema50 = indicators.Ema50;

            if (currentLtp > ema9 && ema9 > ema21 && (!ema50.HasValue || ema21 > ema50.Value))
            {
                totalScore += 35;
                factors.Add($"Price above EMA9 ({ema9:F2}) & EMA21 ({ema21:F2}) - strong uptrend");
            }
            else if (currentLtp > ema9 && ema9 > ema21)
            {
                totalScore += 20;
                factors.Add($"Price above EMA9 ({ema9:F2}) & EMA21 ({ema21:F2}) - short-term bull crossover");
            }
            else if (currentLtp < ema9 && ema9 < ema21 && (!ema50.HasValue || ema21 < ema50.Value))
            {
                totalScore -= 35;
                factors.Add($"Price below EMA9 ({ema9:F2}) & EMA21 ({ema21:F2}) - strong downtrend");
            }
            else if (currentLtp < ema9 && ema9 < ema21)
            {
                totalScore -= 20;
                factors.Add($"Price below EMA9 ({ema9:F2}) & EMA21 ({ema21:F2}) - short-term bear crossover");
            }
            else
            {
                factors.Add("EMAs consolidating / mixed signals");
            }
        }

        // 3. VWAP Confirmation (Weight: +/- 20 points)
        if (indicators.Vwap.HasValue)
        {
            var vwap = indicators.Vwap.Value;
            if (currentLtp >= vwap)
            {
                totalScore += 20;
                factors.Add($"Price trading above VWAP ({vwap:F2}) - buyers in control");
            }
            else
            {
                totalScore -= 20;
                factors.Add($"Price trading below VWAP ({vwap:F2}) - sellers in control");
            }
        }

        // 4. Supertrend (Weight: +/- 20 points)
        if (!string.IsNullOrEmpty(indicators.SupertrendDirection))
        {
            if (indicators.SupertrendDirection == "BULLISH")
            {
                totalScore += 20;
                factors.Add($"Supertrend is BULLISH (Support: {indicators.Supertrend:F2})");
            }
            else if (indicators.SupertrendDirection == "BEARISH")
            {
                totalScore -= 20;
                factors.Add($"Supertrend is BEARISH (Resistance: {indicators.Supertrend:F2})");
            }
        }

        // 5. Volume Confirmation (Bonus: +/- 10 points)
        if (indicators.VolumeRatio.HasValue && indicators.VolumeRatio.Value > 1.5m)
        {
            if (totalScore > 0)
            {
                totalScore += 10;
                factors.Add($"Volume surge ({indicators.VolumeRatio.Value}x avg) confirming upward momentum");
            }
            else if (totalScore < 0)
            {
                totalScore -= 10;
                factors.Add($"Volume surge ({indicators.VolumeRatio.Value}x avg) confirming selling pressure");
            }
        }

        // Clamp final score to [-100, 100]
        totalScore = Math.Clamp(totalScore, -100m, 100m);
        result.Score = Math.Round(totalScore, 1);
        result.SignalFactors = factors;

        // Determine recommendation
        if (result.Score >= 70m)
        {
            result.Recommendation = StrategyRecommendation.StrongBuy;
            result.RecommendationText = "STRONG BUY";
        }
        else if (result.Score >= config.BuyScoreThreshold)
        {
            result.Recommendation = StrategyRecommendation.Buy;
            result.RecommendationText = "BUY";
        }
        else if (result.Score <= -70m)
        {
            result.Recommendation = StrategyRecommendation.StrongSell;
            result.RecommendationText = "STRONG SELL";
        }
        else if (result.Score <= config.SellScoreThreshold)
        {
            result.Recommendation = StrategyRecommendation.Sell;
            result.RecommendationText = "SELL";
        }
        else
        {
            result.Recommendation = StrategyRecommendation.Neutral;
            result.RecommendationText = "NEUTRAL";
        }

        // Calculate dynamic sizing
        result.RecommendedQuantity = CalculateQuantity(result.Score, config);

        _logger.LogInformation("Vodafone Idea Strategy evaluated: Score {Score} ({Rec}), Dynamic Qty: {Qty}",
            result.Score, result.RecommendationText, result.RecommendedQuantity);

        return result;
    }

    public int CalculateQuantity(decimal score, BotConfig config)
    {
        var baseQty = Math.Max(1, config.BaseQuantity);
        var maxQty = Math.Max(baseQty, config.MaxQuantity);

        if (score >= 85m)
        {
            return Math.Min(baseQty * 3, maxQty);
        }
        if (score >= 65m)
        {
            return Math.Min(baseQty * 2, maxQty);
        }
        if (score >= config.BuyScoreThreshold)
        {
            return baseQty;
        }

        return baseQty;
    }
}
