import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Award,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
  Info,
  ChevronRight,
  BarChart2,
  Scale,
  Eye,
  Filter,
} from 'lucide-react';
import {
  StrategyCandidate,
  StrategyCandidateFamily,
  StrategyBuildingBlock,
  BuildingBlockDefinition,
  StrategyGeneratorState,
} from '../types';
import {
  fetchStrategyGeneratorState,
  generateStrategyCandidate,
  promoteCandidateToLive,
  recalculateObjectiveArena,
  toggleAutoStrategyGen,
} from '../services/api';

interface AutonomousStrategyGeneratorArenaProps {
  onNotification?: (msg: string, type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO') => void;
  onCandidatePromoted?: (candidate: StrategyCandidate) => void;
}

const ALL_BUILDING_BLOCKS: Array<{
  id: StrategyBuildingBlock;
  name: string;
  category: string;
  desc: string;
}> = [
  { id: 'grid_trading', name: 'Grid Trading', category: 'Execution', desc: 'Multi-level geometric/arithmetic mesh capturing micro-volatility spreads' },
  { id: 'volatility', name: 'Volatility', category: 'Volatility', desc: 'Statistical dispersion of returns and dynamic expansion/compression bands' },
  { id: 'momentum', name: 'Momentum', category: 'Momentum', desc: 'Rate of directional price velocity and impulse continuation vector' },
  { id: 'mean_reversion', name: 'Mean Reversion', category: 'Execution', desc: 'Statistical z-score extension reversion towards historical equilibrium' },
  { id: 'trend_detection', name: 'Trend Detection', category: 'Momentum', desc: 'Multi-horizon directional persistence and structural break confirmation' },
  { id: 'order_book_imbalance', name: 'Order-Book Imbalance', category: 'Orderbook', desc: 'Real-time L2 depth bid/ask queue volume asymmetry and spoofing filter' },
  { id: 'volume', name: 'Volume', category: 'Microstructure', desc: 'Taker volume delta, volume clusters, and exhaustion volume spikes' },
  { id: 'liquidity', name: 'Liquidity', category: 'Microstructure', desc: 'Top-of-book market depth, spread resilience, and liquidity void absorption' },
  { id: 'spread', name: 'Spread', category: 'Microstructure', desc: 'Bid-ask spread monitoring and adverse selection friction penalization' },
  { id: 'atr', name: 'ATR', category: 'Volatility', desc: 'Average True Range dynamic volatility normalization for trailing stops' },
  { id: 'rsi', name: 'RSI', category: 'Momentum', desc: 'Relative Strength Index momentum oscillator with divergence detection' },
  { id: 'macd', name: 'MACD', category: 'Momentum', desc: 'Moving Average Convergence Divergence histogram velocity and zero-line crossovers' },
  { id: 'moving_averages', name: 'Moving Averages', category: 'Momentum', desc: 'Dynamic EMA/SMA ribbons (9/21/50/200) for hierarchical trend filtering' },
  { id: 'bollinger_bands', name: 'Bollinger Bands', category: 'Volatility', desc: '2.0-sigma dynamic volatility envelopes and squeeze breakout triggers' },
  { id: 'vwap', name: 'VWAP', category: 'Microstructure', desc: 'Volume Weighted Average Price institutional anchor and deviation bands' },
  { id: 'market_regime', name: 'Market Regime', category: 'Macro', desc: 'Macro regime classifier (Trending Bull, Range Chop, Volatile Squeeze)' },
  { id: 'funding_rates', name: 'Funding Rates', category: 'Macro', desc: 'Perpetual futures funding rate arbitrage, carry yield, and counter-trade' },
  { id: 'volatility_regime', name: 'Volatility Regime', category: 'Volatility', desc: 'GARCH/Clustering volatility state (Quiet, Normal, Explosive)' },
  { id: 'historical_price_behavior', name: 'Historical Price Behavior', category: 'Macro', desc: 'Multi-day fractal support/resistance, prior day high/low rejections' },
];

export const AutonomousStrategyGeneratorArena: React.FC<AutonomousStrategyGeneratorArenaProps> = ({
  onNotification,
  onCandidatePromoted,
}) => {
  const [state, setState] = useState<StrategyGeneratorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<StrategyCandidate | null>(null);

  // Generator form controls
  const [selectedFamily, setSelectedFamily] = useState<StrategyCandidateFamily>('GRID');
  const [selectedBlocks, setSelectedBlocks] = useState<StrategyBuildingBlock[]>([
    'grid_trading',
    'volatility',
    'order_book_imbalance',
    'atr',
  ]);
  const [targetRegime, setTargetRegime] = useState<string>('RANGE_BOUND');
  const [useAiQuant, setUseAiQuant] = useState(true);

  // Arena filter / view
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    setLoading(true);
    try {
      const res = await fetchStrategyGeneratorState();
      if (res.state) {
        setState(res.state);
        if (res.state.candidates.length > 0) {
          setSelectedCandidate(res.state.candidates[0]);
          if (!compareA && res.state.candidates[0]) setCompareA(res.state.candidates[0].versionId);
          if (!compareB && res.state.candidates[1]) setCompareB(res.state.candidates[1].versionId);
        }
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to load strategy generator state', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockSelection = (blockId: StrategyBuildingBlock) => {
    if (selectedBlocks.includes(blockId)) {
      if (selectedBlocks.length <= 2) {
        onNotification?.('At least 2 building blocks must be selected for strategy synthesis', 'WARNING');
        return;
      }
      setSelectedBlocks(selectedBlocks.filter((b) => b !== blockId));
    } else {
      if (selectedBlocks.length >= 8) {
        onNotification?.('Maximum 8 building blocks per candidate synthesis', 'WARNING');
        return;
      }
      setSelectedBlocks([...selectedBlocks, blockId]);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateStrategyCandidate({
        family: selectedFamily,
        customBlocks: selectedBlocks,
        regimeTarget: targetRegime,
        useAi: useAiQuant,
      });

      if (res.success && res.candidate) {
        setState(res.state);
        setSelectedCandidate(res.candidate);
        onNotification?.(
          `Minted ${res.candidate.versionId}: "${res.candidate.name}" with objective score ${res.candidate.objectiveMetrics.compositeObjectiveScore}. Evaluated against live arena.`,
          'SUCCESS'
        );
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to generate strategy candidate', 'ERROR');
    } finally {
      setGenerating(false);
    }
  };

  const handlePromote = async (versionId: string) => {
    try {
      const res = await promoteCandidateToLive(versionId);
      if (res.success) {
        setState(res.state);
        setSelectedCandidate(res.promotedCandidate);
        onCandidatePromoted?.(res.promotedCandidate);
        onNotification?.(
          `PROMOTED ${res.promotedCandidate.versionId} to ACTIVE LIVE trading engine. Previous active strategy superseded.`,
          'SUCCESS'
        );
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Promotion failed', 'ERROR');
    }
  };

  const handleRecalculate = async (simulatedRegime?: string) => {
    setRecalculating(true);
    try {
      const res = await recalculateObjectiveArena({
        currentRegime: simulatedRegime || state?.currentRegime,
      });
      if (res.success) {
        setState(res.state);
        if (res.benchmarkLeader) {
          onNotification?.(
            `Arena recalculated for regime [${res.state.currentRegime}]. Current Benchmark Leader: ${res.benchmarkLeader.versionId} (Score: ${res.benchmarkLeader.objectiveMetrics.compositeObjectiveScore}). No strategy permanently assumed superior.`,
            'INFO'
          );
        }
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Recalculation failed', 'ERROR');
    } finally {
      setRecalculating(false);
    }
  };

  const handleToggleAuto = async () => {
    try {
      const res = await toggleAutoStrategyGen();
      if (res.success && state) {
        setState({ ...state, autoGenerateOnRegimeShift: res.autoGenerateOnRegimeShift });
        onNotification?.(
          `Autonomous strategy generation on regime shift: ${res.autoGenerateOnRegimeShift ? 'ENABLED' : 'DISABLED'}`,
          'INFO'
        );
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Toggle failed', 'ERROR');
    }
  };

  const filteredCandidates = (state?.candidates || []).filter((c) => {
    if (familyFilter === 'ALL') return true;
    return c.family === familyFilter;
  });

  const activeLiveCandidate = state?.candidates.find((c) => c.status === 'ACTIVE_LIVE');
  const topBenchmarkLeader = state?.candidates.find((c) => c.isCurrentBenchmarkWinner) || state?.candidates[0];
  const isIncumbentLagging =
    activeLiveCandidate &&
    topBenchmarkLeader &&
    activeLiveCandidate.versionId !== topBenchmarkLeader.versionId &&
    topBenchmarkLeader.objectiveMetrics.compositeObjectiveScore >
      activeLiveCandidate.objectiveMetrics.compositeObjectiveScore + 2.0;

  const candidateA = state?.candidates.find((c) => c.versionId === compareA);
  const candidateB = state?.candidates.find((c) => c.versionId === compareB);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Objective Philosophy Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/40 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  AUTONOMOUS STRATEGY GENERATOR & OBJECTIVE PERFORMANCE ARENA
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  COMBINATORIAL MULTI-FACTOR ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                <span className="text-amber-400 font-semibold font-mono">Core Invariant:</span> The system continually compares strategies against objective performance metrics (Sharpe, Sortino, Calmar, Win-Rate, Alpha vs Benchmark, Maximum Drawdown) rather than permanently assuming that one strategy is superior.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => handleRecalculate()}
              disabled={recalculating}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Recalculate Arena</span>
            </button>
            <button
              type="button"
              onClick={handleToggleAuto}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                state?.autoGenerateOnRegimeShift
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Gen on Regime Shift: {state?.autoGenerateOnRegimeShift ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Objective Alert if Incumbent is out-performed */}
        {isIncumbentLagging && (
          <div className="mt-3.5 pt-3 border-t border-amber-500/20 bg-amber-950/30 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold font-mono">{topBenchmarkLeader?.versionId}</span> (
                {topBenchmarkLeader?.name}) is currently outperforming active live strategy{' '}
                <span className="font-semibold font-mono">{activeLiveCandidate?.versionId}</span> by{' '}
                <span className="text-emerald-400 font-bold">
                  +
                  {(
                    (topBenchmarkLeader?.objectiveMetrics.compositeObjectiveScore || 0) -
                    (activeLiveCandidate?.objectiveMetrics.compositeObjectiveScore || 0)
                  ).toFixed(1)}{' '}
                  pts
                </span>{' '}
                in current regime <span className="font-mono text-cyan-300">[{state?.currentRegime}]</span>.
              </div>
            </div>
            <button
              type="button"
              onClick={() => topBenchmarkLeader && handlePromote(topBenchmarkLeader.versionId)}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-semibold shrink-0 transition-colors"
            >
              Promote Winner to Live
            </button>
          </div>
        )}
      </div>

      {/* Grid: Left Column = Combinatorial Generator Studio, Right Column = Objective Performance Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Autonomous Synthesis Studio (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e1424] border border-[#1e2a44] rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c273e]">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200 tracking-wider uppercase">
                Strategy Candidate Synthesis
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {state?.candidates.length || 0} Candidates in Vault
            </span>
          </div>

          {/* Family Selector */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1.5 block">
              Strategy Archetype / Family
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['GRID', 'ADAPTIVE', 'MOMENTUM', 'MEANREV', 'VOLATILITY', 'ORDERBOOK', 'VWAP', 'TREND'] as StrategyCandidateFamily[]).map(
                (fam) => (
                  <button
                    key={fam}
                    type="button"
                    onClick={() => setSelectedFamily(fam)}
                    className={`px-2 py-1.5 rounded text-[11px] font-mono font-semibold border transition-all ${
                      selectedFamily === fam
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-[#121a30] border-[#1f2b45] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fam}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 19 Canonical Building Blocks Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase">
                Active Building Blocks ({selectedBlocks.length}/19 selected)
              </label>
              <button
                type="button"
                onClick={() => {
                  const shuffled = [...ALL_BUILDING_BLOCKS].sort(() => 0.5 - Math.random());
                  setSelectedBlocks(shuffled.slice(0, 5).map((b) => b.id));
                }}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                Randomize 5
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
              {ALL_BUILDING_BLOCKS.map((block) => {
                const isSelected = selectedBlocks.includes(block.id);
                return (
                  <div
                    key={block.id}
                    onClick={() => toggleBlockSelection(block.id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-600/70 text-cyan-100'
                        : 'bg-[#121a30] border-[#1b263e] text-slate-400 hover:bg-[#152038]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <span className="font-mono font-medium text-[11px] text-slate-200">{block.name}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {block.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{block.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regime Target & AI Engine Controls */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Target Market Regime</label>
              <select
                value={targetRegime}
                onChange={(e) => setTargetRegime(e.target.value)}
                className="w-full bg-[#121a30] border border-[#1e2a44] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="VOLATILE_EXPANSION">Volatile Expansion</option>
                <option value="RANGE_BOUND">Range-Bound Chop</option>
                <option value="TRENDING_BULL">Trending Bull</option>
                <option value="CHOP_LOW_LIQUIDITY">Low Liquidity Squeeze</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Quant Synthesis Engine</label>
              <div
                onClick={() => setUseAiQuant(!useAiQuant)}
                className="flex items-center gap-2 p-1.5 rounded border border-[#1e2a44] bg-[#121a30] cursor-pointer hover:border-slate-600 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${useAiQuant ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="text-[11px] text-slate-300">
                  {useAiQuant ? 'Gemini 3.8-Flash AI' : 'Deterministic Math'}
                </span>
              </div>
            </div>
          </div>

          {/* Synthesis Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Strategy Candidate & Walk-Forward Testing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>MINT NEW CANDIDATE (Auto-Version ID)</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Objective Performance Arena Leaderboard (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e1424] border border-[#1e2a44] rounded-xl p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1c273e]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200 tracking-wider uppercase">
                Objective Arena Leaderboard
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Sorted by Composite Objective Score
              </span>
            </div>

            {/* Family Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[11px] text-slate-400">Filter:</span>
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="bg-[#121a30] border border-[#1e2a44] rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Families</option>
                <option value="GRID">Grid</option>
                <option value="ADAPTIVE">Adaptive</option>
                <option value="MOMENTUM">Momentum</option>
                <option value="MEANREV">Mean Reversion</option>
              </select>
            </div>
          </div>

          {/* Regime Simulator Bar: Proof that no strategy is permanently superior */}
          <div className="p-2.5 rounded-lg bg-[#121a30] border border-[#1f2c47] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-300">
                Active Test Regime: <strong className="text-cyan-300">{state?.currentRegime}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap font-mono text-[10px]">
              <span className="text-slate-400 mr-1">Simulate Shift:</span>
              <button
                type="button"
                onClick={() => handleRecalculate('RANGE_BOUND')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Range Chop
              </button>
              <button
                type="button"
                onClick={() => handleRecalculate('VOLATILE_EXPANSION')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Volatile Break
              </button>
              <button
                type="button"
                onClick={() => handleRecalculate('TRENDING_BULL')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Bull Trend
              </button>
            </div>
          </div>

          {/* Candidates List / Cards */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredCandidates.map((candidate, rank) => {
              const isSelected = selectedCandidate?.versionId === candidate.versionId;
              const isLive = candidate.status === 'ACTIVE_LIVE';
              const isWinner = candidate.isCurrentBenchmarkWinner;

              return (
                <div
                  key={candidate.versionId}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isLive
                      ? 'bg-emerald-950/20 border-emerald-600/60 shadow-sm'
                      : isWinner
                      ? 'bg-cyan-950/20 border-cyan-500/60'
                      : isSelected
                      ? 'bg-[#152038] border-indigo-500/50'
                      : 'bg-[#101729] border-[#1b263e] hover:bg-[#131d33]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        #{rank + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white tracking-wide">
                            {candidate.versionId}
                          </span>
                          {isLive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ACTIVE LIVE
                            </span>
                          )}
                          {isWinner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" /> ARENA LEADER
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                            {candidate.family}
                          </span>
                        </div>
                        <h5 className="text-[11px] font-medium text-slate-300 mt-0.5 truncate max-w-md">
                          {candidate.name}
                        </h5>
                      </div>
                    </div>

                    {/* Composite Objective Score Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-cyan-300">
                        {candidate.objectiveMetrics.compositeObjectiveScore.toFixed(1)}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 uppercase">Composite Score</div>
                    </div>
                  </div>

                  {/* Objective Metrics Ribbon */}
                  <div className="grid grid-cols-5 gap-2 mt-2 pt-2 border-t border-[#1a253c] text-center font-mono text-[10px]">
                    <div className="bg-[#0b101c] p-1 rounded border border-[#19243a]">
                      <div className="text-slate-400 text-[9px]">Sharpe</div>
                      <div className="text-slate-200 font-semibold">{candidate.objectiveMetrics.sharpeRatio.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#0b101c] p-1 rounded border border-[#19243a]">
                      <div className="text-slate-400 text-[9px]">Sortino</div>
                      <div className="text-slate-200 font-semibold">{candidate.objectiveMetrics.sortinoRatio.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#0b101c] p-1 rounded border border-[#19243a]">
                      <div className="text-slate-400 text-[9px]">Win Rate</div>
                      <div className="text-emerald-400 font-semibold">{candidate.objectiveMetrics.winRatePercent}%</div>
                    </div>
                    <div className="bg-[#0b101c] p-1 rounded border border-[#19243a]">
                      <div className="text-slate-400 text-[9px]">Profit Factor</div>
                      <div className="text-slate-200 font-semibold">{candidate.objectiveMetrics.profitFactor.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#0b101c] p-1 rounded border border-[#19243a]">
                      <div className="text-slate-400 text-[9px]">Max DD</div>
                      <div className="text-amber-300 font-semibold">{candidate.objectiveMetrics.maxDrawdownPercent}%</div>
                    </div>
                  </div>

                  {/* Building Blocks Chips */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {candidate.buildingBlocksUsed.slice(0, 5).map((blockId) => (
                        <span
                          key={blockId}
                          className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {blockId.replace('_', ' ')}
                        </span>
                      ))}
                      {candidate.buildingBlocksUsed.length > 5 && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          +{candidate.buildingBlocksUsed.length - 5} more
                        </span>
                      )}
                    </div>

                    {!isLive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePromote(candidate.versionId);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-mono text-[10px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>Promote to Live</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Candidate Detailed Inspection Card */}
      {selectedCandidate && (
        <div className="bg-[#0e1424] border border-[#1e2a44] rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1c273e]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-white tracking-wide">
                    {selectedCandidate.versionId} — {selectedCandidate.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700">
                    {selectedCandidate.generationSource}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-4xl">{selectedCandidate.hypothesis}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCandidate.status !== 'ACTIVE_LIVE' && (
                <button
                  type="button"
                  onClick={() => handlePromote(selectedCandidate.versionId)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Promote {selectedCandidate.versionId} to Active Live</span>
                </button>
              )}
            </div>
          </div>

          {/* Parameters & Building Blocks Weights breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
            {/* Parameters */}
            <div className="bg-[#11182c] border border-[#1d2943] rounded-lg p-3">
              <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Execution Parameters</span>
              </h5>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stop Loss:</span>
                  <span className="text-amber-400 font-semibold">{selectedCandidate.parameters.stopLossPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Take Profit:</span>
                  <span className="text-emerald-400 font-semibold">{selectedCandidate.parameters.takeProfitPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trailing ATR Mult:</span>
                  <span className="text-slate-200">{selectedCandidate.parameters.trailingStopMultiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allocation Cap:</span>
                  <span className="text-slate-200">{selectedCandidate.parameters.allocationPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timeframe:</span>
                  <span className="text-slate-200">{selectedCandidate.parameters.timeframeMinutes}m</span>
                </div>
              </div>
            </div>

            {/* Building Blocks Weight Matrix */}
            <div className="bg-[#11182c] border border-[#1d2943] rounded-lg p-3">
              <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Building Block Weights</span>
              </h5>
              <div className="space-y-1.5 text-[11px]">
                {Object.entries(selectedCandidate.weights).map(([blockKey, weight]) => (
                  <div key={blockKey} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 truncate">{blockKey.replace('_', ' ')}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${weight}%` }} />
                      </div>
                      <span className="text-slate-200 w-7 text-right font-semibold">{weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regime Fitness breakdown */}
            <div className="bg-[#11182c] border border-[#1d2943] rounded-lg p-3">
              <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Regime Fitness Profile</span>
              </h5>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trending Directional:</span>
                  <span className="text-slate-200 font-semibold">{selectedCandidate.regimeFitness.trending}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Range Chop Equilibrium:</span>
                  <span className="text-slate-200 font-semibold">{selectedCandidate.regimeFitness.ranging}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">High Volatility Expansion:</span>
                  <span className="text-slate-200 font-semibold">{selectedCandidate.regimeFitness.highVolatility}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Low Liquidity Absorption:</span>
                  <span className="text-slate-200 font-semibold">{selectedCandidate.regimeFitness.lowLiquidity}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
