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
    if (val >= 60) return { 
      text: 'text-[#19E58C]', 
      bg: 'bg-[#19E58C]/15', 
      border: 'border-[#19E58C]/40', 
      fill: 'ob-glint-bar',
      glow: 'ob-glow-bull',
      badgeDot: 'ob-sonar-dot'
    };
    if (val >= 20) return { 
      text: 'text-[#2DD4BF]', 
      bg: 'bg-[#2DD4BF]/15', 
      border: 'border-[#2DD4BF]/40', 
      fill: 'bg-[#2DD4BF]',
      glow: 'shadow-[0_0_20px_rgba(45,212,191,0.2)]',
      badgeDot: 'w-2 h-2 rounded-full bg-[#2DD4BF]'
    };
    if (val <= -60) return { 
      text: 'text-[#FF4D67]', 
      bg: 'bg-[#FF4D67]/15', 
      border: 'border-[#FF4D67]/40', 
      fill: 'ob-glint-bar-bear',
      glow: 'ob-glow-bear',
      badgeDot: 'ob-sonar-dot-bear'
    };
    if (val <= -20) return { 
      text: 'text-[#F472B6]', 
      bg: 'bg-[#F472B6]/15', 
      border: 'border-[#F472B6]/40', 
      fill: 'bg-[#F472B6]',
      glow: 'shadow-[0_0_20px_rgba(244,114,182,0.2)]',
      badgeDot: 'w-2 h-2 rounded-full bg-[#F472B6]'
    };
    return { 
      text: 'text-slate-300', 
      bg: 'bg-[#161C27]', 
      border: 'border-[#242D3C]', 
      fill: 'bg-slate-500',
      glow: 'border-[#1A212D]',
      badgeDot: 'w-2 h-2 rounded-full bg-slate-500'
    };
  };

  const rawScore = score.score ?? 0;
  const colors = getScoreColor(rawScore);
  const ind = score.indicators;

  // Normalized gauge percentage: (-100 to 100) -> (0% to 100%)
  const gaugePercent = Math.max(0, Math.min(100, (rawScore + 100) / 2));

  return (
    <div className={`ob-panel rounded-2xl p-5 shadow-2xl flex flex-col justify-between transition-all duration-300 ${colors.glow}`}>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#1A212D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7B7BFF]/15 text-[#7B7BFF] rounded-xl border border-[#7B7BFF]/25 shadow-[0_0_12px_rgba(123,123,255,0.2)]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">Strategy & Scoring Engine</h3>
              <p className="text-xs text-slate-400 font-mono">Algorithmic Multi-Factor Model</p>
            </div>
          </div>

          <div className={`px-3.5 py-1 rounded-full text-xs font-bold border font-mono tracking-wider flex items-center gap-2 ${colors.bg} ${colors.text} ${colors.border}`}>
            <span className={colors.badgeDot}></span>
            <span>{score.recommendationText || 'NEUTRAL'}</span>
          </div>
        </div>

        {/* Score Gauge & Conviction */}
        <div className="my-5 bg-[#11161F] border border-[#1A212D] rounded-2xl p-4 shadow-inner relative overflow-hidden">
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">Composite Conviction Score</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-4xl font-black font-mono tracking-tight ${colors.text}`}>
                  {rawScore > 0 ? `+${rawScore}` : rawScore}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ ±100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">Recommended Sizing</span>
              <span className="text-xl font-black font-mono text-[#19E58C]">
                {score.recommendedQuantity ?? 1} {(score.recommendedQuantity ?? 1) === 1 ? 'Share' : 'Shares'}
              </span>
            </div>
          </div>

          {/* Glint Shimmer Progress Bar */}
          <div className="relative w-full h-3.5 bg-[#06080C] rounded-full overflow-hidden border border-[#1A212D]">
            {/* Center mark for 0 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 z-10 opacity-70"></div>
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${colors.fill}`}
              style={{ width: `${gaugePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 font-semibold">
            <span className="text-[#FF4D67]">-100 (Strong Sell)</span>
            <span>0 (Neutral)</span>
            <span className="text-[#19E58C]">+100 (Strong Buy)</span>
          </div>
        </div>

        {/* Technical Indicators Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {/* RSI */}
          <div className="bg-[#11161F] border border-[#1A212D] hover:border-[#45B8FF]/40 rounded-xl p-2.5 ob-hover-lift">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>RSI (14)</span>
              <span className={`text-[10px] font-bold ${ind?.rsi != null && ind.rsi > 70 ? 'text-[#FF4D67]' : ind?.rsi != null && ind.rsi < 30 ? 'text-[#19E58C]' : 'text-slate-400'}`}>
                {ind?.rsi != null ? (ind.rsi > 70 ? 'OVERBOUGHT' : ind.rsi < 30 ? 'OVERSOLD' : 'NORMAL') : '--'}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-1">
              {ind?.rsi != null ? ind.rsi.toFixed(1) : '--.-'}
            </div>
          </div>

          {/* EMA 9 / 21 */}
          <div className="bg-[#11161F] border border-[#1A212D] hover:border-[#19E58C]/40 rounded-xl p-2.5 ob-hover-lift">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>EMA 9 / 21</span>
              <span className={`text-[10px] font-bold ${ind?.ema9 != null && ind?.ema21 != null && ind.ema9 >= ind.ema21 ? 'text-[#19E58C]' : 'text-[#FF4D67]'}`}>
                {ind?.ema9 != null && ind?.ema21 != null ? (ind.ema9 >= ind.ema21 ? 'BULLISH' : 'BEARISH') : '--'}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-1">
              {ind?.ema9 != null ? `₹${ind.ema9.toFixed(2)}` : '--'} / <span className="text-slate-400">{ind?.ema21 != null ? `₹${ind.ema21.toFixed(2)}` : '--'}</span>
            </div>
          </div>

          {/* VWAP */}
          <div className="bg-[#11161F] border border-[#1A212D] hover:border-[#FFB020]/40 rounded-xl p-2.5 ob-hover-lift">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>VWAP</span>
              <span className={`text-[10px] font-bold ${ind?.vwap != null && (score.currentPrice ?? 0) >= ind.vwap ? 'text-[#19E58C]' : 'text-[#FF4D67]'}`}>
                {ind?.vwap != null ? ((score.currentPrice ?? 0) >= ind.vwap ? 'ABOVE' : 'BELOW') : '--'}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-1">
              {ind?.vwap != null ? `₹${ind.vwap.toFixed(2)}` : '--'}
            </div>
          </div>

          {/* Supertrend */}
          <div className="bg-[#11161F] border border-[#1A212D] hover:border-[#2DD4BF]/40 rounded-xl p-2.5 ob-hover-lift">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Supertrend</span>
              <span className={`text-[10px] font-bold ${ind?.supertrendDirection === 'BULLISH' ? 'text-[#19E58C]' : ind?.supertrendDirection === 'BEARISH' ? 'text-[#FF4D67]' : 'text-slate-400'}`}>
                {ind?.supertrendDirection || '--'}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-1">
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
