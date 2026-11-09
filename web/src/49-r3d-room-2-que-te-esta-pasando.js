// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 2 · «¿QUÉ TE ESTÁ PASANDO?»  (the cover, as a city that is a circuit, in white chalk on black)
//   The drawing is an isometric city: blocks with gold-dotted windows, a winding road and a middle road with dashed lanes
//   and capsules, all draining into one hole in the centre; on the left a circuit maze with dotted drips; top left a cloud with
//   a spiral, stars and flowers; on the right towers with a smoke column, a rocket with a ✓ and a ✗, a computer lying down,
//   a constellation and circuit lines. Built here as a relief board leaning back toward the visitor, so the whole drawing reads
//   from where they stand, with the blocks standing out of it (everything is laid out in the cover's own pixels, see P()).
//   Ambient movement while the city runs: windows flicker, things flow along the roads into the hole, the smoke rises,
//   capsules roll, a pulse runs along the maze's wire and lights the four feeds in order. world.room.v drives what is cut.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Local frame (metres): +x to the viewer's right, +z toward the visitor, y up. The board leans back by `tilt`. */
const SISTEMA_SET = { x: 0, z: 9.2, yc: 2.4, K: 0.0081, tilt: (58 * Math.PI) / 180 };
/** The cover's pixels (the photo is 900 wide) of what the room's hotspots and close looks aim at, and how much each look shows (metres). */
const SISTEMA_PX = {
  hole: [462, 838], circuit: [246, 920], plata: [342, 742], exito: [575, 702], amor: [268, 652], sustancias: [582, 934],
  looks: { hole: { at: [462, 874], w: 1.25, h: 1.6 }, circuit: { w: 1.3, h: 1.75 }, plata: { w: 1.15, h: 1.05 }, exito: { w: 1.4, h: 1.4 }, amor: { w: 1.1, h: 0.95 }, sustancias: { w: 1.4, h: 2.5 } },
};
/** The maze's single wire, in grid cells (14 px each, from its top-left corner), and the four feeds it visits in the order to cut them. */
const SISTEMA_WIRE = { origin: [202, 828], cell: 14, path: [[0, 0], [5, 0], [5, 2], [1, 2], [1, 5], [6, 5], [6, 8], [3, 8], [3, 10], [0, 10], [0, 13]], nodes: { sustancias: 4, amor: 5, plata: 8, exito: 10 } };

/** The gauge at the hole: a half dial, a needle that stays at the left, and its reading. */
function drawSistemaGauge(ctx, w, h, st) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const k = makeChalk(ctx, { op: 'lighter', bg: '#000' }, w, 41), cx = w / 2, cy = h * 0.66, R = w * 0.36;
  k.arc(cx, cy, R, Math.PI, TAU, 0.014, 'g', 2);
  for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI, r2 = R * (i % 5 ? 0.9 : 0.82); k.line(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0.008, 'g', 1, 0.8); }
  const a = Math.PI + clamp(st.needle) * 0.35 * Math.PI; // (it never gets past a tremble)
  k.line(cx, cy, cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92, 0.014, 'g', 2);
  k.arc(cx, cy, w * 0.018, 0, TAU, 0.01, 'g', 1);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `500 ${Math.round(h * 0.2)}px "Courier Prime","Courier New",monospace`;
  ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fff';
  ctx.fillText(st.solved ? 'SE HABITA' : 'LLENO: 0 %', cx, h * 0.9);
  ctx.restore();
}

ROOM_SETS['que-te-esta-pasando'] = function buildSistema(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, S = SISTEMA_SET, lite = ctx.lite, K = S.K, sT = Math.sin(S.tilt), cT = Math.cos(S.tilt);
  const rnd = mulberry32(22);
  const root = new THREE.Group();
  root.position.set(S.x, 0, S.z);
  root.rotation.y = Math.atan2(-S.x, 2.7 - S.z); // the front (+z local) faces the place where the visitor stands
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const W2 = 3.0, W1 = 2.0, W0 = 1.4; // line widths (CSS px)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };

  // ---- the board: cover pixels (x right, y down, the hole at 462,838) → the set's metres; h lifts a point off the board ----
  const P = (px, py, h = 0) => { const X = (px - 465) * K, Y = -(py - 840) * K; return [X, S.yc + Y * sT + h * cT, -Y * cT + h * sT]; };
  const EY = [0, sT, -cT], NN = [0, cT, sT]; // up the drawing, and out of it (toward the visitor)
  const pen = (seed) => {
    const R = kit.ribbons(seed);
    const d = {
      R,
      seg: (a, b, w = W1, al = 1, h = 0) => R.seg(P(a[0], a[1], h), P(b[0], b[1], h), w, al),
      poly: (pts, w = W1, al = 1, closed = false, h = 0) => R.poly(pts.map((q) => P(q[0], q[1], h)), w, al, closed),
      circ: (cx, cy, r, w = W1, al = 1, h = 0, n = 18) => d.poly(Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]), w, al, true, h),
      rect: (x0, y0, x1, y1, w = W1, al = 1, h = 0) => d.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], w, al, true, h),
      /** A block standing out of the board: base, top and four edges. */
      box(x0, y0, x1, y1, hh, w = W1, al = 1) { d.rect(x0, y0, x1, y1, w, al, 0); d.rect(x0, y0, x1, y1, w, al, hh); for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) R.seg(P(x, y, 0), P(x, y, hh), w * 0.8, al); },
      /** A stadium (a pill), w wide and hgt tall (hgt >= w), turned by rot about its centre. */
      pill(cx, cy, w, hgt, ww = W1, al = 0.95, h = 0, rot = 0) {
        const r = w / 2, L = hgt / 2 - r, pts = [], c = Math.cos(rot), s2 = Math.sin(rot), put = (x, y) => pts.push([cx + x * c - y * s2, cy + x * s2 + y * c]);
        for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; put(Math.cos(a) * r, -L + Math.sin(a) * r); }
        for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; put(Math.cos(a) * r, L + Math.sin(a) * r); }
        d.poly(pts, ww, al, true, h);
      },
      star(cx, cy, r, ww = W0, al = 1, h = 0) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } d.poly(pts, ww, al, true, h); d.circ(cx, cy, r * 0.16, ww * 0.8, al, h, 8); },
      flower(cx, cy, r, ww = W0, al = 1) { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; d.circ(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.42, ww, al, 0, 9); } d.circ(cx, cy, r * 0.26, ww, al, 0, 8); },
      spiral(cx, cy, r0, r1, turns, ww = W1, al = 1, h = 0) { const pts = []; const n = Math.round(turns * 22); for (let i = 0; i <= n; i++) { const u = i / n, a = u * turns * TAU, r = lerp(r0, r1, u); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } d.poly(pts, ww, al, false, h); },
    };
    return d;
  };
  /** Calls fn(point, tangent, i) every `step` px along a polyline (px space). */
  const walk = (path, step, fn) => {
    let acc = 0, idx = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
      for (; acc <= L; acc += step) fn([a[0] + tx * acc, a[1] + ty * acc], [tx, ty], idx++);
      acc -= L;
    }
  };
  const spline = (pts, n = 7) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const offsetPath = (path, o) => path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - (dy / L) * o, p[1] + (dx / L) * o]; });
  /** Two edges and a dashed middle lane. */
  const road = (d, path, half, w = W1, al = 0.95) => {
    d.poly(offsetPath(path, half), w, al); d.poly(offsetPath(path, -half), w, al);
    walk(path, 8, (p, t, i) => { if (i % 2 === 0) d.seg(p, [p[0] + t[0] * 7, p[1] + t[1] * 7], W0, 0.7); });
  };
  /** A path in px, as the set's local points (what the flowing things follow). */
  const lift = (path, h = 0.03) => path.map((p) => P(p[0], p[1], h));

  const HOLE = SISTEMA_PX.hole;
  const dots = { white: [], goldPlata: [], goldTowers: [], glitter: [] }; // sprite rows
  const win = (list, x0, y0, x1, y1, hh, cols, rowsN, sz, gold) => { // a grid of windows on a block's top
    for (let r = 0; r < rowsN; r++) for (let c = 0; c < cols; c++) {
      if (lite && (r + c) % 2) continue;
      const x = lerp(x0 + 6, x1 - 6, cols > 1 ? c / (cols - 1) : 0.5), y = lerp(y0 + 6, y1 - 6, rowsN > 1 ? r / (rowsN - 1) : 0.5), p = P(x, y, hh + 0.012);
      const g = gold && rnd() < 0.55;
      (g ? list : dots.white).push([p[0], p[1], p[2], g ? sz * 1.15 : sz * 0.8, g ? 0.95 : 0.8, rnd(), 0]);
    }
  };

  // ───────────────────────────── the static city (one group: everything that does not move) ─────────────────────────────
  const C = pen(7);
  { // the paper's edge
    C.rect(168, 522, 772, 1150, 1.6, 0.4);
  }
  { // the middle road: two long edges with a gap at the hole, dashed lanes, and its pills
    for (const x of [410, 510]) { C.seg([x, 546], [x, 788], W1, 0.95); C.seg([x, 890], [x, 1108], W1, 0.95); }
    for (const x of [432, 488]) for (let y = 552; y < 1104; y += 14) if (y < 780 || y > 898) C.seg([x, y], [x, y + 7], W0, 0.7);
    for (const [y, hh] of [[630, 66], [736, 54], [992, 60], [1066, 50]]) C.pill(462, y, 24, hh, W1, 0.95, 0.02);
    C.seg([410, 546], [404, 540], W0, 0.6); C.seg([510, 546], [516, 540], W0, 0.6);
  }
  const archPath = spline([[330, 660], [362, 630], [420, 614], [468, 630], [497, 666], [508, 710], [496, 752], [470, 790], [HOLE[0] - 22, HOLE[1] - 38]], 6);
  road(C, archPath.slice(0, -6), 11); // (the last stretch is left to the hole's rings)
  const towerRoad = spline([[598, 752], [556, 772], [520, 796], [492, 818], [HOLE[0] + 30, HOLE[1] - 12]], 6);
  road(C, towerRoad.slice(0, -4), 9);
  { // the cloud (top left), its spiral and flowers are animated; here the stars and the little curl beside the block
    for (const [x, y, r] of [[212, 608, 8], [234, 579, 9], [268, 576, 11], [311, 571, 10], [353, 568, 11], [397, 586, 10]]) C.star(x, y, r, W1, 0.95);
    for (const [x, y] of [[250, 700], [216, 722], [238, 744]]) C.circ(x, y, 9, W0, 0.9, 0, 12);
    C.poly(spline([[262, 748], [236, 742], [222, 726], [232, 710], [246, 716]], 5), W1, 0.9);
    C.poly(spline([[232, 676], [240, 692], [232, 706]], 5), W0, 0.8); // a stem
    // the cloud's outline: scalloped
    const pts = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU, rr = 1 + 0.17 * Math.abs(Math.sin(a * 3.5)); pts.push([282 + Math.cos(a) * 58 * rr, 630 + Math.sin(a) * 34 * rr]); }
    C.poly(pts, W2, 1, true);
  }
  // the gold-window block (PLATA) and the towers (a relief of boxes), with their windows
  const BLOCKS = [[285, 690, 398, 792, 0.26, 'p'], [528, 752, 590, 820, 0.26], [532, 826, 598, 902, 0.22], [602, 812, 718, 874, 0.4], [608, 880, 714, 962, 0.46], [538, 908, 600, 958, 0.17], [532, 966, 640, 1044, 0.32], [646, 990, 734, 1062, 0.28]];
  for (const [x0, y0, x1, y1, hh, k] of BLOCKS) {
    C.box(x0, y0, x1, y1, hh, W2, 1);
    C.rect(x0 + 7, y0 + 7, x1 - 7, y1 - 7, W0, 0.55, hh);
    if (k === 'p') { C.seg([x0, y0 + 34], [x1, y0 + 34], W0, 0.5, hh); C.seg([x0, y0 + 68], [x1, y0 + 68], W0, 0.5, hh); win(dots.goldPlata, x0, y0, x1, y1, hh, 12, 6, 0.034, true); }
    else win(dots.goldTowers, x0, y0, x1, y1, hh, Math.max(4, Math.round((x1 - x0) / 11)), Math.max(3, Math.round((y1 - y0) / 11)), 0.03, true);
    { // the two faces that look at the visitor (below and to the right of the block) carry a row of windows too
      const f1 = Math.max(3, Math.round((x1 - x0) / 13)), f2 = Math.max(3, Math.round((y1 - y0) / 13));
      for (let i = 0; i < f1; i++) { const x = lerp(x0 + 6, x1 - 6, f1 > 1 ? i / (f1 - 1) : 0.5), p = P(x, y1, hh * 0.5), g = rnd() < 0.5; (g ? (k === 'p' ? dots.goldPlata : dots.goldTowers) : dots.white).push([p[0], p[1], p[2], g ? 0.034 : 0.024, 0.9, rnd(), 0]); }
      for (let i = 0; i < f2; i++) { const y = lerp(y0 + 6, y1 - 6, f2 > 1 ? i / (f2 - 1) : 0.5), p = P(x1, y, hh * 0.5), g = rnd() < 0.5; (g ? (k === 'p' ? dots.goldPlata : dots.goldTowers) : dots.white).push([p[0], p[1], p[2], g ? 0.034 : 0.024, 0.9, rnd(), 0]); }
    }
  }
  { // the rocket: a kite with a fold, and a tail; the ✗ on the left (the ✓ on the right is animated)
    const rk = [[575, 628], [613, 702], [592, 742], [575, 726], [558, 742], [537, 702]];
    C.poly(rk, W2, 1, true); C.seg([575, 628], [575, 726], W1, 0.9); C.poly([[575, 640], [594, 690], [575, 700]], W0, 0.5);
    C.rect(560, 744, 592, 752, W1, 0.9, 0); C.seg([535, 702], [556, 722], W2, 1); C.seg([556, 702], [535, 722], W2, 1);
    for (const [x, y] of [[555, 760], [595, 760]]) C.seg([x, y], [x, y + 20], W0, 0.6);
  }
  { // the computer, lying down on its side
    const cx = 666, cy = 722, a = 0.5, ca = Math.cos(a), sa = Math.sin(a), R2 = (x, y) => [cx + x * ca - y * sa, cy + x * sa + y * ca];
    const base = [[-40, -26], [40, -26], [40, 26], [-40, 26]].map(([x, y]) => R2(x, y)), top = base;
    C.poly(base, W2, 1, true, 0); C.poly(top, W2, 1, true, 0.3);
    for (const q of base) C.R.seg(P(q[0], q[1], 0), P(q[0], q[1], 0.3), W1, 1);
    C.poly([[-32, -18], [32, -18], [32, 8], [-32, 8]].map(([x, y]) => R2(x, y)), W1, 0.9, true, 0.31);
    for (let i = 0; i < 5; i++) { const q0 = R2(-26 + i * 13, 17), q1 = R2(-18 + i * 13, 17); C.seg(q0, q1, W0, 0.8, 0.31); }
    C.poly([R2(44, -8), R2(52, -8), R2(52, 10), R2(44, 10)], W0, 0.8, false, 0.12);
  }
  { // circuit lines, top right; a chip; the constellation
    const r = mulberry32(31), nodes = [];
    for (let i = 0; i < 12; i++) {
      let x = 598 + i * 10 + (r() - 0.5) * 4, y = 566; const path = [[x, y]];
      for (let k = 0; k < 3 + Math.floor(r() * 3); k++) { y += 10 + r() * 22; path.push([x, y]); x += (r() < 0.5 ? -1 : 1) * (6 + r() * 14); path.push([x, y]); }
      if (y > 664) continue;
      C.poly(path, W0, 0.9); nodes.push(path[path.length - 1]);
    }
    for (const [x, y] of nodes) C.circ(x, y, 3.2, W0, 0.9, 0, 8);
    C.rect(612, 626, 656, 648, W1, 0.95); for (let i = 0; i < 6; i++) { C.seg([618 + i * 7, 626], [618 + i * 7, 618], W0, 0.8); C.seg([618 + i * 7, 648], [618 + i * 7, 656], W0, 0.8); }
    C.circ(634, 637, 4, W0, 0.9, 0, 8);
    for (const [x, y] of [[527, 603], [545, 577], [581, 566]]) C.star(x, y, 8, W1, 0.95);
    for (const [a, b] of [[[527, 603], [545, 577]], [[545, 577], [581, 566]], [[527, 603], [538, 632]]]) walk([a, b], 6, (p, t, i) => { if (i % 2 === 0) C.seg(p, [p[0] + t[0] * 3, p[1] + t[1] * 3], W0, 0.8); });
  }
  { // the crossed sparkle on the right
    C.seg([684, 846], [718, 812], W1, 0.95); C.seg([684, 812], [718, 846], W1, 0.95); C.seg([701, 804], [701, 854], W0, 0.7); C.seg([676, 829], [726, 829], W0, 0.7);
  }
  { // the hatched buildings beside the maze, and the torn edge below them
    for (let c = 0; c < 2; c++) for (let rI = 0; rI < 4; rI++) {
      const x0 = 292 + c * 58, y0 = 814 + rI * 52, x1 = x0 + 54, y1 = y0 + 48, up = (c + rI) % 2;
      C.rect(x0, y0, x1, y1, W1, 0.9, 0.06);
      for (let k = 1; k < 9; k += lite ? 2 : 1) { const t = k / 9; C.seg(up ? [x0, lerp(y0, y1, t)] : [lerp(x0, x1, t), y0], up ? [lerp(x0, x1, t), y0] : [x0, lerp(y0, y1, t)], W0, 0.36, 0.06); C.seg(up ? [lerp(x0, x1, t), y1] : [x1, lerp(y0, y1, t)], up ? [x1, lerp(y0, y1, t)] : [lerp(x0, x1, t), y1], W0, 0.36, 0.06); }
    }
    const tear = []; for (let x = 292; x <= 408; x += 6) tear.push([x, 1022 + ((x / 6) % 2) * 26 + (x % 5)]);
    C.poly(tear, W1, 0.9);
  }
  { // the maze's filler wires: they wander, end in dots, and never touch the main wire
    const W = SISTEMA_WIRE, g = (c, r) => [W.origin[0] + c * W.cell, W.origin[1] + r * W.cell], used = new Set(), key = (c, r) => c + ',' + r;
    const mp = W.path; for (let i = 0; i < mp.length - 1; i++) { const [c0, r0] = mp[i], [c1, r1] = mp[i + 1]; for (let k = 0; k <= Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0)); k++) used.add(key(c0 + Math.sign(c1 - c0) * k, r0 + Math.sign(r1 - r0) * k)); }
    const r = mulberry32(53), cols = 7, rowsN = 14, cap = lite ? 16 : 70; let made = 0;
    for (let n = 0; n < 260 && made < cap; n++) {
      let c = Math.floor(r() * cols), rr = Math.floor(r() * rowsN); if (used.has(key(c, rr))) continue;
      const path = [g(c, rr)]; used.add(key(c, rr));
      let dir = r() < 0.5 ? 0 : 1;
      for (let s = 0; s < 3 + Math.floor(r() * 7); s++) {
        const sgn = r() < 0.5 ? -1 : 1; let nc = c + (dir ? 0 : sgn), nr = rr + (dir ? sgn : 0);
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rowsN || used.has(key(nc, nr))) { dir = 1 - dir; continue; }
        c = nc; rr = nr; used.add(key(c, rr)); path.push(g(c, rr)); if (r() < 0.3) dir = 1 - dir;
      }
      if (path.length > 1) { made++; C.poly(path, W0, 0.62); C.circ(path[path.length - 1][0], path[path.length - 1][1], 2.6, W0, 0.7, 0, 7); }
    }
    for (let k = 0; k < 7; k++) C.seg(g(k, 14.5), g(k, 14.5 + 1.2 + (k % 3) * 0.6), W0, 0.55); // the drips below
  }
  const city = lines(C.R, { glow: true }); root.add(city.obj);

  // ───────────────────────────── the cloud: a spiral and flowers (AMOR) ─────────────────────────────
  // (A part that moves is drawn in absolute cover pixels and hosted by a group whose origin is its own centre.)
  const spiralPen = pen(61), flowerPen = pen(62);
  spiralPen.spiral(278, 636, 3, 21, 3.4, W1, 1);
  for (const [x, y, r] of [[208, 666, 11], [198, 694, 9], [232, 692, 7]]) flowerPen.flower(x, y, r, W0, 1);
  flowerPen.poly(spline([[208, 678], [214, 700], [204, 722]], 5), W0, 0.8);
  const spiralL = lines(spiralPen.R), flowerL = lines(flowerPen.R);
  // rotate the spiral about its own centre: wrap it in a group placed at the centre, offset its content back
  const NNv = V3(...NN), spiralC = P(278, 636, 0), spiralHost = grp(root, spiralC[0], spiralC[1], spiralC[2]);
  spiralL.obj.position.set(-spiralC[0], -spiralC[1], -spiralC[2]); spiralHost.add(spiralL.obj);
  root.add(flowerL.obj);

  // ───────────────────────────── the rocket's ✓ (it flips to a ✗ when ÉXITO is cut) ─────────────────────────────
  const checkPen = pen(63), crossPen = pen(64);
  checkPen.poly([[588, 708], [598, 719], [620, 694]], W2, 1);
  crossPen.seg([594, 696], [616, 720], W2, 1); crossPen.seg([616, 696], [594, 720], W2, 1);
  const checkL = lines(checkPen.R, { glow: true }), crossL = lines(crossPen.R, { glow: true }); root.add(checkL.obj, crossL.obj);

  // ───────────────────────────── the maze's single wire, and the four feeds it visits ─────────────────────────────
  const WIRE = SISTEMA_WIRE, wp = WIRE.path.map(([c, r]) => [WIRE.origin[0] + c * WIRE.cell, WIRE.origin[1] + r * WIRE.cell]);
  const wirePen = pen(65);
  wirePen.poly(wp, W2, 1); wirePen.circ(wp[0][0], wp[0][1], 6.5, W2, 1, 0, 14); wirePen.circ(wp[0][0], wp[0][1], 2.6, W1, 1, 0, 8);
  wirePen.poly(wp, W0 * 0.6, 0.35, false, 0.05);
  const wireL = lines(wirePen.R, { glow: true }); root.add(wireL.obj);
  const wireLen = [0]; for (let i = 1; i < wp.length; i++) wireLen.push(wireLen[i - 1] + Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1]));
  const wireTotal = wireLen[wireLen.length - 1];
  const wireAt = (u) => { const dd = u * wireTotal; let i = 1; while (i < wireLen.length - 1 && wireLen[i] < dd) i++; const k = (dd - wireLen[i - 1]) / ((wireLen[i] - wireLen[i - 1]) || 1); return [lerp(wp[i - 1][0], wp[i][0], k), lerp(wp[i - 1][1], wp[i][1], k)]; };
  const FEEDS = ['plata', 'exito', 'amor', 'sustancias'];
  const iconL = {}; // each feed's icon at its node: a coin, a star, a flower, a capsule
  for (const [name, vi] of Object.entries(WIRE.nodes)) {
    const [x, y] = wp[vi], I = pen(70 + vi);
    I.circ(x, y, 9, W1, 1, 0, 16);
    if (name === 'plata') { I.circ(x, y, 5.4, W0, 0.9, 0, 12); I.seg([x, y - 3.6], [x, y + 3.6], W0, 0.9); }
    else if (name === 'exito') I.star(x, y, 6.4, W0, 1);
    else if (name === 'amor') I.flower(x, y, 6.2, W0 * 0.8, 1);
    else { I.pill(x, y, 7, 15, W0, 1, 0, 0.6); I.seg([x - 3, y + 3], [x + 3, y - 3], W0 * 0.8, 0.9); }
    iconL[name] = lines(I.R, { glow: true }); root.add(iconL[name].obj);
  }
  const nodeU = {}; for (const [name, vi] of Object.entries(WIRE.nodes)) nodeU[name] = wireLen[vi] / wireTotal;
  const pulse = kit.points([[0, 0, 0, 0.1, 1, 0.3, 0], [0, 0, 0, 0.05, 1, 0.6, 0]], { shape: 3, tint: [1, 0.95, 0.8] }); root.add(pulse.obj);

  // ───────────────────────────── the hole: rings that drain, the gauge ─────────────────────────────
  const holeG = grp(root, ...P(HOLE[0], HOLE[1], 0.02)), rings = [];
  for (let i = 0; i < 4; i++) {
    const R = kit.ribbons(80 + i), r = (13 + i * 11) * K;
    R.poly(RG.arc([0, 0, 0], [1, 0, 0], EY, r, r, 40), i === 3 ? W2 : W1, 1, true);
    const L = lines(R, { glow: i === 3 }), g = grp(holeG); g.add(L.obj); rings.push({ g, L, base: i });
  }
  { const R = kit.ribbons(89); R.poly(RG.arc([0, 0, 0], [1, 0, 0], EY, 6 * K, 6 * K, 16), W1, 1, true); const L = lines(R); holeG.add(L.obj); rings.push({ g: holeG, L, base: -1, fixed: true }); }
  const gaugeSt = { needle: 0, solved: 0, key: '' };
  const gaugeTex = ctx.canvasTex(320, 128, (c, w, h) => drawSistemaGauge(c, w, h, gaugeSt));
  const gauge = kit.plane(gaugeTex, 150 * K, 60 * K); gauge.mesh.position.set(...P(462, 925, 0.03)); gauge.mesh.rotation.x = S.tilt - Math.PI / 2; root.add(gauge.mesh);
  const redrawGauge = () => { drawSistemaGauge(gaugeTex.image.getContext('2d'), gaugeTex.image.width, gaugeTex.image.height, gaugeSt); gaugeTex.needsUpdate = true; };
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = FONT_DISPLAY(70, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, h / 2 + 4); }), 0.8, 0.3, { alpha: 0.8 });
  sig.mesh.position.set(...P(724, 1132, 0.01)); sig.mesh.rotation.x = S.tilt - Math.PI / 2; root.add(sig.mesh);

  // ───────────────────────────── sprites: windows, stars, dots, glitter, smoke ─────────────────────────────
  const plataWin = kit.points(dots.goldPlata, { shape: 0, twinkle: 0.9, tint: [1, 0.78, 0.28] }); root.add(plataWin.obj);
  const plataGlit = kit.points(dots.goldPlata.map((r) => [r[0], r[1], r[2], r[3] * 2.2, 0.8, r[5], 0]), { shape: 3, twinkle: 0.9, tint: [1, 0.82, 0.4] }); root.add(plataGlit.obj);
  const towerWin = kit.points(dots.goldTowers, { shape: 0, twinkle: 0.85, tint: [1, 0.78, 0.28] }); root.add(towerWin.obj);
  const towerGlit = kit.points(dots.goldTowers.map((r) => [r[0], r[1], r[2], r[3] * 2.2, 0.8, r[5], 0]), { shape: 3, twinkle: 0.9, tint: [1, 0.82, 0.4] }); root.add(towerGlit.obj);
  const whiteWin = kit.points(dots.white, { shape: 0, twinkle: 0.35, tint: [0.93, 0.9, 0.82] }); root.add(whiteWin.obj);
  { // the dotted field bottom left, the drips under the hatch, a spray of dots around the maze's edge
    const rows = [], r = mulberry32(91);
    for (let i = 0; i < (lite ? 70 : 150); i++) { const x = 190 + r() * 150, y = 1008 + Math.pow(r(), 0.8) * 122, fall = 1 - (y - 1008) / 130; if (r() > fall * 0.95 + 0.12 || x - 190 > 150 * (1.15 - (y - 1008) / 190)) continue; const p = P(x, y, 0.01); rows.push([p[0], p[1], p[2], 0.016 + r() * 0.012, 0.85, r(), 0]); }
    for (let c = 0; c < 6; c++) for (let k = 0; k < 5; k++) { const p = P(352 + c * 9, 1030 + k * 11 + (c % 2) * 5, 0.01); rows.push([p[0], p[1], p[2], 0.015, 0.8, r(), 0]); }
    const f = kit.points(rows, { shape: 0, tint: [0.93, 0.9, 0.82] }); root.add(f.obj);
  }
  const sparkRows = [[701, 829], [527, 603], [545, 577], [581, 566], [212, 608], [234, 579], [268, 576], [311, 571], [353, 568], [397, 586], [420, 622]].map(([x, y], i) => { const p = P(x, y, 0.03); return [p[0], p[1], p[2], 0.1 + (i % 3) * 0.025, 0.85, i * 0.17, 0]; });
  const sparkles = kit.points(sparkRows, { shape: 3, twinkle: 0.9, tint: [1, 0.9, 0.6] }); root.add(sparkles.obj);
  const smokeFrom = P(588, 1118, 0.12), smokeTo = P(576, 782, 0.2);
  const smokeN = lite ? 16 : 34;
  const smoke = kit.points(Array.from({ length: smokeN }, (_, i) => [smokeFrom[0], smokeFrom[1], smokeFrom[2], 0.15 + rnd() * 0.07, 0.9, i / smokeN, 0]), { shape: 0, mode: 1, rise: [smokeTo[0] - smokeFrom[0], smokeTo[1] - smokeFrom[1], smokeTo[2] - smokeFrom[2]], speed: 0.085, spread: 0.1, tint: [0.97, 0.96, 0.93] }); root.add(smoke.obj);

  // ───────────────────────────── things that flow into the hole (computed on the CPU along the roads) ─────────────────────────────
  const holeP = P(HOLE[0], HOLE[1], 0.03);
  const flow = (path, n, size, tint, speed) => {
    const pts = lift(path), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const tot = cum[cum.length - 1], count = lite ? Math.ceil(n / 2) : n, rows = Array.from({ length: count }, (_, i) => [0, 0, 0, size, 0.9, i / count, 0]);
    const o = kit.points(rows, { shape: 0, tint }); root.add(o.obj);
    return {
      o, ph: rnd(),
      step(dt, rate, alpha) {
        this.ph = (this.ph + (dt * speed * rate) / tot * 1.0) % 1;
        for (let i = 0; i < count; i++) {
          const u = (this.ph + i / count) % 1, dd = u * tot; let k = 1; while (k < cum.length - 1 && cum[k] < dd) k++;
          const f = (dd - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1);
          o.pos[i * 3] = lerp(pts[k - 1][0], pts[k][0], f); o.pos[i * 3 + 1] = lerp(pts[k - 1][1], pts[k][1], f); o.pos[i * 3 + 2] = lerp(pts[k - 1][2], pts[k][2], f);
          o.dat[i * 4 + 1] = Math.sin(u * Math.PI) * 0.95 * alpha;
        }
        o.geo.attributes.position.needsUpdate = true; o.geo.attributes.aData.needsUpdate = true;
      },
    };
  };
  const flowArch = flow(archPath, 16, 0.045, [0.95, 0.92, 0.85], 0.55), flowTower = flow(towerRoad, 12, 0.045, [0.95, 0.92, 0.85], 0.5);
  const flowTop = flow([[450, 552], [450, 700], [456, 800], HOLE], 14, 0.04, [0.95, 0.92, 0.85], 0.6), flowBot = flow([[480, 1104], [480, 980], [470, 880], HOLE], 14, 0.04, [0.95, 0.92, 0.85], 0.6);
  const flowWire = flow(spline([wp[wp.length - 1], [wp[wp.length - 1][0] + 20, 1000], [330, 990], [380, 930], [HOLE[0] - 40, HOLE[1] + 40], HOLE], 5), 10, 0.035, [1, 0.8, 0.4], 0.4);
  // capsules rolling down the middle road (SUSTANCIAS): each is drawn around the board's centre point and hosted by a group at its own centre
  const caps = [], C0 = P(465, 840, 0.03);
  for (let i = 0; i < 4; i++) {
    const D = pen(100 + i);
    D.pill(465, 840, 14, 30, W1, 1, 0.03, 0.4); D.seg([461, 844], [469, 836], W0, 0.8, 0.03);
    const L = lines(D.R, { glow: true }), g = grp(root, ...C0);
    L.obj.position.set(-C0[0], -C0[1], -C0[2]); g.add(L.obj);
    caps.push({ g, L, x: i < 2 ? 450 : 478, up: i < 2, ph: i * 0.37 });
  }

  // ───────────────────────────── the page that flies to the book ─────────────────────────────
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, h) => BookArt.drawSheet(c, w, h)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const anchorSpec = { 'rm-hole': ['hole', 0.12, 1.1, 1.1], 'rm-circuit': ['circuit', 0.08, 1.0, 1.6], 'rm-plata': ['plata', 0.3, 1.1, 1.0], 'rm-exito': ['exito', 0.28, 0.9, 1.0], 'rm-amor': ['amor', 0.12, 0.9, 0.7], 'rm-sustancias': ['sustancias', 0.3, 0.8, 2.0] };
  for (const [id, [k, h, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(SISTEMA_PX[k][0], SISTEMA_PX[k][1], h)), w, h: hh };
  const solids = [(() => { const p = W3([0, 0, 0.1]); return { kind: 'box', x: p.x, z: p.z, hw: 2.75, hd: 1.85, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the board that is looked at ─────────────────────────────
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld();
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    const look = SISTEMA_PX.looks[view];
    if (!look) return null;
    const f = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (f.x0 + f.x1) / 2, sy = (f.y0 + f.y1) / 2, fw = (f.x1 - f.x0) * 0.9, fh = (f.y1 - f.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const at = look.at || SISTEMA_PX[view], c = P(at[0], at[1], 0.1), d = fit(look.w, look.h, fw, fh, fov, a);
    return aim([c[0] + NN[0] * d, c[1] + NN[1] * d, c[2] + NN[2] * d], c, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  const st = { T: 0, spin: 0, pulse: 0, run: [1, 1, 1, 1], quiet: 0 };
  const tmpV = V3(), tmpF = V3(), tmpU = V3();
  function update(dt, t) {
    const v = world.room.v || {}, cut = v.cut || [0, 0, 0, 0], quiet = v.quiet || 0, m = world.reduced ? 0 : 1, breath = v.breath || 0, surge = v.surge || 0;
    st.T += dt * m; RU.uTime.value = st.T;
    for (let i = 0; i < 4; i++) st.run[i] = damp(st.run[i], 1 - cut[i], 3, dt);
    st.quiet = damp(st.quiet, quiet, 3, dt);
    const [rPlata, rExito, rAmor, rSust] = st.run, calm = 1 - st.quiet, gen = (1 - 0.85 * st.quiet);
    // windows: the gold block's lights (PLATA) go out when it is cut; every gold window goes dark when the city is quiet
    plataWin.set(rPlata * calm); plataGlit.set(0.9 * rPlata * calm); towerWin.set(0.95 * calm); towerGlit.set(0.9 * calm); whiteWin.set(0.8 * (0.3 + 0.7 * calm));
    sparkles.set(0.9 * (0.4 + 0.6 * calm)); smoke.set(rSust * gen);
    // the rocket's ✓ becomes a ✗
    checkL.set(1 - cut[1]); crossL.set(cut[1]);
    // the cloud: the spiral turns while AMOR is open, the flowers breathe
    st.spin -= dt * 0.9 * rAmor * m * (surge ? 2.2 : 1); spiralHost.quaternion.setFromAxisAngle(NNv, st.spin); spiralL.set(0.45 + 0.55 * rAmor); flowerL.set(0.5 + 0.5 * rAmor);
    // the flows into the hole: each road has its own feed; the middle road and the wire are the city's own
    const rate = (1 + 2.2 * surge) * m;
    flowArch.step(dt, rate * rAmor, 0.95 * rAmor); flowTower.step(dt, rate * rExito, 0.95 * rExito);
    flowTop.step(dt, rate * (1 - st.quiet), (1 - st.quiet)); flowBot.step(dt, rate * (1 - st.quiet), (1 - st.quiet)); flowWire.step(dt, rate * (1 - st.quiet), (1 - st.quiet));
    // capsules
    for (const c of caps) {
      c.ph = (c.ph + dt * 0.11 * rSust * m * (1 + 1.5 * surge)) % 1;
      const y = c.up ? lerp(556, 800, c.ph) : lerp(1100, 880, c.ph), p = P(c.x + Math.sin(c.ph * 9) * 2, y, 0.03);
      c.g.position.set(p[0], p[1], p[2]); c.g.quaternion.setFromAxisAngle(NNv, Math.sin(c.ph * 12) * 0.25 * m);
      c.L.set(rSust * (1 - 0.15 * st.quiet) * Math.sin(Math.PI * Math.min(1, c.ph * 1.1 + 0.02)) ** 0.5);
    }
    // the hole: the rings drain inward (the middle of them keeps still); a breath opens and closes them
    rings.forEach((r) => {
      if (r.fixed) return;
      const u = (st.T * 0.4 * (0.3 + 0.7 * calm) + r.base * 0.25) % 1, base = 1 + 0.1 * Math.sin(t * 0.7 + r.base) * m * calm;
      r.g.scale.setScalar(Math.max(0.05, (base + 0.25 * breath) * (1.0 - 0.12 * u * calm)));
      r.L.set(0.55 + 0.45 * (r.base === 3 ? 1 : Math.sin(u * Math.PI)));
    });
    // the gauge: it trembles when more is poured in, and never leaves its place
    const nd = Math.max(0, surge) * (0.12 + 0.1 * Math.sin(st.T * 40)), solved = v.solved || 0;
    if (Math.abs(nd - gaugeSt.needle) > 0.004 || (solved > 0.5) !== (gaugeSt.solved > 0.5)) { gaugeSt.needle = nd; gaugeSt.solved = solved; redrawGauge(); }
    gauge.set(0.9);
    // the maze's pulse: one slow lap along the wire; each feed's icon lights as it passes
    st.pulse = (st.pulse + dt * 0.075 * m) % 1.35;
    const u = Math.min(1, st.pulse), pp = wireAt(u), pw = P(pp[0], pp[1], 0.06);
    pulse.pos[0] = pw[0]; pulse.pos[1] = pw[1]; pulse.pos[2] = pw[2]; pulse.pos[3] = pw[0]; pulse.pos[4] = pw[1]; pulse.pos[5] = pw[2];
    pulse.geo.attributes.position.needsUpdate = true; pulse.set(st.pulse < 1.05 ? 1 : 0);
    for (const name of FEEDS) iconL[name].set(0.55 + 0.45 * Math.max(0, 1 - Math.abs(u - nodeU[name]) / 0.1) * (st.pulse < 1.2 ? 1 : 0) + 0.12 * Math.sin(t * 3 + nodeU[name] * 9) * m);
    wireL.set(0.8 + 0.2 * calm); city.set(0.85 + 0.15 * calm); sig.set(0.8);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const mid = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(holeP[0], holeP[1], holeP[2] + 0.2)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mid.clone();
      sheet.mesh.position.lerpVectors(from, mid, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh],
    info: () => ({ segments: segTotal, lite, windows: dots.goldPlata.length + dots.goldTowers.length, wire: Object.keys(WIRE.nodes).join(',') }),
  };
};
