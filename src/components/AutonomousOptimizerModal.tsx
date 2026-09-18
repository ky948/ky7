import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Sliders,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Activity,
  Cpu,
  Scale,
} from 'lucide-react';
import { AutonomousStrategyGeneratorArena } from './AutonomousStrategyGeneratorArena';
import {
  GridStrategyConfig,
  BacktestResult,
  IncubatedStrategy,
  SoftwareComponent,
  StrategyConfig,
  CryptoAsset,
} from '../types';
import {
  fetchGridConfigs,
  updateGridConfig,
  runBacktest,
  fetchIncubatedStrategies,
  generateNewStrategy,
  promoteIncubatedStrategy,
  scanStrategyDegradation,
  fetchSoftwareComponents,
  toggleSoftwareComponent,
} from '../services/api';

interface AutonomousOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategies: StrategyConfig[];
  assets: CryptoAsset[];
  selectedSymbol: string;
  initialTab?: 'STRATEGY_ARENA' | 'GRID' | 'BACKTEST' | 'INCUBATOR' | 'COMPONENTS';
  onUpdateStrategyParams?: (strategyId: string, params: Partial<StrategyConfig>) => void;
  onNotification?: (msg: string, type: 'SUCCESS' | 'ERROR' | 'WARNING') => void;
}

export const AutonomousOptimizerModal: React.FC<AutonomousOptimizerModalProps> = ({
  isOpen,
  onClose,
  strategies,
  assets,
  selectedSymbol,
  initialTab = 'STRATEGY_ARENA',
  onUpdateStrategyParams,
  onNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'STRATEGY_ARENA' | 'GRID' | 'BACKTEST' | 'INCUBATOR' | 'COMPONENTS'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Grid state
  const [gridSymbol, setGridSymbol] = useState(selectedSymbol || 'BTC/USDT');
  const [gridConfigs, setGridConfigs] = useState<Record<string, GridStrategyConfig>>({});
  const [gridLower, setGridLower] = useState<number>(91000);
  const [gridUpper, setGridUpper] = useState<number>(97000);
  const [gridCount, setGridCount] = useState<number>(12);
  const [profitPerGrid, setProfitPerGrid] = useState<number>(0.55);
  const [gridMargin, setGridMargin] = useState<number>(15000);
  const [autoAtr, setAutoAtr] = useState<boolean>(true);
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [isGridSaving, setIsGridSaving] = useState(false);

  // Backtest state
  const [btStrategy, setBtStrategy] = useState<string>(strategies[0]?.id || 'EMA_MOMENTUM_BREAKOUT');
  const [btSymbol, setBtSymbol] = useState(selectedSymbol || 'BTC/USDT');
  const [btStopLoss, setBtStopLoss] = useState(1.8);
  const [btTakeProfit, setBtTakeProfit] = useState(3.6);
  const [btTrailingStop, setBtTrailingStop] = useState(2.0);
  const [btLookback, setBtLookback] = useState(120);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Incubator state
  const [incubated, setIncubated] = useState<IncubatedStrategy[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Components state
  const [components, setComponents] = useState<SoftwareComponent[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadGridData();
      loadIncubatorData();
      loadComponentsData();
    }
  }, [isOpen, gridSymbol]);

  const loadGridData = async () => {
    try {
      const res = await fetchGridConfigs();
      if (res.gridConfigs) {
        setGridConfigs(res.gridConfigs);
        const current = res.gridConfigs[gridSymbol];
        if (current) {
          setGridLower(current.lowerPrice);
          setGridUpper(current.upperPrice);
          setGridCount(current.gridLevelsCount);
          setProfitPerGrid(current.profitPerGridPercent);
          setGridMargin(current.allocatedMarginUsdt);
          setAutoAtr(current.autoAdjustWithAtr);
          setGridEnabled(current.enabled);
        } else {
          const asset = assets.find((a) => a.symbol === gridSymbol);
          const p = asset ? asset.price : 94000;
          setGridLower(Number((p * 0.96).toFixed(1)));
          setGridUpper(Number((p * 1.04).toFixed(1)));
        }
      }
    } catch {
      // transient
    }
  };

  const loadIncubatorData = async () => {
    try {
      const res = await fetchIncubatedStrategies();
      if (res.incubatedStrategies) setIncubated(res.incubatedStrategies);
    } catch {
      // transient
    }
  };

  const loadComponentsData = async () => {
    try {
      const res = await fetchSoftwareComponents();
      if (res.softwareComponents) setComponents(res.softwareComponents);
    } catch {
      // transient
    }
  };

  const handleSaveGrid = async () => {
    setIsGridSaving(true);
    try {
      const res = await updateGridConfig({
        symbol: gridSymbol,
        enabled: gridEnabled,
        lowerPrice: Number(gridLower),
        upperPrice: Number(gridUpper),
        gridLevelsCount: Number(gridCount),
        profitPerGridPercent: Number(profitPerGrid),
        autoAdjustWithAtr: autoAtr,
        allocatedMarginUsdt: Number(gridMargin),
      });
      if (res.success) {
        setGridConfigs((prev) => ({ ...prev, [gridSymbol]: res.gridConfig }));
        onNotification?.(`Grid strategy for ${gridSymbol} updated and rebalanced successfully.`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to update grid', 'ERROR');
    } finally {
      setIsGridSaving(false);
    }
  };

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await runBacktest({
        strategyId: btStrategy,
        symbol: btSymbol,
        lookbackCandles: Number(btLookback),
        stopLossPercent: Number(btStopLoss),
        takeProfitPercent: Number(btTakeProfit),
        trailingStopMultiplier: Number(btTrailingStop),
      });
      setBacktestResult(res);
      onNotification?.(`Walk-forward backtest completed: Sharpe ${res.sharpeRatio}, Win Rate ${res.winRate}%.`, 'SUCCESS');
    } catch (err: any) {
      onNotification?.(err.message || 'Backtest failed', 'ERROR');
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleApplyOptimal = () => {
    if (!backtestResult?.optimalParameters) return;
    const { stopLossPercent, takeProfitPercent, trailingStopMultiplier, recommendedAllocationPercent } = backtestResult.optimalParameters;
    onUpdateStrategyParams?.(btStrategy, {
      stopLossPercent,
      takeProfitPercent,
      trailingStopAtrMultiplier: trailingStopMultiplier,
      allocationPercent: recommendedAllocationPercent,
    });
    onNotification?.(`Applied optimal parameters (SL: ${stopLossPercent}%, TP: ${takeProfitPercent}%, Alloc: ${recommendedAllocationPercent}%) to live strategy.`, 'SUCCESS');
  };

  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    try {
      const res = await generateNewStrategy({ type: 'ADAPTIVE_FACTOR', focus: 'PROFIT_MAXIMIZATION' });
      if (res.success) {
        setIncubated((prev) => [res.strategy, ...prev]);
        onNotification?.(`Generated new candidate strategy "${res.strategy.name}" for paper incubation.`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to synthesize strategy', 'ERROR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromote = async (id: string) => {
    try {
      const res = await promoteIncubatedStrategy(id);
      if (res.success) {
        setIncubated((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'PROMOTED_LIVE' } : s)));
        onNotification?.(`Strategy promoted to Live Execution roster.`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Promotion failed', 'ERROR');
    }
  };

  const handleDegradationScan = async () => {
    setIsScanning(true);
    try {
      const res = await scanStrategyDegradation();
      if (res.success) {
        setIncubated(res.incubatedStrategies);
        onNotification?.(`Degradation scan finished. ${res.actionsTaken} degraded strategies quarantined.`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Scan failed', 'ERROR');
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleComponent = async (id: string) => {
    try {
      const res = await toggleSoftwareComponent(id);
      if (res.success) {
        setComponents(res.softwareComponents);
        onNotification?.(`Component ${res.component.name} status updated to ${res.component.status}.`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Component update failed', 'ERROR');
    }
  };

  if (!isOpen) return null;

  const currentGrid = gridConfigs[gridSymbol];
  const assetPrice = assets.find((a) => a.symbol === gridSymbol)?.price || 94000;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b101d] border border-[#1e2a44] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#1c273e] flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-slate-100 tracking-tight">
                  AUTONOMOUS OPTIMIZATION & STRATEGY ENGINE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  OBJECTIVE: MAX SUSTAINABLE RISK-ADJUSTED PROFIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Self-tuning quantitative models, dynamic grid adaptation, paper-test incubation & non-critical hot updates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2 border-b border-[#1c273e] bg-[#0c1220] flex items-center gap-2 text-xs font-mono overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('STRATEGY_ARENA')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'STRATEGY_ARENA'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Strategy Generator & Arena</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[9px] font-mono border border-cyan-800">
              19 BLOCKS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GRID')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'GRID'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dynamic Grid Constructor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BACKTEST')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'BACKTEST'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Walk-Forward Backtest & Tuning</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INCUBATOR')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'INCUBATOR'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Strategy Incubator & Degradation</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPONENTS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'COMPONENTS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Validated Hot-Components</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200">
          {/* TAB 0: AI STRATEGY GENERATOR & OBJECTIVE PERFORMANCE ARENA */}
          {activeTab === 'STRATEGY_ARENA' && (
            <AutonomousStrategyGeneratorArena
              onNotification={(msg, type) => onNotification?.(msg, type === 'INFO' ? 'SUCCESS' : type)}
              onCandidatePromoted={(candidate) => {
                onUpdateStrategyParams?.('EMA_MOMENTUM_BREAKOUT', {
                  name: candidate.name,
                  stopLossPercent: candidate.parameters.stopLossPercent,
                  takeProfitPercent: candidate.parameters.takeProfitPercent,
                  trailingStopAtrMultiplier: candidate.parameters.trailingStopMultiplier,
                  allocationPercent: candidate.parameters.allocationPercent,
                });
              }}
            />
          )}

          {/* TAB 1: DYNAMIC GRID CONSTRUCTOR */}
          {activeTab === 'GRID' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Configuration Panel */}
                <div className="md:col-span-1 bg-[#101728] p-4 rounded-xl border border-[#1d2943] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-200">GRID PARAMETERS</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gridEnabled}
                        onChange={(e) => setGridEnabled(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className={gridEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                        {gridEnabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Asset Pair</label>
                    <select
                      value={gridSymbol}
                      onChange={(e) => setGridSymbol(e.target.value)}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      {assets.map((a) => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol} (${a.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Lower Price ($)</label>
                      <input
                        type="number"
                        value={gridLower}
                        onChange={(e) => setGridLower(Number(e.target.value))}
                        className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Upper Price ($)</label>
                      <input
                        type="number"
                        value={gridUpper}
                        onChange={(e) => setGridUpper(Number(e.target.value))}
                        className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Grid Levels (4-30)</label>
                      <input
                        type="number"
                        min="4"
                        max="30"
                        value={gridCount}
                        onChange={(e) => setGridCount(Number(e.target.value))}
                        className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Profit/Grid (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={profitPerGrid}
                        onChange={(e) => setProfitPerGrid(Number(e.target.value))}
                        className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Allocated Margin (USDT)</label>
                    <input
                      type="number"
                      value={gridMargin}
                      onChange={(e) => setGridMargin(Number(e.target.value))}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0e1424] border border-[#1a253d] space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAtr}
                        onChange={(e) => setAutoAtr(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className="text-[11px] text-cyan-300 font-semibold">Auto-Adjust with ATR Volatility</span>
                    </label>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Dynamically expands grid bands when ATR spikes and tightens during compression to prevent out-of-bounds slippage.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isGridSaving}
                    onClick={handleSaveGrid}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isGridSaving ? 'Rebalancing Grid...' : 'Deploy & Rebalance Grid'}</span>
                  </button>
                </div>

                {/* Grid Live Status & Ladder Preview */}
                <div className="md:col-span-2 bg-[#101728] p-4 rounded-xl border border-[#1d2943] flex flex-col font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{gridSymbol} ACTIVE GRID LADDER</span>
                      <span className="text-[10px] text-slate-400">Mid: ${assetPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400">Rounds: <strong className="text-slate-200">{currentGrid?.completedGridRounds || 0}</strong></span>
                      <span className="text-slate-400">Total Profit: <strong className="text-emerald-400">+${currentGrid?.totalGridProfitUsdt?.toFixed(2) || '0.00'}</strong></span>
                    </div>
                  </div>

                  {/* Grid Ladder Visualizer */}
                  <div className="flex-1 mt-3 overflow-y-auto max-h-[360px] pr-1 space-y-1">
                    {(currentGrid?.activeLevels || []).map((lvl) => {
                      const isSell = lvl.side === 'SELL';
                      const isNearMid = Math.abs(lvl.price - assetPrice) / assetPrice < 0.005;

                      return (
                        <div
                          key={lvl.level}
                          className={`flex items-center justify-between px-3 py-1.5 rounded text-[11px] border transition-colors ${
                            isNearMid
                              ? 'bg-amber-950/30 border-amber-500/50'
                              : isSell
                              ? 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                              : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-slate-500 text-[10px]">#{lvl.level}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isSell ? 'bg-rose-900/50 text-rose-200' : 'bg-emerald-900/50 text-emerald-200'
                              }`}
                            >
                              {lvl.side}
                            </span>
                            <span className="font-bold">${lvl.price.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-4 text-slate-400 text-[10px]">
                            <span>Size: {lvl.size}</span>
                            <span>Target: +{profitPerGrid}%</span>
                            <span className={lvl.filled ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                              {lvl.filled ? 'FILLED / RE-ARMED' : 'PLACED'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKTESTING ENGINE & PARAMETER TUNER */}
          {activeTab === 'BACKTEST' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#101728] p-4 rounded-xl border border-[#1d2943]">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Strategy</label>
                    <select
                      value={btStrategy}
                      onChange={(e) => setBtStrategy(e.target.value)}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      {strategies.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Symbol</label>
                    <select
                      value={btSymbol}
                      onChange={(e) => setBtSymbol(e.target.value)}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      {assets.map((a) => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Stop Loss %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={btStopLoss}
                      onChange={(e) => setBtStopLoss(Number(e.target.value))}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Take Profit %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={btTakeProfit}
                      onChange={(e) => setBtTakeProfit(Number(e.target.value))}
                      className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={isBacktesting}
                      onClick={handleRunBacktest}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isBacktesting ? 'Simulating...' : 'Run Simulation'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Backtest Results */}
              {backtestResult && (
                <div className="space-y-4">
                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">TOTAL RETURN</span>
                      <span className="text-base font-bold text-emerald-400">+{backtestResult.totalReturnPercent}%</span>
                      <span className="text-[10px] text-slate-500 block">Ann: +{backtestResult.annualizedReturnPercent}%</span>
                    </div>

                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">SHARPE RATIO</span>
                      <span className="text-base font-bold text-purple-400">{backtestResult.sharpeRatio}</span>
                      <span className="text-[10px] text-slate-500 block">Sortino: {backtestResult.sortinoRatio}</span>
                    </div>

                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">WIN RATE</span>
                      <span className="text-base font-bold text-cyan-400">{backtestResult.winRate}%</span>
                      <span className="text-[10px] text-slate-500 block">{backtestResult.winningTrades} W / {backtestResult.losingTrades} L</span>
                    </div>

                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">MAX DRAWDOWN</span>
                      <span className="text-base font-bold text-amber-400">{backtestResult.maxDrawdownPercent}%</span>
                      <span className="text-[10px] text-slate-500 block">Hard Floor: 2.50%</span>
                    </div>

                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">PROFIT FACTOR</span>
                      <span className="text-base font-bold text-slate-200">{backtestResult.profitFactor}</span>
                      <span className="text-[10px] text-slate-500 block">Trades: {backtestResult.totalTrades}</span>
                    </div>

                    <div className="bg-[#121b30] p-3 rounded-lg border border-[#1e2d4d]">
                      <span className="text-[10px] text-slate-400 block">AVG TRADE PNL</span>
                      <span className="text-base font-bold text-emerald-400">+{backtestResult.averageTradePnlPercent}%</span>
                      <span className="text-[10px] text-slate-500 block">Risk/Reward: 1:2.1</span>
                    </div>
                  </div>

                  {/* Parameter Optimization Recommendations */}
                  {backtestResult.optimalParameters && (
                    <div className="bg-[#11192e] p-4 rounded-xl border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OPTIMAL PARAMETER RECOMMENDATION DISCOVERED</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-slate-300 text-[11px]">
                          <span>Stop Loss: <strong className="text-white">{backtestResult.optimalParameters.stopLossPercent}%</strong></span>
                          <span>Take Profit: <strong className="text-white">{backtestResult.optimalParameters.takeProfitPercent}%</strong></span>
                          <span>Trailing Stop: <strong className="text-white">{backtestResult.optimalParameters.trailingStopMultiplier}x ATR</strong></span>
                          <span>Recommended Allocation: <strong className="text-cyan-400">{backtestResult.optimalParameters.recommendedAllocationPercent}%</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyOptimal}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply to Live Engine</span>
                      </button>
                    </div>
                  )}

                  {/* Simulated Trades Table */}
                  <div className="bg-[#101728] p-4 rounded-xl border border-[#1d2943]">
                    <span className="text-slate-300 font-bold block mb-2">RECENT BACKTEST TRADE EXECUTIONS</span>
                    <div className="overflow-x-auto max-h-[220px]">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800">
                            <th className="py-1">Side</th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th>PnL (%)</th>
                            <th>PnL ($)</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {backtestResult.trades.map((t, i) => {
                            const isWin = t.pnlUsdt > 0;
                            return (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="py-1">
                                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${t.side === 'LONG' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                                    {t.side}
                                  </span>
                                </td>
                                <td>${t.entryPrice.toLocaleString()}</td>
                                <td>${t.exitPrice.toLocaleString()}</td>
                                <td className={isWin ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                                  {isWin ? '+' : ''}{t.pnlPercent}%
                                </td>
                                <td className={isWin ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                                  {isWin ? '+' : ''}${t.pnlUsdt}
                                </td>
                                <td className="text-slate-400">{t.exitReason}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STRATEGY INCUBATOR & DEGRADATION DETECTOR */}
          {activeTab === 'INCUBATOR' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101728] p-4 rounded-xl border border-[#1d2943]">
                <div>
                  <h3 className="font-bold text-slate-200">STRATEGY INCUBATION & CONTINUOUS LEARNING PIPELINE</h3>
                  <p className="text-[11px] text-slate-400">
                    Candidate strategies paper-trade in real-time alongside live execution before promotion. Alpha decay detector quarantines degraded models.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handleDegradationScan}
                    className="px-3 py-1.5 rounded-lg bg-[#19243b] hover:bg-[#223252] border border-[#2c3f66] text-slate-200 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isScanning ? 'Scanning...' : 'Degradation Scan'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerateStrategy}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Candidate Strategy'}</span>
                  </button>
                </div>
              </div>

              {/* Incubated Strategy Cards */}
              <div className="space-y-3">
                {incubated.map((strat) => {
                  const isReady = strat.status === 'VALIDATED_READY';
                  const isLive = strat.status === 'PROMOTED_LIVE';
                  const isDegraded = strat.status === 'DEGRADED_PAUSED';

                  return (
                    <div
                      key={strat.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLive
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : isReady
                          ? 'bg-[#121c32] border-cyan-500/40'
                          : isDegraded
                          ? 'bg-rose-950/20 border-rose-800/40'
                          : 'bg-[#101728] border-[#1e2a44]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-100 text-sm">{strat.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {strat.version}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isLive
                                  ? 'bg-emerald-900/60 text-emerald-300'
                                  : isReady
                                  ? 'bg-cyan-900/60 text-cyan-300 animate-pulse'
                                  : isDegraded
                                  ? 'bg-rose-900/60 text-rose-300'
                                  : 'bg-amber-900/60 text-amber-300'
                              }`}
                            >
                              {strat.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-2xl">{strat.rationale}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isReady && !isLive && (
                            <button
                              type="button"
                              onClick={() => handlePromote(strat.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Promote to Live</span>
                            </button>
                          )}
                          {isLive && (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <ShieldCheck className="w-4 h-4" />
                              <span>Active in Engine</span>
                            </div>
                          )}
                          {isDegraded && (
                            <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Quarantined</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance & Degradation Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Paper PnL:</span>
                          <span className="font-bold text-emerald-400">+${strat.paperPnlUsdt.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Win Rate:</span>
                          <span className="font-bold text-cyan-400">{strat.paperWinRate}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Sharpe:</span>
                          <span className="font-bold text-purple-400">{strat.paperSharpe}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Trades:</span>
                          <span className="font-bold text-slate-200">{strat.paperTradesCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Alpha Decay:</span>
                          <span className={`font-bold ${strat.alphaDecayPercent > 6 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {strat.alphaDecayPercent}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Degradation Score:</span>
                          <span
                            className={`font-bold ${
                              strat.degradationScore > 40
                                ? 'text-rose-400'
                                : strat.degradationScore > 20
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {strat.degradationScore} / 100
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: VALIDATED NON-CRITICAL HOT-COMPONENTS */}
          {activeTab === 'COMPONENTS' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#101728] p-4 rounded-xl border border-[#1d2943]">
                <h3 className="font-bold text-slate-200">NON-CRITICAL ALGORITHMIC HOT-COMPONENTS</h3>
                <p className="text-[11px] text-slate-400">
                  Micro-services and quantitative analytical engines validated through regression benchmarks. Hot-swappable at runtime with zero downtime.
                </p>
              </div>

              <div className="space-y-3">
                {components.map((comp) => {
                  const isActive = comp.status === 'ACTIVE';

                  return (
                    <div
                      key={comp.id}
                      className="bg-[#101728] p-4 rounded-xl border border-[#1e2a44] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-slate-100">{comp.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{comp.version}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {comp.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{comp.changelog}</p>
                        <div className="flex items-center gap-4 text-[11px] mt-2 text-slate-400">
                          <span>Validation Score: <strong className="text-emerald-400">{comp.validationScore}%</strong></span>
                          <span>Execution Latency: <strong className="text-cyan-300">{comp.latencyMicroseconds} µs</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                          {comp.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleComponent(comp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                          }`}
                        >
                          {isActive ? 'Stage / Demote' : 'Activate in Engine'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
