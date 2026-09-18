import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { CryptoAsset } from '../types';

interface ManualOrderModalProps {
  assets: CryptoAsset[];
  selectedSymbol: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    price?: number;
    size: number;
  }) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  assets,
  selectedSymbol,
  isOpen,
  onClose,
  onSubmitOrder,
}) => {
  const [symbol, setSymbol] = useState(selectedSymbol);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [size, setSize] = useState('0.1');

  const currentAsset = assets.find((a) => a.symbol === symbol) || assets[0];
  const [price, setPrice] = useState(currentAsset ? currentAsset.price.toString() : '94250');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitOrder({
      symbol,
      side,
      type,
      price: type === 'LIMIT' ? Number(price) : undefined,
      size: Number(size),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#101728] border border-[#233352] rounded-xl max-w-md w-full p-5 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2b45] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Discretionary Owner Order Execution
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
          {/* Symbol & Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Asset Ticker:</label>
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  const a = assets.find((ast) => ast.symbol === e.target.value);
                  if (a) setPrice(a.price.toString());
                }}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-2.5 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              >
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} (${a.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Order Side:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'bg-[#141d33] border border-[#26375a] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                      : 'bg-[#141d33] border border-[#26375a] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Execution Type:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('MARKET')}
                className={`py-1.5 rounded-lg border text-center transition-colors font-semibold ${
                  type === 'MARKET'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-[#141d33] border-[#26375a] text-slate-400'
                }`}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setType('LIMIT')}
                className={`py-1.5 rounded-lg border text-center transition-colors font-semibold ${
                  type === 'LIMIT'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-[#141d33] border-[#26375a] text-slate-400'
                }`}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price */}
          {type === 'LIMIT' && (
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Limit Price (USDT):</label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          )}

          {/* Size */}
          <div>
            <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1">
              <span>Order Size (Units):</span>
              <span className="text-slate-500">
                Estimated Value: ${((Number(size) || 0) * (currentAsset?.price || 0)).toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              step="any"
              min="0.001"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-[#141d33] border border-[#26375a] rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              required
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
              className={`px-5 py-2 rounded-lg font-bold text-white shadow-lg ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
              }`}
            >
              Transmit {side} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
