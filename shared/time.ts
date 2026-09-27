/**
 * Utilidades de fecha con zona horaria (sin dependencias).
 */

/** Offset (ms) de `timeZone` respecto de UTC en el instante `utcMs`. */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Convierte una fecha/hora "de pared" en una zona horaria a un instante UTC (ms).
 * Devuelve null si la fecha es inválida.
 */
export function zonedToUtcMs(date: string, time: string, timeZone: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t) return null;
  const [y, mo, da] = [+d[1], +d[2], +d[3]];
  const [h, mi] = [+t[1], +t[2]];
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;
  const naive = Date.UTC(y, mo - 1, da, h, mi);
  // Dos pasadas para cubrir cambios de horario (Uruguay no tiene DST desde 2015, pero por las dudas).
  let utc = naive - tzOffsetMs(naive, timeZone);
  utc = naive - tzOffsetMs(utc, timeZone);
  return utc;
}

/** "viernes 20 de noviembre · 21:00" en la zona indicada. */
export function formatRelease(utcMs: number, timeZone: string): string {
  const day = new Intl.DateTimeFormat('es-UY', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(
    utcMs,
  );
  const hour = new Intl.DateTimeFormat('es-UY', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    utcMs,
  );
  return `${day} · ${hour}`;
}

export function splitCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
