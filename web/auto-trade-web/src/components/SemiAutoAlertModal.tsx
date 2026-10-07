import React from 'react';
import type { RiskAlert, StrategyScore } from '../types/trading';
import { XCircle, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react';

interface SemiAutoAlertModalProps {
  score?: StrategyScore;
  riskAlert?: RiskAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (type: 'BUY' | 'SELL', qty: number) => Promise<void>;
  isExecuting?: boolean;
}

export const SemiAutoAlertModal: React.FC<SemiAutoAlertModalProps> = ({
  score,
  riskAlert,
  isOpen,
  onClose,
  onExecute,
  isExecuting = false
}) => {
  if (!isOpen) return null;

  // Is this a risk alert (Stop Loss / Take Profit) or a strategy signal?
  const isRiskAlert = !!riskAlert;
  const isBuy = !isRiskAlert && score ? score.score >= 50 : false;

  const actionType = isBuy ? 'BUY' : 'SELL';
  const quantity = score?.recommendedQuantity || 1;

  const handleExecute = async () => {
    await onExecute(actionType, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${
            isRiskAlert 
              ? 'bg-rose-500/20 text-rose-400' 
              : isBuy 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isRiskAlert ? 'Risk Trigger Alert' : 'Semi-Auto Signal Detected'}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Vodafone Idea (IDEA) • Real-time Execution Prompt
            </p>
          </div>
        </div>

        {/* Alert Details */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5">
          {isRiskAlert ? (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-rose-400 font-bold">
                <span>Alert Type:</span>
                <span>{riskAlert?.alertType}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Current Price:</span>
                <span className="font-bold">₹{riskAlert?.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Trigger Price:</span>
                <span className="font-bold">₹{riskAlert?.triggerPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Unrealized P&L:</span>
                <span className={`font-bold ${(riskAlert?.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{riskAlert?.pnl.toFixed(2)}
                </span>
              </div>
              <p className="text-slate-400 pt-2 border-t border-slate-800 text-[11px]">
                {riskAlert?.message}
              </p>
            </div>
          ) : score ? (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recommendation:</span>
                <span className={`font-bold ${isBuy ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {score.recommendationText} ({score.score > 0 ? `+${score.score}` : score.score})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Market Price:</span>
                <span className="font-bold">₹{score.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Recommended Order:</span>
                <span className="font-bold text-white">{actionType} {quantity} shares</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <span>RSI: {score.indicators?.rsi != null ? score.indicators.rsi.toFixed(1) : '--'}</span>
                <span>VWAP: ₹{score.indicators?.vwap != null ? score.indicators.vwap.toFixed(2) : '--'}</span>
                <span>Supertrend: {score.indicators?.supertrendDirection || '--'}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-semibold transition-colors"
          >
            Ignore & Dismiss
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-lg ${
              actionType === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
            } disabled:opacity-50`}
          >
            {actionType === 'BUY' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{isExecuting ? 'Submitting...' : `1-Click ${actionType}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
