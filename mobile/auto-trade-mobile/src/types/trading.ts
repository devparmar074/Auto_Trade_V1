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
  lastOrder?: OrderResult;
}
