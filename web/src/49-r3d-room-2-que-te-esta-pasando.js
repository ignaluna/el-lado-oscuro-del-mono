// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 2 · «¿QUÉ TE ESTÁ PASANDO?»  (the cover, as a city that is a circuit: white chalk on black, gold lit windows, silver hatched blocks)
//   The drawing: an isometric city that is a circuit. Blocks with gold-dotted windows, a winding road and a middle road with dashed lanes and tall pills,
//   a circuit maze on the left beside hatched silver blocks, a cloud with a swirl, stars and flowers top left, a rocket with a ✓ and a ✗ and a computer
//   lying down top right, towers with a column of smoke, a crossed sparkle, "11:11". The photo is a black paper taped on an orange graffiti wall, so the
//   tones were traced from a rectified copy (49-r3d-room-2-que-te-esta-pasando-art.js): the white and grey tones as contours at five levels, the gold
//   glitter (the lit windows, by hue) and the silver glitter (the hatched blocks, a zone) segmented apart and drawn on their own layers.
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels from there.
//   Layers share that eye and each sits at the depth that suits it; the cover's pixels are split among them with soft masks that add up to one, so from
//   the arrival spot the sum is the cover, seen frontally, and walking in opens it up:
//     · the paper's base (roads, maze, hatching, stars, curls, circuits) is the farthest layer, the silver blocks sit with it,
//     · the gold block (PLATA), the rocket and computer, the towers and the cloud are layers that stand forward of it, each with its own gold windows,
//     · what the puzzle changes or moves is cut from the same tones, tight: the swirl (turns while AMOR is open), the three flowers (breathe), the ✓ (becomes
//       a ✗), the column of smoke (rises, stops with SUSTANCIAS); the same polygon is cut from the layer behind it,
//     · the pills glint, things flow along the roads, a pulse runs along the maze's wire (found along the cover's own maze strokes) and lights the four feeds.
//   world.room.v holds the targets (the controller, 59-room-2-…, sets them whole); every value is damped here.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, Z0 how far (m) the drawing's plane is from the eye, ARR where the visitor arrives (z), BOT the cover row that stands 0.15 m above the floor. */
const SY = { H: 1.6, cx: 505, Z0: 5.5, ARR: 2.7, BOT: 985 };
/** Where the visitor stands when a floor opens is the eye; the drawing is Z0 metres ahead of it. */
const SY_SET = { x: 0, y: 1.6, z: SY.ARR + SY.Z0 };
/** The lens depends on the screen: a wide one fits the whole drawing between the title and the arrival line at 1250 cover px of focal length, a phone's narrow view at 1750. The set's z never changes. */
function syLens(a) { const wide = a >= 1.1, f = wide ? 1250 : 1750; return { wide, f, yh: SY.BOT - ((SY.H - 0.15) * f) / SY.Z0, row: wide ? 550 : 640, sx: wide ? 0.42 : 0.5, sy: wide ? 0.515 : 0.46 }; }
/** The cover's regions (rectified cover pixels, the paper is 1000 square): what moves (swirl, flowers, ✓, smoke) and the layers that stand forward (cloud, gold block, rocket, towers). */
const SY_POLY = {
  SPIRAL: [[298, 296], [296, 304], [291, 311], [282, 316], [274, 318], [266, 318], [257, 316], [248, 311], [241, 304], [236, 296], [241, 288], [248, 281], [257, 276], [266, 274], [274, 274], [282, 276], [291, 281], [296, 288]],
  FLA: [[196, 322], [194, 328], [190, 334], [184, 338], [175, 338], [166, 338], [160, 334], [156, 328], [154, 322], [156, 316], [160, 310], [166, 306], [175, 306], [184, 306], [190, 310], [194, 316]],
  FLB: [[188, 368], [187, 374], [183, 382], [177, 387], [167, 389], [157, 387], [151, 382], [147, 374], [146, 368], [147, 362], [151, 354], [157, 349], [167, 347], [177, 349], [183, 354], [187, 362]],
  LEAF: [[218, 357], [217, 363], [214, 370], [209, 376], [207, 380], [205, 376], [200, 370], [197, 363], [196, 357], [197, 350], [200, 344], [205, 338], [207, 334], [209, 338], [214, 344], [217, 350]],
  CHECK: [[664, 366], [706, 366], [706, 400], [664, 400]],
  SMOKE: [
    [[639, 464], [637, 467], [637, 473.5], [633, 476], [633, 487.5], [630, 492], [630, 508.5], [627, 511], [628, 545.5], [624, 548], [624, 560.5], [619, 561], [618, 563], [618, 580.5], [621, 583], [622, 615.5], [626, 620], [628.5, 620], [635, 629], [666.5, 628], [670.5, 625], [671, 647.5], [688.5, 648], [690, 617], [672, 616.5], [672, 608], [674, 605.5], [674, 584], [669, 578.5], [669, 554], [668, 553.5], [667, 538], [665, 537.5], [664, 470], [657.5, 464]],
    [[636, 633], [632.5, 637], [629, 637], [629, 644.5], [623, 645], [623, 652.5], [618, 656], [618, 675.5], [622, 677], [622, 680.5], [627, 686], [648, 685.5], [646.5, 688], [618, 687], [617, 688], [617, 706.5], [618, 708.5], [622, 713], [632.5, 713], [633, 714.5], [618, 715], [616, 718], [616, 750.5], [631, 760], [648.5, 760], [653, 754.5], [653, 750], [658, 746.5], [658, 727], [653, 726], [651, 720], [647, 717], [665, 718], [665, 738.5], [670, 743], [688.5, 743], [691, 739], [703, 738.5], [703, 719], [697, 714.5], [694.5, 705], [684, 704.5], [685, 700], [688.5, 700], [691, 697], [700, 695.5], [700, 670], [694, 670], [692, 667.5], [692, 657], [688.5, 654], [671, 654], [669.5, 657], [666, 658], [666, 641], [664.5, 640], [658, 640], [653.5, 633]],
    [[667, 744], [665.5, 746], [657, 749], [653, 756], [653, 775.5], [655, 778], [655, 788.5], [657, 791], [657, 793.5], [662.5, 797], [668, 804], [686.5, 804], [688, 802.5], [688, 798], [692.5, 798], [694, 796], [698, 795.5], [698, 780], [699.5, 780], [701, 777.5], [701, 758], [694, 757.5], [694, 748], [692, 746.5], [691.5, 744]],
    [[636, 802], [634, 803], [632.5, 807], [627, 809], [627, 818.5], [622, 819], [622, 824.5], [619, 827], [619, 845.5], [623, 849], [626.5, 849], [632, 857], [654.5, 857], [658, 852], [666.5, 851], [670, 847.5], [669, 816], [666.5, 814], [662.5, 812], [659, 812], [657, 809.5], [656.5, 802]],
    [[632, 867], [631, 868], [631, 875.5], [628, 879], [628, 899.5], [632, 905], [649.5, 905], [653, 899], [658, 895.5], [658, 873], [653.5, 867]],
    [[675, 868], [675, 886.5], [677, 888], [677, 892.5], [679, 896], [697.5, 896], [700, 891], [705, 888.5], [705, 870], [703.5, 868]],
    [[659, 902], [658, 903], [658, 929.5], [675.5, 930], [676, 924], [682, 923.5], [681, 904], [678.5, 902]],
  ],
  CL: [[185, 240], [225, 232], [255, 220], [300, 215], [335, 228], [352, 262], [345, 300], [320, 330], [290, 345], [255, 350], [225, 345], [200, 330], [188, 300], [180, 265]],
  PL: [[266, 344], [280, 320], [330, 316], [408, 313], [420, 330], [424, 400], [424, 480], [420, 494], [330, 494], [288, 488], [262, 448], [256, 432], [262, 400]],
  RK: [[560, 330], [600, 300], [640, 282], [700, 290], [710, 340], [790, 400], [826, 430], [828, 470], [800, 500], [720, 505], [700, 470], [690, 430], [640, 440], [600, 445], [560, 400]],
  TW: [[575, 448], [700, 452], [708, 505], [790, 505], [848, 545], [850, 860], [760, 880], [705, 930], [660, 935], [600, 930], [580, 880], [576, 700]],
};
/** The four feeds' places on the cover (the controller's order of world.room.v.cut: plata, éxito, amor, sustancias), the hole the roads and wires drain into, and the pills. */
const SY_AT = { hole: [466, 690], plata: [345, 410], exito: [686, 383], amor: [238, 300], sustancias: [652, 640], circuit: [205, 700], gauge: [470, 885] };
const SY_PILLS = [[503, 224, 295], [506, 332, 392], [509, 444, 608], [520, 660, 806]]; // [x, y from, y to] along each tall pill
/** The roads the things flow along (cover pixels). */
const SY_ROADS = {
  arch: [[335, 300], [372, 287], [420, 287], [470, 300], [510, 330], [540, 375], [552, 405]],
  tower: [[600, 488], [560, 505], [520, 535], [480, 565], [445, 595]],
  top: [[470, 200], [470, 380], [468, 560], [466, 690]],
  bottom: [[472, 940], [470, 840], [468, 760], [466, 690]],
};

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
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = SY, Z0 = SY.Z0, POLY = SY_POLY;
  const { wide, f, yh } = syLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(SY_SET.x, 0, SY_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(22);
  const W2 = lite ? 1.9 : 2.5, W1 = lite ? 1.2 : 1.6, W0 = 1.2; // chalk line widths (CSS px)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; const L = kit.lines(rib, o); L.core.layers.set(1); return L; }; // (layer 1: not mirrored by the water: the cover has no reflection)

  // ---- the cover's pixels → the set (x to the viewer's right, y up, z toward the visitor; the drawing's plane at z = 0) ----
  const P = (px, py, Z = Z0) => [((px - V.cx) * Z) / f, V.H + ((yh - py) * Z) / f, Z0 - Z];
  /** How far each layer is from the eye (each layer is a flat sheet on the cover's rays). The gold block, the rocket and the towers stand forward of the paper; the smoke is in front of all. */
  const Zbase = Z0 + 0.3, ZCL = Z0 - 0.1, ZPL = Z0 - 0.6, ZRK = Z0 - 0.5, ZTW = Z0 - 0.9, ZSM = Z0 - 1.4, ZMV = Z0 - 0.15;

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const loops = saDecode().filter((lp) => lp.a >= (lite ? (lp.l < 5 ? 36 : 14) : 0));
  loops.forEach((lp) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of lp.pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } lp.bb = [a, b, c, d]; });
  const tonePts = loops.reduce((n, lp) => n + lp.pts.length, 0);
  const TS = lite ? 1.0 : 1.5; // texture pixels per cover pixel
  const GAIN = 1.0; // (the traced levels are already the cover's tones, lifted)
  const pathOf = (pts) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; };
  const GREY = { 5: 150, 6: 215, 7: 255, 8: 120, 9: 225 }; // (the grey each glitter group is painted with: its layer's tint makes it gold or silver)
  const tones = (c, r, groups, gain) => {
    for (const l of groups) {
      const path = new Path2D(); let any = false;
      for (const lp of loops) {
        if (lp.l !== l || lp.bb[2] < r[0] || lp.bb[0] > r[2] || lp.bb[3] < r[1] || lp.bb[1] > r[3]) continue;
        lp.pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]))); path.closePath(); any = true;
      }
      if (!any) continue;
      const g = Math.min(255, Math.round(l < 5 ? SA_FILL[l] * gain : GREY[l])); c.fillStyle = `rgb(${g},${g},${g})`; c.fill(path, 'evenodd');
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
  const region = (r, o = {}) => { const ts = TS * (o.ts || 1); return ctx.canvasTex(Math.max(4, Math.round((r[2] - r[0]) * ts)), Math.max(4, Math.round((r[3] - r[1]) * ts)), (c, w, hh) => {
    const wc = document.createElement('canvas'); wc.width = w; wc.height = hh; const k = wc.getContext('2d');
    k.save(); k.scale(w / (r[2] - r[0]), hh / (r[3] - r[1])); k.translate(-r[0], -r[1]);
    tones(k, r, o.groups || [0, 1, 2, 3, 4], o.gain || GAIN);
    k.restore();
    for (const [mode, polys, blur] of o.masks || []) { k.globalCompositeOperation = mode === 'in' ? 'destination-in' : 'destination-out'; k.drawImage(maskOf(w, hh, r, polys, blur, ts), 0, 0); }
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.drawImage(wc, 0, 0);
    if ('filter' in c && (o.glow ?? 0.15) > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = o.glow ?? 0.15; c.filter = `blur(${((2.6 * ts) / 1.7).toFixed(1)}px)`; c.drawImage(c.canvas, 0, 0); c.restore(); } // a soft glow around every bright band
  }); };
  const mat = (tex, tint = [0.96, 0.95, 0.98]) => { const u = { uTex: { value: tex }, uAlpha: { value: 1 }, uReveal: { value: 1 }, uTint: { value: V3(...tint) } }; return { u, m: ctx.glowMat(TEXT_FRAG, u) }; };
  /** A grid mesh over a cover rectangle whose every vertex sits on its pixel's ray at depth Z (relative to `origin`, a point of the set); returns its geometry data. */
  const gridMesh = (r, nx, ny, Z, tex, host = root, origin = [0, 0, 0], tint) => {
    const n = (nx + 1) * (ny + 1), base = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const px = r[0] + ((r[2] - r[0]) * i) / nx, py = r[1] + ((r[3] - r[1]) * j) / ny, k = j * (nx + 1) + i, p = P(px, py, Z);
      base.set([p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]], k * 3); uv[k * 2] = i / nx; uv[k * 2 + 1] = 1 - j / ny;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c2 = a + nx + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const geo = ctx.keep(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(base, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const M = mat(tex, tint), mesh = new THREE.Mesh(geo, M.m); mesh.frustumCulled = false; mesh.layers.set(1); host.add(mesh); // (layer 1: not mirrored by the water: the cover has no reflection)
    return { mesh, u: M.u, r };
  };
  const inPoly = (p, x, y) => { let c = false; for (let i = 0, k = p.length - 1; i < p.length; k = i++) if ((p[i][1] > y) !== (p[k][1] > y) && x < ((p[k][0] - p[i][0]) * (y - p[i][1])) / (p[k][1] - p[i][1]) + p[i][0]) c = !c; return c; };
  const boxOf = (p, pad = 0) => [Math.min(...p.map((q) => q[0])) - pad, Math.min(...p.map((q) => q[1])) - pad, Math.max(...p.map((q) => q[0])) + pad, Math.max(...p.map((q) => q[1])) + pad];
  const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];

  // ───────────────────────────── the layers (each its own texture on the cover's rays) ─────────────────────────────
  const BL = 5, BM = 1.2; // blur of a relief layer's soft edge, and of a mover's tight one (cover px)
  const FLW = [POLY.FLA, POLY.FLB, POLY.LEAF];
  // the paper's base: everything that does not stand forward or move
  const BASE_R = [128, 160, 884, 946];
  const base = gridMesh(BASE_R, 2, 2, Zbase, region(BASE_R, { ts: 0.95, masks: [['out', [POLY.CL], BL], ['out', [POLY.PL], BL], ['out', [POLY.RK], BL], ['out', [POLY.TW], BL], ['out', FLW, BM]] }));
  // the silver hatched blocks (their own tones: a cool grey with the white hatching on it)
  const SIL_R = [276, 512, 432, 780];
  const silver = gridMesh(SIL_R, 2, 2, Zbase - 0.02, region(SIL_R, { groups: [8, 9], ts: 1.3, glow: 0.2 }), root, [0, 0, 0], [0.86, 0.9, 1.08]);
  // the cloud with its stars row below: stands a little forward; the swirl is cut out of it
  const CL_R = boxOf(POLY.CL, 6);
  const cloud = gridMesh(CL_R, 2, 2, ZCL, region(CL_R, { masks: [['in', [POLY.CL], BL], ['out', [POLY.SPIRAL], BM], ['out', FLW, BM]] }));
  // the swirl (turns while AMOR is open): a patch hosted by a group at its own centre
  const SP_R = boxOf(POLY.SPIRAL, 4), SP_C = mid(SP_R), spC = P(SP_C[0], SP_C[1], ZMV), spHost = grp(root, spC[0], spC[1], spC[2]);
  const swirl = gridMesh(SP_R, 1, 1, ZMV, region(SP_R, { ts: 2.2, masks: [['in', [POLY.SPIRAL], BM]] }), spHost, spC);
  // the flowers (breathe): one patch each, hosted at its own centre
  const flowers = FLW.map((poly) => { const R = boxOf(poly, 4), C = mid(R), c3 = P(C[0], C[1], ZMV), h = grp(root, c3[0], c3[1], c3[2]); return { host: h, M: gridMesh(R, 1, 1, ZMV, region(R, { ts: 2.2, masks: [['in', [poly], BM]] }), h, c3) }; });
  // the gold block (PLATA): its tones stand forward; its gold windows are a layer of their own that goes dark when it is cut
  const PL_R = boxOf(POLY.PL, 6);
  const plata = gridMesh(PL_R, 2, 2, ZPL, region(PL_R, { masks: [['in', [POLY.PL], BL]] }));
  const GOLD = [1.28, 0.93, 0.38];
  const plataGold = gridMesh(PL_R, 2, 2, ZPL - 0.03, region(PL_R, { groups: [5, 6, 7], ts: 1.1, glow: 0.2, masks: [['in', [POLY.PL], BL]] }), root, [0, 0, 0], GOLD);
  // the rocket and the computer; the ✓ is a patch of its own
  const RK_R = boxOf(POLY.RK, 6);
  const rocket = gridMesh(RK_R, 2, 2, ZRK, region(RK_R, { masks: [['in', [POLY.RK], BL], ['out', [POLY.CHECK], BM]] }));
  const CK_R = boxOf(POLY.CHECK, 3);
  const check = gridMesh(CK_R, 1, 1, ZRK - 0.02, region(CK_R, { ts: 2.4, masks: [['in', [POLY.CHECK], BM]] }));
  // the towers (without the smoke), with their gold windows
  const TW_R = boxOf(POLY.TW, 6);
  const towers = gridMesh(TW_R, 2, 2, ZTW, region(TW_R, { masks: [['in', [POLY.TW], BL], ['out', [POLY.RK], BL], ['out', POLY.SMOKE, BM]] }));
  const towerGold = gridMesh(TW_R, 2, 2, ZTW - 0.03, region(TW_R, { groups: [5, 6, 7], ts: 1.1, glow: 0.2, masks: [['out', [POLY.PL], BL]] }), root, [0, 0, 0], GOLD);
  // the smoke: one texture, two ghosts that cross-fade while they drift up (rising smoke), so the column is always whole
  const SM_R = boxOf(POLY.SMOKE.flat(), 4), smokeTex = region(SM_R, { ts: 1.3, masks: [['in', POLY.SMOKE, BM]] });
  const smokeHost = [grp(root), grp(root)], smoke = smokeHost.map((h) => gridMesh(SM_R, 1, 1, ZSM, smokeTex, h, [0, 0, 0], [0.99, 0.99, 1.0]));
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── chalk: what is told (the ✗ in place of the ✓, the marked wire and its four feeds, the hole) ─────────────────────────────
  const poly3 = (R, pts, w, al, Z, closed = false) => R.poly(pts.map(([x, y]) => P(x, y, Z)), w, al, closed);
  const crossR = kit.ribbons(64); { const [cx, cy] = [685, 383]; poly3(crossR, [[cx - 14, cy - 14], [cx + 14, cy + 14]], W2, 1, ZRK - 0.05); poly3(crossR, [[cx + 14, cy - 14], [cx - 14, cy + 14]], W2, 1, ZRK - 0.05); }
  const crossL = lines(crossR, { glow: true }); root.add(crossL.obj);
  const WIRE = SA_WIRE, wp = WIRE.path, wireR = kit.ribbons(65);
  poly3(wireR, wp, W2, 1, ZMV - 0.05); wireR.poly(RG.arc(P(wp[0][0], wp[0][1], ZMV - 0.05), [1, 0, 0], [0, 1, 0], 6 * Z0 / f, 6 * Z0 / f, 14), W1, 1, true);
  const wireL = lines(wireR, { glow: true, tint: [1, 0.86, 0.6] }); root.add(wireL.obj);
  const wireLen = [0]; for (let i = 1; i < wp.length; i++) wireLen.push(wireLen[i - 1] + Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1]));
  const wireTotal = wireLen[wireLen.length - 1];
  const wireAt = (u) => { const dd = u * wireTotal; let i = 1; while (i < wireLen.length - 1 && wireLen[i] < dd) i++; const k = (dd - wireLen[i - 1]) / ((wireLen[i] - wireLen[i - 1]) || 1); return [lerp(wp[i - 1][0], wp[i][0], k), lerp(wp[i - 1][1], wp[i][1], k)]; };
  const FEEDS = ['plata', 'exito', 'amor', 'sustancias'], ORDER = ['sustancias', 'amor', 'plata', 'exito']; // (the controller's order of world.room.v.cut, and the wire's)
  const iconL = {}, nodeU = {}; // each feed's icon at its node: a capsule, a flower, a coin, a star
  ORDER.forEach((name, k) => {
    const [x, y] = wp[WIRE.feed[k]], R = kit.ribbons(70 + k), rr = 9, ZI = ZMV - 0.06;
    const circ = (cx, cy, r, n = 14) => poly3(R, Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]), W1, 1, ZI, true);
    circ(x, y, rr);
    if (name === 'plata') { circ(x, y, 5, 10); poly3(R, [[x, y - 3.4], [x, y + 3.4]], W0, 1, ZI); }
    else if (name === 'exito') { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r2 = i % 2 ? 2.8 : 6.2; pts.push([x + Math.cos(a) * r2, y + Math.sin(a) * r2]); } poly3(R, pts, W0, 1, ZI, true); }
    else if (name === 'amor') { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; poly3(R, Array.from({ length: 8 }, (_, j) => [x + Math.cos(a) * 3.4 + Math.cos((j / 8) * TAU) * 2.4, y + Math.sin(a) * 3.4 + Math.sin((j / 8) * TAU) * 2.4]), W0, 1, ZI, true); } }
    else { poly3(R, [[x - 2, y - 6], [x + 3, y - 3], [x + 2, y + 6], [x - 3, y + 3], [x - 2, y - 6]], W0, 1, ZI, true); }
    iconL[name] = lines(R, { glow: true, tint: [1, 0.86, 0.6] }); root.add(iconL[name].obj);
    nodeU[name] = wireLen[WIRE.feed[k]] / wireTotal;
  });
  const pulse = kit.points([[0, 0, 0, 0.1, 1, 0.3, 0], [0, 0, 0, 0.05, 1, 0.6, 0]], { shape: 3, tint: [1, 0.95, 0.8] }); root.add(pulse.obj);

  // ───────────────────────────── the hole: rings that drain, the gauge ─────────────────────────────
  const HOLE = SY_AT.hole, hc = P(HOLE[0], HOLE[1], ZMV - 0.05), holeG = grp(root, hc[0], hc[1], hc[2]), rings = [], mpp = Z0 / f;
  for (let i = 0; i < 4; i++) {
    const R = kit.ribbons(80 + i), r = (16 + i * 12) * mpp;
    R.poly(RG.arc([0, 0, 0], [1, 0, 0], [0, 1, 0], r, r, 40), i === 3 ? W2 : W1, 1, true);
    const L = lines(R, { glow: i === 3 }), g = grp(holeG); g.add(L.obj); rings.push({ g, L, base: i });
  }
  { const R = kit.ribbons(89); R.poly(RG.arc([0, 0, 0], [1, 0, 0], [0, 1, 0], 6 * mpp, 6 * mpp, 16), W1, 1, true); const L = lines(R); holeG.add(L.obj); rings.push({ g: holeG, L, base: -1, fixed: true }); }
  const gaugeSt = { needle: 0, solved: 0, key: '' };
  const gaugeTex = ctx.canvasTex(320, 128, (c, w, h) => drawSistemaGauge(c, w, h, gaugeSt));
  const gauge = kit.plane(gaugeTex, 0.7, 0.28); { const p = P(SY_AT.gauge[0], SY_AT.gauge[1], ZMV); gauge.mesh.position.set(...p); root.add(gauge.mesh); }
  const redrawGauge = () => { drawSistemaGauge(gaugeTex.image.getContext('2d'), gaugeTex.image.width, gaugeTex.image.height, gaugeSt); gaugeTex.needsUpdate = true; };
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(66, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 4); }), 0.34, 0.13, { alpha: 0.6 });
  { const p = P(944, 974, Zbase - 0.1); sig.mesh.position.set(p[0], p[1], p[2]); root.add(sig.mesh); }

  // ───────────────────────────── sprites: the lit windows' glitter, the silver's grains, the pills' glints, what flows along the roads ─────────────────────────────
  const glitterRows = (pts, size, Zf) => pts.map(([x, y, b]) => { const p = P(x, y, Zf); return [p[0], p[1], p[2], size * (0.7 + rnd() * 0.8), 0.45 + 0.55 * (b / 255), rnd(), 0]; });
  const goldAll = SA_GOLD_PTS.filter((_, i) => !lite || i % 2 === 0), silPts = SA_SIL_PTS.filter((_, i) => !lite || i % 2 === 0);
  const goldPl = goldAll.filter((p) => inPoly(POLY.PL, p[0], p[1])), goldTw = goldAll.filter((p) => !inPoly(POLY.PL, p[0], p[1]));
  const plataGlit = kit.points(glitterRows(goldPl, 0.04, ZPL - 0.06), { shape: 3, twinkle: 0.95, tint: [1.2, 0.9, 0.42] });
  const towerGlit = kit.points(glitterRows(goldTw, 0.04, ZTW - 0.06), { shape: 3, twinkle: 0.95, tint: [1.2, 0.9, 0.42] });
  const silGlit = kit.points(glitterRows(silPts, 0.036, Zbase - 0.06), { shape: 3, twinkle: 0.95, tint: [0.9, 0.97, 1.1] });
  root.add(plataGlit.obj, towerGlit.obj, silGlit.obj);
  /** Things that run along a polyline (cover pixels), at `speed` metres per second; computed on the CPU. */
  const flow = (path, n, size, tint, speed, Zf = ZMV) => {
    const pts = path.map((p) => P(p[0], p[1], Zf)), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const tot = cum[cum.length - 1], count = lite ? Math.ceil(n / 2) : n, rows = Array.from({ length: count }, (_, i) => [0, 0, 0, size, 0.9, i / count, 0]);
    const o = kit.points(rows, { shape: 0, tint }); root.add(o.obj);
    return {
      o, ph: rnd(),
      step(dt, rate, alpha) {
        this.ph = (this.ph + (dt * speed * rate) / tot) % 1;
        for (let i = 0; i < count; i++) {
          const u = (this.ph + i / count) % 1, dd = u * tot; let k = 1; while (k < cum.length - 1 && cum[k] < dd) k++;
          const g = (dd - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1);
          o.pos[i * 3] = lerp(pts[k - 1][0], pts[k][0], g); o.pos[i * 3 + 1] = lerp(pts[k - 1][1], pts[k][1], g); o.pos[i * 3 + 2] = lerp(pts[k - 1][2], pts[k][2], g);
          o.dat[i * 4 + 1] = Math.sin(u * Math.PI) * 0.8 * alpha;
        }
        o.geo.attributes.position.needsUpdate = true; o.geo.attributes.aData.needsUpdate = true;
      },
    };
  };
  const warm = [0.95, 0.92, 0.85];
  const flowArch = flow(SY_ROADS.arch, 10, 0.034, warm, 0.2), flowTower = flow(SY_ROADS.tower, 8, 0.034, warm, 0.2);
  const flowTop = flow(SY_ROADS.top, 10, 0.03, warm, 0.3), flowBot = flow(SY_ROADS.bottom, 10, 0.03, warm, 0.3);
  const pillFlows = SY_PILLS.map(([x, y0, y1], i) => flow([[x, y0], [x, y1]], 2, 0.05, [1, 0.97, 0.9], 0.05 + 0.01 * i)); // a glint slides down each tall pill (SUSTANCIAS)

  // ───────────────────────────── the page that flies to the book ─────────────────────────────
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ───────────────────────────── hotspots (world positions) and what the visitor bumps into ─────────────────────────────
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  const anchorSpec = { 'rm-hole': [SY_AT.hole, ZMV, 0.8, 0.9], 'rm-circuit': [SY_AT.circuit, Zbase, 0.62, 1.5], 'rm-plata': [SY_AT.plata, ZPL, 0.6, 0.6], 'rm-exito': [SY_AT.exito, ZRK, 0.5, 0.45], 'rm-amor': [SY_AT.amor, ZCL, 0.55, 0.5], 'rm-sustancias': [SY_AT.sustancias, ZSM, 0.42, 1.5] };
  for (const [id, [at, Z, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(at[0], at[1], Z)), w, h: hh };
  const solids = [(() => { const p = W3([0, 0, 0.5]); return { kind: 'box', x: p.x, z: p.z, hw: 2.5, hd: 1.9, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the drawing that is looked at ─────────────────────────────
  const LOOK = {
    hole: { at: [466, 790], Z: ZMV, w: 1.35, h: 1.5 },
    circuit: { at: [208, 700], Z: Zbase, w: 0.85, h: 1.8 },
    plata: { at: [342, 405], Z: ZPL, w: 0.95, h: 0.9 },
    exito: { at: [690, 385], Z: ZRK, w: 1.25, h: 1.05 },
    amor: { at: [238, 318], Z: ZCL, w: 1.1, h: 1.1 },
    sustancias: { at: [650, 650], Z: ZSM, w: 1.2, h: 2.2 },
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
    const t = P(L.at[0], L.at[1], L.Z), d = fit(L.w, L.h, fw, fh, fov, a);
    return aim([t[0], t[1] + 0.05, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  const st = { T: 0, spin: 0, pulse: 0, sm: 0, run: [1, 1, 1, 1], quiet: 0 };
  const tmpV = V3(), tmpF = V3(), tmpU = V3(), NNv = V3(0, 0, 1), flwPiv = flowers.map(() => 0);
  const DSM = 22 * (ZSM / f); // how far (m) the smoke drifts up before it fades into its next ghost
  function update(dt, t) {
    const v = world.room.v || {}, cut = v.cut || [0, 0, 0, 0], quiet = v.quiet || 0, m = world.reduced ? 0 : 1, breath = v.breath || 0, surge = v.surge || 0;
    st.T += dt * m; RU.uTime.value = st.T;
    for (let i = 0; i < 4; i++) st.run[i] = damp(st.run[i], 1 - cut[i], 3, dt);
    st.quiet = damp(st.quiet, quiet, 3, dt);
    const [rPlata, rExito, rAmor, rSust] = st.run, calm = 1 - st.quiet, gen = 1 - 0.85 * st.quiet, T = st.T;
    // the gold windows: the gold block's lights (PLATA) go out when it is cut; every gold window goes dark when the city is quiet
    const flick = 0.93 + 0.07 * Math.sin(T * 2.3);
    plataGold.u.uAlpha.value = rPlata * calm * flick; towerGold.u.uAlpha.value = calm * (0.95 + 0.05 * Math.sin(T * 1.9 + 1)); plataGlit.set(0.9 * rPlata * calm); towerGlit.set(0.9 * calm); silGlit.set(0.9);
    // the rocket's ✓ becomes a ✗
    check.u.uAlpha.value = 1 - cut[1]; crossL.set(cut[1]);
    // the cloud: the swirl turns while AMOR is open, the flowers breathe
    st.spin -= dt * 0.5 * rAmor * m * (surge ? 2.2 : 1); spHost.rotation.z = st.spin; swirl.u.uAlpha.value = 0.9 + 0.1 * rAmor;
    flowers.forEach((fl, i) => { const k = 1 + 0.035 * Math.sin(T * 1.3 + i * 1.7) * rAmor * m; fl.host.scale.setScalar(k); fl.M.u.uAlpha.value = 0.9 + 0.1 * rAmor; });
    // the smoke rises while SUSTANCIAS is open (two ghosts cross-fade as they drift up), and goes out when it is cut
    st.sm = (st.sm + dt * 0.28 * rSust * m * (1 + 1.5 * surge)) % 1;
    const sa = rSust * gen;
    smokeHost[0].position.y = st.sm * DSM; smoke[0].u.uAlpha.value = (1 - st.sm) * sa;
    smokeHost[1].position.y = -(1 - st.sm) * DSM; smoke[1].u.uAlpha.value = st.sm * sa;
    // the flows: each road has its own feed; the middle road and the pills are the city's own
    const rate = (1 + 2.2 * surge) * m;
    flowArch.step(dt, rate * rAmor, rAmor); flowTower.step(dt, rate * rExito, rExito);
    flowTop.step(dt, rate * (1 - st.quiet), 1 - st.quiet); flowBot.step(dt, rate * (1 - st.quiet), 1 - st.quiet);
    pillFlows.forEach((pf) => pf.step(dt, rate * rSust, rSust * (1 - 0.15 * st.quiet)));
    // the hole: the rings drain inward (the middle of them keeps still); a breath opens and closes them
    rings.forEach((r) => {
      if (r.fixed) return;
      const u = (T * 0.4 * (0.3 + 0.7 * calm) + r.base * 0.25) % 1, bs = 1 + 0.1 * Math.sin(t * 0.7 + r.base) * m * calm;
      r.g.scale.setScalar(Math.max(0.05, (bs + 0.25 * breath) * (1.0 - 0.12 * u * calm)));
      r.L.set(0.5 + 0.4 * (r.base === 3 ? 1 : Math.sin(u * Math.PI)));
    });
    // the gauge: it trembles when more is poured in, and never leaves its place
    const nd = Math.max(0, surge) * (0.12 + 0.1 * Math.sin(T * 40)), solved = v.solved || 0;
    if (Math.abs(nd - gaugeSt.needle) > 0.004 || (solved > 0.5) !== (gaugeSt.solved > 0.5)) { gaugeSt.needle = nd; gaugeSt.solved = solved; redrawGauge(); }
    gauge.set(0.9);
    // the maze's pulse: one slow lap along the wire; each feed's icon lights as it passes
    st.pulse = (st.pulse + dt * 0.075 * m) % 1.35;
    const u = Math.min(1, st.pulse), pp = wireAt(u), pw = P(pp[0], pp[1], ZMV - 0.08);
    pulse.pos[0] = pw[0]; pulse.pos[1] = pw[1]; pulse.pos[2] = pw[2]; pulse.pos[3] = pw[0]; pulse.pos[4] = pw[1]; pulse.pos[5] = pw[2];
    pulse.geo.attributes.position.needsUpdate = true; pulse.set(st.pulse < 1.05 ? 1 : 0);
    for (const name of FEEDS) iconL[name].set(0.3 + 0.6 * Math.max(0, 1 - Math.abs(u - nodeU[name]) / 0.1) * (st.pulse < 1.2 ? 1 : 0) + 0.1 * Math.sin(t * 3 + nodeU[name] * 9) * m);
    wireL.set(0.7 + 0.15 * calm); sig.set(0.55);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const mp = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(HOLE[0], HOLE[1], ZMV - 0.2))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mp.clone();
      sheet.mesh.position.lerpVectors(from, mp, k1).lerp(icon, k3);
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
    info: () => ({
      segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, wire: ORDER.join(','), gold: goldAll.length, silver: silPts.length, pills: SY_PILLS.length, wide, f,
      texture: [base, silver, cloud, plata, plataGold, rocket, towers, towerGold, smoke[0]].map(texSize).join(' + '),
    }),
  };
};
