import { useState } from 'react';
import { site } from '../../../shared/site.config.ts';
import { next, prev, seek, select, toggle } from '../core/player/engine.ts';
import { usePlayer, usePlayerTime } from '../core/player/hooks.ts';

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return '--:--';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function Progress() {
  const { currentTime, duration } = usePlayerTime();
  const [drag, setDrag] = useState<number | null>(null);
  const value = drag ?? currentTime;
  const ready = Number.isFinite(duration) && duration > 0;
  return (
    <div className="progress">
      <span className="progress__time">{fmt(value)}</span>
      <input
        type="range"
        className="progress__range"
        min={0}
        max={ready ? duration : 1}
        step={0.1}
        value={ready ? value : 0}
        disabled={!ready}
        aria-label="Posición en la canción"
        aria-valuetext={`${fmt(value)} de ${fmt(duration)}`}
        style={{ ['--pct' as string]: ready ? `${(value / duration) * 100}%` : '0%' }}
        onChange={(e) => setDrag(Number(e.target.value))}
        onPointerUp={() => {
          if (drag !== null) seek(drag);
          setDrag(null);
        }}
        onKeyUp={() => {
          if (drag !== null) seek(drag);
          setDrag(null);
        }}
        onBlur={() => setDrag(null)}
      />
      <span className="progress__time">{fmt(duration)}</span>
    </div>
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const { buffering } = usePlayerTime();
  const track = p.index !== null ? site.tracks[p.index] : null;
  const isPlaying = p.status === 'playing' || (p.status === 'loading' && p.index !== null);


  let statusText = '';
  if (p.status === 'loading' || (buffering && p.status === 'playing')) statusText = 'Cargando…';
  else if (p.status === 'paused') statusText = 'En pausa';
  else if (p.status === 'ended') statusText = site.texts.endOfAlbum;

  return (
    <section className="player" aria-label="Reproductor">
      <div className="player__now">
        <p className="player__title">
          {track ? (
            <>
              <span className="player__floor">P{p.index! + 1}</span> {track.title}
            </>
          ) : (
            <span className="muted">{site.texts.insideHint}</span>
          )}
        </p>
        <p className="player__status" aria-live="polite">
          {p.demo && track && <span className="demo-tag">{site.texts.demoAudioNotice}</span>} {statusText}
        </p>
      </div>

      {p.status === 'error' && (
        <div className="player__error" role="alert">
          <span>{p.error}</span>
          <button type="button" className="btn btn--small" onClick={() => p.index !== null && select(p.index)}>
            Reintentar
          </button>
        </div>
      )}

      <Progress />

      <div className="player__controls">
        <button type="button" className="ctrl" onClick={prev} aria-label="Canción anterior" disabled={p.index === null || p.index === 0}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
        </button>
        <button type="button" className="ctrl ctrl--main" onClick={toggle} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
          )}
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={next}
          aria-label="Canción siguiente"
          disabled={p.index !== null && p.index >= site.tracks.length - 1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
        </button>
      </div>
    </section>
  );
}
