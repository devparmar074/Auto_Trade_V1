import React from 'react';
import type { CustomStrategyEvaluationResult } from '../types/customStrategy';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  Info
} from 'lucide-react';

interface StrategyEvaluationPreviewProps {
  evaluation: CustomStrategyEvaluationResult | null;
  isLoading?: boolean;
  onEvaluate?: () => void;
}

export const StrategyEvaluationPreview: React.FC<StrategyEvaluationPreviewProps> = ({
  evaluation,
  isLoading = false,
  onEvaluate
}) => {
  if (!evaluation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-lg">
        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-sm font-bold text-white mb-1">Live Strategy Simulation &amp; Preview</h4>
        <p className="text-xs font-mono text-slate-400 mb-4 max-w-md mx-auto">
          Test your strategy rules against live real-time market data to see calculated scores and rule-by-rule checklist.
        </p>
        {onEvaluate && (
          <button
            type="button"
            onClick={onEvaluate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Simulating Engine...' : 'Run Live Simulation'}</span>
          </button>
        )}
      </div>
    );
  }

  const isBuy = evaluation.signal === 'BUY';
  const isSell = evaluation.signal === 'SELL';
  const isHold = evaluation.signal === 'HOLD';

  const buyProgress = evaluation.maxBuyScore > 0 
    ? Math.min(100, Math.round((evaluation.buyScore / evaluation.maxBuyScore) * 100)) 
    : 0;

  const sellProgress = evaluation.maxSellScore > 0 
    ? Math.min(100, Math.round((evaluation.sellScore / evaluation.maxSellScore) * 100)) 
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white">Live Engine Output Preview</h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {evaluation.combinationMode}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Evaluated on IDEA @ ₹{evaluation.currentPrice != null ? evaluation.currentPrice.toFixed(2) : '--'} &bull; {evaluation.evaluatedAtUtc ? new Date(evaluation.evaluatedAtUtc).toLocaleTimeString() : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Signal Badge */}
          <div className={`px-4 py-1.5 rounded-xl font-mono font-black text-sm tracking-wider border flex items-center gap-2 shadow-lg ${
            isBuy 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40' 
              : isSell 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/40' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-950/20'
          }`}>
            {isBuy && <TrendingUp className="w-4 h-4" />}
            {isSell && <TrendingDown className="w-4 h-4" />}
            {isHold && <Minus className="w-4 h-4" />}
            <span>SIGNAL: {evaluation.signal}</span>
          </div>

          {onEvaluate && (
            <button
              type="button"
              onClick={onEvaluate}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              title="Re-run simulation against newest quote"
            >
              <Play className="w-3 h-3 text-indigo-400" />
              <span>{isLoading ? 'Running...' : 'Re-evaluate'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Score Bars (for WEIGHTED_SCORE) */}
      {evaluation.combinationMode === 'WEIGHTED_SCORE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buy Score Gauge */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>BUY SCORE</span>
                {evaluation.buyScore >= evaluation.buyThreshold && (
                  <span className="text-[10px] bg-emerald-500/20 px-1 rounded">MET</span>
                )}
              </span>
              <span className="text-slate-300 font-bold">
                {(evaluation.buyScore ?? 0).toFixed(0)} / {(evaluation.maxBuyScore ?? 0).toFixed(0)} pts
                <span className="text-slate-500 text-[11px] ml-1">(Req: {evaluation.buyThreshold})</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  evaluation.buyScore >= evaluation.buyThreshold ? 'bg-emerald-400' : 'bg-emerald-600/70'
                }`}
                style={{ width: `${buyProgress}%` }}
              />
            </div>
          </div>

          {/* Sell Score Gauge */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span>SELL SCORE</span>
                {evaluation.sellScore >= evaluation.sellThreshold && (
                  <span className="text-[10px] bg-rose-500/20 px-1 rounded">MET</span>
                )}
              </span>
              <span className="text-slate-300 font-bold">
                {(evaluation.sellScore ?? 0).toFixed(0)} / {(evaluation.maxSellScore ?? 0).toFixed(0)} pts
                <span className="text-slate-500 text-[11px] ml-1">(Req: {evaluation.sellThreshold})</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  evaluation.sellScore >= evaluation.sellThreshold ? 'bg-rose-400' : 'bg-rose-600/70'
                }`}
                style={{ width: `${sellProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Logic Mode Explanation */}
      {evaluation.combinationMode !== 'WEIGHTED_SCORE' && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs font-mono flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            {evaluation.combinationMode === 'AND_LOGIC' 
              ? 'AND LOGIC: Every single enabled rule in the category must be satisfied simultaneously.' 
              : 'OR LOGIC: Any single enabled rule in the category will trigger the signal.'}
          </span>
        </div>
      )}

      {/* Conditions Breakdown / Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buy Rules Checklist */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>BUY RULES AUDIT</span>
              <span className="text-slate-500 font-normal">({evaluation.buyConditionResults.length})</span>
            </h5>
            <span className="text-xs font-mono text-slate-400">
              Total Points: <strong className="text-emerald-400">{evaluation.buyScore}</strong>
            </span>
          </div>

          {evaluation.buyConditionResults.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic py-2">No BUY conditions configured.</p>
          ) : (
            <div className="space-y-2.5">
              {evaluation.buyConditionResults.map((cond, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 transition-colors ${
                    cond.isMet 
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200' 
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {cond.isMet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold ${cond.isMet ? 'text-white' : 'text-slate-400'}`}>
                        {cond.description}
                      </span>
                      <span className={`font-bold shrink-0 ${cond.isMet ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {cond.isMet ? `+${cond.pointsAwarded}` : '0'} pts
                      </span>
                    </div>
                    {cond.details && (
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {cond.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sell Rules Checklist */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h5 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>SELL RULES AUDIT</span>
              <span className="text-slate-500 font-normal">({evaluation.sellConditionResults.length})</span>
            </h5>
            <span className="text-xs font-mono text-slate-400">
              Total Points: <strong className="text-rose-400">{evaluation.sellScore}</strong>
            </span>
          </div>

          {evaluation.sellConditionResults.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic py-2">No SELL conditions configured.</p>
          ) : (
            <div className="space-y-2.5">
              {evaluation.sellConditionResults.map((cond, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 transition-colors ${
                    cond.isMet 
                      ? 'bg-rose-950/30 border-rose-500/30 text-slate-200' 
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {cond.isMet ? (
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold ${cond.isMet ? 'text-white' : 'text-slate-400'}`}>
                        {cond.description}
                      </span>
                      <span className={`font-bold shrink-0 ${cond.isMet ? 'text-rose-400' : 'text-slate-500'}`}>
                        {cond.isMet ? `+${cond.pointsAwarded}` : '0'} pts
                      </span>
                    </div>
                    {cond.details && (
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {cond.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Explanation Bullets */}
      {evaluation.explanations.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs font-mono text-slate-400 font-bold block mb-1.5 uppercase">
            Signal Rationale Summary:
          </span>
          <ul className="space-y-1 text-xs font-mono text-slate-300 list-disc list-inside">
            {evaluation.explanations.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
