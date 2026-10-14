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

    public StrategyScoreDto Evaluate(IList<Candle> candles, decimal currentLtp, BotConfig config, decimal? availableFunds = null)
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
            result.RecommendedQuantity = CalculateQuantity(0, config, currentLtp, availableFunds);
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
        result.RecommendedQuantity = CalculateQuantity(result.Score, config, currentLtp, availableFunds);

        _logger.LogInformation("Vodafone Idea Strategy evaluated: Score {Score} ({Rec}), Dynamic Qty: {Qty}",
            result.Score, result.RecommendationText, result.RecommendedQuantity);

        return result;
    }

    public int CalculateQuantity(decimal score, BotConfig config)
    {
        return CalculateQuantity(score, config, 0m, null);
    }

    public int CalculateQuantity(decimal score, BotConfig config, decimal currentLtp, decimal? availableFunds = null)
    {
        var baseQty = Math.Max(1, config.BaseQuantity);
        var maxQty = config.MaxQuantity > 0 ? Math.Max(baseQty, config.MaxQuantity) : int.MaxValue;

        // If dynamic sizing is disabled or no funds provided or LTP is zero, fallback to legacy base sizing
        if (!config.UseDynamicCapitalSizing || !availableFunds.HasValue || availableFunds.Value <= 0 || currentLtp <= 0)
        {
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

        var margin = availableFunds.Value;
        // Cap deployable capital by MaxCapitalPerTrade if specified (> 0)
        var deployableCapital = config.MaxCapitalPerTrade > 0 ? Math.Min(margin, config.MaxCapitalPerTrade) : margin;

        // Apply capital allocation buffer (e.g. 90% or 95% to preserve buffer for STT, taxes, brokerage)
        var allocationPercent = config.CapitalAllocationPercent > 0 && config.CapitalAllocationPercent <= 100 
            ? config.CapitalAllocationPercent 
            : 90.00m;

        var usableCapital = deployableCapital * (allocationPercent / 100m);

        // Calculate maximum affordable shares with allocated capital
        var calculatedQty = (int)Math.Floor(usableCapital / currentLtp);

        // If score is marginal (e.g. 60-70), scale down slightly to manage entry risk
        if (score < 70m && score >= config.BuyScoreThreshold)
        {
            calculatedQty = Math.Max(1, (int)(calculatedQty * 0.6m));
        }
        else if (score < 85m && score >= 70m)
        {
            calculatedQty = Math.Max(1, (int)(calculatedQty * 0.8m));
        }

        // Clamp by MaxQuantity if MaxQuantity is configured (> 0)
        if (config.MaxQuantity > 0)
        {
            calculatedQty = Math.Min(calculatedQty, config.MaxQuantity);
        }

        // Hard Guarantee: Total order value strictly does not exceed available margin
        while (calculatedQty > 0 && (calculatedQty * currentLtp) > margin)
        {
            calculatedQty--;
        }

        _logger.LogInformation("Dynamic Capital Sizing: Margin=₹{Funds:F2}, Usable=₹{Usable:F2}, LTP=₹{Ltp:F2}, Score={Score} -> Dynamic Qty: {Qty} shares (Cost: ₹{Cost:F2})",
            margin, usableCapital, currentLtp, score, calculatedQty, calculatedQty * currentLtp);

        return calculatedQty;
    }
}
