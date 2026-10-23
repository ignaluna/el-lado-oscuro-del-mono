// ═══════════════════════════════════════════════════════════════════════════════════════════
// COVER DRAWINGS  (the elevator of the album cover: white pencil on charcoal paper)
//   Arched body, the "II" mark, three steps, a floating ▲▼ call plate, a prism beam leaving the door.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The cabin floor sits on top of three steps: everything in the elevator group is lifted by this much. */
const CAB_LIFT = 0.35;
/** Paper tone of the cover (scene black is mapped to it by the post pass / the 2D renderer). */
const PAPER = '#2b2725';

/**
 * Hand-drawn stroke on a canvas: two passes with a little jitter and overshoot, like white pencil on rough paper.
 * Coordinates are canvas pixels; widths are metres (S = pixels per metre). 'g' = self-lit line, 'r' = line lit by the scene.
 */
function makeChalk(ctx, pal, S, seed = 7) {
  const rnd = mulberry32(seed);
  const is3D = pal === PAL3D;
  ctx.globalCompositeOperation = pal.op; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const color = (ch, a) => (is3D ? (ch === 'r' ? `rgba(255,0,0,${a})` : `rgba(0,255,0,${a})`) : `rgba(236,233,232,${a * (ch === 'r' ? 0.5 : 0.95)})`);
  function stroke(pts, w, ch = 'g', passes = 2, a = 0.85) {
    for (let p = 0; p < passes; p++) {
      const j = S * 0.0035 * (p ? 1.8 : 0.7);
      ctx.strokeStyle = color(ch, a * (p ? 0.5 : 1)); ctx.lineWidth = Math.max(1.3, w * S * (p ? 0.65 : 1));
      ctx.beginPath();
      pts.forEach(([x, y], i) => { const jx = (rnd() - 0.5) * j, jy = (rnd() - 0.5) * j; if (i) ctx.lineTo(x + jx, y + jy); else ctx.moveTo(x + jx, y + jy); });
      ctx.stroke();
    }
  }
  const api = {
    rnd,
    path: stroke,
    line(x1, y1, x2, y2, w, ch, passes, a) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, n = Math.max(2, Math.round(len / (S * 0.16)));
      const ox = ((x2 - x1) / len) * S * 0.012, oy = ((y2 - y1) / len) * S * 0.012; // corners overshoot a little
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push([lerp(x1 - ox, x2 + ox, i / n), lerp(y1 - oy, y2 + oy, i / n)]);
      stroke(pts, w, ch, passes, a);
    },
    rect(x, y, wd, hg, w, ch, passes) { api.line(x, y, x + wd, y, w, ch, passes); api.line(x + wd, y, x + wd, y + hg, w, ch, passes); api.line(x + wd, y + hg, x, y + hg, w, ch, passes); api.line(x, y + hg, x, y, w, ch, passes); },
    arc(cx, cy, r, a0, a1, w, ch, passes) {
      const n = Math.max(8, Math.round((Math.abs(a1 - a0) * r) / (S * 0.07))), pts = [];
      for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      stroke(pts, w, ch, passes);
    },
    /** Dense strokes filling a rectangle (the solid chalk of the "II"). */
    fill(x, y, wd, hg, w, ch = 'g') { const n = Math.max(3, Math.round(wd / (w * S * 0.6))); for (let i = 0; i <= n; i++) { const xx = x + (wd * i) / n; api.line(xx, y, xx + (rnd() - 0.5) * wd * 0.12, y + hg, w, ch, 1, 0.8); } },
    /** Loose diagonal shading strokes inside a rectangle. */
    hatch(x, y, wd, hg, step, w, ch = 'r', a = 0.55) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, wd, hg); ctx.clip();
      for (let d = -hg; d < wd; d += step * S * (0.7 + rnd() * 0.6)) api.line(x + d, y + hg, x + d + hg * 0.55, y, w, ch, 1, a * (0.6 + rnd() * 0.4));
      ctx.restore();
    },
  };
  return api;
}

Object.assign(Tex, {
  /** Front elevation rectangle in the elevator's local metres (cabin floor at y = 0.25). */
  COVER: { w: 1.7, h: 3.95, x0: -0.85, y0: -0.35, top: 3.6, spring: 2.75, r: 0.85 },

  /** Front of the arched body: outline, lintel, door frame, the "II" in the arch. */
  coverFront(ctx, w, h, pal) {
    fillBg(ctx, w, h, pal);
    const C = Tex.COVER, S = w / C.w, X = (x) => (x - C.x0) * S, Y = (y) => (C.top - y) * S;
    const k = makeChalk(ctx, pal, S, 3);
    const outline = (inset, wd, passes) => {
      const r = C.r - inset, pts = [];
      for (let y = C.y0 + 0.02; y < C.spring; y += 0.2) pts.push([X(-r), Y(y)]);
      for (let i = 0; i <= 30; i++) { const a = Math.PI - (i / 30) * Math.PI; pts.push([X(Math.cos(a) * r), Y(C.spring + Math.sin(a) * r)]); }
      for (let y = C.spring; y > C.y0; y -= 0.2) pts.push([X(r), Y(y)]);
      k.path(pts, wd, 'g', passes);
    };
    outline(0.022, 0.022, 2);
    outline(0.085, 0.008, 1);
    k.line(X(-0.82), Y(2.75), X(0.82), Y(2.75), 0.016, 'g', 2);
    k.line(X(-0.82), Y(2.69), X(0.82), Y(2.69), 0.007, 'g', 1);
    // door frame
    k.line(X(-0.625), Y(0.25), X(-0.625), Y(2.53), 0.018, 'g', 2);
    k.line(X(0.625), Y(0.25), X(0.625), Y(2.53), 0.018, 'g', 2);
    k.line(X(-0.64), Y(2.525), X(0.64), Y(2.525), 0.018, 'g', 2);
    k.line(X(-0.7), Y(0.27), X(-0.7), Y(2.6), 0.006, 'g', 1);
    k.line(X(0.7), Y(0.27), X(0.7), Y(2.6), 0.006, 'g', 1);
    // the "II"
    for (const x of [-0.215, 0.075]) { k.fill(X(x), Y(3.37), 0.14 * S, 0.4 * S, 0.02, 'g'); k.rect(X(x), Y(3.37), 0.14 * S, 0.4 * S, 0.009, 'g', 1); }
    // shading: loose hatching on the right of the arch and down the right jamb
    ctx.save(); ctx.beginPath(); ctx.arc(X(0), Y(C.spring), (C.r - 0.1) * S, Math.PI, 0); ctx.clip();
    k.hatch(X(0.3), Y(3.5), 0.5 * S, 0.74 * S, 0.05, 0.008, 'r', 0.7);
    ctx.restore();
    k.hatch(X(0.71), Y(2.6), 0.1 * S, 2.3 * S, 0.07, 0.007, 'r', 0.6);
    k.hatch(X(-0.81), Y(2.6), 0.1 * S, 2.3 * S, 0.11, 0.006, 'r', 0.35);
  },

  /** One door leaf 0.6 × 2.25 m: plain panel, sketched; the left leaf carries the little heart handle of the cover. */
  coverLeaf(ctx, w, h, pal, flip) {
    fillBg(ctx, w, h, pal);
    if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    const S = w / 0.6, X = (x) => x * S, Y = (y) => (2.25 - y) * S;
    const k = makeChalk(ctx, pal, S, flip ? 5 : 4);
    k.rect(X(0.03), Y(2.22), 0.54 * S, 2.19 * S, 0.016, 'g', 2);
    k.rect(X(0.085), Y(2.16), 0.43 * S, 2.07 * S, 0.006, 'g', 1);
    k.line(X(0.575), Y(0.03), X(0.575), Y(2.22), 0.01, 'g', 1);
    k.hatch(X(0.09), Y(2.15), 0.42 * S, 2.05 * S, 0.16, 0.006, 'r', 0.4);
    if (!flip) { // heart handle near the seam
      const cx = X(0.5), cy = Y(1.14), r = 0.03 * S, pts = [];
      for (let i = 0; i <= 24; i++) { const t = (i / 24) * TAU; pts.push([cx + r * 1.05 * Math.pow(Math.sin(t), 3), cy - r * (0.81 * Math.cos(t) - 0.31 * Math.cos(2 * t) - 0.12 * Math.cos(3 * t) - 0.06 * Math.cos(4 * t))]); }
      k.path(pts, 0.008, 'g', 2);
    } else k.line(X(0.5), Y(1.06), X(0.5), Y(1.22), 0.012, 'g', 2);
  },

  /** Floating call plate 0.3 × 0.52 m with ▲ ▼. */
  coverCall(ctx, w, h, pal) {
    fillBg(ctx, w, h, pal);
    const S = w / 0.3;
    const k = makeChalk(ctx, pal, S, 9);
    const rr = 0.045 * S, x0 = 0.022 * S, y0 = 0.022 * S, x1 = w - x0, y1 = h - y0, pts = [];
    const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } };
    corner(x1 - rr, y0 + rr, -Math.PI / 2); corner(x1 - rr, y1 - rr, 0); corner(x0 + rr, y1 - rr, Math.PI / 2); corner(x0 + rr, y0 + rr, Math.PI); pts.push(pts[0]);
    k.path(pts, 0.014, 'g', 2);
    const tri = (cy, dir, fill) => {
      const s = 0.062 * S, p = [[w / 2 - s, cy + dir * s * 0.75], [w / 2 + s, cy + dir * s * 0.75], [w / 2, cy - dir * s * 0.8], [w / 2 - s, cy + dir * s * 0.75]];
      k.path(p, 0.012, 'g', 2);
      if (fill) { ctx.save(); ctx.beginPath(); p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.clip(); k.fill(w / 2 - s, cy - s, 2 * s, 2 * s, 0.012, 'g'); ctx.restore(); }
    };
    tri(0.17 * S, 1, true);
    tri(0.36 * S, -1, false);
  },

  /** Any box face: its own outline plus loose shading, so plain boxes read as drawn objects. */
  sketchBox(ctx, w, h, pal, shade = 0.5, seed = 11) {
    fillBg(ctx, w, h, pal);
    const S = Math.min(w, h) / 1;
    const k = makeChalk(ctx, pal, S, seed);
    const m = Math.max(5, Math.min(w, h) * 0.035);
    k.rect(m, m, w - 2 * m, h - 2 * m, 0.03, 'g', 2);
    if (shade > 0) k.hatch(m * 2, m * 2, w - 4 * m, h - 4 * m, 0.22 / shade, 0.012, 'r', 0.5);
  },
});

// Prism beam of the cover: pencil-hatched rays leaving the door, crossed by a rainbow band.
const BEAM_VERT = /* glsl */`
attribute float aSeed; varying vec2 vUv; varying float vSeed; varying float vZ;
void main(){ vUv = uv; vSeed = aSeed; vZ = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BEAM_FRAG = /* glsl */`
uniform float uBeam; uniform float uAlpha; uniform float uTime;
varying vec2 vUv; varying float vSeed; varying float vZ;
${GLSL_NOISE}
void main(){
  float t = vUv.x;
  float head = smoothstep(uBeam*1.2, uBeam*1.2 - 0.3, t);
  float across = pow(1.0 - abs(vUv.y*2.0 - 1.0), 0.6);
  float pencil = 0.5 + 0.5*vnoise(vec2(t*46.0 + vSeed*17.0, vSeed*9.0));
  float fade = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.5, 1.0, t));
  float band = smoothstep(1.7, 1.95, vZ) * (1.0 - smoothstep(3.25, 3.5, vZ));
  float hue = clamp((vZ - 1.8) / 1.6, 0.0, 1.0) * 0.8;
  vec3 spec = clamp(vec3(abs(hue*6.0 - 3.0) - 1.0, 2.0 - abs(hue*6.0 - 2.0), 2.0 - abs(hue*6.0 - 4.0)), 0.0, 1.0);
  vec3 col = mix(vec3(0.74, 0.72, 0.42), spec*0.9 + 0.08, band*0.82);
  float flick = 0.9 + 0.1*sin(uTime*1.7 + vSeed*40.0);
  float a = head * fade * pencil * across * (0.36 + 0.44*band) * uBeam * flick;
  gl_FragColor = vec4(col * a * uAlpha, 1.0);
}`;
