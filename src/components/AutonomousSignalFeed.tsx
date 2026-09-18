import React from 'react';
import { SignalEvent } from '../types';
import { Terminal, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AutonomousSignalFeedProps {
  signals: SignalEvent[];
}

export const AutonomousSignalFeed: React.FC<AutonomousSignalFeedProps> = ({ signals }) => {
  return (
    <div id="signal-feed-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>AUTONOMOUS SIGNAL STREAM & EXECUTION LOG</span>
        </div>
        <span className="text-[10px] text-slate-400">
          Real-Time Algorithmic Triggers
        </span>
      </div>

      {/* Terminal Feed */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2">
        {signals.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-slate-500 text-xs">
            Awaiting next market tick trigger...
          </div>
        ) : (
          signals.map((sig) => {
            const isBuy = sig.signalType === 'BUY_LONG';
            const isSell = sig.signalType === 'SELL_SHORT';

            return (
              <div
                key={sig.id}
                className="bg-[#0e1526] border border-[#1b273f] rounded-lg p-2.5 hover:border-[#2b3e64] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">
                      {new Date(sig.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-bold text-slate-100">{sig.symbol}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isBuy
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : isSell
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                      }`}
                    >
                      {sig.signalType.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Conf: <span className="text-cyan-400 font-semibold">{(sig.confidence * 100).toFixed(0)}%</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {sig.riskGuardPassed ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        Risk: PASS
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" />
                        Risk: BLOCKED
                      </span>
                    )}

                    {sig.executed && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-0.5 ml-1">
                        <CheckCircle2 className="w-3 h-3" />
                        EXECUTED
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug pl-1 border-l-2 border-[#2b3e64]">
                  {sig.rationale}
                </p>
                <div className="text-[10px] text-slate-500 mt-1 pl-1">
                  Strategy: {sig.strategy}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
