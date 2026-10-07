import React from 'react';
import type { ActiveStrategyInfo } from '../types/customStrategy';
import { Sparkles, Sliders, RotateCcw, ArrowRight } from 'lucide-react';

interface ActiveStrategySelectorBannerProps {
  activeInfo: ActiveStrategyInfo | null;
  onDeactivate: () => void;
  onNavigateToCustomizer: () => void;
  isDeactivating?: boolean;
}

export const ActiveStrategySelectorBanner: React.FC<ActiveStrategySelectorBannerProps> = ({
  activeInfo,
  onDeactivate,
  onNavigateToCustomizer,
  isDeactivating = false,
}) => {
  const isCustom = activeInfo?.activeStrategyType === 'CUSTOM';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
      isCustom 
        ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/40 border-indigo-500/40' 
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isCustom 
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
              : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            {isCustom ? <Sliders className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Active Scoring Engine:
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                isCustom 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {isCustom ? 'CUSTOM STRATEGY ACTIVE' : 'DEFAULT STRATEGY (BUILT-IN)'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
              {isCustom 
                ? activeInfo?.activeCustomStrategyName || 'Custom Strategy' 
                : 'Multi-Factor Alpha (RSI + EMA + VWAP + Supertrend + Volume)'}
            </h3>

            <p className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              {isCustom ? (
                <>
                  <span>Mode: <strong className="text-slate-200">{activeInfo?.combinationMode || 'WEIGHTED_SCORE'}</strong></span>
                  <span>&bull;</span>
                  <span>Buy Threshold: <strong className="text-emerald-400">&gt;= {activeInfo?.buyThreshold} pts</strong></span>
                  <span>&bull;</span>
                  <span>Sell Threshold: <strong className="text-rose-400">&gt;= {activeInfo?.sellThreshold} pts</strong></span>
                </>
              ) : (
                <span>Original default model evaluates 5 quantitative indicators on -100 to +100 conviction scale.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isCustom && (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={isDeactivating}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50"
              title="Restore standard default multi-factor strategy"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDeactivating ? 'Switching...' : 'Switch to Default'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToCustomizer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md shadow-indigo-950/40"
          >
            <span>Strategy Customization</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
