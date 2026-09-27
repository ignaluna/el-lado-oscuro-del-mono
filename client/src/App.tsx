import { useEffect } from 'react';
import { site } from '../../shared/site.config.ts';
import { useExperience } from './core/experience.ts';
import { setSources } from './core/player/engine.ts';
import { usePlayer } from './core/player/hooks.ts';
import { usePrefs } from './core/preferences.ts';
import { useRelease } from './core/release.ts';
import { SceneHost } from './scene/SceneHost.tsx';
import { Toasts } from './ui/common.tsx';
import { Inside } from './ui/Inside.tsx';
import { Lobby } from './ui/Lobby.tsx';

/**
 * Composición: capa de escena (decorativa, intercambiable) + interfaz HTML accesible.
 * La lógica (estreno, audio, recorrido, inscripciones) vive en core/ y no depende de la escena.
 */
export function App() {
  const release = useRelease();
  const { view } = useExperience();
  const prefs = usePrefs();
  const player = usePlayer();

  // Las URLs de audio solo existen después del estreno (las entrega el servidor).
  useEffect(() => setSources(release.tracks), [release.tracks]);

  useEffect(() => {
    document.documentElement.dataset.motion = prefs.reducedMotion ? 'reduce' : 'full';
  }, [prefs.reducedMotion]);

  // Color del piso actual también para la interfaz HTML
  useEffect(() => {
    const m = player.index !== null ? site.tracks[player.index].mood : null;
    const s = document.documentElement.style;
    s.setProperty('--mood', m?.color ?? '#f4e9c8');
    s.setProperty('--mood-glow', m?.glow ?? '#5a4d2a');
  }, [player.index]);

  const inside = view === 'inside' && release.phase === 'open';

  return (
    <>
      <SceneHost />
      <main className={`ui ui--${view}`}>{inside ? <Inside /> : <Lobby leaving={view === 'entering'} />}</main>
      <Toasts />
    </>
  );
}
