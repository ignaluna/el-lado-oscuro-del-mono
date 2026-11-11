// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 3 · «EL LADO OSCURO DEL MONO»  (the cover, as a screaming mouth: white chalk on black, gold and silver glitter on the teeth)
//   The drawing: a huge monkey mouth seen from the side, framed by jagged fur with hatching and two angry brows; the upper teeth carry grey glitter and a gold
//   fill, the lower ones small X's and gold fills; a stippled throat and tongue, a drip from the lower lip; a pale tube and a graffiti tag with loops cross out of
//   the mouth to the right; two asterisk stars; white ink splatter top left; scratches; "11:11" top right. The photo is a black paper taped on an orange graffiti
//   heart, so the tones were traced from a rectified copy (49-r3d-room-3-el-lado-oscuro-del-mono-art.js): the white and grey tones as contours at five levels,
//   the gold glitter and the silver glitter segmented apart (colour, and a zone for the silver) and drawn on their own layers, with sparkle points on their grains.
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels from there. Layers share
//   that eye and each one sits at the depth that suits it; the cover's pixels are split among them with soft masks that add up to one, so from the arrival spot
//   the sum is the cover, seen frontally, and walking in opens it up:
//     · the mouth (lips, teeth, throat) is a relief that stands out of the fur toward the visitor, and its teeth are patches of their own,
//     · the fur is a ring behind it that shivers,
//     · the tube and the tag are a layer well in front of the mouth that grows and shrinks, freezes and is swallowed,
//     · the splatter is a layer behind that shimmers with heat; the two stars are layers at their own depths; the drip is a patch that falls from the lip,
//     · the eight teeth that can break are patches cut from the same tones: the tooth, its ✗ (the cover's own where it has one) and a gold repair with its crack.
//   world.room.v holds the targets (the controller, 59-room-3-…, sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
//   Tooth shards float on the water to the sides: eight spots, as many as there are crossed-out teeth (3 + breaks).
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, Z0 how far (m) the mouth's plane is from the eye, ARR where the visitor arrives (z), BOT the cover row that stands 0.15 m above the floor. */
const GS = { H: 1.6, cx: 500, Z0: 5.5, ARR: 2.7, BOT: 985 };
/** Where the visitor stands when a floor opens is the eye; the drawing is Z0 metres ahead of it. */
const GS_SET = { x: 0, y: 1.6, z: GS.ARR + GS.Z0 };
/** The lens depends on the screen: a wide one fits the whole paper at 1300 cover px of focal length, a phone's narrow view at 1600. The set's z never changes. */
function gsLens(a) { return coverLens(GS, a, { f: 1300, row: 520, sx: 0.42, sy: 0.48 }, { f: 1600, row: 560, sx: 0.5, sy: 0.46 }); }
/** The cover's regions (rectified cover pixels, the paper is 1000 square): the lips, the fur's hull, the tag and tube, the splatter, the stars, the drip. */
const GS_POLY = {
  MOUTH: [[262, 372], [300, 338], [345, 318], [400, 300], [440, 305], [472, 335], [484, 390], [478, 450], [472, 520], [478, 560], [482, 620], [482, 690], [480, 760], [462, 805], [432, 835], [395, 858], [350, 866], [312, 850], [288, 812], [270, 765], [248, 705], [225, 648], [216, 600], [220, 545], [232, 490], [246, 430]],
  HULL: [[190, 320], [240, 268], [330, 262], [440, 282], [495, 325], [506, 420], [500, 600], [498, 700], [488, 830], [450, 885], [405, 935], [372, 985], [345, 940], [300, 908], [255, 832], [212, 740], [160, 650], [96, 566], [104, 500], [150, 410]],
  TAG: [[185, 478], [260, 470], [335, 455], [372, 440], [440, 430], [452, 345], [560, 318], [640, 300], [690, 305], [760, 370], [800, 380], [830, 410], [880, 610], [888, 650], [880, 675], [740, 678], [600, 676], [440, 672], [418, 655], [470, 645], [470, 540], [388, 540], [388, 600], [335, 588], [290, 562], [215, 560], [185, 520]],
  SPLAT: [[95, 190], [318, 190], [318, 262], [240, 266], [192, 318], [150, 345], [95, 332]],
  STAR1: [[480, 676], [650, 676], [650, 830], [480, 830]],
  STAR2: [[640, 745], [885, 745], [885, 905], [640, 905]],
  DRIP: [[402, 822], [424, 822], [424, 860], [402, 860]],
};
/** The teeth: [id, centre x, centre y, width, height, turn (rad), kind] in cover pixels. U = upper row, L and R = the lower columns, B = the bottom row (19, as many as the cover shows). */
const GRITO_TEETH = [
  ['U0', 268, 390, 26, 34, -0.5, 'silver'], ['U1', 303, 378, 22, 26, -0.2, 'silver'], ['U2', 327, 377, 22, 24, -0.1, 'white'], ['U3', 353, 372, 22, 24, -0.1, 'white'], ['U4', 377, 362, 22, 26, -0.15, 'white'], ['U5', 407, 362, 24, 32, -0.5, 'gold'],
  ['L0', 272, 583, 24, 26, 0.28, 'white'], ['L1', 284, 619, 24, 26, 0.28, 'white'], ['L2', 299, 658, 24, 28, 0.3, 'white'], ['L3', 308, 695, 24, 26, 0.3, 'white'],
  ['R0', 408, 566, 24, 26, -0.3, 'white'], ['R1', 425, 598, 22, 24, -0.3, 'gold'], ['R2', 443, 624, 22, 22, -0.3, 'white'], ['R3', 441, 676, 20, 20, 0, 'white'],
  ['B0', 353, 772, 28, 28, 0.1, 'white'], ['B1', 376, 778, 26, 26, 0.1, 'gold'], ['B2', 400, 770, 26, 28, 0, 'gold'], ['B3', 421, 756, 24, 28, -0.3, 'white'], ['B4', 441, 740, 24, 30, -0.45, 'white'],
];
/** The order in which teeth carry an ✗ (the first three from the start; every break adds the next one). The cover draws an ✗ on L0, L1, L2, R0 and R2 itself: those five are cut from its tones, the other three are chalk. */
const GRITO_BREAK = ['L0', 'L1', 'L2', 'R0', 'R2', 'L3', 'B0', 'B4'];
const GS_CROSS = 5; // how many of them (the first five) have an ✗ in the cover
/** Where the shards float, in the set's own frame [x, z] (the visitor arrives at z = 5.5, looking toward the drawing): all to the sides, none in the first view. */
const GRITO_SHARDS = [[-4.2, 2.0], [4.4, 2.4], [-6.6, -0.8], [6.8, -0.2], [-8.0, 3.8], [8.2, 4.4], [-7.6, -3.6], [7.8, -4.0]];

ROOM_SETS['el-lado-oscuro-del-mono'] = function buildGrito(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = GS, Z0 = GS.Z0;
  const { wide, f, yh } = gsLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(GS_SET.x, 0, GS_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const rnd = mulberry32(33);
  const W2 = lite ? 1.9 : 2.5, W1 = lite ? 1.2 : 1.6, W0 = 1.2; // chalk line widths (CSS px)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; const L = kit.lines(rib, o); L.core.layers.set(1); return L; }; // (layer 1: not mirrored by the water: the cover has no reflection)
  const mp = (Z) => Z / f; // metres per cover pixel at depth Z

  // ---- the cover's pixels → the set (x to the viewer's right, y up, z toward the visitor; the mouth's plane at z = 0) ----
  const bump = (px, py, cx, cy, rx, ry) => Math.exp(-(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2));
  /** How far each layer is from the eye. The mouth stands out of the fur toward the visitor; the tag floats well in front of it; the splatter and the paper are behind. */
  const Zm = (px, py) => Z0 - 0.8 * bump(px, py, 350, 620, 140, 300);
  const Zf = (px, py) => Z0 + 0.1 - 0.3 * bump(px, py, 350, 620, 220, 340);
  const ZT = Z0 - 1.5, ZS1 = Z0 - 0.3, ZS2 = Z0 + 0.5, ZSP = Z0 + 0.6, ZBG = Z0 + 1.2;

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, loops, tonePts, region, mat, gridMesh, glitterRows } = coverTones(ctx, { V, lens: { f, yh }, decode: gaDecode, fill: GA_FILL, grey: { 5: 150, 6: 215, 7: 255, 8: 88, 9: 225 }, ts: [1.05, 1.7], root, rnd }); // (the greys: what each glitter group is painted with, its layer's tint makes it gold or silver)

  const quad = (cx, cy, w, hgt, rot) => { const c = Math.cos(rot), s2 = Math.sin(rot); return [[-w / 2, -hgt / 2], [w / 2, -hgt / 2], [w / 2, hgt / 2], [-w / 2, hgt / 2]].map(([x, y]) => [cx + x * c - y * s2, cy + x * s2 + y * c]); };
  const circle = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]);
  const teethOf = (ids) => ids.map((id) => GRITO_TEETH.find((t) => t[0] === id));
  const BR = teethOf(GRITO_BREAK); // the teeth that can break, in order
  const toothMask = (t) => quad(t[1], t[2], t[3] + 8, t[4] + 8, t[5]);
  const crossMask = (t) => circle(t[1], t[2], 11);
  const around = (t) => [t[1] - 26, t[2] - 26, t[1] + 26, t[2] + 26];

  // ───────────────────────────── the layers (each its own texture on the cover's rays) ─────────────────────────────
  const G_POLY = GS_POLY, hasX = (k) => k < GS_CROSS;
  const NX = (a, b) => (lite ? a : b);
  // the paper: scratches and flecks that do not move (everything outside the fur, the tag, the stars and the splatter)
  const BG_R = [22, 22, 978, 978];
  const bg = gridMesh(BG_R, 10, 10, () => ZBG, region(BG_R, { ts: 0.4, masks: [['out', [G_POLY.HULL], 6], ['out', [G_POLY.TAG], 5], ['out', [G_POLY.STAR1], 6], ['out', [G_POLY.STAR2], 6], ['out', [G_POLY.SPLAT], 5]] }));
  // the fur: a ring around the mouth, behind it (it shivers)
  const FUR_R = [92, 255, 512, 988];
  const fur = gridMesh(FUR_R, NX(18, 26), NX(30, 44), Zf, region(FUR_R, { masks: [['in', [G_POLY.HULL], 6], ['out', [G_POLY.MOUTH], 5], ['out', [G_POLY.TAG], 5]] }));
  // the mouth: lips, gum, throat; the teeth that can break and the drip are cut out of it (they are patches of their own)
  const MOUTH_R = [205, 285, 505, 880];
  const mouthG = grp(root);
  const mouth = gridMesh(MOUTH_R, NX(16, 24), NX(26, 40), Zm, region(MOUTH_R, { masks: [['in', [G_POLY.MOUTH], 5], ['out', [G_POLY.TAG], 5], ['out', BR.map(toothMask).concat([G_POLY.DRIP]), 1.4]] }), mouthG);
  // the gold and the silver glitter of the mouth: their own layers (warm and cool), on the mouth's relief
  const goldR = [335, 320, 475, 815], silR = [250, 350, 325, 425];
  const gold = gridMesh(goldR, NX(10, 14), NX(22, 32), (x, y) => Zm(x, y) - 0.03, region(goldR, { groups: [5, 6, 7], ts: 1.5, glow: 0.2, masks: [['in', [G_POLY.MOUTH], 4], ['out', [G_POLY.TAG], 5]] }), mouthG, [0, 0, 0], [1.28, 0.93, 0.38]);
  const silver = gridMesh(silR, 8, 8, (x, y) => Zm(x, y) - 0.02, region(silR, { groups: [8, 9], ts: 1.6, glow: 0.2, masks: [['in', [G_POLY.MOUTH], 4]] }), mouthG, [0, 0, 0], [0.9, 0.95, 1.02]);
  // the tooth patches: the tooth as the cover has it (without its ✗), the cover's own ✗ where it has one, and a gold repair
  const toothP = BR.map((t) => {
    const r = around(t), masks = [['in', [toothMask(t)], 1.4]]; if (hasX(BR.indexOf(t))) masks.push(['out', [crossMask(t)], 1.2]);
    return gridMesh(r, 3, 3, Zm, region(r, { ts: 1.7, masks }), mouthG);
  });
  const crossP = BR.map((t, k) => (hasX(k) ? gridMesh(around(t), 3, 3, (x, y) => Zm(x, y) - 0.015, region(around(t), { ts: 1.7, masks: [['in', [crossMask(t)], 1.2]] }), mouthG) : null));
  const goldTooth = (t) => ctx.canvasTex(96, 96, (c, w, hh) => { // a gold tooth painted in grey (the layer's tint makes it gold): a rounded block, shaded, with grains
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    const q = quad(48, 48, (t[3] + 2) * 2.1, (t[4] + 2) * 2.1, 0), g = c.createLinearGradient(0, 22, 0, 74); g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#9c9c9c');
    c.save(); c.translate(48, 48); c.rotate(t[5]); c.translate(-48, -48); c.fillStyle = g; c.beginPath(); c.roundRect(q[0][0], q[0][1], q[1][0] - q[0][0], q[2][1] - q[1][1], 10); c.fill();
    const r2 = mulberry32(5 + Math.round(t[1])); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + r2() * 0.5})`; c.fillRect(q[0][0] + r2() * (q[1][0] - q[0][0]), q[0][1] + r2() * (q[2][1] - q[1][1]), 2 + r2() * 3, 2 + r2() * 3); }
    c.restore();
  });
  const fixP = BR.map((t) => { const r = around(t), G = gridMesh(r, 3, 3, (x, y) => Zm(x, y) - 0.04, goldTooth(t), mouthG, [0, 0, 0], [1.28, 0.93, 0.38]); G.u.uAlpha.value = 0; return G; });
  // the drip: the patch that falls from the lower lip
  const DRIP_R = [398, 818, 428, 862];
  const dripHost = grp(mouthG), dripP = gridMesh(DRIP_R, 3, 3, Zm, region(DRIP_R, { ts: 2, masks: [['in', [G_POLY.DRIP], 1]] }), dripHost);
  // the tube and the tag: well in front of the mouth, scaling about the tube's base (it grows and shrinks, freezes half out, is swallowed)
  const TAG_R = [180, 290, 895, 700], TAG_PIV = [300, 515], tagC = P(TAG_PIV[0], TAG_PIV[1], ZT);
  const tagHost = grp(root, tagC[0], tagC[1], tagC[2]);
  const tag = gridMesh(TAG_R, NX(16, 22), NX(10, 14), () => ZT, region(TAG_R, { masks: [['in', [G_POLY.TAG], 5]] }), tagHost, tagC);
  // the two stars, each at its own depth
  const S1_R = [470, 668, 660, 838], S2_R = [630, 738, 892, 912];
  const star1 = gridMesh(S1_R, 6, 6, () => ZS1, region(S1_R, { masks: [['in', [G_POLY.STAR1], 6]] }));
  const star2 = gridMesh(S2_R, 6, 6, () => ZS2, region(S2_R, { masks: [['in', [G_POLY.STAR2], 6]] }));
  // the splatter (top left): behind everything, it shimmers with heat
  const SP_R = [88, 184, 326, 352];
  const splat = gridMesh(SP_R, NX(12, 18), NX(8, 12), () => ZSP, region(SP_R, { masks: [['in', [G_POLY.SPLAT], 5]] }), root, [0, 0, 0], [0.97, 0.94, 0.9]);
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)

  // ───────────────────────────── chalk: what is told (the ✗ of the three teeth the cover has none on, the repairs, the shards) ─────────────────────────────
  const poly3 = (R, pts, w, al, closed = false) => R.poly(pts.map(([x, y]) => { const p = P(x, y, Zm(x, y) - 0.05); return p; }), w, al, closed);
  const crossL = [], repairL = [], repairRows = [], repairGlitRows = [];
  BR.forEach((t, k) => {
    const X = kit.ribbons(40 + k), G = kit.ribbons(60 + k), r2 = mulberry32(90 + k), [cx, cy] = [t[1], t[2]], e = (a, b, w) => poly3(X, [[cx + a[0] * t[3] * 0.3, cy + a[1] * t[4] * 0.3], [cx + b[0] * t[3] * 0.3, cy + b[1] * t[4] * 0.3]], w, 1);
    if (!hasX(k)) { e([-1, -1], [1, 1], W2); e([1, -1], [-1, 1], W2); }
    poly3(G, quad(cx, cy, t[3], t[4], t[5]), W2, 1, true);
    poly3(G, [[cx - t[3] * 0.2, cy - t[4] * 0.45], [cx + t[3] * 0.08, cy - t[4] * 0.18], [cx - t[3] * 0.1, cy + t[4] * 0.02], [cx + t[3] * 0.18, cy + t[4] * 0.24], [cx, cy + t[4] * 0.46]], W2, 1);
    const xl = hasX(k) ? null : lines(X, { glow: true }), gl = lines(G, { glow: true, tint: [1, 0.8, 0.34] });
    crossL.push(xl); repairL.push(gl); if (xl) mouthG.add(xl.obj); mouthG.add(gl.obj);
    const rows = []; for (let i = 0; i < (lite ? 6 : 12); i++) { const px = cx + (r2() - 0.5) * t[3] * 0.8, py = cy + (r2() - 0.5) * t[4] * 0.8, p = P(px, py, Zm(px, py) - 0.07); rows.push([p[0], p[1], p[2], 0.03 + r2() * 0.014, 0.95, r2(), 0]); }
    { const p = P(cx, cy, Zm(cx, cy) - 0.09); repairGlitRows.push([p[0], p[1], p[2], 0.2, 0.95, r2(), 0]); }
    repairRows.push(rows);
  });
  const repairPts = kit.points(repairRows.flat(), { shape: 0, twinkle: 0.9, tint: [1, 0.8, 0.3] }); mouthG.add(repairPts.obj);
  const repairGlit = kit.points(repairGlitRows, { shape: 3, twinkle: 0.95, tint: [1, 0.86, 0.5] }); mouthG.add(repairGlit.obj);
  const perRepair = repairRows[0].length;

  // glitter: sparkle points on the brightest grains of the gold and of the silver, twinkling
  const goldPts = GA_GOLD_PTS.filter((_, i) => !lite || i % 2 === 0), silPts = GA_SIL_PTS.filter((_, i) => !lite || i % 2 === 0);
  const goldG = kit.points(glitterRows(goldPts, 0.045, (x, y) => Zm(x, y) - 0.06), { shape: 3, twinkle: 0.95, tint: [1.2, 0.9, 0.42] });
  const silG = kit.points(glitterRows(silPts, 0.04, (x, y) => Zm(x, y) - 0.05), { shape: 3, twinkle: 0.95, tint: [0.9, 0.97, 1.1] });
  mouthG.add(goldG.obj); mouthG.add(silG.obj);
  const bigSpark = (list, tint) => kit.points(list.map(([x, y], i) => { const p = P(x, y, Zm(x, y) - 0.1); return [p[0], p[1], p[2], tint === 0 ? 0.2 : 0.13, 0.9, i * 0.27, 0]; }), { shape: 3, twinkle: 0.95, tint: tint === 0 ? [1, 0.85, 0.45] : [0.85, 0.92, 1] });
  const goldGlit = bigSpark([[407, 362], [425, 598], [376, 778], [400, 770]], 0), silGlit = bigSpark([[268, 390], [303, 378]], 1);
  mouthG.add(goldGlit.obj); mouthG.add(silGlit.obj);

  // heat over the splatter: warm specks that rise from it
  const heatRows = []; for (let i = 0; i < (lite ? 12 : 28); i++) { const px = 110 + rnd() * 190, py = 200 + rnd() * 130, p = P(px, py, ZSP - 0.05); heatRows.push([p[0], p[1], p[2], 0.05 + rnd() * 0.04, 0.9, i / (lite ? 12 : 28), 0]); }
  const heat = kit.points(heatRows, { shape: 0, mode: 1, rise: [0, 0.4, 0], speed: 0.12, spread: 0.1, tint: [1, 0.78, 0.55] }); root.add(heat.obj);

  // 11:11 and the word that comes when every tooth is mended
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(66, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 4); }), 0.5, 0.19, { alpha: 0.55 });
  { const p = P(870, 68, ZBG - 0.05); sig.mesh.position.set(p[0], p[1], p[2]); root.add(sig.mesh); }
  const wordPlane = kit.plane(ctx.canvasTex(512, 160, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(96, 'italic', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.7)'; c.shadowBlur = 16; c.fillStyle = '#fff'; c.fillText('perdón.', w / 2, hh / 2 + 4); }), 1.5, 0.47, { alpha: 0 });
  { const p = P(600, 945, Z0 - 0.4); wordPlane.mesh.position.set(p[0], p[1], p[2]); root.add(wordPlane.mesh); }

  // ───────────────────────────── the shards floating on the water (one per crossed-out tooth) ─────────────────────────────
  const shards = [], shardRows = [], ringRows = [];
  GRITO_SHARDS.forEach(([x, z], i) => {
    const R = kit.ribbons(110 + i), r2 = mulberry32(120 + i), sc = 2;
    const pts = [[-0.12, 0], [-0.16, 0.2], [-0.07, 0.34], [0.03, 0.27], [0.15, 0.36], [0.14, 0.11], [0.05, 0]].map(([a, b]) => [a * sc * (0.9 + r2() * 0.2), b * sc * (0.9 + r2() * 0.2), 0]);
    R.poly(pts, W2, 1, true); R.poly([[0, 0.05 * sc, 0], [0.01 * sc, 0.2 * sc, 0], [-0.05 * sc, 0.3 * sc, 0]], W0, 0.6); R.poly([[-0.1 * sc, 0.1 * sc, 0], [0.1 * sc, 0.16 * sc, 0]], W0, 0.5);
    const L = lines(R, { glow: true }), g = grp(root, x, 0.5, z);
    g.rotation.y = Math.atan2(-x, GS.Z0 - z) + (r2() - 0.5) * 0.5; g.add(L.obj);
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
  const anchorSpec = { 'rm-salpicadura': [[205, 262, ZSP], 1.2, 1.0], 'rm-pelo': [[205, 740, Zf(205, 740)], 0.6, 1.7], 'rm-firma': [[560, 470, ZT], 1.3, 1.2], 'rm-dientes': [[360, 650, Zm(360, 650)], 0.55, 1.6] };
  for (const [id, [at, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(at[0], at[1], at[2])), w, h: hh };
  GRITO_SHARDS.forEach(([x, z], i) => { ctx.anchors['rm-pieza-' + i] = { pos: W3([x, 0.5, z]), w: 0.95, h: 0.95 }; });
  const solids = [(() => { const p = W3([0, 0, 0.3]); return { kind: 'box', x: p.x, z: p.z, hw: 2.7, hd: 1.6, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the drawing that is looked at ─────────────────────────────
  const LOOK = {
    tinta: { t: () => P(200, 262, ZSP), w: 1.5, h: 1.2 },
    pelo: { t: () => P(225, 700, Zf(225, 700)), w: 1.2, h: 1.9 },
    firma: { t: () => P(540, 500, ZT), w: 3.2, h: 2.2 },
    dientes: { t: () => P(350, 615, Zm(350, 615)), w: 1.3, h: 2.2 },
  };
  const aim = (camL, tgtL, sx, sy, fov, a) => coverAim(root, V3, camL, tgtL, sx, sy, fov, a);
  const fit = coverFit;
  function pose(view, a, free) {
    const L = LOOK[view]; if (!L) return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const t = L.t(), d = fit(L.w, L.h, fw, fh, fov, a);
    return aim([t[0], t[1] + 0.1, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) with its own rate, so a state change is always a smooth one.
  const N = GRITO_BREAK.length, D = { sign: [0, 0, 0], tag: 1, free: 1, x: Array(N).fill(0), fix: Array(N).fill(0), shard: Array(N).fill(0), ready: 0, calm: 0, word: 0, shout: 0 };
  const st = { T: 0, init: false, drip: 0, fixShown: Array(N).fill(-1) };
  const tmpV = V3(), tmpF = V3(), tmpU = V3(), spinQ = new THREE.Quaternion(), NNv = V3(0, 0, 1);
  const follow = (arr, tgt, rate, dt) => { for (let i = 0; i < arr.length; i++) arr[i] = damp(arr[i], tgt[i] || 0, rate, dt); };
  const furPiv = P(350, 620, Zf(350, 620)), splatPiv = P(200, 260, ZSP);
  /** Each vertex of a mesh is moved by fn(px, py, x, y) → [x, y] (set metres). */
  const move = (M, fn) => { const arr = M.attr.array; for (let i = 0; i < M.n; i++) { const k = i * 3, d = fn(M.pxy[i * 2], M.pxy[i * 2 + 1], M.base[k], M.base[k + 1]); arr[k] = d[0]; arr[k + 1] = d[1]; arr[k + 2] = M.base[k + 2]; } M.attr.needsUpdate = true; };
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
    // the mouth trembles as a whole (its teeth, glitter and repairs with it)
    mouthG.position.set(Math.sin(T * 37) * 0.0035 * scream * sh, Math.sin(T * 29 + 1) * 0.003 * scream * sh, 0);
    mouth.u.uAlpha.value = 0.95 + 0.05 * D.shout + 0.02 * Math.sin(T * 11) * scream;
    // the fur shivers and stands on end when the tension is noticed
    {
      const k = 1 + (0.03 * D.sign[1] + 0.012 * D.shout) * (1 - D.calm * 0.9) * (m || 0.3), a = (0.004 + 0.011 * D.sign[1] + 0.008 * D.shout) * scream;
      move(fur, (px, py, x, y) => [furPiv[0] + (x - furPiv[0]) * k + a * Math.sin(T * 37 + py * 0.21 + px * 0.13), furPiv[1] + (y - furPiv[1]) * k + a * Math.sin(T * 29 + px * 0.17 + py * 0.05)]);
      fur.u.uAlpha.value = 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(T * 11)) * scream + 0.12 * D.sign[1];
    }
    // the splatter shimmers with heat (stronger once the heat is noticed): a haze that wobbles it, and warm specks
    {
      const hz = (0.4 + 0.6 * D.sign[0]) * (1 - D.calm) * m;
      move(splat, (px, py, x, y) => [x + 0.011 * hz * Math.sin(T * 2.6 + py * 0.07), y + 0.007 * hz * Math.sin(T * 2.1 + px * 0.06)]);
      splat.u.uAlpha.value = 0.75 + 0.25 * D.sign[0]; splat.u.uTint.value.set(0.97, 0.94 - 0.1 * D.sign[0], 0.9 - 0.2 * D.sign[0]);
      heat.set((0.4 + 0.5 * D.sign[0]) * (1 - D.calm));
    }
    // the tag: it grows and shrinks while the word pushes, freezes half out, and is swallowed
    const grow = (0.1 * Math.sin(T * 1.3) + 0.04 * Math.sin(T * 3.1)) * D.free * m, k = Math.max(0.001, D.tag * (1 + grow));
    tagHost.scale.setScalar(k); spinQ.setFromAxisAngle(NNv, -(1 - Math.min(1, D.tag)) * 0.9); tagHost.quaternion.copy(spinQ);
    tag.u.uAlpha.value = Math.min(1, D.tag * 3.5) * (0.94 + 0.06 * D.free); tagHost.visible = D.tag > 0.01;
    // the stars twinkle
    star1.u.uAlpha.value = 0.8 + 0.2 * Math.sin(T * 1.7) * m; star2.u.uAlpha.value = 0.8 + 0.2 * Math.sin(T * 1.3 + 2) * m;
    goldG.set(0.95); silG.set(0.9); goldGlit.set(0.9); silGlit.set(0.85);
    // the teeth: an ✗ where a tooth broke (the cover's own, or chalk), gold where it was mended
    for (let i = 0; i < N; i++) {
      const xa = D.x[i] * (1 - D.fix[i]) * (0.85 + 0.15 * D.shout);
      if (crossP[i]) crossP[i].u.uAlpha.value = xa; else crossL[i].set(xa);
      toothP[i].u.uAlpha.value = 1 - D.fix[i]; fixP[i].u.uAlpha.value = D.fix[i]; repairL[i].set(D.fix[i]);
    }
    let changed = false;
    for (let i = 0; i < N; i++) {
      const a = D.fix[i]; if (Math.abs(a - st.fixShown[i]) < 0.004) continue;
      st.fixShown[i] = a; changed = true;
      for (let j = 0; j < perRepair; j++) repairPts.dat[(i * perRepair + j) * 4 + 1] = a * 0.95;
      repairGlit.dat[i * 4 + 1] = a * 0.95;
    }
    if (changed) { repairPts.geo.attributes.aData.needsUpdate = true; repairGlit.geo.attributes.aData.needsUpdate = true; }
    // the drip hangs from the lower lip, falls and fades while the mouth screams (it hangs still when it is calm)
    {
      if (D.calm > 0.5) st.drip = 0; else st.drip = (st.drip + dt * 0.3 * m) % 1;
      const ph = st.drip, off = Math.max(0, ph - 0.25) / 0.75;
      dripHost.position.set(0, -Math.pow(off, 1.6) * 0.45, 0);
      dripP.u.uAlpha.value = (ph < 0.25 ? 1 : Math.max(0, 1 - off * 1.15)) * Math.min(1, ph * 14 + 0.2);
    }
    // the shards bob on the water; they shine when it is time to take them
    for (let i = 0; i < N; i++) {
      const s = shards[i], a = D.shard[i];
      s.g.visible = a > 0.01; s.g.position.y = 0.5 + 0.05 * Math.sin(T * 1.4 + s.ph) * m; s.g.rotation.z = 0.08 * Math.sin(T * 0.9 + s.ph) * m;
      s.L.set(a * (0.55 + 0.45 * D.ready));
      shardGlit.dat[i * 4 + 1] = a * (0.25 + 0.75 * D.ready); shardGlit.pos[i * 3 + 1] = 0.75 + 0.05 * Math.sin(T * 1.4 + s.ph) * m;
      rings.dat[i * 4 + 1] = a * 0.55 * (0.5 + 0.5 * Math.sin(T * 1.1 + s.ph)); rings.dat[i * 4] = 0.7 + 0.3 * ((T * 0.25 + i * 0.13) % 1);
    }
    shardGlit.geo.attributes.aData.needsUpdate = true; shardGlit.geo.attributes.position.needsUpdate = true; rings.geo.attributes.aData.needsUpdate = true;
    sig.set(0.55); wordPlane.set(D.word * 0.95);
    // the page flying to the book
    const pg = world.room.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const mid = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(350, 640, Zm(350, 640) - 0.2))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mid.clone();
      sheet.mesh.position.lerpVectors(from, mid, k1).lerp(icon, k3);
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
      segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, teeth: GRITO_TEETH.length, breakable: N, shards: GRITO_SHARDS.length, gold: goldPts.length, silver: silPts.length, wide, f,
      texture: [bg, fur, mouth, tag, star1, star2, splat].map(texSize).join(' + '),
    }),
  };
};
