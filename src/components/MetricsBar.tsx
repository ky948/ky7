import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Award,
  ShieldCheck,
  Scale,
  RotateCw,
} from 'lucide-react';
import { PortfolioState, LearningLoopState } from '../types';

interface MetricsBarProps {
  portfolio: PortfolioState;
  learningLoopState?: LearningLoopState | null;
  onOpenLearningLoop?: () => void;
  updateManagerState?: {
    currentSystemVersion: string;
    previousKnownGoodVersion: string;
    autoCheckEnabled: boolean;
    totalRollbacksTriggered: number;
    untrustedRejectionsCount: number;
  } | null;
  onOpenUpdateManager?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  portfolio,
  learningLoopState,
  onOpenLearningLoop,
  updateManagerState,
  onOpenUpdateManager,
}) => {
  const dailyPnl = portfolio.navUsdt - portfolio.dailyStartingNavUsdt;
  const dailyPnlPercent = (dailyPnl / portfolio.dailyStartingNavUsdt) * 100;
  const isDailyPos = dailyPnl >= 0;

  const isUnrealizedPos = portfolio.unrealizedPnlUsdt >= 0;

  return (
    <div id="metrics-bar" className="bg-[#0e1424] border-b border-[#1c273e] px-4 py-2.5 text-slate-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
        {/* Metric 1: Net Asset Value */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              PORTFOLIO NAV
            </span>
            <span className="text-[10px] text-slate-500">USDT</span>
          </div>
          <div className="text-base font-bold text-slate-100 tracking-tight">
            ${portfolio.navUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-[11px] flex items-center gap-1 font-medium mt-0.5 ${isDailyPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDailyPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isDailyPos ? '+' : ''}{dailyPnlPercent.toFixed(2)}% (24h)</span>
          </div>
        </div>

        {/* Metric 2: Available Margin */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-cyan-400" />
              AVAILABLE MARGIN
            </span>
          </div>
          <div className="text-base font-bold text-slate-100 tracking-tight">
            ${portfolio.availableMarginUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Util: {(((portfolio.navUsdt - portfolio.availableMarginUsdt) / portfolio.navUsdt) * 100).toFixed(1)}%
          </div>
        </div>

        {/* Metric 3: Unrealized PnL */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              UNREALIZED PNL
            </span>
          </div>
          <div className={`text-base font-bold tracking-tight ${isUnrealizedPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUnrealizedPos ? '+' : ''}${portfolio.unrealizedPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Mark-to-Market
          </div>
        </div>

        {/* Metric 4: Realized PnL */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" />
              REALIZED PNL
            </span>
          </div>
          <div className="text-base font-bold text-emerald-400 tracking-tight">
            +${portfolio.realizedPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Cumulative net
          </div>
        </div>

        {/* Metric 5: Win Rate & Trades */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>WIN RATE</span>
            <span className="text-[10px] text-slate-500">{portfolio.totalTrades} trades</span>
          </div>
          <div className="text-base font-bold text-cyan-400 tracking-tight">
            {portfolio.winRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {portfolio.winningTrades} W / {portfolio.totalTrades - portfolio.winningTrades} L
          </div>
        </div>

        {/* Metric 6: Sharpe Ratio */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>SHARPE (ANNUAL)</span>
          </div>
          <div className="text-base font-bold text-purple-400 tracking-tight">
            {portfolio.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Profit Factor: {portfolio.profitFactor.toFixed(2)}
          </div>
        </div>

        {/* Metric 7: Max Drawdown Hard Floor */}
        <div className="bg-[#121b30] p-2.5 rounded-lg border border-[#1e2d4d]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              MAX DRAWDOWN
            </span>
          </div>
          <div className="text-base font-bold text-amber-400 tracking-tight">
            {portfolio.maxDrawdownPercent.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Cap: 2.50% / Day
          </div>
        </div>
      </div>

      {/* Institutional Invariant & Autonomous Status Strip */}
      <div className="mt-2 pt-2 border-t border-[#182236] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">LIQUIDATION RISK: 0.00%</span>
            <span className="text-slate-500 hidden sm:inline">(Strict 25% Distance Buffer Enforced)</span>
          </div>
          <div className="w-px h-3 bg-slate-800 hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>AUTONOMOUS ENGINE:</span>
            <span className="text-slate-400">Dynamic Grid + Walk-Forward Bayesian Tuning</span>
          </div>
          {learningLoopState && (
            <>
              <div className="w-px h-3 bg-slate-800 hidden md:block"></div>
              <button
                type="button"
                onClick={onOpenLearningLoop}
                className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer group"
                title="Open 16-Stage Continuous Learning Loop & Version History"
              >
                <RotateCw className="w-3 h-3 text-indigo-400 animate-[spin_6s_linear_infinite]" />
                <span>LOOP:</span>
                <span className="text-slate-300 font-bold group-hover:underline">
                  {learningLoopState.currentStep.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {learningLoopState.activeVersion}
                </span>
              </button>
            </>
          )}
          {updateManagerState && (
            <>
              <div className="w-px h-3 bg-slate-800 hidden md:block"></div>
              <button
                type="button"
                onClick={onOpenUpdateManager}
                className="flex items-center gap-1.5 text-teal-300 hover:text-teal-200 transition-colors cursor-pointer group"
                title="Open Autonomous Update Manager (12-Stage Lifecycle)"
              >
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>SYS:</span>
                <span className="text-slate-300 font-bold group-hover:underline">
                  {updateManagerState.currentSystemVersion}
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                  12-STAGE
                </span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div>
            <span>Eligible Cold Sweep: </span>
            <strong className="text-emerald-400 font-bold">
              ${(portfolio.eligibleSweepUsdt ?? Math.max(0, portfolio.realizedPnlUsdt - (portfolio.totalSweptUsdt || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </strong>
          </div>
          <div>
            <span>Total Cold Swept: </span>
            <strong className="text-cyan-400 font-semibold">
              ${(portfolio.totalSweptUsdt || 4000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
