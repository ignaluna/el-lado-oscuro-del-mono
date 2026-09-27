import { useEffect, useRef, useState } from 'react';
import { site } from '../../../shared/site.config.ts';
import { select } from '../core/player/engine.ts';
import { usePlayer } from '../core/player/hooks.ts';
import { usePrefs } from '../core/preferences.ts';
import { InfoDialog, PrefsBar, toast } from './common.tsx';
import { PlayerBar } from './PlayerBar.tsx';

/** Display de piso: recorre los números intermedios (solo visual; el audio ya arrancó). */
function FloorIndicator() {
  const p = usePlayer();
  const { reducedMotion } = usePrefs();
  const [shown, setShown] = useState<number | null>(p.index);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    clearInterval(timer.current);
    const target = p.index;
    if (target === null) return;
    const from = p.previousIndex;
    if (reducedMotion || from === null || from === target) {
      setShown(target);
      setDir(null);
      return;
    }
    const step = target > from ? 1 : -1;
    setDir(step > 0 ? 'up' : 'down');
    let cur = from;
    timer.current = setInterval(() => {
      cur += step;
      setShown(cur);
      if (cur === target) {
        clearInterval(timer.current);
        setDir(null);
      }
    }, 90);
    return () => clearInterval(timer.current);
  }, [p.selectionSeq, p.index, p.previousIndex, reducedMotion]);

  const track = p.index !== null ? site.tracks[p.index] : null;
  return (
    <div className="indicator">
      <div className="indicator__led" aria-hidden="true">
        <span className="indicator__arrow">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : ' '}</span>
        <span className="indicator__num">{shown !== null ? shown + 1 : 'PB'}</span>
      </div>
      <p className="indicator__title" aria-live="polite">
        {track ? (
          <>
            <span className="sr-only">Piso {p.index! + 1}: </span>
            {track.title}
          </>
        ) : (
          site.texts.insideHint
        )}
      </p>
    </div>
  );
}

function FloorPanel() {
  const p = usePlayer();
  return (
    <nav className="panel" aria-label="Pisos del ascensor: cada piso es una canción">
      <ol className="panel__grid">
        {site.tracks.map((t, i) => {
          const active = p.index === i;
          return (
            <li key={t.id} style={{ ['--btn-mood' as string]: t.mood.color }}>
              <button
                type="button"
                className={`floor-btn${active ? ' is-active' : ''}`}
                aria-pressed={active}
                aria-label={`Piso ${i + 1}: ${t.title}`}
                onClick={() => select(i)}
              >
                <span className="floor-btn__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="floor-btn__title" aria-hidden="true">
                  {t.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Inside() {
  const [info, setInfo] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="inside">
      <header className="inside__head">
        <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
          Dentro del ascensor — {site.album}
        </h1>
        <FloorIndicator />
      </header>
      <div className="stage-window stage-window--inside" aria-hidden="true" />
      <div className="inside__controls">
        <FloorPanel />
        <div className="inside__extra">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setInfo(true)}>
            ⓘ Sobre el disco
          </button>
          <button type="button" className="btn btn--ghost btn--small alarm" onClick={() => toast(site.texts.alarm)}>
            🔔 Alarma
          </button>
        </div>
        <PlayerBar />
        <PrefsBar />
      </div>
      <InfoDialog open={info} onClose={() => setInfo(false)} />
    </div>
  );
}
