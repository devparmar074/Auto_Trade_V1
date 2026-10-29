import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, AlertCircle, Coins, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { UpstoxFunds, BotConfig, LtpQuote } from '../types/trading';
import { fetchFunds } from '../api/tradingApi';

interface FundsCardProps {
  quote?: LtpQuote | null;
  config?: BotConfig;
  onFundsUpdated?: (funds: UpstoxFunds) => void;
}

export const FundsCard: React.FC<FundsCardProps> = ({ quote, config, onFundsUpdated }) => {
  const [funds, setFunds] = useState<UpstoxFunds | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFunds();
      setFunds(data);
      onFundsUpdated?.(data);
    } catch (err: any) {
      setError(err.message || 'Failed fetching Upstox funds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
    // Poll funds every 30 seconds
    const interval = setInterval(loadFunds, 30000);
    return () => clearInterval(interval);
  }, []);

  const availableMargin = funds?.availableMargin ?? 0;
  const usedMargin = funds?.usedMargin ?? 0;
  const ltp = quote?.ltp ?? 0;

  // Sizing calculations
  const isDynamicEnabled = config?.useDynamicCapitalSizing ?? true;
  const allocPercent = (config?.capitalAllocationPercent ?? 90) / 100;
  const maxCapSetting = config?.maxCapitalPerTrade ?? 1000;
  const deployableCapital = maxCapSetting > 0 ? Math.min(availableMargin, maxCapSetting) : availableMargin;
  const usableCapital = deployableCapital * allocPercent;
  
  const dynamicQty = ltp > 0 ? Math.floor(usableCapital / ltp) : 0;
  const maxQtyCap = config?.maxQuantity ?? 10;
  const finalCalculatedQty = maxQtyCap > 0 ? Math.min(dynamicQty, maxQtyCap) : dynamicQty;
  const totalCost = finalCalculatedQty * ltp;
  const isSafe = totalCost <= availableMargin;

  return (
    <div className="ob-panel rounded-2xl p-5 shadow-2xl flex flex-col justify-between border border-slate-800 relative overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl shadow-[0_0_15px_rgba(69,184,255,0.15)]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-wide">Upstox Account Funds</h3>
                {funds?.isLive ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ob-sonar-dot"></span>
                    LIVE SYNC
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-mono">
                    OFFLINE / ZERO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Real-time Margin & Capital Guard Telemetry</p>
            </div>
          </div>

          <button
            onClick={loadFunds}
            disabled={loading}
            title="Refresh funds from Upstox"
            className="p-2 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 bg-[#0b1017] border border-slate-800/80 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Available Margin</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(25,229,140,0.3)]">
                ₹{availableMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Deployable trading capital</span>
          </div>

          <div className="p-3.5 bg-[#0b1017] border border-slate-800/80 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Used Margin</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-200">
                ₹{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Locked in open positions</span>
          </div>
        </div>

        {/* Dynamic Position Sizing Calculation Preview */}
        <div className="p-4 bg-[#0a0f18] border border-cyan-500/20 rounded-xl relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span>DYNAMIC MONEY SIZING PREVIEW</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              isDynamicEnabled ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {isDynamicEnabled ? 'AUTO-SIZING ACTIVE' : 'MANUAL BASE QTY'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Allocated Capital ({(config?.capitalAllocationPercent ?? 90)}%):</span>
              <span className="text-slate-200 font-semibold">₹{usableCapital.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Vodafone Idea LTP:</span>
              <span className="text-slate-200 font-semibold">{ltp > 0 ? `₹${ltp.toFixed(2)}` : 'Waiting quote...'}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-800/80">
              <span className="text-cyan-300 font-bold">Auto-Calculated Qty:</span>
              <span className="text-cyan-400 font-bold text-sm drop-shadow-[0_0_6px_rgba(69,184,255,0.4)]">
                {isDynamicEnabled ? `${finalCalculatedQty} shares` : `${config?.baseQuantity ?? 1} shares (Manual)`}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Estimated Cost:</span>
              <span className="text-slate-200 font-semibold">₹{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono">
            {isSafe ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Capital safety guard: Order cost &le; Available Funds</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Warning: Order cost exceeds available funds!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/60">
        <span>Broker: Upstox SEC (Equity)</span>
        <span>Updated: {funds?.retrievedAtUtc ? new Date(funds.retrievedAtUtc).toLocaleTimeString() : 'N/A'}</span>
      </div>
    </div>
  );
};
