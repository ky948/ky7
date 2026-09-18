import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  History,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProfitSweeperConfig, SweepRecord } from '../types';
import { fetchProfitSweeper, updateProfitSweeper, executeProfitSweep } from '../services/api';

interface ProfitSweeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  realizedPnlUsdt: number;
  onNotification?: (msg: string, type: 'SUCCESS' | 'ERROR' | 'WARNING') => void;
}

export const ProfitSweeperModal: React.FC<ProfitSweeperModalProps> = ({
  isOpen,
  onClose,
  realizedPnlUsdt,
  onNotification,
}) => {
  const [config, setConfig] = useState<ProfitSweeperConfig | null>(null);
  const [destinationWallet, setDestinationWallet] = useState('');
  const [minThreshold, setMinThreshold] = useState(5000);
  const [sweepPercentage, setSweepPercentage] = useState(50);
  const [autoSweepEnabled, setAutoSweepEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [selectedSweepPercent, setSelectedSweepPercent] = useState(50);

  useEffect(() => {
    if (isOpen) {
      loadSweeperData();
    }
  }, [isOpen]);

  const loadSweeperData = async () => {
    try {
      const res = await fetchProfitSweeper();
      if (res.profitSweeperConfig) {
        setConfig(res.profitSweeperConfig);
        setDestinationWallet(res.profitSweeperConfig.destinationWallet);
        setMinThreshold(res.profitSweeperConfig.minThresholdUsdt);
        setSweepPercentage(res.profitSweeperConfig.sweepPercentage);
        setAutoSweepEnabled(res.profitSweeperConfig.autoSweepEnabled);
      }
    } catch {
      // transient
    }
  };

  const handleSaveConfig = async () => {
    setIsUpdating(true);
    try {
      const res = await updateProfitSweeper({
        destinationWallet,
        minThresholdUsdt: Number(minThreshold),
        sweepPercentage: Number(sweepPercentage),
        autoSweepEnabled,
      });
      if (res.success) {
        setConfig(res.profitSweeperConfig);
        onNotification?.('Cold storage profit sweeper configuration updated.', 'SUCCESS');
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to update config', 'ERROR');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExecuteSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await executeProfitSweep(selectedSweepPercent);
      if (res.success) {
        setConfig(res.profitSweeperConfig);
        onNotification?.(
          `Transferred $${res.sweepRecord.amountUsdt.toLocaleString()} USDT realized profit to cold storage (${res.sweepRecord.destinationWallet.slice(0, 8)}...).`,
          'SUCCESS'
        );
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Profit sweep execution failed', 'ERROR');
    } finally {
      setIsSweeping(false);
    }
  };

  if (!isOpen) return null;

  const eligibleAmount = config?.pendingEligibleUsdt ?? Math.max(0, realizedPnlUsdt - (config?.totalSweptUsdt || 0));
  const sweepAmountPreview = Number((eligibleAmount * (selectedSweepPercent / 100)).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b101d] border border-[#1e2a44] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1c273e] flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-slate-100 tracking-tight">
                  OWNER COLD STORAGE PROFIT SWEEPER
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  COLD VAULT ISOLATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Autonomous and on-demand sweep of eligible realized profits to designated hardware cold wallet
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200 space-y-4 font-mono text-xs">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#121b30] p-3.5 rounded-xl border border-[#1e2d4d]">
              <span className="text-[11px] text-slate-400 block mb-1">CUMULATIVE REALIZED P&L</span>
              <span className="text-lg font-bold text-emerald-400">
                +${realizedPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Net of all trading fees & slippage</span>
            </div>

            <div className="bg-[#121b30] p-3.5 rounded-xl border border-[#1e2d4d]">
              <span className="text-[11px] text-slate-400 block mb-1">TOTAL SWEPT TO COLD VAULT</span>
              <span className="text-lg font-bold text-cyan-400">
                ${(config?.totalSweptUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Safeguarded in offline custody</span>
            </div>

            <div className="bg-[#14203a] p-3.5 rounded-xl border border-emerald-500/40">
              <span className="text-[11px] text-emerald-300 font-semibold block mb-1">ELIGIBLE FOR SWEEP</span>
              <span className="text-lg font-bold text-white">
                ${eligibleAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-400/80 block mt-0.5">Available for transfer immediately</span>
            </div>
          </div>

          {/* Quick Sweep Execution Panel */}
          <div className="bg-[#101728] p-4 rounded-xl border border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                EXECUTE REALIZED PROFIT SWEEP NOW
              </span>
              <span className="text-[11px] text-slate-400">
                Target: <strong className="text-cyan-300 font-mono">{destinationWallet.slice(0, 10)}...{destinationWallet.slice(-6)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#141e33] p-1 rounded-lg border border-[#233352]">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSelectedSweepPercent(pct)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedSweepPercent === pct
                        ? 'bg-emerald-600 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-300">
                Transfer Amount: <strong className="text-emerald-400 font-bold text-sm">${sweepAmountPreview.toLocaleString()} USDT</strong>
              </div>

              <button
                type="button"
                disabled={isSweeping || eligibleAmount <= 0}
                onClick={handleExecuteSweep}
                className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSweeping ? 'Transferring...' : 'Transfer to Cold Storage'}</span>
              </button>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-[#101728] p-4 rounded-xl border border-[#1d2943] space-y-3">
            <span className="font-bold text-slate-200 block">AUTOMATED PROFIT SWEEP RULES</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Owner Destination Cold Wallet (EVM / BTC Address)</label>
                <input
                  type="text"
                  value={destinationWallet}
                  onChange={(e) => setDestinationWallet(e.target.value)}
                  className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Threshold ($)</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Sweep Portion (%)</label>
                  <input
                    type="number"
                    value={sweepPercentage}
                    onChange={(e) => setSweepPercentage(Number(e.target.value))}
                    className="w-full bg-[#141e33] border border-[#233352] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSweepEnabled}
                  onChange={(e) => setAutoSweepEnabled(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">
                  Enable Periodic Autonomous Sweeping (Triggers when eligible profit exceeds ${minThreshold.toLocaleString()} USDT)
                </span>
              </label>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveConfig}
                className="px-3 py-1.5 rounded-lg bg-[#19243b] hover:bg-[#233252] border border-[#2e4066] text-slate-200 text-xs font-semibold transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Historical Cold Storage Sweeps */}
          <div className="bg-[#101728] p-4 rounded-xl border border-[#1d2943]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                IMMUTABLE COLD STORAGE TRANSFER LEDGER
              </span>
              <span className="text-[10px] text-slate-500">SHA-256 On-Chain Proofs</span>
            </div>

            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="py-1">Timestamp</th>
                    <th>Amount</th>
                    <th>Destination Wallet</th>
                    <th>Tx Hash Proof</th>
                    <th>Block</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(config?.sweepHistory || []).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-1.5 text-slate-400">
                        {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="font-bold text-emerald-400">+${s.amountUsdt.toLocaleString()} USDT</td>
                      <td className="text-slate-300">{s.destinationWallet.slice(0, 10)}...{s.destinationWallet.slice(-6)}</td>
                      <td className="text-cyan-400/80 font-mono text-[10px]">
                        {s.txHash.slice(0, 12)}...{s.txHash.slice(-8)}
                      </td>
                      <td className="text-slate-500">#{s.blockNumber}</td>
                      <td>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
