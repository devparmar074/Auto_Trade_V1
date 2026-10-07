import React from 'react';
import type { StrategyScore } from '../types/trading';
import { Activity, Zap } from 'lucide-react';

interface StrategyScoreCardProps {
  score?: StrategyScore;
}

export const StrategyScoreCard: React.FC<StrategyScoreCardProps> = ({ score }) => {
  if (!score) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Activity className="w-8 h-8 animate-pulse text-emerald-500" />
          <span className="text-sm font-mono">Computing Multi-Factor Strategy Engine...</span>
        </div>
      </div>
    );
  }

  // Determine recommendation badge color and styling
  const getScoreColor = (val: number) => {
    if (val >= 60) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', fill: 'bg-emerald-500' };
    if (val >= 20) return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', fill: 'bg-green-500' };
    if (val <= -60) return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', fill: 'bg-red-500' };
    if (val <= -20) return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', fill: 'bg-rose-500' };
    return { text: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700', fill: 'bg-slate-500' };
  };

  const rawScore = score.score ?? 0;
  const colors = getScoreColor(rawScore);
  const ind = score.indicators;

  // Normalized gauge percentage: (-100 to 100) -> (0% to 100%)
  const gaugePercent = Math.max(0, Math.min(100, (rawScore + 100) / 2));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Strategy & Scoring Engine</h3>
              <p className="text-xs text-slate-400 font-mono">Algorithmic Multi-Factor Model</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold border font-mono tracking-wide ${colors.bg} ${colors.text} ${colors.border}`}>
            {score.recommendationText || 'NEUTRAL'}
          </div>
        </div>

        {/* Score Gauge &Conviction */}
        <div className="my-5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-xs text-slate-400 font-mono block">Composite Conviction Score</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${colors.text}`}>
                  {rawScore > 0 ? `+${rawScore}` : rawScore}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ ±100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">Recommended Sizing</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {score.recommendedQuantity ?? 1} {(score.recommendedQuantity ?? 1) === 1 ? 'Share' : 'Shares'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            {/* Center mark for 0 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10"></div>
            <div 
              className={`h-full transition-all duration-500 rounded-full ${colors.fill}`}
              style={{ width: `${gaugePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>-100 (Strong Sell)</span>
            <span>0 (Neutral)</span>
            <span>+100 (Strong Buy)</span>
          </div>
        </div>

        {/* Technical Indicators Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {/* RSI */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>RSI (14)</span>
              <span className={`text-[10px] font-bold ${ind?.rsi != null && ind.rsi > 70 ? 'text-red-400' : ind?.rsi != null && ind.rsi < 30 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {ind?.rsi != null ? (ind.rsi > 70 ? 'OVERBOUGHT' : ind.rsi < 30 ? 'OVERSOLD' : 'NORMAL') : '--'}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {ind?.rsi != null ? ind.rsi.toFixed(1) : '--.-'}
            </div>
          </div>

          {/* EMA 9 / 21 */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>EMA 9 / 21</span>
              <span className={`text-[10px] font-bold ${ind?.ema9 != null && ind?.ema21 != null && ind.ema9 >= ind.ema21 ? 'text-emerald-400' : 'text-red-400'}`}>
                {ind?.ema9 != null && ind?.ema21 != null ? (ind.ema9 >= ind.ema21 ? 'BULL' : 'BEAR') : '--'}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {ind?.ema9 != null ? `₹${ind.ema9.toFixed(2)}` : '--'} / <span className="text-slate-400">{ind?.ema21 != null ? `₹${ind.ema21.toFixed(2)}` : '--'}</span>
            </div>
          </div>

          {/* VWAP */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>VWAP</span>
              <span className={`text-[10px] font-bold ${ind?.vwap != null && (score.currentPrice ?? 0) >= ind.vwap ? 'text-emerald-400' : 'text-red-400'}`}>
                {ind?.vwap != null ? ((score.currentPrice ?? 0) >= ind.vwap ? 'ABOVE' : 'BELOW') : '--'}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {ind?.vwap != null ? `₹${ind.vwap.toFixed(2)}` : '--'}
            </div>
          </div>

          {/* Supertrend */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Supertrend (10,3)</span>
              <span className={`text-[10px] font-bold ${ind?.supertrendDirection === 'BULLISH' ? 'text-emerald-400' : ind?.supertrendDirection === 'BEARISH' ? 'text-red-400' : 'text-slate-400'}`}>
                {ind?.supertrendDirection || '--'}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {ind?.supertrend != null ? `₹${ind.supertrend.toFixed(2)}` : '--'}
            </div>
          </div>
        </div>

        {/* Signal Factors List */}
        {score.signalFactors && score.signalFactors.length > 0 && (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
            <span className="text-[11px] font-mono text-slate-400 block mb-1.5 font-semibold">
              Signal Breakdown & Rationale:
            </span>
            <ul className="space-y-1">
              {score.signalFactors.map((factor, idx) => (
                <li key={idx} className="text-xs font-mono text-slate-300 flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Evaluated for Vodafone Idea (IDEA)</span>
        <span>{new Date(score.calculatedAtUtc).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
