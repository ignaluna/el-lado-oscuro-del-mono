// Floor 5 · «Explotar» · chapter 6 · the strand: the cover is a monkey walking on tiles, with headphones and sunglasses, blowing notes, and a DNA strand
//   behind him (frayed on the left, whole in the middle, dashed on the right); walkable, and an escape-room in it.
//   1. The strand. Six rungs of the helix carry words from the letter. Three are what was inherited without choosing (the closed fist, the hard eyes
//      and the mandate, the silence): NO HEREDAR turns them into the cover's dashes. Three are what is worth keeping (the strength, the way of
//      staying alive, a piece of her): CONSERVAR keeps them; NO HEREDAR on one of those frays the strand again and the rung returns (a try).
//      Three rungs are on the helix of the picture and three beyond it, where the strand goes on past the edge: they show when you are near.
//   2. The notes. Notes float around the room; three carry the unsaid words (te, amo, abuela), the rest only hum. They show only near: walk to them.
//   3. The song. At the headphones the collected words are sung in the letter's order: te, amo, abuela. A wrong order scatters the notes back.
//   4. The ending. A slow hold, SEGUIR CAMINANDO: his step lands, the strand ahead dissolves into dashes and the drop falls into the floor.
//      "De no heredar la misma tristeza." The page and chapter 6 come out, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['explotar'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The first view looks at the middle of the drawing: the cover's rows are read at the lens of the screen (see the set). */
  get aim() { const L = exLens(aspectNow()); return { x: EX_SET.x, y: EX.H + ((L.yh - L.row) * EX.Z0) / L.f, z: EX_SET.z, sx: L.sx, sy: L.sy }; }, // (the cover's row that is aimed at, by aspect; a phone ignores sy)
  intro: 'Un mono camina por un piso de baldosas, con auriculares y lentes, soplando notas. Detrás, una hebra de ADN: deshilachada a la izquierda, entera en el medio, rayada y desvaneciéndose a la derecha.',
  clue: 'Me arrepiento de no haberte abrazado más, de no haberte dicho te amo cuando todavía podía hacerlo.\nPero te juro que estoy tratando de ser mejor. De no callar lo que siento.',
  done: 'De no heredar la misma tristeza.',
  near: 4.2, // how close (m) a far rung or a note shows itself to the walker (announced)
  reach: 4.8, // how close (m) a far rung or a note must be to be touched
  hints: [
    [ // 0 · the strand
      'La hebra tiene seis peldaños con palabras de la carta. Tres están en lo que se ve del dibujo; los otros están más allá del cuadro, donde la hebra sigue.',
      'Tres son lo que se heredó sin elegir (el puño cerrado, los ojos duros y el mandato, el silencio) y tres lo que vale guardar (la fuerza, la manera de seguir viva, un pedazo tuyo). Los últimos tres están a la derecha, lejos: hay que caminar.',
      'NO HEREDAR en «el puño cerrado», en «tus ojos duros» y en «ese silencio». CONSERVAR en «la fuerza», en «tu manera de seguir viva» y en «un pedazo tuyo en mí». Los tres últimos están a la derecha del cuadro, de cerca se ven.',
    ],
    [ // 1 · the notes
      'Por el cuarto flotan notas. Tres cargan lo que nunca se dijo; las demás solo tararean. Se ven recién cuando te acercás.',
      'Una está a la izquierda, no muy lejos; otra a la derecha; y la última detrás del mono, a la izquierda. Cada una lleva una palabra de la carta.',
      'Caminá hasta cada una y tocala: «te», «amo» y «abuela».',
    ],
    [ // 2 · the song
      'Con las tres palabras en la mano, el lugar para cantarlas son los auriculares del mono, el disco brillante en la oreja.',
      'La carta lo dice: «no haberte dicho te amo». Y se lo dice a la abuela.',
      'Tocá los auriculares y cantá TE, después AMO, después ABUELA. Si te equivocás de orden, las notas se dispersan.',
    ],
    [ // 3 · the ending
      'La canción ya suena. El mono sigue caminando, con la hebra detrás.',
      'Lo que falta es seguir caminando sin heredar la misma tristeza.',
      'Tocá al mono y dejá correr SEGUIR CAMINANDO hasta el final (un toque empieza la cuenta, otro la corta).',
    ],
  ],
  hots: {
    ...Object.fromEntries(EX_RUNGS.map((r, k) => [`rm-peldano-${k}`, {
      label: (rm) => `Un peldaño de la hebra: «${r.word}»`,
      on: (rm) => rm.def().rungOn(rm.s, k),
      tap: (rm) => rm.def().look(rm, k),
    }])),
    ...Object.fromEntries(EX_NOTES.map((n, k) => [`rm-nota-${k}`, {
      label: () => `Una nota que dice «${n.word}»`,
      on: (rm) => rm.def().noteOn(rm.s, k),
      tap: (rm) => rm.def().take(rm, k),
    }])),
    'rm-auriculares': {
      view: 'cantar',
      label: () => 'Los auriculares del mono, con un disco brillante en la oreja',
      on: (rm) => rm.def().songOn(rm.s),
    },
    'rm-mono': {
      view: 'camino',
      label: (rm) => (rm.s && rm.s.done ? 'El mono siguió caminando: de no heredar la misma tristeza' : 'El mono que camina, listo para seguir'),
      on: (rm) => !!rm.s && (rm.s.done || rm.def().phase(rm.s) === 'finale'),
    },
  },
  says: {
    puno: { drop: 'Amar con el puño cerrado: eso no lo heredo. El peldaño se corta en rayas, como el final de la hebra.', keep: 'Conservar el puño cerrado es seguir amando con miedo. El peldaño se tensa y no cambia.' },
    ojos: { drop: 'Los ojos duros, cargando el mandato de los que vinieron antes: eso no lo heredo. El peldaño se corta en rayas.', keep: 'Conservar el mandato es heredarlo tal cual. El peldaño se tensa y no cambia.' },
    silencio: { drop: 'Ese silencio en el que el cuerpo te traicionó: eso no lo heredo. El peldaño se corta en rayas.', keep: 'Conservar el silencio es callar otra vez lo que sentís. El peldaño se tensa y no cambia.' },
    fuerza: { keep: 'Dentro de todo lo que me dejaste, también había algo hermoso: la fuerza. Eso se queda.', drop: 'Eso no era dolor: «la fuerza». Si lo soltás, la hebra se deshilacha de nuevo. El peldaño vuelve.' },
    viva: { keep: 'Esa tozudez era tu manera de seguir viva. Eso se queda.', drop: 'Eso no era dolor: «tu manera de seguir viva». Si lo soltás, la hebra se deshilacha de nuevo. El peldaño vuelve.' },
    pedazo: { keep: 'Todavía hay un pedazo tuyo en mí, buscando aprender a vivir. Eso se queda.', drop: 'Eso no era dolor: «un pedazo tuyo en mí». Si lo soltás, la hebra se deshilacha de nuevo. El peldaño vuelve.' },
  },
  lines: {
    far: 'Está demasiado lejos para tocarlo. Caminá hasta ahí.',
    strand: 'Los seis peldaños tienen lo suyo: lo que se hereda quedó en rayas, lo que se guarda sigue entero. Por el cuarto flotan notas.',
    near: 'Más allá del cuadro la hebra sigue, rayada. Cerca tuyo hay un peldaño con una palabra: tocalo.',
    nearNote: 'Cerca tuyo flota una nota con una palabra. Tocala.',
    taken: (w, n) => `Tomás la nota: «${w}». ${n < 3 ? `${n} de 3.` : 'Las tres: llevalas a los auriculares del mono.'}`,
    song: (w, n) => `Cantás «${w}». ${n < 3 ? `${n} de 3.` : 'Las tres palabras suenan en el orden de la carta.'}`,
    scatter: 'Ese no es el orden de la carta. Las notas se dispersan otra vez por el cuarto.',
    step: 'El mono apoya el paso. La hebra de adelante se disuelve en rayas y la gota cae al piso.',
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, rungs: [], notes: [], sung: [], done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, rungs: [0, 1, 2, 3, 4, 5], notes: [0, 1, 2], sung: EX_SONG.slice(), done: true }; },
  /** What the player does next: strand, notes, song, finale, done. */
  phase(s) { return s.done ? 'done' : s.rungs.length < 6 ? 'strand' : s.notes.length < 3 ? 'notes' : s.sung.length < 3 ? 'song' : 'finale'; },
  stageOf(s) { return { strand: 0, notes: 1, song: 2, finale: 3, done: 3 }[this.phase(s)]; },
  rungOn(s, k) { return !!s && this.phase(s) === 'strand' && !s.rungs.includes(k); },
  noteOn(s, k) { return !!s && this.phase(s) === 'notes' && !s.notes.includes(k); },
  songOn(s) { return !!s && this.phase(s) === 'song'; },
  /** A strict reader of what was saved: each part is read only while it makes sense after the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (Array.isArray(raw.rungs)) for (const k of raw.rungs) { if (!int(k, 0, 5) || f.rungs.includes(k)) break; f.rungs.push(k); } // (the valid prefix: rungs are settled one at a time, in any order)
    if (f.rungs.length === 6 && Array.isArray(raw.notes)) for (const k of raw.notes) { if (!int(k, 0, 2) || f.notes.includes(k)) break; f.notes.push(k); }
    if (f.notes.length === 3 && Array.isArray(raw.sung)) for (let i = 0; i < 3; i++) { if (raw.sung[i] !== EX_SONG[i]) break; f.sung.push(EX_SONG[i]); } // (only a prefix of the letter's own order can have been sung)
    f.done = raw.done === true && f.sung.length === 3;
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** The song is sung but the last step is still to come (the dev panel and the checks). */
  almost(s) { s.rungs = [0, 1, 2, 3, 4, 5]; s.notes = [0, 1, 2]; s.sung = EX_SONG.slice(); s.stage = 3; return s; },
  /** The room is solved: every rung settled, the three notes sung (a state that `normalize` keeps). */
  onSolved(s) { this.almost(s); world.room.v = this.vOf(s); },
  debug(s) {
    const info = R && R.roomInfo ? R.roomInfo() : null;
    return { phase: this.phase(s), rungs: s.rungs.join(','), notes: s.notes.join(','), sung: s.sung.join(','), noteDist: info ? info.noteDist : null, rungDist: info ? info.rungDist : null, hum: info ? info.hummers : 0 };
  },
  /** What the set shows for a state (its targets). */
  vOf(s) {
    return { rung: [0, 1, 2, 3, 4, 5].map((k) => (s.rungs.includes(k) ? 1 : 0)), shake: [0, 0, 0, 0, 0, 0], fray: 0, note: [0, 1, 2].map((k) => (s.notes.includes(k) ? 1 : 0)), sung: s.sung.length, scatter: 0,
      strand: s.rungs.length === 6 ? 1 : 0, song: s.sung.length === 3 ? 1 : 0, done: s.done ? 1 : 0, step: s.done ? 1 : 0 };
  },
  /** The set shows the saved state. */
  visual(s) { this.clearPulses(); Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const o = world.room.v || {}, v = this.vOf(s); if (Array.isArray(o.shake)) v.shake = o.shake; v.fray = o.fray || 0; v.scatter = o.scatter || 0; world.room.v = v; syncUI(); },
  pulseT: {},
  clearPulses() { for (const t of Object.values(this.pulseT)) clearTimeout(t); this.pulseT = {}; },
  /** A short pulse on a value of the set (one timer per name: a second one restarts the same pulse). */
  pulse(room, name, set, off, ms) {
    set(); if (this.pulseT[name]) clearTimeout(this.pulseT[name]);
    this.pulseT[name] = room.later(() => { off(); this.pulseT[name] = 0; }, ms);
  },
  /** The room's walker: says when a far rung or a note shows itself (a screen reader hears it too). */
  onArrive(room) {
    this.heardR = [false, false, false, false, false, false]; this.heardN = [false, false, false];
    const tick = () => {
      if (!room.id || room.def() !== this) return; // (the floor was left: a new arrival starts its own)
      const s = room.s, info = Room.info();
      if (s && info && room.here() && !room.busy && !App.overlay) {
        const ph = this.phase(s);
        if (ph === 'strand') { for (let k = 3; k < 6; k++) if (!s.rungs.includes(k) && !this.heardR[k] && info.rungDist[k] < this.near) { this.heardR[k] = true; hint(this.lines.near, 4600); live(this.lines.near); break; } }
        else if (ph === 'notes') { for (let k = 0; k < 3; k++) if (!s.notes.includes(k) && !this.heardN[k] && info.noteDist[k] < this.near) { this.heardN[k] = true; hint(this.lines.nearNote, 4200); live(this.lines.nearNote); break; } }
      }
      room.later(tick, 450);
    };
    room.later(tick, 450);
  },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const s = room.s;
    if (s.done) return this.donePanel(room, 'EL MONO · SIGUE CAMINANDO');
    if (view.startsWith('peldano-')) return this.rungPanel(room, +view.slice(8));
    if (view === 'cantar') return this.songPanel(room);
    return this.walkPanel(room);
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
  rungPanel(room, k) {
    const d = this, r = EX_RUNGS[k];
    return {
      title: 'UN PELDAÑO DE LA HEBRA', status: `«${r.word}». ¿Lo heredás tal cual, o lo conservás?`,
      build(el) {
        room.btn(el, 'NO HEREDAR', 'no-heredar', () => d.choose(room, k, false), { wide: true });
        room.btn(el, 'CONSERVAR', 'conservar', () => d.choose(room, k, true), { wide: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  songPanel(room) {
    const d = this, s = room.s;
    return {
      title: 'LOS AURICULARES', status: s.sung.length ? `Cantaste: ${s.sung.map((w) => `«${w}»`).join(' ')}. ${s.sung.length} de 3.` : 'Tenés tres palabras que nunca se dijeron: «te», «amo» y «abuela». ¿En qué orden las cantás?',
      build(el) {
        for (const w of ['abuela', 'te', 'amo']) room.btn(el, w.toUpperCase(), `cantar-${w}`, () => d.sing(room, w), { wide: true }); // (the buttons are not in the order of the letter)
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  walkPanel(room) {
    const d = this;
    return {
      title: 'SEGUIR CAMINANDO', status: 'La canción suena. El mono camina con la hebra detrás. Seguir caminando es no heredar la misma tristeza.',
      build(el) {
        room.btn(el, 'SEGUIR CAMINANDO', 'caminar', (b) => room.hold(b, 5000, 'SEGUIR CAMINANDO', () => d.walk(room)), { wide: true, keepHold: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },

  // ---- the moves ----
  /** A rung is let go (NO HEREDAR) or kept (CONSERVAR): the pain that is let go turns into dashes, the keeper that is kept stays whole; the other two choices do not change it (a try). */
  choose(room, k, keep) {
    const s = room.s, r = EX_RUNGS[k];
    if (!this.rungOn(s, k)) return;
    if (!!r.pain === !keep) { // right: a pain let go, or a keeper kept
      s.rungs.push(k); s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
      this.refresh(s);
      const n = s.rungs.length, line = `${this.says[r.id][keep ? 'keep' : 'drop']} ${n < 6 ? `${n} de 6.` : this.lines.strand}`;
      room.renderPanel(); room.say(line); live(line);
      room.later(() => { if (room.view === `peldano-${k}`) room.go('wide'); }, n < 6 ? 1900 : 2600);
      return;
    }
    s.tries++; room.save(); Sound.buzz();
    this.pulse(room, 'shake' + k, () => { world.room.v.shake[k] = 1; if (!keep) world.room.v.fray = 1; }, () => { if (world.room.v) { world.room.v.shake[k] = 0; world.room.v.fray = 0; } }, 1500);
    const line = this.says[r.id][keep ? 'keep' : 'drop'];
    room.say(line); live(line);
  },
  /** The distance (m) from the walker to a far rung or a note, as the set measures it (0 for the rungs of the picture). Infinity when it is not known: unknown is out of reach. */
  dist(kind, k) { const info = Room.info(), a = info ? (kind === 'rung' ? info.rungDist : info.noteDist) : null, d = a ? a[k] : NaN; return Number.isFinite(d) ? d : Infinity; },
  /** A look at a rung: the ones of the picture are always there; the far ones must be near. */
  look(room, k) {
    if (!this.rungOn(room.s, k)) return;
    if (EX_RUNGS[k].far && this.dist('rung', k) > this.reach) { hint(this.lines.far, 3600); live(this.lines.far); return; }
    room.go(`peldano-${k}`);
  },
  /** A note that is near is taken: its word is yours now. */
  take(room, k) {
    const s = room.s;
    if (!this.noteOn(s, k)) return;
    if (this.dist('note', k) > this.reach) { hint(this.lines.far, 3600); live(this.lines.far); return; }
    s.notes.push(k); s.stage = this.stageOf(s); room.save(); Sound.tick(); room.flash(0.3);
    this.refresh(s);
    const line = this.lines.taken(EX_NOTES[k].word, s.notes.length);
    hint(line, 5200); live(line);
  },
  /** One word is sung: only the letter's order goes on; any other word scatters the notes back. */
  sing(room, w) {
    const s = room.s;
    if (!this.songOn(s)) return;
    if (w !== EX_SONG[s.sung.length]) {
      s.tries++; s.sung = []; s.notes = []; s.stage = this.stageOf(s); room.save(); Sound.buzz();
      this.refresh(s); this.pulse(room, 'scatter', () => { world.room.v.scatter = 1; }, () => { if (world.room.v) world.room.v.scatter = 0; }, 1600);
      this.heardN = [false, false, false];
      room.renderPanel(); room.say(this.lines.scatter); live(this.lines.scatter);
      room.later(() => { if (room.view === 'cantar') room.go('wide'); }, 2300);
      return;
    }
    s.sung.push(w); s.stage = this.stageOf(s); room.save(); Sound.tick(); room.flash(0.25);
    this.refresh(s);
    const line = this.lines.song(w, s.sung.length);
    room.renderPanel(); room.say(line); live(line);
    if (s.sung.length === 3) room.later(() => { if (room.view === 'cantar') room.go('wide'); }, 2300);
  },
  /** The slow hold ran out: his step lands, the strand ahead dissolves into dashes and the drop falls into the floor. */
  walk(room) {
    const s = room.s;
    if (!s || s.done || this.phase(s) !== 'finale') return;
    room.anim(async (c) => {
      Sound.thunk(); room.flash(0.5);
      world.room.v.done = 1; world.room.v.step = 1; syncUI();
      room.say(this.lines.step); live(this.lines.step);
      await c.wait(rm(2.4));
      room.later(() => room.solve(), 40);
    });
  },
};
