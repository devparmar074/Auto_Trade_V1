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
    <div className={`ob-panel rounded-2xl border p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden ${
      isCustom 
        ? 'border-cyan-500/40 ob-glow-cyan' 
        : 'border-slate-800'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`p-2.5 rounded-xl border shrink-0 transition-transform ${
            isCustom 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(69,184,255,0.2)]' 
              : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            {isCustom ? <Sliders className="w-5 h-5 text-cyan-400" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Active Scoring Engine:
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                isCustom 
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' 
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCustom ? 'bg-cyan-400 ob-sonar-dot' : 'bg-emerald-400 ob-sonar-dot'}`} />
                {isCustom ? 'CUSTOM STRATEGY ACTIVE' : 'DEFAULT STRATEGY (BUILT-IN)'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-wide mt-1">
              {isCustom 
                ? activeInfo?.activeCustomStrategyName || 'Custom Strategy' 
                : 'Multi-Factor Alpha (RSI + EMA + VWAP + Supertrend + Volume)'}
            </h3>

            <p className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              {isCustom ? (
                <>
                  <span>Mode: <strong className="text-cyan-300">{activeInfo?.combinationMode || 'WEIGHTED_SCORE'}</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span>Buy Threshold: <strong className="text-[#19E58C]">&gt;= {activeInfo?.buyThreshold} pts</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span>Sell Threshold: <strong className="text-[#FF4D67]">&gt;= {activeInfo?.sellThreshold} pts</strong></span>
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
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 disabled:opacity-50"
              title="Restore standard default multi-factor strategy"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDeactivating ? 'Switching...' : 'Switch to Default'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToCustomizer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(69,184,255,0.25)] active:scale-95"
          >
            <span>Strategy Customization</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
