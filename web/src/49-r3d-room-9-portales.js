// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 9 · «PORTALES»  (the cover, as a great tree around a vortex: chalk tones on black, a gold and a silver sparkle)
//   The drawing is a great tree whose two trunks arch around a spiral vortex, a canopy of curling clouds with a treehouse (a round
//   window) and a ladder that rises to a spiral and two small stars, a spiral on each trunk and a curl at the far left, roots carved
//   with mazes, a zigzag column on the right trunk, a gold sparkle (upper right of the vortex) and a silver one (left of it), "11:11",
//   and a small figure standing in a glow at the bottom. The cover is a perspective drawing, so the set is laid out as what it shows:
//   the visitor arrives at the eye that sees it (1.6 m high) and every point stands where it projects onto the cover's own pixels from
//   there. The tree is a relief (the canopy a dome, the vortex a recess in the trunks, the roots lying on the ground and reaching
//   toward the visitor), the figure and its glow a standing cut-out in front of it. From the arrival spot the room is the cover; walking
//   in, it opens up. Unlike the chalk-line rooms, this cover is made of masses (the clouds, the shaded trunks) and bold smooth bands, so
//   its tones are drawn as filled contours (49-r3d-room-9-portales-art.js: the photo's luminance cut at five levels, painted into a
//   texture) and the chalk is what moves and what is told: the spirals, the sparkles, the roots' glyphs, the portal.
//   world.room.v holds the targets (the controller, 59-room-9-…, sets them whole); every value is damped here, so nothing needs a
//   sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, GR the cover row where the trunks meet the ground, BOT the cover row of the ground 0.15 m under the eye's horizon line (the lens' own), Z0 how far (m) the trunks' plane is from the eye. */
const PT = { H: 1.6, cx: 450, GR: 958, BOT: 931, Z0: 6.6, ARR: 2.7 };
/** Where the visitor stands when a floor opens is the eye; the set is Z0 metres ahead of it. */
const PT_SET = { x: 0, z: PT.ARR + PT.Z0 };
/** The lens depends on the screen: a wide screen fills the height at 1050 cover px of focal length aimed at the vortex's row, a phone's narrow view keeps the tree whole at 1320. The set's z never changes. */
function ptLens(a) { return coverLens(PT, a, { f: 1050, row: 799, sx: 0.46, sy: 0.5 }, { f: 1320, row: 758, sx: 0.5, sy: 0.46 }); }
/** The four roots (cover pixels of where each one touches the ground), the things that can be left in them (the chapter's own) and the decoys. */
const PT_ROOTS = [[165, 1030], [235, 1108], [545, 1062], [702, 1085]];
const PT_THINGS = ['perro', 'guitarra', 'vecinos', 'risa'];
const PT_DECOYS = ['escenario', 'luces', 'publico'];
/** The three spirals: centre, the radii of the whorl on the cover and the way each turns to open the vortex (+1 clockwise, -1 counter-clockwise): silver, gold, silver. */
const PT_SPIRALS = [{ c: [302, 855], rx: 21, ry: 58, name: 'del tronco izquierdo' }, { c: [452, 797], rx: 46, ry: 46, name: 'del centro' }, { c: [598, 866], rx: 31, ry: 54, name: 'del tronco derecho' }];
const PT_DIRS = [-1, 1, -1];
/** The glow around the figure (cover pixels: centre and radii) and the row of the figure's feet. */
const PT_GLOW = { c: [410, 1060], r: [92, 90], feet: 1127 };

ROOM_SETS['portales'] = function buildPortales(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = PT;
  const { wide, f, yh } = ptLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(0, 0, PT_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(99);
  const WC = lite ? [1.3, 2.0, 2.8] : [1.8, 2.6, 3.6];
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };

  // ---- the cover's pixels → the set (x to the viewer's right, y up, z toward the visitor; the trunks' plane at z = 0) ----
  const ground = (py) => (V.H * f) / Math.max(8, py - yh); // depth of a point lying on the ground at cover row py
  const relief = (px, py) => { // how far (m) a point of the standing tree is from the trunks' plane (negative: toward the visitor)
    const fade = 1 - smooth(860, V.GR, py);
    const dome = Math.max(0, 1 - ((px - 440) / 360) ** 2 - ((py - 700) / 340) ** 2);
    const u = Math.hypot((px - 450) / 108, (py - 812) / 124), tunnel = 1.5 * (1 - smooth(0.78, 1.02, u)); // the vortex is a hole into the trunks
    const h = Math.hypot((px - 396) / 66, (py - 612) / 44), house = 0.55 * (1 - smooth(0.6, 1.1, h)); // the treehouse sits back in the canopy
    return (-0.9 * Math.sqrt(dome) + tunnel + house) * fade;
  };
  const Zof = (px, py) => (py >= V.GR ? ground(py) * 0.985 : V.Z0 + relief(px, py)); // (the ground is lifted 2 cm along its own ray: it stays under the water's depth test)
  const mpx = (px, py) => Zof(px, py) / f; // metres per cover pixel at a point

  // ───────────────────────────── the tones: the photo's own contours, painted into textures on the relief ─────────────────────────────
  // (the cover's pixels → the set, the tones painted with a soft glow, the soft masks and the grid meshes are the shared helpers of 49-r3d-room-0-tones.js)
  const { P: cp, tonePts, region, gridMesh } = coverTones(ctx, { V, lens: { f, yh }, decode: ptDecode, fill: PT_FILL, ts: [1.28, 1.92], root, rnd });
  const P = (px, py, dz = 0) => cp(px, py, Zof(px, py) + dz);
  const GC = PT_GLOW.c, GRr = PT_GLOW.r;
  // The figure and its glow are a standing cut-out in front of the tree. The tones are split between the two by one soft ellipse (a mask and its complement add up to one),
  // so from the arrival spot the sum is exactly the cover and no edge shows.
  const GLOW_BLUR = 8, GLOW_POLY = Array.from({ length: 48 }, (_, i) => [GC[0] + Math.cos((i / 48) * TAU) * GRr[0] * 0.81, GC[1] + Math.sin((i / 48) * TAU) * GRr[1] * 0.81]);
  const GB = [GC[0] - GRr[0] * 0.81 - 3 * GLOW_BLUR - 1, GC[1] - GRr[1] * 0.81 - 3 * GLOW_BLUR - 1, GC[0] + GRr[0] * 0.81 + 3 * GLOW_BLUR + 1, GC[1] + GRr[1] * 0.81 + 3 * GLOW_BLUR + 1];

  // the relief: a grid whose every vertex sits on its pixel's ray, at the depth of the tree there
  const NX = lite ? 64 : 92, NY = lite ? 68 : 98, TREE_R = [60, 425, 790, 1185];
  const tree = gridMesh(TREE_R, NX, NY, Zof, region(TREE_R, { glow: 0.3, masks: [['out', [GLOW_POLY], GLOW_BLUR]] }), root, [0, 0, 0], [0.9, 0.9, 0.95]);
  const bw = new Float32Array(tree.n), bdir = new Float32Array(tree.n * 2), live = []; // the vertices of the canopy, which breathe
  for (let k = 0; k < tree.n; k++) {
    const px = tree.pxy[k * 2], py = tree.pxy[k * 2 + 1];
    const e = Math.hypot((px - 445) / 330, (py - 700) / 260), vort = 1 - smooth(0.82, 1.0, Math.hypot((px - 450) / 108, (py - 812) / 124)), w = smooth(0.55, 1.05, e) * (1 - smooth(820, 930, py)) * (1 - 0.8 * vort);
    bw[k] = w; if (w > 0.03) { live.push(k); const L = Math.hypot(px - 445, py - 700) || 1; bdir[k * 2] = (px - 445) / L; bdir[k * 2 + 1] = -(py - 700) / L; }
  }
  const posAttr = tree.attr, basePos = tree.base, toneU = tree.u;
  // the figure and its glow: a standing cut-out at the depth of its feet
  const Zf = ground(PT_GLOW.feet), glowU = gridMesh(GB, 10, 10, () => Zf, region(GB, { glow: 0.3, masks: [['in', [GLOW_POLY], GLOW_BLUR]] }), root, [0, 0, 0], [1.12, 1.12, 1.2]).u;
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── chalk helpers: spirals, stars, the glyphs of what is left in a root ─────────────────────────────
  const spiral = (R, r, turns, n, w, al, z = 0) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * TAU, q = r * (0.06 + 0.94 * t); pts.push([Math.cos(a) * q, Math.sin(a) * q, z]); } R.poly(pts, w, al); };
  const star4 = (R, a, b, w, al) => { R.seg([-a, 0, 0], [a, 0, 0], w, al); R.seg([0, -b, 0], [0, b, 0], w, al); R.seg([-a * 0.32, -b * 0.32, 0], [a * 0.32, b * 0.32, 0], w * 0.7, al * 0.7); R.seg([-a * 0.32, b * 0.32, 0], [a * 0.32, -b * 0.32, 0], w * 0.7, al * 0.7); };
  const ell = (cx, cy, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * rx, cy + Math.sin((i / n) * TAU) * ry, 0]);
  const arc = (cx, cy, r, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0]; });
  /** The four things the chapter leaves behind, as chalk glyphs in a unit square (u across, v up from -0.5 to 0.5). */
  const glyph = (R, k, w) => {
    if (k === 0) { // a dog's paw, and its bark
      R.poly(ell(0, -0.12, 0.26, 0.2), w, 1, true); for (const [x, y] of [[-0.36, 0.14], [-0.13, 0.34], [0.13, 0.34], [0.36, 0.14]]) R.poly(ell(x, y, 0.085, 0.11, 8), w, 1, true);
      R.poly(arc(0.5, 0.2, 0.2, -0.9, 0.9, 6), w * 0.8, 0.85); R.poly(arc(0.5, 0.2, 0.34, -0.8, 0.8, 7), w * 0.7, 0.6);
    } else if (k === 1) { // a guitar and the echo that goes on
      R.poly(ell(0, -0.22, 0.26, 0.22, 14), w, 1, true); R.poly(ell(0, 0.08, 0.18, 0.17, 12), w, 1, true); R.poly(ell(0, -0.2, 0.07, 0.07, 8), w * 0.8, 1, true);
      R.seg([-0.03, 0.22, 0], [-0.03, 0.62, 0], w, 1); R.seg([0.03, 0.22, 0], [0.03, 0.62, 0], w, 1); R.poly([[-0.07, 0.62, 0], [-0.07, 0.74, 0], [0.07, 0.74, 0], [0.07, 0.62, 0]], w, 1, true);
      R.poly(arc(0.34, -0.1, 0.18, -0.8, 0.8, 6), w * 0.7, 0.7); R.poly(arc(0.34, -0.1, 0.3, -0.7, 0.7, 7), w * 0.6, 0.5);
    } else if (k === 2) { // two neighbours who greet each other
      for (const s of [-1, 1]) { R.poly(ell(s * 0.3, 0.3, 0.09, 0.09, 8), w, 1, true); R.seg([s * 0.3, 0.2, 0], [s * 0.3, -0.2, 0], w, 1); R.seg([s * 0.3, -0.2, 0], [s * 0.2, -0.46, 0], w, 1); R.seg([s * 0.3, -0.2, 0], [s * 0.4, -0.46, 0], w, 1); R.seg([s * 0.3, 0.1, 0], [s * 0.1, 0.24, 0], w, 1); R.seg([s * 0.3, 0.1, 0], [s * 0.5, -0.04, 0], w, 1); }
    } else { // a laugh with no reason
      R.poly(ell(0, 0, 0.36, 0.36, 18), w, 1, true); R.poly(arc(0, -0.04, 0.2, Math.PI * 1.12, Math.PI * 1.88, 8), w, 1); R.poly(arc(-0.13, 0.1, 0.06, 0.3, Math.PI - 0.3, 5), w * 0.8, 0.9); R.poly(arc(0.13, 0.1, 0.06, 0.3, Math.PI - 0.3, 5), w * 0.8, 0.9);
      R.seg([0.44, 0.3, 0], [0.56, 0.4, 0], w * 0.7, 0.8); R.seg([0.46, 0.1, 0], [0.6, 0.12, 0], w * 0.7, 0.8); R.seg([-0.44, 0.3, 0], [-0.56, 0.4, 0], w * 0.7, 0.8); R.seg([-0.46, 0.1, 0], [-0.6, 0.12, 0], w * 0.7, 0.8);
    }
  };

  // ───────────────────────────── the spirals: a swirl over each whorl, and chalk sparks orbiting it ─────────────────────────────
  const swirl = PT_SPIRALS.map((sp, k) => {
    const c = P(sp.c[0], sp.c[1], -0.12), mp = mpx(sp.c[0], sp.c[1]), rr = Math.min(sp.rx, sp.ry) * 0.92 * mp, host = grp(root, c[0], c[1], c[2]);
    const R = kit.ribbons(80 + k); spiral(R, rr, lite ? 2.2 : 2.6, lite ? 36 : 54, WC[1], 1);
    const L = lines(R, { glow: true }); host.add(L.obj);
    const N = lite ? 5 : 8, rows = Array.from({ length: N }, () => [0, 0, 0.02, 0.1, 0.9, rnd(), 0]), pts = kit.points(rows, { shape: 3, twinkle: 0.7, tint: PT_DIRS[k] > 0 ? [1, 0.82, 0.34] : [0.8, 0.88, 1] });
    host.add(pts.obj);
    return { host, L, pts, N, a: 0, rx: sp.rx * mp * 1.02, ry: sp.ry * mp * 1.02, mp };
  });
  // the spiral at the top right, where the ladder goes, and the curl at the far left: they only turn (slowly), and shine when the vortex opens
  const ladderTop = (() => { const c = P(637, 500, -0.1), host = grp(root, c[0], c[1], c[2]), R = kit.ribbons(84); spiral(R, 19 * mpx(637, 500), 2.4, lite ? 34 : 48, WC[1], 1); const L = lines(R, { glow: true }); host.add(L.obj); return { host, L }; })();
  const curl = (() => { const c = P(205, 850, -0.1), host = grp(root, c[0], c[1], c[2]), R = kit.ribbons(85); spiral(R, 24 * mpx(205, 850), 2.2, lite ? 30 : 44, WC[1], 0.9); const L = lines(R, { glow: true }); host.add(L.obj); return { host, L }; })();

  // ───────────────────────────── the sparkles: gold at the upper right of the vortex, silver at its left; the two small stars by the ladder ─────────────────────────────
  const sparkles = [['gold', 515, 731, 27, 32, [1, 0.8, 0.28]], ['silver', 380, 827, 30, 30, [0.82, 0.9, 1]]].map(([kind, px, py, a, b, tint], i) => {
    const c = P(px, py, -0.18), mp = mpx(px, py), host = grp(root, c[0], c[1], c[2]), R = kit.ribbons(90 + i); star4(R, a * mp, b * mp, WC[1] + 0.6, 1);
    const L = lines(R, { glow: true }); L.core.material.uniforms.uTint.value.set(...tint.map((x) => x * 1.1)); L.halo.material.uniforms.uTint.value.set(...tint); host.add(L.obj);
    const rows = []; for (let q = 0; q < (lite ? 10 : 22); q++) { const t = rnd() * 2 - 1, onH = rnd() < 0.5; rows.push([onH ? t * a * mp : (rnd() - 0.5) * 0.04, onH ? (rnd() - 0.5) * 0.04 : t * b * mp, 0.03, 0.03 + rnd() * 0.035, 0.7 + rnd() * 0.3, rnd(), 0]); }
    rows.push([0, 0, 0.04, 0.5, 0.9, 0.3, 0]);
    const glit = kit.points(rows, { shape: 3, twinkle: 0.9, tint }); host.add(glit.obj);
    return { kind, host, L, glit };
  });
  const smallStars = [[599, 500], [677, 515]].map(([px, py], i) => { const c = P(px, py, -0.1), host = grp(root, c[0], c[1], c[2]), R = kit.ribbons(94 + i); star4(R, 10 * mpx(px, py), 12 * mpx(px, py), WC[0], 1); const L = lines(R, { glow: true }); host.add(L.obj); return { host, L }; });
  const starGlint = kit.points([[...P(599, 500, -0.1), 0.2, 0.7, 0.2, 0], [...P(677, 515, -0.1), 0.2, 0.7, 0.6, 0]], { shape: 3, twinkle: 0.9, tint: [0.95, 0.96, 1] }); root.add(starGlint.obj);

  // ───────────────────────────── the roots: a pulse where each one waits, and the glyph of what is left in it ─────────────────────────────
  const rootPos = PT_ROOTS.map(([px, py]) => P(px, py));
  const rootPulse = kit.points(rootPos.map((p, i) => [p[0], p[1] + 0.12, p[2] + 0.05, 0.6, 0.8, i * 0.27, 0]), { shape: 2, twinkle: 0.4, tint: [0.9, 0.94, 1] }); root.add(rootPulse.obj);
  const glyphs = PT_THINGS.map((_, k) => { const R = kit.ribbons(100 + k); glyph(R, k, WC[1]); const host = grp(root, 0, 0, 0), L = lines(R, { glow: true }); L.obj.scale.setScalar(0.62); host.add(L.obj); host.visible = false; return { host, L, at: -1 }; });
  const sparkAt = kit.points(rootPos.map((p, i) => [p[0], p[1] + 0.5, p[2] + 0.1, 0.16, 0.8, i * 0.3, 0]), { shape: 3, twinkle: 0.8, tint: [0.95, 0.96, 1] }); root.add(sparkAt.obj);

  // ───────────────────────────── the vortex opening, the ladder's light, and the rays of the glow ─────────────────────────────
  const vc = P(452, 805, -0.2), vm = mpx(452, 805);
  const rings = Array.from({ length: lite ? 4 : 6 }, (_, i) => { const R = kit.ribbons(110 + i); R.poly(ell(0, 0, 108 * vm, 122 * vm, 40), WC[1], 1, true); const host = grp(root, vc[0], vc[1], vc[2]), L = lines(R, { glow: true }); host.add(L.obj); return { host, L }; });
  const vortexLight = kit.plane(ctx.canvasTex(256, 256, (c, w, hh) => { const g = c.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(210,225,255,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.fillStyle = g; c.fillRect(0, 0, w, hh); }), 2 * 112 * vm, 2 * 126 * vm, { alpha: 0 });
  vortexLight.mesh.position.set(vc[0], vc[1], vc[2] + 0.05); root.add(vortexLight.mesh);
  const fc = [P(PT_GLOW.c[0], PT_GLOW.c[1])[0], 0, 0]; { const y = V.H + ((yh - PT_GLOW.c[1]) * Zf) / f; fc[0] = ((PT_GLOW.c[0] - V.cx) * Zf) / f; fc[1] = y; fc[2] = V.Z0 - Zf; }
  const rays = (() => { const R = kit.ribbons(120), n = lite ? 14 : 28; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + 0.1, r0 = 0.16 + 0.05 * rnd(), r1 = 0.42 + 0.3 * rnd(); R.seg([Math.cos(a) * r0, Math.sin(a) * r0 * 1.05, 0], [Math.cos(a) * r1, Math.sin(a) * r1 * 1.05, 0], WC[0], 0.8); } const host = grp(root, fc[0], fc[1], fc[2] + 0.05), L = lines(R, { glow: true }); host.add(L.obj); return { host, L }; })();
  const motes = []; for (let i = 0; i < (lite ? 14 : 34); i++) { const px = 120 + rnd() * 600, py = 470 + rnd() * 380, p = P(px, py, -0.4 - rnd() * 0.6); motes.push([p[0], p[1], p[2], 0.05 + rnd() * 0.05, 0.3 + rnd() * 0.35, rnd(), 0]); }
  const dust = kit.points(motes, { mode: 1, rise: [0.05, 0.3, 0], speed: 0.05, spread: 0.2, twinkle: 0.5, tint: [0.85, 0.9, 1] }); root.add(dust.obj);
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(60, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 3); }), 0.3, 0.115, { alpha: 0.5 });
  { const p = P(176, 947, -0.05); sig.mesh.position.set(p[0], p[1], p[2]); root.add(sig.mesh); }

  // ───────────────────────────── what the window shows (in front of the camera while it is up there), the white of the crossing, the page ─────────────────────────────
  const vision = new THREE.Group(); vision.visible = false; ctx.scene.add(vision);
  const visionSpin = [0, 1, 2].map((k) => {
    const R = kit.ribbons(130 + k); spiral(R, 0.2, 2.4, 40, WC[2], 1); const host = new THREE.Group(); host.position.set((k - 1) * 0.62, 0, 0); vision.add(host);
    const L = lines(R, { glow: true }); host.add(L.obj);
    const tint = PT_DIRS[k] > 0 ? [1, 0.82, 0.34] : [0.82, 0.9, 1], sp = kit.points([[0, 0.3, 0.02, 0.5, 1, 0.2, 0]], { shape: 3, twinkle: 0.5, tint }); host.add(sp.obj);
    const R2 = kit.ribbons(135 + k); R2.poly(ell(0, 0, 0.3, 0.3, 36), WC[1], 0.7, true); host.add(lines(R2).obj);
    return { host, L, sp, a: 0 };
  });
  { const R = kit.ribbons(140); R.poly(ell(0, 0, 1, 1, 64), WC[2] + 0.6, 1, true); R.poly(ell(0, 0, 1.06, 1.06, 64), WC[0], 0.5, true); vision.add(lines(R, { glow: true }).obj); } // the round window
  const cross = kit.plane(ctx.canvasTex(32, 32, (c, w, hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); }), 1.9, 1.2, { alpha: 0, tint: [1, 0.98, 0.94] }); cross.mesh.visible = false; ctx.scene.add(cross.mesh);
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2])), winW = W3(P(404, 622, -0.3));
  const wp = (p) => ({ x: -p[0], z: PT_SET.z - p[2] }); // a local point's place on the floor (the world)
  PT_ROOTS.forEach((_, k) => { ctx.anchors['rm-raiz-' + k] = { pos: W3([rootPos[k][0], rootPos[k][1] + 0.25, rootPos[k][2]]), w: k < 2 ? 0.34 : 0.8, h: k < 2 ? 0.4 : 0.6 }; }); // (the two roots on the left are close together on screen: small targets that do not cover each other)
  { const p = P(622, 548, -0.15); ctx.anchors['rm-escalera'] = { pos: W3(p), w: 1.1, h: 1.1 }; }
  PT_SPIRALS.forEach((sp, k) => { ctx.anchors['rm-espiral-' + k] = { pos: W3(P(sp.c[0], sp.c[1], -0.15)), w: Math.max(0.9, sp.rx * 2.4 * mpx(sp.c[0], sp.c[1])), h: Math.max(1.0, sp.ry * 2.1 * mpx(sp.c[0], sp.c[1])) }; });
  ctx.anchors['rm-resplandor'] = { pos: W3([fc[0], fc[1] - 0.05, fc[2]]), w: 1.2, h: 1.3 };
  ctx.anchors['rm-portal'] = { pos: W3(P(452, 805, -0.2)), w: 2.3, h: 2.5 };
  // the tree is solid: a row of posts along its front (the visitor walks the roots, not the trunks)
  const solids = []; for (let x = -2.1; x <= 2.1; x += 0.65) { const z = V.Z0 - 0.75 - 0.5 * (1 - Math.min(1, Math.abs(x) / 2.1)), w = wp([x, 0, z]); solids.push({ kind: 'circle', x: w.x, z: w.z, r: 0.5 }); }

  // ───────────────────────────── camera poses (a close look at a root, the treehouse window, a spiral, the portal) ─────────────────────────────
  const LOOK = {
    casa: { at: [404, 622], dz: -0.3, w: 1.7, h: 1.3, up: 0.1 },
    portal: { at: [452, 805], dz: -0.2, w: 2.8, h: 2.8, up: 0 },
    ...Object.fromEntries(PT_SPIRALS.map((sp, k) => ['espiral-' + k, { at: sp.c, dz: -0.2, w: Math.max(1.4, sp.rx * 5 * mpx(sp.c[0], sp.c[1])), h: Math.max(1.6, sp.ry * 3.2 * mpx(sp.c[0], sp.c[1])), up: 0 }])),
    ...Object.fromEntries(PT_ROOTS.map((r, k) => ['raiz-' + k, { at: r, dz: 0, w: 2.2, h: 1.6, up: 0.5, ground: true }])),
  };
  function pose(view, a, free) {
    const L = LOOK[view]; if (!L) return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const d = coverFit(L.w, L.h, fw, fh, fov, a), t = P(L.at[0], L.at[1], L.dz); if (L.ground) t[1] += 0.3;
    return coverAim(root, V3, [t[0], t[1] + L.up + 0.18, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const D = { seen: 0, spin: [0, 0, 0], open: 0, done: 0, look: 0, cross: 0, pull: [0, 0, 0, 0], fill: [0, 0, 0, 0], rays: 0 };
  const st = { T: 0, init: false, tick: 0, ang: [0, 0, 0], vang: [0, 0, 0], at: [-1, -1, -1, -1] };
  const tmpF = V3(), tmpU = V3(), tmpV = V3(), tmpQ = V3();
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.spin), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3, ms = world.reduced ? 0.35 : 1, cam = ctx.camera;
    if (ok) {
      if (!st.init) { D.seen = v.seen; D.spin = v.spin.slice(); D.open = v.open; D.done = v.done; D.fill = v.at.map((q) => (q >= 0 ? 1 : 0)); st.init = true; }
      D.seen = damp(D.seen, v.seen, rate, dt); D.open = damp(D.open, v.open, rate * 0.5, dt); D.done = damp(D.done, v.done, rate * 0.5, dt); D.rays = damp(D.rays, v.open && !v.done ? 1 : 0, rate * 0.6, dt);
      for (let k = 0; k < 3; k++) D.spin[k] = damp(D.spin[k], v.spin[k], rate * 0.9, dt);
      for (let k = 0; k < 4; k++) { D.fill[k] = damp(D.fill[k], v.at[k] >= 0 ? 1 : 0, rate * 0.7, dt); D.pull[k] = damp(D.pull[k], v.pull[k], rate * 1.6, dt); }
    }
    const looking = typeof Room !== 'undefined' && Room.view === 'casa' && D.seen > 0.5 ? 1 : 0;
    D.look = damp(D.look, looking, rate * 0.9, dt); D.cross = damp(D.cross, world.room.cross || 0, rate * 3, dt);
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T;
    // the whole drawing breathes a little; the canopy rises and falls in waves
    const dim = 1 - 0.82 * D.look; // (looking out of the window, the tree gives way to what the window shows)
    toneU.uAlpha.value = (0.94 + 0.06 * Math.sin(T * 0.8) * m + 0.06 * D.open) * dim; glowU.uAlpha.value = (0.82 + 0.18 * Math.sin(T * 1.7) * m) * (1 + 0.3 * D.open) * (1 - 0.3 * D.cross) * dim;
    if (m && (!lite || (st.tick++ & 1) === 0)) {
      const arr = posAttr.array, A = 0.018 * (lite ? 0.8 : 1);
      for (const k of live) { const w = bw[k], s = Math.sin(T * 1.1 + basePos[k * 3] * 1.9 + basePos[k * 3 + 1] * 1.3) * A * w; arr[k * 3] = basePos[k * 3] + bdir[k * 2] * s; arr[k * 3 + 1] = basePos[k * 3 + 1] + bdir[k * 2 + 1] * s; }
      posAttr.needsUpdate = true;
    }
    // the spirals: still they sway a little back and forth; set, they turn the way they were set (clockwise: a smaller angle, seen from the front)
    for (let k = 0; k < 3; k++) {
      const sp = swirl[k], s = D.spin[k], set = Math.min(1, Math.abs(s)), w = -Math.sign(s) * 1.1 * ms * (0.35 + 0.65 * set) + (v.open ? -PT_DIRS[k] * 0.6 * ms * D.open : 0);
      st.ang[k] += w * dt * Math.min(1, set * 3 + D.open); const sway = 0.28 * Math.sin(T * 0.55 + k * 2.1) * m * (1 - set);
      sp.host.rotation.z = st.ang[k] + sway; sp.L.set((0.3 + 0.6 * set + 0.4 * D.open + 0.1 * Math.sin(T * 1.3 + k) * m) * (1 - 0.25 * D.done) * dim);
      const N = sp.N, arr = sp.pts.pos; let th = st.ang[k] * 1.0;
      for (let q = 0; q < N; q++) { const a = th + (q / N) * TAU; arr[q * 3] = Math.cos(a) * sp.rx * 1.1; arr[q * 3 + 1] = Math.sin(a) * sp.ry * 1.1; arr[q * 3 + 2] = 0.02; sp.pts.dat[q * 4 + 1] = 0.5 + 0.5 * Math.sin(q * 1.7 + T * 2) * m; }
      sp.pts.geo.attributes.position.needsUpdate = true; sp.pts.geo.attributes.aData.needsUpdate = true; sp.pts.set((set * 0.9 + 0.5 * D.open) * dim);
    }
    st.vang[0] += 0.12 * m * dt; ladderTop.host.rotation.z = -Math.sin(T * 0.4) * 0.4 * m - D.open * T * 0.5 * ms; ladderTop.L.set(0.5 + 0.3 * D.open + 0.1 * Math.sin(T * 1.1) * m);
    curl.host.rotation.z = Math.sin(T * 0.6 + 1) * 0.35 * m; curl.L.set(0.5 + 0.12 * Math.sin(T * 1.2) * m);
    // the sparkles: they glint; the gold one and the silver one are the ones the window tells about
    sparkles.forEach((sk, i) => { sk.L.set((0.9 + 0.25 * Math.sin(T * (2.1 + i) + i * 2) * m) * dim); sk.glit.set((0.7 + 0.3 * Math.sin(T * 2.6 + i * 3) * m) * dim); sk.host.rotation.z = Math.sin(T * 0.7 + i) * 0.08 * m; });
    smallStars.forEach((s, i) => s.L.set(0.7 + 0.3 * Math.sin(T * 2.3 + i * 1.7) * m)); starGlint.set(0.8);
    // the roots: a pulse where one waits, a steady shine where something was left, a retreat when a decoy was offered
    for (let k = 0; k < 4; k++) {
      const p = rootPos[k], pull = D.pull[k], idle = 1 - D.fill[k], base = rootPulse.dat, i4 = k * 4;
      rootPulse.pos[k * 3] = p[0] * (1 - 0.18 * pull); rootPulse.pos[k * 3 + 2] = p[2] + 0.05 - 0.6 * pull;
      base[i4] = 0.55 + 0.12 * Math.sin(T * 2.2 + k * 1.3) * m + 0.2 * pull; base[i4 + 1] = (0.35 + 0.35 * Math.sin(T * 1.6 + k) * m) * idle * (1 - 0.8 * pull) + 0.2 * D.fill[k] + 0.4 * pull * idle;
      sparkAt.dat[i4 + 1] = D.fill[k] * (0.6 + 0.4 * Math.sin(T * 2.4 + k * 2) * m);
    }
    rootPulse.geo.attributes.position.needsUpdate = true; rootPulse.geo.attributes.aData.needsUpdate = true; sparkAt.geo.attributes.aData.needsUpdate = true; rootPulse.set(D.done > 0.5 ? 0 : 1);
    glyphs.forEach((g, q) => {
      const at = v.at ? v.at.indexOf(q) : -1; if (at !== g.at) { g.at = at; if (at >= 0) { const p = rootPos[at]; g.host.position.set(p[0], p[1] + 0.52, p[2] + 0.12); } }
      const a = at >= 0 ? D.fill[at] : 0; g.host.visible = a > 0.02; g.L.set(a * (0.85 + 0.15 * Math.sin(T * 1.9 + q) * m) * (1 - 0.3 * D.done)); if (g.host.visible) g.host.rotation.y = 0;
    });
    // the vortex opens: the light comes up, rings leave its centre, the rays of the glow call
    vortexLight.set((0.5 * D.open + 0.2 * D.done) * (0.85 + 0.15 * Math.sin(T * 1.4) * m));
    rings.forEach((r, i) => { const ph = (T * 0.3 + i / rings.length) % 1, s = 0.2 + 0.85 * ph; r.host.scale.set(s, s, 1); r.L.set(D.open * (1 - ph) * 0.8 * (m ? 1 : 0.5)); r.host.visible = D.open > 0.02; });
    rays.host.visible = D.rays > 0.02; rays.L.set(D.rays * (0.5 + 0.4 * Math.sin(T * 3) * m)); rays.host.scale.setScalar(1 + 0.15 * Math.sin(T * 2.2) * m);
    dust.set(0.7); sig.set(0.5);
    // what the window shows: three spirals with a sparkle each, circling the way each must turn; it hangs in front of the camera
    vision.visible = D.look > 0.02;
    if (vision.visible) {
      cam.updateMatrixWorld(); tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const tv = Math.tan((cam.fov * Math.PI) / 360), th = tv * (ctx.W / Math.max(1, ctx.H)), dd = 0.85, rr = dd * Math.min(tv * 0.4, th * 0.44); // (on the way to the window, which the close look puts in the middle of the free part of the screen)
      tmpV.copy(winW).sub(cam.position).normalize(); vision.position.copy(cam.position).addScaledVector(tmpV, dd); vision.quaternion.copy(cam.quaternion); vision.scale.setScalar(rr * (0.4 + 0.6 * D.look));
      visionSpin.forEach((s, k) => { s.a += -PT_DIRS[k] * 1.3 * Math.max(0.25, ms) * dt; s.host.rotation.z = s.a * 0.35; s.L.set(1.0 * D.look); const a = Math.PI / 2 + s.a, q = s.sp.pos; q[0] = Math.cos(a) * 0.3; q[1] = Math.sin(a) * 0.3; q[2] = 0.02; s.sp.geo.attributes.position.needsUpdate = true; s.sp.set(D.look); });
    }
    // the crossing: white in front of the camera
    cross.mesh.visible = D.cross > 0.01;
    if (cross.mesh.visible) { cam.updateMatrixWorld(); tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); cross.mesh.position.copy(cam.position).addScaledVector(tmpF, 0.3); cross.mesh.quaternion.copy(cam.quaternion); cross.set(Math.min(1, D.cross)); }
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(tmpQ.set(vc[0], vc[1], vc[2] + 0.2)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  const vw = W3(P(452, 805, -0.2)), gw = W3(fc);
  return {
    root, update, pose,
    solids: () => solids,
    extra: [vision, cross.mesh, sheet.mesh],
    info: () => ({ segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, roots: PT_ROOTS.length, spirals: PT_SPIRALS.length, wide, f, texture: toneU.uTex.value.image.width + 'x' + toneU.uTex.value.image.height, vortex: { x: vw.x, y: vw.y, z: vw.z }, figure: { x: gw.x, y: gw.y, z: gw.z }, look: +D.look.toFixed(2) }),
  };
};
