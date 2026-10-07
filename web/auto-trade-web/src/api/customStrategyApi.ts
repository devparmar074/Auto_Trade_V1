import type { 
  CustomStrategy, 
  ActiveStrategyInfo, 
  CustomStrategyEvaluationResult 
} from '../types/customStrategy';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchCustomStrategies(): Promise<CustomStrategy[]> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies`);
  if (!res.ok) throw new Error('Failed to fetch custom strategies');
  return res.json();
}

export async function fetchCustomStrategyById(id: number): Promise<CustomStrategy> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch custom strategy #${id}`);
  return res.json();
}

export async function saveCustomStrategy(strategy: CustomStrategy): Promise<CustomStrategy> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(strategy)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to save custom strategy');
  }
  return res.json();
}

export async function deleteCustomStrategy(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to delete custom strategy #${id}`);
  }
  return res.json();
}

export async function duplicateCustomStrategy(id: number): Promise<CustomStrategy> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/${id}/duplicate`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to duplicate custom strategy #${id}`);
  }
  return res.json();
}

export async function activateCustomStrategy(id: number): Promise<ActiveStrategyInfo> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/${id}/activate`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to activate custom strategy #${id}`);
  }
  return res.json();
}

export async function deactivateCustomStrategy(): Promise<ActiveStrategyInfo> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/deactivate`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to deactivate custom strategy and return to default');
  }
  return res.json();
}

export async function fetchActiveStrategyInfo(): Promise<ActiveStrategyInfo> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/active`);
  if (!res.ok) throw new Error('Failed to fetch active strategy info');
  return res.json();
}

export async function fetchActiveCustomStrategyEvaluation(): Promise<CustomStrategyEvaluationResult | null> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/active/evaluate`);
  if (!res.ok) return null;
  return res.json();
}

export async function evaluateCustomStrategy(strategy: CustomStrategy): Promise<CustomStrategyEvaluationResult> {
  const res = await fetch(`${BASE_URL}/api/vi/custom-strategies/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(strategy)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to simulate strategy evaluation');
  }
  return res.json();
}
