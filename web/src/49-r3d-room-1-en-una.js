// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 1 · «EN UNA»  (the cover, walkable: a computer that dreams two sleepers, white chalk on black, gold and silver glitter)
//   The drawing: a tall machine under two big brains, an antenna with orbit rings and a burst of sparks on top, an asterisk of eight spokes on its screen, a side panel, a keyboard, a cup with
//   steam and jagged electric scribbles at its base. On the left the sleeper, a night cap on a brain, its cap covered in silver glitter, a small star at its side. On the right the one with the gold
//   glitter visor and a party hat, looking into a wide cone of dots and binary digits that spreads from the machine, with sparkle stars below it. "11:11" in a corner. The photo is a black paper
//   taped on an orange graffiti heart, so the tones were traced from a rectified copy (49-r3d-room-1-en-una-art.js): the white and grey tones as contours at five levels, the gold and the silver
//   glitter apart, painted into textures (the shared tone helpers, 49-r3d-room-0-tones.js).
//   The visitor arrives at the eye that sees the cover (1.6 m high) and every point stands where it projects onto the cover's own pixels from there. Layers share that eye and each one sits at the
//   depth that suits it; the cover's pixels are split among them with soft masks that add up to one, so from the arrival spot the sum is the cover, seen frontally, and walking in opens it up:
//     · the base layer is everything that stays still (the machine, the brains, the desk, the keyboard, the scribbles, the cone of dots and the stars),
//     · the screen's eight spokes are eight layers of their own, cut from the tones; a spoke the puzzle lit is drawn again, brighter and with a glow; the clock and the mono are planes on the glass,
//     · the sleeper (with its silver cap) and the one with the visor (with the gold visor) stand a little forward of the machine; the sleeper breathes,
//     · the cup (it turns over), its steam, the antenna (it sways) and the sparks (they flicker) are patches cut from the same tones,
//     · the code is not painted: its dots are real points in the cone. From the arrival spot they scatter among the cone's own dots; only from the visor's eyes do they line up in a ring.
//   world.room holds the targets (the controller, 59-room-1-en-una.js, sets them whole); every value is damped here.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, Z0 how far (m) the drawing's plane is from the eye, ARR where the visitor arrives (z), BOT the cover row that stands 0.15 m above the floor. */
const EU = { H: 1.6, cx: 500, Z0: 7.5, ARR: 2.7, BOT: 985 };
/** Where the visitor stands when a floor opens is the eye; the drawing is Z0 metres ahead of it. */
const EU_SET = { x: 0, z: EU.ARR + EU.Z0, look: [-1, 0, 0.04], code: [1, 0, 1, 1, 0, 0, 1, 0] }; // look: where the visor's eyes look (toward the machine); code: clockwise from the top spoke
const GLYPH_PATTERN = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'] };
/** The lens depends on the screen: a wide one fits the whole paper at 1300 cover px of focal length, a phone's narrow view at 1850. The set's z never changes. */
function euLens(a) { return coverLens(EU, a, { f: 1300, row: 500, sx: 0.42, sy: 0.48 }, { f: 1850, row: 620, sx: 0.5, sy: 0.46 }); }
/** The cover's regions (rectified cover pixels, the paper is 1000 square): the screen's glass, the sleeper, the one with the visor, the cup with its saucer and handle, the steam, the antenna's rings and ball, the five sparks. */
const EU_POLY = {
  SCR: [[321, 377], [419, 433], [417, 562], [315, 492]],
  SLP: [[96, 358], [130, 358], [160, 380], [205, 385], [245, 392], [270, 412], [272, 470], [266, 498], [250, 512], [236, 528], [222, 548], [200, 566], [180, 566], [170, 548], [150, 528], [120, 528], [98, 508], [94, 420]],
  VIS: [[712, 440], [722, 405], [760, 385], [790, 370], [830, 378], [858, 408], [868, 445], [880, 480], [880, 520], [866, 545], [850, 575], [848, 600], [780, 602], [720, 585], [705, 560], [720, 520], [708, 480]],
  CUP: [[258, 509.5], [300, 509.5], [322, 512], [324, 524], [320, 540], [312, 556], [300, 566], [280, 568], [262, 560], [256, 545], [256, 520]],
  STEAM: [[281, 446], [298, 446], [298, 509.5], [281, 509.5]],
  ANT: [[420, 165], [518, 165], [522, 176], [545, 176], [545, 222], [524, 255], [470, 263], [440, 259], [420, 236], [415, 195]],
  SPK: [[[462, 118], [560, 118], [560, 166], [462, 166]], [[528, 178], [562, 178], [562, 195], [528, 195]], [[521, 198], [541, 198], [541, 219], [521, 219]]],
};
/** The cover rectangle that holds the drawing, and the one that holds "11:11". */
const EU_ALL = [88, 105, 945, 838], EU_SIG = [872, 944, 996, 1000];
/** The asterisk on the screen: its centre and the tip of each of its eight spokes, from the top, clockwise (the order of the code). */
const EU_ASTER = { c: [362, 463], tips: [[367, 414], [408, 443], [412, 491], [407, 549], [357, 514], [323, 476], [319, 444], [325, 387]] };
/** Cover pixels the hotspots and the close looks aim at (and how much each look shows, metres). */
const EU_PX = { screen: [368, 468], visor: [790, 482], cup: [290, 537], eye: [762, 478], looks: { screen: { w: 0.62, h: 0.95 }, visor: { w: 1.1, h: 1.35 }, cup: { w: 0.34, h: 0.4 } } };
/** The three four-point stars under the cone, and the grains of glitter that get a bigger sparkle. */
const EU_STARS = [[545, 550], [583, 570], [597, 597]], EU_BIG_GOLD = [[729, 468], [798, 479], [818, 498]], EU_BIG_SIL = [[259, 453], [213, 483], [189, 471]];

/** The part of a convex polygon `subject` that is inside the convex polygon `clip` (Sutherland-Hodgman). */
function euClip(subject, clip) {
  const area = clip.reduce((s, p, i) => { const q = clip[(i + 1) % clip.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), sg = area > 0 ? 1 : -1;
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], inside = (p) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0, inp = out;
    out = [];
    inp.forEach((p, k) => {
      const q = inp[(k + inp.length - 1) % inp.length], pi = inside(p), qi = inside(q);
      if (pi !== qi) { const d1 = [p[0] - q[0], p[1] - q[1]], d2 = [b[0] - a[0], b[1] - a[1]], t = ((a[0] - q[0]) * d2[1] - (a[1] - q[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]); out.push([q[0] + d1[0] * t, q[1] + d1[1] * t]); }
      if (pi) out.push(p);
    });
  }
  return out;
}
/** The eight wedges of the asterisk (cover pixels, each clipped to the glass): wedge i holds spoke i and ends halfway to the next spoke on each side. */
function euWedges() {
  const c = EU_ASTER.c, ang = EU_ASTER.tips.map((t) => (Math.atan2(t[0] - c[0], c[1] - t[1]) * 180) / Math.PI), n = ang.length;
  const a = ang.map((v) => (v + 360) % 360), cut = a.map((v, i) => { const w = a[(i + 1) % n] + (i === n - 1 ? 360 : 0); return ((v + w) / 2) % 360; });
  const dir = (d) => [c[0] + 400 * Math.sin((d * Math.PI) / 180), c[1] - 400 * Math.cos((d * Math.PI) / 180)];
  return a.map((_, i) => {
    const from = cut[(i + n - 1) % n], span = (cut[i] - from + 360) % 360, pts = [c];
    for (let k = 0; k <= 4; k++) pts.push(dir(from + (span * k) / 4));
    return euClip(pts, EU_POLY.SCR);
  });
}

/** What the monitor shows when it is a clock (the asterisk and the mono are layers of their own). */
function drawEnUnaClock(ctx, w, h, clock) {
  ctx.globalCompositeOperation = 'source-over'; // (the chalk draws additively: clear with the plain mode)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const k = makeChalk(ctx, { op: 'lighter', bg: '#000' }, w, 31);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = FONT_DISPLAY(h * 0.3, '', 500);
  ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 26; ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const txt = `${clock[0]}${clock[1]}:${clock[2]}${clock[3]}`;
  ctx.fillText(txt, w / 2, h * 0.5);
  ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillText(txt, w / 2, h * 0.5);
  ctx.restore();
  k.rect(w * 0.1, h * 0.31, w * 0.8, h * 0.38, 0.012, 'g', 1, 0.5);
}

/** The mono, as the mirror keeps him (the same one of the old plate: round face, two ears, a muzzle). */
function drawEnUnaMono(ctx, w, h) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const k = makeChalk(ctx, { op: 'lighter', bg: '#000' }, w, 17), cx = w / 2, cy = h * 0.5, R = w * 0.3;
  k.arc(cx, cy - R * 0.08, R, 0, TAU, 0.03, 'g', 3);
  k.arc(cx - R * 1.04, cy - R * 0.05, R * 0.3, 0, TAU, 0.025, 'g', 2); k.arc(cx + R * 1.04, cy - R * 0.05, R * 0.3, 0, TAU, 0.025, 'g', 2);
  k.arc(cx - R * 1.04, cy - R * 0.05, R * 0.15, 0, TAU, 0.015, 'g', 1, 0.6); k.arc(cx + R * 1.04, cy - R * 0.05, R * 0.15, 0, TAU, 0.015, 'g', 1, 0.6);
  k.arc(cx, cy + R * 0.38, R * 0.52, 0, TAU, 0.026, 'g', 2);
  k.arc(cx - R * 0.34, cy - R * 0.28, R * 0.075, 0, TAU, 0.03, 'g', 2); k.arc(cx + R * 0.34, cy - R * 0.28, R * 0.075, 0, TAU, 0.03, 'g', 2);
  k.path([[cx - R * 0.58, cy - R * 0.5], [cx - R * 0.3, cy - R * 0.58], [cx - R * 0.08, cy - R * 0.48]], 0.022, 'g', 2);
  k.path([[cx + R * 0.58, cy - R * 0.5], [cx + R * 0.3, cy - R * 0.58], [cx + R * 0.08, cy - R * 0.48]], 0.022, 'g', 2);
  k.arc(cx - R * 0.12, cy + R * 0.3, R * 0.04, 0, TAU, 0.02, 'g', 1); k.arc(cx + R * 0.12, cy + R * 0.3, R * 0.04, 0, TAU, 0.02, 'g', 1);
  k.arc(cx, cy + R * 0.5, R * 0.2, 0.15, Math.PI - 0.15, 0.022, 'g', 2);
  k.line(cx - R * 0.55, cy + R * 0.75, cx - R * 0.25, cy + R * 1.0, 0.012, 'g', 1, 0.4); // a glare across the glass
  k.line(cx + R * 0.3, cy - R * 0.9, cx + R * 0.9, cy - R * 0.4, 0.012, 'g', 1, 0.4);
}

ROOM_SETS['en-una'] = function buildEnUna(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = EU, Z0 = EU.Z0, POLY = EU_POLY;
  const { wide, f, yh } = euLens(ctx.W / Math.max(1, ctx.H));
  const rnd = mulberry32(11);
  const root = new THREE.Group();
  root.position.set(EU_SET.x, 0, EU_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ---- how far each layer is from the eye (each layer is a flat sheet on the cover's rays): the two heads stand forward of the machine, the cup and the glass a little ----
  const ZB = Z0, ZS = Z0 - 0.12, ZF = Z0 - 0.35, ZC = Z0 - 0.3, ZST = Z0 - 0.25, ZA = Z0 + 0.05, ZSG = Z0 - 0.3;

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, tonePts, region, mat, gridMesh, glitterRows } = coverTones(ctx, { V, lens: { f, yh }, decode: euDecode, fill: EU_FILL, grey: { 5: 150, 6: 215, 7: 255, 8: 88, 9: 225 }, ts: [0.9, 1.5], root, rnd: mulberry32(44) }); // (the greys: what each glitter group is painted with, its layer's tint makes it gold or silver)
  const BM = 1.0; // blur of a cut-out's soft edge (cover px)
  const segTotal = tonePts; // (every contour edge is a chalk line of the drawing)
  const hostAt = (px, py, Z) => { const p = P(px, py, Z); return { host: grp(root, p[0], p[1], p[2]), p }; };
  /** Moves a sprite group's points into the frame of a host at p, so that they travel with it. */
  const onHost = (pts, h) => { for (let k = 0; k < pts.pos.length / 3; k++) { pts.pos[k * 3] -= h.p[0]; pts.pos[k * 3 + 1] -= h.p[1]; pts.pos[k * 3 + 2] -= h.p[2]; } pts.geo.attributes.position.needsUpdate = true; h.host.add(pts.obj); };
  const GOLD = [1.28, 0.93, 0.38], SILVER = [0.9, 0.95, 1.02];

  // the base: everything that stays still, with the moving parts cut out of it along their outlines
  const cuts = [POLY.SCR, POLY.SLP, POLY.VIS, POLY.CUP, POLY.STEAM, POLY.ANT, ...POLY.SPK];
  const base = gridMesh(EU_ALL, 2, 2, ZB, region(EU_ALL, { masks: [['out', cuts, BM]] }));
  // "11:11", in front of the floor line
  const SG = gridMesh(EU_SIG, 1, 1, ZSG, region(EU_SIG, { ts: 1.8, glow: 0.25 }));

  // the screen: eight spokes, each cut from the tones inside the glass; a lit one is drawn again, brighter and with a glow
  const wedges = euWedges(), spoke = [], lit = [];
  wedges.forEach((wg) => {
    const R = boxOf(wg, 3);
    spoke.push(gridMesh(R, 1, 1, ZS, region(R, { ts: 2, masks: [['in', [wg], BM]] })));
    lit.push(gridMesh(R, 1, 1, ZS - 0.02, region(R, { ts: 1.4, gain: 1.5, glow: 1.3, masks: [['in', [wg], BM]] }), root, [0, 0, 0], [1.1, 1.0, 0.82]));
  });
  // a quad of the glass (cover pixels TL, TR, BR, BL) on the cover's rays, showing a canvas
  const quad = (cn, Z, tex, tint) => {
    const nx = 4, ny = 4, n = (nx + 1) * (ny + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [], lp = (a, b, t) => a + (b - a) * t;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const u = i / nx, v = j / ny, k = j * (nx + 1) + i, x = lp(lp(cn[0][0], cn[1][0], u), lp(cn[3][0], cn[2][0], u), v), y = lp(lp(cn[0][1], cn[1][1], u), lp(cn[3][1], cn[2][1], u), v);
      pos.set(P(x, y, Z), k * 3); uv[k * 2] = u; uv[k * 2 + 1] = 1 - v;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c2 = a + nx + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const geo = ctx.keep(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const M = mat(tex, tint), mesh = new THREE.Mesh(geo, M.m); mesh.frustumCulled = false; mesh.layers.set(1); root.add(mesh);
    return { mesh, u: M.u };
  };
  const GLASS = [[323, 382], [414, 436], [413, 556], [323, 489]];
  const scrState = { clock: [0, 3, 4, 7], key: '' };
  const clockTex = ctx.canvasTex(360, 450, (c, w, h) => drawEnUnaClock(c, w, h, scrState.clock));
  const clockQ = quad(GLASS, ZS - 0.04, clockTex, [1.0, 0.97, 0.92]);
  const monoQ = quad(GLASS, ZS - 0.04, ctx.canvasTex(360, 450, (c, w, h) => drawEnUnaMono(c, w, h)), [0.95, 0.94, 0.97]);
  const redraw = () => { const c = clockTex.image.getContext('2d'); drawEnUnaClock(c, clockTex.image.width, clockTex.image.height, scrState.clock); clockTex.needsUpdate = true; };

  // the sleeper (left): breathes about its neck; its cap is covered in silver glitter
  const SLR = boxOf(POLY.SLP, 6), SL = hostAt(183, 566, ZF);
  const sleeper = gridMesh(SLR, 2, 2, ZF, region(SLR, { masks: [['in', [POLY.SLP], BM]] }), SL.host, SL.p);
  const silver = gridMesh(SLR, 2, 2, ZF - 0.02, region(SLR, { groups: [8, 9], ts: 1.4, glow: 0.2, masks: [['in', [POLY.SLP], BM]] }), SL.host, SL.p, SILVER);
  // the one with the visor (right): the gold glitter visor and the party hat
  const VSR = boxOf(POLY.VIS, 6), VS = hostAt(790, 600, ZF);
  const visorFig = gridMesh(VSR, 2, 2, ZF, region(VSR, { masks: [['in', [POLY.VIS], BM]] }), VS.host, VS.p);
  const gold = gridMesh(VSR, 2, 2, ZF - 0.02, region(VSR, { groups: [5, 6, 7], ts: 1.4, glow: 0.2, masks: [['in', [POLY.VIS], BM]] }), VS.host, VS.p, GOLD);
  // the cup turns over; the steam rises from it; the antenna sways about its stem; the sparks flicker
  const CPR = boxOf(POLY.CUP, 4), CP = hostAt(EU_PX.cup[0], EU_PX.cup[1], ZC);
  const cup = gridMesh(CPR, 2, 2, ZC, region(CPR, { ts: 2.2, masks: [['in', [POLY.CUP], BM]] }), CP.host, CP.p);
  const STR = boxOf(POLY.STEAM, 3), ST = hostAt(289, 509, ZST);
  const steam = gridMesh(STR, 1, 1, ZST, region(STR, { ts: 2.4, masks: [['in', [POLY.STEAM], BM]] }), ST.host, ST.p);
  const ANR = boxOf(POLY.ANT, 3), AN = hostAt(446, 262, ZA);
  const antenna = gridMesh(ANR, 2, 2, ZA, region(ANR, { ts: 1.6, masks: [['in', [POLY.ANT], BM], ['out', POLY.SPK, BM]] }), AN.host, AN.p);
  const SKR = boxOf(POLY.SPK.flat(), 3);
  const sparks = gridMesh(SKR, 1, 1, ZA, region(SKR, { ts: 2, masks: [['in', POLY.SPK, BM]] }));
  // "11:11" written in the cup's base: it shows above the cup once it is upside down
  const cupLabel = kit.plane(ctx.canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = FONT_DISPLAY(78, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.55)'; c.shadowBlur = 12; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, h / 2 + 4); }), 0.22, 0.11, { alpha: 0 });
  { const q = P(EU_PX.cup[0], 497, ZC - 0.05); cupLabel.mesh.position.set(q[0], q[1], q[2]); root.add(cupLabel.mesh); }

  // glitter: sparkle points on the brightest grains of the gold and of the silver, twinkling; they travel with their figure
  const goldPts = EU_GOLD_PTS.filter((_, i) => !lite || i % 2 === 0), silPts = EU_SIL_PTS.filter((_, i) => !lite || i % 2 === 0);
  const goldG = kit.points(glitterRows(goldPts, 0.045, ZF - 0.06), { shape: 3, twinkle: 0.95, tint: [1.2, 0.9, 0.42] }); onHost(goldG, VS);
  const silG = kit.points(glitterRows(silPts, 0.04, ZF - 0.05), { shape: 3, twinkle: 0.95, tint: [0.9, 0.97, 1.1] }); onHost(silG, SL);
  const bigSpark = (list, gd, h) => { const s = kit.points(list.map(([x, y], i) => { const p = P(x, y, ZF - 0.1); return [p[0], p[1], p[2], gd ? 0.2 : 0.13, 0.9, i * 0.27, 0]; }), { shape: 3, twinkle: 0.95, tint: gd ? [1, 0.85, 0.45] : [0.85, 0.92, 1] }); onHost(s, h); return s; };
  const goldGlit = bigSpark(EU_BIG_GOLD, true, VS), silGlit = bigSpark(EU_BIG_SIL, false, SL);
  const starPts = kit.points(EU_STARS.map(([x, y], i) => { const p = P(x, y, ZB - 0.1); return [p[0], p[1], p[2], 0.2, 0.7, i * 0.31, 0]; }), { shape: 3, twinkle: 0.9, tint: [0.92, 0.96, 1] }); root.add(starPts.obj);

  // ---- the cone: the visor's eyes look into it, and the code is in it (real points: the cone's dots are painted, these are not) ----
  const E = P(EU_PX.eye[0], EU_PX.eye[1], ZF - 0.1), Dn = (() => { const d = EU_SET.look, n = Math.hypot(...d); return d.map((v) => v / n); })();
  const cone = grp(root, 0, 0, 0);
  const NCODE = 8 * 12 + 3;
  const codeRows = Array.from({ length: NCODE }, (_, i) => [E[0] + Dn[0] * (0.8 + (i % 7) * 0.08), E[1] + (rnd() - 0.5) * 0.5, E[2] + (rnd() - 0.5) * 0.5, 0.03, 0.95, rnd(), 0]);
  const code = kit.points(codeRows, { shape: 0 }); cone.add(code.obj);
  const cd = { exp: [], ready: false };
  /** Puts every dot of the code on a ray of the given camera pose (so, from there, they sit on a clock face; from anywhere else, they are scattered). */
  function layoutCode(pose, a, free) {
    root.updateMatrixWorld(true);
    const fovT = Math.tan((pose.fov * Math.PI) / 360), tanV = fovT, tanH = fovT * a;
    const cx = free ? (free.x0 + free.x1) / 2 : 0.5, cy = free ? (free.y0 + free.y1) / 2 : 0.5;
    const cyaw = Math.cos(pose.yaw), syaw = Math.sin(pose.yaw), cp = Math.cos(pose.pitch), sp = Math.sin(pose.pitch);
    const F = V3(-syaw * cp, sp, -cyaw * cp), Rg = V3(cyaw, 0, -syaw), U = V3().crossVectors(Rg, F);
    const Ew = root.localToWorld(V3(...E));
    const W = free ? Math.min(1, (free.x1 - free.x0)) : 1, Hh = free ? Math.min(1, (free.y1 - free.y0)) : 1;
    const Rpx = Math.min(0.3 * Hh, 0.34 * W * a); // ring radius as a fraction of the screen height
    const Rr = Rpx * 2 * tanV, hD = Rr * 0.36, wD = hD * 0.6, cell = hD / 4, dot = cell * 0.78;
    const tx0 = (2 * cx - 1) * tanH, ty0 = (1 - 2 * cy) * tanV;
    cd.exp = [];
    let n = 0;
    const put = (ox, oy, sz, al, depthSeed) => {
      const tt = 0.62 + depthSeed * 0.72, tx = tx0 + ox, ty = ty0 + oy;
      const wp = Ew.clone().addScaledVector(F, tt).addScaledVector(Rg, tx * tt).addScaledVector(U, ty * tt);
      const lp = root.worldToLocal(wp);
      code.pos.set([lp.x, lp.y, lp.z], n * 3); code.dat.set([sz * tt, al, code.dat[n * 4 + 2], 0], n * 4);
      cd.exp.push([2 * cx - 1 + ox / tanH, 1 - 2 * cy + oy / tanV]); n++;
    };
    const dr = mulberry32(5);
    EU_SET.code.forEach((bit, i) => {
      const ang = (i * Math.PI) / 4, ox = Math.sin(ang) * Rr, oy = Math.cos(ang) * Rr, pat = GLYPH_PATTERN[bit];
      pat.forEach((row, r) => { for (let q = 0; q < 3; q++) if (row[q] === '1' && n < NCODE - 3) put(ox + (q - 1) * wD / 2, oy + (2 - r) * cell, dot, 1, dr()); });
    });
    { const ox = 0, oy = Rr + hD * 1.0; for (const [dx, dy] of [[-1, 1], [1, 1], [0, 0]]) if (n < NCODE) put(ox + dx * cell * 0.8, oy + dy * cell * 0.9, dot * 1.1, 1, dr()); } // the start mark: a small ▼ above the top digit
    for (; n < NCODE; ) { code.dat[n * 4 + 1] = 0; n++; }
    code.geo.attributes.position.needsUpdate = true; code.geo.attributes.aData.needsUpdate = true;
    cd.ready = true; cd.count = cd.exp.length;
  }
  layoutCode({ yaw: Math.PI, pitch: 0, fov: 44 }, 1.7, null); // a first layout, aligned to a default eye; the controller re-lays it for the real pose

  // ---- hotspots (world positions) and what the visitor bumps into ----
  root.updateMatrixWorld(true);
  const W3 = (p) => root.localToWorld(V3(p[0], p[1], p[2]));
  // (metres: they scale with the focal length on a phone; the screen's centre is 0.45 m from the cup's, the sleeper and the visor are 3.4 m apart)
  const anchorSpec = { 'rm-screen': [EU_PX.screen, ZS, 0.62, 0.9], 'rm-visor': [EU_PX.visor, ZF, 0.9, 0.95], 'rm-cup': [EU_PX.cup, ZC, 0.36, 0.34] };
  for (const [id, [at, Z, w, hh]] of Object.entries(anchorSpec)) ctx.anchors[id] = { pos: W3(P(at[0], at[1], Z)), w, h: hh };
  const lx = (px) => ((px - V.cx) * Z0) / f;
  const solids = [{ kind: 'box', cx: lx(405), cz: 0, hw: 1.4, hd: 0.6 }, { kind: 'circle', cx: lx(183), cz: Z0 - ZF, r: 0.5 }, { kind: 'circle', cx: lx(790), cz: Z0 - ZF, r: 0.5 }].map((s) => {
    const p = W3([s.cx, 0, s.cz]);
    return s.kind === 'box' ? { kind: 'box', x: p.x, z: p.z, hw: s.hw, hd: s.hd, ry: root.rotation.y } : { kind: 'circle', x: p.x, z: p.z, r: s.r };
  });

  // ---- the sheet that flies to the book when the floor is solved ----
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, h) => BookArt.drawSheet(c, w, h)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ---- camera poses: straight in front of the part of the drawing that is looked at (the visor's own eyes for "through") ----
  const aim = (camL, tgtL, sx, sy, fov, a) => coverAim(root, V3, camL, tgtL, sx, sy, fov, a);
  const fit = coverFit;
  function pose(view, a, free) {
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    if (view === 'through') {
      const fv = phone ? 62 : 48, p = aim(E, [E[0] + Dn[0], E[1] + Dn[1], E[2] + Dn[2]], sx, sy, fv, a);
      layoutCode(p, a, fr);
      return p;
    }
    const look = EU_PX.looks[view];
    if (!look) return null;
    const Z = view === 'screen' ? ZS : view === 'cup' ? ZC : ZF, t = P(EU_PX[view][0], EU_PX[view][1], Z), d = fit(look.w, look.h, fw, fh, fov, a);
    return aim([t[0], t[1] + 0.05, t[2] + d * 0.97], t, sx, sy, fov, a);
  }

  // ---- every frame ----
  // D holds what is shown: each value follows its target (world.room) at its own rate, so a state change is always a smooth one.
  const D = { code: 1, clock: 0, spoke: Array(8).fill(0) };
  const st = { T: 0, run: 1 };
  const tmpV = V3(), tmpF = V3(), tmpU = V3();
  function update(dt, t) {
    const w = world.room, m = world.reduced ? 0 : 1, rate = world.reduced ? 9 : 3;
    st.T += dt * m; RU.uTime.value = st.T;
    const T = st.T;
    st.run = damp(st.run, 1 - w.shut, 3, dt);
    const on = st.run, bg = 1 - 0.85 * w.through;
    // the screen: the asterisk (a lit spoke is drawn again, brighter), then the clock; dark, then the mono
    const key = w.clock.join(''); if (key !== scrState.key) { scrState.key = key; scrState.clock = w.clock.slice(); redraw(); }
    D.code = damp(D.code, w.mode === 'code' ? 1 : 0, rate * 2, dt); D.clock = damp(D.clock, w.mode === 'clock' ? 1 : 0, rate * 2, dt);
    const flick = 1 - 0.14 * m * on * Math.max(0, Math.sin(t * 23) * Math.sin(t * 3.1)) * 2, fl = 1 - 0.7 * w.flash;
    for (let i = 0; i < 8; i++) {
      D.spoke[i] = damp(D.spoke[i], w.spokes[i] ? 1 : 0, rate * 2.4, dt);
      spoke[i].u.uAlpha.value = D.code * fl * bg; lit[i].u.uAlpha.value = D.spoke[i] * D.code * (0.85 + 0.15 * flick) * bg;
    }
    clockQ.u.uAlpha.value = D.clock * 0.9 * flick * (1 - 0.8 * w.flash) * bg;
    monoQ.u.uAlpha.value = w.mono * (0.82 + 0.1 * m * Math.sin(t * 0.8));
    // the machine that runs: the antenna sways, the sparks flicker, the steam wavers, the sleeper breathes; it all stops when the machine does
    base.u.uAlpha.value = (1 - 0.4 * w.shut) * bg;
    antenna.u.uAlpha.value = (1 - 0.4 * w.shut) * bg; AN.host.rotation.z = (0.035 * Math.sin(T * 0.9) + 0.02 * Math.sin(T * 1.7 + 1)) * on * m;
    sparks.u.uAlpha.value = (m ? 0.3 + 0.7 * Math.max(0, Math.sin(T * 13) * Math.sin(T * 4.7) * 0.5 + 0.6) : 0.9) * on * bg;
    SG.u.uAlpha.value = 0.9 * bg;
    // the cup turns over; 11:11 shows on its base
    const ck = w.cup; CP.host.rotation.x = ck * Math.PI; CP.host.position.y = CP.p[1] + Math.sin(ck * Math.PI) * 0.07;
    cup.u.uAlpha.value = (1 - 0.4 * w.shut) * bg; cupLabel.set(smooth(0.6, 1, ck) * 0.9 * bg);
    ST.host.rotation.z = 0.06 * Math.sin(T * 0.8) * m; steam.u.uAlpha.value = (0.85 + 0.15 * Math.sin(T * 1.3) * m) * (1 - ck) * (1 - 0.5 * w.shut) * bg;
    // the two heads
    SL.host.scale.y = 1 + 0.014 * Math.sin(t * 1.15) * m;
    sleeper.u.uAlpha.value = 1 - 0.5 * w.through; silver.u.uAlpha.value = 1 - 0.5 * w.through; silG.set(1 - 0.7 * w.through); silGlit.set(0.9 - 0.7 * w.through);
    visorFig.u.uAlpha.value = 1 - 0.85 * w.through; gold.u.uAlpha.value = 1 - 0.8 * w.through; goldG.set(0.95 - 0.8 * w.through); goldGlit.set(0.9 - 0.8 * w.through);
    starPts.set(bg * 0.9);
    // the code's dots: dim among the cone's own from the arrival spot, bright where they line up
    code.set(0.6 + 0.4 * w.through);
    // the page flying to the book
    const pg = w.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const md = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(EU_PX.screen[0], EU_PX.screen[1], ZS - 0.1))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
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
    info: () => ({ segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, code: EU_SET.code.join(''), codeDots: cd.count, aligned: cd.ready, gold: goldPts.length, silver: silPts.length, wide, f, texture: [base, spoke[0], lit[0], sleeper, silver, visorFig, gold, cup, steam, antenna, sparks, SG].map(texSize).join(' + ') }),
    alignError() {
      const cam = ctx.camera; cam.updateMatrixWorld(true);
      let worst = 0;
      for (let i = 0; i < cd.exp.length; i++) {
        tmpV.set(code.pos[i * 3], code.pos[i * 3 + 1], code.pos[i * 3 + 2]); root.localToWorld(tmpV).project(cam);
        worst = Math.max(worst, Math.hypot(tmpV.x - cd.exp[i][0], tmpV.y - cd.exp[i][1]));
      }
      return worst;
    },
  };
};
