export type TransactionType = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = 
  | "Pending" 
  | "Open" 
  | "PartiallyFilled" 
  | "Complete" 
  | "Cancelled" 
  | "Rejected" 
  | "Failed" 
  | "Unknown";

export interface LtpQuote {
  tradingSymbol: string;
  companyName: string;
  instrumentKey: string;
  ltp: number;
  closePrice: number;
  change: number;
  changePercent: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
  timestamp: string;
}

export interface Position {
  tradingSymbol: string;
  instrumentKey: string;
  quantity: number;
  averagePrice: number;
  currentLtp: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  lastUpdatedUtc: string;
}

export interface Holding {
  tradingSymbol: string;
  instrumentKey: string;
  isin: string;
  quantity: number;
  averagePrice: number;
  currentLtp: number;
  pnl: number;
  closePrice: number;
}

export interface PlaceOrderRequest {
  transactionType: TransactionType;
  orderType: OrderType;
  quantity: number;
  product: string;
  price?: number;
  correlationId?: string;
}

export interface OrderResult {
  success: boolean;
  localOrderId: number;
  correlationId: string;
  upstoxOrderId?: string;
  status: OrderStatus;
  statusText: string;
  transactionType: TransactionType;
  quantity: number;
  executionPrice?: number;
  executionTimeUtc?: string;
  message?: string;
}

export interface DashboardSummary {
  brokerConnected: boolean;
  brokerUserId?: string;
  brokerUserName?: string;
  tokenExpiresAtUtc?: string;
  marketStatus: string;
  quote?: LtpQuote;
  position?: Position;
  holding?: Holding;
  lastOrder?: OrderResult;
}

export interface UpstoxAuthStatus {
  isConnected: boolean;
  userId?: string;
  userName?: string;
  email?: string;
  expiresAtUtc?: string;
  isExpired: boolean;
  message?: string;
}

export type BotMode = "Manual" | "SemiAuto" | "FullyAutomated";
export type StrategyRecommendation = "StrongBuy" | "Buy" | "Neutral" | "Sell" | "StrongSell";

export interface TechnicalIndicators {
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  vwap: number;
  supertrend: number;
  supertrendDirection: "BULLISH" | "BEARISH";
  volumeRatio: number;
}

export interface StrategyScore {
  score: number;
  recommendation: StrategyRecommendation;
  recommendationText: string;
  indicators: TechnicalIndicators;
  signalFactors: string[];
  recommendedQuantity: number;
  currentPrice: number;
  calculatedAtUtc: string;
}

export interface CandleData {
  timestampUtc: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest: number;
}

export interface BotConfig {
  id: number;
  botMode: BotMode;
  buyScoreThreshold: number;
  sellScoreThreshold: number;
  baseQuantity: number;
  maxQuantity: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent: number;
  dailyMaxLossAmount: number;
  maxOrdersPerDay: number;
  isKillSwitchActive: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface RiskAlert {
  alertType: string;
  symbol: string;
  currentPrice: number;
  triggerPrice: number;
  pnl: number;
  message: string;
  suggestedAction: string;
  timestampUtc: string;
}

export interface StrategySignalHistory {
  id: number;
  signalTimeUtc: string;
  score: number;
  recommendation: string;
  currentPrice: number;
  rsi?: number;
  ema9?: number;
  ema21?: number;
  vwap?: number;
  supertrend?: number;
  actionTaken: string;
  orderId?: number;
}

