import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  fetchTradingState,
  triggerKillSwitch,
  controlEngine,
  placeManualOrder,
  closePosition,
  updatePositionSlTp,
  cancelOrder,
  updateStrategy,
  updateRiskSettings,
  updateVault,
  fetchCandles,
  fetchOrderBook,
  fetchAuditLogs,
  runAIQuantAudit,
  FullTradingState,
} from './services/api';
import { Candle, OrderBook as OrderBookType, AIAnalysisResult, TradingMode } from './types';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { TradingChart } from './components/TradingChart';
import { OrderBook } from './components/OrderBook';
import { StrategyEnginePanel } from './components/StrategyEnginePanel';
import { AIQuantAdvisor } from './components/AIQuantAdvisor';
import { PositionsTable } from './components/PositionsTable';
import { OrdersAndHistory } from './components/OrdersAndHistory';
import { AutonomousSignalFeed } from './components/AutonomousSignalFeed';
import { ManualOrderModal } from './components/ManualOrderModal';
import { RiskSettingsModal } from './components/RiskSettingsModal';
import { SecurityVaultModal } from './components/SecurityVaultModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AutonomousOptimizerModal } from './components/AutonomousOptimizerModal';
import { ProfitSweeperModal } from './components/ProfitSweeperModal';
import { AutonomousLearningLoopModal } from './components/AutonomousLearningLoopModal';
import { AutonomousUpdateManagerModal } from './components/AutonomousUpdateManagerModal';
import { ShieldAlert, AlertCircle, CheckCircle2, Wallet, ExternalLink } from 'lucide-react';

export default function App() {
  const [tradingState, setTradingState] = useState<FullTradingState | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'SUCCESS' | 'ERROR' | 'WARN'; message: string } | null>(null);

  // Modals state
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isRiskSettingsOpen, setIsRiskSettingsOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isProfitSweeperOpen, setIsProfitSweeperOpen] = useState(false);
  const [isLearningLoopOpen, setIsLearningLoopOpen] = useState(false);
  const [isUpdateManagerOpen, setIsUpdateManagerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Show banner notification with auto-dismiss
  const showNotice = (type: 'SUCCESS' | 'ERROR' | 'WARN', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Fetch full trading state
  const loadTradingState = useCallback(async () => {
    try {
      const state = await fetchTradingState();
      setTradingState(state);
    } catch (err) {
      console.warn('Notice fetching trading state:', err);
    }
  }, []);

  // Fetch candles & orderbook for current symbol
  const loadSymbolData = useCallback(async (sym: string) => {
    try {
      const [candleRes, bookRes] = await Promise.all([
        fetchCandles(sym),
        fetchOrderBook(sym),
      ]);
      setCandles(candleRes.candles);
      setOrderBook(bookRes);
    } catch (err) {
      console.warn('Notice loading symbol data:', err);
    }
  }, []);

  // Initial load & Polling cycle
  useEffect(() => {
    loadTradingState();
    loadSymbolData(selectedSymbol);

    // Initial AI Quant analysis
    runAIQuantAudit(selectedSymbol)
      .then((res) => setAiAnalysis(res))
      .catch((e) => console.warn('Initial AI audit notice:', e));

    const interval = setInterval(() => {
      loadTradingState();
      loadSymbolData(selectedSymbol);
    }, 2500);

    return () => clearInterval(interval);
  }, [loadTradingState, loadSymbolData, selectedSymbol]);

  // Handle Kill Switch
  const handleKillSwitch = async () => {
    try {
      const res = await triggerKillSwitch();
      await loadTradingState();
      showNotice(
        'ERROR',
        `MASTER KILL-SWITCH ENGAGED: Flattened ${res.positionsFlattened} positions and cancelled ${res.ordersCancelled} orders.`
      );
    } catch (err) {
      showNotice('ERROR', 'Failed to engage kill switch');
    }
  };

  // Handle Toggle Engine
  const handleToggleEngine = async () => {
    if (!tradingState) return;
    try {
      if (tradingState.engineStatus === 'KILL_SWITCHED') {
        await controlEngine('RESET_KILL_SWITCH');
        showNotice('WARN', 'Kill switch state reset to PAUSED. Review parameters before resuming.');
      } else if (tradingState.engineStatus === 'RUNNING') {
        await controlEngine('PAUSE');
        showNotice('WARN', 'Autonomous quantitative engine PAUSED.');
      } else {
        await controlEngine('RESUME');
        showNotice('SUCCESS', 'Autonomous quantitative engine ACTIVATED.');
      }
      loadTradingState();
    } catch (err) {
      showNotice('ERROR', 'Failed to update engine status');
    }
  };

  // Handle Change Mode
  const handleChangeMode = async (mode: TradingMode) => {
    try {
      await controlEngine('START', mode);
      await loadTradingState();
      showNotice('SUCCESS', `Trading mode updated to ${mode}.`);
    } catch (err) {
      showNotice('ERROR', 'Failed to change trading mode');
    }
  };

  // Handle Close Position
  const handleClosePosition = async (positionId: string) => {
    try {
      const res = await closePosition(positionId);
      await loadTradingState();
      showNotice(
        'SUCCESS',
        `Closed position on ${res.trade.symbol}. Realized PnL: ${res.trade.realizedPnl >= 0 ? '+' : ''}$${res.trade.realizedPnl.toFixed(2)}.`
      );
    } catch (err) {
      showNotice('ERROR', 'Failed to close position');
    }
  };

  // Handle Update SL/TP
  const handleUpdateSlTp = async (positionId: string, sl?: number, tp?: number) => {
    try {
      await updatePositionSlTp(positionId, sl, tp);
      await loadTradingState();
      showNotice('SUCCESS', 'Brackets (Stop Loss / Take Profit) updated.');
    } catch (err) {
      showNotice('ERROR', 'Failed to update bracket orders');
    }
  };

  // Handle Cancel Order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      await loadTradingState();
      showNotice('SUCCESS', 'Order cancelled successfully.');
    } catch (err) {
      showNotice('ERROR', 'Failed to cancel order');
    }
  };

  // Handle Manual Order Submission
  const handleManualOrder = async (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    price?: number;
    size: number;
  }) => {
    try {
      const res = await placeManualOrder(order);
      await loadTradingState();
      showNotice(
        'SUCCESS',
        res.filled
          ? `Filled manual market ${order.side} for ${order.size} ${order.symbol}.`
          : `Placed manual limit ${order.side} for ${order.size} ${order.symbol} @ $${order.price}.`
      );
    } catch (err) {
      showNotice('ERROR', 'Failed to transmit order');
    }
  };

  // Handle Strategy Parameter Update
  const handleUpdateStrategy = async (data: any) => {
    try {
      await updateStrategy(data);
      await loadTradingState();
      showNotice('SUCCESS', 'Quantitative strategy parameters updated.');
    } catch (err) {
      showNotice('ERROR', 'Failed to update strategy');
    }
  };

  // Handle Risk Settings Update
  const handleUpdateRisk = async (settings: any) => {
    try {
      await updateRiskSettings(settings);
      await loadTradingState();
      showNotice('SUCCESS', 'Institutional risk controls saved.');
    } catch (err) {
      showNotice('ERROR', 'Failed to save risk controls');
    }
  };

  // Handle Vault Update
  const handleUpdateVault = async (data: any) => {
    try {
      await updateVault(data);
      await loadTradingState();
      showNotice('SUCCESS', 'Institutional API Key Vault updated.');
    } catch (err) {
      showNotice('ERROR', 'Failed to update credentials vault');
    }
  };

  // Handle AI Quant Audit Run
  const handleRunAIQuantAudit = async () => {
    setIsAiLoading(true);
    try {
      const result = await runAIQuantAudit(selectedSymbol);
      setAiAnalysis(result);
      showNotice('SUCCESS', `AI Quant Analysis refreshed for ${selectedSymbol}.`);
    } catch (err) {
      showNotice('ERROR', 'Failed to complete AI Quant analysis');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Open Audit Log Modal & Load Logs
  const handleOpenAuditModal = async () => {
    try {
      const res = await fetchAuditLogs();
      setAuditLogs(res.auditLogs);
      setIsAuditOpen(true);
    } catch (err) {
      showNotice('ERROR', 'Failed to load audit logs');
    }
  };

  const currentAsset =
    tradingState?.assets.find((a) => a.symbol === selectedSymbol) ||
    tradingState?.assets[0] || {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 94250.0,
      change24h: 2.84,
      high24h: 95400.0,
      low24h: 92100.0,
      volume24h: 24890.4,
      vwap: 93850.0,
      rsi: 58.2,
      ema9: 94100.0,
      ema21: 93450.0,
      ema50: 92100.0,
      orderBookImbalance: 0.28,
      atr: 1250.0,
    };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        engineStatus={tradingState?.engineStatus || 'RUNNING'}
        tradingMode={tradingState?.tradingMode || 'PAPER'}
        systemHealth={tradingState?.systemHealth || null}
        onKillSwitch={handleKillSwitch}
        onToggleEngine={handleToggleEngine}
        onChangeMode={handleChangeMode}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenAudit={handleOpenAuditModal}
        onOpenRiskSettings={() => setIsRiskSettingsOpen(true)}
        onOpenManualOrder={() => setIsManualOrderOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        onOpenProfitSweeper={() => setIsProfitSweeperOpen(true)}
        onOpenLearningLoop={() => setIsLearningLoopOpen(true)}
        onOpenUpdateManager={() => setIsUpdateManagerOpen(true)}
        eligibleSweepUsdt={tradingState?.portfolio?.eligibleSweepUsdt || 0}
        activeVersion={tradingState?.activeStrategyVersion || tradingState?.learningLoopState?.activeVersion || 'v1.3'}
        currentSystemVersion={tradingState?.updateManagerState?.currentSystemVersion || 'v2.4.1-LTS'}
      />

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b transition-all ${
            notification.type === 'SUCCESS'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
              : notification.type === 'ERROR'
              ? 'bg-rose-950/90 border-rose-800 text-rose-300'
              : 'bg-amber-950/90 border-amber-800 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Institutional Quantitative Metrics Bar */}
      {tradingState && (
        <MetricsBar
          portfolio={tradingState.portfolio}
          learningLoopState={tradingState.learningLoopState}
          onOpenLearningLoop={() => setIsLearningLoopOpen(true)}
          updateManagerState={tradingState.updateManagerState}
          onOpenUpdateManager={() => setIsUpdateManagerOpen(true)}
        />
      )}

      {/* Live funding rail */}
      {tradingState?.tradingMode === 'LIVE_VAULT' && (
        <div className="mx-3 mt-3 rounded-xl border border-cyan-900/50 bg-[#0b1220] px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-cyan-400" /><span className="text-xs font-mono text-slate-300">LIVE BINANCE FUNDING</span></div>
          <span className="text-xs font-mono text-slate-400">Free USDT: <strong className="text-cyan-300">${Number((tradingState as any).liveAccount?.freeUsdt || 0).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></span>
          <span className="text-xs font-mono text-slate-400">Account NAV: <strong className="text-slate-200">${Number((tradingState as any).liveAccount?.navUsdt || 0).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></span>
          <button type="button" onClick={() => window.open('https://www.binance.com/en/fiat/deposit/USD','_blank','noopener,noreferrer')} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-cyan-700/60 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/50">Deposit USD on Binance <ExternalLink className="w-3.5 h-3.5" /></button>
          <span className="w-full text-[10px] text-slate-500">KY7 does not custody fiat. Deposit availability and payment methods are determined by Binance and your region/account eligibility.</span>
        </div>
      )}

      {/* Main Trading Cockpit Grid */}
      <main className="flex-1 p-3 grid grid-cols-1 xl:grid-cols-12 gap-3 overflow-hidden">
        {/* Left / Center Section: Chart & Order Book (8 Cols on XL) */}
        <div className="xl:col-span-8 flex flex-col gap-3">
          {/* Main Candlestick Chart */}
          <div className="h-[390px]">
            <TradingChart
              asset={currentAsset}
              candles={candles}
              allAssets={tradingState?.assets || []}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />
          </div>

          {/* Active Positions Table */}
          <div className="h-[250px]">
            <PositionsTable
              positions={tradingState?.activePositions || []}
              onClosePosition={handleClosePosition}
              onUpdateSlTp={handleUpdateSlTp}
            />
          </div>

          {/* Orders & Trade History Tabs */}
          <div className="h-[220px]">
            <OrdersAndHistory
              orders={tradingState?.openOrders || []}
              tradeHistory={tradingState?.tradeHistory || []}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        </div>

        {/* Right Section: Depth Ladder + AI Quant Reasoning + Strategies + Signals (4 Cols on XL) */}
        <div className="xl:col-span-4 flex flex-col gap-3">
          {/* Top: Order Book Depth Ladder */}
          <div className="h-[270px]">
            <OrderBook
              orderBook={orderBook}
              currentPrice={currentAsset.price}
              imbalance={currentAsset.orderBookImbalance}
            />
          </div>

          {/* Middle: AI Quant Reasoning Engine (Gemini 3.8 Flash) */}
          <div className="h-[280px]">
            <AIQuantAdvisor
              selectedSymbol={selectedSymbol}
              aiAnalysis={aiAnalysis}
              isLoading={isAiLoading}
              onRunAudit={handleRunAIQuantAudit}
            />
          </div>

          {/* Middle-Bottom: Strategy Engine Controls */}
          <div className="h-[260px]">
            <StrategyEnginePanel
              strategies={tradingState?.strategies || []}
              onUpdateStrategy={handleUpdateStrategy}
            />
          </div>

          {/* Bottom: Autonomous Signal Stream Terminal */}
          <div className="h-[220px]">
            <AutonomousSignalFeed signals={tradingState?.signalFeed || []} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ManualOrderModal
        assets={tradingState?.assets || []}
        selectedSymbol={selectedSymbol}
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        onSubmitOrder={handleManualOrder}
      />

      {tradingState && (
        <RiskSettingsModal
          riskSettings={tradingState.riskSettings}
          isOpen={isRiskSettingsOpen}
          onClose={() => setIsRiskSettingsOpen(false)}
          onSaveRiskSettings={handleUpdateRisk}
        />
      )}

      {tradingState && (
        <SecurityVaultModal
          vaultConfig={tradingState.vaultConfig}
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          onUpdateVault={handleUpdateVault}
        />
      )}

      <AuditLogModal
        auditLogs={auditLogs}
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      <AutonomousOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        strategies={tradingState?.strategies || []}
        assets={tradingState?.assets || []}
        selectedSymbol={selectedSymbol}
        onUpdateStrategyParams={(strategyId, params) => {
          handleUpdateStrategy({
            strategyId,
            ...params,
          });
        }}
        onNotification={(msg, type) => {
          showNotice(type === 'SUCCESS' ? 'SUCCESS' : type === 'ERROR' ? 'ERROR' : 'WARN', msg);
        }}
      />

      <ProfitSweeperModal
        isOpen={isProfitSweeperOpen}
        onClose={() => {
          setIsProfitSweeperOpen(false);
          loadTradingState();
        }}
        realizedPnlUsdt={tradingState?.portfolio?.realizedPnlUsdt || 0}
        onNotification={(msg, type) => {
          showNotice(type === 'SUCCESS' ? 'SUCCESS' : type === 'ERROR' ? 'ERROR' : 'WARN', msg);
        }}
      />

      <AutonomousLearningLoopModal
        isOpen={isLearningLoopOpen}
        onClose={() => {
          setIsLearningLoopOpen(false);
          loadTradingState();
        }}
        onNotification={(msg, type) => {
          showNotice(type === 'SUCCESS' ? 'SUCCESS' : type === 'ERROR' ? 'ERROR' : 'WARN', msg);
        }}
      />

      <AutonomousUpdateManagerModal
        isOpen={isUpdateManagerOpen}
        onClose={() => {
          setIsUpdateManagerOpen(false);
          loadTradingState();
        }}
        onNotification={(msg, type) => {
          showNotice(type === 'SUCCESS' ? 'SUCCESS' : type === 'ERROR' ? 'ERROR' : 'WARN', msg);
        }}
      />
    </div>
  );
}
