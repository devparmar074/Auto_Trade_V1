import React, { useState, useEffect } from 'react';
import type { BotConfig, BotMode } from '../types/trading';
import { updateBotConfig, triggerKillSwitch } from '../api/tradingApi';
import { 
  ShieldAlert, 
  Power, 
  Save, 
  AlertTriangle, 
  Cpu, 
  UserCheck, 
  BellRing
} from 'lucide-react';

interface RiskControlCardProps {
  config?: BotConfig;
  onConfigUpdated?: (newConfig: BotConfig) => void;
  onKillSwitchTriggered?: () => void;
}

export const RiskControlCard: React.FC<RiskControlCardProps> = ({ 
  config, 
  onConfigUpdated,
  onKillSwitchTriggered 
}) => {
  const [formData, setFormData] = useState<BotConfig | null>(config || null);
  const [saving, setSaving] = useState(false);
  const [killing, setKilling] = useState(false);
  const [liquidateOnKill, setLiquidateOnKill] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!formData) return null;

  const handleModeChange = (mode: BotMode) => {
    setFormData({ ...formData, botMode: mode });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedbackMsg(null);
      const updated = await updateBotConfig(formData);
      setFormData(updated);
      onConfigUpdated?.(updated);
      setFeedbackMsg({ text: 'Risk & Strategy configuration saved successfully!' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed saving configuration', error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleKillSwitch = async () => {
    if (!window.confirm(`ACTIVATE EMERGENCY KILL SWITCH?\n\nThis will immediately halt all automated bot trading.${liquidateOnKill ? '\nAND immediately liquidate any open position at market.' : ''}`)) {
      return;
    }

    try {
      setKilling(true);
      const res = await triggerKillSwitch(liquidateOnKill);
      setFormData(prev => prev ? { ...prev, botMode: 'Manual', isKillSwitchActive: true } : null);
      onKillSwitchTriggered?.();
      setFeedbackMsg({ text: res.message || 'KILL SWITCH ACTIVATED: Automated trading halted.' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed activating kill switch', error: true });
    } finally {
      setKilling(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Risk Management & Bot Mode</h3>
              <p className="text-xs text-slate-400 font-mono">Autonomous Execution & Circuit Breakers</p>
            </div>
          </div>

          {formData.isKillSwitchActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full text-xs font-bold font-mono animate-pulse">
              <Power className="w-3.5 h-3.5" />
              <span>KILL SWITCH ACTIVE</span>
            </div>
          )}
        </div>

        {/* Bot Operational Mode Selection */}
        <div className="my-4">
          <label className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
            Execution Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Manual */}
            <button
              type="button"
              onClick={() => handleModeChange('Manual')}
              className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                formData.botMode === 'Manual'
                  ? 'bg-slate-800 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual</span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Signals only. You execute all trades.
              </span>
            </button>

            {/* Semi-Auto */}
            <button
              type="button"
              onClick={() => handleModeChange('SemiAuto')}
              className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                formData.botMode === 'SemiAuto'
                  ? 'bg-amber-950/30 border-amber-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-400">
                <BellRing className="w-3.5 h-3.5" />
                <span>Semi-Auto</span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                1-Click popups on high-conviction signals.
              </span>
            </button>

            {/* Autonomous */}
            <button
              type="button"
              onClick={() => handleModeChange('FullyAutomated')}
              className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                formData.botMode === 'FullyAutomated'
                  ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>Autonomous</span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Hands-free execution within strict SL/TP bounds.
              </span>
            </button>
          </div>
        </div>

        {/* Parameter Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {/* Stop Loss % */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Stop-Loss (%)</span>
            <div className="flex items-center">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={formData.stopLossPercent}
                onChange={(e) => setFormData({ ...formData, stopLossPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-400 ml-1.5">%</span>
            </div>
          </div>

          {/* Take Profit % */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Take-Profit (%)</span>
            <div className="flex items-center">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="20"
                value={formData.takeProfitPercent}
                onChange={(e) => setFormData({ ...formData, takeProfitPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-400 ml-1.5">%</span>
            </div>
          </div>

          {/* Trailing Stop-Loss % */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Trailing SL (%)</span>
            <div className="flex items-center">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                value={formData.trailingStopPercent}
                onChange={(e) => setFormData({ ...formData, trailingStopPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-400 ml-1.5">%</span>
            </div>
          </div>

          {/* Max Daily Loss (Circuit Breaker) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Max Daily Loss</span>
            <div className="flex items-center">
              <span className="text-xs font-mono text-slate-400 mr-1">₹</span>
              <input
                type="number"
                step="50"
                min="100"
                max="10000"
                value={formData.dailyMaxLossAmount}
                onChange={(e) => setFormData({ ...formData, dailyMaxLossAmount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Base Order Qty */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Base Qty</span>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.baseQuantity}
              onChange={(e) => setFormData({ ...formData, baseQuantity: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Max Daily Orders */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Max Orders / Day</span>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.maxOrdersPerDay}
              onChange={(e) => setFormData({ ...formData, maxOrdersPerDay: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div className={`p-2.5 rounded-lg mb-3 text-xs font-mono flex items-center gap-2 ${
            feedbackMsg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Save Config & Emergency Kill Switch */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Risk Config'}</span>
        </button>

        {/* Kill Switch Controls */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={liquidateOnKill}
              onChange={(e) => setLiquidateOnKill(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
            />
            <span>Liquidate Position</span>
          </label>

          <button
            type="button"
            onClick={handleKillSwitch}
            disabled={killing}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition-colors disabled:opacity-50"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{killing ? 'HALTING...' : 'KILL SWITCH'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
