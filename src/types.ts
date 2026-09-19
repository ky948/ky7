export type TradingMode = 'PAPER' | 'DRY_RUN' | 'LIVE_VAULT';

export type EngineStatus = 'RUNNING' | 'PAUSED' | 'KILL_SWITCHED';

export type OrderSide = 'BUY' | 'SELL';
export type PositionSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  vwap: number;
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  orderBookImbalance: number; // -1.0 to 1.0 (negative = sell heavy, positive = buy heavy)
  atr: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: number;
  strategyId: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  size: number;
  filledSize: number;
  status: OrderStatus;
  createdAt: number;
  strategyId: string;
  reason?: string;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  exitPrice: number;
  size: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  fee: number;
  durationMs: number;
  closedAt: number;
  strategyName: string;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'KILL_SWITCH' | 'SIGNAL_FLIP';
}

export type StrategyType = 
  | 'EMA_MOMENTUM_BREAKOUT'
  | 'MEAN_REVERSION_BB_RSI'
  | 'ORDER_BOOK_IMBALANCE'
  | 'ADAPTIVE_MULTI_FACTOR';

export interface StrategyConfig {
  id: StrategyType;
  name: string;
  description: string;
  enabled: boolean;
  allocationPercent: number;
  riskPerTradePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopAtrMultiplier: number;
  cooldownSeconds: number;
}

export interface RiskSettings {
  maxDailyLossPercent: number; // e.g., 2.5%
  maxPortfolioLeverage: number; // e.g., 2.0x
  maxPositionSizePercent: number; // e.g., 25% of NAV
  circuitBreakerDrawdownPercent: number; // e.g., 5.0%
  slippageTolerancePercent: number; // e.g., 0.2%
  enforceStrictRiskGuards: boolean;
}

export interface PortfolioState {
  navUsdt: number;
  availableMarginUsdt: number;
  unrealizedPnlUsdt: number | null;
  realizedPnlUsdt: number | null;
  dailyStartingNavUsdt: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdownPercent: number;
  eligibleSweepUsdt?: number | null;
  totalSweptUsdt?: number | null;
  liquidationDistancePercent?: number;
  pnlSource?: string;
}

export interface GridLevel {
  level: number;
  price: number;
  side: 'BUY' | 'SELL';
  size: number;
  filled: boolean;
  profitUsdt?: number;
}

export interface GridStrategyConfig {
  symbol: string;
  enabled: boolean;
  lowerPrice: number;
  upperPrice: number;
  gridLevelsCount: number;
  distribution: 'ARITHMETIC' | 'GEOMETRIC';
  profitPerGridPercent: number;
  allocatedMarginUsdt: number;
  autoAdjustWithAtr: boolean;
  atrPeriod: number;
  lastRebalanceTime: number;
  totalGridProfitUsdt: number;
  completedGridRounds: number;
  activeLevels: GridLevel[];
}

export interface BacktestRequest {
  strategyId: string;
  symbol: string;
  timeframeMinutes: number;
  lookbackCandles: number;
  riskPerTradePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopMultiplier: number;
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnlUsdt: number;
  pnlPercent: number;
  exitReason: string;
}

export interface BacktestResult {
  strategyId: string;
  strategyName: string;
  symbol: string;
  totalReturnPercent: number;
  annualizedReturnPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageTradePnlPercent: number;
  equityCurve: Array<{ time: number; equity: number }>;
  trades: BacktestTrade[];
  optimalParameters?: {
    stopLossPercent: number;
    takeProfitPercent: number;
    trailingStopMultiplier: number;
    recommendedAllocationPercent: number;
  };
}

export interface IncubatedStrategy {
  id: string;
  version: string;
  name: string;
  type: string;
  status: 'INCUBATING_PAPER' | 'VALIDATED_READY' | 'PROMOTED_LIVE' | 'DEGRADED_PAUSED';
  generatedAt: number;
  paperDays: number;
  paperPnlUsdt: number;
  paperWinRate: number;
  paperSharpe: number;
  paperTradesCount: number;
  degradationScore: number; // 0 (healthy) to 100 (critical degradation)
  alphaDecayPercent: number;
  rationale: string;
  parameters: {
    allocationPercent: number;
    riskPerTradePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    trailingStopAtrMultiplier: number;
  };
}

export interface SweepRecord {
  id: string;
  timestamp: number;
  amountUsdt: number;
  destinationWallet: string;
  txHash: string;
  status: 'CONFIRMED' | 'PENDING';
  blockNumber: number;
}

export interface ProfitSweeperConfig {
  destinationWallet: string;
  minThresholdUsdt: number;
  sweepPercentage: number;
  autoSweepEnabled: boolean;
  totalSweptUsdt: number;
  pendingEligibleUsdt: number;
  lastSweepTimestamp?: number;
  sweepHistory: SweepRecord[];
}

export interface SoftwareComponent {
  id: string;
  name: string;
  version: string;
  category: 'FACTOR_CALCULATOR' | 'EXECUTION_ROUTER' | 'VOLATILITY_ESTIMATOR' | 'ORDER_FLOW_AGGREGATOR';
  status: 'ACTIVE' | 'VALIDATED_STAGING' | 'BENCHMARKING';
  validationScore: number; // e.g. 99.4%
  latencyMicroseconds: number;
  lastValidatedTimestamp: number;
  changelog: string;
}

export interface SignalEvent {
  id: string;
  timestamp: number;
  symbol: string;
  strategy: string;
  signalType: 'BUY_LONG' | 'SELL_SHORT' | 'EXIT' | 'HOLD';
  confidence: number;
  rationale: string;
  riskGuardPassed: boolean;
  executed: boolean;
  orderId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  prevHash: string;
  hash: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
}

export interface SystemHealth {
  uptimeSeconds: number;
  eventLoopLagMs: number;
  memoryUsageMb: number;
  ticksProcessed: number;
  lastTickTimestamp: number;
  authorizedOwner: string;
  securityLevel: string;
  vaultStatus: 'SEALED' | 'UNLOCKED_READ_TRADE';
  ipWhitelistVerified: boolean;
}

export interface AIAnalysisResult {
  timestamp: number;
  regime: 'BULLISH_EXPANSION' | 'BEARISH_TREND' | 'VOLATILITY_COMPRESSION' | 'CHOPPY_RANGE' | 'LIQUIDITY_HUNT';
  confidenceScore: number;
  macroAssessment: string;
  recommendedAction: string;
  preferredStrategy: StrategyType;
  riskAdvisory: string;
  factors: {
    momentumScore: number;
    volatilityRisk: number;
    liquidityDepth: number;
    orderFlowBias: number;
  };
  modelUsed?: string;
  source?: 'GEMINI_AI' | 'QUANT_ENGINE_FALLBACK';
}

export type LearningLoopStep =
  | 'MARKET_DATA'
  | 'FEATURE_ENGINEERING'
  | 'REGIME_DETECTION'
  | 'STRATEGY_GENERATION'
  | 'BACKTESTING'
  | 'WALK_FORWARD'
  | 'STRESS_TESTING'
  | 'PAPER_TRADING'
  | 'PERFORMANCE_EVAL'
  | 'STRATEGY_SELECTION'
  | 'LIMITED_LIVE'
  | 'PERFORMANCE_MONITOR'
  | 'ERROR_LOSS_ANALYSIS'
  | 'OPTIMIZATION'
  | 'NEW_VERSION'
  | 'VALIDATION_DEPLOY';

export interface ParameterDelta {
  parameter: string;
  previousValue: string | number;
  newValue: string | number;
  unit?: string;
}

export interface ValidationCheckItem {
  name: string;
  passed: boolean;
  value: string;
}

export interface StrategyVersionRecord {
  id: string;
  timestamp: number;
  strategyId: string;
  strategyName: string;
  previousVersion: string;
  newVersion: string;
  reasonForChange: string;
  parametersChanged: ParameterDelta[];
  validationResults: {
    passed: boolean;
    score: number; // e.g. 98.6
    checks: ValidationCheckItem[];
  };
  backtestResults: {
    sharpe: number;
    winRate: number;
    maxDrawdown: number;
    profitFactor: number;
    totalReturnPercent: number;
  };
  paperTradingResults: {
    days: number;
    pnlUsdt: number;
    winRate: number;
    tradeCount: number;
  };
  liveResults: {
    pnlUsdt: number;
    roiPercent: number;
    executedTrades: number;
    slippageBps: number;
  };
  expectedEffect: string;
  actualEffect: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ROLLED_BACK';
}

export interface StepTelemetry {
  step: LearningLoopStep;
  title: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FLAGGED';
  latencyMs: number;
  timestamp: number;
  details: string;
  metrics: Record<string, string | number | boolean>;
}

export interface LearningLoopState {
  cycleId: string;
  cycleNumber: number;
  currentStep: LearningLoopStep;
  currentStepIndex: number;
  status: 'IDLE' | 'LEARNING_ACTIVE' | 'PAUSED' | 'CONVERGED';
  autoAdvance: boolean;
  advanceSpeedMs: number;
  lastStepTimestamp: number;
  activeStrategyId: string;
  activeVersion: string;
  totalCyclesCompleted: number;
  totalVersionsGenerated: number;
  telemetry: {
    featuresCount: number;
    detectedRegime: string;
    regimeConfidence: number;
    stressScore: number;
    walkForwardScore: number;
    activeSharpe: number;
    errorDiagnosesCount: number;
    parameterDeltasCount: number;
  };
  steps: StepTelemetry[];
}

export type UpdateCategory =
  | 'APPLICATION_UPDATE'
  | 'DEPENDENCY_UPDATE'
  | 'SECURITY_PATCH'
  | 'EXCHANGE_API_CHANGE'
  | 'MARKET_DATA_SCHEMA_CHANGE'
  | 'STRATEGY_ENGINE_IMPROVEMENT'
  | 'ML_MODEL_IMPROVEMENT'
  | 'INDICATOR_UPDATE'
  | 'BUG_FIX'
  | 'PERFORMANCE_OPTIMIZATION';

export type UpdateLifecycleStage =
  | 'DISCOVER_UPDATE'
  | 'DOWNLOAD'
  | 'VERIFY_SIGNATURE_INTEGRITY'
  | 'BUILD'
  | 'AUTOMATED_TESTS'
  | 'SECURITY_TESTS'
  | 'BACKTEST'
  | 'PAPER_TEST'
  | 'COMPATIBILITY_TEST'
  | 'CANARY_DEPLOYMENT'
  | 'HEALTH_MONITORING'
  | 'FULL_DEPLOYMENT';

export type UpdateStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'DEPLOYED'
  | 'FAILED_ROLLED_BACK'
  | 'REJECTED_UNTRUSTED';

export interface UpdateStageLog {
  stage: UpdateLifecycleStage;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ROLLED_BACK';
  timestamp: number;
  durationMs: number;
  details: string;
  metrics?: Record<string, any>;
}

export interface SoftwareUpdatePackage {
  id: string;
  version: string;
  previousVersion: string;
  title: string;
  category: UpdateCategory;
  description: string;
  sourceOrigin: string;
  releaseChannel: 'STABLE' | 'SECURITY' | 'QUANT_CANDIDATE';
  signingKeyId: string;
  signatureVerified: boolean;
  sha256Hash: string;
  isTrusted: boolean;
  currentStage: UpdateLifecycleStage;
  status: UpdateStatus;
  discoveredAt: number;
  completedAt?: number;
  rollbackOccurred: boolean;
  rollbackReason?: string;
  knownGoodFallbackVersion: string;
  stageLogs: UpdateStageLog[];
  safetyReport: {
    cveVulnerabilitiesFound: number;
    securityAuditPassed: boolean;
    testsPassedCount: number;
    testsTotalCount: number;
    backtestSharpeDelta: number;
    paperTradingWinRateDelta: number;
    canaryTrafficAllocationPercent: number;
    canaryErrorRatePercent: number;
    schemaCompatibilityVerified: boolean;
  };
}

export interface UpdateManagerSystemState {
  currentSystemVersion: string;
  previousKnownGoodVersion: string;
  lastCheckTimestamp: number;
  autoCheckEnabled: boolean;
  checkIntervalSeconds: number;
  isPipelineRunning: boolean;
  activeUpdateId: string | null;
  totalUpdatesApplied: number;
  totalRollbacksTriggered: number;
  untrustedRejectionsCount: number;
  trustedSignaturesVerifiedCount: number;
  trustedRootKeyId?: string;
  categoriesMonitored: {
    category: UpdateCategory;
    name: string;
    lastChecked: number;
    status: 'OPTIMAL' | 'UPDATE_AVAILABLE' | 'PATCH_APPLIED';
    details: string;
  }[];
  updateHistory: SoftwareUpdatePackage[];
}

// ==========================================
// 5. AUTONOMOUS STRATEGY GENERATION & OBJECTIVE PERFORMANCE ARENA
// ==========================================

export type StrategyBuildingBlock =
  | 'grid_trading'
  | 'volatility'
  | 'momentum'
  | 'mean_reversion'
  | 'trend_detection'
  | 'order_book_imbalance'
  | 'volume'
  | 'liquidity'
  | 'spread'
  | 'atr'
  | 'rsi'
  | 'macd'
  | 'moving_averages'
  | 'bollinger_bands'
  | 'vwap'
  | 'market_regime'
  | 'funding_rates'
  | 'volatility_regime'
  | 'historical_price_behavior';

export interface BuildingBlockDefinition {
  id: StrategyBuildingBlock;
  name: string;
  category: 'EXECUTION' | 'MOMENTUM' | 'VOLATILITY' | 'ORDERBOOK' | 'MICROSTRUCTURE' | 'MACRO';
  description: string;
  defaultWeight: number; // 0-100
}

export type StrategyCandidateFamily =
  | 'GRID'
  | 'ADAPTIVE'
  | 'MOMENTUM'
  | 'MEANREV'
  | 'VOLATILITY'
  | 'ORDERBOOK'
  | 'VWAP'
  | 'TREND';

export interface StrategyObjectiveMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  winRatePercent: number;
  expectedPayoffUsdt: number;
  recoveryFactor: number;
  totalReturnPercent: number;
  annualizedReturnPercent: number;
  alphaVsBenchmarkPercent: number;
  slippageSensitivityBps: number;
  totalTradesSimulated: number;
  winningTradesCount: number;
  compositeObjectiveScore: number; // 0-100 objective composite score
}

export interface StrategyCandidate {
  versionId: string; // e.g. 'STRATEGY-GRID-001', 'STRATEGY-GRID-002', 'STRATEGY-GRID-003', 'STRATEGY-ADAPTIVE-004'
  name: string;
  family: StrategyCandidateFamily;
  status: 'CANDIDATE' | 'PAPER_INCUBATING' | 'ACTIVE_LIVE' | 'SUPERSEDED' | 'DEGRADED';
  generatedAt: number;
  generationSource: 'AI_GEMINI' | 'ALGORITHMIC_COMBINATOR' | 'HYBRID_QUANT';
  hypothesis: string;
  buildingBlocksUsed: StrategyBuildingBlock[];
  weights: Partial<Record<StrategyBuildingBlock, number>>;
  regimeTarget: string; // e.g. 'VOLATILITY_EXPANSION', 'RANGE_BOUND', 'TRENDING_BULL', 'CHOP_LOW_LIQUIDITY'
  parameters: {
    allocationPercent: number;
    riskPerTradePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    trailingStopMultiplier: number;
    timeframeMinutes: number;
    gridLevels?: number;
    gridSpreadPercent?: number;
    rsiPeriod?: number;
    atrMultiplier?: number;
    orderBookThreshold?: number;
    vwapBandDeviation?: number;
    fundingRateThresholdPercent?: number;
  };
  objectiveMetrics: StrategyObjectiveMetrics;
  equityCurve: Array<{ time: number; equity: number }>;
  regimeFitness: {
    trending: number; // 0-100
    ranging: number; // 0-100
    highVolatility: number; // 0-100
    lowLiquidity: number; // 0-100
  };
  lastEvaluatedAt: number;
  isCurrentBenchmarkWinner?: boolean;
}

export interface StrategyGeneratorState {
  candidates: StrategyCandidate[];
  activeVersionId: string;
  autoGenerateOnRegimeShift: boolean;
  totalCandidatesGenerated: number;
  lastGenerationTimestamp: number;
  currentRegime: string;
  leaderboardMetric: 'compositeObjectiveScore' | 'sharpeRatio' | 'profitFactor' | 'calmarRatio' | 'winRatePercent';
}

