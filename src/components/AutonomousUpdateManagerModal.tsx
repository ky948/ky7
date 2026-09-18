import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  StepForward,
  RefreshCw,
  Clock,
  Terminal,
  FileCode,
  Layers,
  Lock,
  Cpu,
  Activity,
  ArrowRight,
  Database,
  Binary,
  Check,
  Zap,
  Info,
  Sliders,
  Server,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import {
  UpdateManagerSystemState,
  SoftwareUpdatePackage,
  UpdateCategory,
  UpdateLifecycleStage,
  UpdateStageLog,
} from '../types';
import {
  fetchUpdateManagerState,
  checkAllUpdatesNow,
  runUpdatePipeline,
  stepUpdatePipeline,
  rollbackSystemVersion,
  toggleUpdateAutoDaemon,
  resetCandidatePackage,
} from '../services/api';

interface AutonomousUpdateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification: (message: string, type: 'SUCCESS' | 'ERROR' | 'WARN') => void;
}

const LIFECYCLE_STAGES: { stage: UpdateLifecycleStage; label: string; stepNumber: number; description: string }[] = [
  { stage: 'DISCOVER_UPDATE', label: 'DISCOVER UPDATE', stepNumber: 1, description: 'Poll upstream release channels & verify manifests' },
  { stage: 'DOWNLOAD', label: 'DOWNLOAD', stepNumber: 2, description: 'Secure TLS artifact retrieval & chunk caching' },
  { stage: 'VERIFY_SIGNATURE_INTEGRITY', label: 'VERIFY SIGNATURE / INTEGRITY', stepNumber: 3, description: 'Zero-trust Ed25519 root key verification & SHA-256 checksum' },
  { stage: 'BUILD', label: 'BUILD', stepNumber: 4, description: 'Hermetic containerized binary & dependency compilation' },
  { stage: 'AUTOMATED_TESTS', label: 'AUTOMATED TESTS', stepNumber: 5, description: 'Unit, integration & property-based quantitative regression tests' },
  { stage: 'SECURITY_TESTS', label: 'SECURITY TESTS', stepNumber: 6, description: 'SAST, dependency vulnerability CVE scan & secret leak audit' },
  { stage: 'BACKTEST', label: 'BACKTEST', stepNumber: 7, description: '10,000 candle high-frequency historical simulation' },
  { stage: 'PAPER_TEST', label: 'PAPER TEST', stepNumber: 8, description: 'Isolated sandbox mock execution with orderbook matching' },
  { stage: 'COMPATIBILITY_TEST', label: 'COMPATIBILITY TEST', stepNumber: 9, description: 'Exchange API protocol & market data schema validation' },
  { stage: 'CANARY_DEPLOYMENT', label: 'CANARY DEPLOYMENT', stepNumber: 10, description: '5% synthetic volume routing with latency telemetry' },
  { stage: 'HEALTH_MONITORING', label: 'HEALTH MONITORING', stepNumber: 11, description: 'Real-time invariant checking & memory leak detection' },
  { stage: 'FULL_DEPLOYMENT', label: 'FULL DEPLOYMENT', stepNumber: 12, description: 'Atomic hot-swap promotion to production engine' },
];

export const AutonomousUpdateManagerModal: React.FC<AutonomousUpdateManagerModalProps> = ({
  isOpen,
  onClose,
  onNotification,
}) => {
  const [systemState, setSystemState] = useState<UpdateManagerSystemState | null>(null);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'CATEGORIES' | 'HISTORY' | 'TRUST_ENGINE'>('PIPELINE');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg_simd_v242');
  const [selectedStage, setSelectedStage] = useState<UpdateLifecycleStage>('VERIFY_SIGNATURE_INTEGRITY');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoChecking, setIsAutoChecking] = useState<boolean>(false);

  // Manual Rollback confirmation modal state
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<boolean>(false);
  const [rollbackReason, setRollbackReason] = useState<string>('');

  // Load update state
  const loadState = useCallback(async () => {
    try {
      const res = await fetchUpdateManagerState();
      setSystemState(res.state);
      if (res.state.activeUpdateId && !selectedPackageId) {
        setSelectedPackageId(res.state.activeUpdateId);
      }
    } catch (err) {
      console.warn('Notice fetching update manager state:', err);
    }
  }, [selectedPackageId]);

  useEffect(() => {
    if (isOpen) {
      loadState();
      const interval = setInterval(loadState, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, loadState]);

  if (!isOpen) return null;

  const currentPackage =
    systemState?.updateHistory.find((p) => p.id === selectedPackageId) ||
    systemState?.updateHistory[0];

  const currentStageLog =
    currentPackage?.stageLogs.find((s) => s.stage === selectedStage) ||
    currentPackage?.stageLogs[0];

  // Actions
  const handleCheckAllNow = async () => {
    try {
      setIsAutoChecking(true);
      const res = await checkAllUpdatesNow();
      setSystemState(res.state);
      onNotification('Scanned all 10 monitored categories. Upstream channels verified.', 'SUCCESS');
    } catch (err: any) {
      onNotification(err.message || 'Check failed', 'ERROR');
    } finally {
      setIsAutoChecking(false);
    }
  };

  const handleRunFullPipeline = async (simulateFailureStage?: string, simulateUntrusted?: boolean) => {
    if (!currentPackage) return;
    try {
      setIsLoading(true);
      const res = await runUpdatePipeline({
        packageId: currentPackage.id,
        simulateFailureStage,
        simulateUntrusted,
      });
      setSystemState(res.state);
      if (simulateUntrusted) {
        onNotification('Zero-trust invariant triggered: Untrusted code rejected at Stage 3.', 'WARN');
      } else if (simulateFailureStage) {
        onNotification(`Simulation: Invariant failure at [${simulateFailureStage}]. System automatically rolled back to known-good version.`, 'WARN');
      } else {
        onNotification(`Package ${currentPackage.version} passed all 12 stages and deployed to production!`, 'SUCCESS');
      }
    } catch (err: any) {
      onNotification(err.message || 'Pipeline execution failed', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepPipeline = async () => {
    if (!currentPackage) return;
    try {
      setIsLoading(true);
      const res = await stepUpdatePipeline({ packageId: currentPackage.id });
      setSystemState(res.state);
      onNotification(`Executed stage: ${res.stageResult.stage}. Status: ${res.stageResult.status}`, 'SUCCESS');
    } catch (err: any) {
      onNotification(err.message || 'Step execution failed', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCandidate = async () => {
    try {
      setIsLoading(true);
      const res = await resetCandidatePackage();
      setSystemState(res.state);
      setSelectedPackageId('pkg_simd_v242');
      onNotification('Candidate package reset to PENDING state for testing.', 'SUCCESS');
    } catch (err: any) {
      onNotification(err.message || 'Reset failed', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteRollback = async () => {
    try {
      setIsLoading(true);
      const res = await rollbackSystemVersion({
        targetVersion: systemState?.previousKnownGoodVersion,
        reason: rollbackReason || 'Operator executed manual atomic rollback',
      });
      setSystemState(res.state);
      setShowRollbackConfirm(false);
      setRollbackReason('');
      onNotification(`Atomic rollback completed: System reverted from ${res.rolledBackFrom} to ${res.rolledBackTo}`, 'SUCCESS');
    } catch (err: any) {
      onNotification(err.message || 'Rollback failed', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoDaemon = async () => {
    try {
      const res = await toggleUpdateAutoDaemon();
      if (systemState) {
        setSystemState({
          ...systemState,
          autoCheckEnabled: res.autoCheckEnabled,
        });
      }
      onNotification(`Autonomous Update Daemon ${res.autoCheckEnabled ? 'ENABLED (Polling every 30s)' : 'PAUSED'}`, 'SUCCESS');
    } catch (err: any) {
      onNotification(err.message || 'Toggle failed', 'ERROR');
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-600/40';
      case 'RUNNING':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50 animate-pulse';
      case 'FAILED':
        return 'text-red-400 bg-red-950/70 border-red-600/50';
      case 'ROLLED_BACK':
        return 'text-amber-400 bg-amber-950/60 border-amber-600/50';
      default:
        return 'text-slate-500 bg-slate-900/60 border-slate-800';
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'RUNNING':
        return <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'ROLLED_BACK':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="autonomous-update-manager-modal"
        className="relative w-full max-w-6xl bg-[#090d16] border border-[#1e293b] rounded-xl shadow-2xl flex flex-col max-h-[92vh] text-slate-200 overflow-hidden font-mono"
      >
        {/* Top Cockpit Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#1e293b] bg-[#0c1220]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">
                  CONTROLLED AUTONOMOUS UPDATE MANAGER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950/70 border border-teal-700/50 text-teal-300 font-bold">
                  12-STAGE LIFECYCLE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Active Version:</span>
                <span className="text-emerald-400 font-semibold">{systemState?.currentSystemVersion || 'v2.4.1-LTS'}</span>
                <span className="text-slate-600">•</span>
                <span>Known-Good Fallback:</span>
                <span className="text-cyan-400 font-semibold">{systemState?.previousKnownGoodVersion || 'v2.3.8-LTS'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">Zero-Trust Arbitrary Code Protection</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Check Daemon Toggle */}
            <button
              id="btn-toggle-auto-check"
              type="button"
              onClick={handleToggleAutoDaemon}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                systemState?.autoCheckEnabled
                  ? 'bg-teal-950/60 border-teal-600/60 text-teal-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${systemState?.autoCheckEnabled ? 'text-teal-400 fill-teal-400' : 'text-slate-500'}`} />
              <span>DAEMON: {systemState?.autoCheckEnabled ? 'ACTIVE (30s)' : 'PAUSED'}</span>
            </button>

            {/* Check All Now Button */}
            <button
              id="btn-scan-updates-now"
              type="button"
              onClick={handleCheckAllNow}
              disabled={isAutoChecking}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#142036] hover:bg-[#1c2e4e] border border-[#2b4069] text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isAutoChecking ? 'animate-spin' : ''}`} />
              <span>SCAN TARGETS</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-update-modal"
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Global Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-2.5 bg-[#080d17] border-b border-[#162136] text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-500">Monitored Categories:</span>
            <span className="text-slate-200 font-semibold">10 / 10 Active Targets</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">Verified Deployments:</span>
            <span className="text-emerald-400 font-semibold">{systemState?.totalUpdatesApplied || 0} Successful Hot-Swaps</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">Auto Rollbacks:</span>
            <span className="text-amber-400 font-semibold">{systemState?.totalRollbacksTriggered || 0} Invariant Protects</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">Untrusted Code Blocked:</span>
            <span className="text-red-400 font-semibold">{systemState?.untrustedRejectionsCount || 0} Signatures Rejected</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">Keystore Status:</span>
            <span className="text-teal-400 font-semibold">Ed25519 Root Key Verified</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-[#1e293b] bg-[#0a0f1c] text-xs">
          <button
            id="tab-btn-pipeline"
            type="button"
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'PIPELINE'
                ? 'border-teal-400 text-teal-300 font-bold bg-teal-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>12-Stage Lifecycle Pipeline</span>
          </button>
          <button
            id="tab-btn-categories"
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'CATEGORIES'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>10 Monitored Categories</span>
          </button>
          <button
            id="tab-btn-history"
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-indigo-400 text-indigo-300 font-bold bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rollback & Package History</span>
          </button>
          <button
            id="tab-btn-trust"
            type="button"
            onClick={() => setActiveTab('TRUST_ENGINE')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'TRUST_ENGINE'
                ? 'border-amber-400 text-amber-300 font-bold bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Trust Cryptographic Core</span>
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: 12-STAGE LIFECYCLE PIPELINE */}
          {activeTab === 'PIPELINE' && (
            <div className="space-y-5">
              {/* Package Selector & Live Status Banner */}
              <div className="p-4 rounded-xl bg-[#0c1424] border border-[#1e2f4f] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Active Pipeline Target:</span>
                    <select
                      id="select-active-package"
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="bg-[#142036] border border-[#263c63] text-teal-300 font-mono text-xs rounded px-2.5 py-1 focus:outline-none focus:border-teal-400"
                    >
                      {systemState?.updateHistory.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.version} • {pkg.title.substring(0, 48)}... [{pkg.status}]
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        currentPackage?.status === 'DEPLOYED'
                          ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                          : currentPackage?.status === 'FAILED_ROLLED_BACK'
                          ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                          : currentPackage?.status === 'REJECTED_UNTRUSTED'
                          ? 'bg-red-950/60 border-red-600/60 text-red-300'
                          : 'bg-cyan-950/60 border-cyan-600/60 text-cyan-300'
                      }`}
                    >
                      {currentPackage?.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">{currentPackage?.description}</p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-run-full-pipeline"
                    type="button"
                    onClick={() => handleRunFullPipeline()}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-slate-950 transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(20,184,166,0.25)] disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>RUN 12-STAGE PIPELINE</span>
                  </button>

                  <button
                    id="btn-step-pipeline"
                    type="button"
                    onClick={handleStepPipeline}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#17253d] hover:bg-[#203456] border border-[#2d4673] text-teal-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <StepForward className="w-3.5 h-3.5 text-teal-400" />
                    <span>STEP NEXT STAGE</span>
                  </button>

                  <button
                    id="btn-reset-candidate"
                    type="button"
                    onClick={handleResetCandidate}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Reset candidate package to PENDING state"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Simulation Testing Toolstrip */}
              <div className="p-3 rounded-lg bg-[#0e172a] border border-[#223554] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>SAFETY INVARIANT BENCHMARKS:</span>
                  </span>
                  <span className="text-slate-400 hidden sm:inline">
                    Simulate real-world verification failures & zero-trust invariant protections
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-simulate-untrusted"
                    type="button"
                    onClick={() => handleRunFullPipeline(undefined, true)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded bg-red-950/50 hover:bg-red-900/60 border border-red-700/60 text-red-300 font-medium transition-colors flex items-center gap-1"
                    title="Test zero-trust invariant: Rejects untrusted arbitrary code at Stage 3"
                  >
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <span>Test Untrusted Code Block</span>
                  </button>

                  <button
                    id="btn-simulate-fail-rollback"
                    type="button"
                    onClick={() => handleRunFullPipeline('BACKTEST')}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 text-amber-300 font-medium transition-colors flex items-center gap-1"
                    title="Simulate Backtest failure triggering atomic automatic rollback to known-good baseline"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>Test Invariant Fail & Rollback</span>
                  </button>
                </div>
              </div>

              {/* 12-STAGE PIPELINE FLOW DIAGRAM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Continuous 12-Stage Lifecycle Sequence
                  </span>
                  <span className="text-[11px] text-teal-400 font-mono">
                    Deterministic Progression • Atomic Invariant Guardrails
                  </span>
                </div>

                {/* Stages Visual Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {LIFECYCLE_STAGES.map((stageItem) => {
                    const log = currentPackage?.stageLogs.find((s) => s.stage === stageItem.stage);
                    const status = log?.status || 'PENDING';
                    const isSelected = selectedStage === stageItem.stage;

                    return (
                      <div
                        key={stageItem.stage}
                        id={`stage-card-${stageItem.stepNumber}`}
                        onClick={() => setSelectedStage(stageItem.stage)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'ring-2 ring-teal-500/80 bg-[#121e33] border-teal-500'
                            : 'bg-[#0a101d] hover:bg-[#0f1728] border-[#1a2742]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                              STAGE {stageItem.stepNumber.toString().padStart(2, '0')}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${getStageStatusColor(
                                status
                              )}`}
                            >
                              {getStageStatusIcon(status)}
                              <span>{status}</span>
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-200 tracking-tight">
                            {stageItem.label}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                            {stageItem.description}
                          </p>
                        </div>

                        {log && log.durationMs > 0 && (
                          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-[#18243b] pt-1">
                            <span>Latency: {log.durationMs}ms</span>
                            <span className="text-teal-400 font-mono">Inspect ➔</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Deep Telemetry Inspector */}
              {currentStageLog && (
                <div className="p-4 rounded-xl bg-[#090f1d] border border-[#1b2b48] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#18263f] pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        STAGE TELEMETRY: {currentStageLog.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getStageStatusColor(
                          currentStageLog.status
                        )}`}
                      >
                        {getStageStatusIcon(currentStageLog.status)}
                        <span>{currentStageLog.status}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      <span>Execution Duration:</span>{' '}
                      <span className="text-slate-200 font-bold">{currentStageLog.durationMs} ms</span>
                      <span className="mx-2">•</span>
                      <span>Timestamp:</span>{' '}
                      <span className="text-slate-200">{new Date(currentStageLog.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-[#060a14] p-3 rounded-lg border border-[#162136]">
                    <span className="text-slate-500 font-semibold block mb-1">AUDIT VERIFICATION LOG:</span>
                    {currentStageLog.details}
                  </div>

                  {currentStageLog.metrics && Object.keys(currentStageLog.metrics).length > 0 && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold uppercase block mb-1.5">
                        Invariant Telemetry & Key Value Metrics:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {Object.entries(currentStageLog.metrics).map(([key, value]) => (
                          <div key={key} className="p-2 rounded bg-[#0e1628] border border-[#1a2842]">
                            <span className="text-slate-500 text-[10px] block">{key}</span>
                            <span
                              className={`font-semibold ${
                                typeof value === 'boolean'
                                  ? value
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 10 MONITORED CATEGORIES */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0c1322] border border-[#1c2c47]">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase">
                    10 Autonomous Continuous Monitoring Subsystems
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Continuous zero-touch scanning across platform runtime, cryptographic dependencies, exchange APIs, schemas, and AI models.
                  </p>
                </div>
                <button
                  id="btn-scan-categories-tab"
                  type="button"
                  onClick={handleCheckAllNow}
                  disabled={isAutoChecking}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAutoChecking ? 'animate-spin' : ''}`} />
                  <span>Scan All 10 Subsystems Now</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {systemState?.categoriesMonitored.map((cat) => (
                  <div
                    key={cat.category}
                    id={`cat-card-${cat.category.toLowerCase()}`}
                    className="p-3.5 rounded-lg bg-[#0a101d] border border-[#1b2b47] hover:border-[#253d66] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                        <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          cat.status === 'OPTIMAL'
                            ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                            : cat.status === 'PATCH_APPLIED'
                            ? 'bg-teal-950/60 border-teal-600/60 text-teal-300'
                            : 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </div>

                    <div className="text-[11px] bg-[#070b14] p-2.5 rounded border border-[#142036] mb-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Category Classification:</span>
                        <span className="text-slate-200 font-mono font-semibold">{cat.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Verification Target:</span>
                        <span className="text-teal-400 font-mono font-semibold">Continuous Autonomic Invariant</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {cat.details}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#15223a] pt-2">
                      <span>Telemetry: <span className="text-teal-400 font-bold">HEALTHY</span></span>
                      <span>Checked: {new Date(cat.lastChecked).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROLLBACK & PACKAGE HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              {/* Rollback Overview Box */}
              <div className="p-4 rounded-xl bg-[#11192e] border border-[#22355c] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100 uppercase">
                      Known-Good Fallback & Emergency Atomic Rollback
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Every software deployment creates an immutable checkpoint. If any invariant, backtest Sharpe delta, or canary error threshold is violated, the system immediately reverts to the known-good baseline:
                    <span className="text-amber-300 font-bold ml-1">{systemState?.previousKnownGoodVersion || 'v2.3.8-LTS'}</span>.
                  </p>
                </div>

                <button
                  id="btn-emergency-rollback"
                  type="button"
                  onClick={() => setShowRollbackConfirm(true)}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 fill-slate-950" />
                  <span>ENGAGE MANUAL ATOMIC ROLLBACK</span>
                </button>
              </div>

              {/* Confirmation Dialog */}
              {showRollbackConfirm && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/60 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>CONFIRM SYSTEM VERSION ROLLBACK</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This will immediately restore system runtime from <span className="text-emerald-400 font-bold">{systemState?.currentSystemVersion}</span> to verified known-good baseline <span className="text-amber-300 font-bold">{systemState?.previousKnownGoodVersion}</span>. All active quantitative strategies will continue executing on validated parameters.
                  </p>
                  <input
                    type="text"
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    placeholder="Enter reason for rollback audit trail..."
                    className="w-full bg-[#090e1c] border border-amber-800/60 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExecuteRollback}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
                    >
                      Confirm & Revert Runtime
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRollbackConfirm(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Update Package Ledger Table */}
              <div className="rounded-xl border border-[#1b2b48] overflow-hidden bg-[#0a101d]">
                <div className="px-4 py-2.5 bg-[#0e1628] border-b border-[#1b2b48] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase">
                    Software Release & Verification Ledger
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: {systemState?.updateHistory.length || 0} Packages Logged
                  </span>
                </div>

                <div className="divide-y divide-[#15223a]">
                  {systemState?.updateHistory.map((pkg) => (
                    <div key={pkg.id} className="p-3.5 space-y-2 hover:bg-[#0f1728] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 font-mono">{pkg.version}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({pkg.previousVersion} ➔ {pkg.version})</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              pkg.status === 'DEPLOYED'
                                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                                : pkg.status === 'FAILED_ROLLED_BACK'
                                ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                                : pkg.status === 'REJECTED_UNTRUSTED'
                                ? 'bg-red-950/60 border-red-600/60 text-red-300'
                                : 'bg-cyan-950/60 border-cyan-600/60 text-cyan-300'
                            }`}
                          >
                            {pkg.status}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {pkg.category}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(pkg.discoveredAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 font-semibold">{pkg.title}</div>
                      <p className="text-[11px] text-slate-400">{pkg.description}</p>

                      {/* Safety Metrics Badge Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#070b14] p-2 rounded border border-[#142036]">
                        <div>
                          <span className="text-slate-500 block">Tests:</span>
                          <span className="text-emerald-400 font-semibold">
                            {pkg.safetyReport.testsPassedCount} / {pkg.safetyReport.testsTotalCount} Passed
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CVE Vulnerabilities:</span>
                          <span
                            className={`font-semibold ${
                              pkg.safetyReport.cveVulnerabilitiesFound === 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {pkg.safetyReport.cveVulnerabilitiesFound} Found
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Backtest Sharpe Delta:</span>
                          <span
                            className={`font-semibold ${
                              pkg.safetyReport.backtestSharpeDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {pkg.safetyReport.backtestSharpeDelta >= 0 ? '+' : ''}
                            {pkg.safetyReport.backtestSharpeDelta}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Signature:</span>
                          <span
                            className={`font-semibold ${
                              pkg.signatureVerified ? 'text-teal-400' : 'text-red-400'
                            }`}
                          >
                            {pkg.signatureVerified ? 'VERIFIED' : 'UNTRUSTED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ZERO-TRUST CRYPTOGRAPHIC CORE */}
          {activeTab === 'TRUST_ENGINE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0d1424] border border-[#1e2f4f] space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase">
                    Zero-Trust Cryptographic Invariant Enforcement
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-200 leading-relaxed">
                  <span className="font-bold text-red-300 block mb-1">
                    PRIMARY SECURITY DIRECTIVE: "Never automatically install untrusted arbitrary code."
                  </span>
                  The system mandates that all software updates, dependency upgrades, and ML parameter weights possess a cryptographically valid Ed25519 signature originating from the authorized release authority keystore. Any unverified payload is immediately quarantined and blocked at Stage 3 prior to sandbox compilation.
                </div>
              </div>

              {/* Cryptographic Keystore Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-[#090f1d] border border-[#1a2842] space-y-2">
                  <div className="flex items-center gap-2 text-teal-300 font-bold">
                    <KeyRound className="w-4 h-4 text-teal-400" />
                    <span>Authorized Root Release Keystore</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-[#060a14] p-2 rounded border border-[#141f33] break-all">
                    {systemState?.trustedRootKeyId || 'ED25519:0x8F92E31D94BA4B01 (Institutional Release Authority)'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Hardware Security Module (HSM) anchored root key. Only signed releases from this key are permitted into Stage 4 (BUILD).
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#090f1d] border border-[#1a2842] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span>Cryptographic Verification Invariants</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SHA-256 binary artifact checksum matching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Release provenance manifest verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Anti-tamper sandbox execution barrier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#1e293b] bg-[#0c1220] text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Autonomous Engine:</span>
            <span className="text-slate-200 font-semibold">ONLINE</span>
            <span className="text-slate-600">•</span>
            <span>Check Interval:</span>
            <span className="text-slate-200">{systemState?.checkIntervalSeconds || 30}s</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
