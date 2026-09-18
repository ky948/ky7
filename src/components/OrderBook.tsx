import React from 'react';
import { OrderBook as OrderBookType } from '../types';
import { Layers } from 'lucide-react';

interface OrderBookProps {
  orderBook: OrderBookType | null;
  currentPrice: number;
  imbalance: number; // -1 to 1
}

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook, currentPrice, imbalance }) => {
  if (!orderBook) {
    return (
      <div className="bg-[#0b101c] border border-[#1a253d] rounded-xl p-4 flex items-center justify-center text-xs font-mono text-slate-500 h-full">
        Loading L2 Depth Ladder...
      </div>
    );
  }

  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
  const maxAskTotal = orderBook.asks[0]?.total || 1;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);

  const isBuyImbalance = imbalance >= 0;

  return (
    <div id="order-book-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>L2 ORDER BOOK</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Spread: <span className="text-slate-200 font-semibold">${orderBook.spread.toFixed(2)}</span> ({orderBook.spreadPercent.toFixed(3)}%)
        </div>
      </div>

      {/* Imbalance Meter */}
      <div className="px-3 py-1.5 bg-[#0d1322] border-b border-[#18233a] flex items-center justify-between text-[10px]">
        <span className="text-slate-400">Depth Imbalance:</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-[#172238] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-rose-500/80 transition-all duration-300"
              style={{ width: `${Math.max(10, Math.min(90, (1 - imbalance) * 50))}%` }}
            ></div>
            <div
              className="h-full bg-emerald-500/80 transition-all duration-300"
              style={{ width: `${Math.max(10, Math.min(90, (1 + imbalance) * 50))}%` }}
            ></div>
          </div>
          <span className={`font-bold ${isBuyImbalance ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isBuyImbalance ? '+' : ''}{(imbalance * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Columns Header */}
      <div className="grid grid-cols-3 px-3 py-1 text-[10px] text-slate-500 border-b border-[#162136]">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end p-1 space-y-0.5">
        {orderBook.asks.slice(-7).map((ask, i) => {
          const depthPercent = Math.min(100, (ask.total / maxTotal) * 100);
          return (
            <div key={`ask_${i}`} className="relative grid grid-cols-3 px-2 py-0.5 text-[11px] hover:bg-rose-950/20">
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              ></div>
              <span className="text-rose-400 font-medium z-10">${ask.price.toFixed(2)}</span>
              <span className="text-right text-slate-300 z-10">{ask.amount.toFixed(3)}</span>
              <span className="text-right text-slate-500 z-10">{ask.total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Mid Market Price Bar */}
      <div className="px-3 py-1.5 bg-[#10182b] border-y border-[#1c2944] flex items-center justify-between text-xs font-bold text-slate-100">
        <span className="text-emerald-400 text-sm">${currentPrice.toFixed(2)}</span>
        <span className="text-[10px] font-normal text-slate-400">Mark Price</span>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="flex-1 overflow-hidden flex flex-col p-1 space-y-0.5">
        {orderBook.bids.slice(0, 7).map((bid, i) => {
          const depthPercent = Math.min(100, (bid.total / maxTotal) * 100);
          return (
            <div key={`bid_${i}`} className="relative grid grid-cols-3 px-2 py-0.5 text-[11px] hover:bg-emerald-950/20">
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              ></div>
              <span className="text-emerald-400 font-medium z-10">${bid.price.toFixed(2)}</span>
              <span className="text-right text-slate-300 z-10">{bid.amount.toFixed(3)}</span>
              <span className="text-right text-slate-500 z-10">{bid.total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
