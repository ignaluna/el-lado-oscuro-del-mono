import type { ReleaseStatus, SubscribeRequest, SubscribeResponse } from '../../../shared/api-types.ts';

export async function fetchStatus(signal?: AbortSignal): Promise<{ status: ReleaseStatus; offset: number }> {
  const t0 = Date.now();
  const res = await fetch('/api/status', { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const status = (await res.json()) as ReleaseStatus;
  const t1 = Date.now();
  // Diferencia entre el reloj del servidor y el del dispositivo (corrige relojes mal configurados).
  const offset = status.serverTime - (t0 + t1) / 2;
  return { status, offset };
}

export async function subscribe(body: SubscribeRequest): Promise<SubscribeResponse> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as SubscribeResponse | null;
    if (!data) return { ok: false, error: 'server' };
    // Solo es éxito si el servidor lo confirma explícitamente.
    if (data.ok && (res.status === 201 || res.status === 200)) return data;
    if (!data.ok) return data;
    return { ok: false, error: 'server' };
  } catch {
    return { ok: false, error: 'server' };
  }
}
