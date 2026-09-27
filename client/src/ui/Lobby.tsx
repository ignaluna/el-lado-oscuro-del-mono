import { site } from '../../../shared/site.config.ts';
import { formatRelease, splitCountdown } from '../../../shared/time.ts';
import { enterElevator } from '../core/experience.ts';
import { usePrefs } from '../core/preferences.ts';
import { useCountdown, useRelease } from '../core/release.ts';
import { DevBadge, Links, PrefsBar, toast } from './common.tsx';
import { SubscribeForm } from './SubscribeForm.tsx';

const pad = (n: number) => String(n).padStart(2, '0');

function Countdown({ releaseAt, offset }: { releaseAt: number; offset: number }) {
  const left = useCountdown(releaseAt, offset) ?? 0;
  const c = splitCountdown(left);
  const units: [number, string][] = [
    [c.days, 'días'],
    [c.hours, 'horas'],
    [c.minutes, 'min'],
    [c.seconds, 'seg'],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`Faltan ${c.days} días, ${c.hours} horas y ${c.minutes} minutos`}>
      {units.map(([v, l]) => (
        <span className="countdown__unit" key={l} aria-hidden="true">
          <span className="countdown__num">{pad(v)}</span>
          <span className="countdown__label">{l}</span>
        </span>
      ))}
    </div>
  );
}

export function Lobby({ leaving }: { leaving: boolean }) {
  const r = useRelease();
  const prefs = usePrefs();
  const t = site.texts;
  const released = r.phase === 'open';

  return (
    <div className={`lobby${leaving ? ' is-leaving' : ''}`}>
      <header className="lobby__head">
        <p className="band">{site.band}</p>
        <h1 className="album">{site.album}</h1>
      </header>

      {/* Espacio donde se ve la escena (el ascensor) */}
      <div className="stage-window" aria-hidden="true" />

      <section className="lobby__status" aria-live="polite">
        {r.phase === 'loading' && <p className="status-line">Consultando al ascensorista…</p>}
        {r.phase === 'error' && <p className="status-line">No pudimos conectar con el edificio. Reintentando…</p>}

        {r.phase === 'closed' && (
          <>
            {r.releaseAt === null ? (
              <p className="status-big">{t.comingSoon}</p>
            ) : (
              <>
                <p className="status-line">
                  Estreno: <strong>{formatRelease(r.releaseAt, site.release.timeZone)}</strong>{' '}
                  <span className="muted">(hora de Uruguay)</span>
                </p>
                <Countdown releaseAt={r.releaseAt} offset={r.offset} />
              </>
            )}
            <p className="teaser">{t.teaser}</p>
            <p className="teaser teaser--small">{t.teaserSecondary}</p>
            <button type="button" className="btn btn--ghost call-btn" onClick={() => toast(t.callButtonClosed)}>
              <span aria-hidden="true">▲▼</span> Llamar al ascensor
            </button>
          </>
        )}

        {released && (
          <>
            <p className="status-big">{t.releasedHeadline}</p>
            <button
              type="button"
              className="btn btn--primary btn--enter"
              onClick={() => enterElevator(prefs.reducedMotion)}
              disabled={leaving}
            >
              {t.enterCta}
            </button>
            <p className="muted small">No hace falta registrarse para escuchar.</p>
          </>
        )}
      </section>

      <SubscribeForm released={released} />

      <footer className="lobby__foot">
        <Links />
        <PrefsBar />
        <DevBadge override={r.devOverride} />
      </footer>
    </div>
  );
}
