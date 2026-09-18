import React, { useState } from 'react';
import { Order, TradeRecord } from '../types';
import { ListOrdered, History, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';

interface OrdersAndHistoryProps {
  orders: Order[];
  tradeHistory: TradeRecord[];
  onCancelOrder: (orderId: string) => void;
}

export const OrdersAndHistory: React.FC<OrdersAndHistoryProps> = ({
  orders,
  tradeHistory,
  onCancelOrder,
}) => {
  const [tab, setTab] = useState<'ORDERS' | 'HISTORY'>('ORDERS');

  return (
    <div id="orders-history-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Tab Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('ORDERS')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              tab === 'ORDERS'
                ? 'bg-[#18243d] text-slate-100 font-bold border border-[#2b3e66]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPEN ORDERS</span>
            <span className="text-[10px] text-slate-500">({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('HISTORY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              tab === 'HISTORY'
                ? 'bg-[#18243d] text-slate-100 font-bold border border-[#2b3e66]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>TRADE HISTORY</span>
            <span className="text-[10px] text-slate-500">({tradeHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {tab === 'ORDERS' ? (
          orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
              No pending open orders.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1322] border-b border-[#18233a] text-[10px] text-slate-400">
                  <th className="px-3 py-2 font-medium">TIME</th>
                  <th className="px-3 py-2 font-medium">SYMBOL / SIDE</th>
                  <th className="px-3 py-2 font-medium">TYPE</th>
                  <th className="px-3 py-2 font-medium">LIMIT PRICE</th>
                  <th className="px-3 py-2 font-medium">SIZE</th>
                  <th className="px-3 py-2 font-medium">REASON</th>
                  <th className="px-3 py-2 font-medium text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151f33]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#0f172a]/40">
                    <td className="px-3 py-2 text-slate-400">{new Date(ord.createdAt).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">
                      <span className="font-bold text-slate-100 mr-1.5">{ord.symbol}</span>
                      <span className={`text-[10px] font-bold ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ord.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{ord.type}</td>
                    <td className="px-3 py-2 text-slate-100 font-bold">${ord.price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-300">{ord.size}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-400">{ord.reason || ord.strategyId}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onCancelOrder(ord.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Cancel Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : tradeHistory.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
            No closed trade history yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1322] border-b border-[#18233a] text-[10px] text-slate-400">
                <th className="px-3 py-2 font-medium">CLOSED TIME</th>
                <th className="px-3 py-2 font-medium">SYMBOL / SIDE</th>
                <th className="px-3 py-2 font-medium">ENTRY &gt; EXIT</th>
                <th className="px-3 py-2 font-medium">REALIZED PNL</th>
                <th className="px-3 py-2 font-medium">STRATEGY</th>
                <th className="px-3 py-2 font-medium text-right">EXIT REASON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151f33]">
              {tradeHistory.map((tr) => {
                const isPos = tr.realizedPnl >= 0;
                return (
                  <tr key={tr.id} className="hover:bg-[#0f172a]/40">
                    <td className="px-3 py-2 text-slate-400">{new Date(tr.closedAt).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">
                      <span className="font-bold text-slate-100 mr-1.5">{tr.symbol}</span>
                      <span className={`text-[10px] font-semibold ${tr.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tr.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      ${tr.entryPrice.toFixed(2)} &rarr; ${tr.exitPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 font-bold">
                      <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPos ? '+' : ''}${tr.realizedPnl.toFixed(2)} ({isPos ? '+' : ''}{tr.realizedPnlPercent.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 text-[11px]">{tr.strategyName}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tr.exitReason}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
