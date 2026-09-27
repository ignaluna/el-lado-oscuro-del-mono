import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { site } from '../../../shared/site.config.ts';
import { useExperience } from '../core/experience.ts';
import { usePlayer } from '../core/player/hooks.ts';
import { report3DFailure, usePrefs } from '../core/preferences.ts';
import { useRelease } from '../core/release.ts';
import { Scene2D } from './two/Scene2D.tsx';
import type { SceneProps } from './types.ts';

// three.js entra en un chunk aparte: se descarga solo si se usa el 3D.
const Scene3D = lazy(() => import('./three/Scene3D.tsx'));

class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useLayout(): 'mobile' | 'desktop' {
  const q = '(min-width: 900px) and (min-aspect-ratio: 1/1)';
  const [desk, setDesk] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setDesk(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return desk ? 'desktop' : 'mobile';
}

/**
 * Capa visual. Traduce el estado de la app a SceneProps y elige 3D o 2D.
 * Es decorativa (aria-hidden): todo lo importante está en el HTML de la interfaz.
 */
export function SceneHost() {
  const release = useRelease();
  const { view } = useExperience();
  const player = usePlayer();
  const prefs = usePrefs();
  const layout = useLayout();
  const [load3D, setLoad3D] = useState(false);
  const [ready3D, setReady3D] = useState(false);

  // Diferimos la descarga del 3D hasta que la página ya se ve y el navegador está libre.
  useEffect(() => {
    if (prefs.scene !== '3d') {
      setReady3D(false);
      return;
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => setLoad3D(true);
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 400);
  }, [prefs.scene]);

  const props: SceneProps = {
    released: release.phase === 'open',
    view,
    floorIndex: player.index,
    previousFloorIndex: player.previousIndex,
    mood: player.index !== null ? site.tracks[player.index].mood : null,
    travelSeq: player.selectionSeq,
    playing: player.status === 'playing',
    reducedMotion: prefs.reducedMotion,
    layout,
  };

  const use3D = prefs.scene === '3d' && load3D;
  return (
    <div className="stage" aria-hidden="true" data-scene={use3D && ready3D ? '3d' : '2d'}>
      <Scene2D {...props} hidden={use3D && ready3D} />
      {use3D && (
        <Boundary onError={() => report3DFailure('error')}>
          <Suspense fallback={null}>
            <div className={`stage__3d${ready3D ? ' is-ready' : ''}`}>
              <Scene3D {...props} onReady={() => setReady3D(true)} onFail={(r) => report3DFailure(r)} />
            </div>
          </Suspense>
        </Boundary>
      )}
    </div>
  );
}
