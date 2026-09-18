import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Key, CheckCircle2, AlertOctagon } from 'lucide-react';

interface SecurityVaultModalProps {
  vaultConfig: {
    exchange: string;
    apiKeyMasked: string;
    apiSecretSet: boolean;
    status: 'SEALED' | 'UNLOCKED_READ_TRADE';
    withdrawalsEnabled: boolean;
    whitelistedIPOnly: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdateVault: (data: { exchange?: string; apiKey?: string; apiSecret?: string; status?: 'SEALED' | 'UNLOCKED_READ_TRADE' }) => void;
}

export const SecurityVaultModal: React.FC<SecurityVaultModalProps> = ({
  vaultConfig,
  isOpen,
  onClose,
  onUpdateVault,
}) => {
  const [exchange, setExchange] = useState(vaultConfig.exchange);
  const [newKey, setNewKey] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [status, setStatus] = useState(vaultConfig.status);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVault({
      exchange,
      apiKey: newKey || undefined,
      apiSecret: newSecret || undefined,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#101728] border border-[#233352] rounded-xl max-w-lg w-full p-5 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2b45] mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-100">
              Institutional API Key Vault & Encryption
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Security Status Box */}
          <div className="bg-[#141e36] border border-[#223359] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vault Security State:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                status === 'UNLOCKED_READ_TRADE'
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-700/60 text-amber-400'
              }`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#1e2c4d]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Read &amp; Trade Access</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Withdrawals: BLOCKED</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Zero-Trust Architecture: API keys are strictly restricted to trading permissions. System will reject any credential requesting withdrawal privileges.
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Target Crypto Exchange:</label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
            >
              <option value="Binance Institutional">Binance Institutional Spot &amp; Futures</option>
              <option value="Bybit Private VIP">Bybit Private VIP Derivatives</option>
              <option value="Kraken Institutional">Kraken Institutional Pro</option>
              <option value="Coinbase Advanced">Coinbase Advanced Quantitative</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Current Active Key (Masked):</label>
            <div className="bg-[#0b101c] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 font-mono text-[11px]">
              {vaultConfig.apiKeyMasked}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Rotate API Key (Optional):</label>
            <input
              type="text"
              placeholder="Paste new API key to rotate..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Rotate API Secret (Optional):</label>
            <input
              type="password"
              placeholder="Paste new API secret..."
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1f2b45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
