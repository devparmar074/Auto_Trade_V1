import type { DashboardSummary, OrderResult, PlaceOrderRequest } from '../types/trading';

// Configurable backend URL: replace with machine IP / domain when running on physical device
export const API_BASE_URL = 'http://10.0.2.2:5000'; // Default Android emulator host loopback

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/api/vi/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function submitLiveOrder(request: PlaceOrderRequest): Promise<OrderResult> {
  const res = await fetch(`${API_BASE_URL}/api/vi/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Order failed');
  }
  return res.json();
}
