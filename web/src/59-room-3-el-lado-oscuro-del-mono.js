// Floor 3 · «El lado oscuro del mono» · chapter 3 · the scream: the cover is a huge screaming mouth, walkable, and an escape-room in it.
//   1. The body warns. Three signs are hidden in the drawing, to be noticed in the order the chapter names them: heat (the ink
//      splatter, warm to the touch), tension (the fur, bristling), the word pushing (the tag that grows out of the mouth). Out of
//      order and what was noticed is lost ("No siempre llego."). With the three, the tag freezes half out of the mouth.
//   2. Swallow the word: a slow count on the tag ("TRAGAR LA PALABRA"; one tap starts it, another interrupts it) coils it back into
//      the mouth. Touching the tag instead lets "Callate." out and breaks one more tooth (one more ✗, one more shard).
//   3. Gather the pieces. Shards of tooth float on the water around the board, as many as there are crossed-out teeth (3, plus one
//      per break): walk, look to the sides, take each one. In the mouth, set a shard into a crossed-out tooth: it turns gold, the crack
//      kept in sight (kintsugi: forgiveness does not erase the break, it mends it in the open).
//   4. When the last tooth is mended the mouth calms and says "perdón.": the page and chapter 3, once.
// The words keep the book's own: clue and done are verbatim chapter text; the hints are new prose.
ROOMS['el-lado-oscuro-del-mono'] = {
  water: PLAIN_WATER, // the cover is plain black paper: no reflection, engraved rows, floor light, glints or horizon in the arrival view (see PLAIN_WATER)
  /** The camera looks at a row of the cover (the set's lens depends on the screen); the set's z never changes. */
  get aim() { const L = gsLens(aspectNow()); return { x: GS_SET.x, y: GS.H + ((L.yh - L.row) * GS.Z0) / L.f, z: GS_SET.z, sx: L.sx, sy: L.sy }; },
  intro: 'Una boca enorme grita. A veces el cuerpo avisa.',
  clue: 'A veces el cuerpo avisa.\nCalor. Tensión. La palabra empujando.\n“Callate.”',
  done: 'Perdón. No alcanza, ya sé. Pero es lo único que tengo.',
  order: ['calor', 'tension', 'palabra'], // the clue's order
  base: 3, // teeth crossed out from the start
  slots: GRITO_BREAK.length, // the most that can be crossed out (the set's tooth slots, and its shard spots)
  holdMs: 5000,
  hints: [
    [ // 0 · the body warns
      'La boca grita y todo el dibujo vibra. El capítulo empieza así: a veces el cuerpo avisa. Hay tres señales escondidas alrededor de la boca.',
      'Buscalas en el mismo orden en que el capítulo las nombra: calor, tensión, la palabra empujando. Hay tinta salpicada, pelo erizado y una firma que sale del grito.',
      'En orden: 1, calor: acercá la mano a las salpicaduras de tinta. 2, tensión: pasá la mano por el pelo erizado. 3, la palabra empujando: escuchá la firma que sale de la boca.',
    ],
    [ // 1 · the tag stands half out of the mouth
      'La firma quedó a medias, quieta, medio afuera de la boca. Después de las señales viene «Callate.» y hay que decidir qué hacer con la palabra.',
      'Gritarla rompe algo: ya pasó otras veces. La otra salida es quedarse con ella: tragarla, sin apuro, hasta que vuelva a la boca.',
      'En la firma, tocá TRAGAR LA PALABRA y esperá a que termine la cuenta (si tocás otra cosa, se interrumpe). TOCAR LA FIRMA deja salir «Callate.» y rompe otro diente.',
    ],
    [ // 2 · the shards and the teeth
      'Hay dientes con una ✗ y pedazos de diente flotando sobre el agua. Los pedazos están lejos de la boca: hay que girar, caminar y mirar a los costados.',
      'Juntá todos los pedazos que brillan (hay uno por cada ✗) y llevalos a la boca. Cada pedazo encastrado deja el diente dorado: no borra la rotura, la repara a la vista.',
      'Tocá cada pedazo sobre el agua hasta juntarlos todos. Después, en la boca, ENCASTRAR UN PEDAZO por cada diente con ✗.',
    ],
  ],
  hots: {
    'rm-salpicadura': { view: 'tinta', label: (r) => `Salpicaduras de tinta junto a la boca${r.s && r.s.noticed.includes('calor') ? ', tibias' : ''}` },
    'rm-pelo': { view: 'pelo', label: (r) => `El pelo alrededor de la boca, erizado${r.s && r.s.noticed.includes('tension') ? ', tenso' : ''}` },
    'rm-firma': { view: 'firma', label: (r) => `Una firma garabateada que sale de la boca${r.s && r.s.swallowed ? ', ya adentro' : r.s && r.s.noticed.length >= 3 ? ', quieta a medias' : ''}` },
    'rm-dientes': {
      view: 'dientes',
      label: (r) => {
        const d = r.def(), s = r.s;
        if (!s) return 'La boca abierta, a los gritos';
        return s.done ? 'La boca, con los dientes remendados con oro' : `La boca abierta, a los gritos: ${d.need(s) - s.fixed} dientes con una ✗`;
      },
    },
    ...Object.fromEntries(Array.from({ length: GRITO_BREAK.length }, (_, i) => [`rm-pieza-${i}`, {
      label: () => `Un pedazo de diente flotando sobre el agua (${i + 1})`,
      on: (r) => r.def().shardOn(r.s, i),
      tap: (r) => r.def().collect(r, i),
    }])),
  },
  /** What each sign says, what its button does, and what the room answers. */
  signs: {
    calor: { view: 'tinta', title: 'LA TINTA · SALPICADURAS', open: 'Salpicaduras de tinta alrededor de la boca. Parecen secas, pero algo en ellas late.', shut: 'La tinta está tibia, como una piel con fiebre.', btn: 'ACERCAR LA MANO', done: 'YA LO SENTISTE', did: 'Calor. La tinta está tibia, como una piel con fiebre.' },
    tension: { view: 'pelo', title: 'EL PELO · ERIZADO', open: 'El pelo alrededor de la boca está parado, cada hebra tensa, como un animal antes de saltar.', shut: 'Cada pelo está parado. Me tenso.', btn: 'PASAR LA MANO', done: 'YA LO SENTISTE', did: 'Tensión. Cada pelo se para. Me tenso, me incomoda.' },
    palabra: { view: 'firma', title: 'LA FIRMA · SALE DE LA BOCA', open: 'Un garabato que sale de la boca y crece, y se encoge, y vuelve a crecer. Parece que empuja.', shut: 'La firma quedó a medias, quieta, medio afuera.', btn: 'ESCUCHAR LA FIRMA', done: 'YA LA ESCUCHASTE', did: 'La palabra empujando. La firma se frena a medias, quieta, medio afuera de la boca.' },
  },
  lines: {
    wrong: 'No siempre llego. Lo que notaste se borra: el cuerpo avisa en el orden en que lo cuenta el capítulo.',
    frozen: 'Las tres señales, en orden. La firma quedó quieta. Ahora hay que decidir qué hacer con la palabra.',
    swallowed: 'Tragás la palabra. Vuelve adentro de la boca y se queda quieta. No salió. Los pedazos de antes siguen flotando sobre el agua.',
    held: 'Soltaste. La palabra sigue ahí, a medias, medio afuera.',
    broke: '«Callate.» La palabra salió. Rompo otra vez. Pierdo otra vez. Otro diente se rajó y quedó con su ✗; otro pedazo cayó al agua.',
    brokeMax: '«Callate.» La palabra salió otra vez. Ya no queda diente sano para romper, pero lo roto pesa igual.',
  },

  // ---- state ----
  fresh() { return { v: 1, stage: 0, noticed: [], swallowed: false, breaks: 0, taken: [], fixed: 0, done: false, tries: 0, hints: 0 }; },
  solvedState() { return { ...this.fresh(), stage: 3, noticed: this.order.slice(), swallowed: true, taken: [0, 1, 2], fixed: 3, done: true }; },
  need(s) { return this.base + s.breaks; },
  stageOf(s) { return s.done ? 3 : s.swallowed ? 2 : s.noticed.length >= 3 ? 1 : 0; },
  shardOn(s, i) { return !!(s && s.swallowed && !s.done && i < this.need(s) && !s.taken.includes(i)); },
  /** A strict reader of what was saved: only a valid prefix of each part survives, whatever else the saved text says. */
  normalize(raw) {
    const f = this.fresh();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return f;
    if (Array.isArray(raw.noticed)) for (const id of raw.noticed) { if (id === this.order[f.noticed.length]) f.noticed.push(id); else break; } // (a prefix of the order: no repeats, nothing out of turn)
    if (f.noticed.length < 3) { f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0); f.stage = this.stageOf(f); return f; }
    const validBreaks = Number.isInteger(raw.breaks) && raw.breaks >= 0 && raw.breaks <= this.slots - this.base;
    if (validBreaks) f.breaks = raw.breaks; // (a count that makes no sense says nothing about what came after: that is dropped)
    const need = this.need(f);
    if (validBreaks && raw.swallowed === true) {
      f.swallowed = true;
      if (Array.isArray(raw.taken)) for (const i of raw.taken) if (Number.isInteger(i) && i >= 0 && i < need && !f.taken.includes(i)) f.taken.push(i);
      f.fixed = Number.isInteger(raw.fixed) && raw.fixed >= 0 && raw.fixed <= f.taken.length ? raw.fixed : 0; // (a tooth is mended with a shard in hand)
      f.done = raw.done === true && f.fixed === need;
    }
    f.tries = Math.max(0, Math.round(Number(raw.tries)) || 0); f.hints = Math.max(0, Math.round(Number(raw.hints)) || 0);
    f.stage = this.stageOf(f);
    return f;
  },
  /** Every tooth mended but the last, the shard in hand (the dev panel and the checks). */
  almost(s) { s.noticed = this.order.slice(); s.swallowed = true; const need = this.need(s); s.taken = Array.from({ length: need }, (_, i) => i); s.fixed = need - 1; s.stage = 2; return s; },
  /** The room is solved: the signs noticed, the word swallowed, every shard taken, every tooth mended (a state that `normalize` keeps, whatever step it was reached from). */
  onSolved(s) { const need = this.need(s); s.noticed = this.order.slice(); s.swallowed = true; s.taken = Array.from({ length: need }, (_, i) => i); s.fixed = need; world.room.v = this.vOf(s); },
  debug(s) { return { noticed: s.noticed.join(','), swallowed: s.swallowed, breaks: s.breaks, taken: s.taken.join(','), fixed: s.fixed, need: this.need(s) }; },
  /** What the set shows for a state (its targets). */
  vOf(s) {
    const need = this.need(s), all = s.noticed.length >= 3, mended = s.swallowed && s.fixed >= need ? 1 : 0, n = this.slots;
    return {
      sign: this.order.map((id) => (s.noticed.includes(id) ? 1 : 0)), tag: s.swallowed ? 0 : all ? 0.6 : 1, free: all ? 0 : 1,
      x: Array.from({ length: n }, (_, k) => (k < need ? 1 : 0)), fix: Array.from({ length: n }, (_, k) => (k < s.fixed ? 1 : 0)),
      shard: Array.from({ length: n }, (_, k) => (k < need && !s.taken.includes(k) ? 1 : 0)),
      ready: s.swallowed ? 1 : 0, calm: mended, word: mended, shout: 0,
    };
  },
  /** The set shows the saved state. */
  visual(s) { Object.assign(world.room, { v: this.vOf(s), through: 0, page: 0, flash: 0 }); },
  /** The state changed while playing: the set follows (a pulse in flight is kept). */
  refresh(s) { const v = this.vOf(s); v.shout = (world.room.v && world.room.v.shout) || 0; world.room.v = v; syncUI(); },

  // ---- what the plate offers in each view ----
  panel(room, view) {
    const d = this, s = room.s;
    if (view === 'dientes') return d.teethPanel(room);
    if (view === 'firma') return d.tagPanel(room);
    const id = d.order.find((x) => d.signs[x].view === view), sg = d.signs[id], got = s.noticed.includes(id);
    return {
      title: sg.title, status: got ? sg.shut : sg.open,
      build(el) { const b = room.btn(el, sg.btn, 'sentir-' + id, () => d.notice(room, id), { wide: true }); if (got) { b.disabled = true; b.textContent = sg.done; } },
    };
  },
  tagPanel(room) {
    const d = this, s = room.s, sg = d.signs.palabra;
    if (s.swallowed) return { title: 'LA FIRMA · ADENTRO', status: 'La palabra volvió adentro de la boca y se quedó quieta. No salió.', build(el) { const b = room.btn(el, 'YA ESTÁ ADENTRO', 'adentro', () => {}, { wide: true }); b.disabled = true; } };
    if (s.noticed.length >= 3) return {
      title: 'LA FIRMA · A MEDIAS', status: 'La firma quedó quieta, medio afuera de la boca. Se puede tragar la palabra, sin apuro, o tocar la firma.',
      build(el) {
        room.btn(el, 'TRAGAR LA PALABRA', 'tragar', (b) => { room.say('Tragás la palabra. Quedate con ella adentro, sin apuro.'); room.hold(b, d.holdMs, 'TRAGANDO', () => d.swallow(room), () => room.say(d.lines.held)); }, { wide: true, keepHold: true });
        room.btn(el, 'TOCAR LA FIRMA', 'tocar', () => d.touch(room), { wide: true });
      },
    };
    const got = s.noticed.includes('palabra');
    return { title: sg.title, status: got ? sg.shut : sg.open, build(el) { const b = room.btn(el, sg.btn, 'sentir-palabra', () => d.notice(room, 'palabra'), { wide: true }); if (got) { b.disabled = true; b.textContent = sg.done; } } };
  },
  teethPanel(room) {
    const d = this, s = room.s, need = d.need(s);
    if (s.done) return {
      title: 'LA BOCA · REMENDADA', status: COPY.trialDoneBefore,
      build(el) {
        room.btn(el, 'LEER EL CAPÍTULO', 'leer', () => Book.receive(room.track().chapter), { wide: true });
        room.btn(el, 'JUGARLO DE NUEVO', 'otra-vez', () => room.reset(), { wide: true });
      },
    };
    if (!s.swallowed) return {
      title: 'LA BOCA · DIENTES CON ✗', status: `La boca grita. ${need} dientes tienen una ✗: están rotos, y sus pedazos flotan sobre el agua. Antes hay que hacer algo con la palabra.`,
      build(el) { room.btn(el, 'CONTAR LOS DIENTES', 'contar', () => room.say(`Dientes con una ✗: ${need}. Pedazos sobre el agua: ${need}.`), { wide: true }); },
    };
    const carried = s.taken.length - s.fixed;
    return {
      title: 'LA BOCA · DIENTES CON ✗', status: `Dientes con una ✗: ${need - s.fixed}. Pedazos que llevás: ${carried}.`,
      build(el) { room.btn(el, 'ENCASTRAR UN PEDAZO', 'encastrar', () => d.repair(room), { wide: true }); },
    };
  },

  /** A sign: in the clue's order it is noticed; out of order everything noticed is lost. */
  notice(room, id) {
    const s = room.s, k = s.noticed.length;
    if (s.done || s.swallowed || k >= 3 || s.noticed.includes(id)) return;
    if (id !== this.order[k]) {
      s.tries++; s.noticed = []; s.stage = this.stageOf(s); room.save();
      Sound.buzz(); room.flash(0.6); this.refresh(s);
      room.renderPanel(); room.say(this.lines.wrong); live(this.lines.wrong);
      return;
    }
    s.noticed.push(id); s.stage = this.stageOf(s); room.save(); Sound.tick();
    this.refresh(s);
    room.renderPanel();
    if (s.noticed.length >= 3) { room.say(this.lines.frozen); live(this.lines.frozen); Sound.thunk(); } else room.say(this.signs[id].did);
  },
  /** The slow count is over: the word goes back in. */
  swallow(room) {
    const s = room.s;
    if (s.done || s.swallowed || s.noticed.length < 3) return;
    s.swallowed = true; s.stage = this.stageOf(s); room.save();
    room.anim(async (c) => {
      Sound.whoosh(1.4); this.refresh(s);
      room.say(this.lines.swallowed); live(this.lines.swallowed);
      await c.wait(rm(2.2));
      room.renderPanel(); room.say(this.lines.swallowed);
    });
  },
  /** Touching the tag lets the word out: one more tooth breaks. */
  touch(room) {
    const s = room.s;
    if (s.done || s.swallowed || s.noticed.length < 3) return;
    const grew = s.breaks < this.slots - this.base;
    s.tries++; if (grew) s.breaks++;
    room.save();
    const line = grew ? this.lines.broke : this.lines.brokeMax;
    room.anim(async (c) => {
      Sound.buzz(); room.flash(0.9); this.refresh(s);
      world.room.v.shout = 1; room.later(() => { if (world.room.v) world.room.v.shout = 0; }, 550); // (a pulse: the set follows it)
      room.say(line); live(line);
      await c.wait(rm(1.1));
      room.renderPanel(); room.say(line);
    });
  },
  /** A shard taken from the water (a tap on it where it floats). */
  collect(room, i) {
    const s = room.s;
    if (!this.shardOn(s, i)) return;
    s.taken.push(i); room.save(); Sound.tick();
    this.refresh(s);
    const left = this.need(s) - s.taken.length, line = left ? `Un pedazo de diente. Tiene el filo de lo que rompí. Te faltan ${left}.` : 'El último pedazo. Los llevás todos: ahora, a la boca.';
    hint(line, 3200); live(line);
  },
  /** A shard into a crossed-out tooth: it turns gold; the last one calms the mouth and says "perdón.". */
  repair(room) {
    const s = room.s, need = this.need(s), carried = s.taken.length - s.fixed;
    if (s.done || !s.swallowed) return;
    if (carried <= 0) { Sound.buzz(); room.say(`No llevás ningún pedazo. Siguen flotando sobre el agua, a los costados: hay que caminar y mirar. Faltan ${need - s.taken.length}.`); return; }
    s.fixed++; room.save();
    this.refresh(s);
    if (s.fixed >= need) { room.flash(0.6); room.solve(); return; } // (the set already calms: the mouth is mended)
    const line = `Encastrás el pedazo. El diente queda dorado, con la raja a la vista. Quedan ${need - s.fixed} con una ✗.`;
    room.anim(async (c) => {
      Sound.thunk(); room.say(line); live(line);
      await c.wait(rm(1.2));
      room.renderPanel(); room.say(line);
    });
  },
};
