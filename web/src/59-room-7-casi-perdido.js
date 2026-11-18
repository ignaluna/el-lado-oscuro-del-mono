// Floor 7 · «Casi perdido» · chapter 8 · the cover is a monkey with his hand on his temple and his head on fire (white, gold and silver), with three loading
//   spinners at his sides; walkable, and an escape-room in it.
//   1. The thoughts. Ten thoughts rise in the flames, one at a time (the 2D plate's cards). Five belong to the fire (producir, la culpa de no estar produciendo,
//      el rendimiento, correr detrás del objetivo, estar distraído): DEJAR QUE ARDA. Five are the quiet life (unos mates, pasear con Rita, hacer música con
//      amigos, abrazar a mi novia, volver a la naturaleza de las cosas): BAJARLO A MI LADO. A wrong choice sends the thought back up and counts a try; it comes
//      again later. The quiet ones land at three spots around the room as small chalk things: a mate (unos mates, abrazar a mi novia), Rita's leash (pasear con
//      Rita, volver a la naturaleza de las cosas) and a guitar (hacer música con amigos).
//   2. The spinners. Each of the three loading spinners hangs over one of those spots, behind him or at his side: walk there. At each decide what gets the
//      attention: the spinner (it keeps spinning and counts a try) or the thing below it (the spinner stops and is a still star).
//   3. The ending. A slow hold, MIRAR LAS BRASAS (one tap starts it, another tap or any other button interrupts it): the flames burn down to embers, the gold
//      glitter falls and the hand leaves the temple: "Hoy estoy triste. Y no está mal." Then the closing line, the page and chapter 8 come out, once.
// The words keep the book's own: the clue and the done line are chapter text; the hints and the rest are new prose.
ROOMS['casi-perdido'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The first view looks at the middle of the drawing: the cover's rows are read at the lens of the screen (see the set). */
  get aim() { const a = aspectNow(), L = cpLens(a); return { x: CP_SET.x, y: CP.H + ((L.yh - 520) * CP.Z0) / L.f, z: CP_SET.z, sx: L.wide ? 0.42 : 0.5, sy: 0.5 }; },
  intro: 'Un mono de pelo largo y sonrisa calma se apoya la mano en la sien, y le arde la cabeza: llamas blancas, doradas y plateadas. Un pensamiento sube por el fuego, a su izquierda: tocalo. A los costados, tres ruedas de carga no dejan de girar.',
  clue: 'Yo quiero vivir de verdad. Tomar unos mates. Sentarme frente al fuego del hogar y mirar cómo se apagan las brasas.\nNos quiere corriendo detrás del objetivo, confundiendo propósito con productividad.',
  done: 'Consiste en decidir qué merece nuestra atención.',
  near: 4.2, // how close (m) a spinner shows itself to the walker (announced)
  reach: 4.8, // how close (m) a spinner must be to be decided
  hints: [
    [ // 0 · the thoughts
      'En las llamas de su cabeza sube un pensamiento a la vez; a la izquierda de las llamas se lo ve flotar. Cada uno es del fuego o de la vida tranquila: tocalo y decidí.',
      'Lo que te hace correr va al fuego: DEJAR QUE ARDA. Lo que el capítulo quiere vivir va a tu lado: BAJARLO A MI LADO. Si te equivocás, el pensamiento vuelve a subir.',
      'DEJAR QUE ARDA: «Producir», «La culpa de no estar produciendo», «El rendimiento», «Correr detrás del objetivo» y «Estar distraído». BAJARLO A MI LADO: «Unos mates», «Pasear con Rita», «Hacer música con amigos», «Abrazar a mi novia» y «Volver a la naturaleza de las cosas».',
    ],
    [ // 1 · the spinners
      'Tres ruedas de carga giran a los costados del mono, cada una sobre un lugar donde bajó algo. Hay que ir hasta ellas: de lejos no se pueden tocar.',
      'Una está arriba a la izquierda, detrás del mono (sobre el mate); otra abajo a la izquierda, a su costado (sobre la correa de Rita); la tercera a la derecha, detrás (sobre la guitarra). En cada una elegí qué merece tu atención.',
      'En cada rueda elegí lo de abajo, no la rueda: EL MATE, LA CORREA DE RITA y LA GUITARRA. «Decidir qué merece nuestra atención».',
    ],
    [ // 2 · the ending
      'Los pensamientos tienen su lugar y las ruedas están quietas. Falta lo que pide el capítulo: sentarse frente al fuego del hogar.',
      'Tocá las llamas de su cabeza. Mirar cómo se apagan las brasas lleva su tiempo: un toque empieza la cuenta y otro la corta.',
      'Tocá las llamas y dejá correr MIRAR LAS BRASAS hasta el final, sin interrumpirlo.',
    ],
  ],
  hots: {
    'rm-pensamiento': {
      view: 'pensamiento',
      label: (rm) => `Un pensamiento sube por las llamas: «${rm.def().textOf(rm.s)}»`,
      on: (rm) => !!rm.s && rm.def().phase(rm.s) === 'thoughts',
    },
    ...Object.fromEntries(CP_SPOTS.map((sp, k) => [`rm-giro-${k}`, {
      label: () => `Una rueda de carga que gira ${sp.name}, sobre ${sp.thing}`,
      on: (rm) => rm.def().spinOn(rm.s, k),
      tap: (rm) => rm.def().look(rm, k),
    }])),
    'rm-llamas': {
      view: 'brasas',
      label: (rm) => (rm.s && rm.s.done ? 'Las brasas: hoy estoy triste, y no está mal' : 'Las llamas de su cabeza, para sentarse a mirar cómo se apagan las brasas'),
      on: (rm) => !!rm.s && (rm.s.done || rm.def().phase(rm.s) === 'finale'),
    },
  },
  says: {
    fuego: (t, n) => `«${t}»: eso es lo que te hace correr. Que arda. ${n} de 10.`,
    lado: (t, th, n) => `«${t}»: eso es lo que querés vivir. Baja ${CP_SPOTS[th.spot].land}. ${n} de 10.`,
    wrongFuego: (t) => `«${t}»: eso se quema, a tu lado no da calor. Vuelve a subir.`,
    wrongLado: (t) => `«${t}»: eso no se quema, es lo que querés vivir. Vuelve a subir.`,
    next: (t) => `Ahora sube: «${t}».`,
    all: 'Los diez pensamientos tienen su lugar: lo que quema, en el fuego; lo que querés vivir, a tu lado. Tres ruedas de carga giran a los costados del mono: hay que ir hasta ellas.',
    thing: (th, n) => `Mirás ${th}, no la rueda: la rueda se detiene y queda quieta, como una estrella. ${n} de 3.`,
    wheel: 'La rueda sigue girando: es la atención del sistema, corriendo detrás del objetivo. Mirá lo que hay debajo.',
    stills: 'Las tres ruedas están quietas: decidiste qué merece tu atención. Falta sentarse a mirar cómo se apagan las brasas.',
    watch: 'Las llamas bajan despacio. Un toque más y la cuenta se corta.',
    fin: 'Hoy estoy triste. Y no está mal. Las llamas bajan hasta las brasas, el oro cae y la mano se aparta de la sien.',
  },
  lines: {
    far: 'Está demasiado lejos para decidir. Caminá hasta ahí.',
    near: 'Cerca tuyo gira una rueda de carga. Tocala.',
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, said: [], spun: [], done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, said: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], spun: [0, 1, 2], done: true }; },
  /** What the player does next: thoughts, spinners, finale, done. */
  phase(s) { return s.done ? 'done' : s.said.length < 10 ? 'thoughts' : s.spun.length < 3 ? 'spinners' : 'finale'; },
  stageOf(s) { return { thoughts: 0, spinners: 1, finale: 2, done: 3 }[this.phase(s)]; },
  spinOn(s, k) { return !!s && this.phase(s) === 'spinners' && !s.spun.includes(k); },
  /** The thought that rises now: the unresolved ones in the card order, the first after the `rot` thoughts that were sent back (they come again, later). */
  rot: 0,
  curOf(s) { const left = CP_THOUGHTS.map((t, i) => i).filter((i) => !s.said.includes(i)); return left.length ? left[this.rot % left.length] : -1; },
  textOf(s) { const c = s ? this.curOf(s) : -1; return c >= 0 ? CP_THOUGHTS[c].text : ''; },
  /** A strict reader of what was saved: each part is read only while it makes sense after the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (Array.isArray(raw.said)) for (const k of raw.said) { if (!int(k, 0, 9) || f.said.includes(k)) break; f.said.push(k); } // (the valid prefix: the thoughts are decided one at a time, in any order)
    if (f.said.length === 10 && Array.isArray(raw.spun)) for (const k of raw.spun) { if (!int(k, 0, 2) || f.spun.includes(k)) break; f.spun.push(k); } // (the spinners only after the ten thoughts)
    f.done = raw.done === true && f.spun.length === 3;
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** The spinners are still but the flames still burn (the dev panel and the checks). */
  almost(s) { s.said = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; s.spun = [0, 1, 2]; s.stage = 2; return s; },
  /** The room is solved: every thought in its place, the three spinners still, the flames burnt down (a state that `normalize` keeps). */
  onSolved(s) { this.almost(s); s.stage = 3; world.room.v = this.vOf(s); },
  debug(s) {
    const info = R && R.roomInfo ? R.roomInfo() : null;
    return { phase: this.phase(s), said: s.said.join(','), spun: s.spun.join(','), cur: this.curOf(s), spotDist: info ? info.spotDist : null };
  },
  /** What the set shows for a state (its targets). */
  vOf(s) {
    return {
      phase: this.phase(s), cur: this.curOf(s), said: CP_THOUGHTS.map((t, i) => (s.said.includes(i) ? 1 : 0)), spun: [0, 1, 2].map((k) => (s.spun.includes(k) ? 1 : 0)),
      fin: s.done ? 1 : 0, watch: 0, wrong: 0,
    };
  },
  /** The set shows the saved state. */
  visual(s) { this.rot = 0; this.clearPulses(); this.heard = [false, false, false]; Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a thing in flight is kept: the set flies what was resolved or sent back). */
  refresh(s, wrong) { const o = world.room.v || {}, v = this.vOf(s); v.watch = o.watch || 0; v.wrong = (o.wrong || 0) + (wrong ? 1 : 0); world.room.v = v; syncUI(); },
  pulseT: {},
  clearPulses() { for (const t of Object.values(this.pulseT)) clearTimeout(t); this.pulseT = {}; },
  /** The room's walker: says when a spinner shows itself (a screen reader hears it too). */
  onArrive(room) {
    this.heard = [false, false, false]; this.nearKey = '';
    const tick = () => {
      if (!room.id || room.def() !== this) return; // (the floor was left: a new arrival starts its own)
      const s = room.s, info = Room.info();
      if (s && info && room.here() && !room.busy && !App.overlay && this.phase(s) === 'spinners') {
        const key = [0, 1, 2].map((k) => (!s.spun.includes(k) && info.spotDist[k] < this.near ? 1 : 0)).join(''); // (a hotspot shows only when the UI syncs: it does when one comes within reach or goes out of it)
        if (key !== this.nearKey) { this.nearKey = key; syncUI(); }
        for (let k = 0; k < 3; k++) if (!s.spun.includes(k) && !this.heard[k] && info.spotDist[k] < this.near) { this.heard[k] = true; hint(this.lines.near, 4600); live(this.lines.near); break; }
      }
      room.later(tick, 450);
    };
    room.later(tick, 450);
  },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const s = room.s;
    if (s.done) return this.donePanel(room, 'LAS BRASAS · HOY ESTOY TRISTE');
    if (view.startsWith('giro-')) return this.spinPanel(room, +view.slice(5));
    if (view === 'brasas') return this.watchPanel(room);
    return this.thoughtPanel(room);
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
  thoughtPanel(room) {
    const d = this, s = room.s, c = this.curOf(s);
    return {
      title: 'UN PENSAMIENTO EN LAS LLAMAS', status: c < 0 ? this.says.all : `«${CP_THOUGHTS[c].text}». ¿Lo dejás arder, o lo bajás a tu lado? Quedan ${10 - s.said.length}.`,
      build(el) {
        room.btn(el, 'DEJAR QUE ARDA', 'arder', () => d.decide(room, 'fuego'), { wide: true });
        room.btn(el, 'BAJARLO A MI LADO', 'bajar', () => d.decide(room, 'lado'), { wide: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  spinPanel(room, k) {
    const d = this, sp = CP_SPOTS[k];
    return {
      title: 'UNA RUEDA DE CARGA', status: `Una rueda gira ${sp.name}. Debajo está ${sp.thing}. ¿Qué merece tu atención?`,
      build(el) {
        const wheel = () => room.btn(el, 'LA RUEDA', 'rueda', () => d.attend(room, k, false), { wide: true, aria: 'Atender a la rueda que gira' });
        const thing = () => room.btn(el, sp.thing.toUpperCase(), 'cosa', () => d.attend(room, k, true), { wide: true, aria: `Atender a ${sp.thing}, debajo de la rueda` });
        if (k % 2 === 0) { wheel(); thing(); } else { thing(); wheel(); } // (the buttons are not always in the same order)
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },
  watchPanel(room) {
    const d = this;
    return {
      title: 'LAS BRASAS', status: 'Sentate frente al fuego del hogar y mirá cómo se apagan las brasas. Un toque empieza la cuenta; otro la corta.',
      build(el) {
        room.btn(el, 'MIRAR LAS BRASAS', 'brasas', (b) => { room.hold(b, 6000, 'MIRAR LAS BRASAS', () => d.burn(room), () => d.unwatch()); if (world.room.v) world.room.v.watch = room.holdCancel ? 1 : 0; if (room.holdCancel) { room.say(d.says.watch); live(d.says.watch); } }, { wide: true, keepHold: true });
        room.btn(el, 'VOLVER', 'volver', () => room.go('wide'), { wide: true });
      },
    };
  },

  // ---- the moves ----
  /** The distance (m) from the walker to a spinner, as the set measures it. Infinity when it is not known: unknown is out of reach. */
  dist(k) { const info = Room.info(), d = info ? info.spotDist[k] : NaN; return Number.isFinite(d) ? d : Infinity; },
  /** A look at a spinner: it must be near (the hotspot is shown only near, and the tap is gated too). */
  look(room, k) {
    if (!this.spinOn(room.s, k)) return;
    if (this.dist(k) > this.reach) { hint(this.lines.far, 3600); live(this.lines.far); return; }
    room.go(`giro-${k}`);
  },
  /** A thought is decided: into the fire (DEJAR QUE ARDA) or by his side (BAJARLO A MI LADO). The right one is settled; the wrong one goes back up and comes again later. */
  decide(room, where) {
    const s = room.s;
    if (this.phase(s) !== 'thoughts') return;
    const c = this.curOf(s), th = CP_THOUGHTS[c];
    if (where !== th.kind) {
      s.tries++; room.save(); Sound.buzz(); this.rot++;
      this.refresh(s, true);
      const line = `${th.kind === 'lado' ? this.says.wrongLado(th.text) : this.says.wrongFuego(th.text)} ${this.says.next(this.textOf(s))}`;
      room.renderPanel(); room.say(line); live(line);
      return;
    }
    s.said.push(c); s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.3);
    this.refresh(s);
    const n = s.said.length;
    if (n < 10) {
      const line = `${th.kind === 'fuego' ? this.says.fuego(th.text, n) : this.says.lado(th.text, th, n)} ${this.says.next(this.textOf(s))}`;
      room.renderPanel(); room.say(line); live(line);
      return;
    }
    const line = `${th.kind === 'fuego' ? this.says.fuego(th.text, n) : this.says.lado(th.text, th, n)} ${this.says.all}`;
    room.renderPanel(); room.say(line); live(line);
    room.later(() => { if (room.view === 'pensamiento') room.go('wide'); }, 3600);
  },
  /** A spinner is decided: the thing below it stills it (a star); the wheel keeps spinning and counts a try. */
  attend(room, k, thing) {
    const s = room.s;
    if (!this.spinOn(s, k)) return;
    if (!thing) { s.tries++; room.save(); Sound.buzz(); room.say(this.says.wheel); live(this.says.wheel); return; }
    s.spun.push(k); s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
    this.refresh(s);
    const n = s.spun.length, line = n < 3 ? this.says.thing(CP_SPOTS[k].thing, n) : `${this.says.thing(CP_SPOTS[k].thing, n)} ${this.says.stills}`;
    room.renderPanel(); room.say(line); live(line);
    room.later(() => { if (room.view === `giro-${k}`) room.go('wide'); }, n < 3 ? 2400 : 3200);
  },
  /** The hold was interrupted: the flames come back up. */
  unwatch() { if (world.room.v) world.room.v.watch = 0; },
  /** The slow hold ran out: the flames burn down to embers, the gold falls and the hand leaves the temple. */
  burn(room) {
    const s = room.s;
    if (!s || s.done || this.phase(s) !== 'finale') return;
    room.anim(async (c) => {
      Sound.thunk(); room.flash(0.5);
      world.room.v.fin = 1; world.room.v.watch = 0; syncUI();
      room.say(this.says.fin); live(this.says.fin);
      await c.wait(rm(5.2));
      room.later(() => room.solve(), 40);
    });
  },
};
