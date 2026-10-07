import React, { useEffect, useState } from 'react';
import type { 
  CustomStrategy, 
  StrategyCondition, 
  CombinationMode,
  ActiveStrategyInfo, 
  CustomStrategyEvaluationResult 
} from '../types/customStrategy';
import { 
  fetchCustomStrategies, 
  fetchCustomStrategyById, 
  saveCustomStrategy, 
  deleteCustomStrategy, 
  duplicateCustomStrategy, 
  activateCustomStrategy, 
  deactivateCustomStrategy, 
  evaluateCustomStrategy 
} from '../api/customStrategyApi';
import { ConditionRowEditor } from './ConditionRowEditor';
import { StrategyEvaluationPreview } from './StrategyEvaluationPreview';
import { 
  Sliders, 
  Plus, 
  Save, 
  Copy, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface StrategyCustomizationScreenProps {
  activeStrategyInfo: ActiveStrategyInfo | null;
  onActiveStrategyChanged: (info: ActiveStrategyInfo) => void;
  onBackToTerminal: () => void;
}

export const StrategyCustomizationScreen: React.FC<StrategyCustomizationScreenProps> = ({
  activeStrategyInfo,
  onActiveStrategyChanged,
  onBackToTerminal
}) => {
  const [strategies, setStrategies] = useState<CustomStrategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<CustomStrategy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<CustomStrategyEvaluationResult | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all presets on mount
  const loadStrategies = async (selectId?: number) => {
    setIsLoading(true);
    try {
      const list = await fetchCustomStrategies();
      setStrategies(list);

      const targetId = selectId ?? (activeStrategyInfo?.activeCustomStrategyId ?? list[0]?.id);
      if (targetId) {
        await loadStrategyDetails(targetId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed loading custom strategy presets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStrategyDetails = async (id: number) => {
    try {
      const data = await fetchCustomStrategyById(id);
      setSelectedStrategyId(id);
      setStrategy(data);
      // Run preview evaluation immediately
      runPreview(data);
    } catch (err: any) {
      setErrorMessage(err.message || `Failed loading strategy #${id}`);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const runPreview = async (targetStrategy?: CustomStrategy) => {
    const s = targetStrategy || strategy;
    if (!s) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateCustomStrategy(s);
      setEvaluationResult(result);
    } catch (err: any) {
      console.warn('Evaluation simulation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCreateNew = () => {
    const newTemplate: CustomStrategy = {
      id: 0,
      strategyName: 'My Custom Strategy',
      description: 'Custom combination of Moving Averages, PCR, and Bollinger Bands',
      isActive: false,
      combinationMode: 'WEIGHTED_SCORE',
      buyThreshold: 60,
      sellThreshold: 30,
      buyConditions: [
        {
          id: `c_${Date.now()}_1`,
          indicator: 'MovingAverage',
          conditionType: 'PriceGreaterThanMa',
          targetSignal: 'BUY',
          isEnabled: true,
          weight: 30,
          maType: 'SMA',
          period: 20
        },
        {
          id: `c_${Date.now()}_2`,
          indicator: 'PCR',
          conditionType: 'PcrGreaterThan',
          targetSignal: 'BUY',
          isEnabled: true,
          weight: 30,
          thresholdValue: 1.0
        }
      ],
      sellConditions: [
        {
          id: `c_${Date.now()}_3`,
          indicator: 'MovingAverage',
          conditionType: 'PriceLessThanMa',
          targetSignal: 'SELL',
          isEnabled: true,
          weight: 30,
          maType: 'SMA',
          period: 20
        }
      ]
    };
    setSelectedStrategyId(0);
    setStrategy(newTemplate);
    runPreview(newTemplate);
  };

  const handleSave = async () => {
    if (!strategy) return;
    if (!strategy.strategyName.trim()) {
      setErrorMessage('Please provide a name for this strategy');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const saved = await saveCustomStrategy(strategy);
      setSuccessToast(`Strategy "${saved.strategyName}" saved successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
      await loadStrategies(saved.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed saving strategy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!strategy || !strategy.id) return;
    try {
      const copy = await duplicateCustomStrategy(strategy.id);
      setSuccessToast(`Strategy duplicated as "${copy.strategyName}"`);
      setTimeout(() => setSuccessToast(null), 5000);
      await loadStrategies(copy.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed duplicating strategy');
    }
  };

  const handleDelete = async () => {
    if (!strategy || !strategy.id) return;
    if (!confirm(`Are you sure you want to delete strategy "${strategy.strategyName}"?`)) return;

    try {
      await deleteCustomStrategy(strategy.id);
      setSuccessToast(`Strategy deleted.`);
      setTimeout(() => setSuccessToast(null), 5000);
      await loadStrategies();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed deleting strategy');
    }
  };

  const handleActivate = async () => {
    if (!strategy || !strategy.id) {
      setErrorMessage('Please save the strategy before activating.');
      return;
    }
    try {
      const info = await activateCustomStrategy(strategy.id);
      onActiveStrategyChanged(info);
      setSuccessToast(`Strategy "${strategy.strategyName}" is now the ACTIVE scoring engine!`);
      setTimeout(() => setSuccessToast(null), 5000);
      await loadStrategies(strategy.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed activating strategy');
    }
  };

  const handleDeactivate = async () => {
    try {
      const info = await deactivateCustomStrategy();
      onActiveStrategyChanged(info);
      setSuccessToast('Switched back to Default Strategy (Built-in Multi-Factor).');
      setTimeout(() => setSuccessToast(null), 5000);
      if (strategy) {
        await loadStrategies(strategy.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed returning to default strategy');
    }
  };

  const handleAddCondition = (targetSignal: 'BUY' | 'SELL') => {
    if (!strategy) return;
    const newCond: StrategyCondition = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      indicator: 'MovingAverage',
      conditionType: targetSignal === 'BUY' ? 'PriceGreaterThanMa' : 'PriceLessThanMa',
      targetSignal,
      isEnabled: true,
      weight: 20,
      maType: 'SMA',
      period: 20
    };

    const updated = {
      ...strategy,
      [targetSignal === 'BUY' ? 'buyConditions' : 'sellConditions']: [
        ...(targetSignal === 'BUY' ? strategy.buyConditions : strategy.sellConditions),
        newCond
      ]
    };
    setStrategy(updated);
    runPreview(updated);
  };

  const handleUpdateCondition = (targetSignal: 'BUY' | 'SELL', updatedCond: StrategyCondition) => {
    if (!strategy) return;
    const listKey = targetSignal === 'BUY' ? 'buyConditions' : 'sellConditions';
    const updated = {
      ...strategy,
      [listKey]: strategy[listKey].map((c) => (c.id === updatedCond.id ? updatedCond : c))
    };
    setStrategy(updated);
    runPreview(updated);
  };

  const handleDeleteCondition = (targetSignal: 'BUY' | 'SELL', conditionId: string) => {
    if (!strategy) return;
    const listKey = targetSignal === 'BUY' ? 'buyConditions' : 'sellConditions';
    const updated = {
      ...strategy,
      [listKey]: strategy[listKey].filter((c) => c.id !== conditionId)
    };
    setStrategy(updated);
    runPreview(updated);
  };

  const isCurrentActive = activeStrategyInfo?.activeStrategyType === 'CUSTOM' && 
                          activeStrategyInfo?.activeCustomStrategyId === strategy?.id;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Navigation & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToTerminal}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trading Terminal</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">STRATEGY CUSTOMIZATION</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                COMBINATION BUILDER
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Build &amp; backtest rules with Moving Averages, PCR, and Bollinger Bands with weighted scoring or Boolean logic.
            </p>
          </div>
        </div>

        {/* Global Strategy Status Indicator */}
        <div className="flex items-center gap-2">
          {activeStrategyInfo?.activeStrategyType === 'CUSTOM' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs font-mono text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Active: <strong>{activeStrategyInfo.activeCustomStrategyName}</strong></span>
              <button
                type="button"
                onClick={handleDeactivate}
                className="ml-2 text-amber-400 hover:text-amber-300 underline font-bold"
                title="Restore default strategy"
              >
                Revert Default
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Active: <strong>Default Multi-Factor Strategy</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successToast && (
        <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Toolbar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-[280px] flex-1">
            <Sliders className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="flex-1">
              <label className="block text-[11px] font-mono text-slate-400 mb-1 font-bold">
                SELECT SAVED PRESET / STRATEGY:
              </label>
              <select
                value={selectedStrategyId ?? ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  if (id) loadStrategyDetails(id);
                }}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.strategyName} {s.id === activeStrategyInfo?.activeCustomStrategyId ? '(ACTIVE)' : ''}
                  </option>
                ))}
                {selectedStrategyId === 0 && (
                  <option value={0}>* [New Unsaved Strategy]</option>
                )}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New</span>
            </button>

            {strategy && strategy.id > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all"
                  title="Duplicate as new preset"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all"
                  title="Delete preset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !strategy}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Preset'}</span>
            </button>

            {strategy && strategy.id > 0 && (
              isCurrentActive ? (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-mono font-bold transition-all shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deactivate (Use Default)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActivate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md shadow-indigo-950/40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set as Active Strategy</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {strategy && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Configuration & Rule Builders */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Strategy Meta & Combination Mode */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>1. General Strategy Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">STRATEGY NAME</label>
                  <input
                    type="text"
                    value={strategy.strategyName}
                    onChange={(e) => setStrategy({ ...strategy, strategyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">COMBINATION LOGIC</label>
                  <select
                    value={strategy.combinationMode}
                    onChange={(e) => {
                      const updated = { ...strategy, combinationMode: e.target.value as CombinationMode };
                      setStrategy(updated);
                      runPreview(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="WEIGHTED_SCORE">WEIGHTED SCORE (Score threshold required)</option>
                    <option value="AND_LOGIC">AND LOGIC (All conditions must be met)</option>
                    <option value="OR_LOGIC">OR LOGIC (Any condition triggers signal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  value={strategy.description || ''}
                  onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
                  placeholder="Optional brief description of this trading rationale..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {strategy.combinationMode === 'WEIGHTED_SCORE' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-400 mb-1 font-bold">
                      BUY SCORE THRESHOLD (MIN PTS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={strategy.buyThreshold}
                      onChange={(e) => {
                        const updated = { ...strategy, buyThreshold: parseFloat(e.target.value) || 60 };
                        setStrategy(updated);
                        runPreview(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      Total points required from met BUY rules to trigger a BUY signal.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-rose-400 mb-1 font-bold">
                      SELL SCORE THRESHOLD (MIN PTS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={strategy.sellThreshold}
                      onChange={(e) => {
                        const updated = { ...strategy, sellThreshold: parseFloat(e.target.value) || 30 };
                        setStrategy(updated);
                        runPreview(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-500 font-bold"
                    />
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      Total points required from met SELL rules to trigger a SELL signal.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BUY Conditions Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <span>2. BUY Signal Rules</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {strategy.buyConditions.length} Rules
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Conditions contributing points towards BUY conviction.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCondition('BUY')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Buy Rule</span>
                </button>
              </div>

              {strategy.buyConditions.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono text-slate-500">
                  No BUY rules defined yet. Click "Add Buy Rule" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {strategy.buyConditions.map((cond) => (
                    <ConditionRowEditor
                      key={cond.id}
                      condition={cond}
                      targetSignal="BUY"
                      onChange={(updated) => handleUpdateCondition('BUY', updated)}
                      onDelete={() => handleDeleteCondition('BUY', cond.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SELL Conditions Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <span>3. SELL Signal Rules</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {strategy.sellConditions.length} Rules
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Conditions contributing points towards SELL conviction.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCondition('SELL')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-mono font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sell Rule</span>
                </button>
              </div>

              {strategy.sellConditions.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono text-slate-500">
                  No SELL rules defined yet. Click "Add Sell Rule" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {strategy.sellConditions.map((cond) => (
                    <ConditionRowEditor
                      key={cond.id}
                      condition={cond}
                      targetSignal="SELL"
                      onChange={(updated) => handleUpdateCondition('SELL', updated)}
                      onDelete={() => handleDeleteCondition('SELL', cond.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Live Preview & Strategy Evaluation Output */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <StrategyEvaluationPreview
              evaluation={evaluationResult}
              isLoading={isEvaluating}
              onEvaluate={() => runPreview(strategy)}
            />

            {/* Indicator Reference Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-xs font-mono space-y-3">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Supported Indicator Handbook</span>
              </h4>

              <div className="space-y-2 text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <strong className="text-indigo-300">Moving Averages (SMA / EMA):</strong>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Calculate dynamic price trends. Supports Price vs MA, Fast vs Slow crossovers, Golden Cross (50 &gt; 200), and Death Cross (50 &lt; 200).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <strong className="text-sky-300">Put-Call Ratio (PCR):</strong>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Option chain sentiment indicator (&gt;1.0 typically indicates bullish bias; &lt;0.8 indicates bearish bias). Supports thresholds and trend slope.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <strong className="text-purple-300">Bollinger Bands (BB):</strong>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Volatility bands based on 20 SMA &plusmn; 2 Std Dev. Detects oversold touches on lower band, overbought reaches on upper band, middle band crossovers, and band squeeze breakouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
