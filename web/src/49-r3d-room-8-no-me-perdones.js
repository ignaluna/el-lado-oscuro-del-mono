// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 8 · «NO ME PERDONES»  (the cover, as a void with water: white chalk on black)
//   The drawing is almost all black: concentric ripples on dark water, a small shape sinking in the middle, two splashes beside it, a
//   zigzag reflection that runs toward the viewer with one drop below, a tiny star above and "11:11". The strokes are the photo's own
//   (traced once, see 49-r3d-room-8-no-me-perdones-water.js). The cover is drawn in perspective, so the set is laid out as what it shows:
//   the water is the floor, the visitor arrives at the eye that sees it (1.6 m high, 11.5 m from the centre) and every stroke stands
//   where it projects onto the cover's own pixels from there (the ripples and the reflection lie on the water; the splashes, the shape
//   and the star stand up at their own depth). From the arrival spot the room is the cover; walking in, the ripples open around you.
//   In the void: a star that moves away as you approach (it keeps its distance), three paper castles that only show when you are
//   near (unfolded, each one lies down as a stretch of road along the reflection, toward the centre), the glass at the centre that
//   trembles with the waves, and the ripples that grow (PERDONAME) or calm (NO ME PERDONES). world.room.v holds the targets (the controller,
//   59-room-8-…, sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), f the focal length in cover pixels, yh the cover row of the horizon, cx the column straight ahead, c the centre of the ripples. */
const NP_VIEW = { H: 1.6, f: 1038, yh: 701, cx: 437, c: [437, 845] };
/** How far (m) the centre of the ripples is from the arrival spot (the world's camera stands at z = 2.7 when a floor opens). */
const NP_ZC = (NP_VIEW.H * NP_VIEW.f) / (NP_VIEW.c[1] - NP_VIEW.yh);
/** Where the visitor stands when a floor opens (the world's camera): the star is NP_ZC metres ahead of it, above the centre. */
const NP_ARRIVE = 2.7;
const NP_SET = { x: 0, y: 0.2, z: NP_ARRIVE + NP_ZC };
/** The three paper castles, in the set's frame (x to the viewer's right, z toward the visitor, from the centre of the ripples) and how high they float. */
const NP_CASTLES = [{ x: -2.3, z: 4.4 }, { x: 3.3, z: 1.2 }, { x: -3.0, z: -2.6 }];
const NP_FLOAT = 1.35;
/** The places along the reflection where an unfolded castle lies (centre of each sheet), from the viewer's side toward the centre. */
const NP_SLOTS = [{ x: -0.1, z: 5.0 }, { x: -0.1, z: 3.6 }, { x: -0.1, z: 2.2 }];
/** The glass: where it hovers (x, z in the set's frame) and the wave clock (a wave breaks for 1.6 s and pulls back for 2.4 s). */
const NP_GLASS = { x: 0, z: 1.45 };
const NP_WAVE = { rompe: 1.6, retira: 2.4 };
/** Where the wave is at `now` (ms) for a count that began at t0: phase 'rompe' (breaking) or 'retira' (pulling back), and k how hard it is. */
function npWave(t0, now = performance.now()) {
  const T = NP_WAVE.rompe + NP_WAVE.retira, s = ((((now - t0) / 1000) % T) + T) % T;
  return s < NP_WAVE.rompe ? { phase: 'rompe', s, k: Math.min(1, 0.25 + s / 0.35) } : { phase: 'retira', s, k: Math.max(0.1, 1 - (s - NP_WAVE.rompe) / 0.9) };
}
/** The set's frame → the world (the set stands turned toward the arrival spot). */
function npWorld(x, z) { return { x: NP_SET.x - x, z: NP_SET.z - z }; }
/** The star above the centre (set's frame); it moves away from the visitor as fast as they come. */
const NP_STAR = { x: -0.1, y: 0.6 };

ROOM_SETS['no-me-perdones'] = function buildVoid(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, ZC = NP_ZC;
  // On a wide screen the view of the cover is a little closer in (a longer lens): the centre stays where it is, the drawing is bigger on screen. A phone's narrow view keeps the true proportions.
  const wide = ctx.W / Math.max(1, ctx.H) >= 1.1, V = wide ? { ...NP_VIEW, f: 880, yh: NP_VIEW.c[1] - (NP_VIEW.H * 880) / ZC } : NP_VIEW;
  const root = new THREE.Group();
  root.position.set(NP_SET.x, 0, NP_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const WC = lite ? [1.2, 1.9, 2.7] : [2.0, 3.0, 4.2]; // line widths (CSS px) by thickness class (the photo's chalk is bold: a fat line on a small drawing)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };
  const FY = 0.03; // the water

  // ---- the cover's pixels → the set (x right, y up, z toward the visitor, the centre of the ripples at the origin) ----
  const depth = (py) => (V.H * V.f) / Math.max(10, py - V.yh);
  const G = (px, py, h = FY) => { const Z = depth(py); return [((px - V.cx) * Z) / V.f, h, ZC - Z]; }; // lying on the water
  const U = (px, py, pyb) => { const Z = depth(pyb); return [((px - V.cx) * Z) / V.f, Math.max(0.004, ((pyb - py) * Z) / V.f) + FY, ZC - Z]; }; // standing at the water line pyb
  const Pm = (list, f) => list.map((q) => f(q[0], q[1]));
  const rnd = mulberry32(88);

  // ───────────────────────────── the traced strokes, by kind: ripples (in bands), splashes, the reflection, the sinking shape, hairlines ─────────────────────────────
  const strokes = npDecode();
  const NB = lite ? 4 : 6, edges = [0.2, 0.36, 0.52, 0.68, 0.85]; // the ripples are drawn in rings that breathe one after the other
  const bandOf = (st) => { const xs = st.pts.map((p) => p[0]), ys = st.pts.map((p) => p[1]), x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2, r = Math.hypot((x - V.c[0]) / 320, (y - V.c[1]) / 48); let b = 0; while (b < edges.length && r > edges[b]) b++; return Math.min(NB - 1, Math.floor((b * NB) / (edges.length + 1))); };
  const bandR = Array.from({ length: NB }, () => 0.5), bandN = Array(NB).fill(0);
  const bands = Array.from({ length: NB }, (_, i) => kit.ribbons(10 + i)), splashR = kit.ribbons(30), zigR = kit.ribbons(31), shapeR = kit.ribbons(32), faintR = kit.ribbons(33);
  let faintIdx = 0, thinIdx = 0, drawn = 0;
  const SPLASH_BASE = 822, SHAPE_BASE = 857;
  for (const st of strokes) {
    const w = WC[st.c];
    if (st.k === 3) { if (lite && faintIdx++ % 2) continue; faintR.poly(Pm(st.pts, G), WC[0] * 0.85, 0.55); drawn++; continue; }
    if (st.k === 0) { if (lite && st.c === 0 && thinIdx++ % 2) continue; const b = bandOf(st); bands[b].poly(Pm(st.pts, G), w, 1); bandN[b]++; drawn++; continue; } // (the lite tier draws half of the thinnest ripples)
    if (st.k === 1) splashR.poly(st.pts.map((q) => U(q[0], q[1], SPLASH_BASE)), w, 1);
    else if (st.k === 2) zigR.poly(Pm(st.pts, G), w, 1);
    else shapeR.poly(st.pts.map((q) => U(q[0], q[1], SHAPE_BASE)), w, 1);
    drawn++;
  }
  // the grey body of the sinking shape: chalk hatching inside the outline (a soft, cool grey, as the photo has it)
  const body = npPoly(NP_SHAPE), bodyR = kit.ribbons(34);
  { const ys = body.map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), step = lite ? 3.4 : 2.2;
    for (let y = y0 + step; y < y1 - 0.8; y += step) {
      const xs = []; for (let i = 0; i < body.length; i++) { const a = body[i], b = body[(i + 1) % body.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) bodyR.seg(U(xs[i] + 1.5, y, SHAPE_BASE), U(xs[i + 1] - 1.5, y, SHAPE_BASE), WC[1], 0.5);
    } }
  // the drop below the reflection: outline and a few hatch lines, lying on the water
  const drop = npPoly(NP_DROP), dropR = kit.ribbons(35);
  dropR.poly(Pm(drop, G), WC[1], 1, true);
  { const ys = drop.map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let y = y0 + 2; y < y1 - 1; y += 2) {
      const xs = []; for (let i = 0; i < drop.length; i++) { const a = drop[i], b = drop[(i + 1) % drop.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      if (xs.length >= 2) dropR.seg(G(Math.min(...xs) + 0.5, y), G(Math.max(...xs) - 0.5, y), WC[1] + 0.4, 1);
    } }
  const bandL = bands.map((b) => { const l = lines(b, { glow: true }); root.add(l.obj); return l; });
  const splashL = lines(splashR, { glow: true }), zigL = lines(zigR, { glow: true }), faintL = lines(faintR), dropL = lines(dropR, { glow: true });
  const shapeHost = grp(root), bodyL = lines(bodyR), shapeL = lines(shapeR, { glow: true });
  shapeHost.add(bodyL.obj); shapeHost.add(shapeL.obj);
  root.add(splashL.obj); root.add(zigL.obj); root.add(faintL.obj); root.add(dropL.obj);
  bands.forEach((b, i) => { bandR[i] = 0.1 + (i / NB) * 0.85; });

  // ───────────────────────────── the star: a cross with a diamond, standing in the dark; and a glint on the drop ─────────────────────────────
  const starHost = grp(root, NP_STAR.x, NP_STAR.y, 0);
  { const R = kit.ribbons(40), a = 0.15, b = 0.045;
    R.seg([0, -a, 0], [0, a, 0], WC[0], 1); R.seg([-a, 0, 0], [a, 0, 0], WC[0], 1);
    R.poly([[0, b, 0], [b, 0, 0], [0, -b, 0], [-b, 0, 0]], WC[0], 0.9, true);
    starHost.userData.l = lines(R, { glow: true }); starHost.add(starHost.userData.l.obj); }
  const starGlow = kit.points([[0, 0, 0.02, 0.36, 0.9, 0.3, 0]], { shape: 3, twinkle: 0.9, tint: [0.95, 0.96, 1] }); starHost.add(starGlow.obj);
  const dropC = G(412, 962, 0.04), dropGlint = kit.points([[dropC[0], dropC[1], dropC[2], 0.2, 0.8, 0.4, 0]], { shape: 3, twinkle: 0.8, tint: [0.95, 0.96, 1] }); root.add(dropGlint.obj);

  // ───────────────────────────── a faint dust of the void ─────────────────────────────
  const motes = []; for (let i = 0; i < (lite ? 12 : 28); i++) motes.push([(rnd() - 0.5) * 17, 0.3 + rnd() * 3.4, -7 + rnd() * 15, 0.05 + rnd() * 0.05, 0.22 + rnd() * 0.2, rnd(), 0]);
  const dust = kit.points(motes, { shape: 0, twinkle: 0.6, tint: [0.85, 0.88, 0.96] }); root.add(dust.obj);

  // ───────────────────────────── 11:11, lying on the water where the paper's corner is ─────────────────────────────
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(64, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 4); }), 0.5, 0.19, { alpha: 0.75 });
  sig.mesh.position.set(...G(783, 1158, 0.02)); sig.mesh.rotation.x = -Math.PI / 2; root.add(sig.mesh);

  // ───────────────────────────── the paper castles (they float; unfolded they lie flat as a stretch of road) ─────────────────────────────
  const castleArt = (R, w) => {
    const tower = (s) => [[s * 0.52, 0], [s * 0.52, 1.0], [s * 0.42, 1.0], [s * 0.42, 0.9], [s * 0.34, 0.9], [s * 0.34, 1.0], [s * 0.26, 1.0], [s * 0.26, 0.9], [s * 0.2, 0.9], [s * 0.2, 0.0]];
    const P3 = (q) => [q[0], q[1], 0];
    R.poly(tower(-1).map(P3), w, 1); R.poly(tower(1).map(P3), w, 1); R.seg([-0.52, 0, 0], [0.52, 0, 0], w, 1);
    R.poly([[-0.2, 0.62, 0], [-0.2, 0.8, 0], [0, 1.18, 0], [0.2, 0.8, 0], [0.2, 0.62, 0]], w, 1);
    R.poly([[-0.07, 0, 0], [-0.07, 0.2, 0], [0, 0.28, 0], [0.07, 0.2, 0], [0.07, 0]].map((q) => [q[0], q[1], 0]), w * 0.9, 1);
    R.seg([-0.38, 0.52, 0], [-0.38, 0.7, 0], w * 0.8, 0.9); R.seg([0.38, 0.52, 0], [0.38, 0.7, 0], w * 0.8, 0.9);
    R.seg([0, 1.18, 0], [0, 1.34, 0], w * 0.8, 1); R.poly([[0, 1.34, 0], [0.16, 1.29, 0], [0, 1.24, 0]], w * 0.8, 1);
    // the creases of the folded paper
    R.seg([-0.52, 0.3, 0], [-0.2, 0.46, 0], w * 0.7, 0.65); R.seg([0.2, 0.46, 0], [0.52, 0.3, 0], w * 0.7, 0.65); R.seg([-0.2, 0.34, 0], [0.2, 0.5, 0], w * 0.7, 0.65); R.seg([-0.52, 0.72, 0], [-0.2, 0.62, 0], w * 0.7, 0.55); R.seg([0.2, 0.62, 0], [0.52, 0.72, 0], w * 0.7, 0.55);
  };
  const castle = NP_CASTLES.map((c, k) => {
    const R = kit.ribbons(50 + k); castleArt(R, WC[1]);
    const host = grp(root, c.x, NP_FLOAT, c.z), L = lines(R, { glow: true }); host.add(L.obj);
    const sh = kit.ribbons(60 + k); // the sheet the castle becomes: a rectangle of paper with its fold lines
    sh.poly([[-0.62, 0, -0.62], [0.62, 0, -0.62], [0.62, 0, 0.1], [-0.62, 0, 0.1]], WC[1], 1, true); sh.seg([-0.62, 0, -0.26], [0.62, 0, -0.26], WC[0], 0.55); sh.seg([-0.62, 0, -0.26], [0.62, 0, 0.1], WC[0], 0.4); sh.seg([0, 0, -0.62], [0, 0, 0.1], WC[0], 0.45);
    const sheetL = lines(sh, { glow: true }), sheetHost = grp(root, 0, 0.045, 0); sheetHost.add(sheetL.obj); sheetHost.visible = false;
    return { host, L, sheetL, sheetHost, x: c.x, z: c.z };
  });

  // ───────────────────────────── the glass that trembles (hovering over the sinking shape; set down on the water when the wave retires) ─────────────────────────────
  const glass = grp(root, NP_GLASS.x, 0, NP_GLASS.z);
  { const R = kit.ribbons(70), w = WC[1];
    R.poly([[-0.12, 0, 0], [-0.16, 0.42, 0], [0.16, 0.42, 0], [0.12, 0, 0]].map((q) => [q[0], q[1], 0]), w, 1);
    R.seg([-0.125, 0.015, 0], [0.125, 0.015, 0], w, 1);
    const wl = []; for (let i = 0; i <= 8; i++) wl.push([-0.14 + (i / 8) * 0.28, 0.28 + 0.012 * Math.sin(i * 1.7), 0]); R.poly(wl, WC[0], 0.9);
    R.seg([-0.09, 0.08, 0.01], [-0.1, 0.34, 0.01], WC[0], 0.5);
    glass.userData.l = lines(R, { glow: true }); glass.add(glass.userData.l.obj); glass.visible = false; }
  const glassGlint = kit.points([[0, 0.3, 0.02, 0.26, 0.8, 0.2, 0]], { shape: 3, twinkle: 0.9, tint: [0.9, 0.95, 1] }); glass.add(glassGlint.obj);

  // ───────────────────────────── the page that flies to the book ─────────────────────────────
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  ctx.anchors['rm-vaso'] = { pos: W3([NP_GLASS.x, 0.32, NP_GLASS.z]), w: 1.0, h: 0.95 };
  const starAnchor = { pos: W3([NP_STAR.x, NP_STAR.y, 0]), w: 0.9, h: 0.9 }; ctx.anchors['rm-estrella'] = starAnchor;
  const castleAt = castle.map((c) => W3([c.x, NP_FLOAT + 0.45, c.z]));
  const gw = npWorld(0, (NP_GLASS.z + 0.45) / 2 + 0.2);
  const solids = [{ kind: 'circle', x: gw.x, z: gw.z, r: 0.7 }];
  const wc = npWorld(0, 0);

  // ───────────────────────────── camera poses: in front of the glass ─────────────────────────────
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld();
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    if (view !== 'vaso') return null;
    const f = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (f.x0 + f.x1) / 2, sy = (f.y0 + f.y1) / 2, fw = (f.x1 - f.x0) * 0.9, fh = (f.y1 - f.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const d = fit(1.5, 1.25, fw, fh, fov, a), tgt = [NP_GLASS.x, 0.34, NP_GLASS.z];
    return aim([tgt[0], tgt[1] + 0.5, tgt[2] + d * 0.97], tgt, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const D = { open: [0, 0, 0], glass: 0, down: 0, wave: 0, grow: 0, calm: 0, far: 0, rec: 0 };
  const st = { T: 0, init: false, slot: [-1, -1, -1], ripT: 1.5, near: [0, 0, 0], castleHot: [false, false, false] };
  const tmpL = V3(), tmpF = V3(), tmpU = V3(), tmpV = V3();
  const set3 = (v, a) => { v.x = a[0]; v.y = a[1]; v.z = a[2]; };
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.open), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3;
    if (ok) {
      if (!st.init) { D.open = v.open.slice(); D.glass = v.glass; D.down = v.down; D.wave = v.wave; D.grow = v.grow || 0; D.calm = v.calm; D.far = v.far; D.rec = v.steps * 1.0; st.init = true; }
      for (let k = 0; k < 3; k++) { D.open[k] = damp(D.open[k], v.open[k], rate * 0.55, dt); if (v.slot[k] >= 0) st.slot[k] = v.slot[k]; }
      D.glass = damp(D.glass, v.glass, rate * 0.8, dt); D.down = damp(D.down, v.down, rate * 0.9, dt); D.wave = damp(D.wave, v.wave, rate, dt);
      D.grow = damp(D.grow, v.grow || 0, rate * 0.9, dt); D.calm = damp(D.calm, v.calm, rate * 0.45, dt); D.far = damp(D.far, v.far, rate * 0.6, dt); D.rec = damp(D.rec, Math.min(2, v.steps) * 1.0, rate * 0.7, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T, calm = D.calm, W = ok && D.wave > 0.01 ? npWave(v.t0 || 0) : { phase: 'retira', s: 4, k: 0 }, wk = W.k * D.wave * m;
    // the ripples: each ring breathes a little after the one inside it; a wave breaks them outward, PERDONAME makes them grow, the calm holds them still
    for (let i = 0; i < NB; i++) {
      const r = bandR[i], s = 1 + (0.013 * Math.sin(T * 1.25 - r * 5.5) * (1 - calm) + 0.05 * wk * (0.6 + r * 0.6) + D.grow * (0.07 + 0.06 * Math.sin(T * 3.4 - r * 4) * m + r * 0.1)) * 1;
      bandL[i].obj.scale.set(s, 1, s);
      bandL[i].set((0.8 + 0.12 * Math.sin(T * 1.7 + i * 1.1) * m * (1 - calm * 0.7) + 0.1 * D.grow) * (1 - 0.1 * calm));
    }
    faintL.set(0.6 + 0.1 * Math.sin(T * 0.9) * m);
    // the splashes sway and drop in the calm; the zigzag reflection shimmers and straightens
    splashL.obj.scale.y = (1 - 0.62 * calm) * (1 + 0.06 * Math.sin(T * 1.1) * m + 0.12 * wk + 0.25 * D.grow); splashL.set(0.92 - 0.2 * calm);
    zigL.obj.scale.x = 1 - 0.93 * calm; zigL.set(0.88 + 0.1 * Math.sin(T * 2.1) * m * (1 - calm) + 0.1 * calm);
    dropL.set(0.9 + 0.1 * Math.sin(T * 1.6) * m); dropGlint.set(0.6 + 0.4 * Math.sin(T * 2.3) * m * (1 - calm * 0.5));
    // the sinking shape: it bobs, a little more with the wave
    shapeHost.position.y = (0.012 * Math.sin(T * 0.8) - 0.02 * wk) * m; shapeHost.rotation.z = (0.018 * Math.sin(T * 0.7) + 0.02 * wk) * m;
    shapeL.set(0.95); bodyL.set(0.55 + 0.1 * Math.sin(T * 1.3) * m);
    // the star keeps its distance: it moves away as fast as the visitor comes, and fades to a faint far light once approached enough
    const cam = ctx.camera, rec = D.rec + 8 * D.far, ahead = Math.max(cam.position.z, NP_ARRIVE); // the star is always the same way ahead of the visitor, and each step toward it moves it a metre further
    starHost.position.set(NP_STAR.x, NP_STAR.y + 0.5 * D.far, NP_ARRIVE + 0 - ahead - rec); // (the set's frame: toward the star is away from the visitor, so smaller z)
    starHost.userData.l.set((0.95 - 0.55 * D.far) * (0.85 + 0.15 * Math.sin(T * 3) * m)); starGlow.set(0.8 - 0.4 * D.far);
    root.updateMatrixWorld(); starHost.getWorldPosition(starAnchor.pos); starAnchor.h = starAnchor.w = 0.9 + 0.5 * D.far;
    // the castles: they show only when the visitor is near; unfolded, they lie down along the reflection
    tmpL.copy(cam.position); root.worldToLocal(tmpL);
    for (let k = 0; k < 3; k++) {
      const c = castle[k], u = D.open[k], dist = Math.hypot(tmpL.x - c.x, tmpL.z - c.z), near = 1 - smooth(3.0, 5.0, dist), a = Math.max(near, u);
      const slot = NP_SLOTS[Math.max(0, st.slot[k])], e = smooth(0, 1, u);
      c.host.position.set(lerp(c.x, slot.x, e), lerp(NP_FLOAT + 0.07 * Math.sin(T * 0.9 + k * 2) * m, 0.05, e), lerp(c.z, slot.z + 0.6, e));
      c.host.rotation.set(-e * Math.PI * 0.5, (1 - e) * 0.22 * Math.sin(T * 0.5 + k) * m, 0);
      c.L.set(a * (0.95 - 0.4 * e)); c.host.visible = a > 0.02; // (lying down, the castle's outline recedes behind the sheet)
      c.sheetHost.position.set(slot.x, 0.045, slot.z); c.sheetHost.visible = u > 0.5; c.sheetL.set(smooth(0.5, 1, u) * 0.85 * (1 - 0.2 * calm));
      st.near[k] = near;
      const on = v.castles === 1 && u < 0.02 && near > 0.3;
      if (on) { c.host.getWorldPosition(castleAt[k]); castleAt[k].y += 0.45; ctx.anchors['rm-castillo-' + k] = { pos: castleAt[k], w: 1.3, h: 1.6 }; } else delete ctx.anchors['rm-castillo-' + k];
    }
    // the glass: it hovers and trembles with the waves; set down, it rests on the water and the tremor stops
    glass.visible = D.glass > 0.02;
    if (glass.visible) {
      const tr = (1 - D.down) * (0.35 + 0.65 * wk), sh = Math.sin(T * 31) * 0.012 * tr, hover = lerp(0.55, 0.0, smooth(0, 1, D.down));
      glass.position.set(NP_GLASS.x + sh, hover + 0.012 * Math.sin(T * 0.9) * m * (1 - D.down) + 0.03 * wk * (1 - D.down), NP_GLASS.z);
      glass.rotation.z = Math.sin(T * 23) * 0.07 * tr; glass.userData.l.set(D.glass * 0.95); glassGlint.set(D.glass * (0.55 + 0.45 * Math.sin(T * 2.6) * m));
    }
    // real ripples in the world's own water: they leave the centre now and then (a wave breaking), faster when they grow, never when calm
    st.ripT -= dt * m;
    if (st.ripT <= 0) { if (calm < 0.5) ctx.ripple(wc.x, wc.z, 0.28 + 0.4 * wk + 0.35 * D.grow); st.ripT = D.grow > 0.4 ? 0.7 : 2.6 + rnd() * 1.2; }
    dust.set(0.8); sig.set(0.7);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(NP_GLASS.x, 0.4, NP_GLASS.z)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh],
    info: () => ({ segments: segTotal, lite, strokes: drawn, bands: NB, castles: NP_CASTLES.map((c) => npWorld(c.x, c.z)), center: wc, near: st.near.map((x) => +x.toFixed(2)), glass: glass.visible, star: starAnchor.pos.z - NP_ARRIVE }),
  };
};
