// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 7 · «CASI PERDIDO»  (the cover, as a monkey with his hand on his temple and his head on fire: chalk tones on black, gold and silver glitter)
//   The drawing: a bust of a monkey with long white fur strokes down his shoulders and chest (ending in a fringe), a dark face with half-closed
//   eyes, a calm closed-mouth half smile with the lips outlined, wrinkles on the brow and the nose, and his right hand raised to his temple (fingers,
//   knuckles). Tall flames rise from his head: white strokes with grey smoke between them, gold glitter bands and silver glitter, with small
//   sparks and droplets around. Three loading-spinner asterisks (two on the left, one on the right) and some round dots and smudges on the right.
//   The paper in the photo is a black sheet in a plastic sleeve on a blanket (turned, keystoned), so the tones were traced from a rectified copy
//   (49-r3d-room-7-casi-perdido-art.js): the white and grey tones as contours at five levels, the gold glitter and the silver glitter segmented
//   apart (colour) and drawn on their own layers, warm and cool, with sparkle points on their brightest grains (the shared tone helpers,
//   49-r3d-room-0-tones.js, decode and paint them).
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels from there.
//   Layers share that eye and each one sits at the depth that suits it; the cover's pixels are split among them with soft masks that add up to one,
//   so from the arrival spot the sum is the cover and walking in opens it up:
//     · the body: a relief (head and chest forward) of the bust below the flames, without the hand,
//     · the hand and forearm: a relief of its own that hinges away from the temple at the end,
//     · the flames: three layers (white strokes, gold glitter, silver glitter) that flicker and rise; at the end they burn down to embers and the
//       gold falls,
//     · the three spinners, each at its own depth over the spot where something is to be set down; they spin until the thing below them is chosen,
//     · chalk ribbons for what is told and what moves: the thought that rises from the flames, the mate, Rita's leash and the guitar, rings, embers.
//   world.room.v holds the targets (the controller, 59-room-7-…, sets them whole); every value is damped here, so nothing needs a sequence.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, BOT the cover row where the fringe ends (it stands 0.15 m above the floor), Z0 how far (m) the drawing's plane is from the eye, ARR where the visitor arrives (z). */
const CP = { H: 1.6, cx: 560, BOT: 1005, Z0: 5.5, ARR: 2.7 };
/** Where the visitor stands when a floor opens is the eye; the drawing is Z0 metres ahead of it. */
const CP_SET = { x: 0, y: 1.6, z: CP.ARR + CP.Z0 };
/** The lens depends on the screen: a wide one fits the whole bust at 1300 cover px of focal length, a phone's narrow view at 1600. The set's z never changes. */
function cpLens(a) { return coverLens(CP, a, { f: 1300, row: 520, sx: 0.42, sy: 0.5 }, { f: 1600, row: 520, sx: 0.5, sy: 0.5 }); }
/** A polygon of a disc (cover pixels): the tight cut that holds one spinner. */
const cpDisc = (cx, cy, r, n = 28) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * TAU), cy + r * Math.sin((i / n) * TAU)]);
/**
 * The ten thoughts that rise in the flames (the 2D plate's cards, in its order): five belong to the fire, five are the quiet life. A quiet thought
 * lands at one of the three spots (spot: 0 the mate, 1 Rita's leash, 2 the guitar); `land` is where it comes down, said aloud.
 */
const CP_THOUGHTS = [
  { id: 'producir', text: 'Producir', kind: 'fuego' },
  { id: 'mates', text: 'Unos mates', kind: 'lado', spot: 0 },
  { id: 'culpa', text: 'La culpa de no estar produciendo', kind: 'fuego' },
  { id: 'rita', text: 'Pasear con Rita', kind: 'lado', spot: 1 },
  { id: 'rendimiento', text: 'El rendimiento', kind: 'fuego' },
  { id: 'musica', text: 'Hacer música con amigos', kind: 'lado', spot: 2 },
  { id: 'objetivo', text: 'Correr detrás del objetivo', kind: 'fuego' },
  { id: 'novia', text: 'Abrazar a mi novia', kind: 'lado', spot: 0 },
  { id: 'distraido', text: 'Estar distraído', kind: 'fuego' },
  { id: 'naturaleza', text: 'Volver a la naturaleza de las cosas', kind: 'lado', spot: 1 },
];
/**
 * The three spinners, each over a spot. px, py: the centre of its rays on the cover; Z: how far (m) from the eye it hangs (the drawing is at 5.5: 6.6 and
 * 7.4 are behind him, 5.0 beside him), so every one is further than 4.8 m from where the visitor arrives and has to be walked to; half: half the side of its
 * texture; r1, r2: the inner and outer radius of its rays (cover px); thing: what lies below it.
 */
const CP_SPOTS = [
  { id: 'mate', px: 213, py: 425, Z: 6.6, half: 62, r1: 21, r2: 50, name: 'arriba a la izquierda, detrás del mono', thing: 'el mate', land: 'hasta el mate, a la izquierda, detrás del mono' },
  { id: 'correa', px: 238, py: 628, Z: 5.0, half: 58, r1: 19, r2: 45, name: 'abajo a la izquierda, a su costado', thing: 'la correa de Rita', land: 'hasta la correa de Rita, a la izquierda, a su costado' },
  { id: 'guitarra', px: 864, py: 510, Z: 7.4, half: 72, r1: 32, r2: 70, name: 'a la derecha, detrás del mono', thing: 'la guitarra', land: 'hasta la guitarra, a la derecha, detrás del mono' },
];
/** Where the cover's regions are (rectified cover pixels): the flames (a soft lower edge at their base), the hand and forearm, the rest of the bust; FB is the row of the flames' base. */
const CP_FLAME_POLY = [[320, 48], [820, 48], [820, 452], [790, 462], [740, 465], [700, 452], [650, 447], [600, 450], [560, 445], [520, 450], [470, 452], [430, 462], [400, 500], [330, 506], [318, 400]];
const CP_HAND_POLY = [[648, 425], [722, 428], [768, 468], [784, 520], [780, 572], [802, 622], [832, 690], [868, 780], [884, 862], [852, 884], [790, 866], [748, 832], [738, 762], [726, 722], [690, 702], [656, 668], [640, 602], [634, 540], [642, 478]];
const CP_HULL_POLY = [[298, 425], [790, 425], [790, 600], [905, 600], [905, 1030], [205, 1030], [205, 700], [292, 690], [298, 560]];
const CP_FB = 445, CP_PIVOT = [800, 840];

ROOM_SETS['casi-perdido'] = function buildCasiPerdido(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = CP;
  const { wide, f, yh } = cpLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(0, 0, CP_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(77);
  const WC = lite ? [1.2, 1.8, 2.5] : [1.6, 2.4, 3.2];
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; const L = kit.lines(rib, o); L.core.layers.set(1); return L; }; // (layer 1: not mirrored by the water: the cover has no reflection)
  const mp = (Z) => Z / f; // metres per cover pixel at depth Z

  // ---- how far each layer stands from the eye (the cover's pixels → the set, the tones painted into textures and the grid meshes are the shared helpers of 49-r3d-room-0-tones.js) ----
  const bump = (px, py, cx, cy, rx, ry) => Math.exp(-(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2));
  /** How far the body is from its plane: the head and face forward, the chest and the shoulders a little. */
  const Zb = (px, py) => V.Z0 - 0.7 * bump(px, py, 545, 560, 150, 170) - 0.45 * bump(px, py, 540, 850, 260, 170) - 0.2 * bump(px, py, 330, 740, 100, 80);
  /** The hand and forearm are well in front of the head. */
  const Zh = (px, py) => V.Z0 - 0.35 - 0.7 * bump(px, py, 700, 560, 90, 120) - 0.35 * bump(px, py, 810, 740, 70, 140);
  const ZF = V.Z0 - 0.35; // the flames stand a little in front of the head's top

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, tonePts, region, mat, gridMesh, glitterRows } = coverTones(ctx, { V, lens: { f, yh }, decode: cpDecode, fill: CP_FILL, grey: { 5: 150, 6: 215, 7: 255, 8: 88, 9: 225 }, ts: [1.05, 1.7], root, rnd }); // (the greys: what each glitter group is painted with, its layer's tint makes it gold or silver)
  const FLAME_M = [CP_FLAME_POLY], HAND_M = [CP_HAND_POLY], HULL_M = [CP_HULL_POLY], SPIN_M = CP_SPOTS.map((sp) => cpDisc(sp.px, sp.py, sp.r2 * 1.3));

  // the body: a relief below the flames, without the hand (the weights: flames, then hand, then the rest)
  const BODY_R = [205, 420, 905, 1030];
  const body = gridMesh(BODY_R, lite ? 30 : 46, lite ? 34 : 52, Zb, region(BODY_R, { masks: [['out', FLAME_M, 14], ['out', HAND_M, 12], ['out', SPIN_M, 2], ['in', HULL_M, 5]] }));
  // the hand and forearm: a relief of its own that hinges about the elbow
  const HAND_R = [628, 415, 892, 890];
  const pivotZ = Zh(CP_PIVOT[0], CP_PIVOT[1]), pivot = P(CP_PIVOT[0], CP_PIVOT[1], pivotZ), handHost = grp(root, pivot[0], pivot[1], pivot[2]);
  const hand = gridMesh(HAND_R, lite ? 18 : 26, lite ? 26 : 38, Zh, region(HAND_R, { masks: [['out', FLAME_M, 14], ['in', HAND_M, 12]] }), handHost, pivot);
  // the flames: white strokes with grey smoke, gold glitter and silver glitter, each its own layer on the same rays
  const FL_R = [308, 46, 832, 520];
  const FNX = lite ? 22 : 34, FNY = lite ? 26 : 40;
  const flameW = gridMesh(FL_R, FNX, FNY, () => ZF, region(FL_R, { masks: [['in', FLAME_M, 14]] }));
  const flameG = gridMesh(FL_R, FNX, FNY, () => ZF - 0.08, region(FL_R, { groups: [5, 6, 7], ts: 0.9, glow: 0.2 }), root, [0, 0, 0], [1.28, 0.93, 0.38]);
  const flameS = gridMesh(FL_R, FNX, FNY, () => ZF - 0.04, region(FL_R, { groups: [8, 9], ts: 0.8, glow: 0.2 }), root, [0, 0, 0], [0.9, 0.95, 1.02]);
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)
  const baseY = V.H + ((yh - CP_FB) * ZF) / f; // the flames' base, in the set's metres

  // the spinners: each its own texture, spinning about its centre at its own depth
  const spinners = CP_SPOTS.map((sp, k) => {
    const r = [sp.px - sp.half, sp.py - sp.half, sp.px + sp.half, sp.py + sp.half], c = P(sp.px, sp.py, sp.Z), host = grp(root, c[0], c[1], c[2]);
    const geo = ctx.keep(new THREE.PlaneGeometry(2 * sp.half * mp(sp.Z), 2 * sp.half * mp(sp.Z))), M = mat(region(r, { ts: lite ? 1.1 : 1.6, glow: 0.2, masks: [['in', [SPIN_M[k]], 0.8]] }));
    const m = new THREE.Mesh(geo, M.m); m.frustumCulled = false; m.layers.set(1); host.add(m);
    return { sp, k, host, m, u: M.u, home: c, r, spin: 0 };
  });

  // ───────────────────────────── chalk helpers ─────────────────────────────
  const ell = (cx, cy, rx, ry, n = 16, rot = 0, a0 = 0, a1 = TAU) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot), 0]; });
  /** A point list [x, y] in metres to ribbon points. */
  const pl = (a) => a.map(([x, y]) => [x, y, 0]);

  // ───────────────────────────── the spinners' rays: a chaser runs round while one spins ─────────────────────────────
  spinners.forEach((s) => {
    const R = kit.ribbons(10 + s.k), sp = s.sp, q = mp(sp.Z);
    s.chase = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, ca = Math.cos(a), sa = Math.sin(a), Rr = kit.ribbons(20 + s.k * 8 + i);
      Rr.seg([ca * sp.r1 * q, sa * sp.r1 * q, 0.02], [ca * sp.r2 * q, sa * sp.r2 * q, 0.02], WC[2], 1);
      const L = lines(Rr, { glow: true }); s.host.add(L.obj); s.chase.push(L);
    }
    // the ring a spinner becomes when it stops: a still star, its rays joined by a thin circle
    R.poly(ell(0, 0, sp.r2 * q * 1.18, sp.r2 * q * 1.18, 36).map((p) => [p[0], p[1], 0.02]), WC[0], 0.8);
    s.star = lines(R, { glow: true }); s.host.add(s.star.obj);
  });

  // ───────────────────────────── the three spots: a chalk thing on the floor under each spinner ─────────────────────────────
  const spotP = CP_SPOTS.map((sp) => { const c = P(sp.px, sp.py, sp.Z); return [c[0], 0, c[2]]; }); // the floor under each spinner (set metres)
  const spotHost = spotP.map((p) => grp(root, p[0], p[1], p[2]));
  const heart = (cx, cy, s) => Array.from({ length: 24 }, (_, i) => { const t = (i / 24) * TAU; return [cx + s * 16 * Math.sin(t) ** 3 * 0.0625, cy + s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.0625, 0]; });
  const thing = spotHost.map((host, k) => {
    const R = kit.ribbons(50 + k), X = kit.ribbons(60 + k);
    if (k === 0) { // a mate: the gourd, its rim, the bombilla and a band
      R.poly(ell(0, 0.24, 0.16, 0.2, 18), WC[1], 1, true); R.poly(ell(0, 0.43, 0.115, 0.03, 14), WC[1], 1, true);
      R.poly(pl([[0.03, 0.42], [0.1, 0.62], [0.17, 0.84]]), WC[1], 1); R.poly(pl([[0.15, 0.82], [0.22, 0.88]]), WC[1], 1);
      R.poly(ell(0, 0.22, 0.16, 0.05, 12, 0, 0.2, Math.PI - 0.2), WC[0], 0.8);
      X.poly(heart(0.4, 0.3, 0.17), WC[1], 1, true); X.poly(heart(0.4, 0.3, 0.1), WC[0], 0.7, true); // the hug of the girlfriend
    } else if (k === 1) { // Rita's leash: a hook, the strap and its loop; a sprout for the nature
      R.poly(pl([[-0.3, 0.92], [-0.3, 0.84]]), WC[2], 1); R.poly(ell(-0.3, 0.88, 0.06, 0.06, 10), WC[1], 1);
      R.poly(pl([[-0.3, 0.82], [-0.27, 0.62], [-0.18, 0.4], [-0.04, 0.22], [0.12, 0.13], [0.26, 0.15], [0.34, 0.24]]), WC[1], 1);
      R.poly(ell(0.4, 0.14, 0.11, 0.075, 14), WC[1], 1, true);
      X.poly(pl([[0.72, 0], [0.72, 0.4]]), WC[1], 1); X.poly(ell(0.63, 0.32, 0.11, 0.05, 10, 0.5), WC[1], 1, true); X.poly(ell(0.81, 0.42, 0.11, 0.05, 10, -0.5), WC[1], 1, true);
    } else { // the guitar: two bouts, the sound hole, the neck, the head and the strings
      R.poly(ell(0, 0.2, 0.22, 0.2, 20), WC[1], 1, true); R.poly(ell(0, 0.5, 0.16, 0.14, 18), WC[1], 1, true); R.poly(ell(0, 0.27, 0.065, 0.065, 12), WC[1], 1, true);
      R.poly(pl([[-0.03, 0.63], [-0.03, 1.2]]), WC[1], 1); R.poly(pl([[0.03, 0.63], [0.03, 1.2]]), WC[1], 1); R.poly(pl([[-0.05, 1.2], [0.05, 1.2], [0.05, 1.32], [-0.05, 1.32]]), WC[1], 1, true);
      for (const x of [-0.015, 0, 0.015]) R.seg([x, 0.1, 0], [x, 1.2, 0], WC[0], 0.6);
    }
    const Lm = lines(R, { glow: true }), Lx = lines(X, { glow: true }); host.add(Lm.obj); host.add(Lx.obj);
    return { host, Lm, Lx };
  });
  // a dashed ring on the floor marks each spot, and a faint line hangs the spinner over it
  const marker = CP_SPOTS.map((sp, k) => {
    const R = kit.ribbons(70 + k), c = spinners[k].home;
    for (let i = 0; i < 18; i++) { const a0 = (i / 18) * TAU, a1 = a0 + 0.2; R.seg([Math.cos(a0) * 0.55, 0.02, Math.sin(a0) * 0.35], [Math.cos(a1) * 0.55, 0.02, Math.sin(a1) * 0.35], WC[0], 0.8); }
    for (let y = 0.2; y < c[1] - 0.4; y += 0.32) R.seg([0, y, 0], [0, y + 0.14, 0], WC[0], 0.55);
    const L = lines(R, { glow: false }); spotHost[k].add(L.obj); return L;
  });
  // the glow a spot gets when its thing is chosen
  const spotRing = CP_SPOTS.map((sp, k) => { const R = kit.ribbons(80 + k); R.poly(ell(0, 0.4, 0.62, 0.62, 30), WC[1], 1, true); const L = lines(R, { glow: true }); spotHost[k].add(L.obj); return L; });

  // ───────────────────────────── the thoughts: each its own chalk words, a bubble that rises from the flames ─────────────────────────────
  const BUB_W = wide ? 1.5 : 0.9, BUB_H = BUB_W * 0.44, BUB_AT = wide ? P(250, 245, 5.0) : P(292, 255, 5.0);
  const words = (text, c, w, hh) => {
    const parts = text.split(' ');
    for (let fs = 64; fs >= 20; fs -= 2) {
      c.font = FONT_DISPLAY(fs, '', 500); const rows = []; let cur = '';
      for (const p of parts) { const t = cur ? cur + ' ' + p : p; if (c.measureText(t).width <= w * 0.7 || !cur) cur = t; else { rows.push(cur); cur = p; } }
      rows.push(cur);
      if (rows.length <= 3 && rows.length * fs * 1.12 <= hh * 0.62 && rows.every((r) => c.measureText(r).width <= w * 0.7 + 1)) {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        rows.forEach((r, i) => c.fillText(r, w / 2, hh / 2 + (i - (rows.length - 1) / 2) * fs * 1.12 + fs * 0.04));
        return;
      }
    }
  };
  const occTex = ctx.canvasTex(256, 112, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = 'rgb(24,21,19)'; c.beginPath(); c.ellipse(w / 2, hh / 2, w * 0.485, hh * 0.47, 0, 0, TAU); c.fill(); });
  const thoughts = CP_THOUGHTS.map((t, i) => {
    const tex = ctx.canvasTex(512, Math.round(512 * (BUB_H / BUB_W)), (c, w, hh) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.shadowColor = 'rgba(255,255,255,.6)'; c.shadowBlur = 10;
      c.beginPath(); c.ellipse(w / 2, hh / 2, w * 0.47, hh * 0.45, 0, 0, TAU); c.stroke(); // a thought, outlined in chalk
      c.fillStyle = t.kind === 'fuego' ? '#ffe1b8' : '#e6f0ff'; c.shadowBlur = 6; words(t.text, c, w, hh);
    });
    const p = kit.plane(tex, BUB_W, BUB_H, { alpha: 0, tint: [1, 1, 1] });
    ctx.scene.add(p.mesh); p.mesh.visible = false; p.mesh.layers.set(1);
    // a dark ellipse behind the words (it hides the flames where the thought hangs, so it can always be read)
    const om = new THREE.MeshBasicMaterial({ map: occTex, transparent: true, opacity: 0, depthWrite: false, fog: false }); ctx.disposables.push(om);
    const o = new THREE.Mesh(ctx.planeGeo(BUB_W * 1.02, BUB_H * 1.02), om); o.layers.set(1); o.visible = false; ctx.scene.add(o);
    return { i, t, p, o };
  });

  // ───────────────────────────── glitter: sparkle points on the brightest grains, twinkling; the gold falls at the end ─────────────────────────────
  const goldPts = CP_GOLD_PTS.filter((_, i) => !lite || i % 2 === 0), silPts = CP_SIL_PTS.filter((_, i) => !lite || i % 2 === 0);
  const goldG = kit.points(glitterRows(goldPts, 0.05, ZF - 0.1), { shape: 3, twinkle: 0.95, tint: [1.2, 0.9, 0.42] });
  const silG = kit.points(glitterRows(silPts, 0.045, ZF - 0.05), { shape: 3, twinkle: 0.95, tint: [0.9, 0.97, 1.1] });
  root.add(goldG.obj); root.add(silG.obj);
  const goldBase = Float32Array.from(goldG.pos), silBase = Float32Array.from(silG.pos);
  // the gold that falls (the same grains, drifting down and fading), and the sparks that drift up from the flames
  const fallG = kit.points(glitterRows(goldPts, 0.05, ZF - 0.1).map((r, i) => [r[0], r[1], r[2], r[3], r[4], r[5], 0]), { mode: 1, rise: [0, -3.2, 0], speed: 0.42, spread: 0.2, shape: 3, tint: [1.2, 0.9, 0.42], alpha: 0 });
  root.add(fallG.obj);
  const sparks = kit.points(Array.from({ length: lite ? 12 : 26 }, () => { const px = 400 + rnd() * 380, py = 120 + rnd() * 260, p = P(px, py, ZF + 0.1); return [p[0], p[1], p[2], 0.02 + rnd() * 0.025, 0.45 + rnd() * 0.45, rnd(), 0]; }), { mode: 1, rise: [0.03, 0.55, 0], speed: 0.14, spread: 0.1, tint: [1.15, 0.8, 0.45] });
  root.add(sparks.obj);
  // the embers: a weak glow at the base of the flames that stays, and takes over when they burn down
  const embers = kit.points(Array.from({ length: lite ? 26 : 56 }, () => { const px = 400 + rnd() * 330, py = 395 + rnd() * 55, p = P(px, py, ZF + 0.05); return [p[0], p[1], p[2], 0.05 + rnd() * 0.07, 0.55 + rnd() * 0.45, rnd(), 0]; }), { twinkle: 0.85, tint: [1.2, 0.5, 0.26] });
  root.add(embers.obj);
  const emberRise = kit.points(Array.from({ length: lite ? 16 : 34 }, () => { const px = 420 + rnd() * 300, py = 400 + rnd() * 45, p = P(px, py, ZF + 0.05); return [p[0], p[1], p[2], 0.04 + rnd() * 0.05, 0.6 + rnd() * 0.4, rnd(), 0]; }), { mode: 1, rise: [0, 0.55, 0], speed: 0.13, spread: 0.12, tint: [1.2, 0.5, 0.26], alpha: 0 });
  root.add(emberRise.obj);
  // the glitter on the hand's temple: none. The ear and the temple's fur that show when the hand leaves are chalk strokes
  const temple = (() => {
    const R = kit.ribbons(90), q = mp(V.Z0 - 0.1), c = P(660, 540, V.Z0 - 0.1);
    const at = (px, py) => [(px - 660) * q, -(py - 540) * q, 0];
    R.poly([[650, 455], [640, 500], [635, 560], [642, 620], [660, 668]].map(([x, y]) => at(x, y)), WC[1], 1);
    for (let i = 0; i < 12; i++) { const y = 470 + i * 17, x = 646 - ((i * 37) % 9); R.poly([at(x, y), at(x + 16 + (i % 3) * 5, y - 7), at(x + 36 + (i % 4) * 5, y - 11)], WC[0], 0.8); }
    for (let i = 0; i < 8; i++) { const y = 480 + i * 22; R.poly([at(668, y), at(690, y + 9), at(706, y + 6)], WC[0], 0.6); }
    const L = lines(R, { glow: true }), host = grp(root, c[0], c[1], c[2]); host.add(L.obj); return { L, host };
  })();

  // ───────────────────────────── the dots and smudges of the right side, the word, the dust, the page ─────────────────────────────
  const dots = kit.points(CP_DOTS.map(([x, y, r]) => { const p = P(x, y, V.Z0 + 0.5); return [p[0], p[1], p[2], 2 * r * mp(V.Z0 + 0.5), 0.34 + (r > 9 ? 0.18 : 0), rnd(), 0]; }), { shape: 0, twinkle: 0.2, tint: [0.78, 0.8, 0.85] });
  root.add(dots.obj);
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(60, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 3); }), 0.3, 0.115, { alpha: 0.5 });
  { const g = (V.H * f) / (1075 - yh), p = [((1010 - V.cx) * g) / f, 0.08, V.Z0 - g]; sig.mesh.position.set(p[0], p[1], p[2]); sig.mesh.rotation.x = -1.1; root.add(sig.mesh); }
  const dust = (() => { const rows = []; for (let i = 0; i < (lite ? 10 : 24); i++) { const px = 120 + rnd() * 820, py = 100 + rnd() * 800, p = P(px, py, V.Z0 + 0.6 + rnd() * 2); rows.push([p[0], p[1], p[2], 0.04 + rnd() * 0.05, 0.25 + rnd() * 0.3, rnd(), 0]); } return kit.points(rows, { mode: 1, rise: [0.04, 0.22, 0], speed: 0.05, spread: 0.2, twinkle: 0.5, tint: [0.88, 0.9, 1] }); })();
  root.add(dust.obj);
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const bubbleW = W3(BUB_AT), spinW = spinners.map((s) => W3(s.home)), spinHot = spinners.map((s) => ({ pos: W3([s.home[0], (s.home[1] + 0.45) / 2, s.home[2]]), w: 0.7, h: Math.min(2.4, s.home[1] + 0.5) })), // (the hotspot is the whole column, the wheel and what lies below it: a wheel high up is out of reach of a close look that does not tilt)
  spotW = spotP.map((p) => W3([p[0], 0.45, p[2]])), flameAt = W3(P(560, 335, ZF));
  const FLAME_C = P(560, 300, ZF - 0.05);
  ctx.anchors['rm-pensamiento'] = { pos: bubbleW, w: BUB_W, h: BUB_H * 1.3 };
  ctx.anchors['rm-llamas'] = { pos: flameAt, w: 1.5, h: 1.5 };
  const NEAR = 4.2; // how near (m) a spinner shows its hotspot
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // the bust is solid: a row of posts along his body (the visitor walks around him, not through him)
  const solids = []; for (let px = 300; px <= 900; px += 70) solids.push({ kind: 'circle', x: -P(px, 700, V.Z0)[0], z: CP_SET.z, r: Math.max(0.3, 40 * mp(V.Z0)) });

  // ───────────────────────────── camera poses ─────────────────────────────
  const LOOK = {
    pensamiento: { t: () => [(BUB_AT[0] + FLAME_C[0]) / 2, (BUB_AT[1] + FLAME_C[1]) / 2, FLAME_C[2]], w: 3.6, h: 2.5, up: 0 },
    brasas: { t: () => [FLAME_C[0], FLAME_C[1] - 0.1, FLAME_C[2]], w: 3.2, h: 3.0, up: 0 },
    ...Object.fromEntries(CP_SPOTS.map((sp, k) => ['giro-' + k, { t: () => [spinners[k].home[0], (spinners[k].home[1] + 0.5) / 2, spinners[k].home[2]], w: 2.6, h: Math.max(2.4, spinners[k].home[1] + 0.9), up: 0 }])),
  };
  const aim = (camL, tgtL, sx, sy, fov, a) => coverAim(root, V3, camL, tgtL, sx, sy, fov, a), fit = coverFit;
  function pose(view, a, free) {
    const L = LOOK[view]; if (!L) return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const d = fit(L.w, L.h, fw, fh, fov, a), t = L.t();
    return aim([t[0], t[1] + L.up + 0.1, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const D = { burn: 0, watch: 0, hand: 0, flare: 0, spun: [0, 0, 0], glyph: [0, 0, 0], extra: [0, 0, 0], pop: [0, 0, 0], ring: [0, 0, 0], enter: 0 };
  const st = { T: 0, init: false, tick: 0, cur: -2, said: [], fl: [], wrong: 0, spinA: [0, 0, 0] };
  const tmpV = V3(), tmpQ = V3(), tmpW = V3();
  const spotNear = [0, 0, 0];
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const placed = (said) => { const n = [0, 0, 0]; CP_THOUGHTS.forEach((t, i) => { if (said[i] && t.kind === 'lado') n[t.spot]++; }); return n; };
  /** The flames' sway: how far a point of the flames at cover (px, py) is moved (set metres) at time T; more the higher it is. */
  const flameD = (px, py, T, m) => { const w = Math.pow(clamp((CP_FB - py) / 390, 0, 1), 1.25) * m; return [(Math.sin(T * 1.9 + py * 0.014 + px * 0.006) * 0.05 + Math.sin(T * 3.3 + py * 0.03 + px * 0.01) * 0.02) * w, Math.sin(T * 2.4 + px * 0.01) * 0.03 * w]; };
  function animateFlame(M, T, m, K, fall) {
    const arr = M.attr.array;
    for (let i = 0; i < M.n; i++) {
      const px = M.pxy[i * 2], py = M.pxy[i * 2 + 1], [dx, dy] = flameD(px, py, T, m), k = i * 3;
      arr[k] = M.base[k] + dx; arr[k + 1] = baseY + (M.base[k + 1] - baseY) * K + dy - fall * (0.55 + 0.9 * ((Math.sin(px * 0.21 + py * 0.05) + 1) / 2)); arr[k + 2] = M.base[k + 2];
    }
    M.attr.needsUpdate = true;
  }
  function animateGlitter(G, base, T, m, K, fall) {
    const arr = G.pos;
    for (let i = 0; i < arr.length / 3; i++) {
      const k = i * 3, x = base[k], y = base[k + 1], px = V.cx + (x * f) / ZF, py = yh - ((y - V.H) * f) / ZF, [dx, dy] = flameD(px, py, T, m);
      arr[k] = x + dx; arr[k + 1] = baseY + (y - baseY) * K + dy - fall * (0.55 + 0.9 * ((Math.sin(px * 0.21 + py * 0.05) + 1) / 2)); arr[k + 2] = base[k + 2];
    }
    G.geo.attributes.position.needsUpdate = true;
  }
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.said), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3, cam = ctx.camera, cp = world.cam;
    const said = ok ? v.said : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], spun = ok && Array.isArray(v.spun) ? v.spun : [0, 0, 0], curId = ok && Number.isInteger(v.cur) ? v.cur : -1;
    if (ok && !st.init) { // the saved state is shown as it is: what is resolved is where it landed, nothing flies
      D.burn = v.fin; D.hand = v.fin; D.spun = spun.slice(); const pl3 = placed(said); D.glyph = pl3.map((n) => (n > 0 ? 1 : 0)); D.extra = pl3.map((n) => (n > 1 ? 1 : 0)); D.ring = spun.slice();
      st.said = said.slice(); st.cur = curId; st.wrong = v.wrong || 0; D.enter = curId >= 0 ? 1 : 0; st.init = true;
    }
    if (ok) {
      D.burn = damp(D.burn, v.fin, rate * 0.36, dt); D.watch = damp(D.watch, v.watch, rate * 0.55, dt); D.hand = damp(D.hand, v.fin, rate * 0.4, dt);
      const pl3 = placed(said); // (a thought still flying to its spot is not there yet)
      for (const q of st.fl) if (q.kind === 'lado') pl3[CP_THOUGHTS[q.i].spot]--;
      for (let k = 0; k < 3; k++) {
        D.spun[k] = damp(D.spun[k], spun[k], rate * 0.9, dt); D.ring[k] = damp(D.ring[k], spun[k], rate * 0.6, dt);
        D.glyph[k] = damp(D.glyph[k], pl3[k] > 0 ? 1 : 0, rate * 1.2, dt); D.extra[k] = damp(D.extra[k], pl3[k] > 1 ? 1 : 0, rate * 1.2, dt);
        D.pop[k] = damp(D.pop[k], 0, 2.2, dt);
      }
      // what changed: a thought was resolved (it flies into the fire, or down to its spot) or sent back up (a wrong choice)
      if (curId !== st.cur) {
        const prev = st.cur;
        if (prev >= 0) {
          const t0 = CP_THOUGHTS[prev], gone = said[prev] === 1 && !st.said[prev];
          st.fl.push({ i: prev, kind: gone ? t0.kind === 'fuego' ? 'fuego' : 'lado' : 'up', t: 0, landed: false });
        }
        st.cur = curId; D.enter = 0;
      }
      st.said = said.slice();
      D.enter = damp(D.enter, curId >= 0 ? 1 : 0, rate * 0.9, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T, K = 1 - 0.78 * smooth(0, 1, D.burn) - 0.07 * D.watch, fall = 2.4 * smooth(0.04, 0.9, D.burn);
    const flare = D.flare = damp(D.flare, 0, 2.4, dt);
    const br = 0.94 + 0.06 * Math.sin(T * 0.8) * m;
    body.u.uAlpha.value = br; hand.u.uAlpha.value = br;
    // the flames flicker and rise (until the end), burn down to embers and let the gold fall
    animateFlame(flameW, T, m, K, 0); animateFlame(flameS, T, m, K, 0); animateFlame(flameG, T, m, K, fall);
    animateGlitter(goldG, goldBase, T, m, K, fall); animateGlitter(silG, silBase, T, m, K, 0);
    const lit = 1 - 0.55 * smooth(0, 1, D.burn), fk = 1 + 0.1 * flare;
    flameW.u.uAlpha.value = (0.93 + 0.07 * Math.sin(T * 2.6) * m) * lit * fk; flameS.u.uAlpha.value = (0.9 + 0.1 * Math.sin(T * 3.1) * m) * lit * fk;
    flameG.u.uAlpha.value = (0.95 + 0.05 * Math.sin(T * 2.2) * m) * (1 - smooth(0.25, 0.85, D.burn)) * (1 + 0.15 * flare);
    flameW.u.uTint.value.set(0.96 + 0.26 * smooth(0, 1, D.burn), 0.95 - 0.3 * smooth(0, 1, D.burn), 0.98 - 0.55 * smooth(0, 1, D.burn)); // the white flames go to embers' orange
    goldG.set(0.8 * (1 - smooth(0.04, 0.4, D.burn))); silG.set(0.8 * lit);
    fallG.set(smooth(0.03, 0.3, D.burn) * (1 - smooth(0.9, 1, D.burn)) * 0.85); fallG.obj.visible = D.burn > 0.02;
    sparks.set((0.75 + 0.25 * Math.sin(T * 1.3) * m) * (1 - smooth(0, 0.5, D.burn)));
    embers.set((0.1 + 0.06 * Math.sin(T * 1.7) * m + 0.7 * smooth(0, 0.6, D.burn) + 0.25 * D.watch) * (1 + flare * 0.3)); emberRise.set(0.15 * D.watch + 0.75 * smooth(0.2, 0.9, D.burn));
    dust.set(0.7); dots.set(0.85); sig.set(0.5);
    // the hand leaves the temple: it hinges about the elbow, away from his head (and the fur of the temple shows)
    {
      const e = smooth(0, 1, D.hand);
      handHost.rotation.z = -0.3 * e + 0.006 * Math.sin(T * 1.1) * m; handHost.position.set(pivot[0] + 0.1 * e, pivot[1] - 0.66 * e, pivot[2] + 0.2 * e); // (it lowers to rest on his shoulder, clear of the spinner at his right)
      temple.L.set(smooth(0.15, 0.8, D.hand) * 0.85);
    }
    // the spinners: a chaser runs round while one spins; chosen, it stops and is a still star (its thing glows)
    spinners.forEach((s, k) => {
      const still = D.spun[k], act = 1 - still;
      s.spin += dt * m * act * 1.5; s.host.rotation.z = -s.spin * 0.35 + 0.05 * Math.sin(T * 0.6 + k) * m * act;
      s.u.uAlpha.value = (0.72 + 0.28 * still) * (0.95 + 0.05 * Math.sin(T * 1.4 + k) * m);
      const ph = (T * 1.4 + k * 0.3) % 1;
      s.chase.forEach((L, i) => { const d = ((ph - i / 8) % 1 + 1) % 1, a = Math.pow(Math.max(0, 1 - d * 1.5), 1.6); L.set((m ? a : 0.35) * act * 0.95); });
      s.star.set(still * (0.55 + 0.25 * Math.sin(T * 1.8 + k) * m));
      const near = dist2(cp, spinW[k]); spotNear[k] = near;
      if (v.phase === 'spinners' && !spun[k] && near < NEAR) ctx.anchors['rm-giro-' + k] = spinHot[k]; else delete ctx.anchors['rm-giro-' + k];
    });
    // the spots: a marker always; the thing appears when a thought lands there; a ring when the thing is chosen
    thing.forEach((o, k) => {
      const pop = 1 + 0.25 * D.pop[k];
      o.Lm.set(D.glyph[k] * (0.92 + 0.08 * Math.sin(T * 1.9 + k) * m)); o.Lx.set(D.extra[k] * 0.9);
      o.host.scale.set(pop, pop, pop);
      marker[k].set((0.3 + 0.12 * Math.sin(T * 1.6 + k * 2) * m) * (1 - 0.5 * D.spun[k]) * (1 - 0.75 * Math.min(1, D.glyph[k])));
      const rp = (T * 0.45 + k / 3) % 1; spotRing[k].obj.scale.setScalar(0.7 + rp * 0.9); spotRing[k].set(D.ring[k] * (1 - rp) * (m ? 0.8 : 0.5));
    });
    // the thoughts: the current one hangs and bobs near the flames; a resolved one flies to the fire or down to its spot; a wrong one flies back up
    const camQ = cam.quaternion, home = root.localToWorld(tmpW.set(BUB_AT[0] + 0.05 * Math.sin(T * 0.7) * m, BUB_AT[1] + 0.07 * Math.sin(T * 0.9) * m, BUB_AT[2]));
    const hx = home.x, hy = home.y, hz = home.z;
    thoughts.forEach((th) => { th.p.mesh.visible = false; th.o.visible = false; });
    const put = (th, x, y, z, sc, a) => { // (the words a little nearer than their dark ellipse, both turned to the camera)
      const mesh = th.p.mesh, o = th.o; tmpV.set(cam.position.x - x, cam.position.y - y, cam.position.z - z).normalize(); o.position.set(x, y, z); mesh.position.set(x + tmpV.x * 0.04, y + tmpV.y * 0.04, z + tmpV.z * 0.04);
      o.quaternion.copy(camQ); mesh.quaternion.copy(camQ); mesh.scale.set(sc, sc, sc); o.scale.set(sc, sc, sc); mesh.visible = o.visible = a > 0.01; th.p.set(a); o.material.opacity = 0.93 * a;
    };
    if (curId >= 0 && ok) put(thoughts[curId], hx, hy, hz, 0.85 + 0.15 * D.enter, D.enter * (0.95 + 0.05 * Math.sin(T * 2.1) * m));
    for (let n = st.fl.length - 1; n >= 0; n--) {
      const q = st.fl[n], th = thoughts[q.i], dur = (q.kind === 'lado' ? 1.9 : q.kind === 'fuego' ? 1.2 : 0.9) * (world.reduced ? 0.45 : 1);
      q.t += dt / dur;
      const e = smooth(0, 1, q.t);
      let to, a;
      if (q.kind === 'fuego') { to = root.localToWorld(tmpV.set(FLAME_C[0], FLAME_C[1], FLAME_C[2] + 0.2)); a = q.t < 0.7 ? 1 : 1 - (q.t - 0.7) / 0.3; }
      else if (q.kind === 'lado') { const sp = th.t.spot, s0 = spotP[sp]; to = root.localToWorld(tmpV.set(s0[0], 0.55, s0[2] + 0.1)); a = q.t < 0.75 ? 1 : 1 - (q.t - 0.75) / 0.25; }
      else { to = tmpV.set(hx, hy + 1.1, hz); a = 1 - q.t; }
      const x = hx + (to.x - hx) * e, z = hz + (to.z - hz) * e, y = q.kind === 'lado' ? hy + (to.y - hy) * e * e + Math.sin(e * Math.PI) * 0.5 : hy + (to.y - hy) * e;
      put(th, x, y, z, q.kind === 'up' ? 1 : 1 - 0.55 * e, q.t < 1 ? clamp(a, 0, 1) : 0);
      if (q.t >= 1) { if (q.kind === 'fuego') D.flare = 1; if (q.kind === 'lado') { D.pop[th.t.spot] = 1; q.landed = true; } st.fl.splice(n, 1); }
    }
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      cam.updateMatrixWorld();
      const tmpF = V3(0, 0, -1).applyQuaternion(cam.quaternion), tmpU = V3(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(tmpQ.set(FLAME_C[0], FLAME_C[1], FLAME_C[2])), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh, ...thoughts.map((th) => th.p.mesh), ...thoughts.map((th) => th.o)],
    info: () => ({
      segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, thoughts: thoughts.length, spots: thing.length, spinners: spinners.length, wide, f,
      texture: [body, hand, flameW, flameG, flameS].map((g) => g.mesh.material.uniforms.uTex.value.image.width + 'x' + g.mesh.material.uniforms.uTex.value.image.height).join(' ') + ' + ' + spinners.map((s) => s.m.material.uniforms.uTex.value.image.width + 'x' + s.m.material.uniforms.uTex.value.image.height).join(' '),
      spotDist: spotNear.map((x) => +x.toFixed(2)), spotAt: spotW.map((w) => ({ x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: +w.z.toFixed(2) })), spinAt: spinW.map((w) => ({ x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: +w.z.toFixed(2) })),
      bubbleAt: { x: +bubbleW.x.toFixed(2), y: +bubbleW.y.toFixed(2), z: +bubbleW.z.toFixed(2) }, flames: { x: +flameAt.x.toFixed(2), y: +flameAt.y.toFixed(2), z: +flameAt.z.toFixed(2) },
      burn: +D.burn.toFixed(2), hand: +D.hand.toFixed(2), still: D.spun.map((x) => +x.toFixed(2)), glyph: D.glyph.map((x) => +x.toFixed(2)), extra: D.extra.map((x) => +x.toFixed(2)), shown: st.cur, flying: st.fl.length, gold: goldPts.length, silver: silPts.length,
    }),
  };
};
