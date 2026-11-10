// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 5 · «EXPLOTAR»  (the cover, as a walking monkey with a DNA strand behind him: chalk tones on black, glitter only on the ear cup)
//   The drawing: a monkey in profile walks to the right on a tiled floor in perspective, with headphones (a glitter disc on the ear cup),
//   sunglasses, hatched fur, plaid shorts and laced sneakers, blowing music notes. Behind him a DNA double helix: frayed into a brush on
//   the left, whole in the middle, dashed and fading on the right; a drop hangs from it and falls. Squiggles and notes float on both
//   sides, white smudges lie on the floor, "11:11" in the corner. The paper in the photo is a black sheet in a plastic sleeve (slightly
//   turned and keystoned, with glare), so the tones were traced from a rectified copy (49-r3d-room-5-explotar-art.js).
//   The cover is a perspective drawing, so the set is what it shows: the visitor arrives at the eye that sees it (1.6 m high) and every
//   point stands where it projects onto the cover's own pixels from there. Four kinds of layer share that eye:
//     · the ground: the tiles and smudges lie on the water's floor (the tile rows are real ground rows),
//     · the walker: a standing relief cut out by his silhouette (a little forward in the head, back in the rear leg), swaying as he walks,
//     · the strand: two flat layers a metre behind him (the one ahead of him can dissolve into dashes), plus movers cut from the same
//       tones: the three near rungs (solid or dashed), the notes from his mouth, the squiggles on both sides, the drop,
//     · chalk ribbons for what is told and what moves: the strand's far end beyond the picture, the notes to collect, rings, glitter.
//   From the arrival spot the room is the cover; walking in, it opens up. world.room.v holds the targets (the controller, 59-room-5-…,
//   sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, GR the cover row where his feet touch the ground, Z0 how far (m) that is from the eye, ZB the strand's depth. */
const EX = { H: 1.6, cx: 545, GR: 975, Z0: 5.5, ZB: 6.4, ARR: 2.7 };
/** Where the visitor stands when a floor opens is the eye; the walker is Z0 metres ahead of it. */
const EX_SET = { x: 0, y: 1.6, z: EX.ARR + EX.Z0 };
/** The six rungs of the strand: three on the helix of the picture (px, py: the cover pixel of the rung), three beyond it, on the part of the strand that goes on past the edge (far: metres from the cover's middle). */
const EX_RUNGS = [
  { id: 'puno', pain: 1, word: 'el puño cerrado', near: [335, 619] },
  { id: 'fuerza', pain: 0, word: 'la fuerza', near: [620, 600] },
  { id: 'ojos', pain: 1, word: 'tus ojos duros', near: [782, 600] },
  { id: 'viva', pain: 0, word: 'tu manera de seguir viva', far: 5.7 },
  { id: 'silencio', pain: 1, word: 'ese silencio', far: 7.6 },
  { id: 'pedazo', pain: 0, word: 'un pedazo tuyo en mí', far: 9.5 },
];
/** The notes that carry the unsaid words (world x, z, height): they show only near. The song is sung in this order. */
const EX_NOTES = [{ id: 'te', word: 'te', x: -4.6, z: 6.0, y: 1.5 }, { id: 'amo', word: 'amo', x: 4.8, z: 5.6, y: 1.4 }, { id: 'abuela', word: 'abuela', x: -2.9, z: 11.2, y: 1.7 }];
const EX_SONG = ['te', 'amo', 'abuela'];
/** Where the ear cup is on the cover (the glitter disc) and the walker's mouth. */
const EX_EAR = [425, 418], EX_MOUTH = [570, 458];

ROOM_SETS['explotar'] = function buildExplotar(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = EX;
  // On a wide screen the cover fills the height; a phone's narrow view keeps the walker whole at a longer lens. The set's z never changes.
  const wide = ctx.W / Math.max(1, ctx.H) >= 1.1, f = wide ? 1150 : 1950, yh = V.GR - (V.H * f) / V.Z0;
  const root = new THREE.Group();
  root.position.set(0, 0, EX_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(55);
  const WC = lite ? [1.2, 1.8, 2.5] : [1.6, 2.4, 3.2];
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };
  const mp = (Z) => Z / f; // metres per cover pixel at depth Z

  // ---- the cover's pixels → the set (x to the viewer's right, y up, z toward the visitor; the walker's plane at z = 0) ----
  const ground = (py) => (V.H * f) / Math.max(8, py - yh); // depth of a point lying on the ground at cover row py
  const P = (px, py, Z = V.Z0) => [((px - V.cx) * Z) / f, V.H + ((yh - py) * Z) / f, V.Z0 - Z];
  const bump = (px, py, cx, cy, rx, ry) => Math.exp(-(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2));
  /** How far the walker's body is from his plane: the head and shoulder forward, the near leg and shoe a little forward, the rear leg back. */
  const Zm = (px, py) => V.Z0 - 0.5 * bump(px, py, 470, 430, 150, 170) - 0.3 * bump(px, py, 860, 760, 130, 120) + 0.35 * bump(px, py, 430, 850, 90, 90);
  const Pm = (px, py) => P(px, py, Zm(px, py));

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const loops = exDecode().filter((lp) => lp.a >= (lite ? 70 : 0));
  loops.forEach((lp) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of lp.pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } lp.bb = [a, b, c, d]; });
  const tonePts = loops.reduce((n, lp) => n + lp.pts.length, 0);
  const TS = lite ? 1.05 : 1.85; // texture pixels per cover pixel
  const GAIN = 1.3;
  const monkeyPath = new Path2D(); EX_MONKEY.forEach((p, i) => (i ? monkeyPath.lineTo(p[0], p[1]) : monkeyPath.moveTo(p[0], p[1]))); monkeyPath.closePath();
  const tones = (c, r) => {
    for (let l = 0; l < EX_FILL.length; l++) {
      const path = new Path2D(); let any = false;
      for (const lp of loops) {
        if (lp.l !== l || lp.bb[2] < r[0] || lp.bb[0] > r[2] || lp.bb[3] < r[1] || lp.bb[1] > r[3]) continue;
        lp.pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]))); path.closePath(); any = true;
      }
      if (!any) continue;
      const g = Math.min(255, Math.round(EX_FILL[l] * GAIN)); c.fillStyle = `rgb(${g},${g},${g})`; c.fill(path, 'evenodd');
    }
  };
  // The movers (small standing quads cut from the same tones): their rectangles in cover pixels; the layers behind them are cleared there.
  const RECT = { mouth: [572, 385, 748, 514], left: [100, 335, 278, 498], right: [788, 405, 968, 506], drop: [806, 722, 858, 784] };
  const RUNG_R = EX_RUNGS.map((r) => (r.near ? [r.near[0] - 30, r.near[1] - 52, r.near[0] + 30, r.near[1] + 52] : null));
  const movers = [RECT.mouth, RECT.left, RECT.right, RECT.drop, ...RUNG_R.filter(Boolean)];
  /** A texture painted from the tones inside a rectangle of the cover: clip (a Path2D), erase (rects and the walker's polygon), dash (breaks the bars and strands into dashes). */
  const region = (r, o = {}) => ctx.canvasTex(Math.max(4, Math.round((r[2] - r[0]) * TS)), Math.max(4, Math.round((r[3] - r[1]) * TS)), (c, w, hh) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    c.save(); c.scale(w / (r[2] - r[0]), hh / (r[3] - r[1])); c.translate(-r[0], -r[1]);
    if (o.clip) c.clip(o.clip);
    tones(c, r);
    c.fillStyle = '#000';
    for (const e of o.erase || []) { if (e instanceof Path2D) c.fill(e); else c.fillRect(e[0], e[1], e[2] - e[0], e[3] - e[1]); }
    if (o.dash) for (let y = r[1] + 4; y < r[3]; y += 17) c.fillRect(r[0], y, r[2] - r[0], 8);
    c.restore();
    if ('filter' in c) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.15; c.filter = `blur(${(2.6 * TS / 1.7).toFixed(1)}px)`; c.drawImage(c.canvas, 0, 0); c.restore(); } // a soft glow around every bright band
  });
  const mat = (tex, tint = [0.96, 0.95, 0.98]) => { const u = { uTex: { value: tex }, uAlpha: { value: 1 }, uReveal: { value: 1 }, uTint: { value: V3(...tint) } }; return { u, m: ctx.glowMat(TEXT_FRAG, u) }; };
  /** A grid mesh over a cover rectangle whose every vertex sits on its pixel's ray at a depth `Zf(px, py)`; returns its geometry data. */
  const gridMesh = (r, nx, ny, Zf, tex, host = root) => {
    const n = (nx + 1) * (ny + 1), base = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const px = r[0] + ((r[2] - r[0]) * i) / nx, py = r[1] + ((r[3] - r[1]) * j) / ny, k = j * (nx + 1) + i, Z = Zf(px, py), p = P(px, py, Z);
      base.set(p, k * 3); uv[k * 2] = i / nx; uv[k * 2 + 1] = 1 - j / ny;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c2 = a + nx + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const geo = ctx.keep(new THREE.BufferGeometry()), attr = new THREE.BufferAttribute(new Float32Array(base), 3);
    geo.setAttribute('position', attr); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const M = mat(tex), mesh = new THREE.Mesh(geo, M.m); mesh.frustumCulled = false; mesh.layers.set(1); host.add(mesh);
    return { mesh, attr, base, u: M.u, nx, ny, r };
  };

  // the ground: the tiles and the smudges lie on the floor (the tile rows are real ground rows); the walker is cut out of it
  const GR_R = [20, 800, 1090, 1082], BA_L = [20, 330, 566, 806], BA_R = [566, 330, 1092, 806], MK_R = [340, 330, 990, 1022];
  const eraseAll = [monkeyPath, ...movers];
  const groundL = gridMesh(GR_R, lite ? 28 : 44, lite ? 10 : 16, (px, py) => ground(py) * 0.985, region(GR_R, { erase: [monkeyPath] }));
  // the strand: two flat layers behind him, the one ahead of him is the part that can dissolve
  const backL = gridMesh(BA_L, lite ? 14 : 22, lite ? 10 : 14, () => V.ZB, region(BA_L, { erase: eraseAll }));
  const backR = gridMesh(BA_R, lite ? 14 : 22, lite ? 10 : 14, () => V.ZB, region(BA_R, { erase: eraseAll }));
  groundL.mesh.layers.set(1); // (not mirrored by the water: the cover has no reflection)
  // the walker: a relief cut out by his silhouette
  const walker = grp(root);
  const body = gridMesh(MK_R, lite ? 34 : 50, lite ? 38 : 56, Zm, region(MK_R, { clip: monkeyPath }), walker);
  body.mesh.layers.set(1);
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── movers: small standing quads cut from the tones ─────────────────────────────
  const mover = (rect, Zd, o = {}) => {
    const w = rect[2] - rect[0], h = rect[3] - rect[1], c = P((rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2, Zd), host = grp(root, c[0], c[1], c[2]);
    const geo = ctx.keep(new THREE.PlaneGeometry(w * mp(Zd), h * mp(Zd)));
    const mk = (tex) => { const M = mat(tex), m = new THREE.Mesh(geo, M.m); m.frustumCulled = false; m.layers.set(1); host.add(m); return { m, u: M.u }; };
    const a = mk(region(rect, { erase: o.erase }));
    const b = o.dash ? mk(region(rect, { dash: true, erase: o.erase })) : null;
    return { host, a, b, home: c, w: w * mp(Zd), h: h * mp(Zd) };
  };
  const mouthN = mover(RECT.mouth, V.Z0 - 0.35), floatL = mover(RECT.left, V.Z0 + 0.3), floatR = mover(RECT.right, V.Z0 + 0.55);
  const dropM = mover(RECT.drop, V.ZB - 0.4);
  const rungM = EX_RUNGS.map((r, k) => (r.near ? mover(RUNG_R[k], V.ZB, { dash: true }) : null));
  // the squiggles on each side are a few pieces: they bob one by one (the left group and the right group are each one quad: bobbing as one, with different phases per group)

  // ───────────────────────────── chalk helpers ─────────────────────────────
  const ell = (cx, cy, rx, ry, n = 14, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot), 0]; });
  /** A music note in a unit box (an eighth note, or two beamed), scaled by s. */
  const noteGlyph = (R, s, w, al, two) => {
    const head = (x, y) => R.poly(ell(x * s, y * s, 0.1 * s, 0.07 * s, 10, 0.45).map((p) => [p[0], p[1], 0]), w, al, true);
    head(0, 0); R.seg([0.09 * s, 0.01 * s, 0], [0.09 * s, 0.62 * s, 0], w, al);
    if (two) { head(0.34, -0.06); R.seg([0.43 * s, -0.05 * s, 0], [0.43 * s, 0.58 * s, 0], w, al); R.seg([0.09 * s, 0.62 * s, 0], [0.43 * s, 0.58 * s, 0], w * 1.2, al); }
    else { R.poly([[0.09 * s, 0.62 * s, 0], [0.2 * s, 0.5 * s, 0], [0.3 * s, 0.4 * s, 0], [0.27 * s, 0.3 * s, 0]], w, al); }
  };
  /** A ring (a circle of chalk) facing the visitor. */
  const ring = (R, r, w, al, n = 30) => R.poly(ell(0, 0, r, r, n), w, al, true);

  // ───────────────────────────── the strand beyond the picture: it goes on to the right, dashed, with the three far rungs ─────────────────────────────
  const mpb = mp(V.ZB), ampB = 30 * mpb, strandY = P(0, 599, V.ZB)[1], endX = P(1045, 0, V.ZB)[0], farEnd = 11.2, per = 330 * mpb;
  // On a phone the strand's row is low (about a metre), where the corner player covers what is to be tapped: beyond the picture it climbs to chest height.
  const farY = Math.max(strandY, 1.5), yAt = (x) => strandY + (farY - strandY) * smooth(endX, endX + 3.5, x);
  const ext = (() => {
    const R = kit.ribbons(60), ph = (x) => ((x - endX) / per) * TAU;
    for (const sgn of [1, -1]) for (let x = endX + 0.1; x < farEnd; x += lite ? 0.34 : 0.24) { const a = [x, yAt(x) + sgn * ampB * Math.sin(ph(x) + 0.4), 0], b = [x + (lite ? 0.17 : 0.12), yAt(x + 0.12) + sgn * ampB * Math.sin(ph(x + 0.12) + 0.4), 0]; R.seg(a, b, WC[0], 0.55); }
    const host = grp(root, 0, 0, V.Z0 - V.ZB), L = lines(R, { glow: true }); host.add(L.obj);
    return { host, L };
  })();
  /** A rung drawn in chalk: three bars, a spread of the strand's height. */
  const barRung = (R, hh, w, al) => { for (const x of [-0.07, 0, 0.07]) R.seg([x, -hh, 0], [x, hh, 0], w, al); };
  const farK = [], farPos = {};
  EX_RUNGS.forEach((r, k) => {
    if (!r.far) return;
    const zl = V.Z0 - V.ZB, pos = [r.far, farY, zl], host = grp(root, pos[0], pos[1], pos[2]);
    const Rs = kit.ribbons(70 + k); barRung(Rs, ampB * 0.9, WC[1], 1); const Ls = lines(Rs, { glow: true }); host.add(Ls.obj);
    const Rd = kit.ribbons(80 + k); for (const x of [-0.07, 0, 0.07]) for (let y = -ampB * 0.9; y < ampB * 0.85; y += ampB * 0.5) Rd.seg([x, y, 0], [x, y + ampB * 0.28, 0], WC[0], 0.8); const Ld = lines(Rd); host.add(Ld.obj);
    const Rr = kit.ribbons(90 + k); ring(Rr, ampB * 1.5, WC[0], 0.9); const Lr = lines(Rr, { glow: true }); host.add(Lr.obj);
    farK[k] = { host, Ls, Ld, Lr, pos }; farPos[k] = pos;
  });

  // ───────────────────────────── the notes: hummers (they only drift) and the three carriers (they show near, and are collected) ─────────────────────────────
  const toLocal = (wx, wy, wz) => [-wx, wy, EX_SET.z - wz];
  const hummerDef = [[-3.4, 4.3, 1.7], [3.7, 4.9, 2.0], [-6.9, 8.6, 2.3], [6.9, 9.4, 1.5], [-1.5, 6.5, 2.5], [2.1, 7.0, 1.2]].slice(0, lite ? 4 : 6);
  const hummers = hummerDef.map(([wx, wz, y], i) => {
    const R = kit.ribbons(100 + i); noteGlyph(R, 0.3 + 0.08 * (i % 3), WC[0], 0.8, i % 2 === 1); const p = toLocal(wx, y, wz), host = grp(root, p[0], p[1], p[2]), L = lines(R, { glow: true }); host.add(L.obj);
    return { host, L, p, wx, wz, ph: i * 1.7 };
  });
  const carriers = EX_NOTES.map((n, i) => {
    const R = kit.ribbons(110 + i); noteGlyph(R, 0.62, WC[1] + 0.4, 1, i === 1); const Rr = kit.ribbons(115 + i); ring(Rr, 0.42, WC[0], 0.8, 28);
    const p = toLocal(n.x, n.y, n.z), host = grp(root, p[0], p[1], p[2]), L = lines(R, { glow: true }), Lr = lines(Rr, { glow: true }); host.add(L.obj); host.add(Lr.obj);
    const tex = ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(58, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.55)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.fillText(n.word, w / 2, hh / 2 + 3); });
    const label = kit.plane(tex, 0.95, 0.356, { alpha: 0 }); label.mesh.visible = false; ctx.scene.add(label.mesh);
    const sparks = kit.points(Array.from({ length: lite ? 6 : 12 }, () => [0, 0, 0, 0.07, 0.8, rnd(), 0]), { shape: 3, twinkle: 0.9, tint: [0.95, 0.96, 1] }); host.add(sparks.obj);
    return { host, L, Lr, label, sparks, p, a: 0, n };
  });
  const scatterAt = new Float32Array(3); // the time each note was last scattered back (its glide home)

  // ───────────────────────────── the ear cup's glitter (the only glitter of this cover), the walker's breath of notes, rings, the finale ─────────────────────────────
  const earP = Pm(EX_EAR[0], EX_EAR[1]), ear = grp(walker, earP[0], earP[1], earP[2] + 0.06);
  const glitter = kit.points(Array.from({ length: lite ? 16 : 34 }, () => { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 27 * mp(V.Z0); return [Math.cos(a) * r, Math.sin(a) * r, 0.03, 0.035 + rnd() * 0.05, 0.6 + rnd() * 0.4, rnd(), 0]; }), { shape: 3, twinkle: 0.95, tint: [0.96, 0.97, 1.05] });
  ear.add(glitter.obj);
  const earRings = Array.from({ length: 3 }, (_, i) => { const R = kit.ribbons(120 + i); ring(R, 0.34 * mp(V.Z0) * 100, WC[1], 1); const L = lines(R, { glow: true }); ear.add(L.obj); return L; });
  const singN = kit.points(Array.from({ length: lite ? 8 : 16 }, (_, i) => [0, 0, 0.02, 0.09, 0.9, i * 0.37 % 1, 0]), { shape: 3, twinkle: 0.7, tint: [0.96, 0.97, 1] }); ear.add(singN.obj);
  const feet = P(900, 985, V.Z0), floorRipple = (() => { const rs = Array.from({ length: 3 }, (_, i) => { const R = kit.ribbons(130 + i); R.poly(ell(0, 0, 1, 1, 30), WC[1], 1, true); const host = grp(root, 0, 0.03, 0), L = lines(R, { glow: true }); L.obj.rotation.x = -Math.PI / 2; host.add(L.obj); host.visible = false; return { host, L }; }); return rs; })();
  const dashAhead = (() => { // the strand ahead of him, as dashes, for when it dissolves
    const R = kit.ribbons(140), x0 = P(566, 0, V.ZB)[0], x1 = endX, ph = (x) => ((x - x0) / per) * TAU;
    for (const sgn of [1, -1]) for (let x = x0; x < x1; x += lite ? 0.3 : 0.2) R.seg([x, strandY + sgn * ampB * Math.sin(ph(x)), 0], [x + (lite ? 0.15 : 0.1), strandY + sgn * ampB * Math.sin(ph(x + 0.1)), 0], WC[0], 0.8);
    for (let x = x0 + 0.2; x < x1; x += per / 4) R.seg([x, strandY - ampB * 0.5, 0], [x, strandY - ampB * 0.2, 0], WC[0], 0.6);
    const host = grp(root, 0, 0, V.Z0 - V.ZB), L = lines(R, { glow: true }); host.add(L.obj);
    return { host, L };
  })();
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(60, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 3); }), 0.3, 0.115, { alpha: 0.5 });
  { const g = ground(1086), p = [((1038 - V.cx) * g) / f, 0.08, V.Z0 - g]; sig.mesh.position.set(p[0], p[1], p[2]); sig.mesh.rotation.x = -1.1; root.add(sig.mesh); }
  const dust = (() => { const rows = []; for (let i = 0; i < (lite ? 12 : 30); i++) { const px = 60 + rnd() * 1000, py = 360 + rnd() * 420, p = P(px, py, V.ZB - 0.2 - rnd() * 1.2); rows.push([p[0], p[1], p[2], 0.04 + rnd() * 0.05, 0.25 + rnd() * 0.3, rnd(), 0]); } return kit.points(rows, { mode: 1, rise: [0.04, 0.22, 0], speed: 0.05, spread: 0.2, twinkle: 0.5, tint: [0.88, 0.9, 1] }); })();
  root.add(dust.obj);
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const nearRung = {};
  EX_RUNGS.forEach((r, k) => { if (r.near) { const p = P(r.near[0], r.near[1], V.ZB - 0.1); nearRung[k] = W3(p); } });
  const rungW = (k) => { const r = EX_RUNGS[k]; return r.near ? nearRung[k] : W3([farPos[k][0], farPos[k][1], farPos[k][2] + 0.1]); };
  const rungAt = EX_RUNGS.map((_, k) => rungW(k));
  const earW = W3([earP[0], earP[1], earP[2] + 0.1]), bodyW = W3(P(505, 580, V.Z0 - 0.3)), mouthW = W3(Pm(EX_MOUTH[0], EX_MOUTH[1]));
  ctx.anchors['rm-auriculares'] = { pos: earW, w: Math.max(0.55, 80 * mp(V.Z0)), h: Math.max(0.55, 80 * mp(V.Z0)) };
  ctx.anchors['rm-mono'] = { pos: bodyW, w: Math.max(0.9, 130 * mp(V.Z0)), h: Math.max(1.1, 170 * mp(V.Z0)) };
  EX_RUNGS.forEach((r, k) => { if (r.near) ctx.anchors['rm-peldano-' + k] = { pos: rungAt[k], w: Math.max(0.55, 70 * mpb), h: Math.max(0.7, 100 * mpb) }; });
  const NEAR_R = 4.2, NEAR_N = 3.6;
  const noteW = EX_NOTES.map((n) => V3(n.x, n.y, n.z));
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // the walker is solid: a row of posts along his body (the visitor walks around him, not through him)
  const solids = []; for (let px = 390; px <= 940; px += 70) solids.push({ kind: 'circle', x: -P(px, 700, V.Z0)[0], z: EX_SET.z, r: Math.max(0.3, 40 * mp(V.Z0)) });

  // ───────────────────────────── camera poses ─────────────────────────────
  const LOOK = {
    cantar: { t: () => [earP[0], earP[1], earP[2]], w: 1.5, h: 1.5, up: 0 },
    camino: { t: () => P(505, 590, V.Z0), w: 3.0, h: 3.4, up: 0 },
    ...Object.fromEntries(EX_RUNGS.map((r, k) => ['peldano-' + k, { t: () => (r.near ? P(r.near[0], r.near[1], V.ZB - 0.1) : [farPos[k][0], farPos[k][1], farPos[k][2]]), w: r.near ? 3.4 : 1.5, h: r.near ? 2.4 : 1.4, up: 0.05 }])),
  };
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld();
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    const L = LOOK[view]; if (!L) return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const d = fit(L.w, L.h, fw, fh, fov, a), t = L.t();
    return aim([t[0], t[1] + L.up + 0.1, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const D = { rung: EX_RUNGS.map(() => 0), shake: EX_RUNGS.map(() => 0), fray: 0, note: [0, 0, 0], near: [0, 0, 0], sung: 0, scatter: 0, done: 0, step: 0, strand: 0, song: 0, look: 0 };
  const dTop = P(0, 665, V.ZB - 0.4)[1], dFloor = 0.04 + dropM.h * 0.5, dHome = dropM.home[1];
  const st = { T: 0, init: false, tick: 0, drop: 0.2 + 0.55 * Math.sqrt(clamp((dTop - dHome) / (dTop - dFloor), 0.01, 1)), ripple: 0 };
  const tmpV = V3(), tmpQ = V3();
  const faceCam = (host, wx, wz) => { host.rotation.y = Math.atan2(-(ctx.camera.position.x - wx), -(ctx.camera.position.z - wz)); };
  const noteNear = [0, 0, 0], rungNear = EX_RUNGS.map(() => 0);
  const camXZ = () => ctx.camera.position;
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.rung), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3, cam = ctx.camera;
    const cp = world.cam;
    if (ok) {
      if (!st.init) { D.rung = v.rung.slice(); D.note = v.note.slice(); D.sung = v.sung; D.done = v.done; D.step = v.step; D.strand = v.strand; st.init = true; }
      for (let k = 0; k < 6; k++) { D.rung[k] = damp(D.rung[k], v.rung[k], rate * 0.9, dt); D.shake[k] = damp(D.shake[k], v.shake[k], rate * 1.4, dt); }
      for (let k = 0; k < 3; k++) D.note[k] = damp(D.note[k], v.note[k], rate * 0.8, dt);
      D.fray = damp(D.fray, v.fray, rate * 1.2, dt); D.sung = damp(D.sung, v.sung, rate * 0.9, dt); D.scatter = damp(D.scatter, v.scatter, rate * 1.1, dt);
      D.done = damp(D.done, v.done, rate * 0.45, dt); D.step = damp(D.step, v.done, rate * 0.7, dt); D.strand = damp(D.strand, v.strand, rate * 0.6, dt); D.song = damp(D.song, v.song, rate * 0.9, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T, solved = D.done;
    // the whole drawing breathes a little
    const br = 0.94 + 0.06 * Math.sin(T * 0.8) * m;
    groundL.u.uAlpha.value = br; body.u.uAlpha.value = br * (1 + 0.06 * D.strand);
    backL.u.uAlpha.value = (br + 0.1 * D.strand) * (1 - 0.15 * D.fray); backR.u.uAlpha.value = (br + 0.1 * D.strand) * (1 - 0.8 * solved) * (1 - 0.15 * D.fray);
    // the strand undulates (like turning), more when it frays; the walker sways as he walks, his feet planted
    if (m && (!lite || (st.tick++ & 1) === 0)) {
      for (const B of [backL, backR]) { // the helix band (cover rows 540..680) ripples; the rest is still
        const arr = B.attr.array, A = 0.018 + 0.05 * D.fray;
        for (let j = 0; j <= B.ny; j++) { const py = B.r[1] + ((B.r[3] - B.r[1]) * j) / B.ny, w = smooth(520, 580, py) * (1 - smooth(650, 700, py)); if (w < 0.01) continue; for (let i = 0; i <= B.nx; i++) { const k = (j * (B.nx + 1) + i) * 3; arr[k + 1] = B.base[k + 1] + Math.sin(T * 1.2 + B.base[k] * 2.3) * A * w; arr[k] = B.base[k] + Math.cos(T * 0.9 + B.base[k] * 1.7) * A * 0.4 * w; } }
        B.attr.needsUpdate = true;
      }
      const arr = body.attr.array, sx = Math.sin(T * 2.2) * 0.03, sz = Math.sin(T * 1.1) * 0.05;
      for (let j = 0; j <= body.ny; j++) { const py = body.r[1] + ((body.r[3] - body.r[1]) * j) / body.ny, w = smooth(1000, 470, py); for (let i = 0; i <= body.nx; i++) { const k = (j * (body.nx + 1) + i) * 3; arr[k] = body.base[k] + sx * w; arr[k + 1] = body.base[k + 1] + Math.sin(T * 4.4) * 0.012 * w; arr[k + 2] = body.base[k + 2] + sz * w * 0.4; } }
      body.attr.needsUpdate = true;
    }
    walker.position.set(0.38 * D.step, 0.04 * Math.sin(D.step * Math.PI), 0);
    // movers: the notes from his mouth drift away and come back, the squiggles bob, the rungs, the drop
    mouthN.host.position.set(mouthN.home[0] + 0.14 * Math.sin(T * 0.9) * m + 0.38 * D.step + 0.2 * D.song * Math.sin(T * 2) * m, mouthN.home[1] + 0.05 * Math.sin(T * 1.7) * m + 0.04 * D.song, mouthN.home[2]);
    mouthN.a.u.uAlpha.value = 0.82 + 0.18 * Math.sin(T * 1.3) * m + 0.35 * D.song;
    for (const [fl, ph] of [[floatL, 0], [floatR, 2.1]]) { fl.host.position.set(fl.home[0] + 0.05 * Math.sin(T * 0.6 + ph) * m, fl.home[1] + 0.09 * Math.sin(T * 0.8 + ph) * m, fl.home[2]); fl.host.rotation.z = 0.04 * Math.sin(T * 0.7 + ph) * m; fl.a.u.uAlpha.value = 0.8 + 0.2 * Math.sin(T * 1.9 + ph) * m; }
    // the drop: it forms on the helix, falls and lands in the floor (a ring); in the finale it falls once more, whole, and the floor takes it
    if (m || solved > 0.02) st.drop = (st.drop + dt * (solved > 0.02 ? 0.22 : 0.14)) % 1;
    {
      const p = st.drop, live = m || solved > 0.02;
      let y = dHome, a = 1, s = 1;
      if (live) { if (p < 0.2) { y = dTop; s = 0.4 + 0.6 * (p / 0.2); a = s; } else if (p < 0.75) { const q = (p - 0.2) / 0.55; y = dTop + (dFloor - dTop) * q * q; } else { y = dFloor; a = 0; } }
      dropM.host.position.set(dropM.home[0], y, dropM.home[2]); dropM.host.scale.setScalar(s); dropM.a.u.uAlpha.value = a;
      st.ripple = live && p >= 0.75 ? (p - 0.75) / 0.25 : -1;
      floorRipple.forEach((r, i) => { const q = st.ripple < 0 ? -1 : st.ripple - i * 0.18; r.host.visible = q > 0 && q < 1; if (r.host.visible) { const sc = 0.12 + 0.9 * q; r.host.scale.set(sc, sc, sc); r.L.set((1 - q) * (0.5 + 0.5 * solved)); r.host.position.set(dropM.home[0], 0.04, dropM.home[2] + 0.1); } });
    }
    // the near rungs: solid while open or kept, dashes once a pain is let go; a ring pulses where one waits; a wrong choice shakes it
    EX_RUNGS.forEach((r, k) => {
      const done = D.rung[k], pain = r.pain, sh = D.shake[k] * Math.sin(T * 38) * 0.03 * m;
      if (r.near) {
        const M = rungM[k], dash = pain ? done : 0;
        M.a.u.uAlpha.value = (1 - dash) * (0.9 + 0.1 * Math.sin(T * 2 + k) * m); M.b.u.uAlpha.value = dash * 0.9; M.host.position.set(M.home[0] + sh, M.home[1], M.home[2]);
      } else {
        const F = farK[k], vis = Math.min(1, Math.max(0, (6.2 - rungNear[k]) / 2.2)); // the far end of the strand shows up as the visitor comes near
        const dash = pain ? done : 0;
        F.Ls.set((1 - dash) * (0.25 + 0.75 * vis)); F.Ld.set(dash * 0.9 * (0.3 + 0.7 * vis)); F.host.position.set(F.pos[0] + sh, F.pos[1], F.pos[2]);
        F.Lr.set(vis * (1 - done) * (0.35 + 0.35 * Math.sin(T * 2.4 + k) * m)); F.Lr.obj.scale.setScalar(1 + 0.12 * Math.sin(T * 2.4 + k) * m);
      }
    });
    ext.L.set(0.45 + 0.4 * D.strand * 0.5);
    // the strand ahead of him dissolves into dashes in the finale
    dashAhead.L.set(solved * (0.7 + 0.2 * Math.sin(T * 1.5) * m)); dashAhead.host.visible = solved > 0.02;
    // the notes: hummers drift; the carriers show near and are collected
    hummers.forEach((hm, i) => { hm.host.position.set(hm.p[0] + 0.25 * Math.sin(T * 0.4 + hm.ph) * m, hm.p[1] + 0.18 * Math.sin(T * 0.7 + hm.ph * 1.3) * m, hm.p[2] + 0.2 * Math.cos(T * 0.35 + hm.ph) * m); faceCam(hm.host, hm.wx, hm.wz); hm.L.set((0.38 + 0.15 * Math.sin(T * 1.6 + hm.ph) * m) * (1 - 0.5 * solved)); });
    carriers.forEach((c, i) => {
      const n = c.n, d = dist2(cp, noteW[i]); noteNear[i] = d;
      const collected = D.note[i], vis = (1 - collected) * Math.min(1, Math.max(0, (NEAR_N + 1.2 - d) / 1.4));
      c.a = damp(c.a, vis, 6, dt);
      const sc = 1 + 0.06 * Math.sin(T * 3 + i) * m, ph = T + i * 2;
      c.host.position.set(c.p[0] + 0.12 * Math.sin(ph * 0.8) * m, c.p[1] + 0.12 * Math.sin(ph * 1.1) * m, c.p[2]); c.host.scale.setScalar(sc);
      faceCam(c.host, n.x, n.z);
      c.L.set(0.18 * (1 - collected) + c.a * 0.9); c.Lr.set(c.a * (0.5 + 0.3 * Math.sin(T * 3 + i) * m));
      c.host.visible = collected < 0.98;
      const q = c.sparks.pos, qd = c.sparks.dat; for (let k = 0; k < q.length / 3; k++) { const a = ph * 0.9 + (k / (q.length / 3)) * TAU; q[k * 3] = Math.cos(a) * 0.45; q[k * 3 + 1] = 0.15 + Math.sin(a * 1.3) * 0.3; q[k * 3 + 2] = 0.05; qd[k * 4 + 1] = 0.5 + 0.5 * Math.sin(ph * 2 + k); }
      c.sparks.geo.attributes.position.needsUpdate = true; c.sparks.geo.attributes.aData.needsUpdate = true; c.sparks.set(c.a);
      c.label.mesh.visible = c.a > 0.05;
      if (c.label.mesh.visible) { c.label.mesh.position.set(n.x, n.y + 0.62, n.z); c.label.mesh.quaternion.copy(cam.quaternion); c.label.set(c.a * 0.95); }
      // the note shows its hotspot only near
      if (collected < 0.5 && d < NEAR_N) ctx.anchors['rm-nota-' + i] = { pos: V3(n.x, n.y + 0.05, n.z), w: 1.1, h: 1.3 }; else delete ctx.anchors['rm-nota-' + i];
    });
    // where the far rungs are: a hotspot only near
    EX_RUNGS.forEach((r, k) => { if (!r.far) return; const d = dist2(cp, rungAt[k]); rungNear[k] = d; if (D.rung[k] < 0.5 && d < NEAR_R) ctx.anchors['rm-peldano-' + k] = { pos: rungAt[k], w: 0.8, h: 1.0 }; else delete ctx.anchors['rm-peldano-' + k]; });
    // the ear cup: glitter always; rings and notes when the words are sung
    glitter.set(0.8 + 0.2 * Math.sin(T * 2.6) * m); ear.rotation.z = 0;
    earRings.forEach((L, i) => { const ph = (T * 0.5 + i / 3) % 1, on = D.song > 0.05 || D.sung > 0.05 || D.note[0] + D.note[1] + D.note[2] > 2.5; L.obj.scale.setScalar(0.5 + ph * 1.6); L.set((on ? 0.8 : 0) * (1 - ph) * Math.max(D.song, 0.4 * (D.note[0] + D.note[1] + D.note[2]) / 3)); L.obj.visible = on; });
    { const q = singN.pos, qd = singN.dat; for (let k = 0; k < q.length / 3; k++) { const p = (T * 0.35 + k / (q.length / 3)) % 1; q[k * 3] = 0.1 + p * 1.2; q[k * 3 + 1] = 0.1 * Math.sin(p * 9 + k) + p * 0.35; q[k * 3 + 2] = 0.04; qd[k * 4 + 1] = Math.sin(p * Math.PI) * D.song; } singN.geo.attributes.position.needsUpdate = true; singN.geo.attributes.aData.needsUpdate = true; singN.set(1); }
    dust.set(0.7); sig.set(0.5);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      cam.updateMatrixWorld();
      const tmpF = V3(0, 0, -1).applyQuaternion(cam.quaternion), tmpU = V3(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(tmpQ.set(earP[0], earP[1], earP[2] + 0.3)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  const noteLabels = carriers.map((c) => c.label.mesh);
  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh, ...noteLabels],
    info: () => ({
      segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, rungs: EX_RUNGS.length, notes: EX_NOTES.length, hummers: hummers.length, wide, f,
      texture: [groundL, backL, backR, body].map((g) => g.mesh.material.uniforms.uTex.value.image.width + 'x' + g.mesh.material.uniforms.uTex.value.image.height).join(' '),
      noteDist: noteNear.map((x) => +x.toFixed(2)), rungDist: rungNear.map((x) => +x.toFixed(2)), note: D.note.map((x) => +x.toFixed(2)), noteSeen: carriers.map((c) => +c.a.toFixed(2)), done: +D.done.toFixed(2),
      rungAt: rungAt.map((p) => ({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) })), noteAt: EX_NOTES.map((n) => ({ x: n.x, y: n.y, z: n.z })),
      ear: { x: earW.x, y: earW.y, z: earW.z }, mouth: { x: mouthW.x, y: mouthW.y, z: mouthW.z },
    }),
  };
};
