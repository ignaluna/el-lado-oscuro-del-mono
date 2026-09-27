/** Contratos de la API compartidos entre servidor y cliente. */

export type ReleaseStatus = {
  /** Hora del servidor (ms UTC) — el cliente la usa para corregir el reloj local. */
  serverTime: number;
  /** Instante del estreno (ms UTC) o null si todavía no hay fecha confirmada. */
  releaseAt: number | null;
  released: boolean;
  /** Solo en desarrollo: describe el override activo (nunca en producción). */
  devOverride: string | null;
  /** Vacío antes del estreno: las URLs de audio no se exponen. */
  tracks: PublicTrackAudio[];
};

export type PublicTrackAudio = {
  id: string;
  src: string;
  /** true si es un audio de prueba (no el disco real). */
  demo: boolean;
};

export type SubscribeRequest = {
  email: string;
  name?: string;
  consent: boolean;
  phone?: string;
  whatsappConsent?: boolean;
  /** Honeypot anti-bots: debe llegar vacío. */
  website?: string;
};

export type SubscribeResponse =
  | { ok: true; status: 'created' | 'duplicate' }
  | { ok: false; error: 'validation'; fields: Partial<Record<'email' | 'name' | 'consent' | 'phone', string>> }
  | { ok: false; error: 'rate_limited' | 'server' | 'bad_request' };
