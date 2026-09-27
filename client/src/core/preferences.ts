import { site } from '../../../shared/site.config.ts';
import { createStore, useStore } from './store.ts';

/**
 * Preferencias del visitante: movimiento reducido y tipo de escena (3D / 2D).
 * Se recuerdan en este navegador (localStorage protegido con try/catch).
 */
type MotionChoice = 'system' | 'reduce' | 'full';
type SceneChoice = 'auto' | '3d' | '2d';

function read<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export type Prefs = {
  motionChoice: MotionChoice;
  systemReduced: boolean;
  reducedMotion: boolean;
  sceneChoice: SceneChoice;
  /** Resultado final: qué escena mostrar. */
  scene: '3d' | '2d';
  /** Por qué se eligió 2D automáticamente (si aplica). */
  sceneReason: string | null;
};

function detect3D(): { ok: boolean; reason: string | null } {
  if (!site.scene.prefer3D) return { ok: false, reason: 'config' };
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return { ok: false, reason: 'ahorro de datos' };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return { ok: false, reason: 'poca memoria' };
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 3) return { ok: false, reason: 'procesador limitado' };
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { ok: false, reason: 'sin WebGL' };
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return { ok: false, reason: 'sin WebGL' };
  }
  return { ok: true, reason: null };
}

let capability: { ok: boolean; reason: string | null } | null = null;
let runtimeFailure: string | null = null;

function compute(motionChoice: MotionChoice, sceneChoice: SceneChoice): Prefs {
  const systemReduced = !!mq?.matches;
  const reducedMotion = motionChoice === 'system' ? systemReduced : motionChoice === 'reduce';
  capability ??= detect3D();
  let scene: '3d' | '2d' = '2d';
  let sceneReason: string | null = null;
  if (sceneChoice === '2d') scene = '2d';
  else if (runtimeFailure) {
    scene = '2d';
    sceneReason = runtimeFailure;
  } else if (sceneChoice === '3d') scene = capability.ok || capability.reason !== 'sin WebGL' ? '3d' : '2d';
  else {
    scene = capability.ok ? '3d' : '2d';
    sceneReason = capability.reason;
  }
  return { motionChoice, systemReduced, reducedMotion, sceneChoice, scene, sceneReason };
}

export const prefsStore = createStore<Prefs>(
  compute(read('motion', ['system', 'reduce', 'full'], 'system'), read('escena', ['auto', '3d', '2d'], 'auto')),
);

mq?.addEventListener?.('change', () => {
  const p = prefsStore.get();
  prefsStore.set(compute(p.motionChoice, p.sceneChoice));
});

export function setMotion(choice: MotionChoice) {
  write('motion', choice);
  prefsStore.set(compute(choice, prefsStore.get().sceneChoice));
}

export function setScene(choice: SceneChoice) {
  write('escena', choice);
  runtimeFailure = null;
  prefsStore.set(compute(prefsStore.get().motionChoice, choice));
}

/** La escena 3D avisa que falló o anda lenta: pasamos a 2D sin cortar nada más. */
export function report3DFailure(reason: string) {
  runtimeFailure = reason;
  const p = prefsStore.get();
  prefsStore.set(compute(p.motionChoice, p.sceneChoice === '3d' ? 'auto' : p.sceneChoice));
}

export const usePrefs = () => useStore(prefsStore);
