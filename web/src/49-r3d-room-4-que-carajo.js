// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 4 · «¿QUÉ CARAJO?»  (the cover, as two raised hands: white chalk on black)
//   The drawing is two furry-wristed hands held up with the palms forward, every finger, crease and strand of fur white on the black paper, and three drops:
//   one from each wrist and one between them. "11:11" in a corner. The cover has no gold or silver. The photo is a black paper taped on an orange graffiti
//   heart, so the tones were traced from a rectified copy (49-r3d-room-4-que-carajo-art.js): the white and grey tones as contours at five levels, painted
//   into textures (the shared tone helpers, 49-r3d-room-0-tones.js).
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels from there. Layers share
//   that eye and each one sits at the depth that suits it; the cover's pixels are split among them with soft masks that add up to one, so from the arrival spot
//   the sum is the cover, seen frontally, and walking in opens it up:
//     · each hand is a layer of its own that turns about its wrist (they lean toward each other with every thing held) and breathes; the left palm's creases
//       are cut from it (they are the line that is looked at, and brighten when it was),
//     · the three drops are cut from the tones along their own outlines, and a copy of each falls from it,
//     · "11:11" is a small patch behind them.
//   In front of the drawing, on the water, a backpack's drag marks cross the floor and fork five times (the left palm's line says how to turn); at the end of
//   each right turn lies something inherited, drawn in chalk standing on the water. Each fork is a pair of chalk arrows on posts. world.room.v holds the
//   targets (the controller, 59-room-4-…, sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, Z0 how far (m) the drawing's plane is from the eye (the drag marks and the things lie in between), ARR where the visitor arrives (z), BOT the cover row that stands 0.15 m above the floor. */
const QC = { H: 1.6, cx: 500, Z0: 7.5, ARR: 2.7, BOT: 985 };
/** Where the visitor stands when a floor opens is the eye; the drawing is Z0 metres ahead of it. */
const QC_SET = { x: 0, z: QC.ARR + QC.Z0 };
/** The lens depends on the screen: a wide one fits the whole paper at 1300 cover px of focal length, a phone's narrow view at 1850. The set's z never changes. */
function qcLens(a) { return coverLens(QC, a, { f: 1300, row: 520, sx: 0.42, sy: 0.48 }, { f: 1850, row: 560, sx: 0.5, sy: 0.46 }); }
/** The cover's regions (rectified cover pixels, the paper is 1000 square): the two hands (a little beyond their outlines), the left palm inside its outline, the three drops (the cover's own outlines). */
const QC_POLY = {
  HL: [[288, 659], [289, 503], [294, 409], [301, 370], [310, 345], [342, 310], [350, 303], [377, 295], [379, 295], [394, 300], [401, 305], [471, 417], [474, 425], [489, 630], [488, 633], [422, 688], [372, 710], [291, 695], [289, 695]],
  HR: [[490, 495], [491, 488], [529, 356], [532, 348], [569, 327], [574, 324], [579, 324], [605, 329], [614, 333], [658, 373], [664, 380], [672, 397], [746, 699], [713, 729], [645, 781], [638, 785], [633, 784], [627, 779], [590, 720], [504, 565], [497, 549], [493, 523]],
  PALM: [[312, 436], [408, 432], [412, 470], [398, 505], [372, 530], [330, 545], [310, 525], [305, 480]],
  DROPS: [[[366, 643], [359, 676], [357, 700.5], [357.5, 705], [360.5, 711.5], [365, 713.5], [369.5, 714], [374, 712.5], [378, 709], [381, 703], [382, 695], [369.5, 652], [366, 648]], [[477.5, 566.5], [475.5, 570.5], [472, 588.5], [470, 623], [474, 635], [477, 637], [482, 638], [487, 637], [490, 632.5], [492.5, 624.5], [492, 615], [482.5, 583.5], [480, 568]], [[625, 684], [630, 688], [636, 700], [642, 720], [648, 742], [650, 756], [646, 768], [638, 777], [632, 779], [625, 776], [620, 764], [619, 748], [620, 730], [622, 710], [623, 694]]],
};
/** The cover rectangle that holds "11:11". */
const QC_SIG = [888, 950, 990, 992];
/** Cover pixels the hotspots and the close looks aim at (and how much each look shows, metres). */
const QC_PX = {
  palma: [365, 490], manos: [610, 495], gotas: [481, 606],
  looks: { palma: { at: [365, 485], w: 0.9, h: 1.1 }, manos: { at: [515, 520], w: 2.6, h: 2.3 }, gotas: { at: [500, 660], w: 1.7, h: 1.2 } },
};
/** The wrists, where each hand turns, and the fingertips (the left hand's four fingers and thumb, the right hand's four and thumb), lit one pair per thing held. */
const QC_PIV = [[378, 639], [621, 633]];
const QC_TIPS = { L: [[321, 349], [346, 317], [376, 307], [396, 314], [460, 422]], R: [[545, 358], [574, 337], [602, 341], [643, 377], [507, 490]] };
/** The way to turn at each of the five forks (the visitor's left and right, facing the board), as the left palm's line goes: I izquierda, D derecha. */
const QC_ROUTE = ['I', 'D', 'D', 'I', 'D'];
/** The five inherited things, in the order the chapter names them. */
const QC_THINGS = ['Las bolsitas de residuo que vendía papá', 'Las zapatillas que compartían mi vieja y mi tía', 'La espada de Pepe', 'Los ñoquis de Eva', 'Los vinos de Rolando'];
/** Where the drag marks fork: station k, and where the right turn at it goes (one step of 0.8 m to the side, 0.32 m toward the drawing). */
const QC_STN = (() => { const s = [[0, 3.5]]; QC_ROUTE.forEach((r, k) => s.push([s[k][0] + (r === 'I' ? -0.8 : 0.8), s[k][1] - 0.32])); return s; })();

/** The chalk drawings of the five things, as pieces of [points, closed] in a unit square (u across, v up from -1 to 1). */
function qcIcon(k) {
  const ell = (cx, cy, rx, ry, n = 12) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * rx, cy + Math.sin((i / n) * TAU) * ry]);
  const at = (pts, cx, s) => pts.map(([x, y]) => [cx + x * s, -0.9 + (y + 0.9) * s]); // a shape of the unit square, smaller, standing on the floor line
  if (k === 0) { // two sacks of rubbish, tied at the neck
    const bag = (cx, s) => [[at([[-0.5, -0.9], [-0.62, -0.1], [-0.36, 0.42], [-0.14, 0.58], [-0.2, 0.85], [0.2, 0.85], [0.14, 0.58], [0.36, 0.42], [0.62, -0.1], [0.5, -0.9]], cx, s), true], [at([[-0.2, 0.58], [0.2, 0.58]], cx, s), false], [at([[-0.3, -0.3], [0.1, 0.1]], cx, s), false]];
    return [...bag(-0.45, 0.95), ...bag(0.5, 0.75)];
  }
  if (k === 1) { // one pair of sneakers
    const shoe = (cx, s) => [[at([[-0.9, -0.9], [-0.9, -0.15], [-0.3, -0.05], [0, 0.4], [0.45, 0.1], [0.9, -0.1], [0.9, -0.9]], cx, s), true], [at([[-0.9, -0.62], [0.9, -0.62]], cx, s), false], [at([[-0.12, 0.05], [0.18, 0.22]], cx, s), false], [at([[0.1, -0.05], [0.4, 0.12]], cx, s), false]];
    return [...shoe(-0.48, 0.5), ...shoe(0.5, 0.5)];
  }
  if (k === 2) return [ // a sword
    [[[0, 1], [0.12, 0.78], [0.12, -0.35], [-0.12, -0.35], [-0.12, 0.78]], true], [[[-0.5, -0.35], [0.5, -0.35], [0.5, -0.5], [-0.5, -0.5]], true], [[[0, -0.5], [0, -0.82]], false], [ell(0, -0.9, 0.1, 0.1, 8), true], [[[0, 0.78], [0, -0.35]], false],
  ];
  if (k === 3) { // a plate of gnocchi
    const nq = (cx, cy) => [[ell(cx, cy, 0.2, 0.13, 10), true], [[[cx - 0.1, cy - 0.04], [cx + 0.1, cy + 0.04]], false]];
    return [[[[-0.9, -0.4], [-0.7, -0.85], [0.7, -0.85], [0.9, -0.4]], true], [ell(0, -0.4, 0.9, 0.18, 16), true], ...nq(-0.45, -0.12), ...nq(-0.05, -0.05), ...nq(0.38, -0.12), ...nq(-0.25, 0.28), ...nq(0.2, 0.22), ...nq(0, 0.6)];
  }
  const bottle = (cx, s, tilt) => { const q = [[-0.2, -0.9], [-0.2, 0.15], [-0.08, 0.4], [-0.08, 0.9], [0.08, 0.9], [0.08, 0.4], [0.2, 0.15], [0.2, -0.9]].map(([x, y]) => [cx + (x * Math.cos(tilt) - y * Math.sin(tilt)) * s, -0.9 + (y * Math.cos(tilt) + x * Math.sin(tilt) + 0.9) * s]); return [[q, true], [[q[3], q[4]].map(([x, y]) => [x, y - 0.12 * s]), false]]; };
  return [...bottle(-0.35, 0.95, 0), ...bottle(0.4, 0.8, -0.16)]; // two bottles of wine
}

ROOM_SETS['que-carajo'] = function buildCarajo(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = QC, Z0 = QC.Z0, POLY = QC_POLY;
  const { wide, f, yh } = qcLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(QC_SET.x, 0, QC_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const W2 = 3.0, W1 = 2.0, W0 = 1.4; // chalk line widths (CSS px) of the drag marks and the arrows
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };

  // ---- how far each layer is from the eye (each layer is a flat sheet on the cover's rays): the hands stand a little forward of the paper, the drops with them ----
  const ZH = Z0 - 0.5, ZD = Z0 - 0.3, ZMV = Z0 - 0.7, ZSIG = Z0 + 0.3, mpp = (Z) => Z / f; // (mpp: metres per cover pixel at depth Z)

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, tonePts, region, gridMesh } = coverTones(ctx, { V, lens: { f, yh }, decode: qaDecode, fill: QA_FILL, ts: [1.2, 2.0], root, rnd: mulberry32(44) });
  const BM = 1.2; // blur of a cut-out's soft edge (cover px)
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── the hands: each turns about its wrist; the left palm's creases are a patch of their own ─────────────────────────────
  const handHost = [0, 1].map((g) => { const p = P(QC_PIV[g][0], QC_PIV[g][1], ZH); return { host: grp(root, p[0], p[1], p[2]), p }; });
  const HANDS = [POLY.HL, POLY.HR], handMesh = HANDS.map((poly, g) => {
    const R = boxOf(poly, 6), masks = [['in', [poly], BM], ['out', POLY.DROPS, BM]];
    if (g === 0) masks.push(['out', [POLY.PALM], 3]);
    return gridMesh(R, 2, 2, ZH, region(R, { masks }), handHost[g].host, handHost[g].p);
  });
  const PM_R = boxOf(POLY.PALM, 8);
  const palm = gridMesh(PM_R, 1, 1, ZH, region(PM_R, { ts: 1.4, masks: [['in', [POLY.PALM], 3]] }), handHost[0].host, handHost[0].p);
  // ───────────────────────────── the three drops: cut along their own outlines, and a copy of each that falls ─────────────────────────────
  const dropM = [], ghostM = [], ghostHost = [];
  POLY.DROPS.forEach((poly) => {
    const R = boxOf(poly, 5), tex = region(R, { ts: 1.5, masks: [['in', [poly], BM]] });
    dropM.push(gridMesh(R, 1, 1, ZD, tex));
    const h = grp(root); ghostHost.push(h); ghostM.push(gridMesh(R, 1, 1, ZD - 0.02, tex, h));
  });
  // "11:11", behind the drawing
  const SG = gridMesh(QC_SIG, 1, 1, ZSIG, region(QC_SIG, { ts: 1.8, glow: 0.25 }));

  // ───────────────────────────── the hand's marks: the left palm's line (five glints that zigzag down it), the fingertips ─────────────────────────────
  const mapRows = QC_ROUTE.map((r, k) => { const q = P(366 + (r === 'I' ? -20 : 20), 452 + k * 23, ZMV); return [q[0], q[1], q[2], 0.17, 0, k * 0.21, 0]; });
  const mapPts = kit.points(mapRows, { shape: 3, twinkle: 0.7, tint: [1, 0.9, 0.62] }); root.add(mapPts.obj);
  const tipRows = (list) => list.map(([x, y], k) => { const q = P(x, y, ZMV); return [q[0], q[1], q[2], 0.3, 0, k * 0.17, 0]; });
  const tipPts = [kit.points(tipRows(QC_TIPS.L), { shape: 3, twinkle: 0.8, tint: [1, 0.93, 0.7] }), kit.points(tipRows(QC_TIPS.R), { shape: 3, twinkle: 0.8, tint: [1, 0.93, 0.7] })];
  tipPts.forEach((tp, g) => handHost[g].host.add(tp.obj)); // (they travel with the hand that closes)
  tipPts.forEach((tp, g) => { for (let k = 0; k < 5; k++) { tp.pos[k * 3] -= handHost[g].p[0]; tp.pos[k * 3 + 1] -= handHost[g].p[1]; tp.pos[k * 3 + 2] -= handHost[g].p[2]; } tp.geo.attributes.position.needsUpdate = true; });

  // ───────────────────────────── the drag marks on the water, and the forks ─────────────────────────────
  const FY = 0.03; // the water
  /** Two wobbling lines (the marks of something dragged) along a polyline of [x, z], with short scuffs across them. */
  const drag = (R, pts, seed) => {
    const r = mulberry32(seed);
    for (let s = 0; s < pts.length - 1; s++) {
      const A = pts[s], B = pts[s + 1], dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1, tx = dx / L, tz = dz / L, nx = -tz, nz = tx, n = Math.max(2, Math.round(L / (lite ? 0.3 : 0.17)));
      for (const off of [-0.075, 0.075]) {
        let prev = null;
        for (let i = 0; i <= n; i++) { const u = (i / n) * L, wob = (r() - 0.5) * 0.03, q = [A[0] + tx * u + nx * (off + wob), FY, A[1] + tz * u + nz * (off + wob)]; if (prev) R.seg(prev, q, W1, 0.9); prev = q; }
      }
      for (let u = 0.1; u < L - 0.05; u += lite ? 0.34 : 0.2) { const c = [A[0] + tx * u, A[1] + tz * u]; R.seg([c[0] + nx * 0.15 + tx * 0.03, FY, c[1] + nz * 0.15 + tz * 0.03], [c[0] - nx * 0.15 - tx * 0.03, FY, c[1] - nz * 0.15 - tz * 0.03], W0, 0.5); }
    }
  };
  const mid = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const entry = kit.ribbons(60); drag(entry, [[0, 5.9], QC_STN[0]], 61);
  const entryL = lines(entry, { glow: true }); root.add(entryL.obj);
  const legL = [], forkL = [], curlL = [], thingL = [], things = [], tickAt = [];
  QC_ROUTE.forEach((turn, k) => {
    const a = QC_STN[k], b = QC_STN[k + 1], sg = turn === 'I' ? -1 : 1, wrong = [a[0] - sg * 0.8, a[1] - 0.32];
    const tc = mid(a, b, 0.5), tw = mid(a, wrong, 0.5);
    // the stubs of both branches, and the arrow-posts that mark them
    const F = kit.ribbons(80 + k); drag(F, [a, tc], 90 + k); drag(F, [a, tw], 95 + k);
    const post = (p, dir) => { F.seg([p[0], 0, p[1]], [p[0], 1.15, p[1]], W2, 1); F.seg([p[0] - dir * 0.12, 1.1, p[1]], [p[0] + dir * 0.3, 1.1, p[1]], W2, 1); F.seg([p[0] + dir * 0.3, 1.1, p[1]], [p[0] + dir * 0.17, 1.19, p[1]], W2, 1); F.seg([p[0] + dir * 0.3, 1.1, p[1]], [p[0] + dir * 0.17, 1.01, p[1]], W2, 1); };
    post(tc, sg); post(tw, -sg);
    tickAt.push({ i: [tw[0] - sg * 0.04, 1.1, tw[1]], d: [tc[0] + sg * 0.04, 1.1, tc[1]], c: sg });
    forkL.push(lines(F, { glow: true })); root.add(forkL[k].obj);
    // the rest of the way, drawn once the turn is right
    const Lg = kit.ribbons(100 + k); drag(Lg, [tc, b], 105 + k);
    legL.push(lines(Lg, { glow: true })); root.add(legL[k].obj);
    // the wrong way curls back on itself: it only shows when it is followed
    const Cu = kit.ribbons(110 + k), r0 = 0.34, cx = wrong[0] - sg * 0.2, cz = wrong[1] - 0.15, spiral = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14, ang = -0.4 + t * 5.2 * (sg > 0 ? -1 : 1), rad = r0 * (1 - t * 0.7); spiral.push([cx + Math.cos(ang) * rad, cz + Math.sin(ang) * rad]); }
    drag(Cu, [tw, wrong, ...spiral], 115 + k);
    curlL.push(lines(Cu, { glow: true })); root.add(curlL[k].obj);
    // the thing lying where the right turn ends: a chalk drawing standing on the water, facing the visitor
    const T = kit.ribbons(120 + k), sc = 0.55, put = ([u, v]) => [b[0] + u * sc, 0.07 + (v + 1) * sc * 0.95, b[1]];
    for (const [pts, closed] of qcIcon(k)) T.poly(pts.map(put), W2, 1, closed);
    thingL.push(lines(T, { glow: true })); const g = grp(root); g.add(thingL[k].obj); things.push(g);
  });

  // ───────────────────────────── the page that flies to the book ─────────────────────────────
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const anchorSpec = { 'rm-palma': [QC_PX.palma, ZH, 0.75, 0.9], 'rm-manos': [QC_PX.manos, ZH, 0.75, 0.9], 'rm-gotas': [QC_PX.gotas, ZD, 0.45, 0.62] }; // (metres: they scale with the focal length on a phone; the palms' centres are 1.4 m apart)
  for (const [id, [at, Z, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(at[0], at[1], Z)), w, h: hh };
  tickAt.forEach((t, k) => { ctx.anchors[`rm-ramal-${k}-i`] = { pos: W3(t.c < 0 ? t.d : t.i), w: 0.6, h: 0.8 }; ctx.anchors[`rm-ramal-${k}-d`] = { pos: W3(t.c < 0 ? t.i : t.d), w: 0.6, h: 0.8 }; });
  QC_ROUTE.forEach((_, k) => { ctx.anchors[`rm-cosa-${k}`] = { pos: W3([QC_STN[k + 1][0], 1.0, QC_STN[k + 1][1]]), w: 0.9, h: 1.1 }; });
  const solids = [(() => { const p = W3([0, 0, -0.15]); return { kind: 'box', x: p.x, z: p.z, hw: 3.5, hd: 1.8, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the drawing that is looked at ─────────────────────────────
  const aim = (camL, tgtL, sx, sy, fov, a) => coverAim(root, V3, camL, tgtL, sx, sy, fov, a);
  const fit = coverFit;
  function pose(view, a, free) {
    const look = QC_PX.looks[view];
    if (!look) return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const t = P(look.at[0], look.at[1], ZH), d = fit(look.w, look.h, fw, fh, fov, a);
    return aim([t[0], t[1] + 0.05, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const N = QC_ROUTE.length, zeros = () => Array(N).fill(0);
  const D = { leg: zeros(), fork: zeros(), thing: zeros(), tip: zeros(), curl: zeros(), seen: 0, slow: 0, calm: 0, grip: 0 };
  const st = { T: 0, init: false, drip: [0.1, 0.45, 0.8], tipShown: Array(N).fill(-1) };
  const tmpV = V3(), tmpF = V3(), tmpU = V3();
  const follow = (arr, tgt, rate, dt) => { for (let i = 0; i < arr.length; i++) arr[i] = damp(arr[i], tgt[i] || 0, rate, dt); };
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.curl), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3;
    if (ok) {
      const f = v.forks, tg = { leg: [], fork: [], thing: [], tip: [] };
      for (let k = 0; k < N; k++) {
        tg.leg.push(f > k ? 1 : 0);
        tg.fork.push(f === k && v.found === k && v.held === k && !v.calm ? 1 : f >= k ? 0.3 : 0); // the fork to take now is bright; the ones left behind are dim
        tg.thing.push(f > k && v.found <= k ? 1 : 0);
        tg.tip.push(v.held > k ? 1 : 0);
      }
      if (!st.init) { // the first frame with this floor's state: shown as it is, not animated in
        D.leg = tg.leg.slice(); D.fork = tg.fork.slice(); D.thing = tg.thing.slice(); D.tip = tg.tip.slice(); D.curl = v.curl.slice(); D.seen = v.seen; D.slow = v.slow; D.calm = v.calm; D.grip = v.grip || 0; st.init = true;
      }
      follow(D.leg, tg.leg, rate * 1.2, dt); follow(D.fork, tg.fork, rate, dt); follow(D.thing, tg.thing, rate * 1.4, dt); follow(D.tip, tg.tip, rate * 0.9, dt); follow(D.curl, v.curl, rate * 1.8, dt);
      D.seen = damp(D.seen, v.seen, rate, dt); D.slow = damp(D.slow, v.slow, rate * 0.5, dt); D.calm = damp(D.calm, v.calm, rate * 0.5, dt); D.grip = damp(D.grip, v.grip || 0, 8, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T;
    // the hands: they breathe, lean toward each other with every thing held and close when it is held
    const lean = Math.min(0.2, D.tip.reduce((s, x) => s + x, 0) * 0.026 + D.grip * 0.07) + 0.008 * Math.sin(T * 1.1) * m;
    for (let g = 0; g < 2; g++) {
      const h = handHost[g].host;
      h.rotation.z = g === 0 ? -lean : lean; // (about the axis toward the visitor: the hands lean toward each other)
      h.scale.setScalar(1 + (0.01 * Math.sin(T * 1.7 + g) + 0.02 * D.grip) * (m || 0.3));
      handMesh[g].u.uAlpha.value = 0.94 + 0.06 * (0.5 + 0.5 * Math.sin(T * 2.3 + g * 2)) * m; // (the hair shimmers)
    }
    palm.u.uAlpha.value = 0.9 + 0.1 * D.seen * (0.5 + 0.5 * Math.sin(T * 3)) * m + 0.04 * D.seen;
    // the left palm's line: five glints that zigzag down it once it was looked at; the fingertips light as things are held
    const mp = mapPts.dat; for (let k = 0; k < N; k++) mp[k * 4 + 1] = D.seen * (0.55 + 0.45 * Math.sin(T * 2 + k)) * 0.9; mapPts.geo.attributes.aData.needsUpdate = true;
    for (let g = 0; g < 2; g++) { const td = tipPts[g].dat; for (let k = 0; k < N; k++) td[k * 4 + 1] = D.tip[k] * 0.95; tipPts[g].geo.attributes.aData.needsUpdate = true; }
    // the drops: the ones drawn stay; a copy of each falls from it, slower as the things are held, almost still when it is solved
    for (let i = 0; i < 3; i++) {
      const sp = 0.3 * (1 - 0.86 * D.slow) * (1 - 0.8 * D.calm); st.drip[i] = (st.drip[i] + dt * sp * m) % 1;
      const p = m ? st.drip[i] : 0.45, dy = 28 + p * 100; // (cover px the copy has fallen)
      ghostHost[i].position.y = -dy * mpp(ZD); ghostHost[i].visible = true;
      ghostM[i].u.uAlpha.value = Math.sin(p * Math.PI) * 0.6 * (1 - 0.5 * D.calm);
      dropM[i].u.uAlpha.value = 0.96 + 0.04 * Math.sin(T * 1.3 + i) * m;
    }
    SG.u.uAlpha.value = 0.9;
    // the drag marks: the way taken lights up, the fork to take pulses, the wrong way flashes while it is followed
    entryL.set(0.9);
    for (let k = 0; k < N; k++) {
      legL[k].set(D.leg[k] * 0.95); legL[k].obj.visible = D.leg[k] > 0.01;
      const pulse = 0.78 + 0.22 * Math.sin(T * 3.2 + k) * m; forkL[k].set(D.fork[k] * (D.fork[k] > 0.95 ? pulse : 1)); forkL[k].obj.visible = D.fork[k] > 0.01;
      curlL[k].set(D.curl[k] * 0.95); curlL[k].obj.visible = D.curl[k] > 0.01;
      const a = D.thing[k]; things[k].visible = a > 0.01; things[k].position.y = 0.03 * Math.sin(T * 1.3 + k * 1.7) * m; thingL[k].set(a);
    }
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(500, 600, ZH - 0.2))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  const texSize = (g) => g.mesh.material.uniforms.uTex.value.image.width + 'x' + g.mesh.material.uniforms.uTex.value.image.height;
  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh],
    info: () => ({ segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, route: QC_ROUTE.join(''), things: N, drops: POLY.DROPS.length, wide, f, texture: [handMesh[0], handMesh[1], palm, dropM[0], dropM[2], SG].map(texSize).join(' + ') }),
  };
};

