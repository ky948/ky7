import {
  PortfolioState,
  RiskSettings,
  StrategyConfig,
  CryptoAsset,
  Position,
  Order,
  TradeRecord,
  SignalEvent,
  AuditLogEntry,
  SystemHealth,
  Candle,
  OrderBook,
  AIAnalysisResult,
  TradingMode,
  EngineStatus,
} from '../types';

export interface FullTradingState {
  engineStatus: EngineStatus;
  tradingMode: TradingMode;
  portfolio: PortfolioState;
  riskSettings: RiskSettings;
  strategies: StrategyConfig[];
  assets: CryptoAsset[];
  activePositions: Position[];
  openOrders: Order[];
  tradeHistory: TradeRecord[];
  signalFeed: SignalEvent[];
  vaultConfig: {
    exchange: string;
    apiKeyMasked: string;
    apiSecretSet: boolean;
    status: 'SEALED' | 'UNLOCKED_READ_TRADE';
    withdrawalsEnabled: boolean;
    whitelistedIPOnly: boolean;
  };
  systemHealth: SystemHealth;
  authorizedOwner: {
    email: string;
    role: string;
    keyFingerprint: string;
    securityLevel: string;
    ipWhitelistVerified: boolean;
  };
  learningLoopState?: import('../types').LearningLoopState;
  activeStrategyVersion?: string;
  gridConfigs?: any;
  profitSweeperConfig?: any;
  updateManagerState?: {
    currentSystemVersion: string;
    previousKnownGoodVersion: string;
    lastCheckTimestamp: number;
    autoCheckEnabled: boolean;
    isPipelineRunning: boolean;
    activeUpdateId: string | null;
    totalUpdatesApplied: number;
    totalRollbacksTriggered: number;
    untrustedRejectionsCount: number;
    trustedSignaturesVerifiedCount: number;
  };
  strategyGeneratorState?: import('../types').StrategyGeneratorState;
}

export async function fetchTradingState(): Promise<FullTradingState> {
  const res = await fetch('/api/trading/state');
  if (!res.ok) throw new Error('Failed to fetch trading state');
  return res.json();
}

export async function triggerKillSwitch(): Promise<{
  success: boolean;
  engineStatus: EngineStatus;
  positionsFlattened: number;
  ordersCancelled: number;
  message: string;
}> {
  const res = await fetch('/api/trading/kill-switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to trigger kill switch');
  return res.json();
}

export async function controlEngine(
  action: 'START' | 'PAUSE' | 'RESUME' | 'RESET_KILL_SWITCH',
  mode?: TradingMode
): Promise<{ success: boolean; engineStatus: EngineStatus; tradingMode: TradingMode }> {
  const res = await fetch('/api/trading/engine-control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, mode }),
  });
  if (!res.ok) throw new Error('Failed to update engine status');
  return res.json();
}

export async function placeManualOrder(order: {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price?: number;
  size: number;
}): Promise<{ success: boolean; filled: boolean; position?: Position; order?: Order }> {
  const res = await fetch('/api/trading/order/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error('Failed to place manual order');
  return res.json();
}

export async function closePosition(positionId: string): Promise<{ success: boolean; trade: TradeRecord }> {
  const res = await fetch('/api/trading/position/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionId }),
  });
  if (!res.ok) throw new Error('Failed to close position');
  return res.json();
}

export async function updatePositionSlTp(
  positionId: string,
  stopLoss?: number,
  takeProfit?: number
): Promise<{ success: boolean; position: Position }> {
  const res = await fetch('/api/trading/position/update-sl-tp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionId, stopLoss, takeProfit }),
  });
  if (!res.ok) throw new Error('Failed to update SL/TP');
  return res.json();
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch('/api/trading/order/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error('Failed to cancel order');
  return res.json();
}

export async function updateStrategy(strategyData: {
  strategyId: string;
  enabled?: boolean;
  allocationPercent?: number;
  riskPerTradePercent?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}): Promise<{ success: boolean; strategy: StrategyConfig }> {
  const res = await fetch('/api/trading/strategy/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(strategyData),
  });
  if (!res.ok) throw new Error('Failed to update strategy');
  return res.json();
}

export async function updateRiskSettings(settings: Partial<RiskSettings>): Promise<{ success: boolean; riskSettings: RiskSettings }> {
  const res = await fetch('/api/trading/risk-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update risk settings');
  return res.json();
}

export async function updateVault(vaultData: {
  exchange?: string;
  apiKey?: string;
  apiSecret?: string;
  status?: 'SEALED' | 'UNLOCKED_READ_TRADE';
}): Promise<{ success: boolean }> {
  const res = await fetch('/api/trading/vault/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vaultData),
  });
  if (!res.ok) throw new Error('Failed to update vault');
  return res.json();
}

export async function fetchCandles(symbol: string): Promise<{ symbol: string; candles: Candle[] }> {
  const res = await fetch(`/api/trading/candles/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch candles');
  return res.json();
}

export async function fetchOrderBook(symbol: string): Promise<OrderBook> {
  const res = await fetch(`/api/trading/orderbook/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch order book');
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ auditLogs: AuditLogEntry[] }> {
  const res = await fetch('/api/trading/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function runAIQuantAudit(symbol: string): Promise<AIAnalysisResult> {
  const res = await fetch('/api/ai/market-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error('Failed to run AI Quant audit');
  return res.json();
}

// Autonomous Grid Strategy API
export async function fetchGridConfigs(): Promise<{ gridConfigs: Record<string, any> }> {
  const res = await fetch('/api/trading/grid');
  if (!res.ok) throw new Error('Failed to fetch grid strategies');
  return res.json();
}

export async function updateGridConfig(data: {
  symbol: string;
  enabled: boolean;
  lowerPrice: number;
  upperPrice: number;
  gridLevelsCount: number;
  profitPerGridPercent: number;
  autoAdjustWithAtr: boolean;
  allocatedMarginUsdt: number;
}): Promise<{ success: boolean; gridConfig: any }> {
  const res = await fetch('/api/trading/grid/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update grid configuration');
  return res.json();
}

// Quantitative Backtesting Engine API
export async function runBacktest(params: {
  strategyId: string;
  symbol: string;
  lookbackCandles: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopMultiplier: number;
}): Promise<any> {
  const res = await fetch('/api/trading/backtest/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to execute backtest simulation');
  return res.json();
}

// Strategy Incubator & Evolutionary Paper-Testing API
export async function fetchIncubatedStrategies(): Promise<{ incubatedStrategies: any[] }> {
  const res = await fetch('/api/trading/incubator');
  if (!res.ok) throw new Error('Failed to fetch incubated strategies');
  return res.json();
}

export async function generateNewStrategy(data?: { type?: string; focus?: string }): Promise<{ success: boolean; strategy: any }> {
  const res = await fetch('/api/trading/incubator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error('Failed to generate candidate strategy');
  return res.json();
}

export async function promoteIncubatedStrategy(strategyId: string): Promise<{ success: boolean; strategy: any; liveStrategies: StrategyConfig[] }> {
  const res = await fetch('/api/trading/incubator/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId }),
  });
  if (!res.ok) throw new Error('Failed to promote candidate strategy');
  return res.json();
}

export async function scanStrategyDegradation(): Promise<{ success: boolean; incubatedStrategies: any[]; actionsTaken: number }> {
  const res = await fetch('/api/trading/incubator/degradation-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to scan strategy degradation');
  return res.json();
}

// Owner Cold Storage Profit Sweeper API
export async function fetchProfitSweeper(): Promise<{ profitSweeperConfig: any; eligibleSweepUsdt: number }> {
  const res = await fetch('/api/trading/profit-sweep');
  if (!res.ok) throw new Error('Failed to fetch profit sweeper config');
  return res.json();
}

export async function updateProfitSweeper(data: {
  destinationWallet?: string;
  minThresholdUsdt?: number;
  sweepPercentage?: number;
  autoSweepEnabled?: boolean;
}): Promise<{ success: boolean; profitSweeperConfig: any }> {
  const res = await fetch('/api/trading/profit-sweep/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profit sweeper configuration');
  return res.json();
}

export async function executeProfitSweep(sweepPercentage?: number): Promise<{
  success: boolean;
  sweepRecord: any;
  profitSweeperConfig: any;
  eligibleSweepUsdt: number;
  totalSweptUsdt: number;
}> {
  const res = await fetch('/api/trading/profit-sweep/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sweepPercentage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Sweep execution failed' }));
    throw new Error(err.error || 'Failed to execute profit sweep');
  }
  return res.json();
}

// Non-Critical Software Component Validator API
export async function fetchSoftwareComponents(): Promise<{ softwareComponents: any[] }> {
  const res = await fetch('/api/trading/components');
  if (!res.ok) throw new Error('Failed to fetch software components');
  return res.json();
}

export async function toggleSoftwareComponent(componentId: string): Promise<{ success: boolean; component: any; softwareComponents: any[] }> {
  const res = await fetch('/api/trading/components/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentId }),
  });
  if (!res.ok) throw new Error('Failed to toggle software component');
  return res.json();
}

// Autonomous Update Manager Client APIs
export async function fetchUpdateManagerState(): Promise<{ state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager');
  if (!res.ok) throw new Error('Failed to fetch update manager state');
  return res.json();
}

export async function checkAllUpdatesNow(): Promise<{ success: boolean; state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager/check-now', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to check updates');
  return res.json();
}

export async function runUpdatePipeline(params: {
  packageId?: string;
  simulateFailureStage?: string;
  simulateUntrusted?: boolean;
}): Promise<{ success: boolean; result: any; state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager/run-pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Update pipeline execution failed' }));
    throw new Error(err.error || 'Failed to execute update pipeline');
  }
  return res.json();
}

export async function stepUpdatePipeline(params: {
  packageId?: string;
  simulateFailureStage?: string;
  simulateUntrusted?: boolean;
}): Promise<{ success: boolean; stageResult: any; package: any; state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager/step-pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to step update pipeline');
  return res.json();
}

export async function rollbackSystemVersion(params: {
  targetVersion?: string;
  reason?: string;
}): Promise<{ success: boolean; rolledBackFrom: string; rolledBackTo: string; state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to execute system rollback');
  return res.json();
}

export async function toggleUpdateAutoDaemon(): Promise<{ success: boolean; autoCheckEnabled: boolean }> {
  const res = await fetch('/api/trading/update-manager/toggle-auto', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle auto daemon');
  return res.json();
}

export async function resetCandidatePackage(): Promise<{ success: boolean; state: import('../types').UpdateManagerSystemState }> {
  const res = await fetch('/api/trading/update-manager/reset-candidate', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset candidate package');
  return res.json();
}

// ==========================================
// AUTONOMOUS STRATEGY GENERATOR & OBJECTIVE ARENA API
// ==========================================

export async function fetchStrategyGeneratorState(): Promise<{
  success: boolean;
  state: import('../types').StrategyGeneratorState;
}> {
  const res = await fetch('/api/trading/strategy-generator/state');
  if (!res.ok) throw new Error('Failed to fetch strategy generator state');
  return res.json();
}

export async function generateStrategyCandidate(params: {
  family?: import('../types').StrategyCandidateFamily;
  customBlocks?: import('../types').StrategyBuildingBlock[];
  regimeTarget?: string;
  focus?: string;
  useAi?: boolean;
}): Promise<{
  success: boolean;
  candidate: import('../types').StrategyCandidate;
  state: import('../types').StrategyGeneratorState;
}> {
  const res = await fetch('/api/trading/strategy-generator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate strategy candidate');
  }
  return res.json();
}

export async function promoteCandidateToLive(versionId: string): Promise<{
  success: boolean;
  promotedCandidate: import('../types').StrategyCandidate;
  state: import('../types').StrategyGeneratorState;
}> {
  const res = await fetch('/api/trading/strategy-generator/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to promote candidate');
  }
  return res.json();
}

export async function recalculateObjectiveArena(params?: {
  benchmarkSymbol?: string;
  currentRegime?: string;
}): Promise<{
  success: boolean;
  state: import('../types').StrategyGeneratorState;
  benchmarkLeader: import('../types').StrategyCandidate;
}> {
  const res = await fetch('/api/trading/strategy-generator/recalculate-objective', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error('Failed to recalculate objective metrics');
  return res.json();
}

export async function toggleAutoStrategyGen(): Promise<{
  success: boolean;
  autoGenerateOnRegimeShift: boolean;
}> {
  const res = await fetch('/api/trading/strategy-generator/toggle-auto', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle auto strategy generation');
  return res.json();
}
