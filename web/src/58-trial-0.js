// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALLENGES  (one per floor of El Lado Oscuro del Mono; each opens a chapter of the book)
//   The element stands in the world (41-r3d-elodm.js); touching it — or the button under the floor's name — opens
//   a plate beside the player with the challenge up close. Every challenge is solved with what is on screen: the
//   fragment of the book on the plate, the scene, and optional hints that say a little more each time. Nothing needs
//   sound, hover, dragging or quick hands. Solving it: the element turns into a page, the chapter goes into the book
//   (once — Progress keeps it), the book opens on it. The ninth chapter opens the basements.
//   The challenges themselves live in 58-trial-<n>-<id>.js and register in TRIALS.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/**
 * TRIALS[trackId] = {
 *   approach: caption to go near the element ("ACERCARTE A …"), title: the plate's heading,
 *   clue: a short fragment of the chapter (verbatim) that holds the key, hints: optional hints, least to most,
 *   done: the line said when it is solved,
 *   walkthrough: how a visitor solves it — data-act values to press in order, { type } to write, { hold: act } to stay
 *     (used by the checks, which press the real buttons),
 *   build(T): draws the scene and its controls with the helpers below.
 * }
 */
const TRIALS = {};

const SVGNS = 'http://www.w3.org/2000/svg';
const Trial = {
  id: null,       // track id of the floor being visited (record floors only)
  built: false,   // the plate's scene exists for this visit (closing only hides it)
  finishing: false,
  hintAt: 0,
  timers: new Set(),
  holdCancel: null,

  def() { return this.id ? TRIALS[this.id] : null; },
  track() { return this.id ? trackById(this.id) : null; },
  /** True while standing on a record floor with its challenge. */
  here() { return !!(this.id && world.phase === 'floor' && this.def()); },
  hotOn(id) { return id === 'tr-element' && this.here() && !Level.inspecting(); },
  label() { const d = this.def(), t = this.track(); return d && t ? `${d.approach.charAt(0)}${d.approach.slice(1).toLowerCase()} (${COVER_ELEMENTS[t.element].name})` : ''; },

  init() {
    $('#tr-open').addEventListener('click', () => this.open());
    $('#tr-close').addEventListener('click', () => this.close());
    $('#tr-hint').addEventListener('click', () => this.hint());
    $('#tr-read').addEventListener('click', () => { const t = this.track(); if (!t) return; this.close(); Book.receive(t.chapter); });
    $('#tr-again').addEventListener('click', () => this.replay());
    $('#reveal-go').addEventListener('click', () => Reveal.go());
    window.addEventListener('resize', () => { if (App.overlay === 'trial') this.place(); });
  },

  // ---- arriving and leaving a floor ----
  arrive(n) {
    const tr = trackOf(n);
    this.leave();
    if (!tr || tr.album !== ELODM || !TRIALS[tr.id]) return;
    this.id = tr.id;
    Object.assign(world.trial, { progress: 0, step: 0, solved: Progress.solved(tr.id) ? 1 : 0 });
    document.documentElement.style.setProperty('--tr-accent', tr.visualAccent);
    syncUI();
  },
  leave() {
    this.clearTimers();
    Seq.cancel('trialfx');
    if (App.overlay === 'trial') App.overlay = null;
    $('#trial').hidden = true;
    $('#trial').classList.remove('solved');
    $('#tr-stage').replaceChildren();
    this.id = null; this.built = false; this.finishing = false; this.hintAt = 0;
    Object.assign(world.trial, { progress: 0, step: 0, solved: 0 });
  },
  /** The floor's caption button: what to do here, or that it is done. */
  sync() {
    const btn = $('#tr-open'), d = this.def(), on = this.here() && !App.overlay && !Level.inspecting();
    btn.hidden = !on;
    if (!on || !d) return;
    const done = Progress.solved(this.id);
    btn.textContent = done ? `✓ ${d.approach}` : d.approach;
    btn.classList.toggle('done', done);
    btn.setAttribute('aria-label', done ? `${d.approach}: capítulo encontrado` : d.approach);
  },

  // ---- the plate ----
  open() {
    const d = this.def(), t = this.track();
    if (!d || !this.here() || App.overlay) return;
    App.overlay = 'trial';
    this.restore = document.activeElement;
    const el = $('#trial');
    $('#tr-where').textContent = `${floorName(t.floor).toUpperCase()} · ${t.title.toUpperCase()}`;
    $('#tr-title').textContent = d.title;
    $('#tr-clue').textContent = d.clue;
    if (!this.built) this.build(Progress.solved(t.id));
    el.hidden = false;
    this.place();
    const first = el.querySelector('.tr-stage button:not(:disabled), .tr-stage input') || $('#tr-close');
    first.focus({ preventScroll: true });
    syncUI();
  },
  close() {
    if (App.overlay !== 'trial') return;
    this.cancelHold();
    App.overlay = null;
    $('#trial').hidden = true;
    const r = this.restore;
    if (r && r.focus && document.contains(r) && !r.hidden) r.focus({ preventScroll: true });
    syncUI();
  },
  /** Draws the scene: the challenge itself, or — already solved on an earlier visit — the way back to the chapter. */
  build(solvedBefore) {
    const d = this.def(), t = this.track(), stage = $('#tr-stage');
    this.clearTimers();
    stage.replaceChildren();
    $('#trial').classList.remove('solved');
    this.finishing = false; this.hintAt = 0;
    const art = COVER_ELEMENTS[t.element].art;
    if (art) stage.append(h('img', { class: 'tr-art', src: art, alt: COVER_ELEMENTS[t.element].name }));
    this.say('');
    $('#tr-hint').hidden = !!solvedBefore; $('#tr-read').hidden = !solvedBefore; $('#tr-again').hidden = !solvedBefore;
    if (solvedBefore) {
      world.trial.solved = 1;
      this.say(COPY.trialDoneBefore);
    } else {
      world.trial.solved = 0; world.trial.progress = 0; world.trial.step = 0;
      d.build(this.helpers(stage));
    }
    this.built = true;
  },
  replay() { this.build(false); const b = $('#tr-stage button'); if (b) b.focus({ preventScroll: true }); },

  // ---- hints ----
  hint() {
    const d = this.def();
    if (!d || !d.hints || !d.hints.length || this.finishing) return;
    const text = d.hints[Math.min(this.hintAt, d.hints.length - 1)];
    this.hintAt = Math.min(this.hintAt + 1, d.hints.length);
    $('#tr-hint').textContent = this.hintAt < d.hints.length ? COPY.trialHintMore : COPY.trialHint;
    Progress.hint(this.id);
    this.say(text);
  },

  // ---- the moment it is solved ----
  finish() {
    if (this.finishing || !this.here()) return;
    this.finishing = true;
    this.cancelHold();
    const d = this.def(), t = this.track(), first = Progress.solve(t.id);
    const el = $('#trial');
    el.classList.remove('solved'); void el.offsetWidth; el.classList.add('solved');
    Sound.ding();
    this.say(d.done);
    for (const b of el.querySelectorAll('.tr-stage button, .tr-stage input')) b.disabled = true;
    // the element turns into a page of the book
    const txt = bookText(t.chapter), page = this.page(txt ? txt.heading : '');
    $('#tr-stage').append(page);
    Seq.run('trialfx', (c) => c.to(world.trial, { solved: 1, progress: 1 }, rm(2.2), Ease.inOutSine));
    syncUI();
    $('#tr-hint').hidden = true;
    if (!first) { // a replay: the chapter was already in the book — nothing is given twice
      this.later(() => { this.say(COPY.trialAgainDone); $('#tr-read').hidden = false; $('#tr-again').hidden = false; $('#tr-read').focus({ preventScroll: true }); }, rm(1600));
      return;
    }
    this.later(() => {
      if (App.overlay === 'trial') { App.overlay = null; $('#trial').hidden = true; }
      $('#tr-read').hidden = false; $('#tr-again').hidden = false;
      Book.receive(t.chapter);
    }, rm(2600));
  },
  /** The page the element becomes: a sheet with the chapter's title (its words are read in the book). */
  page(heading) {
    const s = (tag, a, p) => { const e = document.createElementNS(SVGNS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
    const svg = s('svg', { viewBox: '0 0 320 120', role: 'img', 'aria-label': `Una página: ${heading}` });
    const g = s('g', { class: 'tr-page' }, svg);
    s('rect', { x: 110, y: 6, width: 100, height: 108, fill: '#ebe5d5', 'fill-opacity': 0.94 }, g);
    for (let i = 0; i < 6; i++) s('line', { x1: 122, x2: i % 3 === 2 ? 170 : 198, y1: 46 + i * 10, y2: 46 + i * 10, stroke: '#2a2622', 'stroke-width': 1.4, 'stroke-opacity': 0.55 }, g);
    const tt = s('text', { x: 160, y: 30, 'text-anchor': 'middle', 'font-size': 9, fill: '#2a2622' }, g);
    tt.textContent = heading.replace(/^Capítulo (\d+) — .*$/, 'Capítulo $1');
    return svg;
  },
  /** After the book closes on a new chapter: the ninth one opens the basements (once). */
  onBookClosed() {
    if (Progress.complete() && !Progress.s.revealed && world.phase === 'floor' && !App.overlay) Reveal.show();
  },

  // ---- helpers given to each challenge ----
  helpers(stage) {
    const self = this;
    const svgEl = (tag, attrs = {}, parent) => {
      const e = document.createElementNS(SVGNS, tag);
      for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
      if (parent) parent.append(e);
      return e;
    };
    const T = {
      track: this.track(), stage, reduced: world.reduced,
      /** A drawing area (viewBox units). */
      svg(w, hgt, label) { const e = svgEl('svg', { viewBox: `0 0 ${w} ${hgt}`, role: 'img', 'aria-label': label || '' }); stage.append(e); return e; },
      el: svgEl,
      /** A text inside the drawing. */
      text(parent, x, y, str, attrs = {}) { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': 12, ...attrs }, parent); e.textContent = str; return e; },
      /** A row of buttons under the drawing. */
      acts(cls) { const e = h('div', { class: 'tr-acts' + (cls ? ' ' + cls : '') }); stage.append(e); return e; },
      /** One button; `act` names it for the checks (data-act). */
      btn(parent, label, act, fn, opts = {}) {
        const b = h('button', { class: 'tr-act' + (opts.wide ? ' wide' : ''), type: 'button', 'data-act': act, text: label, 'aria-label': opts.aria || null });
        b.addEventListener('click', () => { if (self.finishing) return; Sound.unlock(); if (!opts.keepHold) self.cancelHold(); fn(b); });
        parent.append(b);
        return b;
      },
      /** A short answer to write (accents, capitals, spaces and punctuation do not matter). */
      field(label, act, onSubmit) {
        const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-label': label, 'data-act': act + '-input' });
        const go = h('button', { class: 'tr-act', type: 'button', 'data-act': act, text: 'ESCRIBIR' });
        const send = () => { if (self.finishing) return; onSubmit(input.value, input); };
        go.addEventListener('click', send);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
        stage.append(h('div', { class: 'tr-field' }, input, go));
        return input;
      },
      norm: (str) => String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ]+/g, ''),
      say: (text) => self.say(text),
      progress(k) { world.trial.progress = clamp(k); },
      step(n) { world.trial.step = n; },
      later: (fn, ms) => self.later(fn, ms),
      /**
       * Staying: one tap starts a slow count (no holding the finger down, no speed), the button shows it, and any other
       * button — or a second tap on this one — interrupts it. `ms` is long on purpose; reduced motion keeps the time.
       */
      hold(b, ms, label, onDone, onStop) {
        if (self.holdCancel) { const was = self.holdBtn; self.cancelHold(); if (was === b) return; }
        const t0 = performance.now(), base = b.textContent;
        b.setAttribute('aria-pressed', 'true');
        let id = 0;
        const tick = () => {
          const left = Math.max(0, ms - (performance.now() - t0));
          b.textContent = `${label} · ${Math.ceil(left / 1000)}`;
          if (left <= 0) { finish(); onDone(); return; }
          id = setTimeout(tick, 200); self.timers.add(id);
        };
        const finish = () => { clearTimeout(id); self.holdCancel = null; self.holdBtn = null; b.textContent = base; b.setAttribute('aria-pressed', 'false'); };
        self.holdCancel = () => { finish(); if (onStop) onStop(); };
        self.holdBtn = b;
        tick();
      },
      solve: () => self.finish(),
    };
    return T;
  },
  say(text) { $('#tr-status').textContent = text; if (text && App.overlay === 'trial') live(text); },
  later(fn, ms) { const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms); this.timers.add(id); return id; },
  clearTimers() { for (const id of this.timers) clearTimeout(id); this.timers.clear(); this.cancelHold(); },
  cancelHold() { const c = this.holdCancel; this.holdCancel = null; if (c) c(); },

  /** Like the book, the plate never covers the official player: beside it, or above it on phones. */
  place() {
    const el = $('#trial'), W = window.innerWidth, H = window.innerHeight;
    let w = Math.min(440, W - 24), left = (W - w) / 2, top = 12, maxH = H - 24;
    const port = PlayerPortal.current;
    if (port) {
      const r = port.el.getBoundingClientRect();
      if (W >= 640) {
        const roomR = W - r.right, roomL = r.left, room = Math.max(roomR, roomL);
        if (room >= 320) { w = Math.min(440, room - 28); left = roomR >= roomL ? r.right + (roomR - w) / 2 : (roomL - w) / 2; }
      } else { maxH = Math.max(260, r.top - 18); }
    }
    el.style.width = Math.round(w) + 'px'; el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px'; el.style.maxHeight = Math.round(maxH) + 'px';
  },

  // ---- for the checks and the dev panel ----
  /** Solves the challenge of this floor as if it had been played (dev panel). */
  solveNow() { if (!this.here()) return; if (App.overlay !== 'trial') this.open(); if (!this.built || $('#tr-again').hidden === false) this.build(false); this.finish(); },
  act(name) { const b = $(`#tr-stage [data-act="${name}"]`); if (b) b.click(); return !!b; },
  debug() {
    const d = this.def();
    return { id: this.id, here: this.here(), open: App.overlay === 'trial', finishing: this.finishing, status: $('#tr-status').textContent, clue: d ? d.clue : null,
      approach: d ? d.approach : null, walkthrough: d ? d.walkthrough : null, element: this.track() ? this.track().element : null, world: { ...world.trial },
      acts: [...document.querySelectorAll('#tr-stage [data-act]')].map((b) => ({ act: b.dataset.act, text: b.textContent, disabled: !!b.disabled, pressed: b.getAttribute('aria-pressed') })) };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE BASEMENTS  (revealed once, right after the ninth chapter: another record lives under the entrance)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Reveal = {
  show() {
    if (App.overlay) return;
    App.overlay = 'reveal';
    $('#reveal-title').textContent = COPY.revealTitle;
    $('#reveal-text').textContent = COPY.revealText;
    $('#reveal-go').textContent = COPY.revealGo;
    $('#reveal').hidden = false;
    Sound.arrivalDing();
    $('#reveal-go').focus({ preventScroll: true });
    live(`${COPY.revealTitle}. ${COPY.revealText}`);
    syncUI();
  },
  hide() { $('#reveal').hidden = true; if (App.overlay === 'reveal') App.overlay = null; Progress.markRevealed(); },
  /** Down: back into the elevator, the panel already showing the basements. */
  go() { this.hide(); world.panelDown = true; syncUI(); returnToElevator(); },
  stay() { this.hide(); syncUI(); },
};
