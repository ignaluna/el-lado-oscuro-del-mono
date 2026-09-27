import { site } from '../shared/site.config.ts';
import { zonedToUtcMs } from '../shared/time.ts';

/**
 * Fuente de verdad del estreno. SOLO el servidor decide si el disco está disponible.
 *
 * Override de desarrollo (variable DEV_RELEASE), ignorado siempre en producción:
 *   closed        → ascensor cerrado sin fecha
 *   open          → ya estrenado
 *   in:30         → se estrena 30 s después de arrancar el servidor (para probar la transición)
 *   2026-11-20T21:00:00-03:00 → fecha puntual
 */
export type ReleaseSchedule = {
  releaseAt: () => number | null;
  isReleased: (now?: number) => boolean;
  now: () => number;
  devOverride: string | null;
};

export function configuredReleaseAt(): number | null {
  const r = site.release;
  if (!r.date) return null;
  const at = zonedToUtcMs(r.date, r.time, r.timeZone);
  if (at === null) {
    console.error(`[estreno] Fecha inválida en site.config.ts: ${r.date} ${r.time}. Se trata como "Próximamente".`);
  }
  return at;
}

export function createReleaseSchedule(opts: {
  isProduction: boolean;
  devRelease?: string;
  now?: () => number;
  configured?: number | null;
}): ReleaseSchedule {
  const now = opts.now ?? Date.now;
  const configured = opts.configured === undefined ? configuredReleaseAt() : opts.configured;
  let releaseAt = configured;
  let devOverride: string | null = null;

  const raw = opts.devRelease?.trim();
  if (raw) {
    if (opts.isProduction) {
      console.warn('[estreno] DEV_RELEASE está definido pero se IGNORA en producción.');
    } else {
      devOverride = raw;
      if (raw === 'closed') releaseAt = null;
      else if (raw === 'open') releaseAt = now() - 1000;
      else if (/^in:\d+$/.test(raw)) releaseAt = now() + Number(raw.slice(3)) * 1000;
      else if (!Number.isNaN(Date.parse(raw))) releaseAt = Date.parse(raw);
      else {
        console.warn(`[estreno] DEV_RELEASE="${raw}" no reconocido; se usa la configuración.`);
        devOverride = null;
      }
      if (devOverride) console.log(`[estreno] Override de desarrollo activo: ${devOverride}`);
    }
  }

  return {
    releaseAt: () => releaseAt,
    isReleased: (t = now()) => releaseAt !== null && t >= releaseAt,
    now,
    devOverride,
  };
}
