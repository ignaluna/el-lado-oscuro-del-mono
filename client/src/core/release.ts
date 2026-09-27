import { useEffect, useState } from 'react';
import type { PublicTrackAudio } from '../../../shared/api-types.ts';
import { fetchStatus } from './api.ts';
import { createStore, useStore } from './store.ts';

/**
 * Estado del estreno. La fuente de verdad es el servidor: el cliente solo cuenta hacia atrás
 * y, al llegar la hora, vuelve a preguntar. Funciona aunque la página lleve horas abierta.
 */
export type ReleaseState = {
  phase: 'loading' | 'closed' | 'open' | 'error';
  releaseAt: number | null;
  /** serverTime - Date.now() */
  offset: number;
  tracks: PublicTrackAudio[];
  devOverride: string | null;
};

export const releaseStore = createStore<ReleaseState>({
  phase: 'loading',
  releaseAt: null,
  offset: 0,
  tracks: [],
  devOverride: null,
});

const PERIODIC_MS = 5 * 60_000;
const MAX_TIMEOUT = 60 * 60_000; // setTimeout no admite plazos enormes: re-agendamos cada hora
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;

function schedule(ms: number) {
  clearTimeout(timer);
  timer = setTimeout(refresh, Math.max(250, Math.min(ms, MAX_TIMEOUT)));
}

export async function refresh() {
  try {
    const { status, offset } = await fetchStatus();
    releaseStore.set({
      phase: status.released ? 'open' : 'closed',
      releaseAt: status.releaseAt,
      offset,
      // Una vez abierto, no "cerramos" la lista si una consulta posterior falla.
      tracks: status.released ? status.tracks : [],
      devOverride: status.devOverride,
    });
    if (status.released) {
      schedule(PERIODIC_MS);
    } else if (status.releaseAt !== null) {
      const remaining = status.releaseAt - status.serverTime;
      // Al llegar la hora preguntamos de nuevo (con un pequeño margen aleatorio para no saturar).
      schedule(remaining > 0 ? remaining + 150 + Math.random() * 1200 : 2000);
    } else {
      schedule(PERIODIC_MS);
    }
  } catch {
    if (releaseStore.get().phase === 'loading') releaseStore.set({ phase: 'error' });
    schedule(5000);
  }
}

export function startReleaseWatcher() {
  if (started) return;
  started = true;
  void refresh();
  // Al volver a la pestaña o recuperar conexión, re-sincronizamos (los timers se congelan en celulares).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
  window.addEventListener('online', () => void refresh());
}

export const useRelease = () => useStore(releaseStore);

/** Milisegundos que faltan para el estreno según el reloj del servidor (se actualiza cada segundo). */
export function useCountdown(releaseAt: number | null, offset: number): number | null {
  const calc = () => (releaseAt === null ? null : Math.max(0, releaseAt - (Date.now() + offset)));
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (releaseAt === null) return;
    const id = setInterval(() => {
      const v = calc();
      setLeft(v);
      if (v === 0) void refresh(); // llegó la hora: confirmamos con el servidor
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseAt, offset]);
  return left;
}
