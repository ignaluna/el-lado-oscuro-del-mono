// ═══════════════════════════════════════════════════════════════════════════════════════════
// LEVEL  (one exploration level in a song's world — playable prototype)
//   painting → hatch → box with three dials → the order is in the water → the prism → a page for the book.
//   Saved in localStorage, so a finished level stays finished; the page it gives can be obtained once per play.
//   Stages: 0 painting hung · 1 painting moved · 2 hatch open (box locked) · 3 box open · 4 done (page taken).
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Level = {
  KEY: 'eldom.level.v1',
  s: null,
  view: 'wide',      // wide · wall · box · stones
  busy: false,
  awaitCard: false,
  hintStage: -1, hintTier: 0,
  resetArmed: 0,

  fresh() { return { v: 1, stage: 0, dials: LEVEL.start.map((id) => Math.max(0, LEVEL.symbols.indexOf(id))), done: false, tries: 0, hints: 0 }; },
  hosts(track) { return !!(LEVEL.enabled && track && track.floor === LEVEL.floor); },
  /** The level needs the 3D world (the 2D fallback shows the floor without it). */
  available() { return !!(LEVEL.enabled && R && R.kind === '3d' && R.levelPose && trackOf(LEVEL.floor)); },
  here() { return this.available() && world.phase === 'floor' && world.floor === LEVEL.floor; },
  inspecting() { return this.here() && this.view !== 'wide'; },
  page() { const t = trackOf(LEVEL.floor); return t ? Book.pageFor(t.id) : null; },

  load() {
    const d = store.local.json(this.KEY, null), f = this.fresh();
    if (d && d.v === 1) {
      f.stage = clamp(Math.round(d.stage) || 0, 0, 4);
      if (Array.isArray(d.dials) && d.dials.length === 3) f.dials = d.dials.map((x) => clamp(Math.round(x) || 0, 0, LEVEL.symbols.length - 1));
      f.done = !!d.done && f.stage === 4;
      if (f.stage === 4 && !f.done) f.stage = 3;
      f.tries = Number(d.tries) || 0; f.hints = Number(d.hints) || 0;
    }
    this.s = f;
    // a finished level keeps its page, even if the book (session storage) started over
    const pg = this.page();
    if (this.s.done && pg && BOOK.enabled && !Book.has(pg.id)) { Book.state.found = true; Book.state.pages = [...Book.state.pages, pg.id]; Book.save(); }
    this.applyVisual();
  },
  save() { store.local.setJson(this.KEY, this.s); },
  /** The set always shows the saved state (it is built whenever the floor is). */
  applyVisual() {
    const st = this.s.stage;
    Object.assign(world.level, { paint: st >= 1 ? 1 : 0, hatch: st >= 2 ? 1 : 0, lid: st >= 3 ? 1 : 0, obj: st === 3 ? 1 : 0, morph: 0, shake: 0, glow: st >= 3 ? 1 : 0 });
    world.level.dials = [...this.s.dials]; world.level.spin = [0, 0, 0];
  },
  setStage(n) { this.s.stage = n; this.save(); syncUI(); },

  /** Phones: the floor's first view turns toward the wall, above the docked player. Wide screens keep theirs. */
  floorAim(a) {
    if (a >= 1 || !LEVEL.enabled || world.env !== LEVEL.floor || !this.available()) return null;
    const ST = LEVEL_SET, fov = 62, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    const dx = ST.x, dz = ST.z - 2.7, dy = ST.hole.y - 1.6;
    const yaw = Math.atan2(-dx, -dz) - Math.atan((0.5 - 0.44) * 2 * tanH);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - 0.45) * 2 * tanV);
    return [-Math.sin(yaw) * Math.cos(pitch) * 10, 1.6 + Math.sin(pitch) * 10, 2.7 - Math.cos(yaw) * Math.cos(pitch) * 10];
  },

  // ---- arriving, leaving, looking ----
  arrive(n) {
    if (n !== LEVEL.floor || !this.available()) return;
    this.back = null;
    this.view = 'wide'; this.busy = false; this.awaitCard = false;
    this.applyVisual();
    syncUI();
  },
  leave() {
    Seq.cancel('lv');
    this.view = 'wide'; this.busy = false; this.awaitCard = false;
    this.closeTip();
    $('#lv-card').hidden = true;
    if (App.overlay === 'level') App.overlay = null;
    this.applyVisual();
  },
  go(view) {
    if (!this.here() || App.overlay) return;
    if (this.view === 'wide' && view !== 'wide') this.back = { ...world.cam }; // where the visitor stood
    this.view = view;
    const port = PlayerPortal.current;
    if (port && port.setDock) port.setDock(view === 'wide' && !Roam.docked ? 'normal' : 'compact');
    bakeWalk();
    world.lookScale = view === 'wide' ? 0.22 : 0.07;
    const a = aspectNow(), pose = view === 'wide' ? (this.back || poseFromShot(Shots.floor(a))) : R.levelPose(view, a);
    if (pose) Seq.run('cam', (c) => toPose(c, pose, rm(view === 'wide' ? 1.2 : 1.05), Ease.inOutCubic));
    this.closeTip();
    if (view === 'stones') live(COPY.lvStones);
    syncUI();
  },
  reframe() {
    if (!this.here()) return;
    const a = aspectNow();
    setPose(this.view === 'wide' ? poseFromShot(Shots.floor(a)) : R.levelPose(this.view, a));
  },

  // ---- what can be touched now ----
  hotOn(id) {
    if (!this.here() || this.busy) return false;
    const st = this.s.stage, v = this.view;
    if (v === 'wide') return id === 'lv-wall' || id === 'lv-stones';
    if (v === 'wall') return (id === 'lv-painting' && st === 0) || (id === 'lv-hatch' && st === 1) || (id === 'lv-box' && st >= 2);
    if (v === 'box') return (st === 2 && (id.startsWith('lv-dial-') || id === 'lv-latch')) || (st === 3 && id === 'lv-object');
    return false;
  },
  label(id) {
    if (id.startsWith('lv-dial-')) { const i = Number(id.slice(8)); return `${COPY.lvDial} ${i + 1}: ${COPY.lvSymbols[LEVEL.symbols[this.s.dials[i]]]}. ${COPY.lvTurn}`; }
    return { 'lv-wall': COPY.lvWall, 'lv-stones': COPY.lvStones, 'lv-painting': COPY.lvPainting, 'lv-hatch': COPY.lvHatch, 'lv-box': COPY.lvBox, 'lv-latch': COPY.lvLatch, 'lv-object': COPY.lvObject }[id] || id;
  },
  tap(id) {
    if (!this.hotOn(id)) return;
    Sound.unlock();
    if (id === 'lv-wall') this.go('wall');
    else if (id === 'lv-stones') this.go('stones');
    else if (id === 'lv-box') this.go('box');
    else if (id === 'lv-painting') this.movePainting();
    else if (id === 'lv-hatch') this.openHatch();
    else if (id.startsWith('lv-dial-')) this.turn(Number(id.slice(8)));
    else if (id === 'lv-latch') this.tryOpen();
    else if (id === 'lv-object') this.take();
  },
  /** Runs one animation; nothing else can be touched meanwhile. */
  anim(fn) {
    this.busy = true; syncUI();
    Seq.run('lv', async (c) => { try { await fn(c); } finally { this.busy = false; syncUI(); } });
  },

  // ---- the steps of the mystery ----
  movePainting() {
    this.anim(async (c) => {
      Sound.click();
      await c.to(world.level, { paint: 1 }, rm(1.4), Ease.inOutCubic);
      Sound.thunk();
      this.setStage(1);
      live(COPY.lvAfterPainting);
    });
  },
  openHatch() {
    this.anim(async (c) => {
      Sound.latch();
      await c.to(world.level, { hatch: 1 }, rm(1.2), Ease.outCubic);
      this.setStage(2);
      await c.wait(0.25);
      this.busy = false;
      this.go('box');
    });
  },
  turn(i) {
    const n = LEVEL.symbols.length;
    this.s.dials[i] = (this.s.dials[i] + 1) % n;
    world.level.dials[i] = this.s.dials[i];
    this.save();
    Sound.tick();
    Seq.run('lvd' + i, async (c) => { world.level.spin[i] = 0.001; await c.to(world.level.spin, { [i]: 1 }, 0.3, Ease.inOutSine); world.level.spin[i] = 0; });
    Hot.label('lv-dial-' + i, this.label('lv-dial-' + i));
    live(COPY.lvSymbols[LEVEL.symbols[this.s.dials[i]]]);
  },
  solved() { return LEVEL.solution.every((id, i) => LEVEL.symbols[this.s.dials[i]] === id); },
  tryOpen() {
    if (!this.solved()) {
      this.s.tries++; this.save();
      Sound.buzz();
      Seq.run('lvs', async (c) => { world.level.shake = 1; await c.to(world.level, { shake: 0 }, 0.5); });
      this.flash(COPY.lvNoGive);
      if (this.s.tries >= 2) $('#lv-hint').classList.add('nudge');
      return;
    }
    this.anim(async (c) => {
      Sound.latch();
      await c.wait(0.25);
      c.spawn((cc) => cc.to(world.level, { glow: 1 }, 1.4));
      await c.to(world.level, { lid: 1 }, rm(1.1), Ease.outCubic);
      Sound.ding();
      await c.to(world.level, { obj: 1 }, rm(0.9), Ease.outCubic);
      this.setStage(3);
      $('#lv-hint').classList.remove('nudge');
      live(COPY.lvOpen);
    });
  },
  /** The object leaves the box, breaks into light and becomes a page of the book — once. */
  take() {
    if (this.s.stage !== 3 || this.s.done) return;
    this.anim(async (c) => {
      Sound.whoosh(1.4);
      await c.to(world.level, { morph: 1 }, rm(2.6), Ease.inOutSine);
      world.level.obj = 0; world.level.morph = 0;
      this.s.done = true;
      this.setStage(4);
      this.givePage();
    });
  },
  givePage() {
    const pg = this.page();
    if (!pg || !BOOK.enabled) { this.showCard(); return; }
    Book.state.found = true;
    if (!Book.has(pg.id)) Book.state.pages = [...Book.state.pages, pg.id];
    Book.save();
    syncUI();
    const icon = $('#book-open');
    icon.classList.remove('got'); void icon.offsetWidth; icon.classList.add('got');
    live(COPY.bookGot);
    const at = Book.leaves().findIndex((l) => l.page && l.page.id === pg.id);
    this.awaitCard = true;
    Book.open(at);
  },
  /** Called by the book when it closes: right after reading the new page comes the end of the level. */
  onBookClosed() { if (this.awaitCard && this.here()) { this.awaitCard = false; this.showCard(); } },

  // ---- end of the level ----
  showCard() {
    if (App.overlay) return;
    App.overlay = 'level';
    const el = $('#lv-card');
    el.hidden = false;
    this.place(el);
    $('#lv-keep').focus({ preventScroll: true });
    live(COPY.lvDone);
    syncUI();
  },
  hideCard() { $('#lv-card').hidden = true; if (App.overlay === 'level') App.overlay = null; },
  keep() { this.hideCard(); syncUI(); this.go('wide'); },
  toElevator() { this.hideCard(); syncUI(); returnToElevator(); },
  /** Two taps (the first one asks), unless forced by the checks or the dev panel. */
  reset(force) {
    const now = performance.now();
    if (!force && now - this.resetArmed > 3500) {
      this.resetArmed = now;
      for (const b of ['#lv-reset', '#lv-card-reset']) $(b).textContent = COPY.lvResetSure;
      setTimeout(() => { for (const b of ['#lv-reset', '#lv-card-reset']) $(b).textContent = COPY.lvReset; }, 3500);
      return;
    }
    this.resetArmed = 0;
    for (const b of ['#lv-reset', '#lv-card-reset']) $(b).textContent = COPY.lvReset;
    const pg = this.page();
    if (pg && Book.has(pg.id)) { Book.state.pages = Book.state.pages.filter((id) => id !== pg.id); Book.save(); }
    this.s = this.fresh(); this.save();
    Seq.cancel('lv');
    this.busy = false; this.awaitCard = false; this.hintStage = -1;
    this.hideCard(); this.closeTip();
    $('#lv-hint').classList.remove('nudge');
    this.applyVisual();
    live(COPY.lvResetDone);
    if (this.here()) this.go('wide'); else syncUI();
  },

  // ---- the optional hint ----
  hint() {
    const st = Math.min(this.s.stage, 3), tiers = COPY.lvHints[st];
    if (!tiers || this.s.done) return;
    if (this.hintStage !== st) { this.hintStage = st; this.hintTier = 0; } else this.hintTier = Math.min(tiers.length - 1, this.hintTier + 1);
    this.s.hints++; this.save();
    $('#lv-hint').classList.remove('nudge');
    this.tip(tiers[this.hintTier], this.hintTier < tiers.length - 1);
  },
  tip(text, more) {
    clearTimeout(this.tipTimer);
    const el = $('#lv-tip');
    $('#lv-tip-text').textContent = text;
    $('#lv-tip-more').hidden = !more;
    $('#lv-tip-close').hidden = false;
    el.hidden = false;
    this.place(el);
  },
  /** A short line that goes away by itself (kept above the docked player, unlike the bottom captions). */
  flash(text) {
    this.tip(text, false);
    $('#lv-tip-close').hidden = true;
    clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => this.closeTip(), 2200);
    live(text);
  },
  closeTip() { clearTimeout(this.tipTimer); $('#lv-tip').hidden = true; },
  /** Like the book, these plates never cover the official player. */
  place(el) {
    const W = window.innerWidth, H = window.innerHeight, port = PlayerPortal.current;
    const w = Math.min(el.id === 'lv-card' ? 360 : 330, W - 24);
    let left = 16, top = 16, maxH = H - 32;
    if (W < 640) {
      left = (W - w) / 2; top = 12;
      if (port) maxH = Math.max(160, port.el.getBoundingClientRect().top - 24);
    } else if (el.id === 'lv-card') top = Math.max(16, H * 0.3);
    el.style.width = Math.round(w) + 'px'; el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px';
    el.style.maxHeight = Math.round(maxH) + 'px';
  },

  /** For the checks. */
  debug() {
    return { stage: this.s.stage, done: this.s.done, dials: this.s.dials.map((i) => LEVEL.symbols[i]), tries: this.s.tries, hints: this.s.hints, view: this.view, busy: this.busy,
      here: this.here(), card: !$('#lv-card').hidden, tip: $('#lv-tip').hidden ? '' : $('#lv-tip-text').textContent, set: R && R.levelInfo ? R.levelInfo() : null,
      page: this.page() ? this.page().id : null, saved: store.local.json(this.KEY, null) };
  },
};
world.floorAim = (a) => Level.floorAim(a);
