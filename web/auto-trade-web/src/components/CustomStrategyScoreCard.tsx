import React, { useState } from 'react';
import type { CustomStrategyEvaluationResult } from '../types/customStrategy';
import type { StrategyScore } from '../types/trading';
import { StrategyScoreCard } from './StrategyScoreCard';
import { 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sliders, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CustomStrategyScoreCardProps {
  customEvaluation: CustomStrategyEvaluationResult | null;
  defaultScore?: StrategyScore;
}

export const CustomStrategyScoreCard: React.FC<CustomStrategyScoreCardProps> = ({
  customEvaluation,
  defaultScore
}) => {
  const [showDefaultIndicators, setShowDefaultIndicators] = useState(false);

  if (!customEvaluation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Active Custom Strategy</h3>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Waiting for live evaluation data from trading engine...
        </p>
      </div>
    );
  }

  const isBuy = customEvaluation.signal === 'BUY';
  const isSell = customEvaluation.signal === 'SELL';
  const isHold = customEvaluation.signal === 'HOLD';

  const buyProgress = customEvaluation.maxBuyScore > 0 
    ? Math.min(100, Math.round((customEvaluation.buyScore / customEvaluation.maxBuyScore) * 100)) 
    : 0;

  const sellProgress = customEvaluation.maxSellScore > 0 
    ? Math.min(100, Math.round((customEvaluation.sellScore / customEvaluation.maxSellScore) * 100)) 
    : 0;

  const haloClass = isBuy ? 'ob-glow-bull' : isSell ? 'ob-glow-bear' : '';

  return (
    <div className={`ob-panel rounded-2xl p-5 shadow-2xl space-y-4 border transition-all duration-500 relative overflow-hidden ${
      isBuy 
        ? 'border-emerald-500/40' 
        : isSell 
          ? 'border-rose-500/40' 
          : 'border-slate-800'
    } ${haloClass}`}>
      {/* Top Title & Signal */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ob-sonar-dot" />
              Custom Strategy Engine
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              {customEvaluation.combinationMode}
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
            <span>{customEvaluation.strategyName}</span>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            EVAL @ <span className="text-slate-200 font-bold">₹{customEvaluation.currentPrice != null ? customEvaluation.currentPrice.toFixed(2) : '--'}</span> &bull; {customEvaluation.evaluatedAtUtc ? new Date(customEvaluation.evaluatedAtUtc).toLocaleTimeString() : ''}
          </p>
        </div>

        {/* Big Signal Badge */}
        <div className={`px-4 py-2 rounded-xl font-mono font-black text-sm tracking-widest border flex items-center gap-2 shadow-xl shrink-0 transition-all ${
          isBuy 
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-emerald-950/60 ob-glow-bull' 
            : isSell 
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-rose-950/60 ob-glow-bear' 
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-amber-950/30'
        }`}>
          {isBuy && <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />}
          {isSell && <TrendingDown className="w-4 h-4 text-rose-400 animate-pulse" />}
          {isHold && <Minus className="w-4 h-4 text-amber-400" />}
          <span className="drop-shadow-[0_0_8px_currentColor]">{customEvaluation.signal}</span>
        </div>
      </div>

      {/* Score Progress Meters (when WEIGHTED_SCORE) */}
      {customEvaluation.combinationMode === 'WEIGHTED_SCORE' && (
        <div className="space-y-2.5">
          {/* Buy Gauge */}
          <div className="bg-[#0b1017] border border-slate-800/80 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>BUY SCORE</span>
                {customEvaluation.buyScore >= customEvaluation.buyThreshold && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase tracking-wider font-bold">TRIGGERED</span>
                )}
              </span>
              <span className="text-slate-200 font-bold">
                {(customEvaluation.buyScore ?? 0).toFixed(0)} / {(customEvaluation.maxBuyScore ?? 0).toFixed(0)} pts
                <span className="text-slate-500 text-[10px] ml-1.5">(Req: {customEvaluation.buyThreshold})</span>
              </span>
            </div>
            <div className="w-full bg-slate-850/80 rounded-full h-2.5 overflow-hidden p-[1px] border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ob-glint-bar ${
                  customEvaluation.buyScore >= customEvaluation.buyThreshold ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#19E58C]' : 'bg-emerald-600/70'
                }`}
                style={{ width: `${buyProgress}%` }}
              />
            </div>
          </div>

          {/* Sell Gauge */}
          <div className="bg-[#0b1017] border border-slate-800/80 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>SELL SCORE</span>
                {customEvaluation.sellScore >= customEvaluation.sellThreshold && (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30 uppercase tracking-wider font-bold">TRIGGERED</span>
                )}
              </span>
              <span className="text-slate-200 font-bold">
                {(customEvaluation.sellScore ?? 0).toFixed(0)} / {(customEvaluation.maxSellScore ?? 0).toFixed(0)} pts
                <span className="text-slate-500 text-[10px] ml-1.5">(Req: {customEvaluation.sellThreshold})</span>
              </span>
            </div>
            <div className="w-full bg-slate-850/80 rounded-full h-2.5 overflow-hidden p-[1px] border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ob-glint-bar ${
                  customEvaluation.sellScore >= customEvaluation.sellThreshold ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_#FF4D67]' : 'bg-rose-600/70'
                }`}
                style={{ width: `${sellProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conditions Audit Checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Signal Factors &amp; Rule Checklist:
        </h4>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {/* BUY Conditions */}
          {customEvaluation.buyConditionResults.map((c, i) => (
            <div 
              key={`buy_${i}`}
              className={`p-2 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                c.isMet 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200' 
                  : 'bg-slate-950/40 border-slate-850 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {c.isMet ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-semibold ${c.isMet ? 'text-white' : 'text-slate-400'}`}>
                    [BUY] {c.description}
                  </span>
                  <span className={`font-bold shrink-0 ${c.isMet ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {c.isMet ? `+${c.pointsAwarded}` : '0'} pts
                  </span>
                </div>
                {c.details && <div className="text-[10px] text-slate-400 mt-0.5">{c.details}</div>}
              </div>
            </div>
          ))}

          {/* SELL Conditions */}
          {customEvaluation.sellConditionResults.map((c, i) => (
            <div 
              key={`sell_${i}`}
              className={`p-2 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                c.isMet 
                  ? 'bg-rose-950/30 border-rose-500/30 text-slate-200' 
                  : 'bg-slate-950/40 border-slate-850 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {c.isMet ? <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-semibold ${c.isMet ? 'text-white' : 'text-slate-400'}`}>
                    [SELL] {c.description}
                  </span>
                  <span className={`font-bold shrink-0 ${c.isMet ? 'text-rose-400' : 'text-slate-500'}`}>
                    {c.isMet ? `+${c.pointsAwarded}` : '0'} pts
                  </span>
                </div>
                {c.details && <div className="text-[10px] text-slate-400 mt-0.5">{c.details}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Toggle to view Default Multi-Factor Indicators */}
      {defaultScore && (
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowDefaultIndicators(!showDefaultIndicators)}
            className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Built-in Multi-Factor Indicators (RSI, EMA, Supertrend)</span>
            </span>
            {showDefaultIndicators ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDefaultIndicators && (
            <div className="mt-3">
              <StrategyScoreCard score={defaultScore} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
