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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Upstox Account Funds</h3>
                {funds?.isLive ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE SYNC
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-mono">
                    OFFLINE / ZERO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">Real-time Margin & Capital Guard</p>
            </div>
          </div>

          <button
            onClick={loadFunds}
            disabled={loading}
            title="Refresh funds from Upstox"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Available Margin</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">
                ₹{availableMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Deployable trading capital</span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Used Margin</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-200">
                ₹{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Locked in open positions</span>
          </div>
        </div>

        {/* Dynamic Position Sizing Calculation Preview */}
        <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 font-mono">
              <Coins className="w-3.5 h-3.5" />
              <span>DYNAMIC MONEY SIZING PREVIEW</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isDynamicEnabled ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
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
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-indigo-300 font-bold">Auto-Calculated Qty:</span>
              <span className="text-indigo-400 font-bold text-sm">
                {isDynamicEnabled ? `${finalCalculatedQty} shares` : `${config?.baseQuantity ?? 1} shares (Manual)`}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Estimated Cost:</span>
              <span className="text-slate-200 font-semibold">₹{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] font-mono">
            {isSafe ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Capital safety guard: Order cost &le; Available Funds</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Warning: Order cost exceeds available funds!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>Broker: Upstox SEC (Equity)</span>
        <span>Updated: {funds?.retrievedAtUtc ? new Date(funds.retrievedAtUtc).toLocaleTimeString() : 'N/A'}</span>
      </div>
    </div>
  );
};
