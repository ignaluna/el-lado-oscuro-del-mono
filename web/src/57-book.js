// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE BOOK  (found by the curious: picked up, marked with a fingerprint, filled with pages from the worlds)
//   Nothing announces it: no mission, no counter. Progress lives in sessionStorage, so it survives a reload and
//   starts over with a new visit. All texts come from BOOK in the config; empty until the real ones are provided.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Book = {
  KEY: 'eldom.book',
  state: { found: false, print: null, pages: [], at: 0 },
  load() {
    const s = store.session.json(this.KEY, null);
    if (s && typeof s === 'object') {
      this.state = {
        found: !!s.found,
        print: s.print && typeof s.print.u === 'number' ? s.print : null,
        pages: Array.isArray(s.pages) ? s.pages.filter((id) => BOOK.pages.some((p) => p.id === id)) : [],
        at: Number.isFinite(s.at) ? s.at : 0,
      };
    }
    this.mirror();
  },
  save() { store.session.setJson(this.KEY, this.state); this.mirror(); },
  reset() {
    if (App.overlay === 'book') this.close();
    this.state = { found: false, print: null, pages: [], at: 0 };
    store.session.remove(this.KEY);
    this.mirror();
    syncUI();
  },
  /** Copies what the renderers need into the world state. */
  mirror() { world.book.found = this.state.found; world.book.print = this.state.print; },
  pageFor(trackId) { return BOOK.pages.find((p) => p.foundIn === trackId) || null; },
  has(id) { return this.state.pages.includes(id); },
  complete() { return BOOK.pages.length > 0 && BOOK.pages.every((p) => this.has(p.id)); },
  canPick() { return BOOK.enabled && !this.state.found; },
  /** The page that waits in the world the visitor is standing in (only for someone who carries the book). */
  pageHere() {
    if (!BOOK.enabled || !this.state.found || world.phase !== 'floor') return null;
    if (Level.available() && world.floor === LEVEL.floor) return null; // that world's page is earned in its level
    const tr = trackOf(world.floor), pg = tr && this.pageFor(tr.id);
    return pg && !this.has(pg.id) ? pg : null;
  },

  /** Crouch by the steps, touch the cover (the fingerprint stays), lift it and open it. */
  pickUp() {
    const p = world.phase;
    if (!this.canPick() || App.overlay || (p !== 'prelaunch' && p !== 'open')) return;
    App.overlay = 'bookpick';
    bakeWalk();
    syncUI();
    const b = world.book, hd = world.hand;
    Seq.run('cam', async (c) => {
      c.spawn((cc) => cc.to(world, { exposure: 0.85 }, 1));
      c.spawn((cc) => cc.to(b, { light: 1 }, 1.2));
      await toPose(c, poseFromShot(Shots.book(aspectNow())), rm(1.5));
      hd.target = R.bookTarget(); hd.show = true;
      await c.to(hd, { reach: 1, point: 1 }, rm(0.65), Ease.outCubic);
      Sound.click();
      await c.tween(0.14, Ease.outQuad, (k) => { hd.press = k; });
      this.state.print = { u: 0.6, v: 0.57, r: -0.55 + Math.random() * 0.5 }; // this copy is theirs now
      this.mirror();
      await c.wait(0.3);
      c.spawn((cc) => cc.to(hd, { press: 0, reach: 0, point: 0 }, 0.45, Ease.inOutCubic));
      await c.to(b, { lift: 1 }, rm(1.0), Ease.inOutCubic);
      hd.show = false; hd.target = null;
      this.state.found = true; this.state.at = 0;
      this.save();
      App.overlay = null;
      this.open(0);
      b.lift = 0;
    });
  },
  /** Called when something else takes over while the book is being picked up. */
  abortPick() {
    const hd = world.hand, b = world.book;
    Object.assign(hd, { show: false, target: null, reach: 0, press: 0, point: 0 });
    b.lift = 0; b.light = 0;
    if (!this.state.found) this.state.print = null;
    this.mirror();
  },

  /** The loose page of this world flies into the book. */
  takePage() {
    const pg = this.pageHere();
    if (!pg || App.overlay || world.book.take > 0) return;
    Sound.click();
    Seq.run('page', async (c) => {
      await c.to(world.book, { take: 1 }, rm(0.9), Ease.inOutCubic);
      this.state.pages = [...this.state.pages, pg.id];
      this.save();
      world.book.take = 0;
      const icon = $('#book-open');
      icon.classList.remove('got'); void icon.offsetWidth; icon.classList.add('got');
      live(COPY.bookGot);
      syncUI();
    });
  },

  /** Everything the book holds, in reading order. Missing pages stay in as blank leaves. */
  leaves() {
    return [
      { kind: 'cover' },
      ...BOOK.opening.map((page) => ({ kind: 'text', page })),
      ...BOOK.pages.map((page) => ({ kind: this.has(page.id) ? 'text' : 'blank', page })),
      { kind: 'colophon' },
    ];
  },
  open(at) {
    if (!this.state.found || App.overlay) return;
    App.overlay = 'book';
    this.restore = document.activeElement;
    if (Number.isFinite(at)) this.state.at = at;
    $('#book').hidden = false;
    this.render();
    this.place();
    $('#bk-close').focus({ preventScroll: true });
    syncUI();
  },
  close() {
    if (App.overlay !== 'book') return;
    App.overlay = null;
    $('#book').hidden = true;
    this.save();
    const r = this.restore;
    if (r && r.focus && document.contains(r) && !r.hidden) r.focus({ preventScroll: true }); else $('#book-open').focus({ preventScroll: true });
    const p = world.phase;
    if (p === 'prelaunch' || p === 'open') {
      Seq.run('cam', async (c) => { c.spawn((cc) => cc.to(world, { exposure: 1 }, 1)); c.spawn((cc) => cc.to(world.book, { light: 0 }, 1)); await toPose(c, poseFromShot(Shots.spawn(aspectNow())), rm(1.4)); });
    }
    syncUI();
    Level.onBookClosed();
  },
  turn(d) {
    const n = this.leaves().length;
    const next = clamp(this.state.at + d, 0, n - 1);
    if (next === this.state.at) return;
    this.state.at = next;
    this.render();
  },
  render() {
    const leaves = this.leaves();
    const i = (this.state.at = clamp(this.state.at, 0, leaves.length - 1));
    const lf = leaves[i], host = $('#bk-page');
    host.className = 'bk-' + lf.kind;
    host.replaceChildren();
    if (lf.kind === 'cover') {
      const wrap = h('div', { class: 'bk-art' }, h('img', { src: ASSETS.cover, alt: 'Tapa de El Lado Oscuro del Mono' }));
      const pr = this.state.print;
      if (pr) {
        // the print was left on the 3:4 crop of the cover; here the whole square cover is shown
        const mark = h('img', { class: 'bk-print', src: ASSETS.fingerR, alt: '' });
        mark.style.left = (12.5 + pr.u * 75) + '%'; mark.style.top = pr.v * 100 + '%';
        mark.style.transform = `translate(-50%,-50%) rotate(${pr.r}rad)`;
        wrap.append(mark);
      }
      host.append(wrap);
    } else if (lf.kind === 'blank') {
      host.setAttribute('aria-label', COPY.bookBlank);
    } else if (lf.kind === 'text') {
      const pg = lf.page;
      if (pg.heading) host.append(h('h3', { text: pg.heading }));
      const body = String(pg.text || '').trim();
      if (body) for (const para of body.split(/\n\s*\n/)) host.append(h('p', { text: para.trim() }));
      else host.append(h('p', { class: 'bk-provisional', text: COPY.provisional }), h('p', { class: 'bk-pending', text: COPY.bookPending }));
      const tr = pg.foundIn && tracks.find((t) => t.id === pg.foundIn);
      if (tr) host.append(h('p', { class: 'bk-from', text: `${COPY.bookFoundIn} «${tr.title}»` }));
    } else {
      // colophon: the purchase lives here, quietly; the paper copy only for a finished book
      if (BOOK.buy.ebookUrl) host.append(h('a', { class: 'bk-buy', href: BOOK.buy.ebookUrl, target: '_blank', rel: 'noopener', text: COPY.bookEbook }));
      if (BOOK.buy.physicalUrl && this.complete()) host.append(h('a', { class: 'bk-buy', href: BOOK.buy.physicalUrl, target: '_blank', rel: 'noopener', text: COPY.bookPaper }));
    }
    if (lf.kind !== 'blank') host.removeAttribute('aria-label');
    host.scrollTop = 0;
    $('#bk-prev').disabled = i === 0;
    $('#bk-next').disabled = i === leaves.length - 1;
  },
  /** Like the invitation plate, the open book never covers the official player: beside it, or above it on phones. */
  place() {
    const el = $('#book'), W = window.innerWidth, H = window.innerHeight;
    let w = Math.min(430, W - 24), top = 12, maxH = H - 24, left = (W - w) / 2;
    const port = PlayerPortal.current;
    if (port) {
      const r = port.el.getBoundingClientRect();
      if (W >= 640) {
        const roomR = W - r.right, roomL = r.left, room = Math.max(roomR, roomL);
        if (room >= 300) { w = Math.min(430, room - 28); left = roomR >= roomL ? r.right + (roomR - w) / 2 : (roomL - w) / 2; }
        else { maxH = Math.max(220, r.top - 24); }
      } else { top = 54; maxH = Math.max(220, r.top - 64); }
    }
    const hgt = Math.min(maxH, port && W < 640 ? maxH : Math.min(640, maxH));
    if (!port || W >= 640) top = Math.max(12, (Math.min(H, maxH + 24) - hgt) / 2);
    el.style.width = Math.round(w) + 'px'; el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px'; el.style.height = Math.round(hgt) + 'px';
  },
};
