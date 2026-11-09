// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 1 · «EN UNA»  (the cover, walkable: a computer that dreams two sleepers, drawn in white chalk on black)
//   Centre: a monitor and a tower under two brains, an antenna with orbit rings and sparks, a keyboard on a desk, a cup,
//   a cable down the right side. Left: the sleeper (night cap, silver glitter). Right: the one with the gold visor, looking
//   into a cone of dots and binary digits. Hands with jagged sleeves rise from below. Signed 11:11 on the floor.
//   Ambient movement while the machine runs: hands type, data falls from the antenna, sparks, steam, the sleeper breathes.
//   The puzzle lives in the cone: its dots line up into the code only from the visor's own eyes (real perspective).
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Local frame of the set (metres): +x to the viewer's right, +z toward the visitor, y up; the floor is the water. */
const EN_UNA_SET = {
  x: 0.4, z: 10,                                     // world position of the local origin (x: the cast's centre falls at the middle)
  eye: [2.8, 1.93, 0.0],                             // the visor's eyes (the camera of "mirar por su visor")
  look: [-1, 0, 0.04],                               // where they look: toward the machine
  code: [1, 0, 1, 1, 0, 0, 1, 0],                    // clockwise from the top spoke
  screen: { c: [-0.05, 1.68, 0.345], w: 0.9, h: 1.08 },
  cup: [-1.22, 0.92, -0.22],
  head: [3.1, 2.0, 0.0],
};
const GLYPH_PATTERN = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'] };

/** What the monitor shows: the asterisk (8 spokes, lit or not), or the digits of the clock. */
function drawEnUnaScreen(ctx, w, h, st) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const S = w, k = makeChalk(ctx, { op: 'lighter', bg: '#000' }, S, 31);
  if (st.mode === 'clock') {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = FONT_DISPLAY(h * 0.3, '', 500);
    ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 26; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const txt = `${st.clock[0]}${st.clock[1]}:${st.clock[2]}${st.clock[3]}`;
    ctx.fillText(txt, w / 2, h * 0.5);
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillText(txt, w / 2, h * 0.5);
    ctx.restore();
    k.rect(w * 0.1, h * 0.31, w * 0.8, h * 0.38, 0.012, 'g', 1, 0.5);
    return;
  }
  const cx = w / 2, cy = h / 2, len = [h * 0.43, w * 0.39, h * 0.4, w * 0.36];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, dx = Math.sin(a), dy = -Math.cos(a), on = st.spokes[i] > 0.5, L = i % 2 ? Math.min(len[2], len[3]) * 1.08 : i % 4 === 0 ? len[0] : len[1];
    const x2 = cx + dx * L, y2 = cy + dy * L;
    if (on) { k.line(cx, cy, x2, y2, 0.036, 'g', 3, 1); k.line(cx, cy, x2, y2, 0.075, 'g', 1, 0.22); }
    else k.line(cx, cy, x2, y2, 0.013, 'g', 1, 0.32);
  }
  k.arc(cx, cy, w * 0.035, 0, TAU, 0.02, 'g', 2, 0.9);
}

/** The mono, as the mirror keeps him (the same one of the old plate: round face, two ears, a muzzle). */
function drawEnUnaMono(ctx, w, h) {
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
  const { THREE, V3 } = ctx, RU = kit.RU, S = EN_UNA_SET, lite = ctx.lite;
  const fold = lite ? 0.7 : 1, rnd = mulberry32(11);
  const root = new THREE.Group();
  root.position.set(S.x, 0, S.z);
  root.rotation.y = Math.atan2(-S.x, 2.7 - S.z); // the front (+z local) faces the place where the visitor stands
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  let segTotal = 0;
  const lines = (rib, o) => { segTotal += rib.count; return kit.lines(rib, o); };
  const IV = [0.93, 0.9, 0.82];

  // ---- the floor: the paper's edge and the signature ----
  const frameR = kit.ribbons(3);
  { const x0 = -3.6, x1 = 4.3, z0 = -1.3, z1 = 2.1, y = 0.012;
    frameR.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], 1.6, 0.5, true); }
  const frameL = lines(frameR); root.add(frameL.obj);
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = FONT_DISPLAY(70, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, h / 2 + 4); }), 0.8, 0.3, { alpha: 0.8 });
  sig.mesh.position.set(3.6, 0.015, 1.65); sig.mesh.rotation.x = -Math.PI / 2; root.add(sig.mesh);

  // ---- the desk, the computer, the brains, the antenna, the cable (one static group) ----
  const M = kit.ribbons(7), W2 = 3.3, W1 = 2.1, W0 = 1.5;
  RG.box(M, -1.55, 0.86, -0.55, 1.45, 0.92, 0.6, W2, 0.95);                                  // desk top
  for (const x of [-1.5, 1.4]) { // the two side panels, shaded with a few chalk strokes
    M.poly([[x, 0.0, -0.5], [x, 0.86, -0.5], [x, 0.86, 0.55], [x, 0.0, 0.55]], W1, 0.8, true);
    for (let i = 0; i < 3; i++) M.seg([x, 0.12 + i * 0.22, 0.46 - i * 0.05], [x, 0.3 + i * 0.22, 0.3 - i * 0.05], W0, 0.4);
  }
  RG.box(M, -0.62, 0.98, -0.3, 0.52, 2.38, 0.34, W2, 1);                                     // monitor body
  { const z = 0.345; // the screen's bezel, two outlines
    M.poly([[-0.5, 1.14, z], [0.4, 1.14, z], [0.4, 2.22, z], [-0.5, 2.22, z]], W2, 1, true);
    M.poly([[-0.54, 1.1, z], [0.44, 1.1, z], [0.44, 2.26, z], [-0.54, 2.26, z]], W1, 0.7, true);
    for (const x of [0.28, 0.36]) M.poly(RG.arc([x, 1.04, z], [1, 0, 0], [0, 1, 0], 0.018, 0.018, 10), W0, 0.9);
    for (let i = 0; i < 6; i++) M.seg([0.52, 1.1 + i * 0.2, 0.28 - i * 0.02], [0.52, 1.28 + i * 0.2, 0.02 - i * 0.02], W0, 0.45); }
  RG.box(M, 0.64, 0.98, -0.45, 1.34, 2.1, 0.3, W2, 1);                                       // tower
  for (let i = 0; i < 7; i++) M.seg([0.72, 1.55 + i * 0.07, 0.3], [1.26, 1.55 + i * 0.07, 0.3], W0, 0.8);
  M.poly([[0.72, 1.2, 0.3], [1.26, 1.2, 0.3], [1.26, 1.34, 0.3], [0.72, 1.34, 0.3]], W1, 0.9, true);
  M.poly(RG.arc([0.99, 1.08, 0.3], [1, 0, 0], [0, 1, 0], 0.03, 0.03, 12), W1, 0.9);
  for (let i = 0; i < 6; i++) M.seg([1.34, 1.02 + i * 0.17, 0.22 - i * 0.03], [1.34, 1.18 + i * 0.17, 0.02 - i * 0.03], W0, 0.45);
  { const a = [-0.06, 2.38, -0.04], b = [0.52, 2.30, 0.04]; // two big brains on top, B in front of A
    for (const [c, rx, ry, rz, n, sd] of [[a, 0.66, 0.42, 0.42, 46, 3], [b, 0.62, 0.44, 0.46, 52, 8]]) {
      RG.folds(M, c, rx, ry, rz, Math.round(n * fold), sd, 1.8, 0.95, 32);
      M.poly(RG.arc(c, [1, 0, 0], [0, 1, 0], rx, ry, 40, 0, Math.PI), W2, 1);                // front outline
      M.poly(RG.arc(c, [0, 0, 1], [0, 1, 0], rz, ry, 30, 0, Math.PI), W1, 0.7);              // side outline
      M.poly(RG.arc([c[0], c[1], c[2]], [1, 0, 0], [0, 0, 1], rx, rz, 40), W1, 0.55, true);   // base
      const r = mulberry32(sd + 90), fis = []; for (let i = 0; i <= 20; i++) { const u = i / 20 * Math.PI; fis.push([c[0] + 0.03 * Math.sin(i * 1.7), c[1] + ry * Math.sin(u) * 1.02, c[2] + rz * Math.cos(u)]); } M.poly(fis, W1, 0.7); r();
    }
    for (const x of [0.86, 0.96, 1.04]) { const y0 = 2.08 + (x - 0.86) * 0.2; M.seg([x, y0, 0.22], [x - 0.01, y0 - 0.16 - (x - 0.86) * 0.5, 0.22], W1, 0.9); M.poly(RG.arc([x - 0.01, y0 - 0.19 - (x - 0.86) * 0.5, 0.22], [1, 0, 0], [0, 1, 0], 0.012, 0.016, 8), W0, 0.9); }
  }
  M.seg([0.2, 2.74, 0], [0.2, 3.66, 0], W2, 1);                                              // antenna pole
  M.poly(RG.arc([0.2, 3.7, 0], [1, 0, 0], [0, 1, 0], 0.05, 0.05, 14), W1, 1, true);
  { const pts = []; for (let i = 0; i <= 60; i++) { const y = 1.75 - (i / 60) * 1.72; pts.push([1.5 + 0.06 * Math.sin(y * 30), y, 0.05 + 0.04 * Math.cos(y * 30)]); }   // the cable, coiled, down the right side
    M.poly([[1.34, 1.75, 0.04], [1.44, 1.75, 0.05], ...pts], W1, 0.95);
    M.poly(RG.arc([1.74, 0.03, 0.1], [1, 0, 0], [0, 0, 1], 0.2, 0.12, 24, 3.14, 7.2), W0, 0.8);
    const c2 = []; for (let i = 0; i <= 8; i++) c2.push([0.52 + i * 0.015, 1.42 + 0.03 * Math.sin(i * 2.2), 0.0]); M.poly(c2, W1, 0.9); }
  const machine = lines(M, { glow: true }); root.add(machine.obj);
  const solidsLocal = [];

  // ---- antenna rings (they turn) and sparks (they flicker) ----
  const rings = grp(root, 0.2, 0, 0), ringL = [];
  [[2.98, 0.26], [3.12, 0.22], [3.26, 0.18]].forEach(([y, r], i) => {
    const R = kit.ribbons(20 + i), g = grp(rings, 0, y, 0), u = [Math.cos(0.4), Math.sin(0.4), 0];
    R.poly(RG.arc([0, 0, 0], u, [0, 0, 1], r, r * 0.9, 36), W1, 0.95, true);
    const L = lines(R); g.add(L.obj); g.rotation.z = (i - 1) * 0.12; ringL.push(g);
  });
  const sparkR = kit.ribbons(30);
  for (let i = 0; i < 7; i++) { const a = -1.15 + i * 0.38, d = [Math.sin(a), Math.cos(a), 0], l0 = 0.1, l1 = i % 2 ? 0.26 : 0.34; sparkR.seg([0.2 + d[0] * l0, 3.7 + d[1] * l0, 0], [0.2 + d[0] * l1, 3.7 + d[1] * l1, 0], W1, 1); }
  const sparks = lines(sparkR, { glow: true }); root.add(sparks.obj);

  // ---- the keyboard (rows of keys that dip) ----
  const kb = grp(root, 0, 0, 0), keyRows = [];
  { const K = kit.ribbons(40); RG.box(K, -1.45, 0.92, 0.12, -0.2, 0.965, 0.58, W1, 0.95); const L = lines(K); kb.add(L.obj); }
  for (let r = 0; r < 4; r++) {
    const K = kit.ribbons(41 + r), z0 = 0.15 + r * 0.1, row = grp(kb, 0, 0, 0);
    const n = r === 3 ? 6 : 12; for (let i = 0; i < n; i++) { const x0 = r === 3 ? -1.25 + i * 0.17 : -1.41 + i * 0.1, wk = r === 3 ? 0.15 : 0.08; K.poly([[x0, 0.967, z0], [x0 + wk, 0.967, z0], [x0 + wk, 0.967, z0 + 0.07], [x0, 0.967, z0 + 0.07]], 1.4, 0.9, true); }
    const L = lines(K); row.add(L.obj); keyRows.push(row);
  }

  // ---- hands with jagged sleeves rising from below ----
  const handLines = (flip, seed) => { // the back of a hand: wrist, knuckles, four fingers and a thumb; a jagged cuff
    const H = kit.ribbons(seed), s = flip ? -1 : 1, P = (x, y) => [x * s, y, 0];
    H.poly([P(-0.045, 0), P(-0.07, 0.08), P(-0.078, 0.15)], W1, 1); H.poly([P(0.045, 0), P(0.07, 0.08), P(0.078, 0.15)], W1, 1);
    H.poly([P(-0.078, 0.15), P(-0.04, 0.165), P(0, 0.17), P(0.04, 0.165), P(0.078, 0.15)], W1, 0.9);
    [[-0.058, 0.07], [-0.02, 0.095], [0.02, 0.1], [0.058, 0.085]].forEach(([x, l]) => {
      H.poly([P(x - 0.016, 0.16), P(x - 0.016, 0.15 + l), P(x - 0.008, 0.16 + l), P(x + 0.008, 0.16 + l), P(x + 0.016, 0.15 + l), P(x + 0.016, 0.16)], W0, 0.95);
      H.poly(RG.arc([x * s, 0.165, 0], [1, 0, 0], [0, 1, 0], 0.012, 0.012, 8), 1.1, 0.6);
    });
    H.poly([P(0.07, 0.06), P(0.115, 0.1), P(0.135, 0.16), P(0.12, 0.18)], W1, 0.95);
    const cuff = []; for (let i = 0; i <= 8; i++) cuff.push([(-0.1 + i * 0.025) * s, -0.03 - (i % 2) * 0.07, 0]);
    H.poly(cuff, W1, 1);
    return H;
  };
  const makeHand = (x, y, z, flip, seed, tilt) => {
    const g = grp(root, x, y, z), h = grp(g, 0, 0, 0); h.rotation.x = tilt; h.scale.setScalar(2.3);
    const L = lines(handLines(flip, seed), { glow: true }); h.add(L.obj);
    const SL = kit.ribbons(seed + 5);
    const s = flip ? -1 : 1;
    const out = flip ? 1 : -1; // the arm slopes down and outward, toward the visitor
    for (const e of [-0.1, 0.1]) { const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([e * (1 + k * 1.4) + out * k * 0.3 + (i % 2 ? 0.012 : 0), -0.07 - k * (y - 0.09), 0.1 + k * 0.8]); } SL.poly(pts, W1, 0.85); }
    for (let i = 0; i < 6; i++) { const k = i / 6, yy = -0.09 - k * (y - 0.12) * 0.9, xx = out * k * 0.3; SL.seg([-0.1 * (1 + k * 1.4) + xx, yy, 0.1 + k * 0.8], [-0.03 + xx, yy + 0.06, 0.1 + k * 0.8 + 0.02], W0, 0.4); }
    const SLL = lines(SL); g.add(SLL.obj);
    return { g, h, base: y };
  };
  const handA = makeHand(-0.8, 1.0, 0.3, false, 50, -0.78);   // typing
  const handB = makeHand(1.0, 0.95, 0.5, true, 60, -1.1);        // resting on the desk

  // ---- the cup, its steam; turned over it shows 11:11 on its base ----
  const cupG = grp(root, S.cup[0], S.cup[1], S.cup[2]), cupBody = grp(cupG, 0, 0.085, 0);
  { const C = kit.ribbons(70), r1 = 0.1, r0 = 0.075;
    C.poly(RG.arc([0, 0.085, 0], [1, 0, 0], [0, 0, 1], r1, r1, 28), W1, 1, true);           // rim (local y = 0 is the cup's middle)
    C.poly(RG.arc([0, -0.085, 0], [1, 0, 0], [0, 0, 1], r0, r0, 24), W1, 0.9, true);
    C.seg([-r1, 0.085, 0], [-r0, -0.085, 0], W1, 1); C.seg([r1, 0.085, 0], [r0, -0.085, 0], W1, 1);
    C.poly(RG.arc([r1 * 0.92, 0, 0], [1, 0, 0], [0, 1, 0], 0.05, 0.055, 14, -1.3, 1.3), W1, 1);   // the handle
    C.poly(RG.arc([0, 0.07, 0], [1, 0, 0], [0, 0, 1], r1 * 0.86, r1 * 0.86, 20), W0, 0.5, true);
    const L = lines(C); cupBody.add(L.obj);
    const sa = kit.ribbons(71); sa.poly(RG.arc([0, 0.0, 0], [1, 0, 0], [0, 0, 1], 0.16, 0.16, 30), W1, 0.85, true); const SA = lines(sa); cupG.add(SA.obj);
    SA.obj.position.y = -0.0;
    const base = kit.plane(ctx.canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = FONT_DISPLAY(78, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.55)'; c.shadowBlur = 12; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, h / 2 + 4); }), 0.13, 0.065, { alpha: 0.95, side: THREE.FrontSide });
    base.mesh.rotation.x = Math.PI / 2; base.mesh.position.y = -0.087; cupBody.add(base.mesh); // faces down while the cup is upright
    cupBody.userData.base = base;
  }
  const steam = kit.points(Array.from({ length: lite ? 9 : 22 }, (_, i) => [S.cup[0] + (rnd() - 0.5) * 0.06, S.cup[1] + 0.18, S.cup[2] + (rnd() - 0.5) * 0.04, 0.03, 0.6, (i / (lite ? 9 : 22)) % 1, 0]), { mode: 1, rise: [0.04, 0.55, 0.02], speed: 0.16, spread: 0.07, tint: [0.88, 0.9, 0.95] });
  root.add(steam.obj);

  // ---- the cast: the sleeper (left) and the one with the visor (right) ----
  const bust = (parent, seed, o) => {
    const B = kit.ribbons(seed), c = [0, o.cy, 0];
    B.poly(RG.arc([0, o.cy - 0.18, 0], [1, 0, 0], [0, 1, 0], 0.3, 0.36, 30, Math.PI + 0.15, TAU - 0.15), W1, 0.95);         // the head below the brain
    RG.folds(B, [0, o.cy + 0.16, 0], 0.38, 0.28, 0.3, Math.round(26 * fold), seed + 1, 1.6, 0.95, 28);
    B.poly(RG.arc([0, o.cy + 0.16, 0], [1, 0, 0], [0, 1, 0], 0.38, 0.28, 30, 0, Math.PI), W2, 1);
    B.poly(RG.arc([0, o.cy + 0.16, 0], [0, 0, 1], [0, 1, 0], 0.3, 0.28, 24, 0, Math.PI), W1, 0.6);
    for (const s of [-1, 1]) B.poly([[s * 0.1, o.cy - 0.5, 0], [s * 0.11, o.cy - 0.7, 0]], W1, 0.9);                      // neck
    B.poly([[-0.11, o.cy - 0.7, 0], [-0.5, o.cy - 0.82, 0], [-0.78, o.cy - 1.0, 0]], W2, 0.9); B.poly([[0.11, o.cy - 0.7, 0], [0.5, o.cy - 0.82, 0], [0.78, o.cy - 1.0, 0]], W2, 0.9);
    B.poly([[-0.78, o.cy - 1.0, 0], [-0.84, o.cy - 1.3, 0]], W1, 0.45); B.poly([[0.78, o.cy - 1.0, 0], [0.84, o.cy - 1.3, 0]], W1, 0.45);
    const f = o.face; // facing: +1 to the right (the sleeper), −1 to the left (the visor)
    return { B, f, c };
  };
  // the sleeper
  const sl = grp(root, -2.4, 0, 0), slBody = grp(sl, 0, 1.2, 0), sleeper = { g: slBody };
  { const b = bust(sl, 80, { cy: 1.9, face: 1 }), B = b.B, y = 1.9;
    B.poly([[0.11, y - 0.08, 0.02], [0.17, y - 0.1, 0.02], [0.22, y - 0.07, 0.02]], W0, 1); B.poly([[0.11, y - 0.07, 0.02], [0.14, y - 0.045, 0.02], [0.2, y - 0.05, 0.02]], W0, 0.8); // a closed eye and a brow
    B.poly([[0.26, y - 0.06, 0], [0.3, y - 0.2, 0], [0.24, y - 0.22, 0]], W0, 0.95); B.poly(RG.arc([0.18, y - 0.34, 0], [1, 0, 0], [0, 1, 0], 0.07, 0.03, 10, 3.5, 5.9), W0, 0.95);
    B.poly(RG.arc([-0.3, y - 0.15, 0], [1, 0, 0], [0, 1, 0], 0.045, 0.07, 10), W0, 0.8);                               // an ear
    B.poly(RG.arc([0, y + 0.18, 0], [1, 0, 0], [0, 0, 1], 0.41, 0.33, 36), W1, 0.95, true); B.poly(RG.arc([0, y + 0.25, 0], [1, 0, 0], [0, 0, 1], 0.4, 0.32, 36), W1, 0.8, true); // the cap's rolled brim
    const tip = [-0.66, y + 0.78, 0], bez = (p0, p1, p2, n = 14) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1], 0.0]); } return o; };
    B.poly(bez([0.39, y + 0.27, 0], [0.34, y + 0.82, 0], tip), W2, 1); B.poly(bez([-0.39, y + 0.27, 0], [-0.52, y + 0.52, 0], tip), W2, 1);
    B.poly(RG.arc([tip[0] - 0.02, tip[1] + 0.03, 0], [1, 0, 0], [0, 1, 0], 0.05, 0.05, 12), W1, 1, true);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; B.seg([tip[0] - 0.02 + Math.cos(a) * 0.055, tip[1] + 0.03 + Math.sin(a) * 0.055, 0], [tip[0] - 0.02 + Math.cos(a) * 0.085, tip[1] + 0.03 + Math.sin(a) * 0.085, 0], W0, 0.8); }
    for (const [dx, dy, r] of [[-0.74, y + 0.55, 0.05]]) { B.seg([dx - r, dy, 0], [dx + r, dy, 0], W0, 1); B.seg([dx, dy - r, 0], [dx, dy + r, 0], W0, 1); B.seg([dx - r * 0.5, dy - r * 0.5, 0], [dx + r * 0.5, dy + r * 0.5, 0], W0, 0.8); B.seg([dx - r * 0.5, dy + r * 0.5, 0], [dx + r * 0.5, dy - r * 0.5, 0], W0, 0.8); } // the star
    const L = lines(B, { glow: true }); sl.add(L.obj); sleeper.L = L;
    const nG = lite ? 34 : 86, rows = [];
    for (let i = 0; i < nG; i++) { const th = (rnd() - 0.5) * 2.7, ph = 0.1 + rnd() * 0.75, q = RG.ell([0, y + 0.18, 0], 0.4, 0.3, 0.33, th, ph); rows.push([q[0], q[1], q[2], 0.028 + rnd() * 0.03, 0.55 + rnd() * 0.45, rnd(), 0]); }
    sleeper.glitter = kit.points(rows, { shape: 3, twinkle: 0.85, tint: [0.82, 0.88, 1] }); sl.add(sleeper.glitter.obj);
  }
  // the visor
  const vg = grp(root, S.head[0], 0, 0), visor = {};
  { const b = bust(vg, 100, { cy: 1.9, face: -1 }), B = b.B, y = 1.9;
    B.poly([[-0.26, y + 0.0, 0.02], [-0.37, y - 0.1, 0.02], [-0.28, y - 0.14, 0.02]], W0, 0.95);                          // the nose
    B.poly(RG.arc([-0.18, y - 0.3, 0], [1, 0, 0], [0, 1, 0], 0.07, 0.03, 10, 3.5, 5.9), W0, 0.95);                       // the lips
    B.poly([[-0.2, y - 0.34, 0], [-0.17, y - 0.46, 0]], W0, 0.6);
    B.poly(RG.arc([0.3, y - 0.15, 0], [1, 0, 0], [0, 1, 0], 0.045, 0.07, 10), W0, 0.8);
    for (const dy of [0.0, 0.12]) B.poly(RG.arc([0.02, y + dy, 0], [1, 0, 0], [0, 0, 1], 0.36, 0.3, 36), W1, 0.95, true); // the visor band wraps the head
    B.poly([[-0.34, y, 0.2], [-0.37, y + 0.06, 0.12], [-0.34, y + 0.12, 0.2]], W1, 0.8);
    const hat = (x0, tilt) => { const base = [0.04, y + 0.46, 0], tip = [0.04 + tilt, y + 1.12, 0]; // a party hat, with stripes and a pompom
      B.poly([[base[0] - 0.17, base[1], 0], tip, [base[0] + 0.17, base[1], 0]], W2, 1); B.poly(RG.arc(base, [1, 0, 0], [0, 0, 1], 0.17, 0.14, 24), W1, 0.8, true);
      for (let i = 1; i < 4; i++) { const k = i / 4, xl = lerp(base[0] - 0.17, tip[0], k), xr = lerp(base[0] + 0.17, tip[0], k), yy = lerp(base[1], tip[1], k); B.seg([xl, yy, 0], [xr, yy + 0.04, 0], W0, 0.7); }
      B.poly(RG.arc([tip[0], tip[1] + 0.03, 0], [1, 0, 0], [0, 1, 0], 0.045, 0.045, 12), W1, 1, true); };
    hat(0, -0.05);
    const L = lines(B, { glow: true }); vg.add(L.obj); visor.L = L;
    const nG = lite ? 50 : 130, rows = [];
    for (let i = 0; i < nG; i++) { const th = (rnd() - 0.5) * 6.0, yy = y + 0.01 + rnd() * 0.11, x = 0.02 + 0.355 * Math.sin(th), z = 0.295 * Math.cos(th); rows.push([x, yy, z, 0.022 + rnd() * 0.03, 0.6 + rnd() * 0.4, rnd(), 0]); }
    visor.glitter = kit.points(rows, { shape: 3, twinkle: 0.8, tint: [1, 0.78, 0.28] }); vg.add(visor.glitter.obj);
  }

  // ---- the screen (the asterisk, then the clock; dark, then the mono) ----
  const scrState = { mode: 'code', spokes: [0, 0, 0, 0, 0, 0, 0, 0], clock: [0, 3, 4, 7], key: '' };
  const scrTex = ctx.canvasTex(450, 540, (c, w, h) => drawEnUnaScreen(c, w, h, scrState));
  const scr = kit.plane(scrTex, S.screen.w, S.screen.h); scr.mesh.position.set(...S.screen.c); root.add(scr.mesh);
  const monoPlane = kit.plane(ctx.canvasTex(450, 540, (c, w, h) => drawEnUnaMono(c, w, h)), S.screen.w, S.screen.h, { alpha: 0 }); monoPlane.mesh.position.set(S.screen.c[0], S.screen.c[1], S.screen.c[2] + 0.002); root.add(monoPlane.mesh);
  const redraw = () => { const c = scrTex.image.getContext('2d'); drawEnUnaScreen(c, scrTex.image.width, scrTex.image.height, scrState); scrTex.needsUpdate = true; };

  // ---- the cone: the visor looks into dots, circles and binary digits; the code is in it ----
  const E = S.eye, Dn = (() => { const d = S.look, n = Math.hypot(...d); return d.map((v) => v / n); })();
  const cone = grp(root, 0, 0, 0);
  const nRays = lite ? 12 : 24, rayRows = [], ringRows = [], rr = mulberry32(77);
  { const up = [0, 1, 0], right = [Dn[1] * up[2] - Dn[2] * up[1], Dn[2] * up[0] - Dn[0] * up[2], Dn[0] * up[1] - Dn[1] * up[0]]; // right = D × up
    for (let i = 0; i < nRays; i++) {
      const a = (i / nRays) * TAU + 0.2, rad = 0.2 + rr() * 0.3;
      for (let t = 0.3; t <= 2.5; t += 0.2) { const k = t * rad; const p = [E[0] + Dn[0] * t + right[0] * Math.cos(a) * k, E[1] + Dn[1] * t + Math.sin(a) * k, E[2] + Dn[2] * t + right[2] * Math.cos(a) * k]; rayRows.push([p[0], p[1], p[2], 0.02 + t * 0.008, 0.6, rr(), 0]); }
    }
    for (let i = 0; i < (lite ? 22 : 46); i++) { const t = 0.7 + rr() * 1.9, a = rr() * TAU, rad = 0.1 + rr() * 0.55, k = t * rad; ringRows.push([E[0] + Dn[0] * t + right[0] * Math.cos(a) * k, E[1] + Dn[1] * t + Math.sin(a) * k, E[2] + Dn[2] * t + right[2] * Math.cos(a) * k, 0.1 + rr() * 0.12, 0.7, rr(), 0]); }
  }
  const rays = kit.points(rayRows, { shape: 0 }); cone.add(rays.obj);
  const circles = kit.points(ringRows, { shape: 2 }); cone.add(circles.obj);
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
    const Rr = Rpx * 2 * tanV, hD = Rr * 0.4, wD = hD * 0.56, cell = hD / 4, dot = cell * 0.62;
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
    S.code.forEach((bit, i) => {
      const ang = (i * Math.PI) / 4, ox = Math.sin(ang) * Rr, oy = Math.cos(ang) * Rr, pat = GLYPH_PATTERN[bit];
      pat.forEach((row, r) => { for (let q = 0; q < 3; q++) if (row[q] === '1' && n < NCODE - 3) put(ox + (q - 1) * wD / 2, oy + (2 - r) * cell, dot, 1, dr()); });
    });
    { const ox = 0, oy = Rr + hD * 0.78; for (const [dx, dy] of [[-1, 1], [1, 1], [0, 0]]) if (n < NCODE) put(ox + dx * cell * 0.8, oy + dy * cell * 0.9, dot * 1.1, 1, dr()); } // the start mark: a small ▼ above the top digit
    for (; n < NCODE; ) { code.dat[n * 4 + 1] = 0; n++; }
    code.geo.attributes.position.needsUpdate = true; code.geo.attributes.aData.needsUpdate = true;
    cd.ready = true; cd.count = cd.exp.length;
  }
  layoutCode({ yaw: Math.PI, pitch: 0, fov: 44 }, 1.7, null); // a first layout, aligned to a default eye; the controller re-lays it for the real pose

  // ---- the data: binary digits fall from the antenna into the cone ----
  const streamN = lite ? 16 : 44;
  const streamCurve = [[0.2, 3.75, 0.1], [0.9, 3.3, 0.35], [2.3, 3.3, 0.2], [E[0] - 0.4, E[1] + 0.1, 0.05]];
  const stream = kit.points(Array.from({ length: streamN }, (_, i) => [0, 0, 0, 0.085, 0.95, i / streamN, Math.floor(rnd() * 2)]), { shape: 1, mode: 2, curve: streamCurve, speed: 0.09, spread: 0.14 });
  root.add(stream.obj);
  const columnRows = []; for (let i = 0; i < (lite ? 14 : 36); i++) { const cI = i % 3, rI = Math.floor(i / 3); columnRows.push([1.52 + cI * 0.09, 2.5 - rI * 0.09, 0.28, 0.07, 0.8, rnd(), Math.floor(rnd() * 2)]); }
  const column = kit.points(columnRows, { shape: 1, twinkle: 0.5 }); root.add(column.obj);

  // ---- hotspots (world positions) and what the visitor bumps into ----
  root.updateMatrixWorld(true);
  const W3 = (x, y, z) => root.localToWorld(V3(x, y, z));
  ctx.anchors['rm-screen'] = { pos: W3(S.screen.c[0], S.screen.c[1], 0.36), w: 1.0, h: 1.2 };
  ctx.anchors['rm-visor'] = { pos: W3(S.head[0] - 0.1, S.head[1] - 0.05, 0.2), w: 0.9, h: 0.95 };
  ctx.anchors['rm-cup'] = { pos: W3(S.cup[0], S.cup[1] + 0.1, S.cup[2]), w: 0.36, h: 0.34 };
  const solids = [{ kind: 'box', cx: 0, cz: 0, hw: 1.6, hd: 0.62 }, { kind: 'circle', cx: -2.4, cz: 0, r: 0.5 }, { kind: 'circle', cx: S.head[0], cz: 0, r: 0.5 }].map((s) => {
    const p = W3(s.cx, 0, s.cz);
    return s.kind === 'box' ? { kind: 'box', x: p.x, z: p.z, hw: s.hw, hd: s.hd, ry: root.rotation.y } : { kind: 'circle', x: p.x, z: p.z, r: s.r };
  });

  // ---- the sheet that flies to the book when the floor is solved ----
  const sheet = kit.plane(ctx.canvasTex(256, 352, (c, w, h) => BookArt.drawSheet(c, w, h)), 0.16, 0.22, { alpha: 0 }); sheet.mesh.visible = false; ctx.scene.add(sheet.mesh);

  // ---- camera poses (like the level's: from a point to a target in the set's frame, the target landing on screen at (sx, sy)) ----
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld(true);
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    const f = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (f.x0 + f.x1) / 2, sy = (f.y0 + f.y1) / 2, fw = (f.x1 - f.x0) * 0.92, fh = (f.y1 - f.y0) * 0.92, phone = a < 0.8;
    const fov = phone ? 56 : 44;
    if (view === 'screen') { const d = fit(1.0, 1.22, fw, fh, fov, a), c = S.screen.c; return aim([c[0], c[1] + d * 0.03, c[2] + d], [c[0], c[1], c[2]], sx, sy, fov, a); }
    if (view === 'cup') { const d = fit(0.4, 0.34, fw, fh, fov, a), c = [S.cup[0], S.cup[1] + 0.07, S.cup[2]]; return aim([c[0] + d * 0.15, c[1] + d * 0.42, c[2] + d * 0.9], c, sx, sy, fov, a); }
    if (view === 'visor') { const d = fit(1.2, 1.25, fw, fh, fov, a), c = [S.head[0], S.head[1] - 0.02, 0]; return aim([c[0] - d * 0.45, c[1] + d * 0.05, c[2] + d * 0.9], c, sx, sy, fov, a); }
    if (view === 'through') {
      const fv = phone ? 62 : 48, p = aim(E, [E[0] + Dn[0], E[1] + Dn[1], E[2] + Dn[2]], sx, sy, fv, a);
      layoutCode(p, a, f);
      return p;
    }
    return null;
  }

  // ---- every frame ----
  const st = { ph: 0, ph2: 0, run: 1, T: 0 };
  const tmpV = V3(), tmpF = V3(), tmpU = V3();
  function update(dt, t) {
    const w = world.room, m = world.reduced ? 0 : 1;
    st.T += dt * m; RU.uTime.value = st.T;
    st.run = damp(st.run, 1 - w.shut, 3, dt);
    const on = st.run;
    // the screen: what it shows now
    const key = w.mode + '|' + w.spokes.join('') + '|' + w.clock.join('');
    if (key !== scrState.key) { scrState.key = key; scrState.mode = w.mode; scrState.spokes = w.spokes.slice(); scrState.clock = w.clock.slice(); redraw(); }
    const flick = 1 - 0.14 * m * on * Math.max(0, Math.sin(t * 23) * Math.sin(t * 3.1)) * 2;
    scr.set((w.mode === 'dark' ? 0 : 0.9 * flick) * (1 - 0.8 * w.flash));
    monoPlane.set(w.mono * (0.82 + 0.1 * m * Math.sin(t * 0.8)));
    // the running machine
    st.ph += dt * 9 * on * m; st.ph2 += dt * 0.5 * on * m;
    keyRows.forEach((row, i) => { row.position.y = -0.011 * Math.max(0, Math.sin(st.ph * (0.9 + i * 0.37) + i * 1.9)) * on; });
    handA.h.rotation.x = -0.78 + 0.05 * Math.sin(st.ph * 0.55) * on; handA.g.position.y = handA.base - 0.012 * Math.max(0, Math.sin(st.ph * 1.1)) * on; handA.g.position.x = -0.8 + 0.03 * Math.sin(st.ph * 0.21) * on;
    handB.g.position.y = handB.base + 0.004 * Math.sin(t * 1.3) * m; handB.h.rotation.x = -1.1 + 0.025 * Math.sin(st.ph * 0.3 + 1) * on;
    rings.rotation.y += dt * 0.7 * on * m; ringL.forEach((g, i) => { g.rotation.z = (i - 1) * 0.12 + Math.sin(st.T * (0.8 + i * 0.3)) * 0.1 * on; g.rotation.x = Math.sin(st.T * 0.6 + i) * 0.12 * on; });
    sparks.set((0.25 + 0.75 * Math.max(0, Math.sin(st.T * 13) * Math.sin(st.T * 4.7) * 0.5 + 0.55)) * on * (m ? 1 : 0.6));
    stream.set(on); column.set(0.8 * on + 0.15);
    machine.set(1 - 0.4 * w.shut - 0.6 * w.through);
    // the cup turns over
    const ck = w.cup; cupBody.rotation.x = ck * Math.PI; cupG.position.y = S.cup[1] + Math.sin(ck * Math.PI) * 0.07; steam.set(0.6 * (1 - ck) * (1 - 0.5 * w.shut));
    // breathing
    slBody.scale.y = 1 + 0.014 * Math.sin(t * 1.15) * m; sleeper.L.set(1 - 0.5 * w.through); sleeper.glitter.set(1 - 0.7 * w.through); visor.L.set(1 - 0.85 * w.through); visor.glitter.set(1 - 0.8 * w.through);
    // the cone: decoys step back when the visitor looks from the visor; the code is bright there
    rays.set(0.9 * (1 - 0.7 * w.through) * (0.35 + 0.65 * on)); circles.set(0.85 * (1 - 0.75 * w.through) * (0.35 + 0.65 * on));
    code.set(0.95);
    frameL.set(0.5); sig.set(0.8);
    // the page flying to the book
    const pg = w.page;
    sheet.mesh.visible = pg > 0.001 && pg < 0.999;
    if (sheet.mesh.visible) {
      const cam = ctx.camera; cam.updateMatrixWorld();
      tmpF.set(0, 0, -1).applyQuaternion(cam.quaternion); tmpU.set(0, 1, 0).applyQuaternion(cam.quaternion);
      const mid = tmpV.copy(cam.position).addScaledVector(tmpF, 0.62).addScaledVector(tmpU, 0.02);
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(S.screen.c[0], S.screen.c[1], 0.4)), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mid.clone();
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
    info: () => ({ segments: segTotal, lite, code: S.code.join(''), codeDots: cd.count, aligned: cd.ready }),
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
