// ═══════════════════════════════════════════════════════════════════════════════════════════
// LEVEL SET  (one exploration level standing on the water of a song's world: wall, painting, hatch, box, clue)
//   Everything is drawn in the same pencil-on-paper ink as the rest. The marks that give the order of the
//   combination live on layer 2: only the water's mirror camera renders them, so they exist in the reflection only.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Where the set stands (world metres): the visitor steps out at (0, 1.6, 2.7) looking toward +Z; +X is their left. */
const LEVEL_SET = {
  x: 2.2, z: 8.2,                     // centre of the wall's base
  wall: { w: 1.9, h: 2.3, d: 0.24 },
  hole: { y: 1.4, s: 0.46 },          // niche behind the painting (square, centred at y)
  stones: { y: 0.85, z: 1.0, gap: 0.55, size: 0.26 }, // in front of the wall (local z), left to right
};
/** Visual state the controller animates (0..1 values) and the renderer reads every frame. */
Object.assign(world, { level: { paint: 0, hatch: 0, lid: 0, obj: 0, morph: 0, shake: 0, dials: [0, 0, 0], spin: [0, 0, 0], glow: 0 } });

const LevelArt = {
  /** One symbol of the combination, white chalk on black (for glow materials) or red/green channels (ink maps). */
  symbol(ctx, w, h, id, pal) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const S = w, k = makeChalk(ctx, pal || { op: 'lighter', bg: '#000' }, S, 17 + id.length * 7);
    const lw = 0.045;
    if (id === 'arco') { // the arch of the elevator on the cover
      k.line(0.3 * S, 0.8 * S, 0.3 * S, 0.47 * S, lw, 'g', 2);
      k.line(0.7 * S, 0.8 * S, 0.7 * S, 0.47 * S, lw, 'g', 2);
      k.arc(0.5 * S, 0.47 * S, 0.2 * S, Math.PI, Math.PI * 2, lw, 'g', 2);
    } else if (id === 'dos') { // the two bars of the tympanum
      k.fill(0.31 * S, 0.24 * S, 0.12 * S, 0.54 * S, 0.03, 'g');
      k.fill(0.57 * S, 0.24 * S, 0.12 * S, 0.54 * S, 0.03, 'g');
    } else if (id === 'huella') { // a fingerprint, like the two on the cover
      for (let q = 1; q <= 5; q++) k.arc(0.5 * S, 0.53 * S, q * 0.055 * S, -2.6 + q * 0.12, 1.9 - q * 0.05, 0.026, 'g', 1);
    } else { // 'anillo': a ring
      k.arc(0.5 * S, 0.52 * S, 0.24 * S, 0, Math.PI * 2, lw, 'g', 2);
      k.arc(0.5 * S, 0.52 * S, 0.17 * S, 0, Math.PI * 2, 0.018, 'g', 1);
    }
  },
  /** A rainbow fan, the light the prism breaks into (additive). */
  fan(ctx, w, h) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const a0 = -0.55 + i * 0.16, hue = i / 7;
      const g = ctx.createRadialGradient(w * 0.08, h / 2, 0, w * 0.08, h / 2, w * 0.95);
      const col = `hsla(${Math.round(hue * 300)}, 85%, 62%,`;
      g.addColorStop(0, col + '0.0)'); g.addColorStop(0.15, col + '0.55)'); g.addColorStop(1, col + '0.0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(w * 0.08, h / 2);
      ctx.arc(w * 0.08, h / 2, w * 0.95, a0, a0 + 0.15); ctx.closePath(); ctx.fill();
    }
  },
};

function buildLevel3D(ctx) {
  const { THREE, scene, camera, LU, V3, ink, glowMat, canvasTex, keep, boxGeo, planeGeo, faceUV, flatUV, anchors, disposables } = ctx;
  const ST = LEVEL_SET;
  let cur = null;
  const saved = { pos: V3(), range: 6 };

  function build() {
    const marks = { d: disposables.length, g: ctx.geos.length };
    const root = new THREE.Group();
    root.position.set(ST.x, 0, ST.z);
    root.rotation.y = Math.atan2(-ST.x, 2.7 - ST.z); // the front (+Z local) faces the place where the visitor stands
    scene.add(root);
    const top = new THREE.Group(); // world-space things (the prism and the page leave the wall)
    scene.add(top);
    const mesh = (geo, mat, x, y, z, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

    // ---- the wall, built around the niche ----
    const { w: WW, h: WH, d: WD } = ST.wall, hs = ST.hole.s / 2, hy = ST.hole.y;
    const plaster = ink({ base: '#26221e', engrave: 0.26, freq: 52, axis: 0, rim: 1.0, wobble: 0.2 });
    const inner = ink({ base: '#0e0d0c', engrave: 0.25, freq: 30, axis: 0, rim: 0.4 });
    const slab = (x0, x1, y0, y1, z0 = -WD, z1 = 0, mat = plaster) => mesh(boxGeo(x1 - x0, y1 - y0, z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    slab(-WW / 2, -hs, 0, WH); slab(hs, WW / 2, 0, WH);
    slab(-hs, hs, 0, hy - hs); slab(-hs, hs, hy + hs, WH);
    slab(-hs, hs, hy - hs, hy + hs, -WD, -WD + 0.04, inner); // back of the niche
    // a pencil ledge where the wall meets the water
    mesh(boxGeo(WW + 0.16, 0.08, WD + 0.14), ink({ base: '#1d1a17', engrave: 0.7, freq: 22, axis: 0, rim: 1.1 }), 0, 0.04, -WD / 2);

    // ---- the painting (the cover of the record), hung on one nail ----
    const painting = new THREE.Group(); painting.position.set(0, hy + 0.02, 0.035); root.add(painting);
    const PS = 0.82, FW = 0.05;
    const frameMat = ink({ base: '#33261a', engrave: 0.85, freq: 26, axis: 0, rim: 1.2 });
    for (const [x, y, w, h] of [[0, PS / 2 + FW / 2, PS + FW * 2, FW], [0, -PS / 2 - FW / 2, PS + FW * 2, FW], [-PS / 2 - FW / 2, 0, FW, PS], [PS / 2 + FW / 2, 0, FW, PS]]) mesh(boxGeo(w, h, 0.04), frameMat, x, y, 0, painting);
    const coverImg = new Image(); coverImg.src = ASSETS.cover;
    const coverTex = new THREE.Texture(coverImg); coverImg.onload = () => { coverTex.needsUpdate = true; };
    coverTex.anisotropy = 8;
    const coverMat = new THREE.MeshBasicMaterial({ map: coverTex, color: 0xb9b6ae });
    disposables.push(coverTex, coverMat);
    mesh(planeGeo(PS, PS), coverMat, 0, 0, 0.012, painting);

    // ---- the hatch over the niche, hinged on its left edge ----
    const hatch = new THREE.Group(); hatch.position.set(-hs, hy, 0.006); root.add(hatch);
    const hatchTex = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
      const k = makeChalk(c, PAL3D, w, 23);
      k.rect(w * 0.07, h * 0.07, w * 0.86, h * 0.86, 0.016, 'r', 2);
      for (const [x, y] of [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]]) k.arc(x * w, y * h, w * 0.022, 0, Math.PI * 2, 0.012, 'r', 1);
      k.line(w * 0.78, h * 0.42, w * 0.78, h * 0.58, 0.03, 'g', 2); // the pull
    });
    const hatchGeo = boxGeo(ST.hole.s - 0.01, ST.hole.s - 0.01, 0.022); flatUV(hatchGeo, 0.5, 0.985); faceUV(hatchGeo, 4, 0, 0, 1, 1);
    mesh(hatchGeo, ink({ base: '#4a4030', map: hatchTex, glow: 0.7, engrave: 0.6, freq: 34, axis: 0, rim: 1.0 }), hs, 0, 0.011, hatch);

    // ---- the box in the niche: three dials and a latch ----
    const box = new THREE.Group(); box.position.set(0, hy - hs + 0.02, -0.12); root.add(box);
    const BW = 0.42, BH = 0.15, BD = 0.17;
    const boxMat = ink({ base: '#2c2016', engrave: 0.75, freq: 18, axis: 1, rim: 1.1 });
    mesh(boxGeo(BW, BH, BD), boxMat, 0, BH / 2, 0, box);
    const lid = new THREE.Group(); lid.position.set(0, BH, -BD / 2); box.add(lid);
    mesh(boxGeo(BW + 0.01, 0.045, BD + 0.01), boxMat, 0, 0.0225, BD / 2, lid);
    const symIds = LEVEL.symbols;
    const symTex = Object.fromEntries(symIds.map((id) => [id, canvasTex(192, 192, (c, w, h) => LevelArt.symbol(c, w, h, id))]));
    const dialX = [-0.135, -0.04, 0.055], latchX = 0.155, faceZ = BD / 2 + 0.006;
    const dialMat = ink({ base: '#14110e', engrave: 0.4, freq: 40, axis: 0, rim: 1.4 });
    const ringGeo = keep(new THREE.TorusGeometry(0.036, 0.006, 8, 28));
    const dials = dialX.map((x, i) => {
      const g = new THREE.Group(); g.position.set(x, BH / 2, faceZ); box.add(g);
      mesh(keep(new THREE.CircleGeometry(0.036, 28)), dialMat, 0, 0, 0, g);
      const ring = mesh(ringGeo, ink({ base: '#8a7a5a', engrave: 0.9, freq: 60, axis: 0, rim: 1.2 }), 0, 0, 0.002, g);
      const u = { uTex: { value: symTex[symIds[0]] }, uAlpha: { value: 0.95 }, uReveal: { value: 1 }, uTint: { value: V3(0.95, 0.92, 0.84) } };
      const face = mesh(planeGeo(0.06, 0.06), glowMat(TEXT_FRAG, u), 0, 0, 0.004, g);
      return { g, ring, face, u, shown: -1, i };
    });
    const latch = mesh(boxGeo(0.03, 0.07, 0.03), ink({ base: '#8f8160', engrave: 0.9, freq: 50, axis: 1, rim: 1.3 }), latchX, BH / 2, faceZ + 0.01, box);
    // the prism inside
    const prism = mesh(keep(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 3).rotateZ(Math.PI / 2)), ink({ base: '#3a4048', engrave: 0.3, freq: 8, axis: 0, rim: 2.4, side: THREE.DoubleSide }), 0, 0, 0, top);
    const prismGlowU = { uTint: { value: V3(0.95, 0.93, 0.88) }, uAlpha: { value: 0 }, uStripes: { value: 0 } };
    const prismGlow = mesh(planeGeo(0.5, 0.5), glowMat(HALO_FRAG, prismGlowU), 0, 0, 0, top);
    const fanU = { uTex: { value: canvasTex(256, 128, (c, w, h) => LevelArt.fan(c, w, h)) }, uAlpha: { value: 0 }, uReveal: { value: 1 }, uTint: { value: V3(1, 1, 1) } };
    const fan = mesh(planeGeo(0.6, 0.3), glowMat(TEXT_FRAG, fanU), 0, 0, 0, top);
    const sheetU = { uTex: { value: canvasTex(256, 352, (c, w, h) => BookArt.drawSheet(c, w, h)) }, uAlpha: { value: 0 }, uReveal: { value: 1 }, uTint: { value: V3(0.95, 0.93, 0.86) } };
    const sheet = mesh(planeGeo(0.16, 0.22), glowMat(TEXT_FRAG, sheetU), 0, 0, 0, top);

    // ---- the clue: three stones over the water; their marks exist only in the reflection ----
    const stoneMat = (id) => {
      const tex = canvasTex(192, 192, (c, w, h) => LevelArt.symbol(c, w, h, id, PAL3D));
      return ink({ base: '#2f2b26', map: tex, glow: 0.95, engrave: 0.5, freq: 12, axis: 1, rim: 1.0, wobble: 0.2 });
    };
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf4efe2 });
    disposables.push(dotMat);
    const dotGeo = keep(new THREE.SphereGeometry(0.048, 14, 10));
    const stones = LEVEL.stones.map((id, i) => {
      const g = new THREE.Group();
      g.position.set((i - (LEVEL.stones.length - 1) / 2) * ST.stones.gap, ST.stones.y, ST.stones.z);
      root.add(g);
      const sg = boxGeo(ST.stones.size, ST.stones.size, 0.06); flatUV(sg, 0.5, 0.985); faceUV(sg, 4, 0, 0, 1, 1);
      mesh(sg, stoneMat(id), 0, 0, 0, g);
      const n = LEVEL.solution.indexOf(id) + 1; // its place in the combination: 0 = a decoy, no marks
      for (let k = 0; k < n; k++) {
        const d = mesh(dotGeo, dotMat, (k - (n - 1) / 2) * 0.12, -0.38, 0.02, g);
        d.layers.set(2);
      }
      return { g, base: g.position.clone(), ph: i * 1.9, n };
    });

    // ---- anchors (world space) for the hotspots ----
    root.updateMatrixWorld(true);
    const W = (x, y, z) => root.localToWorld(V3(x, y, z));
    const boxW = (x, y, z) => { box.updateMatrixWorld(true); return box.localToWorld(V3(x, y, z)); };
    anchors['lv-wall'] = { pos: W(0, 1.45, 0.1), w: 1.7, h: 2.2 };
    anchors['lv-painting'] = { pos: W(0, hy, 0.06), w: PS + 0.1, h: PS + 0.1 };
    anchors['lv-hatch'] = { pos: W(0, hy, 0.03), w: ST.hole.s, h: ST.hole.s };
    anchors['lv-box'] = { pos: boxW(0, BH / 2, BD / 2), w: BW, h: BH + 0.08 };
    dials.forEach((d, i) => { anchors['lv-dial-' + i] = { pos: boxW(dialX[i], BH / 2, faceZ + 0.01), w: 0.08, h: 0.08 }; });
    anchors['lv-latch'] = { pos: boxW(latchX, BH / 2, faceZ + 0.02), w: 0.055, h: 0.1 };
    const objRest = boxW(0, BH + 0.02, 0);
    anchors['lv-object'] = { pos: objRest.clone().add(V3(0, 0.1, 0)), w: 0.2, h: 0.2 };
    anchors['lv-stones'] = { pos: W(0, ST.stones.y, ST.stones.z), w: ST.stones.gap * 2 + ST.stones.size + 0.1, h: ST.stones.size + 0.2 };

    saved.pos.copy(LU.uPPos.value[0]); saved.range = LU.uPRange.value[0];
    const lightAt = W(0.3, 2.1, 1.5);
    // what the visitor bumps into when walking (world space)
    const wc = W(0, 0, -WD / 2);
    const solids = [{ kind: 'box', x: wc.x, z: wc.z, hw: WW / 2 + 0.08, hd: WD / 2 + 0.07, ry: root.rotation.y },
      ...stones.map((s) => { const p = W(s.base.x, 0, s.base.z); return { kind: 'circle', x: p.x, z: p.z, r: ST.stones.size * 0.62 }; })];
    return { root, top, painting, hatch, lid, latch, dials, prism, prismGlow, prismGlowU, fan, fanU, sheet, sheetU, stones, symTex, objRest, lightAt, marks, solids };
  }

  function destroy() {
    if (!cur) return;
    scene.remove(cur.root); scene.remove(cur.top);
    for (let i = cur.marks.d; i < disposables.length; i++) disposables[i].dispose && disposables[i].dispose();
    disposables.length = cur.marks.d;
    for (let i = cur.marks.g; i < ctx.geos.length; i++) ctx.geos[i].dispose();
    ctx.geos.length = cur.marks.g;
    for (const k of Object.keys(anchors)) if (k.startsWith('lv-')) delete anchors[k];
    LU.uPPos.value[0].copy(saved.pos); LU.uPRange.value[0] = saved.range;
    cur = null;
  }

  const tmp = { f: V3(), u: V3(), r: V3(), a: V3(), b: V3() };
  ctx.updaters.push((dt, t) => {
    if (!cur) return;
    const L = world.level, c = cur;
    // a lamp for the wall (light 0 is the countdown's, unused away from the entrance)
    LU.uPPos.value[0].copy(c.lightAt); LU.uPRange.value[0] = 5.2;
    LU.uPCol.value[0].set(0.95, 0.9, 0.8).multiplyScalar(0.62 + 0.25 * L.glow);
    // painting slides aside on its nail; hatch swings out; lid lifts
    c.painting.position.x = 0.95 * L.paint; c.painting.rotation.z = 0.05 * (1 - L.paint) - 0.13 * L.paint + Math.sin(L.paint * Math.PI) * 0.08; // hung crooked
    c.painting.position.z = 0.035 + 0.05 * Math.sin(L.paint * Math.PI);
    c.hatch.rotation.y = -1.85 * L.hatch;
    c.lid.rotation.x = -1.45 * L.lid;
    c.latch.position.x = 0.155 + Math.sin(t * 60) * 0.004 * L.shake;
    // dials: a quarter turn of the ring, the symbol flips at mid-turn
    c.dials.forEach((d, i) => {
      const want = L.dials[i] % LEVEL.symbols.length;
      if (d.shown !== want && (L.spin[i] === 0 || L.spin[i] >= 0.5)) { d.shown = want; d.u.uTex.value = c.symTex[LEVEL.symbols[want]]; }
      d.ring.rotation.z = -L.spin[i] * Math.PI / 2;
      d.face.scale.x = Math.max(0.05, Math.abs(Math.cos(L.spin[i] * Math.PI)));
    });
    // the stones bob; their marks (layer 2) bob with them
    c.stones.forEach((s) => { s.g.position.y = s.base.y + Math.sin(t * 0.8 + s.ph) * 0.025; s.g.rotation.z = Math.sin(t * 0.5 + s.ph) * 0.05; });
    // the prism: hidden in the closed box, rises when the lid opens, becomes a page when taken
    camera.updateMatrixWorld();
    tmp.f.set(0, 0, -1).applyQuaternion(camera.quaternion); tmp.u.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const m = L.morph;
    const rest = tmp.a.copy(c.objRest).add(V3(0, 0.09 * L.obj + Math.sin(t * 1.3) * 0.01 * L.obj, 0));
    const mid = tmp.b.copy(camera.position).addScaledVector(tmp.f, 0.62).addScaledVector(tmp.u, 0.02);
    c.prism.visible = L.obj > 0.01 && m < 0.62;
    const k1 = smooth(0, 0.35, m), k2 = smooth(0.35, 0.62, m), k3 = smooth(0.62, 1, m);
    c.prism.position.lerpVectors(rest, mid, k1);
    c.prism.rotation.set(t * 0.6, t * (0.9 + 4 * k1), 0.3);
    c.prism.scale.setScalar(1 - k2);
    c.prismGlow.position.copy(c.prism.position); c.prismGlow.quaternion.copy(camera.quaternion);
    c.prismGlowU.uAlpha.value = (L.obj * (0.5 + 0.2 * Math.sin(t * 2.2)) + k1 * 0.6) * (1 - k2);
    c.fan.visible = m > 0.05 && m < 0.95;
    c.fan.position.copy(mid).addScaledVector(tmp.f, 0.05); c.fan.quaternion.copy(camera.quaternion);
    c.fan.scale.setScalar(0.4 + 1.2 * k1);
    c.fanU.uAlpha.value = Math.sin(Math.min(1, m / 0.75) * Math.PI) * 0.9;
    c.sheet.visible = m > 0.34;
    const icon = ctx.bookIconPoint ? ctx.bookIconPoint(0.62) : mid;
    c.sheet.position.lerpVectors(mid, icon, k3);
    c.sheet.quaternion.copy(camera.quaternion);
    c.sheet.rotateZ(Math.sin(m * 9) * 0.08 * (1 - k3));
    c.sheet.scale.setScalar(Math.max(0.001, k2 * (1 - 0.75 * k3)));
    c.sheetU.uAlpha.value = k2 * (1 - smooth(0.85, 1, m)) * 0.95;
  });

  /** Camera pose that looks from a point to a target (both in the set's frame), the target landing at screen (sx, sy). */
  function aim(camL, tgtL, sx, sy, fov, a) {
    cur.root.updateMatrixWorld(true);
    const cw = cur.root.localToWorld(V3(...camL)), tw = cur.root.localToWorld(V3(...tgtL));
    const dx = tw.x - cw.x, dy = tw.y - cw.y, dz = tw.z - cw.z;
    const tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    return {
      x: cw.x, y: cw.y, z: cw.z, fov,
      yaw: Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH),
      pitch: Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV),
    };
  }
  /** Distance at which a w × h region fills the given fractions of the view. */
  const fit = (w, h, fw, fh, fov, a) => { const tv = 2 * Math.tan((fov * Math.PI) / 360); return Math.max(h / (fh * tv), w / (fw * tv * a)); };

  return {
    set(on) { destroy(); if (on) cur = build(); },
    built: () => !!cur,
    solids: () => (cur ? cur.solids : []),
    /** Inspect poses. Phones keep their docked player below: targets sit in the upper part of the screen. */
    pose(view, a) {
      if (!cur) return null;
      // phones upright: above the docked player; a phone lying down: the left part, clear of the corner player
      const phone = a < 0.8, short = !phone && window.innerHeight < 520;
      const sx = phone ? 0.5 : short ? 0.3 : 0.42, sy = phone ? 0.34 : short ? 0.46 : 0.45, hy = ST.hole.y;
      if (view === 'wall') { const fov = phone ? 60 : 46; const d = fit(1.05, 1.05, phone ? 0.86 : short ? 0.42 : 0.6, phone ? 0.5 : short ? 0.72 : 0.56, fov, a); return aim([0, 1.56, d], [0, hy, 0], sx, sy, fov, a); }
      if (view === 'box') { const fov = phone ? 58 : 44; const d = fit(0.46, 0.26, phone ? 0.84 : short ? 0.44 : 0.4, phone ? 0.3 : short ? 0.5 : 0.4, fov, a); return aim([0, hy - 0.05 + d * 0.12, -0.12 + 0.085 + d], [0, hy - 0.16, -0.04], sx, sy, fov, a); }
      if (view === 'stones') { const fov = phone ? 60 : 52; const dz = phone ? 3.0 : 2.4; return aim([0, 1.65, ST.stones.z + dz], [0, phone ? 0.28 : 0.05, ST.stones.z], short ? 0.32 : sx, phone ? 0.37 : 0.47, fov, a); }
      return null;
    },
    /** For the checks: how many marks each stone shows in the water, left to right. */
    info() { return cur ? { marks: cur.stones.map((s) => s.n), layer2: cur.stones.every((s) => s.g.children.slice(1).every((d) => d.layers.mask === 4)) } : null; },
  };
}
