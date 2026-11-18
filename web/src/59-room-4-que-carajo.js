// Floor 4 · «¿Qué carajo?» · chapter 4 · the two hands: the cover is two raised hands and three drops, walkable, and an escape-room in it.
//   1. The map. In the left palm there is a line of life, and five glints zigzag down it: left, right, right, left, right. That is the way to
//      turn at the five forks of the marks a backpack left dragged across the water.
//   2. The trail. At each fork a pair of chalk arrows: the right turn lets the marks go on, to something inherited lying in the way (dad's
//      bags, the shared sneakers, Pepe's sword, Eva's gnocchi, Rolando's wines); the wrong one curls back on itself ("te arrastrás en
//      círculos"). Take what lies there.
//   3. Both hands. What was found is set in the hands, and both must close on it: one hand alone keeps dragging. Five times; each one
//      lights a pair of fingertips and brings the hands a little closer.
//   4. The drops fall slower with each thing held. With the five held: stay. A slow count, "QUEDARTE" (one tap starts it, another or any
//      other button interrupts it), and the page and chapter 4 come out, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['que-carajo'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The camera looks at a row of the cover (the set's lens depends on the screen); the set's z never changes. */
  get aim() { const L = qcLens(aspectNow()); return { x: QC_SET.x, y: QC.H + ((L.yh - L.row) * QC.Z0) / L.f, z: QC_SET.z, sx: L.sx, sy: L.sy }; },
  intro: 'Dos manos levantadas y tres gotas. En el piso, marcas de algo arrastrado.',
  clue: 'Pero pesa distinto cuando lo miro de cerca, cuando lo sostengo con las dos manos en vez de arrastrarlo por la vida.',
  done: 'No quiero vivir buscando el sentido. Quiero detenerme a sentirlo.',
  things: QC_THINGS,
  holdMs: 6000,
  hints: [
    [ // 0 · the map is not known
      'Dos manos enormes, abiertas, y tres gotas que caen. En el piso, unas marcas de algo arrastrado cruzan el agua y se bifurcan. ¿Cómo se elige por dónde ir?',
      'La palma izquierda tiene una línea de la vida, y es un mapa. Si la mirás de cerca, marca cómo doblar en cada bifurcación.',
      'Mirá la palma izquierda y seguí la línea: dobla izquierda, derecha, derecha, izquierda, derecha. Esos son los cinco giros del camino.',
    ],
    [ // 1 · the trail and the hands
      'Las marcas se bifurcan y llevan hasta cosas heredadas, tiradas en el camino. Lo que encontrás hay que sostenerlo, no arrastrarlo.',
      'En cada bifurcación tomá el ramal que marca la línea de la vida. Cada cosa que levantás se sostiene en las dos manos: con una sola se sigue arrastrando.',
      'Seguí el camino: izquierda, derecha, derecha, izquierda, derecha. Al final de cada tramo levantá lo que está en el camino y, en las dos manos, tocá MANO IZQUIERDA y MANO DERECHA. Son cinco cosas.',
    ],
    [ // 2 · everything is held
      'Las cinco cosas están en las manos y las gotas caen cada vez más despacio. Ya no queda nada que arrastrar.',
      'El capítulo dice qué sigue: no buscar el sentido, detenerse a sentirlo. Quedate un rato con las gotas.',
      'En las gotas tocá QUEDARTE y esperá a que termine la cuenta (si tocás otra cosa, se interrumpe).',
    ],
  ],
  hots: {
    'rm-palma': { view: 'palma', label: (r) => `La palma de la mano izquierda, con la línea de la vida${r.s && r.s.seen ? ', ya la seguiste' : ''}` },
    'rm-manos': {
      view: 'manos',
      label: (r) => {
        const d = r.def(), s = r.s;
        return !s ? 'Las dos manos, levantadas' : s.done ? 'Las dos manos, sosteniendo' : d.phase(s) === 'hold' ? 'Las dos manos, abiertas: hay algo para sostener' : d.phase(s) === 'quedarte' ? 'Las dos manos, llenas' : 'Las dos manos, levantadas y vacías';
      },
    },
    'rm-gotas': { view: 'gotas', label: (r) => `Las tres gotas, ${r.s && r.s.done ? 'casi quietas' : r.s && r.s.held >= 5 ? 'cayendo despacio' : 'cayendo'}` },
    ...Object.fromEntries(QC_ROUTE.flatMap((_, k) => ['i', 'd'].map((side) => [`rm-ramal-${k}-${side}`, {
      label: () => `Un ramal de las marcas de arrastre, hacia la ${side === 'i' ? 'izquierda' : 'derecha'}`,
      on: (r) => r.def().forkOn(r.s, k),
      tap: (r) => r.def().branch(r, k, side),
    }]))),
    ...Object.fromEntries(QC_ROUTE.map((_, k) => [`rm-cosa-${k}`, {
      label: () => `Una cosa del camino: ${QC_THINGS[k]}`,
      on: (r) => r.def().pickOn(r.s, k),
      tap: (r) => r.def().pick(r, k),
    }])),
  },
  lines: {
    wrong: 'Seguís el ramal y las marcas dan vueltas sobre sí mismas: te arrastrás en círculos y volvés al mismo lugar. Fijate en la línea de la vida.',
    right: 'Las marcas siguen. Al final del tramo hay algo tirado en el camino.',
    oneHand: 'Con una sola mano se sigue arrastrando. Falta la otra.',
    drag: 'Lo arrastrás, apurado, detrás tuyo. Pesa igual y no lo sentís.',
    last: 'Las cinco cosas, en las dos manos. Ya no queda nada que arrastrar. Las gotas caen cada vez más despacio.',
    held: 'Soltaste. Las gotas siguen cayendo despacio.',
  },
  names: { I: 'izquierda', D: 'derecha' },
  /** The left palm's line, in words: the turns, in order. */
  route() { return QC_ROUTE.map((r) => this.names[r]).join(', '); },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, seen: false, forks: 0, found: 0, held: 0, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, seen: true, forks: 5, found: 5, held: 5, done: true }; },
  /** What the player does next: fork (a turn to take), pick (something lies at the end of the turn), hold (in the hands), quedarte, done. */
  phase(s) { return s.done ? 'done' : s.held >= 5 ? 'quedarte' : s.forks > s.found ? 'pick' : s.found > s.held ? 'hold' : 'fork'; },
  stageOf(s) { return s.done ? 3 : s.held >= 5 ? 2 : s.seen || s.forks > 0 ? 1 : 0; },
  forkOn(s, k) { return !!s && !s.done && s.forks === k && s.found === k && s.held === k; },
  pickOn(s, k) { return !!s && !s.done && s.forks > k && s.found === k; },
  /** A strict reader of what was saved: each count is read only while it makes sense next to the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (int(raw.held, 0, 5)) {
      f.held = raw.held;
      const okFound = int(raw.found, f.held, Math.min(5, f.held + 1)); // (a thing is found before it is held, one at a time)
      f.found = okFound ? raw.found : f.held;
      const forkTop = f.found === f.held ? Math.min(5, f.found + 1) : f.found; // (play opens a new fork only when everything found is held: while a thing waits in the water or in the hands, forks equals found)
      f.forks = okFound && int(raw.forks, f.found, forkTop) ? raw.forks : f.found; // (a count that makes no sense drops what follows it)
    }
    f.seen = raw.seen === true || f.forks > 0;
    f.done = raw.done === true && f.held === 5;
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** Every thing held but the stay is still to come (the dev panel and the checks). */
  almost(s) { s.seen = true; s.forks = s.found = s.held = 5; s.stage = 2; return s; },
  /** The room is solved: the map seen, the five forks taken, the five things held (a state that `normalize` keeps, whatever step it was reached from). */
  onSolved(s) { s.seen = true; s.forks = s.found = s.held = 5; world.room.v = this.vOf(s); },
  debug(s) { return { seen: s.seen, forks: s.forks, found: s.found, held: s.held, phase: this.phase(s), route: QC_ROUTE.join('') }; },
  /** What the set shows for a state (its targets). */
  vOf(s) { return { forks: s.forks, found: s.found, held: s.held, seen: s.seen ? 1 : 0, slow: s.held >= 5 ? 1 : 0, calm: s.done ? 1 : 0, curl: [0, 0, 0, 0, 0], grip: 0 }; },
  /** The set shows the saved state. */
  visual(s) { Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const o = world.room.v || {}, v = this.vOf(s); if (Array.isArray(o.curl)) v.curl = o.curl; v.grip = o.grip || 0; world.room.v = v; syncUI(); },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const d = this, s = room.s;
    if (s.done && view !== 'palma') return d.donePanel(room, view === 'manos' ? 'LAS DOS MANOS · SOSTENIENDO' : 'LAS GOTAS · CASI QUIETAS');
    if (view === 'palma') return {
      title: 'LA PALMA IZQUIERDA · LA LÍNEA DE LA VIDA',
      status: `Una palma abierta, llena de rayas. La que baja es la línea de la vida, y dobla cinco veces: ${d.route()}. Cinco brillos la recorren, cada uno a un lado de la línea. Se dobla como quien camina hacia las manos.`,
      build(el) {
        if (!s.seen) { s.seen = true; s.stage = d.stageOf(s); room.save(); d.refresh(s); }
        room.btn(el, 'SEGUIR LA LÍNEA', 'seguir', () => room.say(`Desde la muñeca, bajando: ${QC_ROUTE.map((r, i) => `${i + 1}, ${d.names[r]}`).join('. ')}.`), { wide: true });
        room.btn(el, 'DEJAR DE MIRAR', 'salir', () => room.go('wide'), { wide: true });
      },
    };
    if (view === 'manos') return d.handsPanel(room);
    return d.dropsPanel(room);
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
  handsPanel(room) {
    const d = this, s = room.s, ph = d.phase(s);
    if (ph === 'hold') {
      const name = QC_THINGS[s.held];
      return {
        title: 'LAS DOS MANOS · ALGO PARA SOSTENER', status: `${name}. Pesa. Con una sola mano se sigue arrastrando: hacen falta las dos.`,
        build(el) {
          const on = [false, false], btns = [];
          const press = (i) => {
            on[i] = !on[i]; btns[i].setAttribute('aria-pressed', String(on[i]));
            if (on[0] && on[1]) d.hold(room); else if (on[i]) room.say(d.lines.oneHand);
          };
          btns.push(room.btn(el, 'MANO IZQUIERDA', 'izquierda', () => press(0), { pressed: false }), room.btn(el, 'MANO DERECHA', 'derecha', () => press(1), { pressed: false }));
          room.btn(el, 'ARRASTRARLA', 'arrastrar', () => { s.tries++; room.save(); Sound.buzz(); room.say(d.lines.drag); live(d.lines.drag); }, { wide: true });
        },
      };
    }
    if (ph === 'quedarte') return {
      title: 'LAS DOS MANOS · LLENAS', status: 'Las cinco cosas están en las manos. Pesan distinto de cerca. Ahora hay que quedarse un rato con las gotas.',
      build(el) { room.btn(el, 'MIRAR LAS GOTAS', 'gotas', () => room.go('gotas'), { wide: true }); },
    };
    return {
      title: 'LAS DOS MANOS · ABIERTAS', status: ph === 'pick' ? 'Dos manos levantadas y vacías. Hay algo tirado en el camino que todavía no levantaste.' : `Dos manos levantadas y vacías. Falta algo que sostener: seguí las marcas de arrastre en el piso. Cosas sostenidas: ${s.held} de 5.`,
      build(el) { room.btn(el, 'MIRAR LAS MANOS', 'mirar', () => room.say(`Las manos, abiertas. Cosas sostenidas: ${s.held} de 5.`), { wide: true }); },
    };
  },
  dropsPanel(room) {
    const d = this, s = room.s;
    if (s.held >= 5) return {
      title: 'LAS GOTAS · CAEN DESPACIO', status: 'Las gotas caen cada vez más despacio. Y sin embargo, los pájaros cantan. El agua del mate se enfría. Quedate un rato.',
      build(el) {
        room.btn(el, 'QUEDARTE', 'quedarte', (b) => { room.say('Te quedás. Sin apuro, mirando las gotas.'); room.hold(b, d.holdMs, 'QUEDÁNDOTE', () => d.stay(room), () => room.say(d.lines.held)); }, { wide: true, keepHold: true });
      },
    };
    return {
      title: 'LAS GOTAS · CAEN', status: 'Tres gotas: una de cada muñeca y una entre las dos. Caen rápido, como todo. Todavía hay cosas que sostener.',
      build(el) { room.btn(el, 'MIRAR LAS GOTAS', 'mirar', () => room.say(`Las gotas caen una tras otra. Cosas sostenidas: ${s.held} de 5.`), { wide: true }); },
    };
  },

  /** A turn at a fork: the right one lets the marks go on; the wrong one curls back on itself. */
  branch(room, k, side) {
    const s = room.s;
    if (!this.forkOn(s, k)) return;
    if (side.toUpperCase() !== QC_ROUTE[k]) {
      s.tries++; room.save(); Sound.buzz(); room.flash(0.5);
      const v = world.room.v; if (Array.isArray(v.curl)) { v.curl[k] = 1; room.later(() => { if (world.room.v && Array.isArray(world.room.v.curl)) world.room.v.curl[k] = 0; }, 2400); } // (the wrong way shows while it is followed)
      hint(this.lines.wrong, 4200); live(this.lines.wrong);
      return;
    }
    s.forks++; s.stage = this.stageOf(s); room.save(); Sound.tick();
    this.refresh(s);
    hint(this.lines.right, 3600); live(this.lines.right);
  },
  /** Something that lies at the end of a right turn, taken. */
  pick(room, k) {
    const s = room.s;
    if (!this.pickOn(s, k)) return;
    s.found++; room.save(); Sound.tick();
    this.refresh(s);
    const line = `${QC_THINGS[k]}. Pesa. Llevalo a las manos.`;
    hint(line, 3600); live(line);
  },
  /** Both hands close on what was found: it is held. */
  hold(room) {
    const s = room.s;
    if (s.done || s.found <= s.held) return;
    const k = s.held;
    s.held++; s.stage = this.stageOf(s); room.save();
    const last = s.held >= 5, line = last ? this.lines.last : `${QC_THINGS[k]}. Con las dos manos pesa distinto. Quedan ${5 - s.held}.`;
    room.anim(async (c) => {
      Sound.thunk(); room.flash(0.6); this.refresh(s);
      const v = world.room.v; v.grip = 1; room.later(() => { if (world.room.v) world.room.v.grip = 0; }, 700); // (a pulse: the hands close and open a little)
      room.say(line); live(line);
      await c.wait(rm(1.1));
      room.renderPanel(); room.say(line);
    });
  },
  /** The slow count is over: the page and the chapter. */
  stay(room) {
    const s = room.s;
    if (s.done || s.held < 5) return;
    room.flash(0.5);
    room.solve(); // (onSolved shows the final state)
  },
};
