// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE RECORD'S WORLDS  (floors 1–9 of El Lado Oscuro del Mono: each one stages its cover element)
//   The element stands in the free side of the screen (beside the player on wide screens, above it on phones) and is
//   the way into the floor's challenge (hotspot "tr-element"). world.trial tells the scenery how far the visitor got:
//   progress 0..1 while playing, solved 0..1 once the chapter came out. Drawn with lines and light, like the others,
//   until Luján's illustrations exist (COVER_ELEMENTS[].art is shown in the challenge plate, not here).
// ═══════════════════════════════════════════════════════════════════════════════════════════
Object.assign(FLOOR_ALIGN, { screens: 'left', machine: 'left', bar: 'left', dove: 'left', letter: 'left', duck: 'left', fire: 'left', void: 'left', tree: 'left' });
Object.assign(world, { trial: { progress: 0, solved: 0, step: 0 } });

/** Where the element stands and how big it is (world units), plus its hotspot. */
function elementSpot(F, ctx, frac = 0.34) {
  const A = F.A, r = A.rect, W = ctx.W, H = ctx.H, dz = -2.2;
  let sx = 0.5, sy = 0.5, f = frac;
  const roomL = r.x / W, roomR = 1 - (r.x + r.w) / W;
  if (A.phone || Math.max(roomL, roomR) < 0.2) { // above the docked player, under the title
    const top = A.phone ? 0.29 : 0.2, bottom = r.y / H - 0.02;
    sy = (top + bottom) / 2; f = Math.min(frac, Math.max(0.12, (bottom - top) * 0.92));
    if (A.phone) sx = 0.58; // a little to the right: the lower left is where the thumb walks (the joystick)
  } else {
    const room = Math.max(roomL, roomR);
    sx = roomR >= roomL ? 1 - roomR / 2 : roomL / 2; sy = 0.56;
    f = Math.min(frac, (room * W) / H * 0.82);
  }
  const pos = A.at(sx, sy, dz), s = A.size(f, dz);
  ctx.anchors['tr-element'] = { pos: pos.clone(), w: s * (A.phone ? 0.62 : 0.8), h: s * 0.9 }; // its silhouette: the thumb that walks (lower left) stays free
  return { pos, s };
}
/** A closed polyline from [x, y] pairs (element units: s = 1), placed at `o`. */
function shape(F, o, s, pts, mat, closed = true, z = 0) {
  return F.line(pts.map(([x, y]) => F.V3(o.x + x * s, o.y + y * s, o.z + z * s)), mat, closed);
}

const ELODM_KINDS = {
  // 1 — En una: screens of automatisms around a column of smoke; the mirror in the middle keeps the mono
  screens(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    const screens = [[-0.36, 0.12, 0.28], [0.36, 0.1, 0.28], [0, -0.3, 0.22], [0, 0.16, 0.42]].map(([x, y, w], i) => {
      const glow = F.mesh(new THREE.PlaneGeometry(w * s, w * s * 0.66), F.basic(i === 3 ? [0.9, 0.86, 0.78] : F.accent, 0.12, { side: THREE.DoubleSide }), o.x + x * s, o.y + y * s, o.z + (i === 3 ? 0.1 : 0) * s);
      const h2 = w * 0.33;
      shape(F, { x: o.x + x * s, y: o.y + y * s, z: o.z }, s, [[-w / 2, -h2], [w / 2, -h2], [w / 2, h2], [-w / 2, h2]], F.lineMat(i === 3 ? [0.95, 0.92, 0.84] : F.accent, 0.8));
      return glow;
    });
    const smoke = F.particles(160, { mode: 0, box: [s * 0.16, s * 1.3, s * 0.16], origin: F.V3(o.x, o.y - s * 0.65, o.z + s * 0.2), size: 11, alpha: 0.4, speed: 0.12, tint: [0.8, 0.82, 0.86] });
    F.light(F.V3(o.x, o.y + s * 0.4, o.z - 1), 0.7, s * 6);
    return (dt, t) => {
      const tr = world.trial, off = Math.max(tr.solved, tr.progress);
      smoke.u.uPhase.value += dt * smoke.speed * 4;
      screens.forEach((m, i) => {
        if (i === 3) { m.material.opacity = 0.1 + 0.4 * tr.solved + 0.05 * Math.sin(t * 1.3); return; }
        const flick = 0.5 + 0.5 * Math.sin(t * (7 + i * 3) + i) * Math.sin(t * 2.3 + i);
        m.material.opacity = (0.08 + 0.14 * flick) * (1 - off * (tr.step > i ? 1 : 0.4));
      });
    };
  },

  // 2 — ¿Qué te está pasando?: a machine pours into a hole that never fills
  machine(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    const rings = [0.42, 0.33, 0.24, 0.15].map((r) => { const l = F.line(F.circle(r * s, 72).map((p) => F.V3(o.x + p.x, o.y - s * 0.18 + p.y * 0.35, o.z + p.y)), F.lineMat(F.accent, 0.6), true); return l; });
    const chutes = [-0.42, -0.14, 0.14, 0.42].map((x) => shape(F, o, s, [[x, 0.55], [x * 0.35, -0.1]], F.lineMat([0.9, 0.86, 0.78], 0.55), false));
    const fall = F.particles(200, { mode: 1, box: [s * 0.8, s * 0.75, s * 0.2], origin: F.V3(o.x, o.y - s * 0.15, o.z), size: 10, alpha: 0.55, speed: 0.25, tint: [0.95, 0.88, 0.7] });
    F.light(F.V3(o.x, o.y + s * 0.5, o.z - 1), 0.6, s * 6);
    return (dt, t) => {
      const tr = world.trial, flow = 1 - Math.max(tr.solved, tr.progress);
      fall.u.uPhase.value += dt * fall.speed * 4 * flow;
      fall.u.uAlpha.value = 0.5 * flow;
      rings.forEach((l, i) => { l.rotation.z = 0; l.material.opacity = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * (1 + flow * 2) - i * 0.8)); });
      chutes.forEach((l) => { l.material.opacity = 0.15 + 0.4 * flow; });
    };
  },

  // 3 — El lado oscuro del mono: a corner of a bar (a scenic interpretation of Keller) — counter, lamp, a broken glass
  bar(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    const wood = F.lineMat([0.86, 0.62, 0.42], 0.7);
    shape(F, o, s, [[-0.55, -0.22], [0.55, -0.22]], wood, false);
    shape(F, o, s, [[-0.55, -0.3], [0.55, -0.3]], wood, false);
    shape(F, o, s, [[-0.45, -0.3], [-0.45, -0.55]], wood, false); shape(F, o, s, [[0.45, -0.3], [0.45, -0.55]], wood, false);
    shape(F, o, s, [[0.05, 0.55], [0.05, 0.3], [-0.05, 0.3], [0.05, 0.3], [0.15, 0.22], [-0.05, 0.22], [0.05, 0.3]], F.lineMat([0.95, 0.85, 0.65], 0.7), false);
    const lamp = F.mesh(new THREE.CircleGeometry(s * 0.09, 24), F.basic([1, 0.78, 0.5], 0.4, { side: THREE.DoubleSide }), o.x + 0.05 * s, o.y + 0.2 * s, o.z);
    const glass = shape(F, o, s, [[-0.08, -0.22], [-0.1, 0.02], [0.1, 0.02], [0.08, -0.22]], F.lineMat([0.92, 0.9, 0.86], 0.85));
    const shards = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * TAU, rr = 0.2 + (i % 3) * 0.06;
      const m = shape(F, { x: o.x + Math.cos(a) * rr * s, y: o.y - 0.24 * s, z: o.z + Math.sin(a) * rr * s * 0.6 }, s, [[0, 0], [0.04, 0.012], [0.015, 0.035]], F.lineMat([0.92, 0.9, 0.86], 0.8));
      return { m, a, rr };
    });
    F.light(F.V3(o.x, o.y + s * 0.2, o.z - 0.8), 0.9, s * 5);
    return (dt, t) => {
      const tr = world.trial, k = Math.max(tr.solved, tr.progress * 0.5);
      lamp.material.opacity = 0.25 + 0.2 * tr.solved + 0.05 * Math.sin(t * 9) * (1 - tr.solved);
      glass.material.opacity = 0.3 + 0.6 * tr.solved;
      for (const sh of shards) { const r = sh.rr * (1 - tr.solved); sh.m.position.set((Math.cos(sh.a) * r - Math.cos(sh.a) * sh.rr) * s, 0, (Math.sin(sh.a) * r - Math.sin(sh.a) * sh.rr) * s * 0.6); sh.m.material.opacity = 0.8 * (1 - k * 0.6); }
    };
  },

  // 4 — ¿Qué carajo?: a dove that does not land while everything rushes; a backpack full of other people's things
  dove(F, ctx) {
    const { pos: o, s } = elementSpot(F, ctx);
    const white = F.lineMat([0.96, 0.95, 0.92], 0.9);
    shape(F, o, s, [[-0.25, -0.55], [0.25, -0.55], [0.3, -0.2], [0.18, -0.08], [-0.18, -0.08], [-0.3, -0.2]], F.lineMat(F.accent, 0.7));
    shape(F, o, s, [[-0.12, -0.08], [-0.1, 0.02], [0.1, 0.02], [0.12, -0.08]], F.lineMat(F.accent, 0.5), false);
    const bird = new ctx.THREE.Group(); F.group.add(bird);
    const body = F.line([[-0.12, 0], [0.02, 0.04], [0.12, 0.03], [0.16, 0.06], [0.12, 0], [-0.04, -0.03], [-0.12, 0]].map(([x, y]) => F.V3(x * s, y * s, 0)), white, false);
    const wingL = F.line([[0, 0.02], [-0.06, 0.18], [-0.14, 0.22]].map(([x, y]) => F.V3(x * s, y * s, 0)), white, false);
    const wingR = F.line([[0.02, 0.02], [0.05, 0.16], [0.0, 0.22]].map(([x, y]) => F.V3(x * s, y * s, 0.02 * s)), white, false);
    for (const l of [body, wingL, wingR]) { F.group.remove(l); bird.add(l); }
    F.light(F.V3(o.x, o.y + s * 0.4, o.z - 1), 0.7, s * 6);
    let ph = 0;
    return (dt, t) => {
      const tr = world.trial, calm = Math.max(tr.solved, tr.progress * 0.7);
      ph += dt * (1 - calm * 0.85);
      const rad = s * 0.42 * (1 - calm), land = F.V3(o.x, o.y - 0.08 * s + 0.04 * s, o.z);
      bird.position.set(land.x + Math.cos(ph * 1.6) * rad, land.y + s * 0.35 * (1 - calm) + Math.sin(ph * 2.3) * rad * 0.3, land.z + Math.sin(ph * 1.6) * rad * 0.5);
      const flap = Math.sin(t * 14) * (1 - tr.solved);
      wingL.rotation.x = flap * 0.9; wingR.rotation.x = -flap * 0.9;
    };
  },

  // 5 — Explotar: a letter under pressure, wrapped in dark threads (what was inherited without choosing)
  letter(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    shape(F, o, s, [[-0.3, -0.4], [0.3, -0.4], [0.3, 0.4], [-0.3, 0.4]], F.lineMat([0.94, 0.9, 0.82], 0.8));
    for (let i = 0; i < 8; i++) shape(F, o, s, [[-0.22, 0.3 - i * 0.08], [0.22 - (i % 3) * 0.06, 0.3 - i * 0.08]], F.lineMat([0.94, 0.9, 0.82], 0.35), false);
    const threads = Array.from({ length: 5 }, (_, i) => {
      const pts = []; for (let k = 0; k <= 40; k++) { const a = (k / 40) * TAU * 1.5 + i; pts.push([Math.cos(a) * (0.32 + 0.06 * Math.sin(a * 3 + i)), Math.sin(a * 0.9 + i) * 0.45]); }
      return shape(F, o, s, pts, F.lineMat(F.accent, 0.55), false, 0.05);
    });
    const steam = F.particles(140, { mode: 0, box: [s * 0.6, s * 1.4, s * 0.3], origin: F.V3(o.x, o.y + s * 0.2, o.z), size: 12, alpha: 0, speed: 0.2, tint: [0.95, 0.92, 0.86], soft: 1 });
    F.light(F.V3(o.x, o.y, o.z - 1), 0.7, s * 5);
    return (dt, t) => {
      const tr = world.trial;
      threads.forEach((l, i) => { l.material.opacity = 0.55 * (1 - tr.solved); l.rotation.z = Math.sin(t * 0.6 + i) * 0.04 * (1 - tr.solved); const pulse = 1 + 0.03 * Math.sin(t * 3 + i) * (1 - tr.solved); l.scale.set(pulse, pulse, 1); });
      steam.u.uPhase.value += dt * steam.speed * 4; steam.u.uAlpha.value = 0.55 * tr.solved;
    };
  },

  // 6 — Pato: a duck on the water beside a house that is built in turns
  duck(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    const duck = new THREE.Group(); F.group.add(duck);
    const yellow = F.lineMat([0.96, 0.84, 0.45], 0.9);
    const dl = F.line([[-0.2, 0], [0.12, 0], [0.18, 0.06], [0.1, 0.1], [0.1, 0.2], [0.16, 0.26], [0.24, 0.24], [0.16, 0.2], [0.1, 0.12], [-0.08, 0.12], [-0.2, 0.06], [-0.2, 0]].map(([x, y]) => F.V3(x * s, y * s, 0)), yellow, true);
    F.group.remove(dl); duck.add(dl);
    duck.position.set(o.x - 0.3 * s, Math.max(0.02, o.y - 0.5 * s), o.z);
    const bricks = [];
    for (let row = 0; row < 3; row++) for (let c = 0; c < (row === 2 ? 1 : 3); c++) {
      const x = 0.12 + c * 0.14 + (row === 2 ? 0.14 : 0), y = -0.45 + row * 0.12;
      bricks.push(shape(F, o, s, [[x - 0.06, y - 0.05], [x + 0.06, y - 0.05], [x + 0.06, y + 0.05], [x - 0.06, y + 0.05]], F.lineMat(F.accent, 0.8)));
    }
    const roof = shape(F, o, s, [[0.04, -0.12], [0.26, 0.08], [0.48, -0.12]], F.lineMat(F.accent, 0.8), false);
    const fire = F.mesh(new THREE.CircleGeometry(s * 0.05, 16), F.basic([1, 0.6, 0.3], 0, { side: THREE.DoubleSide }), o.x + 0.26 * s, o.y - 0.42 * s, o.z - 0.02 * s);
    F.light(F.V3(o.x, o.y, o.z - 1), 0.7, s * 5);
    return (dt, t) => {
      const tr = world.trial, built = Math.max(tr.solved, tr.progress);
      duck.position.y = Math.max(0.02, o.y - 0.5 * s) + Math.sin(t * 1.4) * 0.02 * s;
      duck.position.x = o.x - (0.3 - 0.12 * tr.solved) * s;
      bricks.forEach((b, i) => { b.material.opacity = built * bricks.length > i ? 0.85 : 0.08; });
      roof.material.opacity = tr.solved ? 0.85 : 0.08;
      fire.material.opacity = tr.solved * (0.55 + 0.2 * Math.sin(t * 8));
    };
  },

  // 7 — Casi Perdido: a hearth with weak embers
  fire(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    shape(F, o, s, [[-0.4, -0.5], [-0.4, 0.1], [-0.25, 0.3], [0.25, 0.3], [0.4, 0.1], [0.4, -0.5]], F.lineMat([0.9, 0.82, 0.72], 0.6), false);
    shape(F, o, s, [[-0.25, -0.42], [0.25, -0.42]], F.lineMat([0.7, 0.45, 0.3], 0.8), false);
    const flames = F.particles(220, { mode: 0, box: [s * 0.4, s * 0.55, s * 0.15], origin: F.V3(o.x, o.y - s * 0.45, o.z), size: 14, alpha: 0.4, speed: 0.3, tint: [1, 0.62, 0.3], soft: 1 });
    const glow = F.mesh(new THREE.CircleGeometry(s * 0.3, 32), F.basic([1, 0.55, 0.25], 0.08, { side: THREE.DoubleSide }), o.x, o.y - s * 0.3, o.z + 0.05 * s);
    F.light(F.V3(o.x, o.y - s * 0.2, o.z - 0.8), 0.5, s * 5);
    return (dt, t) => {
      const tr = world.trial, heat = 0.25 + 0.45 * tr.progress + 0.3 * tr.solved;
      flames.u.uPhase.value += dt * flames.speed * 4 * (0.5 + heat);
      flames.u.uAlpha.value = 0.15 + 0.6 * heat;
      flames.u.uBox.value.y = s * (0.25 + 0.6 * heat);
      glow.material.opacity = 0.05 + 0.2 * heat + 0.04 * Math.sin(t * 5);
      F.lightK = 0.3 + 0.9 * heat;
    };
  },

  // 8 — No me perdones: paper castles floating in a void; a glass of water that trembles
  void(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx);
    const paper = F.lineMat([0.92, 0.92, 0.95], 0.75);
    const castles = [-0.34, 0, 0.34].map((x, i) => {
      const g = new THREE.Group(); F.group.add(g);
      const l = F.line([[-0.1, 0], [-0.1, 0.16], [-0.04, 0.24], [0, 0.16], [0.04, 0.24], [0.1, 0.16], [0.1, 0], [-0.1, 0]].map(([a, b]) => F.V3(a * s, b * s, 0)), paper, false);
      F.group.remove(l); g.add(l);
      g.position.set(o.x + x * s, o.y + (0.12 - Math.abs(x) * 0.3) * s, o.z + i * 0.05 * s);
      return g;
    });
    const path = [0, 1, 2, 3].map((i) => shape(F, { x: o.x, y: o.y - 0.42 * s, z: o.z - (0.25 - i * 0.22) * s }, s, [[-0.09, 0], [0.09, 0], [0.09, 0.001], [-0.09, 0.001]], F.lineMat([0.92, 0.92, 0.95], 0)));
    const glass = new THREE.Group(); F.group.add(glass);
    const gl = F.line([[-0.06, 0], [-0.07, 0.18], [0.07, 0.18], [0.06, 0], [-0.06, 0]].map(([a, b]) => F.V3(a * s, b * s, 0)), F.lineMat([0.86, 0.9, 1], 0.85), false);
    const wl = F.line([[-0.065, 0.12], [0.065, 0.12]].map(([a, b]) => F.V3(a * s, b * s, 0)), F.lineMat(F.accent, 0.9), false);
    for (const l of [gl, wl]) { F.group.remove(l); glass.add(l); }
    glass.position.set(o.x, o.y - 0.36 * s, o.z + 0.5 * s);
    const dust = F.particles(140, { mode: 2, box: [s, s * 0.8, s], radius: s * 0.7, origin: F.V3(o.x, o.y, o.z + 0.3 * s), size: 9, alpha: 0.3, speed: 0.05, tint: [0.75, 0.78, 0.9] });
    F.light(F.V3(o.x, o.y, o.z - 1), 0.5, s * 5);
    return (dt, t) => {
      const tr = world.trial, flat = Math.max(tr.solved, tr.progress);
      dust.u.uPhase.value += dt * dust.speed * 4;
      castles.forEach((g, i) => { g.scale.y = Math.max(0.05, 1 - flat * 1.2 + i * 0.1 * flat); g.rotation.z = Math.sin(t * 0.5 + i) * 0.05; });
      path.forEach((l, i) => { l.material.opacity = flat > i / 4 ? 0.7 : 0; });
      const shake = (1 - tr.solved) * (0.6 + 0.4 * Math.sin(t * 0.9)) * 0.012 * s;
      glass.position.x = o.x + Math.sin(t * 31) * shake; wl.rotation.z = Math.sin(t * 23) * 0.12 * (1 - tr.solved);
    };
  },

  // 9 — Portales: a big tree whose roots reach the neighbourhood; a portal opens in the trunk
  tree(F, ctx) {
    const { THREE } = ctx, { pos: o, s } = elementSpot(F, ctx, 0.42);
    const bark = F.lineMat([0.8, 0.86, 0.72], 0.8);
    shape(F, o, s, [[-0.08, -0.55], [-0.06, 0.05], [0.06, 0.05], [0.08, -0.55]], bark, false);
    const rnd = mulberry32(9);
    const branch = (x, y, a, len, d) => {
      if (d === 0) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      shape(F, o, s, [[x, y], [x2, y2]], F.lineMat([0.8, 0.86, 0.72], 0.35 + d * 0.12), false);
      branch(x2, y2, a + 0.45 + rnd() * 0.2, len * 0.72, d - 1); branch(x2, y2, a - 0.45 - rnd() * 0.2, len * 0.72, d - 1);
    };
    branch(0, 0.05, Math.PI / 2, 0.18, 5);
    const roots = [-0.5, -0.25, 0.25, 0.5].map((x) => shape(F, o, s, [[x * 0.15, -0.55], [x * 0.6, -0.6], [x, -0.62]], F.lineMat(F.accent, 0.25), false));
    const portal = F.mesh(new THREE.RingGeometry(s * 0.05, s * 0.065, 40), F.basic([0.95, 0.95, 1], 0, { side: THREE.DoubleSide }), o.x, o.y - 0.3 * s, o.z - 0.03 * s);
    portal.scale.y = 1.6;
    const leaves = F.particles(160, { mode: 1, box: [s * 0.9, s * 0.8, s * 0.4], origin: F.V3(o.x, o.y - s * 0.2, o.z), size: 9, alpha: 0.35, speed: 0.06, tint: [0.7, 0.85, 0.6] });
    F.light(F.V3(o.x, o.y + s * 0.3, o.z - 1), 0.7, s * 6);
    return (dt, t) => {
      const tr = world.trial;
      leaves.u.uPhase.value += dt * leaves.speed * 4;
      roots.forEach((l, i) => { l.material.opacity = 0.2 + 0.7 * (tr.progress * roots.length > i ? 1 : 0) + 0.1 * Math.sin(t * 2 + i); });
      portal.material.opacity = tr.solved * (0.7 + 0.2 * Math.sin(t * 2));
      const k = 1 + tr.solved * (0.4 + 0.05 * Math.sin(t * 1.5)); portal.scale.set(k, 1.6 * k, 1);
    };
  },
};
Object.assign(FLOOR_KINDS, ELODM_KINDS);
