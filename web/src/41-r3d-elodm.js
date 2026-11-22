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

  // 6 — Explotar: the cover, walkable, a monkey walking on tiles with a DNA strand behind him. Its art is a room
  // (49-r3d-room-5-explotar.js) built beside the floor; the floor itself only keeps a faint light.
  letter(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.25, 8);
    return () => {};
  },

  // 5 — Pato: the cover, walkable, a smug duck smoking with five speech bubbles around him and a house to build. Its art is a room
  // (49-r3d-room-6-pato.js) built beside the floor; the floor itself only keeps a faint light.
  duck(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.25, 8);
    return () => {};
  },

  // 7 — Casi Perdido: the cover, walkable, a monkey with his hand on his temple and his head on fire, with three loading spinners at his sides. Its art is a
  // room (49-r3d-room-7-casi-perdido.js) built beside the floor; the floor itself only keeps a faint light.
  fire(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.25, 8);
    return () => {};
  },

  // 8 — No me perdones: the cover, walkable, ripples on dark water with a star and three paper castles in the void. Its art is a room
  // (49-r3d-room-8-no-me-perdones.js) built beside the floor; the floor itself only keeps a faint light.
  void(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.35, 8);
    return () => {};
  },

  // 9 — Portales: the cover, walkable, a great tree around a vortex with a treehouse, a ladder and a small figure in a glow. Its art is a room
  // (49-r3d-room-9-portales.js) built beside the floor; the floor itself only keeps a faint light.
  tree(F) {
    F.light(F.V3(F.A.x, 2.4, F.A.z - 1), 0.15, 8);
    return () => {};
  },
};
Object.assign(FLOOR_KINDS, ELODM_KINDS);
