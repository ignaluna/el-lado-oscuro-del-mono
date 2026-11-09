// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOOR 4 · «¿QUÉ CARAJO?»  (the cover, as two raised hands: white chalk on black)
//   The drawing is two furry-wristed hands held up with the palms forward, every finger, crease and strand of fur white on the
//   black paper, and three drops falling: one from each wrist and one between them. "11:11" in a corner. The strokes are the
//   photo's own (traced once, see 49-r3d-room-4-que-carajo-hands.js), laid out in the cover's pixels on a relief board that leans
//   back toward the visitor (like floors 2 and 3), the hands standing a little off the paper.
//   In front of the board, on the water, a backpack's drag marks cross the floor and fork five times (the left palm's line says how
//   to turn); at the end of each right turn lies something inherited, drawn in chalk standing on the water. Each fork is a pair of
//   chalk arrows on posts. world.room.v holds the targets (the controller, 59-room-4-…, sets them whole); every value is damped
//   here, so nothing needs a sequence and nothing is left half done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Local frame (metres): +x to the viewer's right, +z toward the visitor, y up. The board leans back by `tilt`. */
const QC_SET = { x: 0, z: 10.2, yc: 2.4, K: 0.0092, tilt: (58 * Math.PI) / 180, o: [465, 860] };
/** The way to turn at each of the five forks (the visitor's left and right, facing the board), as the left palm's line goes: I izquierda, D derecha. */
const QC_ROUTE = ['I', 'D', 'D', 'I', 'D'];
/** The five inherited things, in the order the chapter names them. */
const QC_THINGS = ['Las bolsitas de residuo que vendía papá', 'Las zapatillas que compartían mi vieja y mi tía', 'La espada de Pepe', 'Los ñoquis de Eva', 'Los vinos de Rolando'];
/** Cover pixels the hotspots and the close looks aim at (and how much each look shows, metres). */
const QC_PX = {
  palma: [352, 815], manos: [540, 800], gotas: [441, 897],
  looks: { palma: { at: [352, 808], w: 1.5, h: 1.75 }, manos: { at: [466, 835], w: 3.5, h: 2.9 }, gotas: { at: [456, 948], w: 2.6, h: 1.9 } },
};
/** The fingertips (the left hand's four fingers and thumb, the right hand's four and thumb), lit one pair per thing held. */
const QC_TIPS = { L: [[317, 712], [335, 688], [357, 680], [372, 685], [422, 763]], R: [[484, 714], [505, 698], [526, 700], [557, 726], [458, 812]] };
/** Where the drag marks fork: station k, and where the right turn at it goes (one step of 0.8 m to the side, 0.32 m toward the board). */
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
  const { THREE, V3 } = ctx, RU = kit.RU, S = QC_SET, lite = ctx.lite, K = S.K, sT = Math.sin(S.tilt), cT = Math.cos(S.tilt);
  const rnd = mulberry32(44);
  const root = new THREE.Group();
  root.position.set(S.x, 0, S.z);
  root.rotation.y = Math.atan2(-S.x, 2.7 - S.z); // the front (+z local) faces the place where the visitor stands
  const grp = (parent = root, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const W3w = 4.2, W2 = 3.0, W1 = 2.0, W0 = 1.4, WC = (lite ? [1.2, 1.5, 2.2, 3.2] : [1.7, 2.3, 3.4, 4.8]); // line widths (CSS px); WC[class], by the thickness of the stroke in the photo (thinner on the lite tier: a phone draws the hands small)
  let segTotal = 0;
  const lines = (rib, o = {}) => { segTotal += rib.count; return kit.lines(rib, o); };

  // ---- the board: cover pixels (x right, y down) → the set's metres; h lifts a point off the board ----
  const P = (px, py, h = 0) => { const X = (px - S.o[0]) * K, Y = -(py - S.o[1]) * K; return [X, S.yc + Y * sT + h * cT, -Y * cT + h * sT]; };
  const NN = [0, cT, sT]; // out of the drawing, toward the visitor
  const NNv = V3(...NN);
  const pen = (seed) => {
    const R = kit.ribbons(seed);
    return {
      R,
      seg: (a, b, w = W1, al = 1, h = 0) => R.seg(P(a[0], a[1], h), P(b[0], b[1], h), w, al),
      poly: (pts, w = W1, al = 1, closed = false, h = 0) => R.poly(pts.map((q) => P(q[0], q[1], h)), w, al, closed),
    };
  };
  const dots = []; // sprite rows: [x, y, z, size, alpha, seed, kind]
  const dot = (x, y, h, sz, al = 0.9) => { const p = P(x, y, h); dots.push([p[0], p[1], p[2], sz, al, rnd(), 0]); };

  // ───────────────────────────── the paper: its edge, a dent and a speck (it does not move) ─────────────────────────────
  const C = pen(7);
  C.poly([[72, 462], [816, 443], [803, 1180], [92, 1190]], 1.6, 0.35, true);
  dot(455, 527, 0, 0.03, 0.7); dot(726, 969, 0, 0.022, 0.8);
  const paperL = lines(C.R, { glow: true }); root.add(paperL.obj);

  // ───────────────────────────── the hands (traced): outline and fingers, palm lines, fur ─────────────────────────────
  const strokes = qcDecode();
  const inPalm = (st) => { const xs = st.pts.map((p) => p[0]), ys = st.pts.map((p) => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2; return st.g === 0 && cx > 318 && cx < 392 && cy > 770 && cy < 872; };
  const hands = [0, 1].map((g) => ({ heavy: pen(10 + g), fine: pen(12 + g), palm: pen(14 + g) }));
  let drawn = 0;
  strokes.forEach((st, i) => {
    if (lite && st.c === 0 && i % 3) return; // the lite tier draws a third of the hairlines
    const h = hands[st.g], to = st.c >= 2 ? h.heavy : inPalm(st) ? h.palm : h.fine;
    to.poly(st.pts, WC[st.c], st.c === 0 ? 0.8 : 1, false, st.c >= 2 ? 0.06 : 0.025);
    drawn++;
  });
  const PIV = [[365, 925], [545, 915]]; // the wrists: where each hand turns
  const handHost = [0, 1].map((g) => { const p = P(PIV[g][0], PIV[g][1], 0); return { host: grp(root, p[0], p[1], p[2]), p }; });
  const handL = hands.map((h, g) => {
    const L = { heavy: lines(h.heavy.R, { glow: true }), fine: lines(h.fine.R, { glow: true }), palm: h.palm.R.count ? lines(h.palm.R, { glow: true }) : { obj: new THREE.Group(), set() {} } }; // (only the left palm's creases are set apart: they are the line that is looked at)
    for (const l of Object.values(L)) { l.obj.position.set(-handHost[g].p[0], -handHost[g].p[1], -handHost[g].p[2]); handHost[g].host.add(l.obj); }
    return L;
  });

  // ───────────────────────────── the three drops: outlines filled with chalk, and a copy of each that falls ─────────────────────────────
  const dropPolys = qcDrops(), dropL = [], ghostL = [], ghostHost = [], dropBase = [];
  const fillHatch = (R2, poly, step, w) => { // horizontal chalk strokes across a polygon (a drop drawn solid)
    const ys = poly.map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let y = y0 + step; y < y1 - 0.6; y += step) {
      const xs = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      if (xs.length >= 2) R2.seg([Math.min(...xs) + 0.5, y], [Math.max(...xs) - 0.5, y], w, 1);
    }
  };
  dropPolys.forEach((poly, i) => {
    const A = pen(20 + i), G = pen(30 + i);
    A.poly(poly, W2, 1, true, 0.04); fillHatch({ seg: (a, b, w, al) => A.seg(a, b, w, al, 0.04) }, poly, lite ? 2.4 : 1.7, W2 + 0.4);
    G.poly(poly, W1, 0.9, true, 0.03); fillHatch({ seg: (a, b, w, al) => G.seg(a, b, w, al, 0.03) }, poly, 3.2, W1);
    const bx = poly.reduce((s, q) => s + q[0], 0) / poly.length, by = Math.min(...poly.map((q) => q[1]));
    dropBase.push([bx, by]);
    dropL.push(lines(A.R, { glow: true })); root.add(dropL[i].obj);
    const gl = lines(G.R, { glow: true }), host = grp(root); host.add(gl.obj); ghostL.push(gl); ghostHost.push(host);
  });
  const dropGlint = kit.points(dropPolys.map((poly, i) => { const q = P(dropBase[i][0], dropBase[i][1] + (Math.max(...poly.map((r) => r[1])) - dropBase[i][1]) * 0.62, 0.07); return [q[0], q[1], q[2], 0.22, 0.7, i * 0.31, 0]; }), { shape: 3, twinkle: 0.95, tint: [0.95, 0.96, 1] });
  root.add(dropGlint.obj);

  // ───────────────────────────── the hand's marks: the left palm's line (five glints that zigzag down it), the fingertips ─────────────────────────────
  const mapRows = QC_ROUTE.map((r, k) => { const q = P(352 + (r === 'I' ? -15 : 15), 787 + k * 17, 0.09); return [q[0], q[1], q[2], 0.2, 0, k * 0.21, 0]; });
  const mapPts = kit.points(mapRows, { shape: 3, twinkle: 0.7, tint: [1, 0.9, 0.62] }); root.add(mapPts.obj);
  const tipRows = (list) => list.map(([x, y], k) => { const q = P(x, y, 0.09); return [q[0], q[1], q[2], 0.34, 0, k * 0.17, 0]; });
  const tipPts = [kit.points(tipRows(QC_TIPS.L), { shape: 3, twinkle: 0.8, tint: [1, 0.93, 0.7] }), kit.points(tipRows(QC_TIPS.R), { shape: 3, twinkle: 0.8, tint: [1, 0.93, 0.7] })];
  tipPts.forEach((tp, g) => handHost[g].host.add(tp.obj)); // (they travel with the hand that closes)
  tipPts.forEach((tp, g) => { for (let k = 0; k < 5; k++) { tp.pos[k * 3] -= handHost[g].p[0]; tp.pos[k * 3 + 1] -= handHost[g].p[1]; tp.pos[k * 3 + 2] -= handHost[g].p[2]; } tp.geo.attributes.position.needsUpdate = true; });

  // ───────────────────────────── 11:11 ─────────────────────────────
  const sig = kit.plane(ctx.canvasTex(256, 96, (c, w, hh) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.font = FONT_DISPLAY(66, '', 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,255,255,.5)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText('11:11', w / 2, hh / 2 + 4); }), 0.55, 0.2, { alpha: 0.8 });
  sig.mesh.position.set(...P(783, 1158, 0.01)); sig.mesh.rotation.x = S.tilt - Math.PI / 2; root.add(sig.mesh);
  const splat = kit.points(dots, { shape: 0, twinkle: 0.3, tint: [0.93, 0.9, 0.82] }); root.add(splat.obj);

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
  ctx.anchors['rm-palma'] = { pos: W3(P(QC_PX.palma[0], QC_PX.palma[1], 0.1)), w: 0.95, h: 1.5 };
  ctx.anchors['rm-manos'] = { pos: W3(P(QC_PX.manos[0], QC_PX.manos[1], 0.1)), w: 1.2, h: 1.5 };
  ctx.anchors['rm-gotas'] = { pos: W3(P(QC_PX.gotas[0], QC_PX.gotas[1], 0.05)), w: 0.8, h: 1.0 };
  tickAt.forEach((t, k) => { ctx.anchors[`rm-ramal-${k}-i`] = { pos: W3(t.c < 0 ? t.d : t.i), w: 0.6, h: 0.8 }; ctx.anchors[`rm-ramal-${k}-d`] = { pos: W3(t.c < 0 ? t.i : t.d), w: 0.6, h: 0.8 }; });
  QC_ROUTE.forEach((_, k) => { ctx.anchors[`rm-cosa-${k}`] = { pos: W3([QC_STN[k + 1][0], 1.0, QC_STN[k + 1][1]]), w: 0.9, h: 1.1 }; });
  const solids = [(() => { const p = W3([0, 0, -0.15]); return { kind: 'box', x: p.x, z: p.z, hw: 3.5, hd: 1.8, ry: root.rotation.y }; })()];

  // ───────────────────────────── camera poses: straight in front of the part of the board that is looked at ─────────────────────────────
  function aim(camL, tgtL, sx, sy, fov, a) {
    root.updateMatrixWorld();
    const cw = root.localToWorld(V3(...camL)), tw = root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return { x: cw.x, y: cw.y, z: cw.z, fov, yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH), pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV) };
  }
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };
  function pose(view, a, free) {
    const look = QC_PX.looks[view];
    if (!look) return null;
    const f = free || { x0: 0.3, y0: 0.1, x1: 0.95, y1: 0.55 }, sx = (f.x0 + f.x1) / 2, sy = (f.y0 + f.y1) / 2, fw = (f.x1 - f.x0) * 0.9, fh = (f.y1 - f.y0) * 0.86, phone = a < 0.8, fov = phone ? 56 : 44;
    const c = P(look.at[0], look.at[1], 0.1), d = fit(look.w, look.h, fw, fh, fov, a);
    return aim([c[0] + NN[0] * d, c[1] + NN[1] * d, c[2] + NN[2] * d], c, sx, sy, fov, a);
  }

  // ───────────────────────────── every frame ─────────────────────────────
  // D holds what is shown: each value follows its target (world.room.v) at its own rate, so a state change is always a smooth one.
  const N = QC_ROUTE.length, zeros = () => Array(N).fill(0);
  const D = { leg: zeros(), fork: zeros(), thing: zeros(), tip: zeros(), curl: zeros(), seen: 0, slow: 0, calm: 0, grip: 0 };
  const st = { T: 0, init: false, drip: [0.1, 0.45, 0.8], tipShown: Array(N).fill(-1) };
  const tmpV = V3(), tmpF = V3(), tmpU = V3(), spinQ = new THREE.Quaternion();
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
      spinQ.setFromAxisAngle(NNv, g === 0 ? -lean : lean); h.quaternion.copy(spinQ);
      h.scale.setScalar(1 + (0.01 * Math.sin(T * 1.7 + g) + 0.02 * D.grip) * (m || 0.3));
      handL[g].fine.set(0.78 + 0.16 * (0.5 + 0.5 * Math.sin(T * 2.3 + g * 2)) * m + 0.06 * D.grip); handL[g].heavy.set(0.95); handL[g].palm.set(0.85 + 0.15 * D.seen * (0.5 + 0.5 * Math.sin(T * 3)) * m);
    }
    paperL.set(0.85);
    // the left palm's line: five glints that zigzag down it once it was looked at; the fingertips light as things are held
    const mp = mapPts.dat; for (let k = 0; k < N; k++) mp[k * 4 + 1] = D.seen * (0.55 + 0.45 * Math.sin(T * 2 + k)) * 0.9; mapPts.geo.attributes.aData.needsUpdate = true;
    for (let g = 0; g < 2; g++) { const td = tipPts[g].dat; for (let k = 0; k < N; k++) td[k * 4 + 1] = D.tip[k] * 0.95; tipPts[g].geo.attributes.aData.needsUpdate = true; }
    // the drops: the ones drawn stay; a copy of each falls from it, slower as the things are held, almost still when it is solved
    for (let i = 0; i < 3; i++) {
      const sp = 0.3 * (1 - 0.86 * D.slow) * (1 - 0.8 * D.calm); st.drip[i] = (st.drip[i] + dt * sp * m) % 1;
      const p = m ? st.drip[i] : 0.45, dy = 34 + p * 120;
      ghostHost[i].position.set(0, -dy * K * sT, dy * K * cT);
      ghostL[i].set(Math.sin(p * Math.PI) * 0.6 * (1 - 0.5 * D.calm)); ghostHost[i].visible = true;
      dropL[i].set(0.92 + 0.08 * Math.sin(T * 1.3 + i) * m);
    }
    dropGlint.set(0.7 + 0.3 * Math.sin(T * 1.9) * m); splat.set(0.85); sig.set(0.8);
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
      const k1 = smooth(0, 0.45, pg), k3 = smooth(0.62, 1, pg), from = root.localToWorld(V3(...P(465, 880, 0.2))), icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : md.clone();
      sheet.mesh.position.lerpVectors(from, md, k1).lerp(icon, k3);
      sheet.mesh.quaternion.copy(cam.quaternion); sheet.mesh.rotateZ(Math.sin(pg * 9) * 0.08 * (1 - k3));
      sheet.mesh.scale.setScalar(Math.max(0.001, k1 * (1 - 0.75 * k3) * 2.6));
      sheet.set(k1 * (1 - smooth(0.85, 1, pg)) * 0.95);
    }
  }

  return {
    root, update, pose,
    solids: () => solids,
    extra: [sheet.mesh],
    info: () => ({ segments: segTotal, lite, strokes: drawn, route: QC_ROUTE.join(''), things: N, drops: dropPolys.length }),
  };
};
