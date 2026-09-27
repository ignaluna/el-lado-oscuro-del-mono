import { site } from '../../../../shared/site.config.ts';
import type { PublicTrackAudio } from '../../../../shared/api-types.ts';
import { createStore } from '../store.ts';

/**
 * Motor de reproducción ÚNICO.
 * - Un solo <audio> para toda la app, creado fuera de React: montar/desmontar la escena,
 *   abrir paneles o cambiar la vista nunca lo reinicia.
 * - Cada selección invalida la anterior (token): si alguien toca varios pisos rápido,
 *   gana la última y nunca suenan dos canciones a la vez.
 * - No precarga el disco: solo se pide el archivo de la canción elegida.
 */

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type PlayerState = {
  index: number | null;
  status: PlayerStatus;
  error: string | null;
  demo: boolean;
  /** Se incrementa en cada selección de piso (la escena lo usa para disparar el "viaje"). */
  selectionSeq: number;
  previousIndex: number | null;
};

export type TimeState = { currentTime: number; duration: number; buffering: boolean };

export const playerStore = createStore<PlayerState>({
  index: null,
  status: 'idle',
  error: null,
  demo: false,
  selectionSeq: 0,
  previousIndex: null,
});
export const timeStore = createStore<TimeState>({ currentTime: 0, duration: NaN, buffering: false });

let audio: HTMLAudioElement | null = null;
let sources: PublicTrackAudio[] = [];
let token = 0;

function el(): HTMLAudioElement {
  if (audio) return audio;
  const a = new Audio();
  a.preload = 'none';
  a.setAttribute('playsinline', '');
  a.addEventListener('playing', () => playerStore.set({ status: 'playing', error: null }));
  a.addEventListener('pause', () => {
    // El evento llega asíncrono: si mientras tanto se eligió otro piso y ya está sonando, se ignora.
    if (!a.paused) return;
    const s = playerStore.get().status;
    if (s === 'playing' || s === 'loading') playerStore.set({ status: a.ended ? 'ended' : 'paused' });
  });
  a.addEventListener('waiting', () => timeStore.set({ buffering: true }));
  a.addEventListener('canplay', () => timeStore.set({ buffering: false }));
  a.addEventListener('timeupdate', () => timeStore.set({ currentTime: a.currentTime }));
  a.addEventListener('durationchange', () => timeStore.set({ duration: a.duration }));
  a.addEventListener('loadedmetadata', () => timeStore.set({ duration: a.duration }));
  a.addEventListener('ended', () => {
    const i = playerStore.get().index;
    // Reproducción continua del disco, en orden.
    if (i !== null && i < sources.length - 1) select(i + 1);
    else playerStore.set({ status: 'ended' });
  });
  a.addEventListener('error', () => {
    if (!a.getAttribute('src')) return;
    const my = token;
    // Si el error es de la selección vigente, lo mostramos (nunca uno viejo).
    queueMicrotask(() => {
      if (my !== token) return;
      playerStore.set({ status: 'error', error: 'No pudimos cargar esta canción. Revisá tu conexión y probá de nuevo.' });
      timeStore.set({ buffering: false });
    });
  });
  audio = a;
  setupMediaSession();
  return a;
}

export function setSources(tracks: PublicTrackAudio[]) {
  sources = tracks;
}

export function hasSources() {
  return sources.length > 0;
}

/** Selecciona un piso y lo reproduce. Debe llamarse desde un gesto del usuario (tap/click/tecla). */
export function select(index: number) {
  const src = sources[index];
  if (!src) return;
  const a = el();
  const my = ++token;
  const prev = playerStore.get();
  a.pause();
  a.src = src.src; // reemplaza la fuente: el audio anterior se corta ahí mismo
  timeStore.set({ currentTime: 0, duration: NaN, buffering: true });
  playerStore.set({
    index,
    status: 'loading',
    error: null,
    demo: src.demo,
    selectionSeq: prev.selectionSeq + 1,
    previousIndex: prev.index,
  });
  updateMediaMetadata(index);
  const p = a.play();
  if (p) {
    p.catch((err: DOMException) => {
      if (my !== token) return; // una selección posterior ya tomó el control
      if (err.name === 'AbortError') return;
      if (err.name === 'NotAllowedError') playerStore.set({ status: 'paused' }); // el navegador pide otro toque
      else playerStore.set({ status: 'error', error: 'El navegador no pudo reproducir este audio.' });
    });
  }
}

export function toggle() {
  const { index, status } = playerStore.get();
  if (index === null) return select(0);
  if (status === 'error' || status === 'ended') return select(status === 'ended' && index === sources.length - 1 ? 0 : index);
  const a = el();
  if (a.paused) {
    playerStore.set({ status: 'loading' });
    a.play().catch((err: DOMException) => {
      if (err.name !== 'AbortError') playerStore.set({ status: 'paused' });
    });
  } else a.pause();
}

export function pause() {
  audio?.pause();
}

export function next() {
  const { index } = playerStore.get();
  if (index === null) return select(0);
  if (index < sources.length - 1) select(index + 1);
}

export function prev() {
  const { index } = playerStore.get();
  if (index === null) return select(0);
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  select(Math.max(0, index - 1));
}

export function seek(seconds: number) {
  const a = audio;
  if (!a || !Number.isFinite(a.duration)) return;
  a.currentTime = Math.max(0, Math.min(seconds, a.duration - 0.1));
  timeStore.set({ currentTime: a.currentTime });
}

// ── Controles del sistema (pantalla bloqueada / auriculares) ────────────────────────────────
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  const safe = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* acción no soportada */
    }
  };
  safe('play', () => toggle());
  safe('pause', () => pause());
  safe('previoustrack', () => prev());
  safe('nexttrack', () => next());
  safe('seekto', (d) => d.seekTime !== undefined && seek(d.seekTime));
}

function updateMediaMetadata(index: number) {
  if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
  const t = site.tracks[index];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${index + 1}. ${t.title}${sources[index]?.demo ? ' (audio de prueba)' : ''}`,
    artist: site.band,
    album: site.album,
    artwork: [{ src: site.images.coverSmall, sizes: '512x512', type: 'image/jpeg' }],
  });
}

/** Solo para pruebas automáticas: expone el elemento único. */
export function _debugAudio() {
  return audio;
}
