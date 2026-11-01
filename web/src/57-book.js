// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE BOOK  (picked up at the steps or earned on a floor, marked with a fingerprint, filled with chapters)
//   The opening pages come with it; each chapter opens when its floor's challenge is solved (Progress, kept on this
//   device). The copy itself — found, fingerprint, open page — lives in sessionStorage. Every word is the author's
//   (05-book-text.js), in the book's own order.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Book = {
  KEY: 'eldom.book',
  state: { found: false, print: null, at: 0 },
  load() {
    const s = store.session.json(this.KEY, null);
    if (s && typeof s === 'object') {
      this.state = {
        found: !!s.found,
        print: s.print && typeof s.print.u === 'number' ? s.print : null,
        at: Number.isFinite(s.at) ? s.at : 0,
      };
    }
    if (Progress.count() > 0) this.state.found = true; // whoever earned a chapter carries the book
    this.mirror();
  },
  save() { store.session.setJson(this.KEY, this.state); this.mirror(); },
  reset() {
    if (App.overlay === 'book') this.close();
    this.state = { found: false, print: null, at: 0 };
    store.session.remove(this.KEY);
    this.mirror();
    syncUI();
  },
  /** Copies what the renderers need into the world state. */
  mirror() { world.book.found = this.state.found; world.book.print = this.state.print; },
  pageFor(trackId) { const t = trackById(trackId); return (t && BOOK.pages.find((p) => p.id === t.chapter)) || null; },
  has(id) { return Progress.chapterOpen(id); },
  complete() { return Progress.complete(); },
  canPick() { return BOOK.enabled && !this.state.found; },
  /** Chapters are no longer loose pages lying in the worlds: they come out of the challenges (Trial). */
  pageHere() { return null; },

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

  /** A chapter just found: the book's icon answers, and the book opens right on it. */
  receive(chapterId) {
    this.state.found = true;
    if (!this.state.print) this.state.print = { u: 0.6, v: 0.57, r: -0.55 + Math.random() * 0.5 };
    this.save();
    syncUI();
    const icon = $('#book-open');
    icon.classList.remove('got'); void icon.offsetWidth; icon.classList.add('got');
    live(COPY.bookGotChapter);
    this.open(this.leafOf(chapterId));
  },

  /** Everything the book holds, in reading order. A chapter not found yet stays in as a closed leaf that says where
   *  it waits; the closing lines wait for the nine chapters; the back cover is always there. */
  leaves() {
    return [
      { kind: 'cover' },
      ...BOOK.opening.map((page) => ({ kind: 'text', page })),
      ...BOOK.pages.map((page) => ({ kind: this.has(page.id) ? 'text' : 'blank', page })),
      { kind: this.complete() ? 'text' : 'blank', page: BOOK.closing },
      { kind: 'text', page: BOOK.back },
      { kind: 'colophon' },
    ];
  },
  /** Leaf index of a page id (for opening the book right on a chapter just found). */
  leafOf(id) { return this.leaves().findIndex((l) => l.page && l.page.id === id); },
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
    Trial.onBookClosed();
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
    } else if (lf.kind === 'blank') { // closed: its title and where it waits — never a word of its text
      const pg = lf.page, tx = pg && bookText(pg.id), tr = pg && trackForChapter(pg.id);
      host.setAttribute('aria-label', COPY.bookBlank);
      if (tx && tx.heading) host.append(h('h3', { text: tx.heading }));
      host.append(h('p', { class: 'bk-closed', text: tr ? `${COPY.bookWaits} ${floorName(tr.floor).toLowerCase()}, «${tr.title}».` : COPY.bookClosing }));
    } else if (lf.kind === 'text') { // the author's paragraphs exactly as written (the CSS keeps every space)
      const pg = lf.page, tx = bookText(pg.id), tr = trackForChapter(pg.id);
      if (tx) {
        if (tx.heading) host.append(h('h3', { text: tx.heading }));
        if (tx.qr && tr) host.append(h('p', { class: 'bk-song', text: `♪ «${tx.qr}» · ${floorName(tr.floor)}` }));
        for (const para of tx.paras) {
          if (para === '') host.append(h('p', { class: 'bk-pause', 'aria-hidden': 'true' }));
          else if (typeof para === 'string') host.append(h('p', { text: para }));
          else host.append(h('p', { class: para.b ? 'bk-b' : null, text: para.t }));
        }
      }
      if (pg.id === BOOK.back.id) host.classList.add('bk-back');
    } else {
      // colophon: the purchase lives here, quietly; the paper copy only for a finished book
      if (BOOK.buy.ebookUrl) host.append(h('a', { class: 'bk-buy', href: BOOK.buy.ebookUrl, target: '_blank', rel: 'noopener', text: COPY.bookEbook }));
      if (BOOK.buy.physicalUrl && this.complete()) host.append(h('a', { class: 'bk-buy', href: BOOK.buy.physicalUrl, target: '_blank', rel: 'noopener', text: COPY.bookPaper }));
    }
    if (lf.kind !== 'blank') host.removeAttribute('aria-label');
    $('#bk-count').textContent = `${Progress.count()} / ${Progress.total()}`;
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
