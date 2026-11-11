// Floor 2 · «¿Qué te está pasando?» · chapter 2 · the system: the cover is a city that is a circuit, walkable, and an escape-room in it.
//   1. Every road and every wire drains into a hole in the centre. Its gauge reads LLENO: 0 % and never moves, no matter what is poured in.
//   2. In the maze on the left a single wire runs from an entry pin through four entries, one by one: that is the order in which to
//      cut them (sustancias, amor, plata, éxito: not the order of the book's line). A pulse runs along it and lights each entry;
//      looking at the circuit also announces the order.
//   3. Each entry is a place in the city: PLATA the block of gold windows (lights off), ÉXITO the rocket's ✓ (struck out), AMOR the cloud
//      with the spiral and flowers (the spiral stops), SUSTANCIAS the capsules and the smoke tower. Cut them in the wire's order:
//      any other order and the system opens everything again. With all four cut the city goes quiet (smoke, flows and lights stop).
//   4. In the silence, at the hole: INHALAR / EXHALAR, three full breaths, at your own pace. Then the page and the chapter, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['que-te-esta-pasando'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The camera looks at a row of the cover (the set's lens depends on the screen); the set's z never changes. */
  get aim() { const L = syLens(aspectNow()); return { x: SY_SET.x, y: SY.H + ((L.yh - L.row) * SY.Z0) / L.f, z: SY_SET.z, sx: L.sx, sy: L.sy }; },
  intro: 'Todos los caminos van al mismo hueco. Nos obligan a llenarlo.',
  clue: 'Nos obligan a llenarlo. Con plata, con éxito, con amor, con sustancias.\nPero no se llena.\nSe habita.',
  done: 'Ahí, de a poco, volvés.',
  order: ['sustancias', 'amor', 'plata', 'exito'], // the wire's order (the set draws it: SA_WIRE, in the art file)
  feeds: ['plata', 'exito', 'amor', 'sustancias'], // the order of the set's world.room.v.cut
  names: { plata: 'plata', exito: 'éxito', amor: 'amor', sustancias: 'sustancias' },
  hints: [
    [ // 0 · nothing known yet
      'El medidor del hueco marca LLENO: 0 % y no se mueve, por más que entre. Todos los caminos caen al mismo lugar. ¿Qué lo alimenta?',
      'En el costado izquierdo hay un laberinto de cables y, entre todos, un solo hilo marcado que un pulso recorre. Acercate: pasa por cuatro entradas, una por una.',
      'El cable pasa por: sustancias, amor, plata, éxito. Ese es el orden para cortar. Cada entrada está en la ciudad: la chimenea con humo y las cápsulas, la nube de la espiral, el edificio de ventanas doradas y el cohete.',
    ],
    [ // 1 · the order is known, the feeds are to be cut
      'Las cuatro entradas están en la ciudad: plata, éxito, amor y sustancias. Hay que cortarlas en el orden que marca el cable, no en el de siempre. Si te equivocás, el sistema abre todo de nuevo.',
      'Siguiendo el cable: primero sustancias (las cápsulas y la chimenea), después amor (la nube con la espiral), después plata (el edificio dorado) y al final éxito (el cohete).',
      'Orden: 1 sustancias, apagá la chimenea. 2 amor, frená la espiral. 3 plata, apagá las luces. 4 éxito, tachá el tilde del cohete.',
    ],
    [ // 2 · the silence
      'Quedó todo quieto. El capítulo dice qué hacer: no hay arreglo ni solución, solo aprender a estar ahí. Sin huir.',
      'En el hueco, respirá: inhalar y exhalar, sin apuro, tres veces.',
      'En el hueco tocá INHALAR, después EXHALAR, y repetí hasta completar tres respiraciones. No hay tiempo: cada toque es tuyo.',
    ],
  ],
  hots: {
    'rm-hole': { view: 'hole', label: (r) => `El hueco del centro: ${!r.s ? 'todos los caminos caen acá, el medidor marca LLENO: 0 %' : r.s.done ? 'se habita' : r.s.cuts.length >= 4 ? 'en silencio, listo para respirar' : 'todos los caminos y cables caen acá, el medidor marca LLENO: 0 %'}` },
    'rm-circuit': { view: 'circuit', label: () => 'Un laberinto de cables en el costado izquierdo, con un solo hilo marcado' },
    'rm-plata': { view: 'plata', label: (r) => `Un edificio de ventanas doradas${r.s && r.s.cuts.includes('plata') ? ', con las luces apagadas' : ''}` },
    'rm-exito': { view: 'exito', label: (r) => `Un cohete con un tilde${r.s && r.s.cuts.includes('exito') ? ', ahora tachado' : ''}` },
    'rm-amor': { view: 'amor', label: (r) => `Una nube con una espiral y flores${r.s && r.s.cuts.includes('amor') ? ', la espiral quieta' : ''}` },
    'rm-sustancias': { view: 'sustancias', label: (r) => `Cápsulas rodando por el camino y una chimenea con humo${r.s && r.s.cuts.includes('sustancias') ? ', todo quieto' : ''}` },
  },
  /** What each feed's look says, what its button does, and what the city answers. */
  feed: {
    plata: { title: 'EL EDIFICIO DORADO · PLATA', open: 'Un edificio con ventanas doradas, todas con la luz prendida. Es lo que entra con la plata.', shut: 'Las luces están apagadas, ventana por ventana.', btn: 'APAGAR LAS LUCES', did: 'Las luces se apagan, ventana por ventana. El hueco sigue igual de hondo.' },
    exito: { title: 'EL COHETE · ÉXITO', open: 'Un cohete que sube, con un tilde junto a una tacha. Es lo que entra con el éxito.', shut: 'El tilde ahora es una tacha.', btn: 'TACHAR EL TILDE', did: 'El tilde se convierte en una tacha. El cohete sigue arriba y el hueco, igual.' },
    amor: { title: 'LA NUBE · AMOR', open: 'Una nube con una espiral que gira y flores. Es lo que entra con el amor.', shut: 'La espiral quedó quieta.', btn: 'FRENAR LA ESPIRAL', did: 'La espiral se frena. Las flores se quedan quietas. El hueco no se llenó.' },
    sustancias: { title: 'LA CHIMENEA · SUSTANCIAS', open: 'Cápsulas que ruedan por el camino y una chimenea que no deja de largar humo. Es lo que entra con las sustancias.', shut: 'La chimenea se apagó y las cápsulas están quietas.', btn: 'APAGAR LA CHIMENEA', did: 'La chimenea se apaga y las cápsulas se detienen. El hueco no se llenó.' },
  },
  breathLines: ['En el silencio del aire.', 'Sin huir.'],

  // ---- state ----
  fresh() { return { v: 1, stage: 0, seen: false, cuts: [], breaths: 0, inNext: true, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, done: true, seen: true, cuts: this.order.slice(), breaths: 3 }; },
  stageOf(s) { return s.done ? 3 : s.cuts.length >= 4 ? 2 : s.seen || s.cuts.length ? 1 : 0; },
  normalize(raw) {
    const f = this.fresh();
    if (!raw || raw.v !== 1) return f;
    f.seen = !!raw.seen;
    if (Array.isArray(raw.cuts)) for (const id of raw.cuts) if (id === this.order[f.cuts.length]) f.cuts.push(id); // (a valid prefix of the order, nothing else)
    f.breaths = f.cuts.length >= 4 ? clamp(Math.round(raw.breaths) || 0, 0, 2) : 0;
    f.inNext = f.cuts.length >= 4 ? raw.inNext !== false : true;
    f.done = !!raw.done && f.cuts.length >= 4;
    if (f.done) { f.breaths = 3; f.inNext = true; }
    f.tries = Number(raw.tries) || 0; f.hints = Number(raw.hints) || 0;
    f.stage = this.stageOf(f);
    return f;
  },
  /** Everything cut and two breaths taken: only the last one left (the dev panel and the checks). */
  almost(s) { s.seen = true; s.cuts = this.order.slice(); s.breaths = 2; s.inNext = true; s.stage = 2; return s; },
  debug(s) { return { seen: s.seen, cuts: s.cuts.join(','), breaths: s.breaths, inNext: s.inNext }; },
  /** The set shows the saved state. */
  visual(s) {
    const cut = this.feeds.map((id) => (s.cuts.includes(id) ? 1 : 0)), quiet = s.cuts.length >= 4 ? 1 : 0;
    Object.assign(world.room, { v: { cut, quiet, breath: 0, solved: s.done ? 1 : 0, surge: 0 }, through: 0, page: 0, flash: 0 });
  },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const d = this, s = room.s;
    if (view === 'circuit') return {
      title: 'EL CIRCUITO · UN SOLO CABLE',
      status: 'Un laberinto de cables. Entre todos hay un hilo marcado, que un pulso recorre desde el pin de entrada. Seguilo: pasa por sustancias, después amor, después plata y por último éxito. Ese es el orden de las entradas del hueco.',
      build(el) {
        if (!s.seen) { s.seen = true; s.stage = d.stageOf(s); room.save(); }
        room.btn(el, 'SEGUIR EL CABLE', 'seguir', () => room.say('Desde el pin de entrada: 1, sustancias. 2, amor. 3, plata. 4, éxito.'), { wide: true });
        room.btn(el, 'DEJAR DE MIRAR', 'salir', () => room.go('wide'), { wide: true });
      },
    };
    if (view === 'hole') {
      if (s.done) return {
        title: 'EL HUECO · SE HABITA', status: COPY.trialDoneBefore,
        build(el) {
          room.btn(el, 'LEER EL CAPÍTULO', 'leer', () => Book.receive(room.track().chapter), { wide: true });
          room.btn(el, 'JUGARLO DE NUEVO', 'otra-vez', () => room.reset(), { wide: true });
        },
      };
      if (s.cuts.length >= 4) return {
        title: 'EL HUECO · EN SILENCIO', cls: 'rm-breath',
        status: s.breaths ? `Respiración ${s.breaths} de 3 completa.${s.inNext ? '' : ' Ahora exhalá.'}` : 'Todo quedó quieto. El vacío no se inventa: viene con nosotros. Da miedo quedarse. Respirá tres veces, sin apuro.',
        build(el) { d.buildBreath(el, room); },
      };
      return {
        title: 'EL HUECO · LLENO: 0 %',
        status: 'Todos los caminos y todos los cables caen acá. El medidor marca LLENO: 0 % y no se mueve.',
        build(el) { room.btn(el, 'ECHAR MÁS', 'mas', () => d.pourMore(room), { wide: true }); },
      };
    }
    const f = d.feed[view], cut = s.cuts.includes(view);
    return {
      title: f.title, status: cut || s.done ? f.shut : f.open,
      build(el) {
        const b = room.btn(el, f.btn, 'cortar-' + view, () => d.cut(room, view), { wide: true });
        if (cut || s.done) { b.disabled = true; b.textContent = 'YA ESTÁ'; }
      },
    };
  },

  /** More is poured in, all at once: the gauge trembles and comes back. */
  pourMore(room) {
    room.anim(async (c) => {
      Sound.whoosh(1);
      room.say('Entra más, todo junto. La aguja tiembla y vuelve a cero: no se llena.');
      const v = world.room.v;
      await c.to(v, { surge: 1 }, rm(0.7), Ease.inOutSine);
      await c.wait(rm(0.6));
      await c.to(v, { surge: 0 }, rm(0.9), Ease.inOutSine);
    });
  },

  /** Cutting a feed: in the wire's order it stays cut; in any other the system opens everything again. */
  cut(room, id) {
    const s = room.s, i = this.feeds.indexOf(id);
    if (s.done || s.cuts.includes(id)) return;
    if (id !== this.order[s.cuts.length]) { this.reopen(room); return; }
    room.anim(async (c) => {
      s.cuts.push(id); s.stage = this.stageOf(s); room.save();
      Sound.thunk();
      const v = world.room.v, last = s.cuts.length >= 4;
      room.say(this.feed[id].did);
      await c.to(v.cut, { [i]: 1 }, rm(1.1), Ease.inOutSine);
      if (last) {
        const line = 'Se cortó lo último. El humo se detuvo, los caminos están vacíos, las ventanas apagadas. Todo en silencio. Da miedo quedarse.';
        room.say(line); live(line); Sound.whoosh(1.6);
        await c.to(v, { quiet: 1 }, rm(2.2), Ease.inOutSine);
        room.renderPanel();
        room.say(line);
      } else room.renderPanel();
    });
  },
  /** A wrong order: everything that was cut opens again. */
  reopen(room) {
    const s = room.s;
    s.tries++; s.cuts = []; s.stage = this.stageOf(s); room.save();
    Sound.buzz(); room.flash(0.8);
    const line = 'El sistema vuelve a abrir todo. Tapando el mismo agujero negro con distintas mentiras. Fijate en el orden del cable.';
    live(line);
    const v = world.room.v;
    Seq.run('rmv', async (c) => { c.spawn((cc) => cc.to(v.cut, { 0: 0, 1: 0, 2: 0, 3: 0 }, rm(0.9), Ease.outCubic)); await c.to(v, { quiet: 0 }, rm(0.9), Ease.outCubic); });
    room.renderPanel();
    room.say(line);
  },

  /** INHALAR / EXHALAR, three times: each press is one slow half of a breath (no timing, no speed). */
  buildBreath(el, room) {
    const d = this, s = room.s;
    room.btn(el, s.inNext ? 'INHALAR' : 'EXHALAR', s.inNext ? 'inhalar' : 'exhalar', () => d.breathe(room), { wide: true });
  },
  breathe(room) {
    const s = room.s, v = world.room.v;
    if (s.inNext) {
      s.inNext = false; room.save(); Sound.whoosh(1.2);
      Seq.run('rmv', (c) => c.to(v, { breath: 1 }, rm(1.6), Ease.inOutSine));
      room.renderPanel(); room.say(s.breaths ? `Inhalás. Respiración ${s.breaths + 1} de 3.` : 'Inhalás. El hueco se abre, apenas.');
      return;
    }
    s.inNext = true; s.breaths++; room.save(); Sound.tick();
    Seq.run('rmv', (c) => c.to(v, { breath: 0 }, rm(1.8), Ease.inOutSine));
    if (s.breaths >= 3) { v.solved = 1; room.solve(); return; }
    room.renderPanel();
    room.say(`${this.breathLines[s.breaths - 1]} Respiración ${s.breaths} de 3 completa.`);
  },
};
