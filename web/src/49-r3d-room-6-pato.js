// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 5 · «UN POCO MÁS CEDIENDO»  (the cover, as a smug duck with a cigarette: chalk tones on black, glitter only on the ring and the suspenders)
//   The drawing: a duck with heavy half-closed eyelids, a long white-outlined bill, hatched head feathers and a dark cheek, smoking a
//   cigarette in the fingers of his left wing; the smoke curls up into a heart and loops. His right wing rests on his hip with a ring of
//   silver glitter; he has a dark round belly with a white highlight, silver glitter suspenders, feathered wing edges, crossed legs with
//   hatched scales, fluffy slippers and a slanted line (a bench) at his left. Five white filled speech bubbles float around him (top,
//   right, a small one at the left, a big one lower left, one lower right), there are tiny dots in the sky and "11:11" at the corner.
//   The paper in the photo is a black sheet in a plastic sleeve on a blanket (turned, keystoned, only part of it in the frame), so the
//   tones were traced from a rectified copy (49-r3d-room-6-pato-art.js; the shared tone helpers, 49-r3d-room-0-tones.js, decode and paint them).
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels
//   from there. Layers share that eye, and each one sits at the depth that suits it:
//     · the layers split the cover's pixels with soft masks that add up to one, so from the arrival spot their sum is the cover and no edge shows;
//     · the duck: a standing relief cut out by his silhouette (head, belly, the hands forward, the rear leg back),
//     · the ground: the bench lines and the floor under his slippers lie on the water's floor (their rows are real ground rows),
//     · the sky: the tiny dots, a flat layer behind him,
//     · the movers, cut from the same tones: the smoke (it curls), the heart in it (it pulses and, at the end, drifts to the house), the
//       eyebrow (it stays) and eyelid (it blinks, and both give way to the open eye) and the five bubbles, each at its own depth (some behind him, some to the sides),
//     · chalk ribbons for what is told and what moves: the open eye, the loose bricks, the house, the roof, its fire, rings and glitter.
//   From the arrival spot the room is the cover; walking in, it opens up. world.room.v holds the targets (the controller, 59-room-6-…,
//   sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, BOT the cover row of the top of his slippers (it stands 0.15 m above the floor), Z0 how far (m) the duck's plane is from the eye, ARR where the visitor arrives (z). */
const PK = { H: 1.6, cx: 550, BOT: 980, Z0: 5.5, ARR: 2.7 };
/** Where the visitor stands when a floor opens is the eye; the duck is Z0 metres ahead of it. */
const PK_SET = { x: 0, y: 1.6, z: PK.ARR + PK.Z0 };
/** The lens depends on the screen: a wide one keeps the whole drawing between the title and the two-line arrival line at 1450 cover px of focal length, a phone's narrow view at 1500. The set's z never changes. */
function pkLens(a) { return coverLens(PK, a, { f: 1450, row: 585, sx: 0.42, sy: 0.5 }, { f: 1500, row: 640, sx: 0.5, sy: 0.5 }); }
/**
 * The five bubbles, each with the Pato's line, the chapter's reply and the Pato's own logic. px, py: where the bubble is on the cover (the middle of its white);
 * Z: how far from the eye it hangs (the duck is at 5.5: 7 and 8 are behind him, 4.4 to 5 in front of his plane, to the sides); hull: its outline in PK_BUBBLES.
 */
const PK_VOICES = [
  { id: 'tope', px: 450, py: 312, Z: 8.0, name: 'el globo de arriba, a la izquierda de su cabeza', line: 'Estás ciego. No ves lo que hay detrás.', yes: 'Amar no es negocio.', no: 'Tenés razón: todo es un negocio.' },
  { id: 'derecha', px: 843, py: 447, Z: 5.0, name: 'el globo de la derecha', line: 'Todos quieren algo.', yes: 'Amar es perder un poco de uno mismo para encontrarse en otro.', no: 'Entonces hay que sacar ventaja primero.' },
  { id: 'chico', px: 212, py: 588, Z: 4.6, name: 'el globito de la izquierda', line: 'No te conviene.', yes: 'Es elegir, una y otra vez.', no: 'Si no conviene, no se elige.' },
  { id: 'grande', px: 268, py: 798, Z: 7.0, name: 'el globo grande de abajo, a la izquierda', line: 'Tenés que ganar esa discusión.', yes: 'No me interesa ganar todas las discusiones, ni tener razón.', no: 'Tengo razón y la voy a ganar.' },
  { id: 'abajo', px: 862, py: 794, Z: 4.4, name: 'el globo de abajo, a la derecha', line: 'Los números no cierran.', yes: 'Elegir cuidar, aunque no cierren los números, es mi forma de amar.', no: 'Si no cierran los números, no vale la pena.' },
];
/** The house: its centre on the floor (the set's own metres: x to the viewer's right, z toward the visitor), the five brick places (x, y of the base) and the loose bricks' heap. */
const PK_HOUSE = { x: -2.1, z: 0.2, bw: 0.46, bh: 0.23, slots: [[-0.47, 0], [0, 0], [0.47, 0], [-0.235, 0.235], [0.235, 0.235]] };
const PK_PILE = [[0.1, 0.07], [0.36, 0.07], [0.62, 0.07], [0.23, 0.19], [0.49, 0.19]]; // (x, y of the centre; z is PK_PILE_Z)
const PK_PILE_Z = 0.5;
/** Where the ring is (the glitter on his right wing's hand), where the heart is in the smoke, where his eye is. */
const PK_RING = [710, 665], PK_HEART = [262, 352], PK_EYE = [690, 331];

ROOM_SETS['pato'] = function buildPato(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = PK;
  const { wide, f, yh } = pkLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(0, 0, PK_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(66);
  const WC = lite ? [1.2, 1.8, 2.5] : [1.6, 2.4, 3.2];
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; const L = kit.lines(rib, o); L.core.layers.set(1); return L; }; // (layer 1: not mirrored by the water: the cover has no reflection)
  const mp = (Z) => Z / f; // metres per cover pixel at depth Z

  // ---- how far each layer stands from the eye (the cover's pixels → the set, the tones painted into textures and the grid meshes are the shared helpers of 49-r3d-room-0-tones.js) ----
  const ground = (py) => (V.H * f) / Math.max(8, py - yh); // depth of a point lying on the ground at cover row py
  const bump = (px, py, cx, cy, rx, ry) => Math.exp(-(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2));
  /** How far the duck's body is from his plane: the head and the belly forward, his two hands forward, the slippers a little forward, the rear leg back. */
  const Zm = (px, py) => V.Z0 - 0.55 * bump(px, py, 610, 330, 150, 130) - 0.55 * bump(px, py, 570, 690, 170, 140) - 0.4 * bump(px, py, 300, 590, 80, 100) - 0.3 * bump(px, py, 720, 670, 90, 80) - 0.25 * bump(px, py, 660, 960, 110, 60) + 0.3 * bump(px, py, 520, 900, 50, 100);

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, tonePts, region, mat, gridMesh } = coverTones(ctx, { V, lens: { f, yh }, decode: pkDecode, fill: PK_FILL, ts: [1.05, 1.85], root, rnd });
  const Pm = (px, py) => P(px, py, Zm(px, py));
  const poly = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; // (a rectangle as a polygon)
  const bbOf = (pts, m = 3) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [Math.floor(a - m), Math.floor(b - m), Math.ceil(c + m), Math.ceil(d + m)]; };
  const SMOKE_P = [[100, 120], [440, 120], [440, 508], [340, 508], [340, 538], [100, 538]];
  const HEART_R = [198, 295, 325, 410];
  // his eye: the brow stays while the lid and what is under it blink (and the whole of it gives way to the open eye)
  const BROW_P = [[664, 304], [666, 293], [678, 286], [695, 283], [712, 285], [721, 293], [717, 303], [708, 306], [695, 300], [680, 302], [670, 309]];
  const LID_P = [[660, 326], [668, 320], [690, 315], [710, 309], [724, 306], [730, 311], [727, 320], [718, 326], [712, 332], [706, 340], [696, 345], [684, 345], [674, 338], [666, 334], [658, 332]];
  // The cover's pixels are split among the layers with soft masks that add up to one (a layer takes what the layers before it left): the five bubbles, the heart, the eyelid,
  // the smoke, the duck, and what is left is the ground below row 880 and the sky above it. A polygon's edge is blurred by the same amount wherever it is used.
  const CUTS = [...PK_BUBBLES.map((p) => [p, 3]), [poly(HEART_R), 4], [BROW_P, 2], [LID_P, 2], [SMOKE_P, 4], [PK_DUCK, 6]];
  const [BUB0, HEART_K, BROW_K, EYE_K, SMOKE_K, DUCK_K] = [0, 5, 6, 7, 8, 9];
  const SPLIT_P = poly([30, 30, 1020, 880]), SPLIT_B = 10;
  /** The masks of layer k (k = CUTS.length: the left-overs, 'in' the sky or 'out' of it): everything before it is cut out and, for a layer of its own, its polygon is cut in; only the polygons that reach rect r count. */
  const cuts = (k, r, rest) => {
    const near = ([p, b]) => { const q = bbOf(p, 3 * b); return q[2] >= r[0] && q[0] <= r[2] && q[3] >= r[1] && q[1] <= r[3]; };
    const m = CUTS.slice(0, k).filter(near).map(([p, b]) => ['out', [p], b]);
    if (k < CUTS.length) m.push(['in', [CUTS[k][0]], CUTS[k][1]]); else m.push([rest, [SPLIT_P], SPLIT_B]);
    return m;
  };
  const grown = (p, b) => bbOf(p, 3 * b + 1); // (a texture's rectangle: the polygon and the reach of its blur)
  const SMOKE_R = grown(SMOKE_P, CUTS[SMOKE_K][1]);

  // the duck: a relief cut out by his silhouette; the eye, the bubbles and the smoke are cut out of it (they are the movers)
  const DK_R = grown(PK_DUCK, CUTS[DUCK_K][1]);
  const body = gridMesh(DK_R, lite ? 34 : 50, lite ? 38 : 58, Zm, region(DK_R, { masks: cuts(DUCK_K, DK_R) }));
  // the ground: the bench lines and the floor under the slippers lie on the water's floor; the duck is cut out of it
  const GR_R = [30, 860, 1020, 1100];
  const groundL = gridMesh(GR_R, lite ? 28 : 44, lite ? 6 : 10, (px, py) => ground(py) * 0.985, region(GR_R, { masks: cuts(CUTS.length, GR_R, 'out') }));
  // the sky: the tiny dots, a flat layer behind him
  const SK_R = [30, 30, 1020, 900];
  const sky = gridMesh(SK_R, 8, 8, () => 8.8, region(SK_R, { ts: 0.7, masks: cuts(CUTS.length, SK_R, 'in') }));
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── movers: cut from the same tones ─────────────────────────────
  const mover = (k, Zd, o = {}) => {
    const rect = grown(CUTS[k][0], CUTS[k][1]), w = rect[2] - rect[0], h = rect[3] - rect[1], c = P((rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2, Zd), host = grp(root, c[0], c[1], c[2]);
    const geo = ctx.keep(new THREE.PlaneGeometry(w * mp(Zd), h * mp(Zd)));
    const mk = (tex) => { const M = mat(tex), m = new THREE.Mesh(geo, M.m); m.frustumCulled = false; m.layers.set(1); host.add(m); return { m, u: M.u }; };
    const paint = () => region(rect, { ts: o.ts, gain: o.gain, masks: cuts(k, rect) });
    const a = mk(paint());
    const b = o.after ? mk(o.after(paint(), rect)) : null;
    return { host, a, b, home: c, w: w * mp(Zd), h: h * mp(Zd), rect, Zd };
  };
  /** Black words inside a bubble, wrapped to fit (the bubbles are additive white, so the words are the dark that is left in them); drawn on a painted texture, in cover pixels. */
  const speak = (v) => (tex, r) => {
    const c = tex.image.getContext('2d'), words = v.line.split(' '), W = v.bw * 0.74, Hh = v.bh * 0.66;
    c.save(); c.scale(tex.image.width / (r[2] - r[0]), tex.image.height / (r[3] - r[1])); c.translate(-r[0], -r[1]);
    for (let fs = 30; fs >= 9; fs -= 1) {
      c.font = FONT_DISPLAY(fs, '', 500); const rows = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width <= W || !cur) cur = t; else { rows.push(cur); cur = w; } }
      rows.push(cur);
      if (rows.length * fs * 1.12 <= Hh && rows.every((r2) => c.measureText(r2).width <= W + 1)) {
        c.fillStyle = '#0a0a0a'; c.textAlign = 'center'; c.textBaseline = 'middle';
        rows.forEach((r2, i) => c.fillText(r2, v.px, v.py + (i - (rows.length - 1) / 2) * fs * 1.12 + fs * 0.04));
        break;
      }
    }
    c.restore(); tex.needsUpdate = true; return tex;
  };
  const bubbles = PK_VOICES.map((v, k) => {
    // the white of the bubble (PK_WHITE) gives its measure and its outline
    const white = PK_WHITE[k], bb = bbOf(white, 0);
    const w2 = { ...v, bw: bb[2] - bb[0], bh: bb[3] - bb[1], px: (bb[0] + bb[2]) / 2, py: (bb[1] + bb[3]) / 2 - 2 };
    const M = mover(BUB0 + k, v.Z, { after: speak(w2), ts: lite ? 1.1 : 1.5 });
    return { ...M, k, v, outline: white, w2 };
  });
  const SMK = 1.5; // (a lift for the smoke's thin curls, which are fainter than the white paint)
  const smoke = gridMesh(SMOKE_R, lite ? 12 : 20, lite ? 14 : 24, () => V.Z0 + 0.3, region(SMOKE_R, { gain: SMK, masks: cuts(SMOKE_K, SMOKE_R) }));
  const heart = mover(HEART_K, V.Z0 + 0.3, { gain: SMK });
  const eyeZ0 = Zm(PK_EYE[0], PK_EYE[1]) - 0.02, brow = mover(BROW_K, eyeZ0), eye = mover(EYE_K, eyeZ0);

  // ───────────────────────────── chalk helpers ─────────────────────────────
  const ell = (cx, cy, rx, ry, n = 14, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot), 0]; });
  const ring = (R, r, w, al, n = 30) => R.poly(ell(0, 0, r, r, n), w, al, true);
  /** Cover pixels (relative to a centre, y down) to a ribbon's points at depth Zd: px, py offsets. */
  const px2 = (Zd) => (dx, dy) => [dx * mp(Zd), -dy * mp(Zd), 0];

  // ───────────────────────────── the eyes: the cover's half-closed lid, a blink, and an open eye (his mood) ─────────────────────────────
  const eyeZ = eye.Zd, E2 = px2(eyeZ);
  const eyeOpen = (() => {
    const R = kit.ribbons(20), cx = PK_EYE[0] - (eye.rect[0] + eye.rect[2]) / 2, cy = PK_EYE[1] - (eye.rect[1] + eye.rect[3]) / 2;
    const lid = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * Math.PI; lid.push(E2(cx + Math.cos(t) * -20, cy - Math.sin(t) * 15)); }
    R.poly(lid, WC[1], 1);
    const low = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * Math.PI; low.push(E2(cx + Math.cos(t) * -19, cy + Math.sin(t) * 9)); }
    R.poly(low, WC[0], 0.9);
    R.poly(ell(cx, cy + 1, 6.5, 6.5, 14).map((p) => E2(p[0], p[1])), WC[1], 1, true);
    R.poly(ell(cx, cy + 1, 2.6, 2.6, 8).map((p) => E2(p[0], p[1])), WC[2], 1, true);
    const brow = []; for (let i = 0; i <= 10; i++) { const t = i / 10; brow.push(E2(cx - 24 + t * 50, cy - 34 - Math.sin(t * Math.PI) * 9 + t * 4)); }
    R.poly(brow, WC[1], 1);
    const host = grp(root, eye.home[0], eye.home[1], eye.home[2] + 0.03), L = lines(R, { glow: true }); host.add(L.obj);
    return { host, L };
  })();
  const blink = (() => {
    const R = kit.ribbons(21), cx = PK_EYE[0] - (eye.rect[0] + eye.rect[2]) / 2, cy = PK_EYE[1] - (eye.rect[1] + eye.rect[3]) / 2, pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(E2(cx - 20 + t * 40, cy + 6 + Math.sin(t * Math.PI) * 4)); }
    R.poly(pts, WC[2], 1);
    const host = grp(root, eye.home[0], eye.home[1], eye.home[2] + 0.03), L = lines(R, { glow: true }); host.add(L.obj);
    return { host, L };
  })();

  // ───────────────────────────── the house: five places, a roof, a fire; and the five loose bricks ─────────────────────────────
  const H = PK_HOUSE, house = grp(root, H.x, 0, H.z);
  const brickBox = (R, w, h, d, al) => { RG.box(R, -w / 2, -h / 2, -d / 2, w / 2, h / 2, d / 2, WC[1], al); R.seg([-w / 2, -h / 2, d / 2], [w / 2, h / 2, d / 2], WC[0], al * 0.5); };
  const places = H.slots.map(([x, y], j) => { // a dashed place for each brick (it fades when the brick is laid)
    const R = kit.ribbons(30 + j), x0 = x - H.bw / 2, x1 = x + H.bw / 2, y0 = y, y1 = y + H.bh;
    for (const [a, b] of [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]]) for (let t = 0; t < 1; t += 0.2) R.seg([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0], [a[0] + (b[0] - a[0]) * (t + 0.1), a[1] + (b[1] - a[1]) * (t + 0.1), 0], WC[0], 0.8);
    const L = lines(R, { glow: false }); house.add(L.obj); return { L, x, y };
  });
  const roof = (() => {
    const R = kit.ribbons(40), top = H.slots[3][1] + H.bh + 0.02;
    R.poly([[-0.82, top, 0.02], [0, top + 0.5, 0.02], [0.82, top, 0.02]], WC[2], 1);
    R.poly([[-0.72, top + 0.04, 0.02], [0, top + 0.43, 0.02], [0.72, top + 0.04, 0.02]], WC[0], 0.7);
    for (const x of [-0.45, -0.22, 0.22, 0.45]) R.seg([x, top + 0.01, 0.02], [x * 0.22, top + 0.1 + (0.5 - Math.abs(x)) * 0.8, 0.02], WC[0], 0.6);
    R.poly([[0.44, top + 0.2, 0.02], [0.44, top + 0.52, 0.02], [0.6, top + 0.52, 0.02], [0.6, top + 0.1, 0.02]], WC[1], 0.9);
    const L = lines(R, { glow: true }); house.add(L.obj); return { L, top };
  })();
  const fireP = [0, roof.top + 0.1, 0.05];
  const flame = (() => { // the fire under the roof: a flame of chalk and rising sparks (warm)
    const R = kit.ribbons(41);
    R.poly([[0, 0, 0], [-0.07, 0.07, 0], [-0.05, 0.16, 0], [0, 0.27, 0], [0.05, 0.17, 0], [0.08, 0.07, 0]], WC[2], 1, true);
    R.poly([[0, 0.02, 0], [-0.03, 0.08, 0], [0, 0.15, 0], [0.03, 0.08, 0]], WC[1], 0.9, true);
    const host = grp(house, fireP[0], fireP[1], fireP[2]), L = lines(R, { glow: true, tint: [1.15, 0.84, 0.5] }); host.add(L.obj);
    const sp = kit.points(Array.from({ length: lite ? 8 : 16 }, () => [(rnd() - 0.5) * 0.12, 0.1, 0.02, 0.05 + rnd() * 0.04, 0.5 + rnd() * 0.5, rnd(), 0]), { mode: 1, rise: [0, 0.5, 0], speed: 0.4, spread: 0.12, tint: [1.1, 0.8, 0.5] });
    host.add(sp.obj);
    return { host, L, sp };
  })();
  const bricks = PK_PILE.map((p, j) => { // a loose brick: it drops from its bubble to the heap, and is later laid in its place
    const R = kit.ribbons(50 + j); brickBox(R, H.bw, H.bh, 0.2, 1);
    const host = grp(root, 0, 0, 0), L = lines(R, { glow: true }); host.add(L.obj); host.visible = false;
    return { host, L, from: [0, 0, 0] };
  });
  const bubbleP = bubbles.map((b) => P(b.w2.px, b.w2.py, b.v.Z));
  const pilePos = PK_PILE.map((p) => [p[0], p[1], PK_PILE_Z]);
  const placePos = H.slots.map(([x, y]) => [H.x + x, y + H.bh / 2, H.z]);
  // the bubble outlines (the emptied bubble keeps its line), the ring's pulse, the heart's pulse
  bubbles.forEach((b) => {
    const R = kit.ribbons(60 + b.k), at = b.w2, c = [at.px, at.py], q = px2(b.v.Z), pc = P(c[0], c[1], b.v.Z);
    R.poly(b.outline.map((p) => q(p[0] - c[0], p[1] - c[1])), WC[1], 1, true);
    const L = lines(R, { glow: false }), g = grp(root, pc[0], pc[1], pc[2]); g.add(L.obj); b.line = { host: g, L, off: [pc[0] - b.home[0], pc[1] - b.home[1], pc[2] - b.home[2]] };
  });
  const ringHost = grp(root, ...Pm(PK_RING[0], PK_RING[1]));
  const ringRings = Array.from({ length: 2 }, (_, i) => { const R = kit.ribbons(70 + i); ring(R, 25 * mp(V.Z0) + 0.08, WC[1], 1); const L = lines(R, { glow: true }); ringHost.add(L.obj); L.obj.position.z = 0.1; return L; });
  const heartRing = (() => { const R = kit.ribbons(72); ring(R, 70 * mp(V.Z0 + 0.3), WC[0], 0.9, 34); const L = lines(R, { glow: true }); heart.host.add(L.obj); L.obj.position.z = 0.05; return L; })();

  // ───────────────────────────── glitter: the ring and the suspenders (the only glitter of this cover) ─────────────────────────────
  const glitterAt = (rows) => kit.points(rows, { shape: 3, twinkle: 0.95, tint: [0.96, 0.97, 1.05] });
  const ringG = glitterAt(Array.from({ length: lite ? 14 : 30 }, () => { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 24 * mp(V.Z0); return [Math.cos(a) * r, Math.sin(a) * r * 0.85, 0.05, 0.03 + rnd() * 0.05, 0.6 + rnd() * 0.4, rnd(), 0]; }));
  ringHost.add(ringG.obj);
  const suspHost = grp(root, ...Pm(683, 810));
  const suspG = glitterAt(Array.from({ length: lite ? 18 : 40 }, () => { const strap = rnd() < 0.5, x = (strap ? 667 : 697) + (rnd() - 0.5) * (strap ? 18 : 22), y = 810 + (rnd() - 0.5) * (strap ? 100 : 90), p = Pm(x, y), q = Pm(683, 810); return [p[0] - q[0], p[1] - q[1], 0.06, 0.025 + rnd() * 0.04, 0.5 + rnd() * 0.5, rnd(), 0]; }));
  suspHost.add(suspG.obj);

  // ───────────────────────────── the word, the corner, the dust, the page ─────────────────────────────
  const word = kit.plane(ctx.canvasTex(384, 160, (c, w, hh) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    c.fillStyle = '#f2efe8'; c.beginPath(); c.ellipse(w / 2, hh / 2 - 8, w * 0.46, hh * 0.38, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(w * 0.3, hh * 0.7); c.lineTo(w * 0.22, hh * 0.95); c.lineTo(w * 0.46, hh * 0.78); c.closePath(); c.fill();
    c.font = FONT_DISPLAY(58, '', 600); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#0a0a0a'; c.fillText('pollerudo', w / 2, hh / 2 - 6);
  }), 1.5, 0.625, { alpha: 0 });
  ctx.scene.add(word.mesh); word.mesh.visible = false;
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(60, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 8; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 3); }), 0.3, 0.115, { alpha: 0.5 });
  { const g = ground(1070), p = [((1010 - V.cx) * g) / f, 0.08, V.Z0 - g]; sig.mesh.position.set(p[0], p[1], p[2]); sig.mesh.rotation.x = -1.1; root.add(sig.mesh); }
  const dust = (() => { const rows = []; for (let i = 0; i < (lite ? 10 : 24); i++) { const px = 120 + rnd() * 820, py = 200 + rnd() * 700, p = P(px, py, V.Z0 + 0.6 + rnd() * 2); rows.push([p[0], p[1], p[2], 0.04 + rnd() * 0.05, 0.25 + rnd() * 0.3, rnd(), 0]); } return kit.points(rows, { mode: 1, rise: [0.04, 0.22, 0], speed: 0.05, spread: 0.2, twinkle: 0.5, tint: [0.88, 0.9, 1] }); })();
  root.add(dust.obj);
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const bubbleW = bubbleP.map((p, k) => { const w = W3(p), sz = Math.max(0.7, 1.25 * Math.max(bubbles[k].w2.bw, bubbles[k].w2.bh) * mp(bubbles[k].v.Z)); w.y = clamp(w.y, 1.25, 2.3); return { w, sz }; });
  const houseW = W3([H.x, 0.62, H.z + 0.1]), ringW = W3([...Pm(PK_RING[0], PK_RING[1])].map((v, i) => (i === 2 ? v + 0.12 : v))), heartW = W3(P(PK_HEART[0], PK_HEART[1], V.Z0 + 0.4));
  ctx.anchors['rm-anillo'] = { pos: ringW, w: Math.max(0.7, 70 * mp(V.Z0)), h: Math.max(0.7, 70 * mp(V.Z0)) };
  ctx.anchors['rm-casa'] = { pos: houseW, w: 2.1, h: 1.5 };
  ctx.anchors['rm-corazon'] = { pos: heartW, w: Math.max(0.9, 130 * mp(V.Z0 + 0.3)), h: Math.max(0.9, 130 * mp(V.Z0 + 0.3)) };
  { const wp = W3(P(820, 250, V.Z0 - 0.8)); word.mesh.position.copy(wp); }
  const NEAR = 4.2; // how near (m) a bubble shows its hotspot
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // the duck is solid: a row of posts along his body (the visitor walks around him, not through him)
  const solids = []; for (let px = 330; px <= 900; px += 70) solids.push({ kind: 'circle', x: -P(px, 700, V.Z0)[0], z: PK_SET.z, r: Math.max(0.3, 40 * mp(V.Z0)) });

  // ───────────────────────────── camera poses ─────────────────────────────
  const LOOK = {
    casa: { t: () => [H.x, 0.62, H.z], w: 2.7, h: 1.8, up: 0.05 },
    anillo: { t: () => Pm(PK_RING[0], PK_RING[1]), w: 1.5, h: 1.3, up: 0 },
    ...Object.fromEntries(bubbles.map((b, k) => ['globo-' + k, { t: () => bubbleP[k], w: Math.max(1.5, b.w * 1.6), h: Math.max(1.2, b.h * 1.8), up: 0 }])),
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
  const D = { bub: [0, 0, 0, 0, 0], shake: [0, 0, 0, 0, 0], drop: [0, 0, 0, 0, 0], lay: [0, 0, 0, 0, 0], roof: 0, open: 0, fin: 0, pol: 0, near: [0, 0, 0, 0, 0] };
  const st = { T: 0, init: false, tick: 0, nextBlink: 7, blinkAt: -9, from: [0, 1, 2, 3, 4].map(() => [0, 0, 0]) };
  const tmpV = V3(), tmpQ = V3();
  const bubNear = [Infinity, Infinity, Infinity, Infinity, Infinity]; // (a distance not measured yet reads as out of reach: the first frame fills them in)
  const fromOf = (v, j) => (v.said && v.said[j] >= 0 ? bubbleP[v.said[j]] : null);
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.bub), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3, cam = ctx.camera, cp = world.cam;
    if (ok) {
      if (!st.init) { D.bub = v.bub.slice(); D.drop = v.drop.slice(); D.lay = v.lay.slice(); D.roof = v.roof; D.open = v.open; D.fin = v.fin; st.init = true; }
      for (let k = 0; k < 5; k++) { D.bub[k] = damp(D.bub[k], v.bub[k], rate * 0.9, dt); D.shake[k] = damp(D.shake[k], v.shake[k], rate * 1.4, dt); D.drop[k] = damp(D.drop[k], v.drop[k], rate * 0.55, dt); D.lay[k] = damp(D.lay[k], v.lay[k], rate * 0.7, dt); }
      D.roof = damp(D.roof, v.roof, rate * 0.7, dt); D.open = damp(D.open, v.open, rate * 0.9, dt); D.fin = damp(D.fin, v.fin, rate * 0.45, dt); D.pol = damp(D.pol, v.pol, rate * 1.1, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T, solved = D.fin;
    const br = 0.94 + 0.06 * Math.sin(T * 0.8) * m;
    body.u.uAlpha.value = br; groundL.u.uAlpha.value = br; sky.u.uAlpha.value = 0.9 + 0.1 * Math.sin(T * 0.5) * m; smoke.u.uAlpha.value = (0.86 + 0.14 * Math.sin(T * 1.1) * m) * (1 - 0.35 * solved);
    // the smoke curls: it sways more the higher it is
    if (m && (!lite || (st.tick++ & 1) === 0)) {
      const arr = smoke.attr.array, S = smoke.r;
      for (let j = 0; j <= smoke.ny; j++) { const py = S[1] + ((S[3] - S[1]) * j) / smoke.ny, w = 1 - (py - S[1]) / (S[3] - S[1]); for (let i = 0; i <= smoke.nx; i++) { const k = (j * (smoke.nx + 1) + i) * 3; arr[k] = smoke.base[k] + Math.sin(T * 0.9 + py * 0.011 + i * 0.4) * 0.07 * w * w + Math.sin(T * 0.45 + py * 0.02) * 0.05 * w; arr[k + 1] = smoke.base[k + 1] + Math.sin(T * 0.7 + i * 0.5) * 0.02 * w; } }
      smoke.attr.needsUpdate = true;
    }
    // the heart pulses; in the finale it drifts into the house and goes out into its fire
    {
      const pu = 1 + 0.05 * Math.sin(T * 2.4) * m, e = smooth(0, 1, D.fin), hp = heart.home, to = [H.x, fireP[1] + 0.3, H.z + 0.05];
      const p = [hp[0] + (to[0] - hp[0]) * e, hp[1] + (to[1] - hp[1]) * e + Math.sin(e * Math.PI) * 0.7, hp[2] + (to[2] - hp[2]) * e];
      heart.host.position.set(p[0] + 0.06 * Math.sin(T * 0.9) * m * (1 - e), p[1] + 0.05 * Math.sin(T * 1.3) * m * (1 - e), p[2]);
      heart.host.scale.setScalar(pu * (1 - 0.65 * e));
      heart.a.u.uAlpha.value = 0.9 * (1 - smooth(0.82, 1, D.fin)) * (0.85 + 0.15 * Math.sin(T * 2.4) * m);
      heartRing.set((v.phase === 'finale' ? 0.5 + 0.3 * Math.sin(T * 2.4) * m : 0) * (1 - e));
    }
    // the eyelid: half closed as on the cover (it blinks slowly now and then), open when his mood is to be asked
    {
      if (m && T > st.nextBlink) { st.blinkAt = T; st.nextBlink = T + 5 + rnd() * 4; }
      const bl = m ? Math.max(0, Math.sin(clamp((T - st.blinkAt) / 0.7, 0, 1) * Math.PI)) : 0, op = D.open;
      brow.a.u.uAlpha.value = 1 - op; eye.a.u.uAlpha.value = (1 - op) * (1 - 0.95 * bl); eyeOpen.L.set(op); blink.L.set((1 - op) * bl * 0.95);
    }
    // the bubbles: each hangs and bobs; a right answer empties it (its fill and words fade, its line stays) and its brick drops
    bubbles.forEach((b, k) => {
      const d = dist2(cp, bubbleW[k].w); bubNear[k] = d;
      const e = D.bub[k], near = Math.min(1, Math.max(0, (NEAR + 0.3 - d) / 1.0)), sh = D.shake[k] * Math.sin(T * 38) * 0.05 * m;
      b.host.position.set(b.home[0] + 0.05 * Math.sin(T * 0.7 + k * 1.9) * m + sh, b.home[1] + 0.07 * Math.sin(T * 0.9 + k * 1.3) * m, b.home[2]);
      b.host.rotation.z = 0.035 * Math.sin(T * 0.6 + k) * m;
      b.line.host.position.set(b.host.position.x + b.line.off[0], b.host.position.y + b.line.off[1], b.host.position.z + b.line.off[2]); b.line.host.rotation.z = b.host.rotation.z;
      const fill = (1 - e) * (0.97 + 0.03 * Math.sin(T * 1.7 + k) * m);
      b.a.u.uAlpha.value = fill * (1 - near); b.b.u.uAlpha.value = fill * near; b.line.L.set(e * 0.85);
      if (D.bub[k] < 0.5 && d < NEAR && v.phase === 'voices') ctx.anchors['rm-globo-' + k] = { pos: bubbleW[k].w, w: bubbleW[k].sz, h: bubbleW[k].sz }; else delete ctx.anchors['rm-globo-' + k];
    });
    // the bricks: they drop from their bubble to the heap, and are laid in the house when asked
    bricks.forEach((br2, j) => {
      const dr = D.drop[j], ly = D.lay[j], src = fromOf(v, j) || st.from[j];
      if (fromOf(v, j)) st.from[j] = fromOf(v, j);
      br2.host.visible = dr > 0.01;
      if (!br2.host.visible) return;
      const fall = dr * dr, a = lerp3(src, pilePos[j], fall), b2 = lerp3(a, placePos[j], smooth(0, 1, ly));
      b2[1] += Math.sin(ly * Math.PI) * 0.3 * (ly < 1 ? 1 : 0);
      br2.host.position.set(b2[0], b2[1], b2[2]);
      const sc = 0.55 + 0.45 * smooth(0, 1, ly); br2.host.scale.setScalar(sc * (0.5 + 0.5 * Math.min(1, dr * 1.4)));
      br2.host.rotation.set(0.5 * (1 - dr) * m, (1 - ly) * 0.2 * Math.sin(j) , (1 - dr) * 0.8 * m);
      br2.L.set(0.55 + 0.45 * Math.min(1, dr + ly));
      places[j].L.set((0.3 + 0.15 * Math.sin(T * 1.6 + j) * m) * (1 - ly) * (v.phase === 'bricks' || v.phase === 'voices' ? 1 : 0.5));
    });
    for (let j = 0; j < 5; j++) if (!bricks[j].host.visible) places[j].L.set((0.28 + 0.12 * Math.sin(T * 1.6 + j) * m) * (v.phase === 'voices' ? 0.7 : 1));
    roof.L.set(D.roof * (0.9 + 0.1 * Math.sin(T * 1.3) * m));
    // the fire: lit by the heart (the finale)
    const fl = smooth(0.7, 1, D.fin); flame.L.set(fl * (0.8 + 0.2 * Math.sin(T * 9) * m)); flame.host.scale.set(1 + 0.12 * Math.sin(T * 7) * m, 1 + 0.2 * Math.sin(T * 8.3) * m, 1); flame.sp.set(fl); flame.host.visible = fl > 0.01;
    // the ring: it glitters always; while it is to be touched two rings pulse out of it
    ringG.set(0.8 + 0.2 * Math.sin(T * 2.6) * m); suspG.set(0.75 + 0.25 * Math.sin(T * 2.1 + 1) * m);
    const askRing = v.phase === 'ring' ? 1 : 0;
    ringRings.forEach((L, i) => { const ph = (T * 0.5 + i / 2) % 1; L.obj.scale.setScalar(0.6 + ph * 1.5); L.set(askRing * (1 - ph) * 0.8 * (m ? 1 : 0.5)); L.obj.visible = askRing > 0; });
    // the word: «pollerudo», when the ring is touched
    word.set(D.pol * 0.95); word.mesh.visible = D.pol > 0.02;
    if (word.mesh.visible) word.mesh.quaternion.copy(cam.quaternion);
    dust.set(0.7); sig.set(0.5);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      cam.updateMatrixWorld();
      const tmpF = V3(0, 0, -1).applyQuaternion(cam.quaternion), tmpU = V3(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(tmpQ.set(houseW.x, 1.2, houseW.z)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh, word.mesh],
    info: () => ({
      segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, bubbles: bubbles.length, bricks: bricks.length, places: places.length, wide, f,
      texture: [body, groundL, sky, smoke].map((g) => g.mesh.material.uniforms.uTex.value.image.width + 'x' + g.mesh.material.uniforms.uTex.value.image.height).join(' ') + ' + ' + bubbles.map((b) => b.a.m.material.uniforms.uTex.value.image.width + 'x' + b.a.m.material.uniforms.uTex.value.image.height).join(' '),
      bubbleDist: bubNear.map((x) => +x.toFixed(2)), bubbleAt: bubbleW.map(({ w }) => ({ x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: +w.z.toFixed(2) })),
      drop: D.drop.map((x) => +x.toFixed(2)), lay: D.lay.map((x) => +x.toFixed(2)), open: +D.open.toFixed(2), fin: +D.fin.toFixed(2), roof: +D.roof.toFixed(2),
      house: { x: +houseW.x.toFixed(2), y: +houseW.y.toFixed(2), z: +houseW.z.toFixed(2) }, ring: { x: ringW.x, y: ringW.y, z: ringW.z }, heart: { x: heartW.x, y: heartW.y, z: heartW.z },
    }),
  };
};
