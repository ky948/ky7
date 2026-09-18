import React, { useState } from 'react';
import { X, ShieldAlert, Sliders, Check } from 'lucide-react';
import { RiskSettings } from '../types';

interface RiskSettingsModalProps {
  riskSettings: RiskSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveRiskSettings: (settings: Partial<RiskSettings>) => void;
}

export const RiskSettingsModal: React.FC<RiskSettingsModalProps> = ({
  riskSettings,
  isOpen,
  onClose,
  onSaveRiskSettings,
}) => {
  const [maxDailyLoss, setMaxDailyLoss] = useState(riskSettings.maxDailyLossPercent.toString());
  const [maxLeverage, setMaxLeverage] = useState(riskSettings.maxPortfolioLeverage.toString());
  const [maxPosSize, setMaxPosSize] = useState(riskSettings.maxPositionSizePercent.toString());
  const [circuitBreaker, setCircuitBreaker] = useState(riskSettings.circuitBreakerDrawdownPercent.toString());
  const [slippage, setSlippage] = useState(riskSettings.slippageTolerancePercent.toString());
  const [enforceGuards, setEnforceGuards] = useState(riskSettings.enforceStrictRiskGuards);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRiskSettings({
      maxDailyLossPercent: Number(maxDailyLoss),
      maxPortfolioLeverage: Number(maxLeverage),
      maxPositionSizePercent: Number(maxPosSize),
      circuitBreakerDrawdownPercent: Number(circuitBreaker),
      slippageTolerancePercent: Number(slippage),
      enforceStrictRiskGuards: enforceGuards,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#101728] border border-[#233352] rounded-xl max-w-lg w-full p-5 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2b45] mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sliders className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-100">
              Risk Management & Hard Stops Engine
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="bg-[#141d33] border border-[#233457] rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-100 block">Enforce Strict Autonomous Guards</span>
              <span className="text-[11px] text-slate-400">
                Immediately block any signal violating capital allocation or daily drawdown limits
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEnforceGuards(!enforceGuards)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                enforceGuards ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  enforceGuards ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max Daily Loss Floor (% NAV):</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="15.0"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(e.target.value)}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500">Halts autonomous loop on breach</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max Gross Portfolio Leverage:</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="10.0"
                value={maxLeverage}
                onChange={(e) => setMaxLeverage(e.target.value)}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500">Aggregate margin ceiling</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max Single Asset Position (% NAV):</label>
              <input
                type="number"
                step="1"
                min="5"
                max="50"
                value={maxPosSize}
                onChange={(e) => setMaxPosSize(e.target.value)}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500">Asset concentration cap</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Drawdown Circuit Breaker (%):</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="20.0"
                value={circuitBreaker}
                onChange={(e) => setCircuitBreaker(e.target.value)}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500">System trip threshold</span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Slippage Tolerance (%):</label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="1.0"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1f2b45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white shadow-md shadow-cyan-950/50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save &amp; Apply Controls
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
