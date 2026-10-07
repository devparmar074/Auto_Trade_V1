import type { 
  DashboardSummary, 
  LtpQuote, 
  OrderResult, 
  PlaceOrderRequest, 
  Position, 
  UpstoxAuthStatus 
} from '../types/trading';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/api/vi/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchQuote(): Promise<LtpQuote> {
  const res = await fetch(`${BASE_URL}/api/vi/quote`);
  if (!res.ok) throw new Error('Failed to fetch live quote');
  return res.json();
}

export async function fetchMarketStatus(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/vi/market-status`);
  if (!res.ok) throw new Error('Failed to fetch market status');
  return res.json();
}

export async function fetchPosition(): Promise<Position> {
  const res = await fetch(`${BASE_URL}/api/vi/position`);
  if (!res.ok) throw new Error('Failed to fetch position');
  return res.json();
}

export async function submitLiveOrder(request: PlaceOrderRequest): Promise<OrderResult> {
  const res = await fetch(`${BASE_URL}/api/vi/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    let detailMsg = errorJson?.message;
    if (!detailMsg && errorJson?.errors) {
      detailMsg = Object.values(errorJson.errors).flat().join(', ');
    }
    if (!detailMsg && errorJson?.title) {
      detailMsg = errorJson.title;
    }
    throw new Error(detailMsg || 'Failed placing order to broker');
  }
  return res.json();
}

export async function fetchRecentOrders(limit: number = 10): Promise<OrderResult[]> {
  const res = await fetch(`${BASE_URL}/api/vi/orders?limit=${limit}`);
  if (!res.ok) return [];
  const list = await res.json();
  return list.map((item: any) => ({
    success: item.status === 4 || item.status === 2,
    localOrderId: item.id,
    correlationId: item.correlationId,
    upstoxOrderId: item.upstoxOrderId,
    status: mapStatusNumberToString(item.status),
    statusText: mapStatusNumberToString(item.status),
    transactionType: item.transactionType === 1 ? 'BUY' : 'SELL',
    quantity: item.quantity,
    executionPrice: item.averageExecutionPrice || item.placedPrice,
    executionTimeUtc: item.executionTimeUtc,
    message: item.statusMessage
  }));
}

function mapStatusNumberToString(statusNum: number): any {
  switch (statusNum) {
    case 1: return 'Pending';
    case 2: return 'Open';
    case 3: return 'PartiallyFilled';
    case 4: return 'Complete';
    case 5: return 'Cancelled';
    case 6: return 'Rejected';
    case 7: return 'Failed';
    default: return 'Unknown';
  }
}

export async function fetchAuthStatus(): Promise<UpstoxAuthStatus> {
  const res = await fetch(`${BASE_URL}/api/upstox/status`);
  if (!res.ok) throw new Error('Failed to fetch auth status');
  return res.json();
}

export async function disconnectBroker(): Promise<void> {
  await fetch(`${BASE_URL}/api/upstox/disconnect`, { method: 'POST' });
}

export function getConnectUrl(): string {
  return `${BASE_URL}/api/upstox/connect?redirect=true`;
}

export async function submitManualToken(token: string): Promise<UpstoxAuthStatus> {
  const res = await fetch(`${BASE_URL}/api/upstox/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: token })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed validating access token');
  }
  return res.json();
}

export async function fetchRegisteredIp(): Promise<{ primaryIp?: string; secondaryIp?: string }> {
  const res = await fetch(`${BASE_URL}/api/upstox/ip`);
  if (!res.ok) return {};
  const json = await res.json().catch(() => ({}));
  const data = json?.data || {};
  return {
    primaryIp: data.primary_ip,
    secondaryIp: data.secondary_ip
  };
}

export async function submitRegisteredIp(primaryIp: string, secondaryIp?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/upstox/ip`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryIp, secondaryIp })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed updating static IP in Upstox');
  }
  return res.json();
}

export async function fetchStrategyScore(): Promise<import('../types/trading').StrategyScore> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/score`);
  if (!res.ok) throw new Error('Failed to fetch strategy score');
  return res.json();
}

export async function fetchCandles(interval: string = '1minute', limit: number = 200): Promise<import('../types/trading').CandleData[]> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/candles?interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch candles');
  return res.json();
}

export async function fetchBotConfig(): Promise<import('../types/trading').BotConfig> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/config`);
  if (!res.ok) throw new Error('Failed to fetch bot configuration');
  return res.json();
}

export async function updateBotConfig(config: import('../types/trading').BotConfig): Promise<import('../types/trading').BotConfig> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed updating bot configuration');
  }
  return res.json();
}

export async function triggerKillSwitch(closeOpenPositions: boolean = false): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/kill-switch?closeOpenPositions=${closeOpenPositions}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to activate kill switch');
  }
  return res.json();
}

export async function fetchStrategySignals(limit: number = 20): Promise<import('../types/trading').StrategySignalHistory[]> {
  const res = await fetch(`${BASE_URL}/api/vi/strategy/signals?limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

