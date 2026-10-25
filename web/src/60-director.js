// ═══════════════════════════════════════════════════════════════════════════════════════════
// APP  (renderer handle, overlays, hotspots, UI sync)
// ═══════════════════════════════════════════════════════════════════════════════════════════
let R = null; // active renderer (3D or 2D) — both expose the same interface
const App = { overlay: null, submitting: false, seqBob: 0, time: 0, running: false, raf: 0, last10Sec: -1, minuteKey: '', readyResolve: null, booted: false };
const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const trackOf = (n) => tracks.find((t) => t.floor === n);
const rm = (sec) => (world.reduced ? sec * 0.5 : sec);
/** Tweens the camera to a pose taking the shortest way around for yaw. */
function toPose(c, pose, dur, ease) {
  const cam = world.cam;
  let d = (pose.yaw - cam.yaw) % TAU;
  if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
  return c.to(cam, { x: pose.x, y: pose.y, z: pose.z, yaw: cam.yaw + d, pitch: pose.pitch, fov: pose.fov }, dur, ease || Ease.inOutSine);
}
const setPose = (pose) => Object.assign(world.cam, pose);
/** Folds free walk into the camera pose before a scripted move. */
function bakeWalk() {
  const c = world.cam, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
  c.x += cy * look.walkX - sy * look.walkZ; c.z += -sy * look.walkX - cy * look.walkZ;
  look.walkX = look.walkZ = look.moveX = look.moveZ = 0;
}

const Hot = (() => {
  const root = $('#hotspots');
  const map = new Map();
  return {
    add(id, label, onActivate) {
      const b = h('button', { class: 'hot', type: 'button', 'aria-label': label });
      b.hidden = true;
      b.addEventListener('click', () => { Sound.unlock(); onActivate(); });
      const hov = (on) => { if (!id.includes('-')) return; if (on) world.hover = id; else if (world.hover === id) world.hover = null; };
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hov(true); });
      b.addEventListener('pointerleave', () => hov(false));
      b.addEventListener('focus', () => { if (b.matches(':focus-visible')) hov(true); });
      b.addEventListener('blur', () => hov(false));
      root.append(b);
      map.set(id, { el: b, on: false });
    },
    label(id, text) { const it = map.get(id); if (it) it.el.setAttribute('aria-label', text); },
    enable(pred) { for (const [id, it] of map) { it.on = pred(id); if (!it.on && world.hover === id) world.hover = null; } },
    update() {
      for (const [id, it] of map) {
        const r = it.on && R ? R.project(id) : null;
        if (!r) { if (!it.el.hidden) it.el.hidden = true; continue; }
        const w = Math.max(44, r.w), hh = id.startsWith('floor-') ? r.h : Math.max(44, r.h);
        it.el.hidden = false;
        it.el.style.transform = `translate(${Math.round(r.x - (w - r.w) / 2)}px,${Math.round(r.y - (hh - r.h) / 2)}px)`;
        it.el.style.width = Math.round(w) + 'px'; it.el.style.height = Math.round(hh) + 'px';
      }
    },
  };
})();

function syncUI() {
  const p = world.phase, ov = App.overlay;
  const ext = p === 'prelaunch' || p === 'launching' || p === 'open';
  $('#title').style.opacity = ext && ov !== 'form' && !(ov === 'listen' && (aspectNow() < 1.2 || window.innerHeight < 520)) ? '1' : '0';
  document.documentElement.dataset.phase = p;
  $('#cap-primary').hidden = !(p === 'prelaunch' && !world.called);
  $('#cap-reserved').hidden = !(p === 'prelaunch' && world.called);
  $('#cap-secondary').hidden = p !== 'prelaunch';
  $('#cap-enter').hidden = p !== 'open';
  $('#floor-actions').hidden = p !== 'floor';
  { // the level: "alejarse" while looking closely; the hint while unsolved; reset once done
    const lv = Level.here(), close = lv && Level.view !== 'wide';
    $('#lv-back').hidden = !(close && !ov);
    $('#cap-back').hidden = !!close; $('#cap-invite').hidden = !!close;
    $('#lv-hint').hidden = !(lv && !Level.s.done && !ov);
    $('#lv-reset').hidden = !(lv && Level.s.done && !ov && !close);
    if (!lv) { $('#lv-tip').hidden = true; }
  }
  const inGallery = p === 'gallery', atPiece = inGallery && world.gallery.at >= 0;
  $('#gal-actions').hidden = !inGallery;
  $('#gal-cap').hidden = !atPiece || !!ov;
  $('#gal-back').textContent = atPiece && !Gallery.guided() ? COPY.backRoom : Gallery.from === 'elevator' ? COPY.backElevator : COPY.backLobby;
  { const cv = $('#cab-view'), on = p === 'cabin' && !ov && window.innerHeight < 520 && window.innerWidth > window.innerHeight;
    cv.hidden = !on; if (on) cv.textContent = (world.cabView || (world.platform ? 'rows' : 'top')) === 'rows' ? COPY.cabTop : COPY.cabRows; }
  $('#cap-invite-all').hidden = !((ext || (p === 'cabin' && aspectNow() >= 0.8)) && !ov); // on a phone the plate fills the cabin view
  const pend = Gate.pending();
  const note = $('#cap-invited-note'), go = $('#cap-invited-go');
  note.hidden = !(p === 'prelaunch' && pend); go.hidden = !(p === 'open' && pend);
  if (pend) { note.textContent = `Te invitaron a «${pend.title}». Abre cuando llegue el ascensor.`; go.textContent = `Te invitaron a «${pend.title}» — entrar`; }
  $('#captions').classList.toggle('busy', !!ov);
  { // a minimized "Mientras esperás" follows what is open; on phones the sign-up plate makes room below it
    const lp = Listen.portal(), mini = !!(lp && lp.mini);
    document.documentElement.style.setProperty('--mini-reserve', mini && ov === 'form' && window.innerWidth <= 720 ? Listen.TOP + lp.el.offsetHeight + 12 + 'px' : '0px');
    $('#captions').style.paddingRight = '';
    if (mini) lp.layout();
  }
  $('#book-open').hidden = !(Book.state.found && !ov && (ext || p === 'cabin' || p === 'floor' || p === 'gallery'));
  Hot.enable((id) => {
    if (id === 'call') return p === 'prelaunch' && !ov;
    if (id === 'elevator') return p === 'open' && !ov;
    if (id === 'book') return (p === 'prelaunch' || p === 'open') && !ov && Book.canPick();
    if (id === 'page') return p === 'floor' && !ov && !!Book.pageHere();
    if (id === 'gallery') return (p === 'prelaunch' || p === 'open') && !ov && GALLERY.enabled;
    if (id.startsWith('piece-')) return p === 'gallery' && !ov && world.gallery.at < 0;
    if (id.startsWith('lv-')) return p === 'floor' && !ov && Level.hotOn(id);
    return p === 'cabin' && !ov;
  });
  if (GALLERY.enabled) Hot.label('floor-' + GALLERY_FLOOR, `Piso ${GALLERY_FLOOR}: ${GALLERY.label}${world.floor === GALLERY_FLOOR ? ', estás acá' : ''}`);
  for (const id of LEVEL_HOTS) Hot.label(id, Level.label(id));
  Hot.label('floor-0', `PB: volver a la entrada${world.floor === 0 ? ', estás acá' : ''}`);
  for (const tr of tracks) Hot.label('floor-' + tr.floor, `Piso ${tr.floor}: ${tr.title}${world.visited.includes(tr.floor) ? ', visitado' : ''}${world.floor === tr.floor ? ', estás acá' : ''}`);
  for (const pf of ['youtube', 'spotify']) Hot.label('sel-' + pf, `Viajar por ${pf === 'youtube' ? 'YouTube' : 'Spotify'}${world.platform === pf ? ' (elegido)' : ''}`);
  $('#dev').classList.toggle('shy', !!ov && !Dev.isOpen());
  Dev.refresh();
}
function setPhase(p) { world.phase = p; syncUI(); }
const LEVEL_HOTS = ['lv-wall', 'lv-stones', 'lv-painting', 'lv-hatch', 'lv-box', 'lv-dial-0', 'lv-dial-1', 'lv-dial-2', 'lv-latch', 'lv-object'];
let hintTimer = 0;
function hint(text) {
  const el = $('#cap-hint');
  el.textContent = text; el.hidden = false; live(text);
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PORTALS  (one official player at a time; the world glows behind it)
// ═══════════════════════════════════════════════════════════════════════════════════════════
function closePortal() {
  if (PlayerPortal.current) PlayerPortal.current.destroy();
  world.playing = false;
  Seq.cancel('glow');
  world.glow.amount = 0; world.glow.rect = null;
}
function openPortal(opts, accent) {
  closePortal();
  const portal = new PlayerPortal({ ...opts, onChange: (info) => { world.playing = info.playing; Dev.refresh(); } });
  world.glow.accent = accent;
  Seq.run('glow', (c) => c.to(world.glow, { amount: 1 }, 1.2, Ease.outCubic));
  return portal;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PRELAUNCH OVERLAYS  (passenger register, listening while waiting)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Register = {
  open() {
    if (world.phase !== 'prelaunch' || App.overlay) return;
    App.overlay = 'form';
    const wrap = $('#plate-wrap'), plate = $('#plate');
    $('#lead-form').hidden = false; $('#plate-confirm').hidden = true;
    wrap.hidden = false;
    const r = R.project('call');
    if (r && window.innerWidth > 720) plate.style.transformOrigin = `${r.x + r.w / 2 - plate.offsetLeft}px ${r.y + r.h / 2 - plate.offsetTop}px`;
    else plate.style.transformOrigin = '50% 100%';
    this.restore = document.activeElement;
    requestAnimationFrame(() => requestAnimationFrame(() => plate.classList.remove('folded')));
    setTimeout(() => { if (App.overlay === 'form') $('#lead-name').focus({ preventScroll: true }); }, 650);
    bakeWalk();
    Seq.run('cam', async (c) => { c.spawn((cc) => cc.to(world, { exposure: 0.8 }, 1.2)); await toPose(c, poseFromShot(Shots.form(aspectNow())), rm(1.4)); });
    syncUI();
  },
  close(celebrate) {
    if (App.overlay !== 'form') return;
    App.overlay = null;
    const wrap = $('#plate-wrap'), plate = $('#plate');
    plate.classList.add('folded');
    setTimeout(() => { if (App.overlay !== 'form') wrap.hidden = true; }, 620);
    $('#privacy').hidden = true;
    if (this.restore && this.restore.focus && document.contains(this.restore)) this.restore.focus({ preventScroll: true });
    if (world.phase === 'prelaunch') Seq.run('cam', async (c) => { c.spawn((cc) => cc.to(world, { exposure: 1 }, 1.2)); await toPose(c, poseFromShot(Shots.spawn(aspectNow())), rm(1.4)); });
    if (celebrate && world.phase === 'prelaunch') Register.celebrate();
    syncUI();
  },
  /** A line of light runs along the doors and the reservation appears in the world. */
  celebrate() {
    Seq.run('reg', async (c) => {
      const w = world;
      await c.wait(rm(1.3));
      w.lineFade = 1; w.line = 0; w.seam = 0;
      Sound.ding();
      await c.to(w, { line: 1 }, 0.9, Ease.inOutSine);
      await c.to(w, { seam: 1 }, 0.3, Ease.outCubic);
      w.say.note.text = COPY.reservedNote;
      c.spawn((cc) => cc.to(w.say.subtitle, { alpha: 0 }, 0.5));
      await c.to(w.say.note, { alpha: 1 }, 0.8);
      await c.wait(0.6);
      await c.to(w, { lineFade: 0 }, 1.0);
      w.line = 0; w.seam = 0; w.lineFade = 1;
      await c.wait(5);
      await c.to(w.say.note, { alpha: 0 }, 0.8);
      await c.to(w.say.subtitle, { alpha: 1 }, 0.8);
    });
  },
  showErrors(errors) {
    for (const k of ['whatsapp', 'email', 'instagram', 'consent']) {
      const el = $('#err-' + k), input = $('#lead-' + k), msg = errors[k];
      el.hidden = !msg; el.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (k !== 'consent') input.closest('.field').classList.toggle('bad', !!msg || !!errors.group);
    }
    const gEl = $('#err-group');
    gEl.hidden = !errors.group; gEl.textContent = errors.group || '';
  },
  async submit() {
    if (App.submitting) return;
    const f = { name: $('#lead-name').value, whatsapp: $('#lead-whatsapp').value, email: $('#lead-email').value, instagram: $('#lead-instagram').value, consent: $('#lead-consent').checked };
    const v = Lead.validate(f);
    this.showErrors(v.errors);
    if (!v.ok) {
      const first = v.errors.group ? 'whatsapp' : ['whatsapp', 'email', 'instagram', 'consent'].find((k) => v.errors[k]);
      $('#lead-' + first).focus();
      return;
    }
    const btn = $('#lead-submit');
    App.submitting = true; btn.disabled = true; btn.textContent = COPY.registering;
    let res;
    try {
      res = await submitLead({
        ...v.values, consent: true, consentText: $('label[for="lead-consent"]').textContent.trim(), consentVersion: CONSENT_VERSION,
        // the host tells the live site, its previews and tests apart
        source: 'prelaunch:' + (location.hostname || 'local'), locale: navigator.language || '', timeZone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',
        createdAt: new Date().toISOString(), website: $('#lead-website').value,
      });
    } catch { res = { ok: false, error: COPY.submitFailed }; }
    App.submitting = false; btn.disabled = false; btn.textContent = COPY.cta;
    if (!res.ok) { this.showErrors({ group: res.error || COPY.submitFailed }); return; }
    $('#lead-form').hidden = true;
    const conf = $('#plate-confirm');
    conf.hidden = false;
    $('.conf-main', conf).textContent = res.duplicate ? COPY.duplicate : COPY.reservedNote;
    $('.conf-sub', conf).textContent = res.duplicate ? '' : res.destination === 'local' ? COPY.savedLocal : res.destination === 'memory' ? COPY.savedMemory : '';
    world.called = true;
    $('#lead-form').reset();
    setTimeout(() => Register.close(!res.duplicate), res.duplicate ? 3200 : 1900);
  },
};

const Listen = {
  /** The "Mientras esperás" player, when it is on screen (full size or minimized). */
  portal() { const p = PlayerPortal.current; return p && p.kind === 'listen' ? p : null; },
  ask() {
    const playing = this.portal();
    if (playing && playing.mini && !App.overlay) { playing.setMini(false); return; } // already sounding: bring it back
    if (world.phase !== 'prelaunch' || App.overlay) return;
    App.overlay = 'question';
    this.restore = document.activeElement;
    $('#question').hidden = false;
    $('#q-youtube').focus({ preventScroll: true });
    syncUI();
  },
  choose(provider) {
    if (world.phase !== 'prelaunch') return;
    $('#question').hidden = true;
    App.overlay = 'listen';
    openPortal({ provider, kind: 'listen', videoId: DEMO_ALBUM.youtubeVideoId, start: 0, trackUri: null, albumId: DEMO_ALBUM.spotifyAlbumId, title: DEMO_ALBUM.title, closable: true,
      onClose: () => Listen.close(), onMini: (v) => Listen.minimized(v), place: (m, h) => Listen.place(m, h) }, '#ebe5d5');
    bakeWalk();
    this.view(true);
    syncUI();
  },
  /** Minimized, the song goes on and the entrance is free again (sign up, look around); expanded, the listening view. */
  minimized(v) {
    if (world.phase !== 'prelaunch') return;
    if (v && App.overlay === 'listen') { App.overlay = null; this.view(false); }
    else if (!v && !App.overlay) { App.overlay = 'listen'; this.view(true); }
    syncUI();
  },
  /** Where the minimized player waits: clear of the entrance buttons, of the sign-up plate and of the DEV chip. */
  place(m, h) {
    const left = m.W - m.blockW - 10, caps = $('#captions');
    caps.style.paddingRight = '';
    if (App.overlay === 'form') return window.innerWidth <= 720 ? { left, top: Listen.TOP } : { left: 10, bottom: 40 }; // phones: above the plate
    const base = m.phone ? 12 : m.H < 520 ? 8 : 40;
    const lifted = () => { // above any entrance button it would cover
      let bottom = base;
      for (const el of caps.children) {
        if (el.hidden) continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.right > left && r.left < left + m.blockW && r.bottom > m.H - bottom - h) bottom = Math.max(bottom, m.H - r.top + 8);
      }
      return bottom;
    };
    let bottom = lifted();
    if (m.H - bottom - h < Listen.TOP) { caps.style.paddingRight = m.blockW + 20 + 'px'; bottom = lifted(); } // no room above them (a phone lying down): they step aside
    return { left, bottom };
  },
  /** Least distance from the top of the screen: below the sound toggle. */
  TOP: 46,
  /** The camera: the listening framing while the player is open full size, the entrance otherwise. */
  view(on) {
    if (on) Seq.run('cam', async (c) => { c.spawn((cc) => cc.to(world, { exposure: 0.86 }, 1)); c.spawn((cc) => cc.to(world.countdown, { dim: aspectNow() < 1.2 ? 0 : 0.45 }, 1)); await toPose(c, poseFromShot(Shots.listen(aspectNow())), rm(1.6)); });
    else if (world.phase === 'prelaunch') Seq.run('cam', async (c) => { c.spawn((cc) => cc.to(world, { exposure: 1 }, 1)); c.spawn((cc) => cc.to(world.countdown, { dim: 1 }, 1)); await toPose(c, poseFromShot(Shots.spawn(aspectNow())), rm(1.4)); });
  },
  /** Ends it from any state: the question, the listening view, or minimized while the visitor does something else. */
  close() {
    const viewing = App.overlay === 'question' || App.overlay === 'listen';
    if (!viewing && !this.portal()) return;
    $('#question').hidden = true;
    if (viewing || this.portal()) closePortal();
    if (viewing) {
      App.overlay = null;
      if (this.restore && this.restore.focus && document.contains(this.restore)) this.restore.focus({ preventScroll: true });
      this.view(false);
    }
    syncUI();
  },
};
function closeOverlays() {
  if (App.overlay === 'bookpick') { Book.abortPick(); App.overlay = null; }
  if (App.overlay === 'book') { $('#book').hidden = true; App.overlay = null; }
  if (App.overlay === 'invite' || App.overlay === 'gate') { $('#invite').hidden = true; $('#gate').hidden = true; App.overlay = null; }
  if (App.overlay === 'form') { App.overlay = null; $('#plate').classList.add('folded'); $('#plate-wrap').hidden = true; $('#privacy').hidden = true; }
  if (App.overlay === 'question' || App.overlay === 'listen') { $('#question').hidden = true; App.overlay = null; }
  if (App.overlay === 'level') { $('#lv-card').hidden = true; App.overlay = null; }
  closePortal();
  for (const ch of ['cam', 'reg']) Seq.cancel(ch);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DIRECTOR  (state machine + cancellable sequences; every jump goes through an idempotent apply*)
// ═══════════════════════════════════════════════════════════════════════════════════════════
function resetWorld() {
  Seq.cancelAll();
  closeOverlays();
  const w = world;
  Object.assign(w, { doors: 0, needle: 9.6, line: 0, lineFade: 1, seam: 0, flare: 0, lamp: 0, spill: 0, exposure: 1, shake: 0, tremor: 0, speed: 0, prism: 0, bands: 0, arrow: 0, cabinJolt: 0, env: 0, floor: 0, playing: false, refuse: 0, lookScale: 1 });
  Object.assign(w.countdown, { alpha: 0, dim: 1, last10: 0, pulse: 0 });
  w.say.subtitle.text = COPY.subtitle; w.say.subtitle.alpha = 0; w.say.main.alpha = 0; w.say.main.reveal = 0; w.say.note.alpha = 0;
  Object.assign(w.hand, { reach: 0, press: 0, point: 0, lift: 0, target: null, show: false });
  Object.assign(w.book, { lift: 0, light: 0, take: 0 });
  w.lit = {};
  w.pressed = { 'sel-youtube': w.platform === 'youtube' ? 1 : 0, 'sel-spotify': w.platform === 'spotify' ? 1 : 0 };
  w.called = Lead.registered();
  App.seqBob = 0;
  look.walkX = look.walkZ = look.moveX = look.moveZ = 0; look.dragYaw = look.dragPitch = 0;
  if (App.hum) { App.hum.stop(); App.hum = null; }
  world.gallery.at = -1;
  if (Level.s) Level.leave();
  setPlace(0);
  Roam.reset();
}
function applyPrelaunch() {
  resetWorld();
  world.countdown.alpha = 1; world.say.subtitle.alpha = 1;
  setPose(poseFromShot(Shots.spawn(aspectNow())));
  setPhase('prelaunch');
}
function applyOpen() {
  resetWorld();
  Object.assign(world, { doors: 1, needle: 0, line: 1, lineFade: 0.45, lamp: 1, spill: 1 });
  world.say.main.text = COPY.open; world.say.main.alpha = 1; world.say.main.reveal = 1;
  setPose(poseFromShot(Shots.spawn(aspectNow())));
  setPhase('open');
}
function applyCabin(floor = 0, doorsOpen = true) {
  resetWorld();
  Object.assign(world, { doors: doorsOpen ? 1 : 0, needle: floor, floor, env: floor, line: 1, lineFade: 0.45, lamp: 1, spill: doorsOpen ? 1 : 0 });
  if (floor > 0 && doorsOpen) setPlace(floor);
  setPose(poseFromShot(Shots.panel(aspectNow())));
  setPhase('cabin');
}
function applyFloor(n) {
  const tr = trackOf(n);
  if (!tr) return;
  resetWorld();
  if (!world.platform) setPlatform('youtube');
  Object.assign(world, { doors: 1, needle: n, floor: n, env: n, line: 1, lineFade: 0.45, lamp: 1, spill: 1 });
  R.setFloor(tr);
  setPose(poseFromShot(Shots.floor(aspectNow())));
  arriveOnFloor(n);
}
function setPlatform(p) {
  world.platform = p;
  store.session.set('eldom.platform', p);
  world.pressed['sel-youtube'] = p === 'youtube' ? 1 : 0; world.pressed['sel-spotify'] = p === 'spotify' ? 1 : 0;
}
function markVisited(n) {
  if (!world.visited.includes(n)) { world.visited = [...world.visited, n].sort((a, b) => a - b); store.session.setJson('eldom.visited', world.visited); }
}
function arriveOnFloor(n) {
  const tr = trackOf(n);
  world.lookScale = 0.22;
  markVisited(n);
  Links.setHash(tr.id); // the address now is this world's own link
  setPhase('floor');
  openPortal({ provider: world.platform || 'youtube', kind: 'floor', align: alignFor(tr), videoId: tr.youtubeVideoId, start: tr.youtubeStartSeconds || 0,
    trackUri: tr.spotifyTrackUri, albumId: tr.spotifyAlbumId, title: tr.title, duration: tr.durationSeconds, closable: false }, tr.visualAccent);
  live(`Llegaste al piso ${n}: ${tr.title}.`);
  Roam.reset();
  Level.arrive(n);
}
const prismPulse = (k = 1) => { if (!world.reduced) Seq.run('prism', async (c) => { await c.to(world, { prism: k }, 0.06); await c.to(world, { prism: 0 }, 0.18); }); };

async function openDoors(c, dur, hesitate) {
  Sound.doorMotor(dur, true);
  c.spawn((cc) => cc.to(world, { lamp: 1 }, Math.min(1.2, dur * 0.4), Ease.outCubic));
  c.spawn((cc) => cc.to(world, { spill: 1 }, dur, Ease.inOutSine));
  if (hesitate) { await c.to(world, { doors: 0.03 }, 0.4, Ease.outQuad); await c.to(world, { doors: 1 }, dur - 0.4, Ease.inOutSine); }
  else await c.to(world, { doors: 1 }, dur, Ease.inOutSine);
}
async function closeDoors(c, dur) {
  if (world.doors < 0.02) return;
  Sound.doorMotor(dur, false);
  c.spawn((cc) => cc.to(world, { spill: 0 }, dur, Ease.inOutSine));
  await c.to(world, { doors: 0.1 * world.doors }, dur * 0.72, Ease.inOutSine);
  await c.to(world, { doors: 0 }, dur * 0.28, Ease.outQuad);
  Sound.thunk();
  c.spawn(async (cc) => { await cc.to(world, { cabinJolt: 0.005 }, 0.05); await cc.to(world, { cabinJolt: 0 }, 0.3); });
}

/** Countdown reached zero (full = the visitor watched it happen; otherwise the short arrival version). */
function launch(full) {
  closeOverlays();
  const w = world;
  setPhase('launching');
  Seq.run('main', async (c) => {
    const cd = w.countdown;
    if (full) {
      c.spawn(async (cc) => { for (let i = 0; i < 3; i++) { await cc.to(cd, { alpha: 0.12 }, 0.08); await cc.to(cd, { alpha: 0.8 - i * 0.28 }, 0.1); } await cc.to(cd, { alpha: 0 }, 0.26); });
      c.spawn((cc) => cc.to(w.say.subtitle, { alpha: 0 }, 0.8));
      c.spawn((cc) => cc.to(w.say.note, { alpha: 0 }, 0.5));
      await c.wait(0.6);
      R.ripple(0, 1.0, 1.0);
      c.spawn(async (cc) => { await cc.wait(1.0); R.ripple(0, 1.0, 0.55); });
      await c.wait(0.4); // T = 1.0
      c.spawn((cc) => cc.to(w, { line: 1 }, 1.1, Ease.inOutSine));
      c.spawn(async (cc) => { await cc.wait(1.05); await cc.to(w, { seam: 1 }, 0.35, Ease.outCubic); });
      c.spawn(async (cc) => { await cc.to(w, { needle: -0.3 }, 1.5, Ease.inOutCubic); await cc.to(w, { needle: 0 }, 0.5, Ease.outBack); });
      await c.wait(1.0); // T = 2.0
      Sound.rumble(2.2);
      c.spawn(async (cc) => { await cc.to(w, { shake: 0.004, tremor: 1 }, 0.7, Ease.inOutSine); await cc.wait(0.6); await cc.to(w, { shake: 0, tremor: 0 }, 0.7, Ease.inOutSine); });
      await c.wait(2.0); // T = 4.0
      Sound.ding();
      c.spawn(async (cc) => { await cc.to(w, { flare: 1 }, 0.12); await cc.to(w, { flare: 0 }, 0.9); });
      await c.wait(0.2);
    } else {
      cd.alpha = 0; w.say.subtitle.alpha = 0;
      await c.wait(1.2);
      c.spawn(async (cc) => { await cc.to(w, { needle: 0 }, 1.0, Ease.outBack); });
      await c.to(w, { line: 1 }, 0.9, Ease.inOutSine);
      await c.to(w, { seam: 1 }, 0.25, Ease.outCubic);
      Sound.ding();
    }
    c.spawn(async (cc) => {
      await cc.wait(full ? 1.8 : 0.9);
      w.say.main.text = COPY.open; w.say.main.reveal = 0;
      cc.spawn((c3) => c3.to(w.say.main, { alpha: 1 }, 0.6));
      await cc.to(w.say.main, { reveal: 1 }, world.reduced ? 0.2 : 1.5, Ease.inOutSine);
    });
    await openDoors(c, full ? rm(4.5) : rm(2.8), full);
    c.spawn((cc) => cc.to(w, { lineFade: 0.45 }, 1.5));
    live(COPY.liveOpen);
    setPhase('open');
  });
}

/** Walks into the cabin and turns around to face the doors and the panel. */
function enterCabin() {
  if (world.phase !== 'open') return;
  world.cabView = null;
  bakeWalk();
  setPhase('entering');
  Seq.run('main', async (c) => {
    const cam = world.cam, a = aspectNow();
    c.spawn((cc) => cc.to(world.say.main, { alpha: 0 }, 1.2));
    const dist = Math.hypot(cam.x, cam.z - 2.6);
    App.seqBob = 1;
    let step = 0;
    const walk = toPose(c, { x: 0, y: 1.6, z: 2.6, yaw: 0, pitch: 0.02, fov: 52 }, rm(clamp(dist / 2.6, 0.6, 3.4)), Ease.inOutSine);
    c.spawn(async (cc) => { for (;;) { await cc.wait(0.52); if (world.cam.z < 2.7) return; Sound.steps(); R.ripple(world.cam.x + (step++ % 2 ? 0.12 : -0.12), world.cam.z - 0.3, 0.16); } });
    await walk;
    App.seqBob = 0.5;
    await c.to(cam, { z: -0.95, y: 1.85 + CAB_LIFT }, rm(1.7), Ease.inOutSine); // up the three steps
    App.seqBob = 0;
    await toPose(c, poseFromShot(Shots.panel(a)), rm(1.7), Ease.inOutCubic);
    setPhase('cabin');
  });
}

/** One finger press on a panel control: anticipation → reach → contact → hold → retract (fingers relax late). */
async function handPress(c, id, onContact, latch) {
  const hd = world.hand, red = world.reduced;
  hd.target = R.cabin.target(id);
  if (!red) await c.to(hd, { reach: -0.07, point: 1 }, 0.18, Ease.outQuad); else hd.point = 1;
  await c.to(hd, { reach: 1 }, red ? 0.35 : 0.5, Ease.outCubic);
  Sound.click();
  await c.tween(0.12, Ease.outQuad, (p) => { hd.press = p; world.pressed[id] = Math.max(world.pressed[id] || 0, p); });
  onContact();
  await c.wait(0.15);
  c.spawn(async (cc) => { await cc.wait(0.2); await cc.to(hd, { point: 0 }, 0.35, Ease.inOutSine); });
  c.spawn((cc) => cc.tween(0.16, Ease.outQuad, (p) => { hd.press = 1 - p; if (!latch()) world.pressed[id] = 1 - p; }));
  await c.to(hd, { reach: 0 }, red ? 0.25 : 0.4, Ease.inOutCubic);
  hd.target = null;
}

function choosePlatform(p) {
  if (world.phase !== 'cabin') { setPlatform(p); syncUI(); return; }
  setPhase('pressing');
  Seq.run('main', async (c) => {
    const id = 'sel-' + p, other = 'sel-' + (p === 'youtube' ? 'spotify' : 'youtube');
    await handPress(c, id, () => {
      Sound.latch();
      const was = world.pressed[other] || 0;
      setPlatform(p);
      world.pressed[other] = was;
      c.spawn((cc) => cc.to(world.pressed, { [other]: 0 }, 0.18, Ease.outBack));
      live(`Viajás por ${p === 'youtube' ? 'YouTube' : 'Spotify'}.`);
    }, () => true);
    if (window.innerHeight < 520 && window.innerWidth > window.innerHeight) { world.cabView = 'rows'; await toPose(c, poseFromShot(Shots.panel(aspectNow())), rm(0.9), Ease.inOutCubic); }
    setPhase('cabin');
  });
}

/** The cabin moves from `from` to floor n behind closed doors (the world is built meanwhile), then settles and rings. */
async function travel(c, from, n, T) {
  const tr = trackOf(n), dist = Math.abs(n - from), dir = n > from ? 1 : -1;
  world.arrow = dir;
  setPhase('traveling');
  world.env = n;
  setPlace(n);
  App.hum = Sound.travelHum();
  Sound.whoosh(1.2);
  let last = from;
  await c.tween(T, Ease.linear, (p) => {
    const pos = p * p * p * (p * (6 * p - 15) + 10); // smooth start and stop
    const v = (30 * p * p * (1 - p) * (1 - p)) / 1.875;
    const acc = Math.abs(60 * p * (1 - p) * (1 - 2 * p)) / 5.77;
    world.needle = lerp(from, n, pos);
    world.speed = v; world.bands = v * 0.9; world.bandPhase = pos * dist * 1.3 * dir;
    world.cabinJolt = 0.0011 * v + 0.0032 * acc;
    App.hum.set(v);
    const passed = dir > 0 ? Math.floor(world.needle + 0.02) : Math.ceil(world.needle - 0.02);
    if (passed !== last && passed !== n) { last = passed; Sound.floorTick(); prismPulse(0.55); }
  });
  App.hum.stop(); App.hum = null;
  Object.assign(world, { speed: 0, bands: 0, cabinJolt: 0, needle: n, floor: n });
  setPhase('arriving');
  const y0 = world.cam.y;
  if (!world.reduced) await c.tween(0.55, Ease.linear, (p) => { world.cam.y = y0 + Math.sin(p * TAU) * 0.011 * (1 - p); });
  world.cam.y = y0;
  await c.wait(0.35);
  Sound.arrivalDing(); prismPulse();
  world.arrow = 0;
  await c.wait(0.45);
}
/** Doors open onto the world and the visitor steps out. */
async function stepOut(c, n) {
  await openDoors(c, rm(1.8), false);
  setPhase('exiting');
  App.seqBob = 0.7;
  c.spawn(async (cc) => { await cc.wait(rm(1.3)); Sound.steps(); R.ripple(0, 1.5, 0.3); });
  const gallery = n === GALLERY_FLOOR && GALLERY.enabled;
  await toPose(c, gallery ? GalleryShots.room(aspectNow()) : poseFromShot(Shots.floor(aspectNow())), rm(2.3), Ease.inOutSine);
  App.seqBob = 0;
  if (gallery) Gallery.arrive('elevator'); else arriveOnFloor(n);
}
/** An invitation: the receiver is already in the cabin with the doors closed; a short ride takes them to the world. */
function inviteRide(n) {
  if (!trackOf(n)) return;
  Seq.run('main', async (c) => {
    c.spawn((cc) => cc.to(world, { exposure: 1 }, 0.9));
    live(`Viajando al piso ${n}.`);
    await c.wait(0.4);
    await travel(c, 0, n, rm(3.0));
    await stepOut(c, n);
  });
}

function pressFloor(n) {
  const tr = trackOf(n);
  if (world.phase !== 'cabin' || !tr) return;
  if (!world.platform) {
    Sound.buzz();
    hint(COPY.chooseFirst);
    Seq.run('refuse', async (c) => { world.refuse = 1; await c.to(world, { refuse: 0 }, 1.0, Ease.inQuad); });
    return;
  }
  const id = 'floor-' + n, a = aspectNow();
  setPhase('pressing');
  Seq.run('main', async (c) => {
    await handPress(c, id, () => { world.lit[id] = 1; }, () => true);
    setPhase('departing');
    const from = world.floor, same = from === n && world.env === n;
    live(same ? `Piso ${n}.` : `Viajando al piso ${n}.`);
    await c.wait(0.3);
    if (world.reduced) setPose(poseFromShot(Shots.doors(a))); else c.spawn((cc) => toPose(cc, poseFromShot(Shots.doors(a)), 0.75));
    if (!same) {
      await c.wait(0.1);
      await closeDoors(c, 1.7);
      closePortal();
      await c.wait(0.5);
      await travel(c, from, n, rm(Math.min(6.2, 2.8 + 0.35 * Math.abs(n - from))));
    } else {
      R.setFloor(tr);
      await c.wait(0.5);
    }
    c.spawn(async (cc) => { await cc.wait(0.8); cc.spawn((c3) => c3.to(world.lit, { [id]: 0 }, 0.8)); await cc.to(world.pressed, { [id]: 0 }, 0.2, Ease.outBack); });
    await stepOut(c, n);
  });
}

/** Top row of the panel: the gallery (no platform needed — there is no player there). */
function pressGallery() {
  if (world.phase !== 'cabin' || !GALLERY.enabled) return;
  const n = GALLERY_FLOOR, id = 'floor-' + n, a = aspectNow();
  setPhase('pressing');
  Seq.run('main', async (c) => {
    await handPress(c, id, () => { world.lit[id] = 1; }, () => true);
    setPhase('departing');
    const from = world.floor;
    live(`Viajando al piso ${n}.`);
    await c.wait(0.3);
    if (world.reduced) setPose(poseFromShot(Shots.doors(a))); else c.spawn((cc) => toPose(cc, poseFromShot(Shots.doors(a)), 0.75));
    if (from !== n) {
      await c.wait(0.1);
      await closeDoors(c, 1.7);
      closePortal();
      await c.wait(0.5);
      await travel(c, from, n, rm(Math.min(6.2, 2.8 + 0.35 * Math.abs(n - from))));
    } else { setPlace(n); world.env = n; await c.wait(0.5); }
    c.spawn(async (cc) => { await cc.wait(0.8); cc.spawn((c3) => c3.to(world.lit, { [id]: 0 }, 0.8)); await cc.to(world.pressed, { [id]: 0 }, 0.2, Ease.outBack); });
    await stepOut(c, n);
  });
}

/** PB: the cabin goes back down to the entrance and the visitor walks out, down the steps, and turns to face the elevator. */
function pressLobby() {
  if (world.phase !== 'cabin') return;
  const id = 'floor-0', a = aspectNow();
  setPhase('pressing');
  Seq.run('main', async (c) => {
    await handPress(c, id, () => { world.lit[id] = 1; }, () => true);
    setPhase('departing');
    const from = world.floor, moves = from !== 0 || world.env !== 0;
    live(COPY.liveLobby);
    await c.wait(0.3);
    if (world.reduced) setPose(poseFromShot(Shots.doors(a))); else c.spawn((cc) => toPose(cc, poseFromShot(Shots.doors(a)), 0.75));
    if (moves) {
      await c.wait(0.1);
      await closeDoors(c, 1.7);
      closePortal();
      await c.wait(0.5);
      await travel(c, from, 0, rm(Math.min(6.2, 2.8 + 0.35 * from)));
    } else await c.wait(0.6);
    c.spawn(async (cc) => { await cc.wait(0.8); cc.spawn((c3) => c3.to(world.lit, { [id]: 0 }, 0.8)); await cc.to(world.pressed, { [id]: 0 }, 0.2, Ease.outBack); });
    if (world.doors < 0.98) await openDoors(c, rm(1.8), false);
    setPhase('exiting');
    Object.assign(world, { line: 1, lineFade: 0.45 });
    App.seqBob = 0.7;
    c.spawn(async (cc) => { await cc.wait(rm(1.4)); Sound.steps(); R.ripple(0, 1.6, 0.3); });
    await toPose(c, { x: 0, y: 1.6, z: 3.6, yaw: Math.PI, pitch: 0, fov: 50 }, rm(2.4), Ease.inOutSine);
    App.seqBob = 0.4;
    world.say.main.text = COPY.open; world.say.main.reveal = 1;
    c.spawn((cc) => cc.to(world.say.main, { alpha: 1 }, 1.5));
    await toPose(c, poseFromShot(Shots.spawn(a)), rm(3.2), Ease.inOutSine);
    App.seqBob = 0;
    if (Clock.remaining() > 0) applyPrelaunch(); else setPhase('open');
  });
}

function returnToElevator() {
  if (world.phase !== 'floor' && world.phase !== 'gallery') return;
  if (App.overlay === 'invite') Invite.close();
  if (Level.s) Level.leave();
  world.cabView = null;
  Links.clearWorldHash();
  closePortal();
  bakeWalk();
  setPhase('returning');
  Seq.run('main', async (c) => {
    const cam = world.cam, a = aspectNow();
    world.lookScale = 1;
    if (cam.z > 4.5 || Math.abs(cam.x) > 1.6) { // far from the doors: a short fade brings the visitor back to the foot of the steps
      await c.to(world, { exposure: 0 }, rm(0.4));
      Object.assign(cam, { x: 0, y: 1.6, z: 3.0, yaw: 0, pitch: 0 });
      c.spawn((cc) => cc.to(world, { exposure: 1 }, rm(0.6)));
    }
    let turn = (0 - cam.yaw) % TAU; if (turn > Math.PI) turn -= TAU; else if (turn < -Math.PI) turn += TAU; // face the elevator (−Z)
    if (!world.reduced) await c.to(cam, { yaw: cam.yaw + turn, pitch: 0, x: clamp(cam.x, -0.4, 0.4), y: 1.6 }, rm(Math.abs(turn) > 0.6 ? 1.1 : 0.5), Ease.inOutCubic); else { cam.yaw += turn; cam.pitch = 0; }
    App.seqBob = 0.7;
    c.spawn(async (cc) => { await cc.wait(0.5); Sound.steps(); R.ripple(0, 1.4, 0.25); });
    await c.to(cam, { x: 0, z: -0.95, y: 1.85 + CAB_LIFT, fov: 52 }, rm(2.1), Ease.inOutSine);
    App.seqBob = 0;
    c.spawn(async (cc) => { await cc.wait(rm(0.5)); await closeDoors(cc, 1.6); R.setFloor(null); R.setGallery(false); });
    await toPose(c, poseFromShot(Shots.panel(a)), rm(1.5), Ease.inOutCubic);
    await c.wait(0.9);
    setPhase('cabin');
  });
}

/** Per-frame logic that is not a sequence: countdown, launch trigger, derived flags. */
function directorTick(dt, t) {
  const w = world, cd = w.countdown;
  const rem = Clock.remaining(), p = Clock.parts(rem);
  cd.d = String(p.d).padStart(2, '0'); cd.h = String(p.h).padStart(2, '0'); cd.m = String(p.m).padStart(2, '0'); cd.s = String(p.s).padStart(2, '0');
  if (w.phase === 'prelaunch') {
    const last = rem <= 10000;
    cd.last10 = damp(cd.last10, last ? 1 : 0, 3, dt);
    if (last && p.total !== App.last10Sec && rem > 0) { App.last10Sec = p.total; cd.pulse = 1; Sound.tick(); R.ripple(0, 1.0, 0.1); w.tremor = 0.5; }
    cd.pulse = Math.max(0, cd.pulse - dt * 2.4);
    if (!Seq.busy('main')) w.tremor = Math.max(0, w.tremor - dt * 1.4);
    const key = `${p.d}-${p.h}-${p.m}`;
    if (key !== App.minuteKey) { App.minuteKey = key; $('#timer-live').textContent = Clock.spoken(rem); }
    if (rem <= 0) launch(true);
  }
  const c = w.cam;
  w.inside = c.z < -0.12 && c.z > -2.3 && Math.abs(c.x) < 1.21;
  w.bob = damp(w.bob, Math.max(App.seqBob, look.moving ? 0.55 : 0), 6, dt);
  w.hand.lift = damp(w.hand.lift, w.phase === 'cabin' && w.hover && fineHover ? 1 : 0, 7, dt);
  const portal = PlayerPortal.current;
  if (portal) w.glow.rect = portal.rect();
  w.book.sheet = !!Book.pageHere();
  // floor readout while the cabin moves (on a phone the panel dial is out of sight)
  const riding = w.phase === 'departing' || w.phase === 'traveling' || w.phase === 'arriving';
  if (riding !== App.liftOn) { App.liftOn = riding; App.liftKey = ''; $('#lift').hidden = !riding; }
  if (riding) {
    const n = clamp(Math.round(w.needle), 0, panelTop()), key = n + ':' + w.arrow;
    if (key !== App.liftKey) { App.liftKey = key; $('#lift-floor').textContent = n === 0 ? 'PB' : String(n); $('#lift-arrow').textContent = w.arrow > 0 ? '▲' : w.arrow < 0 ? '▼' : ''; }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// INPUT  (mouse steer, drag look, WASD/arrows inside the walk zone, keyboard shortcuts)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Input = (() => {
  const keys = new Set();
  const drags = new Map(); // pointerId → last position and kind (look drags)
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
  function init() {
    const stage = $('#stage');
    stage.addEventListener('pointerdown', (e) => {
      Sound.unlock();
      if (!Joy.claim(e)) drags.set(e.pointerId, { x: e.clientX, y: e.clientY, kind: e.pointerType });
      try { stage.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') { look.tx = (e.clientX / window.innerWidth) * 2 - 1; look.ty = (e.clientY / window.innerHeight) * 2 - 1; }
      if (Joy.owns(e.pointerId)) { Joy.move(e); return; }
      const d = drags.get(e.pointerId);
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.x = e.clientX; d.y = e.clientY;
      if (Roam.look(dx, dy, d.kind)) return;
      look.dragYaw = clamp(look.dragYaw + dx * 0.0032, -0.42, 0.42);
      look.dragPitch = clamp(look.dragPitch + dy * 0.0026, -0.2, 0.21);
    }, { passive: true });
    const end = (e) => { if (Joy.owns(e.pointerId)) Joy.release(); drags.delete(e.pointerId); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    window.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });
    window.addEventListener('keydown', (e) => {
      Sound.unlock();
      if (e.key === 'Escape') { escape(); return; }
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (App.overlay === 'book') { if (e.key === 'ArrowLeft') Book.turn(-1); else if (e.key === 'ArrowRight') Book.turn(1); return; }
      if (world.phase === 'gallery' && world.gallery.at >= 0 && !App.overlay && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { Gallery.step(e.key === 'ArrowLeft' ? -1 : 1); return; }
      if (e.key === '`' || e.key === 'º') { Dev.toggle(); return; }
      const k = e.key.toLowerCase();
      if (world.phase === 'cabin' && !App.overlay) {
        if (/^[1-9]$/.test(k) && trackOf(Number(k))) { pressFloor(Number(k)); return; }
        if (k === '0') { pressLobby(); return; }
        if (k === 'y') { choosePlatform('youtube'); return; }
        if (k === 's') { choosePlatform('spotify'); return; }
      }
      if (['w', 'a', 's', 'd', 'q', 'e', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.add(k); if (k.startsWith('arrow') && document.activeElement === document.body) e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
  }
  function escape() {
    if (!$('#privacy').hidden) { $('#privacy').hidden = true; $('#privacy-link').focus(); return; }
    if (App.overlay === 'level') { Level.keep(); return; }
    if (!App.overlay && !$('#lv-tip').hidden) { Level.closeTip(); return; }
    if (!App.overlay && Level.inspecting()) { Level.go('wide'); return; }
    if (App.overlay === 'book') Book.close();
    else if (App.overlay === 'invite') Invite.close();
    else if (App.overlay === 'gate') Gate.dismiss();
    else if (App.overlay === 'form') Register.close(false);
    else if (App.overlay === 'question' || App.overlay === 'listen') Listen.close();
    else if (world.phase === 'gallery') { if (world.gallery.at >= 0) Gallery.back(); else Gallery.leave(); }
    else if (world.phase === 'floor') returnToElevator();
    else if (Dev.isOpen()) Dev.toggle();
  }
  function tick(dt) {
    Joy.sync();
    if (Roam.tick(dt, keys)) {
      look.dragYaw = look.dragPitch = 0; look.moveX = look.moveZ = 0;
      look.yaw = damp(look.yaw, 0, 6, dt); look.pitch = damp(look.pitch, 0, 6, dt);
      return;
    }
    look.moving = false;
    const p = world.phase, free = (p === 'prelaunch' || p === 'open' || p === 'cabin' || p === 'floor' || p === 'gallery') && App.overlay !== 'form';
    const lim = p === 'cabin' ? 0.6 : 1;
    const ty = free ? clamp(look.dragYaw * lim - look.tx * 0.105 * (fineHover ? 1 : 0), -0.44, 0.44) : 0;
    const tp = free ? clamp(look.dragPitch * lim - look.ty * 0.07 * (fineHover ? 1 : 0), -0.22, 0.22) : 0;
    if (!free) { look.dragYaw = damp(look.dragYaw, 0, 3, dt); look.dragPitch = damp(look.dragPitch, 0, 3, dt); }
    look.yaw = damp(look.yaw, ty, 4.5, dt); look.pitch = damp(look.pitch, tp, 4.5, dt);
    // walking
    const canWalk = false; // walking belongs to Roam now
    let mx = 0, mz = 0;
    if (canWalk) {
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      if (keys.has('w') || keys.has('arrowup')) mz += 1;
      if (keys.has('s') || keys.has('arrowdown')) mz -= 1;
    }
    look.moveX = damp(look.moveX, mx, 5, dt); look.moveZ = damp(look.moveZ, mz, 5, dt);
    const z = p === 'gallery' ? { x: 1.0, back: 0.3, fwd: Math.max(0.5, galleryLayout().end - 3 - world.cam.z) } : p === 'floor' ? { x: 0.3, back: 0.3, fwd: 0.5 } : p === 'open' ? { x: 1.0, back: 1.1, fwd: Math.max(1.3, world.cam.z - 2.4) } : { x: 1.4, back: 1.1, fwd: 1.3 };
    if (canWalk) {
      look.walkX = clamp(look.walkX + look.moveX * 1.1 * dt, -z.x, z.x);
      look.walkZ = clamp(look.walkZ + look.moveZ * 1.25 * dt, -z.back, z.fwd);
      if (p === 'open' && look.moveZ > 0.25 && !Seq.busy('cam') && world.cam.z - look.walkZ < 3.0) enterCabin();
    }
  }
  return { init, tick, escape };
})();

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DEV CONTROLS  (hidden evaluation tools — not part of the public experience)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Dev = (() => {
  const root = $('#dev');
  let open = false, built = false, readout = null, acc = 0, frames = 0, fps = 0, taps = 0, tapTimer = 0;
  const actions = {
    prelaunch() { Clock.offset = 0; if (Clock.remaining() <= 0) Clock.setRemaining((3 * 86400 + 4 * 3600 + 12 * 60 + 30) * 1000); App.last10Sec = -1; applyPrelaunch(); },
    lastTen() { Clock.setRemaining(10000); App.last10Sec = -1; applyPrelaunch(); },
    released() { Clock.setRemaining(-5000); applyPrelaunch(); world.countdown.alpha = 0; world.say.subtitle.alpha = 0; launch(false); },
    openDoors() { Seq.run('doors', (c) => openDoors(c, 1.8, false)); },
    closeDoors() { Seq.run('doors', (c) => closeDoors(c, 1.6)); },
    exterior() { if (Clock.remaining() > 0) applyPrelaunch(); else applyOpen(); },
    interior() { applyCabin(0, true); },
    gallery() { Gallery.apply(); },
    gallerySample() { // evaluation only: hangs the album cover in the first two frames to check real images
      GALLERY.pieces.slice(0, 2).forEach((pc, i) => { pc.src = ASSETS.cover; pc.title = `[muestra ${i + 1}]`; pc.caption = '[texto de muestra para evaluar el formato]'; });
      if (R.galleryRefit) R.galleryRefit();
      if (world.phase === 'gallery') { Gallery.reframe(); if (world.gallery.at >= 0) Gallery.caption(); }
    },
    arrive(n) { applyFloor(Number(n)); },
    platform(p) { choosePlatform(p); },
    press(n) { if (world.phase !== 'cabin') applyCabin(world.floor, world.floor === 0); pressFloor(Number(n)); },
    embedMode(m) { Embeds.mode = m; if (m === 'link' && PlayerPortal.current) PlayerPortal.current.switchToLink(); syncUI(); },
    clearLead() { Lead.clear(); world.called = false; syncUI(); },
    clearBook() { Book.reset(); },
    bookFind() { Book.state.found = true; if (!Book.state.print) Book.state.print = { u: 0.6, v: 0.57, r: -0.3 }; Book.save(); syncUI(); },
    bookAll() { Book.state.found = true; if (!Book.state.print) Book.state.print = { u: 0.6, v: 0.57, r: -0.3 }; Book.state.pages = BOOK.pages.map((pg) => pg.id); Book.save(); if (App.overlay === 'book') Book.render(); syncUI(); },
    bookBuy(ebookUrl, physicalUrl) { BOOK.buy.ebookUrl = ebookUrl || ''; BOOK.buy.physicalUrl = physicalUrl || ''; if (App.overlay === 'book') Book.render(); },
    force2D() { switchTo2D(); },
    /** Opens every floor's official player on this device and waits for it to answer (no playback). */
    async playerTest() {
      if (App.testing) return App.testing;
      const out = Dev.testOut, saved = { platform: world.platform, visited: [...world.visited] }, rows = [];
      const say = (txt) => { if (out) { out.hidden = false; out.textContent = txt; } };
      App.testing = (async () => {
        for (const prov of ['youtube', 'spotify']) {
          setPlatform(prov);
          for (const tr of tracks) {
            say(`probando ${prov === 'youtube' ? 'YouTube' : 'Spotify'} · piso ${tr.floor}…\n${rows.map((r) => r.line).join('\n')}`);
            applyFloor(tr.floor);
            const t0 = performance.now();
            let res = null;
            while (!res) {
              await sleep(250);
              const port = PlayerPortal.current, d = port ? port.diag : {};
              if (!port) res = { ok: false, why: 'sin reproductor' };
              else if (port.mode === 'link') res = { ok: false, why: d.error != null ? `error ${d.error} → enlace` : 'bloqueado → enlace' };
              else if (prov === 'youtube' && d.videoId) res = d.videoId === tr.youtubeVideoId ? { ok: true } : { ok: false, why: `video ${d.videoId}` };
              else if (prov === 'spotify' && d.ready) res = { ok: true };
              else if (performance.now() - t0 > 15000) res = { ok: false, why: 'no respondió en 15 s' };
            }
            const s = ((performance.now() - t0) / 1000).toFixed(1);
            rows.push({ provider: prov, floor: tr.floor, ok: res.ok, why: res.why || '', seconds: Number(s), line: `${res.ok ? '✓' : '✗'} ${prov === 'youtube' ? 'YT' : 'SP'} piso ${tr.floor} · ${s} s${res.ok ? '' : ' · ' + res.why}` });
          }
        }
        applyCabin(0);
        if (saved.platform) setPlatform(saved.platform);
        world.visited = saved.visited; store.session.setJson('eldom.visited', world.visited);
        const bad = rows.filter((r) => !r.ok);
        say(`${bad.length ? '✗ ' + bad.length + ' de ' + rows.length + ' con problemas' : '✓ ' + rows.length + ' de ' + rows.length + ' reproductores respondieron'} · ${navigator.userAgent.slice(0, 90)}\n${rows.map((r) => r.line).join('\n')}`);
        window.__eldomPlayerTest = rows;
        return rows;
      })();
      try { return await App.testing; } finally { App.testing = null; }
    },
    levelFloor() { if (Clock.remaining() > 0) actions.released(); applyFloor(LEVEL.floor); },
    /** Checks: stand somewhere, and hold the joystick for a while. */
    roamTo(x, z, yaw) { Object.assign(world.cam, { x, z, yaw, pitch: 0 }); },
    roamPush(mx, mz, ms) { Roam.joy.x = mx; Roam.joy.y = mz; return new Promise((res) => setTimeout(() => { Roam.joy.x = Roam.joy.y = 0; res(); }, ms)); },
    levelReset() { Level.reset(true); },
    levelSolve() { Level.s.dials = LEVEL.solution.map((id) => LEVEL.symbols.indexOf(id)); world.level.dials = [...Level.s.dials]; Level.save(); syncUI(); },
    reducedMotion(v) { world.reduced = v === undefined ? !world.reduced : !!v; syncUI(); },
    timeScale(x) { Seq.setScale(Number(x) || 1); syncUI(); },
  };
  function build() {
    built = true;
    const grp = (title, ...btns) => h('div', { class: 'grp' }, h('b', { text: title }), ...btns);
    const btn = (label, fn, key) => { const b = h('button', { type: 'button', text: label }); if (key) b.dataset.key = key; b.addEventListener('click', () => { Sound.unlock(); fn(); }); return b; };
    const chip = h('button', { class: 'chip', type: 'button', text: 'DEV', 'aria-expanded': 'false' });
    chip.addEventListener('click', () => api.toggle());
    const panel = h('div', { class: 'panel' },
      grp('Estado', btn('Previo', actions.prelaunch), btn('Últimos 10 s', actions.lastTen), btn('Publicado', actions.released)),
      grp('Puertas', btn('Abrir', actions.openDoors), btn('Cerrar', actions.closeDoors)),
      grp('Vista', btn('Exterior', actions.exterior), btn('Interior', actions.interior), btn('Galería', actions.gallery), btn('Obras de muestra', actions.gallerySample)),
      grp('Llegar al piso', ...tracks.map((t) => btn(String(t.floor), () => actions.arrive(t.floor)))),
      grp('Plataforma', btn('YouTube', () => actions.platform('youtube'), 'p-youtube'), btn('Spotify', () => actions.platform('spotify'), 'p-spotify')),
      grp('Embeds', btn('Auto', () => actions.embedMode('auto'), 'e-auto'), btn('Embed', () => actions.embedMode('embed'), 'e-embed'), btn('Links', () => actions.embedMode('link'), 'e-link')),
      grp('Reproductores', btn('Probar reproductores', () => actions.playerTest()), (api.testOut = h('pre', { class: 'testout', hidden: true }))),
      grp('Nivel', btn('Ir al piso del nivel', actions.levelFloor), btn('Reiniciar nivel', actions.levelReset), btn('Ruedas resueltas', actions.levelSolve)),
      grp('Extra', btn('Borrar registro', actions.clearLead), btn('Reiniciar libro', actions.clearBook), btn('Encontrar libro', actions.bookFind), btn('Libro completo', actions.bookAll), btn('Forzar 2D', actions.force2D), btn('Movimiento reducido', () => actions.reducedMotion(), 'rm'), btn('Velocidad ×1/×3', () => actions.timeScale(Seq.scale === 1 ? 3 : 1), 'ts'), btn('Ocultar', () => { root.hidden = true; open = false; })),
      (readout = h('div', { class: 'readout' })));
    panel.hidden = true;
    const corner = h('button', { class: 'corner', type: 'button', tabindex: '-1', 'aria-hidden': 'true' });
    corner.addEventListener('click', () => { clearTimeout(tapTimer); if (++taps >= 5) { taps = 0; root.hidden = false; } tapTimer = setTimeout(() => { taps = 0; }, 1600); });
    root.append(panel, chip);
    document.body.append(corner);
    corner.style.cssText = 'position:fixed;left:0;bottom:0;width:48px;height:48px;opacity:0;z-index:1;background:transparent;border:0;padding:0';
    api.chip = chip; api.panel = panel;
  }
  const api = {
    actions,
    init() { build(); root.hidden = !(SHOW_DEV_TOOLS || location.hash === '#dev'); if (location.hash === '#dev') this.toggle(); },
    isOpen: () => open,
    toggle() {
      if (!built) return;
      if (root.hidden) { root.hidden = false; return; }
      open = !open;
      this.panel.hidden = !open; this.chip.setAttribute('aria-expanded', String(open)); this.chip.textContent = open ? 'DEV ×' : 'DEV';
      this.refresh();
    },
    refresh() {
      if (!built || !open) return;
      for (const b of this.panel.querySelectorAll('button[data-key]')) {
        const k = b.dataset.key;
        b.classList.toggle('on', k === 'p-' + world.platform || k === 'e-' + Embeds.mode || (k === 'rm' && world.reduced) || (k === 'ts' && Seq.scale !== 1));
      }
    },
    tick(dt) {
      if (!open) return;
      acc += dt; frames++;
      if (acc < 0.5) return;
      fps = Math.round(frames / acc); acc = 0; frames = 0;
      const rem = Clock.remaining(), p = Clock.parts(rem);
      const port = PlayerPortal.current;
      readout.textContent = `fase ${world.phase} · piso ${world.floor} · ${R.kind} · dpr ${R.dpr.toFixed(2)} · ${fps} fps\n` +
        `falta ${rem > 0 ? `${p.d}d ${p.h}h ${p.m}m ${p.s}s` : 'publicado'} · embeds ${Embeds.effective()}${Embeds.blocked ? ' (bloqueados)' : ''}\n` +
        `reproductor ${port ? `${port.provider}/${port.mode}${port.playing ? ' ▶' : ''}${port.preview ? ' muestra' : ''}` : '—'}`;
    },
  };
  return api;
})();

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BOOT  (loading, WebGL detection, 2D fallback, visibility, automation API)
// ═══════════════════════════════════════════════════════════════════════════════════════════
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function switchTo2D() {
  if (R && R.kind === '2d') return;
  try { if (R) R.dispose(); } catch { /* ignore */ }
  $('#stage').replaceChildren();
  R = createRenderer2D();
  world.hand.target = null;
  if (App.booted) syncUI();
}
function frame(now) {
  if (!App.running) return;
  App.raf = requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - App.lastNow) / 1000));
  App.lastNow = now;
  App.time += dt;
  Seq.tick(dt);
  directorTick(dt, App.time);
  Input.tick(dt);
  try { R.render(dt, App.time); } catch (e) { console.error(e); if (R.kind === '3d') switchTo2D(); }
  Hot.update();
  Dev.tick(dt);
  if (App.readyResolve) { App.readyResolve(); App.readyResolve = null; }
}
function startLoop() { if (App.running) return; App.running = true; App.lastNow = performance.now(); App.raf = requestAnimationFrame(frame); }
function stopLoop() { App.running = false; cancelAnimationFrame(App.raf); }

function initUI() {
  document.documentElement.style.setProperty('--ink-noise', noiseTile('ink'));
  document.documentElement.style.setProperty('--metal-noise', noiseTile('metal'));
  Hot.add('call', COPY.cta, () => Register.open());
  Hot.add('elevator', COPY.enter, () => enterCabin());
  for (const p of ['youtube', 'spotify']) Hot.add('sel-' + p, p, () => choosePlatform(p));
  for (const tr of [...tracks].sort((a, b) => b.floor - a.floor)) Hot.add('floor-' + tr.floor, tr.title, () => pressFloor(tr.floor));
  Hot.add('floor-0', 'PB', () => pressLobby());
  if (GALLERY.enabled) {
    Hot.add('floor-' + GALLERY_FLOOR, GALLERY.label, () => pressGallery());
    Hot.add('gallery', `Piso ${GALLERY_FLOOR}: visitar la galería`, () => Gallery.enterFromLobby());
    for (let i = 0; i < Gallery.count(); i++) Hot.add('piece-' + i, i < GALLERY.pieces.length ? `Obra ${i + 1}` : 'Agradecimientos', () => Gallery.focus(i));
    $('#gal-back').addEventListener('click', () => (world.gallery.at >= 0 ? Gallery.back() : Gallery.leave()));
    $('#gal-prev').addEventListener('click', () => Gallery.step(-1));
    $('#gal-next').addEventListener('click', () => Gallery.step(1));
  }
  $('#cap-primary').addEventListener('click', () => Register.open());
  $('#cap-secondary').addEventListener('click', () => Listen.ask());
  $('#cap-enter').addEventListener('click', () => enterCabin());
  $('#cap-back').addEventListener('click', () => returnToElevator());
  $('#cap-invite').addEventListener('click', () => { const tr = trackOf(world.floor); if (tr) Invite.open(tr); });
  $('#cap-invite-all').addEventListener('click', () => Invite.open(null));
  Hot.add('book', 'Un libro apoyado en los escalones', () => Book.pickUp());
  Hot.add('page', 'Una página suelta', () => Book.takePage());
  for (const id of LEVEL_HOTS) Hot.add(id, id, () => Level.tap(id));
  $('#lv-back').addEventListener('click', () => Level.go('wide'));
  $('#rot-keep').addEventListener('click', () => { store.session.set('eldom.rot', '1'); $('#rot-invite').hidden = true; });
  $('#cab-view').addEventListener('click', () => {
    if (world.phase !== 'cabin' || Seq.busy('main')) return;
    world.cabView = (world.cabView || (world.platform ? 'rows' : 'top')) === 'rows' ? 'top' : 'rows';
    Seq.run('cam', (c) => toPose(c, poseFromShot(Shots.panel(aspectNow())), rm(0.8), Ease.inOutCubic));
    syncUI();
  });
  $('#lv-hint').addEventListener('click', () => Level.hint());
  $('#lv-tip-more').addEventListener('click', () => Level.hint());
  $('#lv-tip-close').addEventListener('click', () => Level.closeTip());
  $('#lv-reset').addEventListener('click', () => Level.reset());
  $('#lv-card-reset').addEventListener('click', () => Level.reset());
  $('#lv-keep').addEventListener('click', () => Level.keep());
  $('#lv-elev').addEventListener('click', () => Level.toElevator());
  $('#book-open').addEventListener('click', () => Book.open());
  $('#bk-close').addEventListener('click', () => Book.close());
  $('#bk-prev').addEventListener('click', () => Book.turn(-1));
  $('#bk-next').addEventListener('click', () => Book.turn(1));
  { // swipe to turn pages
    let sx = null;
    const pg = $('#bk-page');
    pg.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    pg.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 46) Book.turn(e.clientX < sx ? 1 : -1); sx = null; });
    pg.addEventListener('pointercancel', () => { sx = null; });
  }
  $('#invite-close').addEventListener('click', () => Invite.close());
  $('#invite-share').addEventListener('click', () => Invite.share());
  $('#invite-copy').addEventListener('click', () => Invite.copy());
  $('#g-youtube').addEventListener('click', () => { Sound.unlock(); Gate.choose('youtube'); });
  $('#g-spotify').addEventListener('click', () => { Sound.unlock(); Gate.choose('spotify'); });
  $('#g-close').addEventListener('click', () => Gate.dismiss());
  $('#cap-invited-go').addEventListener('click', () => { const tr = Gate.pending(); if (tr) Gate.open(tr); });
  window.addEventListener('hashchange', () => {
    const tr = Links.trackFromHash();
    if (tr && world.floor !== tr.floor) Gate.arrive(tr);
    else if (GALLERY.enabled && location.hash === '#' + GALLERY.id && world.phase !== 'gallery') Gallery.apply();
  });
  $('#lead-close').addEventListener('click', () => Register.close(false));
  $('#lead-form').addEventListener('submit', (e) => { e.preventDefault(); Register.submit(); });
  if (LEAD_ENDPOINT) $('#privacy-where').textContent = COPY.privacySheet; // the note says where sign-ups are kept
  const pl = $('#privacy-link');
  if (PRIVACY_URL === '#privacidad') pl.addEventListener('click', (e) => { e.preventDefault(); $('#privacy').hidden = false; $('#privacy-close').focus(); });
  else { pl.href = PRIVACY_URL; pl.target = '_blank'; pl.rel = 'noopener'; }
  $('#privacy-close').addEventListener('click', () => { $('#privacy').hidden = true; pl.focus(); });
  $('#q-youtube').addEventListener('click', () => Listen.choose('youtube'));
  $('#q-spotify').addEventListener('click', () => Listen.choose('spotify'));
  $('#q-close').addEventListener('click', () => Listen.close());
  const snd = $('#sound');
  const paint = () => { snd.textContent = Sound.muted ? COPY.soundOff : COPY.soundOn; snd.setAttribute('aria-pressed', String(!Sound.muted)); };
  snd.addEventListener('click', () => { Sound.unlock(); Sound.toggle(); paint(); });
  paint();
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { R.resize(); reframe(); if (App.overlay === 'invite') Invite.place(); if (App.overlay === 'book') Book.place(); if (!$('#lv-tip').hidden) Level.place($('#lv-tip')); if (App.overlay === 'level') Level.place($('#lv-card')); }); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopLoop(); Sound.suspend(); if (PlayerPortal.current) PlayerPortal.current.pageHidden(); }
    else { Sound.resume(); startLoop(); }
  });
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  world.reduced = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', (e) => { world.reduced = e.matches; });
}
/** After a resize, steady phases snap to the framing for the new aspect. */
function reframe() {
  if (Seq.busy('main') || Seq.busy('cam')) return;
  const a = aspectNow(), p = world.phase;
  if (p === 'prelaunch' || p === 'open') setPose(poseFromShot(App.overlay === 'form' ? Shots.form(a) : App.overlay === 'listen' ? Shots.listen(a) : Shots.spawn(a)));
  else if (p === 'cabin') { setPose(poseFromShot(Shots.panel(a))); syncUI(); }
  else if (p === 'floor') { if (PlayerPortal.current && window.innerWidth >= 640 && (Roam.docked || window.innerHeight < 520)) { Roam.docked = true; PlayerPortal.current.setDock('compact'); }
    if (Level.inspecting()) Level.reframe(); else if (Roam.moved > 0.1) world.cam.fov = poseFromShot(Shots.floor(a)).fov; else setPose(poseFromShot(Shots.floor(a))); }
  else if (p === 'gallery') Gallery.reframe();
}

async function boot() {
  const fill = $('#boot-fill');
  const progress = (v) => { fill.style.transform = `scaleX(${v})`; };
  progress(0.12);
  await loadFonts();
  progress(0.4);
  if (location.hash !== '#2d' && hasWebGL()) {
    try {
      const THREE = await loadThree();
      progress(0.72);
      R = createRenderer3D(THREE);
      R.onContextLost = () => switchTo2D();
    } catch (e) { console.warn('[eldom] 3D unavailable, using the 2D scene.', e); $('#stage').replaceChildren(); R = null; }
  }
  if (!R) R = createRenderer2D();
  progress(0.9);
  const p = store.session.get('eldom.platform');
  if (p === 'youtube' || p === 'spotify') world.platform = p;
  const vis = store.session.json('eldom.visited', []);
  world.visited = Array.isArray(vis) ? vis.filter((n) => trackOf(n)) : [];
  initUI(); Input.init(); Dev.init();
  Book.load();
  Level.load();
  const invited = Links.trackFromHash(); // opened from an invitation to one world
  if (invited) Gate.remember(invited);
  applyPrelaunch();
  if (Clock.remaining() <= 0) {
    if (invited) Gate.open(invited);
    else if (GALLERY.enabled && location.hash === '#' + GALLERY.id) Gallery.apply();
    else { world.countdown.alpha = 0; world.say.subtitle.alpha = 0; launch(false); }
  } else if (GALLERY.enabled && location.hash === '#' + GALLERY.id) Gallery.apply();
  App.booted = true;
  const ready = new Promise((res) => { App.readyResolve = res; });
  startLoop();
  await ready;
  progress(1);
  console.info(`[eldom] renderer ${R.kind} · dpr ${R.dpr}`);
  const bootEl = $('#boot');
  bootEl.classList.add('gone');
  setTimeout(() => { bootEl.hidden = true; }, 1300);
}

// Automation / evaluation API (used by the dev panel and the verification harness).
{
  const A = Dev.actions;
  let readyRes;
  window.__eldom = {
    ready: new Promise((res) => { readyRes = res; }),
    config: () => ({ release: RELEASE_AT, demo: DEMO_ALBUM, gallery: { pieces: GALLERY.pieces.map(({ id, src, title, caption, thanks }) => ({ id, src, title, caption, thanks })), thanks: GALLERY.thanks.lines }, tracks: tracks.map((t) => ({ floor: t.floor, id: t.id, title: t.title, youtubeVideoId: t.youtubeVideoId, youtubeStartSeconds: t.youtubeStartSeconds, spotifyTrackUri: t.spotifyTrackUri, spotifyAlbumId: t.spotifyAlbumId, durationSeconds: t.durationSeconds })), level: { floor: LEVEL.floor, symbols: LEVEL.symbols, stones: LEVEL.stones } }),
    state() {
      const port = PlayerPortal.current;
      return {
        phase: world.phase, renderer: R ? R.kind : null, platform: world.platform, floor: world.floor, visited: [...world.visited], doors: world.doors,
        embedMode: Embeds.mode, embedsBlocked: Embeds.blocked, portal: port ? port.info() : null, remainingMs: Clock.remaining(),
        formOpen: App.overlay === 'form', overlay: App.overlay, reducedMotion: world.reduced, registered: world.called,
        invite: App.overlay === 'invite' ? { floor: Invite.track ? Invite.track.floor : 0, url: Invite.url, message: Invite.message(), status: $('#invite-status').textContent } : null,
        pendingInvite: Gate.pending() ? Gate.pending().id : null, hash: location.hash,
        gallery: { at: world.gallery.at, from: Gallery.from, count: Gallery.count(), floor: GALLERY_FLOOR, guided: Gallery.guided() },
        level: Level.s ? Level.debug() : null,
        cam: { x: world.cam.x, y: world.cam.y, z: world.cam.z, yaw: world.cam.yaw, pitch: world.cam.pitch, fov: world.cam.fov },
        roam: { scene: Roam.scene(), moved: Roam.moved, docked: Roam.docked, joy: !$('#joy').hidden, ghost: !$('#joy-ghost').hidden, solids: R && R.levelSolids ? R.levelSolids() : [] },
        panel: { logos: world.panelLogos || 0 },
        book: { found: Book.state.found, pages: [...Book.state.pages], printed: !!Book.state.print, at: Book.state.at, leaves: Book.leaves().map((l) => l.kind), pageHere: !!Book.pageHere(), complete: Book.complete() },
      };
    },
    waitFor(target, timeoutMs = 20000) {
      const ok = () => (typeof target === 'function' ? target(window.__eldom.state()) : world.phase === target);
      return new Promise((res, rej) => { const t0 = performance.now(); (function poll() { if (ok()) res(); else if (performance.now() - t0 > timeoutMs) rej(new Error('waitFor timeout: ' + target)); else setTimeout(poll, 60); })(); });
    },
    ui: {
      openForm: () => Register.open(), closeForm: () => Register.close(false), openListen: () => Listen.ask(), chooseListen: (p) => Listen.choose(p),
      closeListen: () => Listen.close(), enter: () => enterCabin(), returnToElevator: () => returnToElevator(),
      pressLobby: () => pressLobby(), pressGallery: () => pressGallery(), openGallery: () => Gallery.enterFromLobby(), galleryFocus: (i) => Gallery.focus(i), galleryStep: (dlt) => Gallery.step(dlt), galleryBack: () => Gallery.back(), leaveGallery: () => Gallery.leave(), pickBook: () => Book.pickUp(), openBook: (at) => Book.open(at), closeBook: () => Book.close(), takePage: () => Book.takePage(), bookTurn: (dlt) => Book.turn(dlt),
      levelTap: (id) => Level.tap(id), levelGo: (v) => Level.go(v), levelHint: () => Level.hint(), levelKeep: () => Level.keep(), levelElevator: () => Level.toElevator(), levelReset: (force) => Level.reset(force), levelTake: () => Level.take(),
      invite: (n) => Invite.open(n ? trackOf(n) : null), closeInvite: () => Invite.close(), gateChoose: (p) => Gate.choose(p), gateDismiss: () => Gate.dismiss(),
    },
    dev: { prelaunch: A.prelaunch, lastTen: A.lastTen, released: A.released, openDoors: A.openDoors, closeDoors: A.closeDoors, exterior: A.exterior, interior: A.interior, gallery: A.gallery, gallerySample: A.gallerySample,
      arrive: A.arrive, platform: A.platform, press: A.press, embedMode: A.embedMode, clearLead: A.clearLead, clearBook: A.clearBook, levelFloor: A.levelFloor, levelReset: A.levelReset, levelSolve: A.levelSolve, playerTest: A.playerTest, roamTo: A.roamTo, roamPush: A.roamPush, bookFind: A.bookFind, bookAll: A.bookAll, bookBuy: A.bookBuy, force2D: A.force2D, reducedMotion: A.reducedMotion, timeScale: A.timeScale },
  };
  boot().then(readyRes, (e) => { console.error(e); readyRes(); });
}
