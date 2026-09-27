import type { Mood } from '../../../shared/site.config.ts';
import type { View } from '../core/experience.ts';

/**
 * Lo único que la escena recibe de la aplicación. La escena NO controla audio, estreno ni
 * formulario: solo dibuja este estado. Cualquier implementación (2D, three.js, R3F, GLB…)
 * tiene que aceptar estas props y nada más.
 */
export type SceneProps = {
  released: boolean;
  view: View;
  floorIndex: number | null;
  previousFloorIndex: number | null;
  mood: Mood | null;
  /** Cambia en cada selección de piso → dispara el efecto de "viaje". */
  travelSeq: number;
  playing: boolean;
  reducedMotion: boolean;
  layout: 'mobile' | 'desktop';
  /** Rect (px, documento) del stage-window del Lobby; null si no se pudo medir. Solo se usa en mobile. */
  frame: { top: number; height: number } | null;
};

export type Scene3DCallbacks = {
  onReady: () => void;
  /** El dispositivo no puede con el 3D (error, contexto perdido o muy lento) → se pasa a 2D. */
  onFail: (reason: string) => void;
};
