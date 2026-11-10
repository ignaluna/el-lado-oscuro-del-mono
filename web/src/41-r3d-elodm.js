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
  // 1 — En una: the cover, walkable. Its art is a room (49-r3d-room-1-en-una.js) built beside the floor; the floor itself only
  // keeps the title and the water's tint, and a faint light.
  screens(F) {
    F.light(F.V3(F.A.x, 2.2, F.A.z - 1), 0.35, 8);
    return () => {};
  },

  // 2 — ¿Qué te está pasando?: the cover, walkable, a city that is a circuit draining into a hole that never fills. Its art is a
  // room (49-r3d-room-2-que-te-esta-pasando.js) built beside the floor; the floor itself only keeps a faint light.
  machine(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.35, 8);
    return () => {};
  },

  // 3 — El lado oscuro del mono: the cover, walkable, a screaming mouth with a tag coming out of it. Its art is a room
  // (49-r3d-room-3-el-lado-oscuro-del-mono.js) built beside the floor; the floor itself only keeps a faint light.
  bar(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.35, 8);
    return () => {};
  },

  // 4 — ¿Qué carajo?: the cover, walkable, two raised hands and three drops, with a backpack's drag marks on the water. Its art is a
  // room (49-r3d-room-4-que-carajo.js) built beside the floor; the floor itself only keeps a faint light.
  dove(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.35, 8);
    return () => {};
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

  // 8 — No me perdones: the cover, walkable, ripples on dark water with a star and three paper castles in the void. Its art is a room
  // (49-r3d-room-8-no-me-perdones.js) built beside the floor; the floor itself only keeps a faint light.
  void(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.35, 8);
    return () => {};
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
