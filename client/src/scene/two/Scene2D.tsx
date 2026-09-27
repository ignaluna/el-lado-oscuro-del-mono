import type { SceneProps } from '../types.ts';

/**
 * Escena 2D liviana (SVG + CSS). Es la alternativa cuando el 3D no está disponible,
 * y lo que se ve mientras el 3D se descarga. Mismo contrato de props que la 3D.
 * Trazo blanco sobre negro, como la portada.
 */
export function Scene2D(p: SceneProps & { hidden?: boolean }) {
  const cls = [
    'scene2d',
    `scene2d--${p.view}`,
    `scene2d--${p.layout}`,
    p.released ? 'is-released' : '',
    p.mood?.special === 'prisma' ? 'is-prisma' : '',
    p.hidden ? 'is-hidden' : '',
  ].join(' ');
  return (
    <div className={cls} style={{ ['--mood' as string]: p.mood?.color ?? '#fff2cc', ['--mood-glow' as string]: p.mood?.glow ?? '#5a4d2a' }}>
      {/* Exterior */}
      <svg className="scene2d__lobby" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="spill" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="#fff6d0" stopOpacity="0.75" />
            <stop offset="1" stopColor="#fff6d0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rainbow" x1="0" x2="1">
            <stop offset="0" stopColor="#ff3b30" />
            <stop offset=".2" stopColor="#ff9500" />
            <stop offset=".35" stopColor="#ffd60a" />
            <stop offset=".5" stopColor="#34c759" />
            <stop offset=".65" stopColor="#32ade6" />
            <stop offset=".8" stopColor="#5856d6" />
            <stop offset="1" stopColor="#af52de" />
          </linearGradient>
          <clipPath id="opening">
            <path d="M172 300 V148 A28 28 0 0 1 228 148 V300 Z" />
          </clipPath>
        </defs>
        <g className="s2-spill">
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={70 + (i % 5) * 9} y={165 + i * 5.6} width={105 - (i % 5) * 9} height={1.4} fill="url(#spill)" />
          ))}
          <rect x="112" y="200" width="40" height="46" fill="url(#rainbow)" opacity="0.55" rx="3" />
        </g>
        {/* interior visible cuando se abren las puertas */}
        <g clipPath="url(#opening)">
          <rect x="170" y="110" width="60" height="192" className="s2-inner" />
          <g className="s2-door s2-door--l">
            <rect x="172" y="148" width="28" height="152" className="s2-leaf" />
          </g>
          <g className="s2-door s2-door--r">
            <rect x="200" y="148" width="28" height="152" className="s2-leaf" />
          </g>
          <line x1="200" x2="200" y1="150" y2="298" className="s2-seam" />
        </g>
        <path className="s2-line" d="M168 302 V148 A32 32 0 0 1 232 148 V302" />
        <path className="s2-line s2-thin" d="M172 300 V148 A28 28 0 0 1 228 148 V300" />
        <line className="s2-line s2-thin" x1="172" x2="228" y1="148" y2="148" />
        <rect className="s2-ii" x="193" y="126" width="4.5" height="14" rx="2.2" />
        <rect className="s2-ii" x="202.5" y="126" width="4.5" height="14" rx="2.2" />
        {/* escalones */}
        <path className="s2-line s2-thin" d="M168 302 H232 L226 312 H160 L166 302 M160 312 V320 H224 V312 M160 320 L152 330 H218 L224 320 M152 330 V338 H218 V330" />
        {/* botonera */}
        <rect className="s2-line s2-thin" x="244" y="212" width="12" height="22" rx="1.5" />
        <path className="s2-call" d="M250 216 l3 5 h-6 z M250 230 l3 -5 h-6 z" />
      </svg>

      {/* Interior */}
      <svg className="scene2d__inside" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="lamp" cx="0.5" cy="0" r="0.9">
            <stop offset="0" stopColor="var(--mood)" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="var(--mood-glow)" stopOpacity="0.35" />
            <stop offset="1" stopColor="#0b0b0d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="#0b0b0d" />
        <rect width="400" height="400" fill="url(#lamp)" className="s2-lampwash" />
        <g className="s2-line s2-thin">
          <rect x="120" y="90" width="160" height="220" />
          <line x1="0" y1="0" x2="120" y2="90" />
          <line x1="400" y1="0" x2="280" y2="90" />
          <line x1="0" y1="400" x2="120" y2="310" />
          <line x1="400" y1="400" x2="280" y2="310" />
          <line x1="130" y1="232" x2="270" y2="232" />
          <rect x="165" y="140" width="70" height="36" />
        </g>
        <ellipse cx="200" cy="40" rx="70" ry="14" className="s2-lamp" />
        <rect className="s2-band" x="0" y="0" width="400" height="26" />
      </svg>
    </div>
  );
}
