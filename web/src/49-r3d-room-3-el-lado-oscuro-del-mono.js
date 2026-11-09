// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 3 · «EL LADO OSCURO DEL MONO»  (the cover, as a screaming mouth: white chalk on black, gold and silver teeth)
//   The drawing is a huge monkey mouth framed by jagged fur and two angry eyes, its teeth gold and silver, several of the
//   lower ones crossed out with an ✗; a graffiti tag loops out of the mouth; two asterisk stars, ink splatter top left,
//   "11:11" in a corner. Built as a relief board leaning back toward the visitor (so the whole drawing reads from where
//   they stand, with the teeth standing out of it), laid out in the cover's own pixels (see P()).
//   Ambient movement while the mouth screams: the mouth and the fur tremble, the tag grows and shrinks, the splatter shimmers
//   with heat, the gold glints, a drip falls from the lip. world.room.v holds the targets (the controller, 59-room-3-…, sets
//   them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
//   Tooth shards float on the water around the board: eight spots, as many as there are crossed-out teeth (3 + breaks).
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Local frame (metres): +x to the viewer's right, +z toward the visitor, y up. The board leans back by `tilt`. */
const GRITO_SET = { x: 0, z: 9.2, yc: 2.35, K: 0.0068, tilt: (58 * Math.PI) / 180, o: [470, 880] };
/** The cover's pixels (the photo is 900 wide) that hotspots and close looks aim at, and how much each look shows (metres). */
const GRITO_PX = {
  heat: [228, 652], fur: [236, 850], tag: [560, 815], mouth: [350, 905], pivot: [350, 850],
  looks: { tinta: { at: [236, 656], w: 1.3, h: 1.05 }, pelo: { at: [240, 846], w: 1.2, h: 2.2 }, firma: { at: [560, 815], w: 2.9, h: 2.2 }, dientes: { at: [350, 880], w: 2.1, h: 3.2 } },
};
/** The teeth: [id, centre x, centre y, width, height, turn (rad), kind] in cover pixels. U = upper row, L and R = the lower columns, B = the bottom row. */
const GRITO_TEETH = [
  ...Array.from({ length: 7 }, (_, i) => ['U' + i, 312 + i * 13, 718 - i * 2.5, 13, 21, -0.13, i === 6 ? 'gold' : i < 4 ? 'silver' : 'white']),
  ['L0', 290, 868, 21, 21, -0.37, 'white'], ['L1', 302, 893, 21, 21, -0.37, 'white'], ['L2', 312, 922, 21, 21, -0.37, 'white'], ['L3', 318, 948, 21, 21, -0.37, 'white'],
  ['R0', 390, 855, 21, 21, -0.49, 'white'], ['R1', 402, 877, 21, 21, -0.49, 'gold'], ['R2', 413, 898, 21, 21, -0.49, 'white'],
  ['B0', 353, 1003, 17, 23, -0.35, 'white'], ['B1', 373, 1007, 17, 23, -0.35, 'gold'], ['B2', 385, 1003, 17, 23, -0.35, 'gold'], ['B3', 400, 990, 17, 23, -0.35, 'white'], ['B4', 413, 977, 17, 23, -0.35, 'white'],
];
/** The order in which teeth carry an ✗ (the first three from the start; every break adds the next one). */
const GRITO_BREAK = ['L0', 'L1', 'L2', 'R0', 'R2', 'L3', 'B0', 'B4'];
/** Where the shards float, in the set's own frame [x, z] (the visitor arrives at z ≈ 6.5, looking toward the board): all to the sides, none in the first view. */
const GRITO_SHARDS = [[-4.2, 3.0], [4.4, 3.4], [-6.6, 0.2], [6.8, 0.8], [-8.0, 4.8], [8.2, 5.4], [-7.6, -2.6], [7.8, -3.0]];

ROOM_SETS['el-lado-oscuro-del-mono'] = function buildGrito(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, S = GRITO_SET, lite = ctx.lite, K = S.K, sT = Math.sin(S.tilt), cT = Math.cos(S.tilt);
  const rnd = mulberry32(33);
  const root = new THREE.Group();
  root.position.set(S.x, 0, S.z);
  root.rotation.y = Math.atan2(-S.x, 2.7 - S.z); // the front (+z local) faces the place where the visitor stands
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const W3w = 4.2, W2 = 3.0, W1 = 2.0, W0 = 1.4; // line widths (CSS px)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };

  // ---- the board: cover pixels (x right, y down) → the set's metres; h lifts a point off the board ----
  const P = (px, py, h = 0) => { const X = (px - S.o[0]) * K, Y = -(py - S.o[1]) * K; return [X, S.yc + Y * sT + h * cT, -Y * cT + h * sT]; };
  const EY = [0, sT, -cT], NN = [0, cT, sT]; // up the drawing, and out of it (toward the visitor)
  const NNv = V3(...NN);
  const pen = (seed) => {
    const R = kit.ribbons(seed);
    const d = {
      R,
      seg: (a, b, w = W1, al = 1, h = 0) => R.seg(P(a[0], a[1], h), P(b[0], b[1], h), w, al),
      poly: (pts, w = W1, al = 1, closed = false, h = 0) => R.poly(pts.map((q) => P(q[0], q[1], h)), w, al, closed),
      circ: (cx, cy, r, w = W1, al = 1, h = 0, n = 14) => d.poly(Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]), w, al, true, h),
      /** A tooth: a block standing out of the board (base, top, four edges), turned about its centre. */
      quad(cx, cy, w, hgt, rot) { const c = Math.cos(rot), s2 = Math.sin(rot); return [[-w / 2, -hgt / 2], [w / 2, -hgt / 2], [w / 2, hgt / 2], [-w / 2, hgt / 2]].map(([x, y]) => [cx + x * c - y * s2, cy + x * s2 + y * c]); },
      block(q, hh, w = W1, al = 1) { d.poly(q, w, al, true, 0); d.poly(q, w, al, true, hh); for (const [x, y] of q) R.seg(P(x, y, 0), P(x, y, hh), w * 0.8, al); },
      pill(cx, cy, w, hgt, ww = W1, al = 0.95, h = 0, rot = 0) {
        const r = w / 2, L = hgt / 2 - r, pts = [], c = Math.cos(rot), s2 = Math.sin(rot), put = (x, y) => pts.push([cx + x * c - y * s2, cy + x * s2 + y * c]);
        for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; put(Math.cos(a) * r, -L + Math.sin(a) * r); }
        for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; put(Math.cos(a) * r, L + Math.sin(a) * r); }
        d.poly(pts, ww, al, true, h);
      },
      /** An asterisk of uneven arms, drawn as strokes through the centre. */
      asterisk(cx, cy, lens, rot, ww = W2, al = 1, h = 0) { lens.forEach((L, i) => { const a = rot + (i * TAU) / lens.length; d.seg([cx, cy], [cx + Math.cos(a) * L, cy + Math.sin(a) * L], ww, al, h); }); d.circ(cx, cy, 3, W1, al, h, 8); },
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
  const spline = (pts, n = 7, closed = false) => {
    const out = [], m = pts.length, at = (i) => (closed ? pts[((i % m) + m) % m] : pts[Math.max(0, Math.min(m - 1, i))]);
    for (let i = 0; i < (closed ? m : m - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    if (!closed) out.push(pts[pts.length - 1]);
    return out;
  };
  /** Hair: a jagged line that follows a path (clockwise on screen: the push is outward), every `step` px alternating between the path and a tuft. */
  const furZig = (path, amp, step, seed, inward = 0) => {
    const r = mulberry32(seed), pts = [];
    walk(path.concat([path[0]]), step, (p, t, i) => {
      const nx = t[1], ny = -t[0], a = amp * (0.5 + r()), o = (i % 2 ? a : -a * 0.2) - inward, j = (r() - 0.5) * step * 0.6;
      pts.push([p[0] + nx * o + t[0] * j, p[1] + ny * o + t[1] * j]);
    });
    return pts;
  };
  const dots = { white: [], gold: [], silver: [] }; // sprite rows: [x, y, z, size, alpha, seed, kind]
  const dot = (list, x, y, h, sz, al = 0.9) => { const p = P(x, y, h); list.push([p[0], p[1], p[2], sz, al, rnd(), 0]); };

  // ───────────────────────────── the paper, scratches and flecks (the part that does not move) ─────────────────────────────
  const C = pen(7);
  C.poly([[100, 440], [815, 440], [815, 1175], [100, 1175]], 1.6, 0.35, true);
  for (const [a, b] of [[[330, 521], [386, 516]], [[521, 545], [562, 539]], [[150, 1148], [236, 1128]], [[580, 1121], [700, 1129]], [[120, 760], [164, 760]], [[650, 590], [706, 640]]]) C.seg(a, b, W0, 0.28);
  for (const [a, b] of [[[440, 650], [482, 688]], [[598, 626], [664, 664]], [[651, 700], [676, 748]], [[420, 678], [470, 700]]]) walk([a, b], 6, (p) => dot(dots.white, p[0], p[1], 0, 0.016, 0.85));
  for (const [x, y, s2] of [[212, 632, 0.07], [241, 607, 0.05], [281, 604, 0.05], [528, 517, 0.035], [150, 600, 0.03], [196, 622, 0.035]]) dot(dots.white, x, y, 0, s2, 0.95);
  const cityL = lines(C.R, { glow: true }); root.add(cityL.obj);

  // ───────────────────────────── the mouth (it trembles as a whole): lips, gum, teeth, throat ─────────────────────────────
  const mouthG = grp(root);
  const M = pen(8);
  const LIP = [[283, 730], [285, 703], [300, 687], [333, 677], [373, 670], [400, 670], [417, 687], [418, 730], [417, 770], [413, 807], [417, 853], [430, 903], [433, 953], [423, 987], [407, 1013], [373, 1033], [340, 1037], [317, 1023], [300, 997], [290, 953], [277, 913], [267, 873], [263, 837], [267, 807], [277, 770]];
  const lipS = spline(LIP, 5, true), MC = [348, 855];
  M.poly(lipS, W3w, 1, true);
  M.poly(lipS.map(([x, y]) => [MC[0] + (x - MC[0]) * 0.9, MC[1] + (y - MC[1]) * 0.9]), W1, 0.85, true);
  M.poly(spline([[283, 730], [310, 698], [357, 687], [387, 683], [417, 697]], 6), W2, 0.9); // the upper gum
  M.poly(spline([[277, 860], [310, 987], [350, 1027], [400, 1017], [427, 973], [430, 903]], 6), W1, 0.8); // the lower lip, inside
  M.poly(spline([[373, 710], [387, 753], [400, 807], [407, 853]], 5), W1, 0.85); M.poly(spline([[400, 707], [413, 753], [417, 807]], 5), W1, 0.8); // the strap of the cheek
  for (const [a, b, c2] of [[[327, 737], [336, 750], [330, 768]], [[343, 733], [352, 748], [346, 766]], [[360, 742], [354, 756], [362, 772]]]) M.poly(spline([a, b, c2], 4), W0, 0.55); // inside, a curl
  M.poly([[298, 680], [322, 667], [323, 685]], W2, 1, true); M.poly([[335, 676], [358, 660], [358, 679]], W2, 1, true); // the angry eyes
  for (const [a, b] of [[[290, 655], [309, 645]], [[304, 651], [324, 640]], [[320, 655], [342, 642]], [[345, 652], [364, 640]], [[366, 650], [388, 641]]]) M.seg(a, b, W1, 0.9); // brows
  // the teeth, standing out of the board
  const TH = 0.04, toothQ = {};
  const rounded = (q, r) => q.flatMap((c, i) => { const a = q[(i + 3) % 4], b = q[(i + 1) % 4], la = Math.hypot(a[0] - c[0], a[1] - c[1]), lb = Math.hypot(b[0] - c[0], b[1] - c[1]); return [[c[0] + ((a[0] - c[0]) * r) / la, c[1] + ((a[1] - c[1]) * r) / la], [c[0] + ((b[0] - c[0]) * r) / lb, c[1] + ((b[1] - c[1]) * r) / lb]]; });
  for (const t of GRITO_TEETH) { // a tooth: a rounded block, its crown above its root (the relief)
    const q = M.quad(t[1], t[2], t[3], t[4], t[5]), rq = rounded(q, 3.2); toothQ[t[0]] = q;
    M.poly(rq, W1, 0.5, true, 0); M.poly(rq, W1 * 1.15, 1, true, TH);
    if (!lite) M.poly(rounded(M.quad(t[1], t[2], t[3] * 0.55, t[4] * 0.55, t[5]), 2), W0, 0.45, true, TH);
  }
  const mouthL = lines(M.R, { glow: true }); mouthG.add(mouthL.obj);
  // the glitter: gold fills the gold teeth, silver the upper left; each tooth has its own sprinkle
  const sprinkle = (list, q, n, sz) => { const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2; for (let i = 0; i < n; i++) { const u = rnd(), v = rnd(), x = lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), y = lerp(lerp(q[0][1], q[1][1], u), lerp(q[3][1], q[2][1], u), v); dot(list, x, y, TH + 0.012, sz * (0.7 + rnd() * 0.6), 0.9); } return [cx, cy]; };
  const goldCentres = [], silverCentres = [];
  for (const t of GRITO_TEETH) {
    if (t[6] === 'gold') goldCentres.push(sprinkle(dots.gold, toothQ[t[0]], lite ? 7 : 14, 0.03));
    else if (t[6] === 'silver') silverCentres.push(sprinkle(dots.silver, toothQ[t[0]], lite ? 3 : 6, 0.022));
  }
  for (let i = 0; i < (lite ? 5 : 11); i++) dot(dots.silver, 284 + rnd() * 20, 712 + rnd() * 20, 0.02, 0.02 + rnd() * 0.012, 0.85); // the silver on the upper left lip
  { // the throat: a dotted tongue (dark and stippled) and the dots on the dark
    const n = lite ? 60 : 150;
    for (let i = 0; i < n; i++) { const a = rnd() * TAU, r2 = Math.sqrt(rnd()); dot(dots.white, 352 + Math.cos(a) * 46 * r2, 937 + Math.sin(a) * 36 * r2, 0.01, 0.012 + rnd() * 0.007, 0.8); }
  }
  const mouthGold = kit.points(dots.gold, { shape: 0, twinkle: 0.9, tint: [1, 0.78, 0.28] }); mouthG.add(mouthGold.obj);
  const mouthGlit = kit.points(goldCentres.map((c, i) => { const p = P(c[0], c[1], TH + 0.03); return [p[0], p[1], p[2], 0.2, 0.9, i * 0.23, 0]; }), { shape: 3, twinkle: 0.95, tint: [1, 0.85, 0.45] }); mouthG.add(mouthGlit.obj);
  const mouthSilver = kit.points(dots.silver, { shape: 0, twinkle: 0.9, tint: [0.8, 0.88, 1] }); mouthG.add(mouthSilver.obj);
  const silverGlit = kit.points(silverCentres.map((c, i) => { const p = P(c[0], c[1], TH + 0.03); return [p[0], p[1], p[2], 0.12, 0.8, i * 0.31, 0]; }), { shape: 3, twinkle: 0.95, tint: [0.85, 0.92, 1] }); mouthG.add(silverGlit.obj);
  // the crossed-out teeth (an ✗ each, drawn in as the teeth break) and the repairs (gold: a rim and a crack, like kintsugi)
  const crossL = [], repairL = [], repairRows = [], repairGlitRows = [];
  GRITO_BREAK.forEach((id, k) => {
    const t = GRITO_TEETH.find((x) => x[0] === id), q = toothQ[id], X = pen(40 + k), G = pen(60 + k), r2 = mulberry32(90 + k);
    const [cx, cy] = [t[1], t[2]], e = (a, b, w) => X.seg([cx + a[0] * t[3] * 0.3, cy + a[1] * t[4] * 0.3], [cx + b[0] * t[3] * 0.3, cy + b[1] * t[4] * 0.3], w, 1, TH + 0.01);
    e([-1, -1], [1, 1], W2); e([1, -1], [-1, 1], W2);
    G.poly(q, W2, 1, true, TH + 0.012);
    G.poly([[cx - t[3] * 0.2, cy - t[4] * 0.45], [cx + t[3] * 0.08, cy - t[4] * 0.18], [cx - t[3] * 0.1, cy + t[4] * 0.02], [cx + t[3] * 0.18, cy + t[4] * 0.24], [cx, cy + t[4] * 0.46]], W2, 1, false, TH + 0.015);
    crossL.push(lines(X.R, { glow: true })); repairL.push(lines(G.R, { glow: true, tint: [1, 0.8, 0.34] }));
    mouthG.add(crossL[k].obj, repairL[k].obj);
    const rows = []; for (let i = 0; i < (lite ? 6 : 12); i++) { const p = P(cx + (r2() - 0.5) * t[3] * 0.8, cy + (r2() - 0.5) * t[4] * 0.8, TH + 0.014); rows.push([p[0], p[1], p[2], 0.03 + r2() * 0.014, 0.95, r2(), 0]); }
    { const p = P(cx, cy, TH + 0.03); repairGlitRows.push([p[0], p[1], p[2], 0.2, 0.95, r2(), 0]); }
    repairRows.push(rows);
  });
  const repairPts = kit.points(repairRows.flat(), { shape: 0, twinkle: 0.9, tint: [1, 0.8, 0.3] }); mouthG.add(repairPts.obj);
  const repairGlit = kit.points(repairGlitRows, { shape: 3, twinkle: 0.95, tint: [1, 0.86, 0.5] }); mouthG.add(repairGlit.obj);
  const perRepair = repairRows[0].length;

  // ───────────────────────────── the fur (it bristles): jagged outlines and short hairs ─────────────────────────────
  const SIL = [[223, 807], [220, 730], [243, 683], [267, 670], [310, 660], [345, 655], [387, 653], [427, 670], [433, 720], [436, 800], [440, 920], [440, 1003], [427, 1037], [387, 1063], [363, 1113], [345, 1090], [320, 1087], [300, 1053], [277, 970], [257, 937], [243, 887], [230, 853]];
  const silS = spline(SIL, 5, true), F = pen(9);
  F.poly(furZig(silS, 6, 8, 71), W1, 1);
  if (!lite) F.poly(furZig(silS, 3, 9, 72, 8), W0, 0.55);
  for (let i = 0; i < (lite ? 8 : 18); i++) { const y = 742 + i * 10.5 + rnd() * 4, x0 = 219 + rnd() * 6; F.seg([x0, y], [x0 + 13 + rnd() * 5, y - 8 - rnd() * 3], W0, 0.7); } // hair on the left cheek
  for (let i = 0; i < (lite ? 5 : 10); i++) { const y = 700 + i * 20 + rnd() * 6; F.seg([436, y], [446 + rnd() * 4, y - 6], W0, 0.6); } // and on the right
  const furL = lines(F.R, { glow: true });
  const pivot = P(GRITO_PX.pivot[0], GRITO_PX.pivot[1], 0), furHost = grp(root, pivot[0], pivot[1], pivot[2]);
  furL.obj.position.set(-pivot[0], -pivot[1], -pivot[2]); furHost.add(furL.obj);

  // ───────────────────────────── the tag: a tube and the scribble that come out of the mouth (it grows, freezes, is swallowed) ─────────────────────────────
  const TG = pen(12);
  const TAG = [
    [[428, 790], [427, 750], [432, 720], [447, 700], [467, 697], [482, 713], [485, 740], [480, 773], [472, 797]],
    [[477, 787], [487, 763], [507, 750], [530, 748], [542, 763], [537, 787], [517, 803], [483, 797], [440, 790]],
    [[352, 834], [400, 797], [433, 790], [483, 787], [533, 797], [573, 827], [580, 873], [560, 893], [500, 887], [450, 880], [413, 907], [385, 925]],
    [[385, 925], [450, 920], [517, 922], [580, 917], [582, 887], [543, 883], [483, 885], [410, 910], [380, 926]],
    [[533, 807], [543, 740], [560, 693], [573, 672], [573, 740], [573, 883]],
    [[547, 822], [600, 820], [650, 819], [660, 826], [650, 834], [620, 830]],
    [[587, 827], [607, 773], [620, 747], [630, 750], [620, 797], [617, 820]],
    [[633, 723], [667, 813], [690, 880], [713, 933], [728, 897]],
    [[637, 760], [663, 800], [677, 827], [667, 900]],
    [[583, 893], [607, 900], [633, 897], [657, 873], [663, 840], [653, 820]],
  ];
  TAG.forEach((pts, i) => TG.poly(spline(pts, 4), i < 4 ? W3w : W2, 1));
  TG.pill(300, 825, 26, 120, W2, 1, 0, Math.atan2(20, 100) + Math.PI / 2); // the pale tube it comes out of, with its hatching
  for (let i = -2; i <= 2; i++) TG.seg([252 + i * 1.2, 817 + i * 4.4], [344 + i * 1.2, 837 + i * 4.4], W0, 0.5);
  const tagL = lines(TG.R, { glow: true });
  const tagC = P(350, 835, 0), tagHost = grp(root, tagC[0], tagC[1], tagC[2]);
  tagL.obj.position.set(-tagC[0], -tagC[1], -tagC[2]); tagHost.add(tagL.obj);

  // ───────────────────────────── the two stars, and 11:11 ─────────────────────────────
  const s1Pen = pen(14), s2Pen = pen(15);
  s1Pen.asterisk(497, 985, [46, 30, 40, 34, 44, 28], -1.25, W3w, 1); s2Pen.asterisk(652, 1040, [68, 40, 52, 62, 36, 48], -0.1, W3w, 1);
  const star1 = lines(s1Pen.R, { glow: true }), star2 = lines(s2Pen.R, { glow: true }); root.add(star1.obj, star2.obj);
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(66, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 4); }), 0.62, 0.23, { alpha: 0.8 });
  sig.mesh.position.set(...P(725, 488, 0.01)); sig.mesh.rotation.x = S.tilt - Math.PI / 2; root.add(sig.mesh);
  const wordPlane = kit.plane(ctx.canvasTex(512, 160, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(96, 'italic', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.7)'; c.shadowBlur = 16; c.fillStyle = '#fff'; c.fillText('perdón.', w / 2, hh / 2 + 4); }), 1.5, 0.47, { alpha: 0 });
  wordPlane.mesh.position.set(...P(430, 1118, 0.03)); wordPlane.mesh.rotation.x = S.tilt - Math.PI / 2; root.add(wordPlane.mesh);

  // ───────────────────────────── sprites: the splatter and its heat, the drip, the dots on the dark ─────────────────────────────
  const splat = kit.points(dots.white, { shape: 0, twinkle: 0.4, tint: [0.93, 0.9, 0.82] }); root.add(splat.obj);
  const heatRows = []; for (let i = 0; i < (lite ? 12 : 28); i++) { const p = P(170 + rnd() * 125, 650 + rnd() * 60, 0.03); heatRows.push([p[0], p[1], p[2], 0.05 + rnd() * 0.04, 0.9, i / (lite ? 12 : 28), 0]); }
  const heat = kit.points(heatRows, { shape: 0, mode: 1, rise: [EY[0] * 0.6, EY[1] * 0.6, EY[2] * 0.6], speed: 0.12, spread: 0.1, tint: [1, 0.78, 0.55] }); root.add(heat.obj);
  const drip = kit.points([[0, 0, 0, 0.07, 1, 0.5, 0]], { shape: 0, tint: [0.95, 0.93, 0.88] }); root.add(drip.obj);

  // ───────────────────────────── the shards floating on the water (one per crossed-out tooth) ─────────────────────────────
  const shards = [], shardRows = [], ringRows = [];
  GRITO_SHARDS.forEach(([x, z], i) => {
    const R = kit.ribbons(110 + i), r2 = mulberry32(120 + i), sc = 2;
    const pts = [[-0.12, 0], [-0.16, 0.2], [-0.07, 0.34], [0.03, 0.27], [0.15, 0.36], [0.14, 0.11], [0.05, 0]].map(([a, b]) => [a * sc * (0.9 + r2() * 0.2), b * sc * (0.9 + r2() * 0.2), 0]);
    R.poly(pts, W2, 1, true); R.poly([[0, 0.05 * sc, 0], [0.01 * sc, 0.2 * sc, 0], [-0.05 * sc, 0.3 * sc, 0]], W0, 0.6); R.poly([[-0.1 * sc, 0.1 * sc, 0], [0.1 * sc, 0.16 * sc, 0]], W0, 0.5);
    const L = lines(R, { glow: true }), g = grp(root, x, 0.5, z);
    g.rotation.y = Math.atan2(-x, 6.5 - z) + (r2() - 0.5) * 0.5; g.add(L.obj);
    shards.push({ g, L, x, z, ph: i * 1.7 });
    shardRows.push([x, 0.75, z, 0.36, 1, i * 0.37, 0]); ringRows.push([x, 0.68, z, 1.1, 0.6, i * 0.13, 0]);
  });
  const shardGlit = kit.points(shardRows, { shape: 3, twinkle: 0.9, tint: [1, 0.95, 0.8] }); root.add(shardGlit.obj);
  const rings = kit.points(ringRows, { shape: 2, tint: [0.9, 0.92, 0.95] }); root.add(rings.obj);

  // ───────────────────────────── the page that flies to the book ─────────────────────────────
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const anchorSpec = { 'rm-salpicadura': ['heat', 0.1, 1.2, 1.0], 'rm-pelo': ['fur', 0.1, 0.8, 1.7], 'rm-firma': ['tag', 0.12, 2.3, 1.6], 'rm-dientes': ['mouth', TH, 1.2, 1.6] };
  for (const [id, [k, h, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(GRITO_PX[k][0], GRITO_PX[k][1], h)), w, h: hh };
  GRITO_SHARDS.forEach(([x, z], i) => { ctx.anchors['rm-pieza-' + i] = { pos: W3([x, 0.5, z]), w: 0.95, h: 0.95 }; });
  const solids = [(() => { const p = W3([0, 0, -0.25]); return { kind: 'box', x: p.x, z: p.z, hw: 2.4, hd: 1.5, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the board that is looked at ─────────────────────────────
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld();
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    const look = GRITO_PX.looks[view];
    if (!look) return null;
    const f = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (f.x0 + f.x1) / 2, sy = (f.y0 + f.y1) / 2, fw = (f.x1 - f.x0) * 0.9, fh = (f.y1 - f.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const c = P(look.at[0], look.at[1], 0.1), d = fit(look.w, look.h, fw, fh, fov, a);
    return aim([c[0] + NN[0] * d, c[1] + NN[1] * d, c[2] + NN[2] * d], c, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) with its own rate, so a state change is always a smooth one.
  const N = GRITO_BREAK.length, D = { sign: [0, 0, 0], tag: 1, free: 1, x: Array(N).fill(0), fix: Array(N).fill(0), shard: Array(N).fill(0), ready: 0, calm: 0, word: 0, shout: 0 };
  const st = { T: 0, init: false, drip: 0, fixShown: Array(N).fill(-1) };
  const tmpV = V3(), tmpF = V3(), tmpU = V3(), spinQ = new THREE.Quaternion();
  const follow = (arr, tgt, rate, dt) => { for (let i = 0; i < arr.length; i++) arr[i] = damp(arr[i], tgt[i] || 0, rate, dt); };
  function update(dt, t) {
    const v = world.room.v || {}, ok = Array.isArray(v.sign) && Array.isArray(v.x), m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3;
    if (ok) {
      if (!st.init) { // the first frame with this floor's state: shown as it is, not animated in
        D.sign = v.sign.slice(); D.tag = v.tag; D.free = v.free; D.x = v.x.slice(); D.fix = v.fix.slice(); D.shard = v.shard.slice(); D.ready = v.ready; D.calm = v.calm; D.word = v.word; D.shout = v.shout || 0; st.init = true;
      }
      follow(D.sign, v.sign, rate, dt); follow(D.x, v.x, rate * 1.6, dt); follow(D.fix, v.fix, rate * 0.9, dt); follow(D.shard, v.shard, rate * 1.2, dt);
      D.tag = damp(D.tag, v.tag, rate * 0.7, dt); D.free = damp(D.free, v.free, rate, dt); D.ready = damp(D.ready, v.ready, rate, dt);
      D.calm = damp(D.calm, v.calm, rate * 0.5, dt); D.word = damp(D.word, v.word, rate * 0.5, dt); D.shout = damp(D.shout, v.shout || 0, 10, dt);
    }
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T, scream = (1 - D.calm) * m, sh = 1 + 3 * D.shout;
    // the mouth trembles as a whole; the fur shivers and stands on end when the tension is noticed
    mouthG.position.set(Math.sin(T * 37) * 0.0035 * scream * sh, Math.sin(T * 29 + 1) * 0.003 * scream * sh, 0);
    furHost.scale.setScalar(1 + (0.012 * Math.sin(T * 13) + 0.03 * D.sign[1] + 0.012 * D.shout) * (1 - D.calm * 0.9) * (m || 0.3));
    furL.set(0.8 + 0.2 * (0.5 + 0.5 * Math.sin(T * 11)) * scream + 0.1 * D.sign[1]); mouthL.set(0.92 + 0.08 * D.shout); cityL.set(0.85 + 0.15 * (1 - D.calm));
    // the tag: it grows and shrinks while the word pushes, freezes half out, and is swallowed
    const grow = (0.1 * Math.sin(T * 1.3) + 0.04 * Math.sin(T * 3.1)) * D.free * m, k = Math.max(0.001, D.tag * (1 + grow));
    tagHost.scale.setScalar(k); spinQ.setFromAxisAngle(NNv, -(1 - Math.min(1, D.tag)) * 0.9); tagHost.quaternion.copy(spinQ);
    tagL.set(Math.min(1, D.tag * 3.5)); tagHost.visible = D.tag > 0.01;
    // the stars twinkle; the splatter shimmers with heat (stronger once the heat is noticed)
    star1.set(0.72 + 0.28 * Math.sin(T * 1.7) * m); star2.set(0.72 + 0.28 * Math.sin(T * 1.3 + 2) * m);
    splat.set(0.75 + 0.25 * D.sign[0]); heat.set((0.4 + 0.5 * D.sign[0]) * (1 - D.calm));
    mouthGold.set(0.95); mouthGlit.set(0.9); mouthSilver.set(0.9); silverGlit.set(0.85);
    // the teeth: an ✗ where a tooth broke, gold where it was mended
    for (let i = 0; i < N; i++) { crossL[i].set(D.x[i] * (1 - D.fix[i]) * (0.85 + 0.15 * D.shout)); repairL[i].set(D.fix[i]); }
    let changed = false;
    for (let i = 0; i < N; i++) {
      const a = D.fix[i]; if (Math.abs(a - st.fixShown[i]) < 0.004) continue;
      st.fixShown[i] = a; changed = true;
      for (let j = 0; j < perRepair; j++) repairPts.dat[(i * perRepair + j) * 4 + 1] = a * 0.95;
      repairGlit.dat[i * 4 + 1] = a * 0.95;
    }
    if (changed) { repairPts.geo.attributes.aData.needsUpdate = true; repairGlit.geo.attributes.aData.needsUpdate = true; }
    // the drip falls from the lower lip while the mouth screams
    st.drip = (st.drip + dt * 0.35 * m) % 1;
    const dp = P(392, 1040 + st.drip * 70, 0.05); drip.pos[0] = dp[0]; drip.pos[1] = dp[1]; drip.pos[2] = dp[2]; drip.geo.attributes.position.needsUpdate = true; drip.set(Math.sin(st.drip * Math.PI) * 0.9 * (1 - D.calm));
    // the shards bob on the water; they shine when it is time to take them
    for (let i = 0; i < N; i++) {
      const s = shards[i], a = D.shard[i];
      s.g.visible = a > 0.01; s.g.position.y = 0.5 + 0.05 * Math.sin(T * 1.4 + s.ph) * m; s.g.rotation.z = 0.08 * Math.sin(T * 0.9 + s.ph) * m;
      s.L.set(a * (0.55 + 0.45 * D.ready));
      shardGlit.dat[i * 4 + 1] = a * (0.25 + 0.75 * D.ready); shardGlit.pos[i * 3 + 1] = 0.75 + 0.05 * Math.sin(T * 1.4 + s.ph) * m;
      rings.dat[i * 4 + 1] = a * 0.55 * (0.5 + 0.5 * Math.sin(T * 1.1 + s.ph)) ; rings.dat[i * 4] = 0.7 + 0.3 * ((T * 0.25 + i * 0.13) % 1);
    }
    shardGlit.geo.attributes.aData.needsUpdate = true; shardGlit.geo.attributes.position.needsUpdate = true; rings.geo.attributes.aData.needsUpdate = true;
    sig.set(0.8); wordPlane.set(D.word * 0.95);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const mid = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(350, 880, 0.2))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mid.clone();
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
    info: () => ({ segments: segTotal, lite, teeth: GRITO_TEETH.length, breakable: N, shards: GRITO_SHARDS.length, gold: dots.gold.length }),
  };
};
