import { createStore, useStore } from './store.ts';

/**
 * Rectángulo del "stage-window" del Lobby (el hueco donde se ve el ascensor), en px de
 * documento (top + scrollY, así no cambia con el scroll). Lo publica Lobby.tsx; lo consumen
 * las escenas (2D/3D) para encuadrar el ascensor mobile sin que tape el header.
 * null cuando el Lobby no está montado o todavía no se pudo medir.
 */
export type SceneFrame = { top: number; height: number } | null;

const sceneFrameStore = createStore<{ frame: SceneFrame }>({ frame: null });

export function setSceneFrame(frame: SceneFrame) {
  const cur = sceneFrameStore.get().frame;
  const same = cur === frame || (!!cur && !!frame && cur.top === frame.top && cur.height === frame.height) || (!cur && !frame);
  if (same) return;
  sceneFrameStore.set({ frame });
}

export const useSceneFrame = () => useStore(sceneFrameStore).frame;
