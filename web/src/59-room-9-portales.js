// Floor 9 · «Portales» · chapter 9 · the great tree: the cover is a tree whose two trunks arch around a vortex, walkable, and an escape-room in it.
//   1. The four roots. Walk the tree's roots (they reach toward you along the ground). At each one you choose what to leave: PERRO, GUITARRA,
//      VECINOS or RISA, the things the chapter says stay. ESCENARIO, LUCES and PÚBLICO are what it no longer needs: the root pulls back.
//   2. The treehouse. A ladder rises from the canopy; climb it and look out of the round window: three spirals, each with a sparkle, gold (it
//      turns clockwise, to the right) or silver (counter-clockwise, to the left). The answer is said on screen too.
//   3. The spirals. Turn the three spirals (the left trunk's, the centre's, the right trunk's) the way their sparkles said; the vortex opens.
//   4. The ending. Step into the glow of the small figure at the bottom: the camera crosses the portal and comes back to where you stood,
//      facing the figure. "Siempre te llevan de vuelta a vos." The page and chapter 9 come out, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['portales'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  aim: { x: PT_SET.x, y: PT_SET.y, z: PT_SET.z, sx: 0.46, sy: 0.5 },
  intro: 'Un árbol enorme alrededor de un vórtice. Sus raíces bajan hacia vos y, entre ellas, un chico parado en un resplandor.',
  clue: 'quiero creer que algo mío va a quedar acá: en la raíz de un árbol, en el ladrido de un perro, en el eco suave de una guitarra que todavía suena.\nAcá lo invisible se nota: en cómo los vecinos se saludan, en la risa compartida sin motivo.',
  done: 'Los portales no desaparecen. Se transforman. Pero siempre te llevan de vuelta a vos.',
  labels: { perro: 'PERRO', guitarra: 'GUITARRA', vecinos: 'VECINOS', risa: 'RISA', escenario: 'ESCENARIO', luces: 'LUCES', publico: 'PÚBLICO' },
  order: ['perro', 'escenario', 'guitarra', 'luces', 'vecinos', 'publico', 'risa'], // (the things and the decoys, mixed)
  where: ['a la izquierda, lejos', 'a la izquierda, con laberintos', 'a la derecha, cerca', 'a la derecha, lejos'],
  hints: [
    [ // 0 · the roots
      'El árbol tiene cuatro raíces que bajan hasta el suelo. En cada una se puede dejar algo.',
      'El capítulo dice qué quiere que quede: la raíz de un árbol, el ladrido de un perro, el eco de una guitarra, los vecinos que se saludan, la risa compartida. Escenarios, luces y público ya no hacen falta.',
      'Tocá cada raíz y dejá PERRO, GUITARRA, VECINOS y RISA, una cosa en cada una. ESCENARIO, LUCES y PÚBLICO hacen que la raíz vuelva atrás.',
    ],
    [ // 1 · the treehouse
      'Entre las hojas hay una casa del árbol con una ventana redonda, y a la derecha una escalera sube hacia otra espiral.',
      'Tocá la escalera para subir hasta la casa y asomate por la ventana: las chispas doradas y plateadas dicen para dónde gira cada espiral.',
      'Subí por la escalera y tocá ASOMARSE POR LA VENTANA. Vas a ver tres espirales: plateada en el tronco izquierdo (gira hacia la izquierda), dorada en el centro (hacia la derecha) y plateada en el tronco derecho (hacia la izquierda).',
    ],
    [ // 2 · the spirals
      'Hay tres espirales: una en cada tronco y una en el centro, en el vórtice. Cada una puede girar para un lado o para el otro.',
      'Lo que se ve desde la ventana: la chispa dorada gira como el reloj, hacia la derecha; la plateada, al revés, hacia la izquierda.',
      'Girá la espiral del tronco izquierdo hacia la izquierda, la del centro hacia la derecha y la del tronco derecho hacia la izquierda.',
    ],
    [ // 3 · the ending
      'El vórtice se abrió. Abajo, entre las raíces, el chico sigue parado en su resplandor.',
      'Los portales no desaparecen: se transforman. Falta cruzar uno.',
      'Tocá el resplandor del chico, abajo: entrar es cruzar el portal y volver.',
    ],
  ],
  hots: {
    ...Object.fromEntries(PT_ROOTS.map((_, k) => [`rm-raiz-${k}`, {
      view: `raiz-${k}`,
      label: (r) => `Una raíz del árbol, ${r.def().where[k]}`,
      on: (r) => r.def().rootOn(r.s, k),
    }])),
    'rm-escalera': {
      view: 'casa',
      label: (r) => (r.s && r.s.seen ? 'La escalera a la casa del árbol, y la ventana redonda' : 'Una escalera que sube a la casa del árbol'),
      on: (r) => r.def().ladderOn(r.s),
    },
    ...Object.fromEntries(PT_SPIRALS.map((sp, k) => [`rm-espiral-${k}`, {
      view: `espiral-${k}`,
      label: (r) => `La espiral ${sp.name}${r.s && r.s.spin[k] ? (r.s.spin[k] > 0 ? ', gira hacia la derecha' : ', gira hacia la izquierda') : ', quieta'}`,
      on: (r) => r.def().spiralOn(r.s),
    }])),
    'rm-resplandor': {
      label: () => 'Un chico parado en un resplandor, abajo',
      on: (r) => r.def().glowOn(r.s),
      tap: (r) => r.def().enter(r),
    },
    'rm-portal': {
      view: 'portal',
      label: () => 'El portal abierto: siempre te llevan de vuelta a vos',
      on: (r) => !!r.s && r.s.done,
    },
  },
  lines: {
    left: {
      perro: 'En esta raíz queda el ladrido de un perro.',
      guitarra: 'En esta raíz queda el eco suave de una guitarra que todavía suena.',
      vecinos: 'En esta raíz quedan los vecinos que se saludan.',
      risa: 'En esta raíz queda la risa compartida sin motivo.',
    },
    again: 'Eso ya lo dejaste en otra raíz. Probá con otra cosa.',
    decoy: 'Hoy no necesito escenarios, ni luces, ni público. La raíz vuelve.',
    roots: 'Las cuatro raíces tienen algo tuyo. Entre las hojas se ve una casa del árbol con una ventana redonda.',
    casa: 'Subís por la escalera hasta la casa del árbol. La ventana redonda da al vórtice.',
    vision: 'Por la ventana se ven tres espirales y una chispa en cada una: plateada en la del tronco izquierdo, que gira hacia la izquierda; dorada en la del centro, que gira hacia la derecha; plateada en la del tronco derecho, que gira hacia la izquierda. Dorado, como el reloj. Plateado, al revés.',
    open: 'Las tres espirales giran como tenían que girar. El vórtice se abre y la luz sale por él. Abajo, el chico espera en su resplandor.',
    close: 'Las tres giran, pero el vórtice no se abre: alguna va para el otro lado. Acordate de las chispas de la ventana.',
    enter: 'Entrás en el resplandor, cruzás el portal y volvés al mismo lugar, mirando al chico.',
  },
  dirName(d) { return d > 0 ? 'derecha' : d < 0 ? 'izquierda' : 'quieta'; },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, roots: ['', '', '', ''], seen: false, spin: [0, 0, 0], done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, roots: PT_THINGS.slice(), seen: true, spin: PT_DIRS.slice(), done: true }; },
  rootsDone(s) { return s.roots.every((x) => x !== ''); },
  /** The vortex is open when the three spirals turn the way the window said. */
  isOpen(s) { return s.seen && s.spin.every((x, k) => x === PT_DIRS[k]); },
  /** What the player does next: roots, window (climb and look), spirals, finale (the glow), done. */
  phase(s) { return s.done ? 'done' : !this.rootsDone(s) ? 'roots' : !s.seen ? 'window' : !this.isOpen(s) ? 'spirals' : 'finale'; },
  stageOf(s) { return { roots: 0, window: 1, spirals: 2, finale: 3, done: 3 }[this.phase(s)]; },
  rootOn(s, k) { return !!s && !s.done && s.roots[k] === ''; },
  ladderOn(s) { const p = s && this.phase(s); return p === 'window' || p === 'spirals'; },
  spiralOn(s) { return !!s && this.phase(s) === 'spirals'; },
  glowOn(s) { return !!s && this.phase(s) === 'finale'; },
  /** A strict reader of what was saved: each part is read only while it makes sense after the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    if (Array.isArray(raw.roots)) { const seen = new Set(); for (let k = 0; k < 4; k++) { const x = raw.roots[k]; if (typeof x === 'string' && PT_THINGS.includes(x) && !seen.has(x)) { f.roots[k] = x; seen.add(x); } } } // (a decoy, an unknown thing or the same thing twice is not a root that play can have)
    const full = this.rootsDone(f);
    f.seen = raw.seen === true && full;
    if (f.seen && Array.isArray(raw.spin) && raw.spin.length === 3 && raw.spin.every((x) => x === -1 || x === 0 || x === 1)) f.spin = raw.spin.slice();
    f.done = raw.done === true && this.isOpen(f);
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** The vortex is open but the crossing is still to come (the dev panel and the checks). */
  almost(s) { s.roots = PT_THINGS.slice(); s.seen = true; s.spin = PT_DIRS.slice(); s.stage = 3; return s; },
  /** The room is solved: four roots with their things, the window seen, the spirals set (a state that `normalize` keeps). */
  onSolved(s) { this.almost(s); world.room.v = this.vOf(s); world.room.cross = 0; },
  debug(s) { return { phase: this.phase(s), roots: s.roots.join(','), seen: s.seen, spin: s.spin.join(','), open: this.isOpen(s), left: s.roots.filter(Boolean).length }; },
  /** What the set shows for a state (its targets). */
  vOf(s) { return { at: s.roots.map((id) => PT_THINGS.indexOf(id)), seen: s.seen ? 1 : 0, spin: s.spin.slice(), open: this.isOpen(s) ? 1 : 0, done: s.done ? 1 : 0, pull: [0, 0, 0, 0] }; },
  /** The set shows the saved state. */
  visual(s) { this.pullT = [0, 0, 0, 0]; Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0, cross: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const o = world.room.v || {}, v = this.vOf(s); if (Array.isArray(o.pull)) v.pull = o.pull; world.room.v = v; syncUI(); },
  pullT: [0, 0, 0, 0],

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const s = room.s;
    if (s.done) return this.donePanel(room, 'EL PORTAL · ABIERTO');
    if (view.startsWith('raiz-')) return this.rootPanel(room, +view.slice(5));
    if (view.startsWith('espiral-')) return this.spiralPanel(room, +view.slice(8));
    return this.casaPanel(room);
  },
  donePanel(room, title) {
    return {
      title, status: COPY.trialDoneBefore,
      build(el) {
        room.btn(el, 'LEER EL CAPÍTULO', 'leer', () => Book.receive(room.track().chapter), { wide: true });
        room.btn(el, 'JUGARLO DE NUEVO', 'otra-vez', () => room.reset(), { wide: true });
      },
    };
  },
  rootPanel(room, k) {
    const d = this, s = room.s, at = s.roots[k];
    return {
      title: 'UNA RAÍZ DEL ÁRBOL', status: at ? `${d.lines.left[at]}` : `Una raíz del árbol, ${d.where[k]}, baja hasta el suelo. ¿Qué dejás en ella?`,
      build(el) {
        if (!at) for (const id of d.order) room.btn(el, d.labels[id], id, () => d.leave(room, k, id), { wide: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  casaPanel(room) {
    const d = this, s = room.s;
    return {
      title: 'LA CASA DEL ÁRBOL', status: s.seen ? d.lines.vision : d.lines.casa,
      build(el) {
        if (!s.seen) room.btn(el, 'ASOMARSE POR LA VENTANA', 'asomarse', () => d.peek(room), { wide: true });
        room.btn(el, 'BAJAR', 'bajar', () => room.go('wide'), { wide: true });
      },
    };
  },
  spiralPanel(room, k) {
    const d = this, s = room.s, name = PT_SPIRALS[k].name;
    return {
      title: `LA ESPIRAL ${name.toUpperCase()}`, status: `La espiral ${name} ${s.spin[k] ? `gira hacia la ${d.dirName(s.spin[k])}` : 'está quieta'}. Las chispas de la ventana dicen para dónde.`,
      build(el) {
        room.btn(el, 'GIRAR A LA DERECHA', 'derecha', () => d.turn(room, k, 1), { wide: true, pressed: s.spin[k] > 0 });
        room.btn(el, 'GIRAR A LA IZQUIERDA', 'izquierda', () => d.turn(room, k, -1), { wide: true, pressed: s.spin[k] < 0 });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },

  // ---- the moves ----
  /** What is left in a root: a thing of the chapter stays; a decoy makes the root pull back. */
  leave(room, k, id) {
    const s = room.s;
    if (!this.rootOn(s, k)) return;
    if (PT_DECOYS.includes(id)) {
      s.tries++; room.save(); Sound.buzz();
      const v = world.room.v; if (v && v.pull) { v.pull[k] = 1; if (this.pullT[k]) clearTimeout(this.pullT[k]); this.pullT[k] = room.later(() => { if (world.room.v && world.room.v.pull) world.room.v.pull[k] = 0; this.pullT[k] = 0; }, 1500); } // (one timer per root: a second try restarts the same pulse)
      room.say(this.lines.decoy); live(this.lines.decoy); return;
    }
    if (s.roots.includes(id)) { room.say(this.lines.again); live(this.lines.again); return; }
    s.roots[k] = id; s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
    this.refresh(s);
    const n = s.roots.filter(Boolean).length, line = n < 4 ? `${this.lines.left[id]} ${n} de 4.` : `${this.lines.left[id]} ${this.lines.roots}`;
    room.renderPanel(); room.say(line); live(line);
    room.later(() => { if (room.view === `raiz-${k}`) room.go('wide'); }, 1700);
  },
  /** From the treehouse: look out of the round window. */
  peek(room) {
    const s = room.s;
    if (!s || s.seen || this.phase(s) !== 'window') return;
    s.seen = true; s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.35);
    this.refresh(s); room.renderPanel(); room.say(this.lines.vision); live(this.lines.vision);
  },
  /** A spiral is turned to the right (clockwise) or to the left. */
  turn(room, k, dir) {
    const s = room.s;
    if (!this.spiralOn(s) || s.spin[k] === dir) return;
    s.spin[k] = dir; s.stage = this.stageOf(s); room.save(); Sound.tick();
    this.refresh(s);
    const open = this.isOpen(s), all = s.spin.every((x) => x !== 0);
    let line = `La espiral ${PT_SPIRALS[k].name} gira hacia la ${this.dirName(dir)}.`;
    if (open) { room.flash(0.5); Sound.thunk(); line = `${line} ${this.lines.open}`; room.later(() => { if (room.view !== 'wide') room.go('wide'); }, 2600); }
    else if (all) { s.tries++; room.save(); Sound.buzz(); line = `${line} ${this.lines.close}`; }
    room.renderPanel(); room.say(line); live(line);
  },
  /** Step into the glow: the camera crosses the portal (the world goes white) and comes back to where the visitor stood, facing the figure. */
  enter(room) {
    const s = room.s;
    if (!this.glowOn(s)) return;
    room.anim(async (c) => {
      bakeWalk();
      const cam = world.cam, from = { x: cam.x, y: cam.y, z: cam.z, yaw: cam.yaw, pitch: cam.pitch, fov: cam.fov }, info = R.roomInfo(), vt = info.vortex, fg = info.figure;
      room.say(this.lines.enter); live(this.lines.enter); Sound.thunk();
      const dx = vt.x - from.x, dz = vt.z - from.z, L = Math.hypot(dx, dz) || 1;
      await Promise.all([
        toPose(c, { x: from.x + dx * 0.85, y: from.y + (vt.y - from.y) * 0.6, z: from.z + dz * 0.85, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(vt.y - from.y, L), fov: from.fov }, rm(2.0), Ease.inCubic),
        c.to(world.room, { cross: 1 }, rm(2.0), Ease.inCubic),
      ]);
      const fx = fg.x - from.x, fz = fg.z - from.z; // in the white: back to the same place, turned toward the figure
      setPose({ x: from.x, y: from.y, z: from.z, yaw: Math.atan2(-fx, -fz), pitch: Math.atan2(fg.y + 0.05 - from.y, Math.hypot(fx, fz)), fov: from.fov });
      await c.wait(rm(0.25));
      await c.to(world.room, { cross: 0 }, rm(1.5), Ease.outCubic);
      room.later(() => room.solve(), 40);
    });
  },
};
