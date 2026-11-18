// Floor 6 · «Un poco más cediendo» (Pato) · chapter 5 · the cover is a smug duck smoking, with five white speech bubbles around him and a house
//   that is not built yet; walkable, and an escape-room in it.
//   1. The voices. Five bubbles hang around the duck, some behind him or at his sides: walk. Up close each says one of the Pato's lines aloud.
//      Answer with the chapter's reply (love as a choice, a decision, building, peace) or with the Pato's own logic (winning, being right,
//      business). The chapter's reply empties the bubble and it drops as a brick at his feet; the Pato's logic counts a try and the bubble stays.
//   2. Ceder y pedir. Lay the five bricks of the house. The duck's eyelids are his mood: half closed means CEDER, open means PEDIR (the plate
//      says it too). Three CEDER and two PEDIR, in the order of MOODS: literally "un poco más cediendo". A wrong choice leaves the brick unset.
//   3. The ring. Touching the glitter ring on his hip makes the Pato say «pollerudo». Only accepting it with the chapter's own words lays the roof.
//   4. The ending. The heart in the smoke drifts into the house and lights its fire: "Nuestra casa, nuestro fuego." His eyes open.
//      The page and chapter 5 come out, once.
// The words keep the book's own: the clue, the replies and the done line are chapter text; the hints are new prose.
/** What his eyelids ask for before each brick: half closed (ceder) or open (pedir). Three and two. */
const PK_MOODS = ['ceder', 'pedir', 'ceder', 'ceder', 'pedir'];
ROOMS['pato'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The first view looks at the duck: the cover's rows are read at the lens of the screen (see the set). */
  get aim() { const L = pkLens(aspectNow()); return { x: PK_SET.x, y: PK.H + ((L.yh - L.row) * PK.Z0) / L.f, z: PK_SET.z, sx: L.sx, sy: L.sy }; }, // (the cover's row that is aimed at, by aspect; a phone ignores sy)
  intro: 'Un pato de párpados pesados fuma un cigarrillo, y el humo se enrosca en un corazón. Cinco globos blancos flotan a su alrededor, algunos detrás de él: acercate a leerlos. A un costado, una casa apenas dibujada, sin ladrillos.',
  clue: 'Me interesa la paz, esa que se construye de a dos, en silencio, cediendo, y pidiendo.\nUn poco más cediendo',
  done: 'Nuestra casa, nuestro fuego.',
  near: 4.2, // how close (m) a bubble shows itself to the walker (announced)
  reach: 4.8, // how close (m) a bubble must be to be answered
  hints: [
    [ // 0 · the voices
      'Cinco globos cuelgan alrededor del Pato, algunos detrás de él o a los costados. Cada uno dice una frase suya, pero se leen recién de cerca: hay que caminar.',
      'Contestá con lo que dice el capítulo, no con la lógica del Pato (ganar, tener razón, el negocio). Cada respuesta justa vacía el globo y lo deja caer como un ladrillo a sus pies.',
      'En cada globo elegí la frase del capítulo: «Amar no es negocio», «Amar es perder un poco de uno mismo para encontrarse en otro», «Es elegir, una y otra vez», «No me interesa ganar todas las discusiones, ni tener razón» y «Elegir cuidar, aunque no cierren los números, es mi forma de amar».',
    ],
    [ // 1 · the bricks
      'Con los cinco ladrillos a sus pies, falta levantar la casa. Mirá al Pato antes de poner cada uno: sus párpados dicen cómo está, y la placa también.',
      'Párpados a medio cerrar: CEDER. Ojos abiertos: PEDIR. Si te equivocás, el ladrillo no asienta y se vuelve a intentar.',
      'Son tres CEDER y dos PEDIR, en este orden: CEDER, PEDIR, CEDER, CEDER, PEDIR. Un poco más cediendo.',
    ],
    [ // 2 · the ring
      'La casa ya tiene paredes pero le falta el techo. El Pato lleva algo brillante en el ala que apoya en la cadera.',
      'Es el anillo de brillo plateado. Tocalo: el Pato te va a decir algo, y hay que saber qué contestarle.',
      'Tocá el anillo y aceptá lo que te diga con las palabras del capítulo: «entonces sí, soy un pollerudo».',
    ],
    [ // 3 · the ending
      'El techo ya está. Falta el fuego, y el humo del cigarrillo, a la izquierda del Pato, esconde un corazón.',
      'Tocá el corazón que se enrosca en el humo: tiene que llegar a la casa.',
      'Tocá el corazón del humo, a la izquierda del Pato: se va a la casa y enciende su fuego. «Nuestra casa, nuestro fuego.»',
    ],
  ],
  hots: {
    ...Object.fromEntries(PK_VOICES.map((v, k) => [`rm-globo-${k}`, {
      label: () => `Un globo de diálogo del Pato, ${v.name}: «${v.line}»`,
      on: (rm) => rm.def().bubbleOn(rm.s, k),
      tap: (rm) => rm.def().look(rm, k),
    }])),
    'rm-casa': {
      view: 'casa',
      label: (rm) => { const s = rm.s; return s && s.done ? 'La casa encendida: nuestra casa, nuestro fuego' : `La casa de a dos, con ${s ? s.laid : 0} de 5 ladrillos. ${rm.def().moodLine(s)}`; },
      on: (rm) => !!rm.s && (rm.s.done || rm.def().phase(rm.s) === 'bricks'),
    },
    'rm-anillo': {
      view: 'anillo',
      label: () => 'El anillo de brillo plateado en el ala que apoya en la cadera',
      on: (rm) => !!rm.s && rm.def().phase(rm.s) === 'ring',
      tap: (rm) => rm.def().touchRing(rm),
    },
    'rm-corazon': {
      label: () => 'El corazón que se enrosca en el humo del cigarrillo',
      on: (rm) => !!rm.s && rm.def().phase(rm.s) === 'finale',
      tap: (rm) => rm.def().finale(rm),
    },
  },
  says: {
    yes: (v, n) => `«${v.yes}» El globo se vacía y cae como un ladrillo a sus pies. ${n < 5 ? `${n} de 5.` : 'Los cinco ladrillos están a sus pies: falta levantar la casa. Mirá sus párpados.'}`,
    no: (v) => `«${v.no}» Eso lo diría el Pato: ganar, tener razón, el negocio. El globo no se vacía.`,
    ceder: (n) => `Cediste. El ladrillo asienta. ${n < 5 ? '' : 'Las paredes están: falta el techo.'}`,
    pedir: (n) => `Pediste. El ladrillo asienta. ${n < 5 ? '' : 'Las paredes están: falta el techo.'}`,
    wrongCeder: 'Cediste cuando él estaba abierto a escuchar. El ladrillo queda flojo: no asienta.',
    wrongPedir: 'Pediste mientras él se cerraba. El ladrillo queda flojo: no asienta.',
    yesRing: 'Si ser pollerudo significa priorizar a los míos por encima de mis impulsos, entonces sí, soy un pollerudo. El techo se apoya sobre la casa.',
    noRing: 'El Pato sonríe: «pollerudo». Si lo negás, hay que defenderse, y el techo no se apoya.',
    touch: 'El Pato mira el anillo, se encoge de hombros y dice: «pollerudo».',
    fire: 'El corazón del humo se va a la casa y enciende su fuego. El Pato abre los ojos. Nuestra casa, nuestro fuego.',
  },
  lines: {
    far: 'Está demasiado lejos para contestarle. Caminá hasta ahí.',
    voices: 'Los cinco globos están vacíos: sus frases cayeron como ladrillos.',
    near: 'Cerca tuyo cuelga un globo con una frase del Pato. Tocalo.',
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, said: [], laid: 0, roof: false, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, said: [0, 1, 2, 3, 4], laid: 5, roof: true, done: true }; },
  /** What the player does next: voices, bricks, ring, finale, done. */
  phase(s) { return s.done ? 'done' : s.said.length < 5 ? 'voices' : s.laid < 5 ? 'bricks' : !s.roof ? 'ring' : 'finale'; },
  stageOf(s) { return { voices: 0, bricks: 1, ring: 2, finale: 3, done: 3 }[this.phase(s)]; },
  bubbleOn(s, k) { return !!s && this.phase(s) === 'voices' && !s.said.includes(k); },
  /** What his eyelids ask for before the next brick: 'ceder' (half closed) or 'pedir' (open); null when no brick is to be laid. */
  moodOf(s) { return s && this.phase(s) === 'bricks' ? PK_MOODS[s.laid] : null; },
  moodLine(s) { const m = this.moodOf(s); return m === 'ceder' ? 'Tiene los párpados a medio cerrar: es hora de ceder.' : m === 'pedir' ? 'Abrió los ojos y te mira: es hora de pedir.' : ''; },
  /** A strict reader of what was saved: each part is read only while it makes sense after the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (Array.isArray(raw.said)) for (const k of raw.said) { if (!int(k, 0, 4) || f.said.includes(k)) break; f.said.push(k); } // (the valid prefix: the bubbles are answered one at a time, in any order)
    if (f.said.length === 5 && int(raw.laid, 0, 5)) f.laid = raw.laid; // (bricks are laid only once the five dropped)
    f.roof = raw.roof === true && f.laid === 5;
    f.done = raw.done === true && f.roof;
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** The roof is on but the heart is still in the smoke (the dev panel and the checks). */
  almost(s) { s.said = [0, 1, 2, 3, 4]; s.laid = 5; s.roof = true; s.stage = 3; return s; },
  /** The room is solved: the five bricks laid, the roof on, the fire lit (a state that `normalize` keeps). */
  onSolved(s) { this.almost(s); world.room.v = this.vOf(s); },
  debug(s) {
    const info = R && R.roomInfo ? R.roomInfo() : null;
    return { phase: this.phase(s), said: s.said.join(','), laid: s.laid, roof: s.roof, mood: this.moodOf(s), bubbleDist: info ? info.bubbleDist : null };
  },
  /** What the set shows for a state (its targets). */
  vOf(s) {
    const ph = this.phase(s), mood = this.moodOf(s);
    return {
      phase: ph, said: [0, 1, 2, 3, 4].map((j) => (j < s.said.length ? s.said[j] : -1)), bub: [0, 1, 2, 3, 4].map((k) => (s.said.includes(k) ? 1 : 0)), shake: [0, 0, 0, 0, 0],
      drop: [0, 1, 2, 3, 4].map((j) => (j < s.said.length ? 1 : 0)), lay: [0, 1, 2, 3, 4].map((j) => (j < s.laid ? 1 : 0)), roof: s.roof ? 1 : 0,
      open: s.done || mood === 'pedir' ? 1 : 0, fin: s.done ? 1 : 0, pol: 0,
    };
  },
  /** The set shows the saved state. */
  visual(s) { this.clearPulses(); Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const o = world.room.v || {}, v = this.vOf(s); if (Array.isArray(o.shake)) v.shake = o.shake; v.pol = o.pol || 0; world.room.v = v; syncUI(); },
  pulseT: {},
  clearPulses() { for (const t of Object.values(this.pulseT)) clearTimeout(t); this.pulseT = {}; },
  /** A short pulse on a value of the set (one timer per name: a second one restarts the same pulse). */
  pulse(room, name, set, off, ms) {
    set(); if (this.pulseT[name]) clearTimeout(this.pulseT[name]);
    this.pulseT[name] = room.later(() => { off(); this.pulseT[name] = 0; }, ms);
  },
  /** The room's walker: says when a bubble shows itself (a screen reader hears it too). */
  onArrive(room) {
    this.heard = [false, false, false, false, false];
    const tick = () => {
      if (!room.id || room.def() !== this) return; // (the floor was left: a new arrival starts its own)
      const s = room.s, info = Room.info();
      if (s && info && room.here() && !room.busy && !App.overlay && this.phase(s) === 'voices') {
        for (let k = 0; k < 5; k++) if (!s.said.includes(k) && !this.heard[k] && info.bubbleDist[k] < this.near) { this.heard[k] = true; hint(this.lines.near, 4600); live(this.lines.near); break; }
      }
      room.later(tick, 450);
    };
    room.later(tick, 450);
  },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const s = room.s;
    if (s.done) return this.donePanel(room, 'LA CASA · NUESTRO FUEGO');
    if (view.startsWith('globo-')) return this.bubblePanel(room, +view.slice(6));
    if (view === 'anillo') return this.ringPanel(room);
    return this.housePanel(room);
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
  bubblePanel(room, k) {
    const d = this, v = PK_VOICES[k];
    return {
      title: 'UN GLOBO DEL PATO', status: `El Pato dice: «${v.line}» ¿Qué le contestás?`,
      build(el) {
        const yes = () => room.btn(el, v.yes.toUpperCase(), 'capitulo', () => d.answer(room, k, true), { wide: true, aria: `Contestar con el capítulo: ${v.yes}` });
        const no = () => room.btn(el, v.no.toUpperCase(), 'pato', () => d.answer(room, k, false), { wide: true, aria: `Contestar con la lógica del Pato: ${v.no}` });
        if (k % 2 === 0) { yes(); no(); } else { no(); yes(); } // (the buttons are not always in the same order)
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  housePanel(room) {
    const d = this, s = room.s;
    return {
      title: 'LA CASA DE A DOS', status: `Ladrillo ${Math.min(5, s.laid + 1)} de 5. ${d.moodLine(s)}`,
      build(el) {
        room.btn(el, 'CEDER', 'ceder', () => d.lay(room, 'ceder'), { wide: true });
        room.btn(el, 'PEDIR', 'pedir', () => d.lay(room, 'pedir'), { wide: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  ringPanel(room) {
    const d = this;
    return {
      title: 'EL ANILLO', status: this.says.touch,
      build(el) {
        room.btn(el, 'ENTONCES SÍ, SOY UN POLLERUDO', 'aceptar', () => d.accept(room, true), { wide: true });
        room.btn(el, 'NO SOY NINGÚN POLLERUDO', 'negar', () => d.accept(room, false), { wide: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },

  // ---- the moves ----
  /** The distance (m) from the walker to a bubble, as the set measures it. Infinity when it is not known: unknown is out of reach. */
  dist(k) { const info = Room.info(), d = info ? info.bubbleDist[k] : NaN; return Number.isFinite(d) ? d : Infinity; },
  /** A look at a bubble: it must be near (the hotspot is shown only near, and the tap is gated too). */
  look(room, k) {
    if (!this.bubbleOn(room.s, k)) return;
    if (this.dist(k) > this.reach) { hint(this.lines.far, 3600); live(this.lines.far); return; }
    room.go(`globo-${k}`);
  },
  /** A bubble is answered: the chapter's reply empties it and its brick drops; the Pato's logic counts a try and the bubble stays. */
  answer(room, k, yes) {
    const s = room.s, v = PK_VOICES[k];
    if (!this.bubbleOn(s, k)) return;
    if (yes) {
      s.said.push(k); s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
      this.refresh(s);
      const line = this.says.yes(v, s.said.length);
      room.renderPanel(); room.say(line); live(line);
      room.later(() => { if (room.view === `globo-${k}`) room.go('wide'); }, s.said.length < 5 ? 2400 : 3000);
      return;
    }
    s.tries++; room.save(); Sound.buzz();
    this.pulse(room, 'shake' + k, () => { world.room.v.shake[k] = 1; }, () => { if (world.room.v) world.room.v.shake[k] = 0; }, 1400);
    const line = this.says.no(v);
    room.say(line); live(line);
  },
  /** A brick is laid with the right word for his mood; the other word leaves it unset (a try). */
  lay(room, choice) {
    const s = room.s;
    if (this.phase(s) !== 'bricks') return;
    const want = PK_MOODS[s.laid];
    if (choice !== want) {
      s.tries++; room.save(); Sound.buzz();
      const line = choice === 'pedir' ? this.says.wrongPedir : this.says.wrongCeder;
      room.say(line); live(line);
      return;
    }
    s.laid++; s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
    this.refresh(s);
    const done = s.laid === 5, line = `${this.says[choice](s.laid)} ${done ? '' : `${s.laid} de 5. ${this.moodLine(s)}`}`.trim();
    room.renderPanel(); room.say(line); live(line);
    if (done) room.later(() => { if (room.view === 'casa') room.go('wide'); }, 2600);
  },
  /** The ring is touched: the Pato says the word. */
  touchRing(room) {
    if (this.phase(room.s) !== 'ring') return;
    this.pulse(room, 'pol', () => { world.room.v.pol = 1; }, () => { if (world.room.v) world.room.v.pol = 0; }, 6000);
    room.go('anillo');
    live(this.says.touch);
  },
  /** The word is taken (the chapter's own) and the roof goes on, or it is denied (a try). */
  accept(room, yes) {
    const s = room.s;
    if (this.phase(s) !== 'ring') return;
    if (!yes) { s.tries++; room.save(); Sound.buzz(); room.say(this.says.noRing); live(this.says.noRing); return; }
    s.roof = true; s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.5);
    this.refresh(s);
    room.renderPanel(); room.say(this.says.yesRing); live(this.says.yesRing);
    room.later(() => { if (room.view === 'anillo') room.go('wide'); }, 3000);
  },
  /** The heart drifts into the house and lights its fire; the duck opens his eyes. */
  finale(room) {
    const s = room.s;
    if (!s || s.done || this.phase(s) !== 'finale') return;
    room.anim(async (c) => {
      Sound.thunk(); room.flash(0.5);
      world.room.v.fin = 1; world.room.v.open = 1; syncUI();
      room.say(this.says.fire); live(this.says.fire);
      await c.wait(rm(3.8));
      room.later(() => room.solve(), 40);
    });
  },
};
