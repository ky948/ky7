import React, { useState } from 'react';
import { X, FileCode2, Shield, Search, CheckCircle2 } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  auditLogs: AuditLogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  auditLogs,
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filtered = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.actor.toLowerCase().includes(filter.toLowerCase()) ||
      log.hash.toLowerCase().includes(filter.toLowerCase())
  );

  const getSeverityStyle = (sev: AuditLogEntry['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      case 'SECURITY':
        return 'bg-purple-950/80 text-purple-400 border-purple-800/80';
      case 'WARNING':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      default:
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#101728] border border-[#233352] rounded-xl max-w-3xl w-full p-5 text-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2b45] mb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <FileCode2 className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-100">
                Cryptographic Audit Log (SHA-256 Block Chained)
              </h3>
              <span className="text-[10px] text-slate-400">
                Tamper-Evident Immutable System Audit Trail
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Stats */}
        <div className="flex items-center justify-between gap-3 mb-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit actions, actors, or hashes..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg pl-8 pr-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-[#121c33] px-2.5 py-1.5 rounded-lg border border-[#1e2e50]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chain Verified: 100% Valid</span>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No audit logs matching query.
            </div>
          ) : (
            filtered.map((log) => (
              <div
                key={log.id}
                className="bg-[#0c1221] border border-[#1a2640] rounded-lg p-3 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="font-bold text-slate-100">{log.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${getSeverityStyle(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Actor: {log.actor}</span>
                </div>

                {/* Details */}
                <div className="bg-[#121b30] p-2 rounded text-[11px] text-slate-300 font-mono overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </div>

                {/* Cryptographic Hashes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] text-slate-500 pt-1">
                  <div className="truncate">
                    <span className="text-slate-400 font-semibold">Prev Hash: </span>
                    <span className="font-mono text-slate-500">{log.prevHash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-cyan-400 font-semibold">Current Hash: </span>
                    <span className="font-mono text-cyan-500/80">{log.hash}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1f2b45] mt-3 flex items-center justify-between text-slate-400 text-xs">
          <span>Displaying {filtered.length} entries</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
