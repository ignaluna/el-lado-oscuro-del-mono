// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 8 · «NO ME PERDONES»  (the cover, as a void with water: white chalk on black)
//   The drawing is almost all black: concentric ripples on dark water, a small shape sinking in the middle, two splashes beside it, a zigzag reflection that
//   runs toward the viewer with one drop below, a tiny star above and "11:11". The photo is a black paper taped on an orange graffiti heart, so the tones were
//   traced from a rectified copy (49-r3d-room-8-no-me-perdones-art.js): the white and grey tones as contours at five levels, painted into textures (the
//   shared tone helpers, 49-r3d-room-0-tones.js).
//   The cover is drawn in perspective (the ripples are seen from a few degrees above the water), so the set is laid out as what it shows: the water is the
//   floor, the visitor arrives at the eye that sees it (1.6 m high, 11.5 m from the centre) and every point stands where it projects onto the cover's own
//   pixels from there. Layers share that eye and each one sits where it belongs; the cover's pixels are split among them with soft masks that add up to one,
//   so from the arrival spot the sum is the cover, and walking in opens it up:
//     · the ripples, the reflection's surroundings and the drop lie on the water (a mesh whose every vertex is on its pixel's ray, at the depth where that ray
//       meets the water); the rings breathe outward one after the other, a wave breaks them wider and PERDONAME makes them grow (the vertices move),
//     · the zigzag reflection is cut from them along its own outline and lies on the water as well: it shimmers and, once the water is calm, straightens,
//     · the two splashes are cut out and stand at the far edge of the first ring (they sway and drop in the calm); the sinking shape is cut out and stands in
//       the middle (it bobs); the star is cut out and stands in the dark at the centre's depth, 0.6 m above the water (it moves away as fast as you come),
//     · "11:11" lies on the water where the paper's corner is.
//   In the void, over the cover: three paper castles that only show when you are near (unfolded, each one lies down as a stretch of road along the
//   reflection, toward the centre) and the glass at the centre that trembles with the waves, in chalk lines. world.room.v holds the targets (the controller,
//   59-room-8-…, sets them whole); every value is damped here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The eye that sees the cover: H its height (m), cx the column straight ahead, c the cover pixel of the centre of the ripples (on the water, Z0 metres ahead), Z0 how far that is, FY the height of the water drawn on. */
const NV = { H: 1.6, cx: 500, c: [500, 568], Z0: 11.5, FY: 0.03 };
/** How far (m) the centre of the ripples is from the arrival spot (the world's camera stands at z = 2.7 when a floor opens). */
const NP_ZC = NV.Z0;
/** Where the visitor stands when a floor opens (the world's camera): the star is NP_ZC metres ahead of it, above the centre. */
const NP_ARRIVE = 2.7;
const NP_SET = { x: 0, z: NP_ARRIVE + NP_ZC };
/** The lens depends on the screen: a wide one fits the whole paper at 1300 cover px of focal length, a phone's narrow view at 1850. yh is the cover row of the horizon: the one where the water Z0 away is at the centre's row. */
function npLens(a) {
  const wide = a >= 1.1, L = wide ? { f: 1300, row: 500, sx: 0.42, sy: 0.48 } : { f: 1850, row: 720, sx: 0.5, sy: 0.46 };
  return { wide, ...L, yh: NV.c[1] - ((NV.H - NV.FY) * L.f) / NV.Z0 };
}
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

/** The cover's regions (rectified cover pixels, the paper is 1000 square): what is cut out of the water along its own outline. */
const NP_POLY = {
  SPL: [ // the two splashes
    [[364, 506], [448, 506], [450, 518], [437, 518], [432, 527], [440, 536], [447, 543], [448, 549], [430, 550], [414, 553], [400, 555], [388, 548], [378, 540], [368, 534], [362, 524], [362, 513]],
    [[512, 512], [545, 510], [568, 513], [582, 521], [592, 533], [590, 544], [580, 550], [568, 552], [556, 552], [548, 545], [544, 538], [538, 538], [532, 534], [522, 527], [512, 522]],
  ],
  SHAPE: [[455, 546], [470, 550], [488, 555], [512, 556], [520, 548], [531, 545], [541, 552], [543, 565], [548, 575], [543, 584], [520, 589], [500, 591], [470, 589], [450, 586], [436, 581], [425, 573], [417, 565], [422, 557], [440, 552]], // the sinking shape
  REFL: [[458, 646], [468, 640], [486, 633], [500, 628], [507, 622], [525, 622], [533, 628], [532, 636], [518, 638], [511, 645], [509, 652], [505, 656], [504, 668], [505, 680], [502, 692], [498, 704], [486, 712], [470, 713], [461, 709], [463, 700], [466, 690], [462, 676], [456, 664], [456, 652]], // the zigzag reflection
};
/** The star (a box around it), the box that holds the water's drawing, the splashes' base row, the reflection's axis column and "11:11". */
const NP_STAR_BOX = [464, 494, 504, 526], NP_WATER = [92, 536, 938, 748], NP_SPL_BASE = 551, NP_REFL_AX = 483, NP_SIG = [888, 950, 990, 992];

ROOM_SETS['no-me-perdones'] = function buildVoid(ctx, kit, track) {
  const { THREE, V3 } = ctx, RU = kit.RU, lite = ctx.lite, V = NV;
  const { f, yh } = npLens(ctx.W / Math.max(1, ctx.H));
  const root = new THREE.Group();
  root.position.set(NP_SET.x, 0, NP_SET.z);
  root.rotation.y = Math.PI; // the front (+z local) faces the arrival spot
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const WC = lite ? [1.2, 1.9, 2.7] : [2.0, 3.0, 4.2]; // line widths (CSS px) by thickness class (the castles' and the glass's chalk)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };
  const rnd = mulberry32(88);

  // ---- where each layer is: the water is the floor (the depth at which a ray meets it), the standing things are sheets at their own depth ----
  const KW = (V.H - V.FY) * f, ZW = (px, py) => KW / Math.max(30, py - yh); // (the depth of the water at a cover row)
  const ZSP = ZW(0, NP_SPL_BASE); // the splashes stand at the far edge of the first ring
  const foot = (row, Zs) => (px, py) => (py > row ? ZW(px, py) : Zs); // (a standing sheet whose lower part, below its foot, lies on the water: nothing of it is under the water)

  // ───────────────────────────── the tones: the photo's own contours, painted into textures ─────────────────────────────
  const { P, tonePts, region, gridMesh } = coverTones(ctx, { V, lens: { f, yh }, decode: naDecode, fill: NA_FILL, ts: [1.0, 1.7], root, rnd });
  const BM = 1.2; // blur of a cut-out's soft edge (cover px)
  segTotal += tonePts; // (every contour edge is a chalk line of the drawing)
  const cut = [...NP_POLY.SPL, NP_POLY.SHAPE, NP_POLY.REFL]; // (what the water gives up to the layers that move on their own)

  // the water: ripples, the drop and the faint hairlines, lying on the water; its vertices breathe
  const cell = lite ? 2 : 1, NX = Math.round((NP_WATER[2] - NP_WATER[0]) / 8 / cell), NY = Math.round((NP_WATER[3] - NP_WATER[1]) / 6.2 / cell);
  const water = gridMesh(NP_WATER, NX, NY, ZW, region(NP_WATER, { ts: 1.0, glow: 0.12, masks: [['out', cut, BM]] }), root, [0, 0, 0], [0.94, 0.98, 1.0]);
  // the zigzag reflection: cut from the water along its own outline
  const RF_R = boxOf(NP_POLY.REFL, 6), refl = gridMesh(RF_R, lite ? 5 : 10, lite ? 7 : 14, ZW, region(RF_R, { ts: 1.15, masks: [['in', [NP_POLY.REFL], BM]] }), root, [0, 0, 0], [0.94, 0.98, 1.0]);
  // the splashes: one sheet that stands at the far edge of the first ring, swaying about its foot
  const SP_R = boxOf([].concat(...NP_POLY.SPL), 5), spFoot = P((SP_R[0] + SP_R[2]) / 2, NP_SPL_BASE, ZSP), spHost = grp(root, spFoot[0], spFoot[1], spFoot[2]);
  const spl = gridMesh(SP_R, 1, 2, foot(NP_SPL_BASE, ZSP), region(SP_R, { ts: 1.3, masks: [['in', NP_POLY.SPL, BM]] }), spHost, spFoot, [0.94, 0.98, 1.0]);
  // the sinking shape: a sheet in the middle that bobs
  const SH_R = [411, 540, 553, 596], shC = P(...mid(SH_R), V.Z0), shHost = grp(root, shC[0], shC[1], shC[2]);
  const shape = gridMesh(SH_R, 1, 4, foot(V.c[1], V.Z0), region(SH_R, { ts: 1.5, masks: [['in', [NP_POLY.SHAPE], BM]] }), shHost, shC, [0.9, 0.96, 1.0]);
  // the star: a sheet that stands in the dark, at the centre's depth
  const stC = P(...mid(NP_STAR_BOX), V.Z0), starHost = grp(root, stC[0], stC[1], 0);
  const star = gridMesh(NP_STAR_BOX, 1, 1, V.Z0, region(NP_STAR_BOX, { ts: 2.2, glow: 0.3 }), starHost, stC, [0.96, 0.98, 1.0]);
  const starRest = [stC[0], stC[1]], starGlow = kit.points([[0, 0, 0.02, 0.2, 0.55, 0.3, 0]], { shape: 3, twinkle: 0.9, tint: [0.95, 0.96, 1] }); starHost.add(starGlow.obj);
  // "11:11", lying on the water where the paper's corner is
  const sig = gridMesh(NP_SIG, 2, 2, ZW, region(NP_SIG, { ts: 1.8, glow: 0.25 }));

  // how far out each vertex of the water is from the centre of the ripples (0 at the centre, 1 at the outer ring), and whether it belongs to the rings (the drop below them is left alone)
  const RM = (410 * V.Z0) / f, vr = new Float32Array(water.n), vw = new Float32Array(water.n);
  for (let i = 0; i < water.n; i++) { const r = Math.hypot(water.base[i * 3], water.base[i * 3 + 2]) / RM; vr[i] = Math.min(1.1, r); vw[i] = 1 - smooth(1.12, 1.4, r); }
  // the reflection's vertices: where the straightened reflection sits (the x of the axis column's own ray at the vertex's depth)
  const rx = new Float32Array(refl.n);
  for (let i = 0; i < refl.n; i++) rx[i] = ((NP_REFL_AX - V.cx) * (V.Z0 - refl.base[i * 3 + 2])) / f;

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
  const starAnchor = { pos: W3([starRest[0], starRest[1], 0]), w: 0.9, h: 0.9 }; ctx.anchors['rm-estrella'] = starAnchor;
  const castleAt = castle.map((c) => W3([c.x, NP_FLOAT + 0.45, c.z]));
  const gw = npWorld(0, (NP_GLASS.z + 0.45) / 2 + 0.2);
  const solids = [{ kind: 'circle', x: gw.x, z: gw.z, r: 0.7 }];
  const wc = npWorld(0, 0);

  // ───────────────────────────── camera poses: in front of the glass ─────────────────────────────
  function pose(view, a, free) {
    if (view !== 'vaso') return null;
    const fr = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (fr.x0 + fr.x1) / 2, sy = (fr.y0 + fr.y1) / 2, fw = (fr.x1 - fr.x0) * 0.9, fh = (fr.y1 - fr.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const d = coverFit(1.5, 1.25, fw, fh, fov, a), tgt = [NP_GLASS.x, 0.34, NP_GLASS.z];
    return coverAim(root, V3, [tgt[0], tgt[1] + 0.5, tgt[2] + d * 0.97], tgt, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const D = { open: [0, 0, 0], glass: 0, down: 0, wave: 0, grow: 0, calm: 0, far: 0, rec: 0 };
  const st = { T: 0, init: false, slot: [-1, -1, -1], ripT: 1.5, near: [0, 0, 0] };
  const tmpL = V3(), tmpF = V3(), tmpU = V3(), tmpV = V3();
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
    { const pa = water.attr.array, b = water.base, c1 = 1 - calm, k1 = 0.013 * c1, k2 = 0.05 * wk, g0 = D.grow * 0.07, g1 = 0.06 * D.grow * m, g2 = 0.1 * D.grow;
      for (let i = 0; i < water.n; i++) {
        const r = vr[i], s = 1 + vw[i] * (k1 * Math.sin(T * 1.25 - r * 5.5) + k2 * (0.6 + r * 0.6) + g0 + g1 * Math.sin(T * 3.4 - r * 4) + g2 * r);
        pa[i * 3] = b[i * 3] * s; pa[i * 3 + 2] = b[i * 3 + 2] * s; // (the water's own height stays)
      }
      water.attr.needsUpdate = true; }
    water.u.uAlpha.value = (0.96 + 0.04 * Math.sin(T * 1.7) * m * (1 - calm * 0.7) + 0.06 * D.grow) * (1 - 0.1 * calm);
    // the reflection shimmers and, once the water is calm, straightens toward its own axis
    { const pa = refl.attr.array, b = refl.base, k = 1 - 0.93 * calm;
      for (let i = 0; i < refl.n; i++) pa[i * 3] = rx[i] + (b[i * 3] - rx[i]) * k;
      refl.attr.needsUpdate = true; }
    refl.u.uAlpha.value = 0.94 + 0.06 * Math.sin(T * 2.1) * m * (1 - calm) + 0.06 * calm;
    // the splashes sway and drop in the calm
    spHost.scale.y = (1 - 0.62 * calm) * (1 + 0.06 * Math.sin(T * 1.1) * m + 0.12 * wk + 0.25 * D.grow); spl.u.uAlpha.value = 0.98 - 0.2 * calm;
    // the sinking shape: it bobs, a little more with the wave
    shHost.position.y = shC[1] + (0.012 * Math.sin(T * 0.8) - 0.02 * wk) * m; shHost.rotation.z = (0.018 * Math.sin(T * 0.7) + 0.02 * wk) * m;
    shape.u.uAlpha.value = 0.97 + 0.03 * Math.sin(T * 1.3) * m;
    // the star keeps its distance: it moves away as fast as the visitor comes, and fades to a faint far light once approached enough
    const cam = ctx.camera, rec = D.rec + 8 * D.far, ahead = Math.max(cam.position.z, NP_ARRIVE); // the star is always the same way ahead of the visitor, and each step toward it moves it a metre further
    starHost.position.set(starRest[0], starRest[1] + 0.5 * D.far, NP_ARRIVE - ahead - rec); // (the set's frame: toward the star is away from the visitor, so smaller z)
    star.u.uAlpha.value = (1 - 0.55 * D.far) * (0.9 + 0.1 * Math.sin(T * 3) * m); starGlow.set(0.8 - 0.4 * D.far);
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
    sig.u.uAlpha.value = 0.9;
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

  const texSize = (g) => g.mesh.material.uniforms.uTex.value.image.width + 'x' + g.mesh.material.uniforms.uTex.value.image.height;
  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh],
    info: () => ({ segments: segTotal, lite, contours: tonePts, ribbons: segTotal - tonePts, f, castles: NP_CASTLES.map((c) => npWorld(c.x, c.z)), center: wc, near: st.near.map((x) => +x.toFixed(2)), glass: glass.visible, star: starAnchor.pos.z - NP_ARRIVE, texture: [water, refl, spl, shape, star, sig].map(texSize).join(' + ') }),
  };
};
