import React, { useState } from 'react';
import { StrategyConfig } from '../types';
import { Cpu, CheckCircle2, XCircle, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

interface StrategyEnginePanelProps {
  strategies: StrategyConfig[];
  onUpdateStrategy: (data: {
    strategyId: string;
    enabled?: boolean;
    allocationPercent?: number;
    riskPerTradePercent?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
  }) => void;
}

export const StrategyEnginePanel: React.FC<StrategyEnginePanelProps> = ({
  strategies,
  onUpdateStrategy,
}) => {
  const [activeTab, setActiveTab] = useState<string>(strategies[0]?.id || 'EMA_MOMENTUM_BREAKOUT');
  const activeStrat = strategies.find((s) => s.id === activeTab) || strategies[0];

  return (
    <div id="strategy-engine-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>QUANT STRATEGY ENGINE</span>
        </div>
        <span className="text-[10px] text-slate-400">
          {strategies.filter((s) => s.enabled).length} Active / {strategies.length} Modules
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 p-1.5 bg-[#0d1322] border-b border-[#18233a] gap-1">
        {strategies.map((s) => {
          const isSelected = s.id === activeTab;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveTab(s.id)}
              className={`p-1.5 rounded text-left transition-all truncate flex items-center justify-between ${
                isSelected
                  ? 'bg-[#18233b] border border-[#2b3d63] text-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121929]'
              }`}
            >
              <span className="truncate">{s.name.split(' ')[0]}</span>
              {s.enabled ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600 shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Strategy Details & Calibration */}
      {activeStrat && (
        <div className="p-3.5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{activeStrat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  activeStrat.enabled
                    ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}>
                  {activeStrat.enabled ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {activeStrat.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onUpdateStrategy({ strategyId: activeStrat.id, enabled: !activeStrat.enabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeStrat.enabled
                  ? 'bg-rose-950/50 border border-rose-800/50 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50'
              }`}
            >
              {activeStrat.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Sliders and Parameters */}
          <div className="bg-[#0e1628] border border-[#1d2b47] rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs border-b border-[#1c273e] pb-1.5">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span>Execution & Risk Parameters</span>
            </div>

            {/* Allocation */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Portfolio Capital Allocation:</span>
                <span className="text-slate-100 font-bold">{activeStrat.allocationPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={activeStrat.allocationPercent}
                onChange={(e) =>
                  onUpdateStrategy({ strategyId: activeStrat.id, allocationPercent: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Risk per trade */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Risk per Trade (% NAV):</span>
                <span className="text-slate-100 font-bold">{activeStrat.riskPerTradePercent}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={activeStrat.riskPerTradePercent}
                onChange={(e) =>
                  onUpdateStrategy({ strategyId: activeStrat.id, riskPerTradePercent: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Stop Loss */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={activeStrat.stopLossPercent}
                  onChange={(e) =>
                    onUpdateStrategy({ strategyId: activeStrat.id, stopLossPercent: Number(e.target.value) })
                  }
                  className="w-full bg-[#131d33] border border-[#233557] rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Take Profit (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20.0"
                  value={activeStrat.takeProfitPercent}
                  onChange={(e) =>
                    onUpdateStrategy({ strategyId: activeStrat.id, takeProfitPercent: Number(e.target.value) })
                  }
                  className="w-full bg-[#131d33] border border-[#233557] rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between border-t border-[#18233a]">
              <span>Trailing Stop: {activeStrat.trailingStopAtrMultiplier}x ATR</span>
              <span>Cooldown: {activeStrat.cooldownSeconds}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
