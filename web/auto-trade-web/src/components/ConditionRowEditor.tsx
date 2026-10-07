import React from 'react';
import type { StrategyCondition, IndicatorType, TargetSignal } from '../types/customStrategy';
import { Trash2 } from 'lucide-react';

interface ConditionRowEditorProps {
  condition: StrategyCondition;
  targetSignal: TargetSignal;
  onChange: (updated: StrategyCondition) => void;
  onDelete: () => void;
}

export const ConditionRowEditor: React.FC<ConditionRowEditorProps> = ({
  condition,
  targetSignal,
  onChange,
  onDelete
}) => {
  const handleIndicatorChange = (indicator: IndicatorType) => {
    // Set appropriate default condition type when indicator changes
    let defaultType = 'PriceGreaterThanMa';
    if (indicator === 'PCR') {
      defaultType = targetSignal === 'BUY' ? 'PcrGreaterThan' : 'PcrLessThan';
    } else if (indicator === 'BollingerBands') {
      defaultType = targetSignal === 'BUY' ? 'PriceBelowLowerBand' : 'PriceAboveUpperBand';
    } else {
      defaultType = targetSignal === 'BUY' ? 'PriceGreaterThanMa' : 'PriceLessThanMa';
    }

    onChange({
      ...condition,
      indicator,
      conditionType: defaultType,
      targetSignal
    });
  };

  const isMaCrossType = [
    'FastMaAboveSlowMa', 
    'FastMaBelowSlowMa', 
    'GoldenCrossBullish', 
    'DeathCrossBearish'
  ].includes(condition.conditionType);

  const isPcrThresholdType = [
    'PcrGreaterThan', 
    'PcrLessThan', 
    'PcrCrossAboveThreshold', 
    'PcrCrossBelowThreshold'
  ].includes(condition.conditionType);

  return (
    <div className={`p-3.5 rounded-xl border transition-all ${
      condition.isEnabled 
        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' 
        : 'bg-slate-950/30 border-slate-900 opacity-60'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={condition.isEnabled}
            onChange={(e) => onChange({ ...condition, isEnabled: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            title="Enable or disable this rule"
          />

          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
            targetSignal === 'BUY' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {targetSignal} RULE
          </span>

          <span className="text-xs font-mono text-slate-400 font-semibold">
            Weight Points:
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="100"
              value={condition.weight}
              onChange={(e) => onChange({ ...condition, weight: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-center font-bold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs font-mono text-slate-500">pts</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Delete rule"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {/* Indicator Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">INDICATOR</label>
          <select
            value={condition.indicator}
            onChange={(e) => handleIndicatorChange(e.target.value as IndicatorType)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="MovingAverage">Moving Average (MA)</option>
            <option value="PCR">Put-Call Ratio (PCR)</option>
            <option value="BollingerBands">Bollinger Bands (BB)</option>
          </select>
        </div>

        {/* Condition Type Selector */}
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">CONDITION TRIGGER</label>
          <select
            value={condition.conditionType}
            onChange={(e) => onChange({ ...condition, conditionType: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          >
            {condition.indicator === 'MovingAverage' && (
              <>
                <option value="PriceGreaterThanMa">Price &gt; Moving Average</option>
                <option value="PriceLessThanMa">Price &lt; Moving Average</option>
                <option value="PriceCrossAboveMa">Price Crosses Above MA (Bullish Breakout)</option>
                <option value="PriceCrossBelowMa">Price Crosses Below MA (Bearish Breakdown)</option>
                <option value="FastMaAboveSlowMa">Fast MA &gt; Slow MA (Trend Alignment)</option>
                <option value="FastMaBelowSlowMa">Fast MA &lt; Slow MA (Trend Alignment)</option>
                <option value="GoldenCrossBullish">Golden Cross (50 crosses above 200)</option>
                <option value="DeathCrossBearish">Death Cross (50 crosses below 200)</option>
              </>
            )}

            {condition.indicator === 'PCR' && (
              <>
                <option value="PcrGreaterThan">PCR &gt; Threshold (e.g. Bullish Sentiment)</option>
                <option value="PcrLessThan">PCR &lt; Threshold (e.g. Bearish Sentiment)</option>
                <option value="PcrIncreasing">PCR Trend Rising (Increasing Sentiment)</option>
                <option value="PcrDecreasing">PCR Trend Falling (Decreasing Sentiment)</option>
                <option value="PcrCrossAboveThreshold">PCR Crosses Above Threshold</option>
                <option value="PcrCrossBelowThreshold">PCR Crosses Below Threshold</option>
              </>
            )}

            {condition.indicator === 'BollingerBands' && (
              <>
                <option value="PriceBelowLowerBand">Price &lt;= Lower Band (Oversold / Mean Reversion BUY)</option>
                <option value="PriceAboveUpperBand">Price &gt;= Upper Band (Overbought / Extended SELL)</option>
                <option value="PriceCrossAboveMiddleBand">Price Crosses Above Middle Band (20 SMA Continuation)</option>
                <option value="PriceCrossBelowMiddleBand">Price Crosses Below Middle Band (20 SMA Breakdown)</option>
                <option value="BandSqueeze">Volatility Squeeze (Narrow Bandwidth)</option>
              </>
            )}
          </select>
        </div>

        {/* Dynamic Parameter 1 */}
        {condition.indicator === 'MovingAverage' && !isMaCrossType && (
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">MA PERIOD &amp; TYPE</label>
            <div className="flex items-center gap-1.5">
              <select
                value={condition.maType || 'SMA'}
                onChange={(e) => onChange({ ...condition, maType: e.target.value as 'SMA' | 'EMA' })}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="SMA">SMA</option>
                <option value="EMA">EMA</option>
              </select>
              <select
                value={condition.period || 20}
                onChange={(e) => onChange({ ...condition, period: parseInt(e.target.value) || 20 })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="9">9 Period</option>
                <option value="20">20 Period</option>
                <option value="50">50 Period</option>
                <option value="200">200 Period</option>
              </select>
            </div>
          </div>
        )}

        {condition.indicator === 'MovingAverage' && isMaCrossType && (
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">FAST / SLOW PERIODS</label>
            <div className="flex items-center gap-1.5">
              <select
                value={condition.fastPeriod || 50}
                onChange={(e) => onChange({ ...condition, fastPeriod: parseInt(e.target.value) || 50 })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="9">Fast: 9</option>
                <option value="20">Fast: 20</option>
                <option value="50">Fast: 50</option>
              </select>
              <span className="text-xs text-slate-500 font-mono">/</span>
              <select
                value={condition.slowPeriod || 200}
                onChange={(e) => onChange({ ...condition, slowPeriod: parseInt(e.target.value) || 200 })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="21">Slow: 21</option>
                <option value="50">Slow: 50</option>
                <option value="200">Slow: 200</option>
              </select>
            </div>
          </div>
        )}

        {condition.indicator === 'PCR' && isPcrThresholdType && (
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">PCR THRESHOLD</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="5.0"
              value={condition.thresholdValue ?? 1.0}
              onChange={(e) => onChange({ ...condition, thresholdValue: parseFloat(e.target.value) || 1.0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {condition.indicator === 'BollingerBands' && (
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">STD DEV MULTIPLIER</label>
            <select
              value={condition.stdDevMultiplier ?? 2.0}
              onChange={(e) => onChange({ ...condition, stdDevMultiplier: parseFloat(e.target.value) || 2.0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="1.5">1.5 Std Dev</option>
              <option value="2.0">2.0 Std Dev (Standard)</option>
              <option value="2.5">2.5 Std Dev</option>
              <option value="3.0">3.0 Std Dev</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
