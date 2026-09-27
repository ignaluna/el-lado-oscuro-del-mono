import { useEffect, useRef } from 'react';
import { site } from '../../../shared/site.config.ts';
import { setMotion, setScene, usePrefs } from '../core/preferences.ts';
import { createStore, useStore } from '../core/store.ts';

// ── Avisos breves (aria-live) ──────────────────────────────────────────────────────────────
const toastStore = createStore<{ msg: string | null; seq: number }>({ msg: null, seq: 0 });
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  toastStore.set((s) => ({ msg, seq: s.seq + 1 }));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastStore.set({ msg: null }), 4200);
}
export function Toasts() {
  const { msg, seq } = useStore(toastStore);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {msg && (
        <p className="toast" key={seq}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ── Enlaces ────────────────────────────────────────────────────────────────────────────────
export function Links() {
  const links = site.links.filter((l) => l.url);
  if (!links.length) return null;
  return (
    <ul className="links" aria-label="Enlaces de la banda">
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ── Preferencias (movimiento / escena) ───────────────────────────────────────────────────
export function PrefsBar() {
  const p = usePrefs();
  return (
    <div className="prefs">
      <button
        type="button"
        className="chip"
        aria-pressed={p.reducedMotion}
        onClick={() => setMotion(p.reducedMotion ? 'full' : 'reduce')}
      >
        Movimiento reducido: {p.reducedMotion ? 'sí' : 'no'}
      </button>
      <button
        type="button"
        className="chip"
        onClick={() => setScene(p.scene === '3d' ? '2d' : '3d')}
        title={p.sceneReason ? `Vista liviana automática (${p.sceneReason})` : undefined}
      >
        Vista: {p.scene === '3d' ? '3D' : 'liviana 2D'}
      </button>
    </div>
  );
}

// ── Diálogo de información ──────────────────────────────────────────────────────────────
export function InfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="info" onClose={onClose} aria-labelledby="info-title">
      <h2 id="info-title">{site.album}</h2>
      <p>{site.texts.about}</p>
      <ol className="info__tracks">
        {site.tracks.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ol>
      <p className="muted">{site.texts.credits}</p>
      <Links />
      <button type="button" className="btn" onClick={onClose} autoFocus>
        Cerrar
      </button>
    </dialog>
  );
}

export function DevBadge({ override }: { override: string | null }) {
  if (!override) return null;
  return (
    <p className="dev-badge" role="note">
      DESARROLLO · estreno forzado: <code>{override}</code>
    </p>
  );
}
