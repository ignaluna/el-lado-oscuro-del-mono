// Floor 8 · «No me perdones» · chapter 7 · the void: the cover is dark water with ripples, a small shape sinking in the middle and a star;
//   walkable, and an escape-room in it.
//   1. The star. It is the only light. Walking toward it (or tapping it: each tap is one step) moves it away exactly as far: there is no goal.
//   2. The castles. Three paper castles float in the dark and show only when you are near, so you have to walk to find them (one to the left of
//      the way, one to the right across the water, one far on the left). Unfolding one lays it down on the water as a stretch of road, along the
//      reflection, toward the middle.
//   3. The glass. At the end of the road a glass of water trembles each time a wave breaks. A wave breaks for 1.6 s and pulls back for 2.4 s;
//      the button names the phase, and it is set down while the wave pulls back (or let the room wait for it: ESPERAR).
//   4. The ending. PERDONAME shakes the water again (the ripples grow); NO ME PERDONES calms it, the reflection straightens and the page and
//      chapter 7 come out, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['no-me-perdones'] = {
  aim: { x: NP_SET.x, y: 0.3, z: NP_SET.z, sx: 0.46, sy: 0.56 },
  intro: 'Un vacío negro. Ondas en el agua, una estrella chiquita y un reflejo que baja hacia vos.',
  clue: 'esos castillos de papel que llamé felicidad eran excusas para no detenerme, para no sentir.\nY vos llegaste a decirme, sin palabras, que no hay meta, que solo hay camino.',
  done: 'Pedirte que no me perdones es un gesto de amor.',
  stepM: 1.2, // metres walked toward the star that count as one step
  holdNear: 3.4, // how close (m) a castle shows itself to the walker (announced)
  reach: 4.8, // how close (m) a castle must be to be unfolded
  hints: [
    [ // 0 · the star
      'En la oscuridad hay una estrella chiquita, lejos. Es lo único que brilla. Todo el mundo camina hacia lo que brilla.',
      'Acercate a la estrella: tocala, o caminá hacia ella. Fijate qué pasa con la distancia.',
      'Tocá la estrella tres veces (o caminá hacia ella unos pasos): cada vez que te acercás, se aleja lo mismo. No hay meta. Después buscá en la oscuridad.',
    ],
    [ // 1 · the castles
      'En el vacío flotan castillos de papel, pero solo se ven de cerca. Para encontrarlos hay que caminar.',
      'Hay uno a la izquierda del reflejo, no muy lejos de vos; otro a la derecha, del otro lado del agua; y el último bien lejos, a la izquierda. Cuando se ve uno, tocalo para desarmarlo.',
      'Son tres. Caminá hacia el de la izquierda, después hacia el de la derecha del agua y por último hacia el del fondo, a la izquierda. Tocá cada castillo para desarmarlo: se tiende en el agua como un tramo de camino hacia el centro.',
    ],
    [ // 2 · the glass
      'Al final del camino, en el centro, un vaso de agua tiembla. Las olas rompen, pero no calman.',
      'El vaso tiembla cuando rompe la ola. Hay que esperar a que la ola se retire para apoyarlo.',
      'Mirá el vaso y tocá APOYAR EL VASO cuando el botón diga LA OLA SE RETIRA. Si no llegás a tiempo, tocá ESPERAR A QUE SE RETIRE y se apoya solo.',
    ],
    [ // 3 · the ending
      'El vaso quedó quieto. Falta decir algo, y las dos frases se parecen mucho.',
      'El capítulo termina con una frase sobre el perdón: no se trata de pedirlo, se trata de lo que hay detrás.',
      'Tocá NO ME PERDONES. (PERDONAME agita el agua otra vez.)',
    ],
  ],
  hots: {
    'rm-estrella': {
      label: (r) => `Una estrella chiquita, lejos${r.s && r.s.steps ? `: diste ${r.s.steps} ${r.s.steps === 1 ? 'paso' : 'pasos'} y sigue igual de lejos` : ''}`,
      on: (r) => r.def().starOn(r.s),
      tap: (r) => r.def().approach(r),
    },
    ...Object.fromEntries(NP_CASTLES.map((_, k) => [`rm-castillo-${k}`, {
      label: () => 'Un castillo de papel flotando en la oscuridad',
      on: (r) => r.def().castleOn(r.s, k),
      tap: (r) => r.def().unfold(r, k),
    }])),
    'rm-vaso': {
      view: 'vaso',
      label: (r) => (!r.s ? 'El vaso de agua' : r.s.done ? 'El vaso, quieto sobre el agua' : r.s.placed ? 'El vaso, apoyado en el agua' : 'El vaso de agua, temblando'),
      on: (r) => r.def().glassOn(r.s),
    },
  },
  lines: {
    star: ['Das un paso hacia la estrella. La estrella se aleja un paso.', 'Otro paso. Seguís igual de lejos.', 'No hay meta. Cada paso que das hacia ella, la estrella se aleja lo mismo. En la oscuridad, alrededor, flotan cosas de papel.'],
    near: 'Cerca tuyo flota un castillo de papel. Tocalo para desarmarlo.',
    far: 'Está demasiado lejos para tocarlo. Caminá hasta él.',
    open: 'El papel se abre y queda tendido en el agua: un tramo de camino hacia el centro.',
    last: 'No hay meta. Solo camino. Al final del camino, en el centro, un vaso de agua tiembla.',
    rompe: 'Las olas rompen, pero no calman. El vaso tiembla en tu mano.',
    down: 'La ola se retira y apoyás el vaso. Queda quieto en el agua.',
    grow: 'Las ondas crecen otra vez: pedir perdón agita el agua. Falta decir otra cosa.',
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, steps: 0, open: [], placed: false, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, steps: 3, open: [0, 1, 2], placed: true, done: true }; },
  /** What the player does next: star, castles, glass (set it down), finale (say it), done. */
  phase(s) { return s.done ? 'done' : s.steps < 3 ? 'star' : s.open.length < 3 ? 'castles' : !s.placed ? 'glass' : 'finale'; },
  stageOf(s) { return { star: 0, castles: 1, glass: 2, finale: 3, done: 3 }[this.phase(s)]; },
  starOn(s) { return !!s && !s.done && s.steps < 3; },
  castleOn(s, k) { return !!s && !s.done && s.steps >= 3 && s.open.length < 3 && !s.open.includes(k); },
  glassOn(s) { return !!s && s.steps >= 3 && s.open.length === 3; },
  /** A strict reader of what was saved: each part is read only while it makes sense after the ones before it; what does not is dropped. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (int(raw.steps, 0, 3)) f.steps = raw.steps;
    if (f.steps === 3 && Array.isArray(raw.open)) for (const k of raw.open) { if (!int(k, 0, 2) || f.open.includes(k)) break; f.open.push(k); } // (the valid prefix: castles are unfolded one at a time, in any order)
    f.placed = raw.placed === true && f.open.length === 3;
    f.done = raw.done === true && f.placed;
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** The glass is set down but the last word is still to come (the dev panel and the checks). */
  almost(s) { s.steps = 3; s.open = [0, 1, 2]; s.placed = true; s.stage = 3; return s; },
  /** The room is solved: the star left behind, the three castles unfolded, the glass down (a state that `normalize` keeps). */
  onSolved(s) { s.steps = 3; s.open = [0, 1, 2]; s.placed = true; world.room.v = this.vOf(s); },
  debug(s) { return { steps: s.steps, open: s.open.join(','), placed: s.placed, phase: this.phase(s), wave: this.glassPhase(), waveS: this.glassPhase() ? +npWave(world.room.v.t0).s.toFixed(2) : null, castleDist: NP_CASTLES.map((_, k) => +this.castleDist(k).toFixed(2)) }; },
  glassPhase() { const v = world.room.v; return v && v.t0 ? npWave(v.t0).phase : null; },
  /** Where the walker stands from a castle (m). */
  castleDist(k) { const w = npWorld(NP_CASTLES[k].x, NP_CASTLES[k].z); return Math.hypot(world.cam.x - w.x, world.cam.z - w.z); },
  /** What the set shows for a state (its targets). */
  vOf(s) {
    const all = s.steps >= 3 && s.open.length === 3;
    if (!this.t0) this.t0 = performance.now();
    return { steps: s.steps, far: s.steps >= 3 ? 1 : 0, castles: s.steps >= 3 && s.open.length < 3 && !s.done ? 1 : 0, open: [0, 1, 2].map((k) => (s.open.includes(k) ? 1 : 0)), slot: [0, 1, 2].map((k) => s.open.indexOf(k)),
      glass: all ? 1 : 0, down: s.placed || s.done ? 1 : 0, wave: all && !s.placed && !s.done ? 1 : 0, t0: this.t0, grow: 0, calm: s.done ? 1 : 0 };
  },
  /** The set shows the saved state (a room that starts again also forgets the metres walked toward the star). */
  visual(s) { if (s.steps === 0) this.walked = 0; Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const o = world.room.v || {}, v = this.vOf(s); v.grow = o.grow || 0; world.room.v = v; syncUI(); },
  /** The room's walker: counts the metres walked toward the star as steps, and says when a castle shows itself (a screen reader hears it too). */
  onArrive(room) {
    this.heard = [false, false, false];
    this.walked = 0; this.lastZ = null;
    const tick = () => {
      if (!room.id || room.def() !== this) return; // (the floor was left: a new arrival starts its own)
      const s = room.s;
      if (s && room.here() && !room.busy && !App.overlay) {
        if (this.starOn(s)) { // every stepM metres walked toward the star (free walking, forward) is one step, as a tap on it is
          if (this.lastZ !== null && Roam.scene() === 'floor') this.walked += Math.max(0, world.cam.z - this.lastZ);
          if (this.walked >= this.stepM) { this.walked -= this.stepM; this.advance(room, s.steps + 1); }
        }
        else if (this.phase(s) === 'castles') for (let k = 0; k < 3; k++) if (!s.open.includes(k) && !this.heard[k] && this.castleDist(k) < this.holdNear) { this.heard[k] = true; hint(this.lines.near, 4200); live(this.lines.near); break; }
      }
      this.lastZ = world.cam.z;
      room.later(tick, 450);
    };
    room.later(tick, 450);
  },

  // ---- what the plate offers in the close look at the glass ----
  panel(room, view) {
    const s = room.s;
    if (s.done) return this.donePanel(room, 'EL VASO · QUIETO');
    return s.placed ? this.finalePanel(room) : this.glassPanel(room);
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
  glassPanel(room) {
    const d = this;
    return {
      title: 'EL VASO · TIEMBLA', status: 'Un vaso de agua tiembla cada vez que rompe una ola. Las olas rompen, pero no calman. Hay que apoyarlo cuando la ola se retira.',
      build(el) {
        const b = room.btn(el, 'APOYAR EL VASO', 'apoyar', () => d.setDown(room), { wide: true });
        const sync = () => { // the button says in words what the wave is doing now (a breaking wave: not yet; pulling back: now)
          if (!b.isConnected) return;
          const ph = d.glassPhase(), txt = ph === 'rompe' ? 'APOYAR EL VASO · LA OLA ROMPE' : 'APOYAR EL VASO · LA OLA SE RETIRA';
          if (b.textContent !== txt) { b.textContent = txt; b.dataset.ok = ph === 'retira' ? '1' : '0'; }
          room.later(sync, 100);
        };
        sync();
        room.btn(el, 'ESPERAR A QUE SE RETIRE', 'esperar', () => {
          const w = npWave(world.room.v.t0), T = NP_WAVE.rompe + NP_WAVE.retira, left = T - w.s; // (wait for a wave that is about to pull back, or for the next one when this one is about to break again)
          const wait = w.phase === 'rompe' ? NP_WAVE.rompe - w.s + 0.25 : left < 0.7 ? left + NP_WAVE.rompe + 0.25 : 0.05;
          room.say('Esperás a que la ola se retire.');
          room.later(() => d.setDown(room), wait * 1000);
        }, { wide: true });
      },
    };
  },
  finalePanel(room) {
    const d = this, s = room.s;
    return {
      title: 'EL VASO · APOYADO', status: 'El vaso quedó quieto en el agua. Falta decir algo. ¿Qué le decís?',
      build(el) {
        room.btn(el, 'PERDONAME', 'perdoname', () => {
          s.tries++; room.save(); Sound.buzz(); room.flash(0.5);
          const v = world.room.v; v.grow = 1; room.later(() => { if (world.room.v) world.room.v.grow = 0; }, 2800); // (a pulse: the ripples grow and settle)
          room.say(d.lines.grow); live(d.lines.grow);
        }, { wide: true });
        room.btn(el, 'NO ME PERDONES', 'no-perdones', () => { room.flash(0.5); room.solve(); }, { wide: true });
      },
    };
  },

  // ---- the moves ----
  /** One step toward the star (the count goes up to `n`): the star moves away as far. */
  advance(room, n) {
    const s = room.s;
    if (!this.starOn(s) || n <= s.steps) return;
    s.steps = Math.min(3, n); s.stage = this.stageOf(s); room.save(); Sound.tick();
    this.refresh(s);
    const line = this.lines.star[s.steps - 1];
    hint(line, 5200); live(line);
  },
  /** A tap on the star: one step toward it (the visitor walks it), and it moves away as far. */
  approach(room) {
    const s = room.s;
    if (!this.starOn(s)) return;
    room.anim(async (c) => {
      bakeWalk();
      const cam = world.cam, dx = -cam.x, dz = NP_ZC + s.steps, // (toward the star: straight ahead, the way the room faces)
        L = Math.hypot(dx, dz) || 1, nx = cam.x + (dx / L) * this.stepM, nz = cam.z + (dz / L) * this.stepM;
      await c.to(cam, { x: nx, z: nz }, rm(0.9), Ease.inOutSine);
      if (R && R.ripple) R.ripple(cam.x, cam.z - 0.3, 0.16);
      this.advance(room, s.steps + 1);
      this.lastZ = world.cam.z; // (the metres of this step are not walked again by the watcher)
    });
  },
  /** A castle that is near, unfolded: it lies down on the water as the next stretch of road. */
  unfold(room, k) {
    const s = room.s;
    if (!this.castleOn(s, k)) return;
    if (this.castleDist(k) > this.reach) { hint(this.lines.far, 3600); live(this.lines.far); return; }
    s.open.push(k); s.stage = this.stageOf(s); room.save(); Sound.thunk(); room.flash(0.4);
    this.refresh(s);
    const left = 3 - s.open.length, line = left ? `${this.lines.open} ${left === 1 ? 'Falta un castillo.' : `Faltan ${left} castillos.`}` : this.lines.last;
    hint(line, 5600); live(line);
  },
  /** The glass is set down: only while the wave pulls back. */
  setDown(room) {
    const s = room.s;
    if (!s || s.done || s.placed || this.phase(s) !== 'glass') return;
    if (this.glassPhase() === 'rompe') { s.tries++; room.save(); Sound.buzz(); room.say(this.lines.rompe); live(this.lines.rompe); return; }
    s.placed = true; s.stage = this.stageOf(s); room.save();
    room.anim(async (c) => {
      Sound.thunk(); room.flash(0.5); this.refresh(s);
      room.say(this.lines.down); live(this.lines.down);
      await c.wait(rm(1.3));
      room.renderPanel(); room.say(this.lines.down);
    });
  },
};
