import { createStore, useStore } from './store.ts';

/**
 * Recorrido del visitante, independiente de cómo se dibuje la escena.
 * La escena LEE este estado y anima; nunca lo bloquea. El paso a 'inside' ocurre por tiempo,
 * termine o no la animación (o aunque la escena no exista).
 */
export type View = 'lobby' | 'entering' | 'inside';

export const experienceStore = createStore<{ view: View }>({ view: 'lobby' });

export const ENTER_DURATION_MS = 1600;
export const ENTER_DURATION_REDUCED_MS = 250;

let enterTimer: ReturnType<typeof setTimeout> | undefined;

export function enterElevator(reducedMotion: boolean) {
  if (experienceStore.get().view !== 'lobby') return;
  experienceStore.set({ view: 'entering' });
  clearTimeout(enterTimer);
  enterTimer = setTimeout(
    () => experienceStore.set({ view: 'inside' }),
    reducedMotion ? ENTER_DURATION_REDUCED_MS : ENTER_DURATION_MS,
  );
}

export const useExperience = () => useStore(experienceStore);
