import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Pause,
  Lock,
  FileCode2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  Wallet,
  RotateCw,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { EngineStatus, TradingMode, SystemHealth } from '../types';

interface HeaderProps {
  engineStatus: EngineStatus;
  tradingMode: TradingMode;
  systemHealth: SystemHealth | null;
  onKillSwitch: () => void;
  onToggleEngine: () => void;
  onChangeMode: (mode: TradingMode) => void;
  onOpenVault: () => void;
  onOpenAudit: () => void;
  onOpenRiskSettings: () => void;
  onOpenManualOrder: () => void;
  onOpenOptimizer?: () => void;
  onOpenProfitSweeper?: () => void;
  onOpenLearningLoop?: () => void;
  onOpenUpdateManager?: () => void;
  onOpenStrategyGenerator?: () => void;
  eligibleSweepUsdt?: number;
  activeVersion?: string;
  currentSystemVersion?: string;
  activeStrategyCandidateId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  engineStatus,
  tradingMode,
  systemHealth,
  onKillSwitch,
  onToggleEngine,
  onChangeMode,
  onOpenVault,
  onOpenAudit,
  onOpenRiskSettings,
  onOpenManualOrder,
  onOpenOptimizer,
  onOpenProfitSweeper,
  onOpenLearningLoop,
  onOpenUpdateManager,
  onOpenStrategyGenerator,
  eligibleSweepUsdt = 0,
  activeVersion = 'v1.3',
  currentSystemVersion = 'v2.4.1-LTS',
  activeStrategyCandidateId = 'STRATEGY-ADAPTIVE-004',
}) => {
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  return (
    <header id="platform-header" className="bg-[#0b0f19] border-b border-[#1e293b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-200 select-none">
      {/* Brand & Sole Owner Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-wider text-slate-100">
              AUTONOMOUS QUANT DESK
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              v3.8.4-PROD
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Authorized Owner:</span>
            <span className="text-emerald-400 font-medium">
              {systemHealth?.authorizedOwner || 'kundanyadav948@gmail.com'}
            </span>
            <span className="text-[10px] text-emerald-500/80 px-1 rounded bg-emerald-950/60 border border-emerald-800/40">
              [SOLE OWNER ACCESS]
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: Engine State & Trading Mode */}
      <div className="flex items-center gap-2.5">
        {/* Trading Mode Switcher */}
        <div className="flex items-center bg-[#131b2e] p-0.5 rounded-lg border border-[#22314e] text-xs font-mono">
          <button
            id="mode-btn-paper"
            type="button"
            onClick={() => onChangeMode('PAPER')}
            className={`px-2.5 py-1 rounded transition-colors ${
              tradingMode === 'PAPER'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PAPER
          </button>
          <button
            id="mode-btn-dry"
            type="button"
            onClick={() => onChangeMode('DRY_RUN')}
            className={`px-2.5 py-1 rounded transition-colors ${
              tradingMode === 'DRY_RUN'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DRY-RUN
          </button>
          <button
            id="mode-btn-live"
            type="button"
            onClick={() => onChangeMode('LIVE_VAULT')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              tradingMode === 'LIVE_VAULT'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-2.5 h-2.5" />
            LIVE VAULT
          </button>
        </div>

        {/* Engine Run / Pause Toggle */}
        <button
          id="toggle-engine-btn"
          type="button"
          onClick={onToggleEngine}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${
            engineStatus === 'RUNNING'
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : engineStatus === 'PAUSED'
              ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
              : 'bg-red-950/60 border-red-700/60 text-red-300 hover:bg-red-900/60'
          }`}
        >
          {engineStatus === 'RUNNING' ? (
            <>
              <Pause className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>AUTONOMOUS ACTIVE</span>
            </>
          ) : engineStatus === 'PAUSED' ? (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>STANDBY / PAUSED</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>RESET KILL-SWITCH</span>
            </>
          )}
        </button>

        {/* Manual Order Trigger */}
        <button
          id="btn-manual-order"
          type="button"
          onClick={onOpenManualOrder}
          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#162036] hover:bg-[#1e2c4a] border border-[#2b3d64] text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Manual Order</span>
        </button>
      </div>

      {/* Right Controls: Telemetry, Modals & Master Kill Switch */}
      <div className="flex items-center gap-2">
        {/* System telemetry pill */}
        <div className="hidden lg:flex items-center gap-3 px-2.5 py-1 rounded bg-[#101726] border border-[#1e293b] text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Lag:</span>
            <span className="text-emerald-400 font-semibold">{systemHealth?.eventLoopLagMs || 1.4}ms</span>
          </div>
          <div className="w-px h-3 bg-slate-800"></div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Ticks:</span>
            <span className="text-slate-300 font-semibold">#{systemHealth?.ticksProcessed?.toLocaleString() || '14,280'}</span>
          </div>
          <div className="w-px h-3 bg-slate-800"></div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>IP Lock</span>
          </div>
        </div>

        {/* Autonomous Strategy Generator & Objective Arena */}
        {onOpenStrategyGenerator && (
          <button
            id="btn-open-strategy-generator"
            type="button"
            onClick={onOpenStrategyGenerator}
            title="Autonomous AI Strategy Generator & Objective Performance Arena"
            className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Strategy Arena</span>
            <span className="text-[10px] px-1 py-0.2 bg-blue-500/20 text-blue-200 rounded font-bold border border-blue-500/30">
              {activeStrategyCandidateId}
            </span>
          </button>
        )}

        {/* Autonomous Optimizer Button */}
        {onOpenOptimizer && (
          <button
            id="btn-open-optimizer"
            type="button"
            onClick={onOpenOptimizer}
            title="Autonomous Optimization, Grid Strategy & Strategy Incubator"
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Optimizer</span>
          </button>
        )}

        {/* 16-Stage Autonomous Learning Loop & Immutable Version Ledger */}
        {onOpenLearningLoop && (
          <button
            id="btn-open-learning-loop"
            type="button"
            onClick={onOpenLearningLoop}
            title="16-Stage Continuous Learning Loop & Immutable Version History"
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shadow-[0_0_12px_rgba(99,102,241,0.15)]"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-[spin_6s_linear_infinite]" />
            <span className="hidden sm:inline">Learning Loop</span>
            <span className="text-[10px] px-1 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-bold border border-indigo-500/30">
              {activeVersion}
            </span>
          </button>
        )}

        {/* Autonomous Update Manager (12-Stage Lifecycle & Anti-Untrusted Code) */}
        {onOpenUpdateManager && (
          <button
            id="btn-open-update-manager"
            type="button"
            onClick={onOpenUpdateManager}
            title="Controlled Autonomous Update Manager (12-Stage Lifecycle)"
            className="px-2.5 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/40 text-teal-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shadow-[0_0_12px_rgba(20,184,166,0.15)]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Update Manager</span>
            <span className="text-[10px] px-1 py-0.2 bg-teal-500/20 text-teal-300 rounded font-bold border border-teal-500/30">
              {currentSystemVersion}
            </span>
          </button>
        )}

        {/* Owner Cold Storage Profit Sweeper Button */}
        {onOpenProfitSweeper && (
          <button
            id="btn-open-sweeper"
            type="button"
            onClick={onOpenProfitSweeper}
            title="Periodic Cold Storage Profit Sweeper"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cold Sweeper</span>
            {eligibleSweepUsdt > 0 && (
              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                ${(eligibleSweepUsdt / 1000).toFixed(1)}k
              </span>
            )}
          </button>
        )}

        {/* Risk Limits Configuration Button */}
        <button
          id="btn-open-risk"
          type="button"
          onClick={onOpenRiskSettings}
          title="Risk Management & Hard Stops"
          className="p-1.5 rounded-lg bg-[#141d30] hover:bg-[#1f2d4a] border border-[#253655] text-slate-300 hover:text-white transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Exchange Vault Button */}
        <button
          id="btn-open-vault"
          type="button"
          onClick={onOpenVault}
          title="Private API Key Vault & Encryption"
          className="p-1.5 rounded-lg bg-[#141d30] hover:bg-[#1f2d4a] border border-[#253655] text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-slate-300 text-[11px]">Vault</span>
        </button>

        {/* Cryptographic Audit Trail Button */}
        <button
          id="btn-open-audit"
          type="button"
          onClick={onOpenAudit}
          title="Immutable SHA-256 Audit Log"
          className="p-1.5 rounded-lg bg-[#141d30] hover:bg-[#1f2d4a] border border-[#253655] text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
        >
          <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-slate-300 text-[11px]">Audit</span>
        </button>

        {/* Master Safety Kill Switch */}
        <div className="relative">
          {engineStatus === 'KILL_SWITCHED' ? (
            <div className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-600 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>SYSTEM TRIPPED</span>
            </div>
          ) : (
            <button
              id="btn-kill-switch"
              type="button"
              onClick={() => setShowKillConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/60 text-red-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>KILL SWITCH</span>
            </button>
          )}

          {/* Kill Switch Confirmation Modal */}
          {showKillConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
              <div className="bg-[#111827] border-2 border-red-500 rounded-xl max-w-md w-full p-6 text-slate-200 shadow-2xl shadow-red-950/50">
                <div className="flex items-center gap-3 text-red-400 mb-3">
                  <ShieldAlert className="w-8 h-8" />
                  <h3 className="text-lg font-bold font-mono tracking-wide">CONFIRM EMERGENCY KILL SWITCH</h3>
                </div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Engaging the Master Kill Switch will immediately:
                  <br />
                  • Terminate the autonomous quantitative decision cycle
                  <br />
                  • Flatten all open leveraged positions at prevailing market price
                  <br />
                  • Cancel all pending limit and bracket orders
                  <br />
                  • Write an immutable CRITICAL cryptographic audit event
                </p>
                <div className="flex items-center justify-end gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setShowKillConfirm(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Abort / Cancel
                  </button>
                  <button
                    id="btn-confirm-kill-switch"
                    type="button"
                    onClick={() => {
                      setShowKillConfirm(false);
                      onKillSwitch();
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    EXECUTE HARD KILL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
