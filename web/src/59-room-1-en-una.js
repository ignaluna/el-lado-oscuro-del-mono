// Floor 1 · «En una» · chapter 1 · a reality simulated by a computer: the cover, walkable, and an escape-room challenge in it.
//   1. The screen shows an asterisk of eight spokes that asks for a code (toggle spokes, PROBAR).
//   2. The code is in the cone of dots: it lines up only from the eyes of the one with the visor ("MIRAR POR SU VISOR"):
//      eight digits on a ring, from the top, clockwise: 1 0 1 1 0 0 1 0 (1 = a lit spoke, 0 = a dark one).
//   3. The screen becomes a clock, stuck. The cup, turned over, shows 11:11 (the drawing's signature). Set the clock to 11:11:
//      the machine stops (data, sparks, hands, the screen).
//   4. The dark screen is a mirror: the mono. Staying with the look ("MIRARLO DE NUEVO", a slow count) solves the floor:
//      the page and the chapter, once (Trial.finish).
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['en-una'] = {
  aim: { x: 0, y: 2.2, z: 10, sx: 0.42, sy: 0.4 },
  intro: 'La data baja desde arriba. La ilusión de elegir. El algoritmo ya está escrito.',
  clue: 'La data baja desde arriba. La ilusión de elegir.\nEl algoritmo ya está escrito.\nEl mono te observa desde adentro del vidrio.',
  done: 'Lo miraste de nuevo. Te acordaste de quién eras.',
  code: [1, 0, 1, 1, 0, 0, 1, 0],
  time: [1, 1, 1, 1],
  start: [0, 3, 4, 7],
  spokes: ['ARRIBA', 'ARRIBA DER.', 'DERECHA', 'ABAJO DER.', 'ABAJO', 'ABAJO IZQ.', 'IZQUIERDA', 'ARRIBA IZQ.'],
  spokeSpoken: ['arriba', 'arriba a la derecha', 'a la derecha', 'abajo a la derecha', 'abajo', 'abajo a la izquierda', 'a la izquierda', 'arriba a la izquierda'],
  hints: [
    [ // 0 · the screen asks for a code
      'La pantalla es un asterisco de ocho rayos, y pide un código de ocho cifras. ¿Dónde hay cifras en este dibujo?',
      'Los puntos del cono se ordenan solos desde un único lugar: los ojos de quien mira por el visor. Acercate a él y probá «Mirar por su visor».',
      'Desde el visor se leen ocho cifras en círculo, desde arriba y en el sentido del reloj: 1 0 1 1 0 0 1 0. Un 1 es un rayo encendido; un 0, uno apagado. Después, PROBAR.',
    ],
    [ // 1 · the clock
      'El reloj quedó detenido en una hora cualquiera. Hay una hora que se repite en este dibujo.',
      'Mirá abajo a la derecha, en el piso, y la taza de café de la mesa: lo escondido en su fondo es lo mismo.',
      'Dale vuelta a la taza: dice 11:11. Poné el reloj en 11:11 y tocá PONER EN HORA.',
    ],
    [ // 2 · the mirror
      'La pantalla se apagó. En el vidrio hay alguien.',
      'El capítulo dice qué espera el mono: que lo mires de nuevo.',
      'Tocá MIRARLO DE NUEVO y quedate mirando, sin apuro, hasta que termine la cuenta. Si tocás otra cosa, se interrumpe.',
    ],
  ],
  hots: {
    'rm-screen': { view: 'screen', label: (r) => `La pantalla de la máquina: ${!r.s ? 'un asterisco de ocho rayos' : r.s.done ? 'el mono te mira' : r.s.stage === 0 ? 'un asterisco de ocho rayos' : r.s.stage === 1 ? 'un reloj detenido' : 'oscura, algo se ve en el vidrio'}` },
    'rm-visor': { view: 'visor', label: () => 'El que mira por un visor dorado hacia el cono de puntos' },
    'rm-cup': { view: 'cup', label: (r) => (r.s && r.s.cupTurned ? 'La taza de café, dada vuelta' : 'Una taza de café con vapor') },
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, spokes: [0, 0, 0, 0, 0, 0, 0, 0], clock: [0, 3, 4, 7], cupTurned: false, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, done: true, spokes: this.code.slice(), clock: this.time.slice() }; },
  normalize(raw) {
    const f = this.fresh();
    if (!raw || raw.v !== 1) return f;
    f.stage = clamp(Math.round(raw.stage) || 0, 0, 3);
    if (Array.isArray(raw.spokes) && raw.spokes.length === 8) f.spokes = raw.spokes.map((x) => (x ? 1 : 0));
    if (Array.isArray(raw.clock) && raw.clock.length === 4) f.clock = raw.clock.map((x, i) => clamp(Math.round(x) || 0, 0, i === 2 ? 5 : 9));
    f.cupTurned = !!raw.cupTurned;
    f.done = !!raw.done && f.stage === 3;
    if (f.stage === 3 && !f.done) f.stage = 2;
    f.tries = Number(raw.tries) || 0; f.hints = Number(raw.hints) || 0;
    if (f.stage >= 1) f.spokes = this.code.slice(); // once the code is solved, the asterisk shows it
    if (f.stage >= 2) f.clock = this.time.slice(); // and once the clock is right, the right time
    return f;
  },
  /** The set shows the saved state. */
  visual(s) {
    Object.assign(world.room, { mode: s.stage === 0 ? 'code' : s.stage === 1 ? 'clock' : 'dark', spokes: s.spokes.slice(), clock: s.clock.slice(), cup: s.cupTurned ? 1 : 0, shut: s.stage >= 2 ? 1 : 0, mono: s.stage >= 2 ? 1 : 0, through: 0, page: 0, flash: 0 });
  },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const d = this, s = room.s;
    if (view === 'screen') {
      if (s.done) return {
        title: 'LA PANTALLA · EL MONO', status: COPY.trialDoneBefore,
        build(el) {
          room.btn(el, 'LEER EL CAPÍTULO', 'leer', () => Book.receive(room.track().chapter), { wide: true });
          room.btn(el, 'JUGARLO DE NUEVO', 'otra-vez', () => room.reset(), { wide: true });
        },
      };
      if (s.stage === 0) return { title: 'LA PANTALLA · UN ASTERISCO', status: 'Ocho rayos, encendidos o apagados. Esta pantalla pide un código.', cls: 'rm-ring', build: (el) => d.buildRing(el, room) };
      if (s.stage === 1) return { title: 'LA PANTALLA · UN RELOJ DETENIDO', status: 'El reloj quedó detenido. Tocá cada cifra para cambiarla.', cls: 'rm-clock', build: (el) => d.buildClock(el, room) };
      return {
        title: 'LA PANTALLA · APAGADA', status: 'La pantalla se apagó. En el vidrio hay alguien.',
        build(el) { room.btn(el, 'MIRARLO DE NUEVO', 'mirar', (b) => { room.say('Quedate mirándolo. Sin apuro.'); room.hold(b, 4000, 'MIRÁNDOLO', () => room.solve(), () => room.say('Apartaste la vista. Él sigue ahí.')); }, { wide: true, keepHold: true }); },
      };
    }
    if (view === 'visor') return {
      title: 'EL QUE MIRA', status: 'Un visor dorado sobre los ojos. Mira hacia la máquina, hacia un cono de puntos, círculos y números.',
      build(el) { room.btn(el, 'MIRAR POR SU VISOR', 'mirar-visor', () => room.go('through'), { wide: true }); },
    };
    if (view === 'through') return {
      title: 'POR EL VISOR', status: `Los puntos se ordenan: ${d.code.join(' ')}. Empiezan arriba y siguen en el sentido del reloj.`,
      build(el) { room.btn(el, 'DEJAR DE MIRAR', 'salir', () => room.go('visor'), { wide: true }); },
    };
    return { // the cup
      title: 'LA TAZA', status: s.cupTurned ? 'En el fondo de la taza hay algo escrito: 11:11.' : 'Una taza de café; todavía humea.',
      build(el) {
        room.btn(el, s.cupTurned ? 'ENDEREZAR LA TAZA' : 'DAR VUELTA LA TAZA', 'taza', (b) => {
          s.cupTurned = !s.cupTurned; room.save(); Sound.click();
          Seq.run('rmv', (c) => c.to(world.room, { cup: s.cupTurned ? 1 : 0 }, rm(0.9), Ease.inOutCubic));
          b.textContent = s.cupTurned ? 'ENDEREZAR LA TAZA' : 'DAR VUELTA LA TAZA';
          room.say(s.cupTurned ? 'En el fondo de la taza hay algo escrito: 11:11.' : 'La taza vuelve a su lugar. Todavía humea.');
          Hot.label('rm-cup', room.label('rm-cup'));
        }, { wide: true });
      },
    };
  },

  /** 8 spokes around a PROBAR button, laid out like the asterisk: the top one is the first of the code, then clockwise. */
  buildRing(el, room) {
    const d = this, s = room.s, place = [[1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1], [1, 1]]; // [row, column] of each spoke
    const name = (i) => `Rayo ${i + 1} (${d.spokeSpoken[i]}): ${s.spokes[i] ? 'encendido' : 'apagado'}`;
    for (let i = 0; i < 8; i++) {
      const b = room.btn(el, [h('b', { text: `RAYO ${i + 1}` }), h('small', { text: d.spokes[i] })], `spoke-${i}`, () => {
        s.spokes[i] = s.spokes[i] ? 0 : 1; world.room.spokes[i] = s.spokes[i]; room.save(); Sound.tick();
        b.setAttribute('aria-pressed', String(!!s.spokes[i])); b.setAttribute('aria-label', name(i));
        room.say(`Rayo ${i + 1}, ${d.spokeSpoken[i]}: ${s.spokes[i] ? 'encendido' : 'apagado'}.`);
      }, { aria: name(i), pressed: !!s.spokes[i] });
      b.style.gridArea = `${place[i][0]} / ${place[i][1]}`;
    }
    const t = room.btn(el, 'PROBAR', 'probar', () => d.tryCode(room), { cls: 'rm-test' });
    t.setAttribute('aria-label', 'Probar este código');
  },
  tryCode(room) {
    const s = room.s;
    if (this.code.every((v, i) => v === (s.spokes[i] ? 1 : 0))) {
      room.anim(async (c) => {
        Sound.ding(); room.flash(0.6);
        room.say('La pantalla parpadea. El asterisco se deshace y queda un reloj, detenido.');
        await c.wait(rm(0.7));
        s.stage = 1; s.spokes = this.code.slice(); room.save(); world.room.mode = 'clock';
        room.renderPanel();
      });
      return;
    }
    s.tries++; s.spokes = [0, 0, 0, 0, 0, 0, 0, 0]; room.save();
    Sound.buzz(); room.flash(1);
    for (let i = 0; i < 8; i++) world.room.spokes[i] = 0;
    for (const b of document.querySelectorAll('#rm-acts [data-act^="spoke-"]')) { const i = Number(b.dataset.act.slice(6)); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `Rayo ${i + 1} (${this.spokeSpoken[i]}): apagado`); }
    room.say('Ese no es el código. El algoritmo ya está escrito. Los rayos se apagan.');
  },

  /** Four digit wheels (hour tens and units, minute tens and units) and PONER EN HORA. */
  buildClock(el, room) {
    const d = this, s = room.s, limits = [10, 10, 6, 10], names = ['Hora, decena', 'Hora, unidad', 'Minutos, decena', 'Minutos, unidad'];
    const label = (i) => `${names[i]}: ${s.clock[i]}. Tocá para cambiarla.`;
    const wheel = (i) => {
      const b = room.btn(el, String(s.clock[i]), `wheel-${i}`, () => {
        s.clock[i] = (s.clock[i] + 1) % limits[i]; world.room.clock[i] = s.clock[i]; room.save(); Sound.tick();
        b.textContent = String(s.clock[i]); b.setAttribute('aria-label', label(i));
        room.say(`${s.clock.slice(0, 2).join('')}:${s.clock.slice(2).join('')}`);
      }, { aria: label(i) });
    };
    wheel(0); wheel(1); el.append(h('span', { class: 'rm-colon', text: ':', 'aria-hidden': 'true' })); wheel(2); wheel(3);
    room.btn(el, 'PONER EN HORA', 'hora', () => d.trySet(room), { wide: true });
  },
  trySet(room) {
    const s = room.s;
    if (this.time.every((v, i) => v === s.clock[i])) { this.shutdown(room); return; }
    s.tries++; s.clock = this.start.slice(); room.save();
    for (let i = 0; i < 4; i++) world.room.clock[i] = s.clock[i];
    Sound.buzz(); room.flash(0.8);
    room.renderPanel();
    room.say('El reloj no cambia. Esa no es la hora. Vuelve a marcar la de antes.');
  },
  /** 11:11 — the machine stops: the data, the sparks and the typing; the screen goes dark; then the mirror. */
  shutdown(room) {
    const s = room.s;
    room.anim(async (c) => {
      Sound.thunk(); Sound.whoosh(1.6);
      room.say('11:11. La máquina se detiene. Todo queda en silencio.');
      live('La máquina se detiene.');
      c.spawn((cc) => cc.to(world.room, { shut: 1 }, rm(2.2), Ease.inOutSine));
      await c.wait(rm(1.0));
      world.room.mode = 'dark';
      await c.wait(rm(1.2));
      s.stage = 2; room.save();
      await c.to(world.room, { mono: 1 }, rm(1.8), Ease.inOutSine);
      room.renderPanel();
      room.say('La pantalla quedó oscura. En el vidrio hay alguien.');
    });
  },
};
