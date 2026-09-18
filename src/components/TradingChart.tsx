import React, { useState, useMemo, useRef } from 'react';
import { Candle, CryptoAsset } from '../types';

interface TradingChartProps {
  asset: CryptoAsset;
  candles: Candle[];
  allAssets: CryptoAsset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  asset,
  candles,
  allAssets,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1D'>('5m');
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const displayCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.slice(-50); // Show last 50 candles
  }, [candles]);

  // Dimensions
  const width = 800;
  const height = 360;
  const paddingRight = 65;
  const paddingBottom = 40;
  const chartHeight = 240;
  const volumeHeight = 60;
  const rsiHeight = 50;

  // Compute price bounds
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (displayCandles.length === 0) {
      return { minPrice: 100, maxPrice: 200, maxVolume: 100 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const c of displayCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }
    const buffer = (max - min) * 0.08;
    return {
      minPrice: min - buffer,
      maxPrice: max + buffer,
      maxVolume: maxVol || 100,
    };
  }, [displayCandles]);

  const priceRange = maxPrice - minPrice || 1;
  const candleWidth = (width - paddingRight) / Math.max(1, displayCandles.length);

  // Compute EMA overlays
  const ema9Points = useMemo(() => {
    if (displayCandles.length === 0) return '';
    let k = 2 / (9 + 1);
    let ema = displayCandles[0].close;
    return displayCandles
      .map((c, i) => {
        ema = c.close * k + ema * (1 - k);
        const x = i * candleWidth + candleWidth / 2;
        const y = chartHeight - ((ema - minPrice) / priceRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [displayCandles, candleWidth, minPrice, priceRange, chartHeight]);

  const ema21Points = useMemo(() => {
    if (displayCandles.length === 0) return '';
    let k = 2 / (21 + 1);
    let ema = displayCandles[0].close;
    return displayCandles
      .map((c, i) => {
        ema = c.close * k + ema * (1 - k);
        const x = i * candleWidth + candleWidth / 2;
        const y = chartHeight - ((ema - minPrice) / priceRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [displayCandles, candleWidth, minPrice, priceRange, chartHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    const idx = Math.floor(x / candleWidth);
    if (idx >= 0 && idx < displayCandles.length) {
      setHoveredCandle(displayCandles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };

  const currentPriceY = chartHeight - ((asset.price - minPrice) / priceRange) * chartHeight;

  return (
    <div id="trading-chart-container" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden">
      {/* Top Bar: Asset Selector & Metrics Summary */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Assets tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {allAssets.map((a) => {
            const isSelected = a.symbol === selectedSymbol;
            const isPos = a.change24h >= 0;
            return (
              <button
                key={a.symbol}
                type="button"
                onClick={() => onSelectSymbol(a.symbol)}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1b2640] border border-[#2f436d] text-slate-100 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141d33]'
                }`}
              >
                <span>{a.symbol}</span>
                <span className={`text-[10px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{a.change24h.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeframe selector & Indicators Legend */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-cyan-400"></span> EMA 9: ${asset.ema9}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-amber-400"></span> EMA 21: ${asset.ema21}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              RSI: <span className="font-semibold text-purple-400">{asset.rsi}</span>
            </span>
          </div>

          <div className="flex items-center bg-[#131b2e] rounded p-0.5 border border-[#212f4d] text-[11px]">
            {(['1m', '5m', '15m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OHLCV Header Display */}
      <div className="px-4 py-1.5 bg-[#0d1322] border-b border-[#19243b] text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-3">
        {hoveredCandle ? (
          <>
            <span className="text-slate-200 font-semibold">{new Date(hoveredCandle.time).toLocaleTimeString()}</span>
            <span>O: <span className="text-slate-200">${hoveredCandle.open.toFixed(2)}</span></span>
            <span>H: <span className="text-emerald-400">${hoveredCandle.high.toFixed(2)}</span></span>
            <span>L: <span className="text-rose-400">${hoveredCandle.low.toFixed(2)}</span></span>
            <span>C: <span className="text-slate-200">${hoveredCandle.close.toFixed(2)}</span></span>
            <span>Vol: <span className="text-slate-200">{hoveredCandle.volume}</span></span>
          </>
        ) : (
          <>
            <span className="text-slate-200 font-bold">{asset.symbol}</span>
            <span>Live Price: <span className="text-slate-100 font-bold">${asset.price.toFixed(2)}</span></span>
            <span>24h High: <span className="text-emerald-400">${asset.high24h.toFixed(2)}</span></span>
            <span>24h Low: <span className="text-rose-400">${asset.low24h.toFixed(2)}</span></span>
            <span>VWAP: <span className="text-cyan-400">${asset.vwap.toFixed(2)}</span></span>
            <span>ATR: <span className="text-amber-400">${asset.atr.toFixed(2)}</span></span>
          </>
        )}
      </div>

      {/* Interactive Chart Canvas */}
      <div className="relative flex-1 p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair select-none"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={0}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#172238"
                  strokeDasharray="3 3"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${priceVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume separator line */}
          <line
            x1={0}
            y1={chartHeight + 10}
            x2={width - paddingRight}
            y2={chartHeight + 10}
            stroke="#1c2842"
          />

          {/* Volume Bars */}
          {displayCandles.map((c, i) => {
            const x = i * candleWidth + candleWidth * 0.15;
            const barW = candleWidth * 0.7;
            const volH = (c.volume / maxVolume) * (volumeHeight - 10);
            const y = chartHeight + volumeHeight - volH;
            const isBull = c.close >= c.open;

            return (
              <rect
                key={`vol_${c.time}`}
                x={x}
                y={y}
                width={Math.max(1, barW)}
                height={volH}
                fill={isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}
              />
            );
          })}

          {/* Candlesticks */}
          {displayCandles.map((c, i) => {
            const x = i * candleWidth + candleWidth * 0.2;
            const barW = Math.max(2, candleWidth * 0.6);
            const centerX = i * candleWidth + candleWidth / 2;

            const isBull = c.close >= c.open;
            const highY = chartHeight - ((c.high - minPrice) / priceRange) * chartHeight;
            const lowY = chartHeight - ((c.low - minPrice) / priceRange) * chartHeight;
            const openY = chartHeight - ((c.open - minPrice) / priceRange) * chartHeight;
            const closeY = chartHeight - ((c.close - minPrice) / priceRange) * chartHeight;

            const topY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle_${c.time}`}>
                {/* Wick */}
                <line
                  x1={centerX}
                  y1={highY}
                  x2={centerX}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x}
                  y={topY}
                  width={barW}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* EMA Curves */}
          {ema9Points && (
            <path
              d={ema9Points}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              opacity="0.85"
            />
          )}
          {ema21Points && (
            <path
              d={ema21Points}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.85"
            />
          )}

          {/* Current Live Price Line & Badge */}
          {currentPriceY >= 0 && currentPriceY <= chartHeight && (
            <g>
              <line
                x1={0}
                y1={currentPriceY}
                x2={width - paddingRight}
                y2={currentPriceY}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />
              <rect
                x={width - paddingRight + 2}
                y={currentPriceY - 8}
                width="60"
                height="16"
                fill="#0284c7"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={currentPriceY + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                ${asset.price.toFixed(1)}
              </text>
            </g>
          )}

          {/* Interactive Crosshair */}
          {mousePos && mousePos.x < width - paddingRight && mousePos.y < chartHeight && (
            <g>
              <line
                x1={mousePos.x}
                y1={0}
                x2={mousePos.x}
                y2={chartHeight}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={0}
                y1={mousePos.y}
                x2={width - paddingRight}
                y2={mousePos.y}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Price at hover cursor */}
              <rect
                x={width - paddingRight + 2}
                y={mousePos.y - 7}
                width="60"
                height="14"
                fill="#334155"
                rx="2"
              />
              <text
                x={width - paddingRight + 5}
                y={mousePos.y + 4}
                fill="#e2e8f0"
                fontSize="9"
                fontFamily="monospace"
              >
                ${(maxPrice - (mousePos.y / chartHeight) * priceRange).toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
