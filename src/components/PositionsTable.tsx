import React, { useState } from 'react';
import { Position } from '../types';
import { ArrowUpRight, ArrowDownRight, Edit3, X, Check, Shield } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
  onClosePosition: (positionId: string) => void;
  onUpdateSlTp: (positionId: string, stopLoss?: number, takeProfit?: number) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onClosePosition,
  onUpdateSlTp,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');

  const handleStartEdit = (pos: Position) => {
    setEditingId(pos.id);
    setEditSl(pos.stopLoss ? pos.stopLoss.toString() : '');
    setEditTp(pos.takeProfit ? pos.takeProfit.toString() : '');
  };

  const handleSaveEdit = (posId: string) => {
    onUpdateSlTp(
      posId,
      editSl ? Number(editSl) : undefined,
      editTp ? Number(editTp) : undefined
    );
    setEditingId(null);
  };

  return (
    <div id="positions-table-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Table Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">ACTIVE POSITIONS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-400">
            {positions.length} Open
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Auto-Hedging & Bracket Guard Active
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-slate-500 gap-1">
            <Shield className="w-5 h-5 opacity-40" />
            <span>No active open positions. Portfolio 100% in reserve margin.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1322] border-b border-[#18233a] text-[10px] text-slate-400">
                <th className="px-3 py-2 font-medium">SYMBOL / SIDE</th>
                <th className="px-3 py-2 font-medium">SIZE / LEV</th>
                <th className="px-3 py-2 font-medium">ENTRY PRICE</th>
                <th className="px-3 py-2 font-medium">MARK PRICE</th>
                <th className="px-3 py-2 font-medium">LIQ PRICE</th>
                <th className="px-3 py-2 font-medium">UNREALIZED PNL</th>
                <th className="px-3 py-2 font-medium">BRACKETS (SL / TP)</th>
                <th className="px-3 py-2 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151f33]">
              {positions.map((pos) => {
                const isLong = pos.side === 'LONG';
                const isPos = pos.unrealizedPnl >= 0;
                const isEditing = editingId === pos.id;

                return (
                  <tr key={pos.id} className="hover:bg-[#0f172a]/40 transition-colors">
                    {/* Symbol / Side */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{pos.symbol}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                            isLong
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          {pos.side}
                        </span>
                      </div>
                    </td>

                    {/* Size & Leverage */}
                    <td className="px-3 py-2.5 text-slate-300">
                      {pos.size} <span className="text-[10px] text-slate-500">[{pos.leverage}x]</span>
                    </td>

                    {/* Entry Price */}
                    <td className="px-3 py-2.5 text-slate-300">${pos.entryPrice.toFixed(2)}</td>

                    {/* Mark Price */}
                    <td className="px-3 py-2.5 text-slate-100 font-medium">${pos.markPrice.toFixed(2)}</td>

                    {/* Liquidation Price */}
                    <td className="px-3 py-2.5 text-rose-400 font-mono text-[11px]">${pos.liquidationPrice.toFixed(2)}</td>

                    {/* Unrealized PnL */}
                    <td className="px-3 py-2.5">
                      <div className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                        <span className="text-[10px] font-normal ml-1">
                          ({isPos ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>

                    {/* Brackets (SL / TP) */}
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="SL"
                            value={editSl}
                            onChange={(e) => setEditSl(e.target.value)}
                            className="w-16 bg-[#131d33] border border-slate-700 rounded px-1 py-0.5 text-[10px] text-slate-200"
                          />
                          <input
                            type="number"
                            placeholder="TP"
                            value={editTp}
                            onChange={(e) => setEditTp(e.target.value)}
                            className="w-16 bg-[#131d33] border border-slate-700 rounded px-1 py-0.5 text-[10px] text-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(pos.id)}
                            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-rose-400">SL: {pos.stopLoss ? `$${pos.stopLoss}` : '--'}</span>
                          <span className="text-emerald-400">TP: {pos.takeProfit ? `$${pos.takeProfit}` : '--'}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(pos)}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 transition-colors text-[10px] font-bold"
                      >
                        Market Close
                      </button>
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
