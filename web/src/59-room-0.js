// ═══════════════════════════════════════════════════════════════════════════════════════════
// ROOMS  (a record floor as a walkable set: the floor's cover is drawn in the world and the challenge happens in it)
//   ROOMS[trackId] describes one room (59-room-1-en-una.js); its 3D set is ROOM_SETS[trackId] (49-r3d-room-1-en-una.js).
//   Like the level of the basements the controller owns what can be touched (hotspots "rm-…"), the camera views and a plate
//   with the controls of the close look; unlike it, it lives on the nine floors of the record, and finishing it goes through
//   the plate's own path (Trial.finish): Progress.solve, the chapter, the book — once.
//   Free walking is the same as everywhere (Roam): the visitor walks in and the set stops them where it is solid.
//   Everything is reachable with buttons (hotspots, the plate's controls), the keyboard and a screen reader; nothing needs
//   speed, hover, dragging or sound. The room's own state lives in localStorage ("eldom.room.<id>.v1").
//   A room definition: { aim, intro, clue, done, hints: [[tier…] per stage], hots: { id: { label(room), view } },
//     fresh(), normalize(raw), solvedState(), visual(state), panel(room, view) → { title, status, cls, build(actsEl, room) } }
// ═══════════════════════════════════════════════════════════════════════════════════════════
const ROOMS = {};

const Room = {
  id: null,          // track id of the room being visited (null elsewhere, and always null without the 3D world)
  s: null,           // its saved state
  view: 'wide',      // wide · screen · visor · through · cup
  busy: false,       // an animation runs: nothing can be touched meanwhile
  tipOn: false,      // the plate shows a hint over the wide view
  back: null,        // where the visitor stood before looking closely
  hintStage: -1, hintTier: 0,
  resetArmed: 0,
  holdCancel: null, holdBtn: null,
  timers: new Set(),

  def() { return this.id ? ROOMS[this.id] : null; },
  track() { return this.id ? trackById(this.id) : null; },
  hosts(track) { return !!(track && ROOMS[track.id]); },
  /** The room needs the 3D world (the 2D fallback keeps the plate of Trial). */
  available() { return !!(R && R.kind === '3d' && R.roomPose && this.id); },
  here() { return this.available() && world.phase === 'floor' && !!this.track() && world.floor === this.track().floor; },
  inspecting() { return this.here() && this.view !== 'wide'; },
  key() { return `eldom.room.${this.id}.v1`; },

  // ---- arriving and leaving ----
  arrive(n) {
    const tr = trackOf(n);
    this.leave();
    if (!tr || !this.hosts(tr) || !R || R.kind !== '3d') return;
    this.id = tr.id;
    this.s = this.load();
    this.applyVisual();
    const port = PlayerPortal.current;
    if (port && window.innerWidth >= 640) { Roam.docked = true; port.setDock('compact'); } // the room is the floor: the player waits in its corner
    const d = this.def();
    if (d.intro) hint(d.intro, 6200);
    syncUI();
  },
  leave() {
    Seq.cancel('rm'); Seq.cancel('rmv'); Seq.cancel('rmf');
    this.clearTimers();
    this.id = null; this.s = null; this.view = 'wide'; this.busy = false; this.tipOn = false; this.back = null; this.hintStage = -1; this.hintTier = 0; this.resetArmed = 0;
    Object.assign(world.room, { through: 0, page: 0, flash: 0 });
    for (const id of ['#rm-panel']) $(id).hidden = true;
    $('#rm-reset').textContent = COPY.rmReset;
  },
  /** The saved state, set right with Progress: a solved floor with no room saved is a solved room; a room that says solved without the chapter starts again. */
  load() {
    const d = this.def(), raw = store.local.json(this.key(), null), s = d.normalize(raw), solved = Progress.solved(this.id);
    if (s.done && !solved) return d.fresh(); // the chapter was never earned (progress reset): start again
    if (solved && !raw) return d.solvedState(); // earned elsewhere (an older visit): the room shows it solved
    return s; // (a saved room that is not done while the chapter is in the book is a game being played again)
  },
  save() { store.local.setJson(this.key(), this.s); },
  /** The set shows the saved state (it is built whenever the floor is). */
  applyVisual() { if (this.def() && this.s) this.def().visual(this.s); },
  /** The progress was reset (dev panel, checks): the room follows. */
  onProgressReset() { if (!this.id) return; this.s = this.load(); this.applyVisual(); this.view = 'wide'; this.back = null; this.renderPanel(); syncUI(); },

  /** The floor's first view turns toward the set (a wide screen: above the corner player; a phone: above the docked one). */
  floorAim(a) {
    const tr = trackOf(world.env);
    if (!tr || !this.hosts(tr) || !R || R.kind !== '3d') return null;
    const set = ROOMS[tr.id].aim;
    if (!set) return null;
    const wide = a >= 1, fov = wide ? 48 : 62, tanV = Math.tan((fov * Math.PI) / 360), tanH = tanV * a;
    const sx = wide ? set.sx : 0.5, sy = wide ? set.sy : 0.46; // where the set's point of interest lands on screen
    const dx = set.x, dz = set.z - 2.7, dy = set.y - 1.6;
    const yaw = Math.atan2(-dx, -dz) - Math.atan((0.5 - sx) * 2 * tanH);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz)) - Math.atan((0.5 - sy) * 2 * tanV);
    return [-Math.sin(yaw) * Math.cos(pitch) * 10, 1.6 + Math.sin(pitch) * 10, 2.7 - Math.cos(yaw) * Math.cos(pitch) * 10];
  },

  // ---- looking closely ----
  go(view) {
    if (!this.here() || App.overlay || view === this.view) return;
    if (this.view === 'wide' && view !== 'wide') this.back = { ...world.cam }; // where the visitor stood
    const from = this.view;
    this.view = view;
    this.cancelHold();
    this.tipOn = false;
    $('#cap-hint').hidden = true; // the line said on arrival gives way to the close look
    const port = PlayerPortal.current;
    if (port && port.setDock) port.setDock(view === 'wide' && !Roam.docked ? 'normal' : 'compact');
    bakeWalk();
    world.lookScale = view === 'wide' ? 0.22 : 0.07;
    this.renderPanel();
    this.moveCamera(view, rm(view === 'wide' ? 1.2 : 1.05));
    const th = view === 'through' ? 1 : 0;
    if (world.room.through !== th) Seq.run('rmv', (c) => c.to(world.room, { through: th }, rm(1.1), Ease.inOutSine));
    syncUI();
    if (view === 'wide') { const id = this.hotOf(from); if (id) setTimeout(() => Hot.focus(id), 160); }
  },
  /** One step back: from inside the visor to the figure, from there to the room. */
  backStep() { this.go(this.view === 'through' ? 'visor' : 'wide'); },
  hotOf(view) { const d = this.def(); return d && Object.keys(d.hots).find((k) => d.hots[k].view === (view === 'through' ? 'visor' : view)) || null; },
  moveCamera(view, dur) {
    const a = aspectNow(), pose = view === 'wide' ? (this.back || poseFromShot(Shots.floor(a))) : R.roomPose(view, a, this.free());
    if (pose) Seq.run('cam', (c) => toPose(c, pose, dur, Ease.inOutCubic));
  },
  reframe() {
    if (!this.inspecting()) return;
    this.place();
    const pose = R.roomPose(this.view, aspectNow(), this.free());
    if (pose) setPose(pose);
  },
  /** The part of the screen left for the close look: beside the plate and the corner player (wide), or between them (phones). */
  free() {
    const W = window.innerWidth, H = window.innerHeight, el = $('#rm-panel'), r = el.hidden ? { right: 0, bottom: 0 } : el.getBoundingClientRect(), port = PlayerPortal.current, pr = port ? port.el.getBoundingClientRect() : null;
    let x0 = 0.02, x1 = 0.98, y0 = 0.06, y1 = 0.92;
    if (W < 640) { y0 = (r.bottom + 8) / H; y1 = pr ? (pr.top - 8) / H : 0.92; }
    else {
      x0 = this.view === 'through' ? 0.05 : (r.right + 28) / W; // (looking through the visor, the ring takes the whole width: its plate is small)
      x1 = pr && pr.left > W * 0.4 ? (pr.left - 20) / W : 0.98; y0 = 0.1; y1 = 0.9;
      if (x1 - x0 < 0.2) { x0 = Math.min(0.5, x0); x1 = 0.98; y1 = pr ? Math.max(0.3, (pr.top - 10) / H) : 0.9; } // a short screen: above the player
    }
    if (y1 - y0 < 0.18) { y0 = Math.min(y0, 0.3); y1 = Math.max(y1, 0.55); } // never a sliver
    return { x0, y0, x1, y1 };
  },

  // ---- what can be touched now ----
  hotOn(id) {
    const d = this.def();
    return !!(d && this.here() && d.hots && d.hots[id] && this.view === 'wide' && !this.busy);
  },
  label(id) { const d = this.def() || Object.values(ROOMS)[0]; const h = d && d.hots && d.hots[id]; return h ? (typeof h.label === 'function' ? h.label(this) : h.label) : id; },
  tap(id) {
    if (!this.hotOn(id)) return;
    Sound.unlock();
    this.go(this.def().hots[id].view);
  },

  // ---- the plate: title, a line of text, the controls of the view ----
  /** Builds the plate for the current view (hidden in the wide view unless a hint is on). */
  renderPanel() {
    const d = this.def(), el = $('#rm-panel');
    if (!d || !this.here()) { el.hidden = true; return; }
    const acts = $('#rm-acts');
    this.cancelHold();
    acts.replaceChildren(); acts.className = '';
    $('#rm-more').hidden = true; $('#rm-close').hidden = true;
    if (this.view === 'wide') { $('#rm-title').textContent = ''; $('#rm-status').textContent = ''; el.hidden = !this.tipOn; return; }
    const p = d.panel(this, this.view);
    $('#rm-title').textContent = p.title;
    $('#rm-status').textContent = p.status || '';
    if (p.cls) acts.className = p.cls;
    p.build(acts, this);
    el.hidden = false;
    this.place();
    const first = acts.querySelector('button:not(:disabled)');
    if (first) first.focus({ preventScroll: true });
  },
  say(text) { $('#rm-status').textContent = text; if ($('#rm-panel').hidden) { this.tipOn = true; $('#rm-panel').hidden = false; $('#rm-close').hidden = false; this.place(); } },
  /** One button of the plate; `act` names it for the checks (data-act). Nothing works while an animation runs. */
  btn(parent, content, act, fn, o = {}) {
    const b = h('button', { class: 'tr-act' + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : ''), type: 'button', 'data-act': act, 'aria-label': o.aria || null, 'aria-pressed': o.pressed == null ? null : String(!!o.pressed) }, ...(Array.isArray(content) ? content : [content]));
    b.addEventListener('click', () => { if (this.busy) return; Sound.unlock(); if (!o.keepHold) this.cancelHold(); fn(b); });
    parent.append(b);
    return b;
  },
  place() {
    const el = $('#rm-panel');
    if (el.hidden) return;
    const W = window.innerWidth, H = window.innerHeight, port = PlayerPortal.current, w = Math.min(340, W - 24);
    let left = 16, top = 16, maxH = H - 32;
    if (W < 640) { left = (W - w) / 2; top = 54; /* under the floor's row of buttons */ if (port) maxH = Math.max(160, port.el.getBoundingClientRect().top - 20); }
    el.style.width = Math.round(w) + 'px'; el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px'; el.style.maxHeight = Math.round(maxH) + 'px';
  },
  /** A hint over the wide view, or in the status line of the close look. */
  tip(text, more) {
    this.say(text);
    $('#rm-more').hidden = !more;
    $('#rm-close').hidden = this.view !== 'wide';
    if (this.view === 'wide') { this.tipOn = true; $('#rm-panel').hidden = false; $('#rm-title').textContent = ''; this.place(); }
  },
  closeTip() { if (this.view !== 'wide') { $('#rm-more').hidden = true; return; } this.tipOn = false; $('#rm-panel').hidden = true; syncUI(); },
  /** The floor's buttons and the plate follow what is going on (called by syncUI). */
  sync() {
    const here = this.here(), ov = App.overlay, close = here && this.view !== 'wide';
    $('#rm-back').hidden = !(close && !ov);
    $('#rm-hint').hidden = !(here && this.s && !this.s.done && !ov);
    $('#rm-reset').hidden = !(here && this.s && this.s.done && !ov && !close);
    $('#rm-panel').hidden = !(here && !ov && (close || this.tipOn));
    $('#rm-acts').classList.toggle('busy', this.busy);
  },

  // ---- animations, holds ----
  /** Runs one animation; nothing else can be touched meanwhile. */
  anim(fn) {
    this.busy = true; syncUI();
    Seq.run('rm', async (c) => { try { await fn(c); } finally { this.busy = false; syncUI(); } });
  },
  flash(k = 1) { if (!world.reduced) Seq.run('rmf', async (c) => { world.room.flash = k; await c.to(world.room, { flash: 0 }, 0.55, Ease.outCubic); }); },
  later(fn, ms) { const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms); this.timers.add(id); return id; },
  clearTimers() { for (const id of this.timers) clearTimeout(id); this.timers.clear(); this.cancelHold(); },
  /**
   * Staying: one tap starts a slow count (no holding the finger down, no speed), the button shows it, and any other
   * button — or a second tap on this one — interrupts it. `ms` is long on purpose; reduced motion keeps the time.
   */
  hold(b, ms, label, onDone, onStop) {
    if (this.holdCancel) { const was = this.holdBtn; this.cancelHold(); if (was === b) return; }
    const t0 = performance.now(), base = b.textContent;
    b.setAttribute('aria-pressed', 'true');
    let id = 0;
    const finish = () => { clearTimeout(id); this.holdCancel = null; this.holdBtn = null; b.textContent = base; b.setAttribute('aria-pressed', 'false'); };
    const tick = () => {
      const left = Math.max(0, ms - (performance.now() - t0));
      b.textContent = `${label} · ${Math.ceil(left / 1000)}`;
      if (left <= 0) { finish(); onDone(); return; }
      id = setTimeout(tick, 200); this.timers.add(id);
    };
    this.holdCancel = () => { finish(); if (onStop) onStop(); };
    this.holdBtn = b;
    tick();
  },
  cancelHold() { const c = this.holdCancel; this.holdCancel = null; if (c) c(); },

  // ---- hints ----
  hint() {
    const d = this.def(), s = this.s;
    if (!d || !s || s.done || !this.here() || App.overlay) return;
    const st = Math.min(s.stage, d.hints.length - 1), tiers = d.hints[st];
    if (this.hintStage !== st) { this.hintStage = st; this.hintTier = 0; } else this.hintTier = Math.min(tiers.length - 1, this.hintTier + 1);
    s.hints++; this.save(); Progress.hint(this.id);
    this.tip(tiers[this.hintTier], this.hintTier < tiers.length - 1);
  },

  // ---- the moment it is solved: the plate's own path (Progress.solve, the page, the chapter), once ----
  solve() {
    const d = this.def(), s = this.s;
    if (!d || !s || s.done || !this.here()) return;
    this.cancelHold();
    const first = !Progress.solved(this.id);
    s.stage = 3; s.done = true; this.save();
    Sound.ding();
    if (first) {
      Trial.finish(); // Progress.solve, the chapter into the book, the book opens on it
      Seq.run('rm', async (c) => { await c.to(world.room, { page: 1 }, rm(2.2), Ease.inOutSine); world.room.page = 0; });
      this.renderPanel(); this.say(d.done); live(d.done);
    } else { // played again: the chapter was already in the book — nothing is given twice
      this.renderPanel(); this.say(COPY.trialAgainDone); live(COPY.trialAgainDone);
    }
    syncUI();
  },
  /** The dev panel and the checks: the machine already stopped, the last look given. */
  solveNow() {
    if (!this.here() || this.s.done) return;
    this.s.stage = 2; this.s.spokes = ROOMS[this.id].code.slice(); this.save(); this.applyVisual();
    this.solve();
  },
  /** Two taps (the first one asks), unless forced by the checks or the dev panel. */
  reset(force) {
    if (!this.id) return;
    const now = performance.now(), btns = ['#rm-reset'];
    if (!force && now - this.resetArmed > 3500) {
      this.resetArmed = now;
      for (const b of btns) { $(b).textContent = COPY.rmResetSure; $(b).classList.add('armed'); }
      for (const b of document.querySelectorAll('#rm-acts [data-act="otra-vez"]')) b.textContent = COPY.rmResetSure;
      this.later(() => { for (const b of btns) { $(b).textContent = COPY.rmReset; $(b).classList.remove('armed'); } for (const b of document.querySelectorAll('#rm-acts [data-act="otra-vez"]')) b.textContent = 'JUGARLO DE NUEVO'; }, 3500);
      return;
    }
    this.resetArmed = 0;
    $('#rm-reset').textContent = COPY.rmReset; $('#rm-reset').classList.remove('armed');
    Seq.cancel('rm'); Seq.cancel('rmv'); Seq.cancel('rmf');
    this.cancelHold(); this.busy = false; this.tipOn = false; this.hintStage = -1;
    this.s = this.def().fresh(); this.save();
    Object.assign(world.room, { through: 0, page: 0, flash: 0 });
    this.applyVisual();
    live(COPY.rmResetDone);
    if (this.view !== 'wide') this.go('wide'); else { this.renderPanel(); syncUI(); }
  },

  /** For the checks. */
  debug() {
    const d = this.def(), s = this.s, panel = !$('#rm-panel').hidden;
    return { id: this.id, here: this.here(), view: this.view, busy: this.busy, stage: s ? s.stage : null, done: s ? s.done : null, spokes: s ? s.spokes.join('') : null, clock: s ? s.clock.join('') : null, cupTurned: s ? s.cupTurned : null,
      tries: s ? s.tries : null, hints: s ? s.hints : null, clue: d ? d.clue : null, done_line: d ? d.done : null, panel, title: panel ? $('#rm-title').textContent : '', status: $('#rm-status').textContent,
      more: !$('#rm-more').hidden, saved: this.id ? store.local.json(this.key(), null) : null, visual: { ...world.room, spokes: world.room.spokes.join(''), clock: world.room.clock.join('') },
      acts: [...document.querySelectorAll('#rm-acts [data-act]')].map((b) => ({ act: b.dataset.act, text: b.textContent, pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label') })),
      set: R && R.roomInfo ? R.roomInfo() : null, align: this.view === 'through' && R && R.roomAlignError ? R.roomAlignError() : null };
  },
};
const lvAim = world.floorAim;
world.floorAim = (a) => lvAim(a) || Room.floorAim(a);
