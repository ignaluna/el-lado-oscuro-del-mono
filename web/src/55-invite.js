// ═══════════════════════════════════════════════════════════════════════════════════════════
// INVITATIONS  (one stable link per world, share / copy, and the way in for whoever receives it)
//   A world link is the page address plus the track id as a bare hash (#tan-buena): it survives any static host and
//   carries no state, so opening it never touches the receiver's own progress.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Links = {
  base() {
    const here = location.protocol === 'file:' ? location.href.split('#')[0] : location.origin + location.pathname;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return here; // local preview: links stay on this server
    return SHARE_BASE_URL || here;
  },
  world: (tr) => `${Links.base()}#${tr.id}`,
  home: () => Links.base(),
  worldMessage: (tr) => `Quiero que escuches «${tr.title}». Entrá a este mundo: ${Links.world(tr)}`,
  homeMessage: () => `Te invito a El Lado Oscuro del Mono, de Monos del Ambiente: ${Links.home()}`,
  trackFromHash() {
    let id = '';
    try { id = decodeURIComponent(location.hash.replace(/^#/, '')); } catch { /* malformed hash */ }
    return tracks.find((t) => t.id === id) || null;
  },
  /** Mirrors the current world in the address bar without adding history entries (ignored where the host forbids it). */
  setHash(id) { try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch { /* sandboxed frame */ } },
  clearWorldHash() { if (Links.trackFromHash()) Links.setHash(null); },
};

/** The small engraved plate that asks "who would you bring to this world?". `track` null = the whole album. */
const Invite = {
  track: null,
  url: '',
  open(track) {
    if (App.overlay) return;
    App.overlay = 'invite';
    this.track = track || null;
    this.url = track ? Links.world(track) : Links.home();
    this.restore = document.activeElement;
    const el = $('#invite');
    $('#invite-title').textContent = track ? COPY.inviteAsk : COPY.inviteAnyAsk;
    $('#invite-song').textContent = track ? `${floorName(track.floor).toUpperCase()} · ${track.title}` : COPY.title;
    const msg = this.message();
    const cut = msg.lastIndexOf(this.url);
    $('#invite-msg').replaceChildren(msg.slice(0, cut), h('span', { id: 'invite-url', text: this.url }));
    $('#invite-wa').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    const canShare = typeof navigator.share === 'function';
    $('#invite-share').hidden = !canShare;
    this.status('');
    el.hidden = false;
    this.place();
    (canShare ? $('#invite-share') : $('#invite-copy')).focus({ preventScroll: true });
    syncUI();
  },
  message() { return this.track ? Links.worldMessage(this.track) : Links.homeMessage(); },
  status(text) { $('#invite-status').textContent = text; },
  /** Keeps the plate off the official player: beside it on wide screens, above it on phones. */
  place() {
    const el = $('#invite'), W = window.innerWidth, H = window.innerHeight;
    const w = Math.min(340, W - 32);
    el.style.width = w + 'px';
    const hgt = el.offsetHeight;
    let left = (W - w) / 2, top = (H - hgt) / 2;
    const port = PlayerPortal.current;
    if (port) {
      const r = port.el.getBoundingClientRect();
      if (W >= 640) { const roomR = W - r.right, roomL = r.left; if (Math.max(roomR, roomL) >= w + 32) left = roomR >= roomL ? r.right + (roomR - w) / 2 : (roomL - w) / 2; }
      else top = Math.min(96, r.top - hgt - 10);
    }
    el.style.left = Math.round(clamp(left, 16, Math.max(16, W - w - 16))) + 'px';
    el.style.top = Math.round(clamp(top, 12, Math.max(12, H - hgt - 12))) + 'px';
  },
  close() {
    if (App.overlay !== 'invite') return;
    App.overlay = null;
    $('#invite').hidden = true;
    const r = this.restore;
    if (r && r.focus && document.contains(r)) r.focus({ preventScroll: true });
    syncUI();
  },
  async share() {
    try { await navigator.share({ text: this.message() }); }
    catch (e) { if (!e || e.name !== 'AbortError') await this.copy(); } // refused by the host (or no targets): copying still works
  },
  async copy() {
    try {
      await navigator.clipboard.writeText(this.url);
      this.status(COPY.copied);
    } catch {
      // clipboard refused: select the link so it can be copied by hand
      const span = $('#invite-url'), sel = window.getSelection();
      if (span && sel) { const range = document.createRange(); range.selectNodeContents(span); sel.removeAllRanges(); sel.addRange(range); }
      this.status(COPY.copyManual);
    }
  },
};

/**
 * The way in for whoever opens a world link. Before the release the destination is only remembered; afterwards one
 * tap inside the cabin picks the platform (which also unlocks audio) and the elevator takes them straight there.
 */
const Gate = {
  KEY: 'eldom.invite',
  track: null,
  pending() { const id = store.local.get(this.KEY); return tracks.find((t) => t.id === id) || null; },
  remember(tr) { store.local.set(this.KEY, tr.id); },
  forget() { store.local.remove(this.KEY); },
  /** A basement link opened before the nine chapters are found: the lock holds, and the way back is right there. */
  locked(tr) { return !!(tr && isBasement(tr.floor) && !Progress.basementsOpen()); },
  open(tr) {
    this.track = tr;
    applyCabin(0, false);
    setPose(poseFromShot(Shots.doors(aspectNow())));
    world.exposure = 0.5;
    App.overlay = 'gate';
    const lock = this.locked(tr);
    $('#gate-pre').textContent = lock ? COPY.gateLockedPre : 'TE INVITARON A UN MUNDO';
    $('#gate-title').textContent = tr.title;
    $('#gate-locked').hidden = !lock; $('#gate-locked').textContent = lock ? COPY.gateLocked : '';
    $('#gate-ask').hidden = lock; $('#gate-tokens').hidden = lock;
    $('#g-close').textContent = lock ? COPY.gateLockedBack : 'AHORA NO';
    $('#gate').hidden = false;
    $(lock ? '#g-close' : world.platform === 'spotify' ? '#g-spotify' : '#g-youtube').focus({ preventScroll: true });
    live(lock ? `${tr.title}: ${COPY.gateLocked}` : `Te invitaron a ${tr.title}. Elegí por dónde viajar.`);
    syncUI();
  },
  choose(platform) {
    if (App.overlay !== 'gate' || this.locked(this.track)) return;
    const tr = this.track;
    $('#gate').hidden = true;
    App.overlay = null;
    this.forget();
    setPlatform(platform);
    inviteRide(tr.floor);
  },
  dismiss() {
    if (App.overlay !== 'gate') return;
    $('#gate').hidden = true;
    App.overlay = null;
    this.forget();
    Links.clearWorldHash();
    applyOpen();
  },
  /** A world link arrived (page load or hash change). */
  arrive(tr) {
    this.remember(tr);
    if (Clock.remaining() <= 0) this.open(tr);
    else syncUI();
  },
};
