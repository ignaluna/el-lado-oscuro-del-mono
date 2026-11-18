// ═══════════════════════════════════════════════════════════════════════════════════════════
// The tones of a retraced cover (floors 2, 3 and 4): the parts every one of those rooms shares.
//   A cover is traced once from its photo (rectified to a square, its luminance cut at five levels, the glitter apart) and stored as text in the room's own
//   -art.js file. At run time the room decodes those contours, paints them into textures and hangs each texture on the rays that leave the arrival eye, so
//   that from the arrival spot the sum of the layers is the cover itself. What differs from room to room (the contours, the greys, the lens, the depths of
//   the layers, what moves) stays in the room; what does not is here:
//     · decodeTones      the contour text → closed loops (nested ones are holes),
//     · coverLens        the lens for the screen's aspect: wide screens and phones need their own focal length and aimed row,
//     · coverTones       the helpers bound to one room: the cover's pixels → the set (P), the tones painted into a texture with a soft glow (region), the soft masks
//                        that split the layers (they add up to one), the grid meshes whose every vertex is on its pixel's ray (gridMesh), the glitter's sprite rows,
//     · coverAim, coverFit   the camera pose helpers (straight in front of the part of the drawing that is looked at),
//     · inPoly, boxOf, mid   small geometry on the cover's pixels.
//   Nothing here is drawn by itself: a room asks for what it needs and keeps its own look (depths, masks, tints, textures' resolution).
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Contour text → [{ l: group, pts: [[x, y] …], a: area }] (the format is described in each room's -art.js: half-pixel integers, 5 bits per character, zig-zagged deltas). */
function decodeTones(TONE) {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-', out = [];
  TONE.forEach((s, l) => {
    let i = 0;
    const num = () => { let v = 0, sh = 0, c; do { c = AL.indexOf(s[i++]); v += (c & 31) * 2 ** sh; sh += 5; } while (c >= 32); return v; };
    const zg = () => { const v = num(); return v & 1 ? -(v + 1) / 2 : v / 2; };
    while (i < s.length) {
      const n = num(), pts = [[num() / 2, num() / 2]];
      for (let k = 1; k < n; k++) { const p = pts[k - 1]; pts.push([p[0] + zg() / 2, p[1] + zg() / 2]); }
      let a = 0; for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
      out.push({ l, pts, a: Math.abs(a) / 2 });
    }
  });
  return out;
}

/**
 * The lens for an aspect ratio. V is the room's eye ({ H, Z0, BOT }); wide and phone are { f, row, sx, sy }: the focal length in cover pixels, the cover row aimed at
 * (where the arrival view is centred), and where on the screen it is put (the free area between the title and the arrival line). yh is the cover row on the eye's horizon.
 */
function coverLens(V, a, wide, phone) {
  const w = a >= 1.1, L = w ? wide : phone;
  return { wide: w, f: L.f, yh: V.BOT - ((V.H - 0.15) * L.f) / V.Z0, row: L.row, sx: L.sx, sy: L.sy };
}

/** The cover's pixel (px, py) at a depth Z from the eye → the set (x to the viewer's right, y up, z toward the visitor; the drawing's plane at z = 0). */
const coverPoint = (V, f, yh) => (px, py, Z = V.Z0) => [((px - V.cx) * Z) / f, V.H + ((yh - py) * Z) / f, V.Z0 - Z];

/** A camera pose that looks from `camL` at `tgtL` (points of the root's frame) with the target at (sx, sy) of the screen. */
function coverAim(root, V3, camL, tgtL, sx, sy, fov, a) {
  root.updateMatrixWorld();
  const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
  const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
  return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
}
/** How far (m) a camera must stand so that a w x h patch fills fw x fh of the screen. */
const coverFit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };

/** Is the point (x, y) inside the polygon p? */
const inPoly = (p, x, y) => { let c = false; for (let i = 0, k = p.length - 1; i < p.length; k = i++) if ((p[i][1] > y) !== (p[k][1] > y) && x < ((p[k][0] - p[i][0]) * (y - p[i][1])) / (p[k][1] - p[i][1]) + p[i][0]) c = !c; return c; };
/** The box [x0, y0, x1, y1] around a polygon, grown by pad. */
const boxOf = (p, pad = 0) => [Math.min(...p.map((q) => q[0])) - pad, Math.min(...p.map((q) => q[1])) - pad, Math.max(...p.map((q) => q[0])) + pad, Math.max(...p.map((q) => q[1])) + pad];
/** The centre of a box. */
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];

/**
 * The tone helpers of one room. o: { V, lens ({ f, yh } from coverLens), decode, fill (the grey of each tone level), grey ({ level: grey } of the glitter groups, painted
 * grey so that the layer's tint makes them gold or silver), ts ([lite, full] texture pixels per cover pixel), root (the layers' default host), rnd (the room's own
 * seeded generator, used for the glitter) }. Levels 0-4 are the white and grey tones, 5-7 the gold and 8-9 the silver (a room without glitter has none).
 * Returns the loops (small ones dropped on the lite tier), their point count and the helpers.
 */
function coverTones(ctx, o) {
  const { THREE, V3 } = ctx, lite = ctx.lite, V = o.V, f = o.lens.f, yh = o.lens.yh, root = o.root, fill = o.fill, GREY = o.grey || {};
  const P = coverPoint(V, f, yh);
  const loops = o.decode().filter((lp) => lp.a >= (lite ? (lp.l < 5 ? 36 : 14) : 0));
  loops.forEach((lp) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of lp.pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } lp.bb = [a, b, c, d]; });
  const tonePts = loops.reduce((n, lp) => n + lp.pts.length, 0);
  const TS = lite ? o.ts[0] : o.ts[1]; // texture pixels per cover pixel
  const GAIN = 1.0; // (the traced levels are already the cover's tones, lifted)
  const pathOf = (pts) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; };
  const tones = (c, r, groups, gain) => {
    for (const l of groups) {
      const path = new Path2D(); let any = false;
      for (const lp of loops) {
        if (lp.l !== l || lp.bb[2] < r[0] || lp.bb[0] > r[2] || lp.bb[3] < r[1] || lp.bb[1] > r[3]) continue;
        lp.pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]))); path.closePath(); any = true;
      }
      if (!any) continue;
      const g = Math.min(255, Math.round(l < 5 ? fill[l] * gain : GREY[l])); c.fillStyle = `rgb(${g},${g},${g})`; c.fill(path, 'evenodd');
      if (l < 5) { c.strokeStyle = c.fillStyle; c.lineWidth = lite ? 0.8 : 0.6; c.lineJoin = 'round'; c.stroke(path); } // (the cover's strokes are a little bolder than their traced edges)
    }
  };
  /** A soft mask (alpha) over a rectangle of the cover: polygons filled and blurred (blur in cover px). */
  const maskOf = (w, hh, r, polys, blur, ts) => {
    const m = document.createElement('canvas'); m.width = w; m.height = hh; const c = m.getContext('2d');
    if (blur && 'filter' in c) c.filter = `blur(${(blur * ts).toFixed(1)}px)`;
    c.scale(w / (r[2] - r[0]), hh / (r[3] - r[1])); c.translate(-r[0], -r[1]); c.fillStyle = '#fff';
    for (const p of polys) c.fill(pathOf(p));
    return m;
  };
  /**
   * A texture painted from the tones inside a rectangle of the cover. groups: which levels; masks: [['in'|'out', polygons, blur], …] applied in order (the layers'
   * weights add up to one, so each stroke is drawn once in all); ts scales the resolution. A soft glow is added around every bright band.
   */
  const region = (r, opt = {}) => { const ts = TS * (opt.ts || 1); return ctx.canvasTex(Math.max(4, Math.round((r[2] - r[0]) * ts)), Math.max(4, Math.round((r[3] - r[1]) * ts)), (c, w, hh) => {
    const wc = document.createElement('canvas'); wc.width = w; wc.height = hh; const k = wc.getContext('2d');
    k.save(); k.scale(w / (r[2] - r[0]), hh / (r[3] - r[1])); k.translate(-r[0], -r[1]);
    tones(k, r, opt.groups || [0, 1, 2, 3, 4], opt.gain || GAIN);
    k.restore();
    for (const [mode, polys, blur] of opt.masks || []) { k.globalCompositeOperation = mode === 'in' ? 'destination-in' : 'destination-out'; k.drawImage(maskOf(w, hh, r, polys, blur, ts), 0, 0); }
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.drawImage(wc, 0, 0);
    if ('filter' in c && (opt.glow ?? 0.15) > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = opt.glow ?? 0.15; c.filter = `blur(${((2.6 * ts) / 1.7).toFixed(1)}px)`; c.drawImage(c.canvas, 0, 0); c.restore(); } // a soft glow around every bright band
  }); };
  const mat = (tex, tint = [0.96, 0.95, 0.98]) => { const u = { uTex: { value: tex }, uAlpha: { value: 1 }, uReveal: { value: 1 }, uTint: { value: V3(...tint) } }; return { u, m: ctx.glowMat(TEXT_FRAG, u) }; };
  /** A grid mesh over a cover rectangle whose every vertex sits on its pixel's ray at depth Z (a number, or a function of the pixel), relative to `origin` (a point of the set). */
  const gridMesh = (r, nx, ny, Z, tex, host = root, origin = [0, 0, 0], tint) => {
    const n = (nx + 1) * (ny + 1), base = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [], pxy = new Float32Array(n * 2), zf = typeof Z === 'function' ? Z : () => Z;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const px = r[0] + ((r[2] - r[0]) * i) / nx, py = r[1] + ((r[3] - r[1]) * j) / ny, k = j * (nx + 1) + i, p = P(px, py, zf(px, py));
      base.set([p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]], k * 3); pxy[k * 2] = px; pxy[k * 2 + 1] = py; uv[k * 2] = i / nx; uv[k * 2 + 1] = 1 - j / ny;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c2 = a + nx + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const geo = ctx.keep(new THREE.BufferGeometry()), attr = new THREE.BufferAttribute(new Float32Array(base), 3);
    geo.setAttribute('position', attr); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const M = mat(tex, tint), mesh = new THREE.Mesh(geo, M.m); mesh.frustumCulled = false; mesh.layers.set(1); host.add(mesh); // (layer 1: not mirrored by the water: the cover has no reflection)
    return { mesh, attr, base, pxy, u: M.u, nx, ny, r, n };
  };
  /** Sprite rows (the glitter's sparkle points) on the brightest grains: [x, y, brightness 0-255] → rows for kit.points, at depth Z (a number, or a function of the grain's pixel). */
  const glitterRows = (pts, size, Z) => pts.map(([x, y, b]) => { const p = P(x, y, typeof Z === 'function' ? Z(x, y) : Z); return [p[0], p[1], p[2], size * (0.7 + o.rnd() * 0.8), 0.45 + 0.55 * (b / 255), o.rnd(), 0]; });
  return { P, loops, tonePts, TS, GAIN, pathOf, tones, maskOf, region, mat, gridMesh, glitterRows };
}
