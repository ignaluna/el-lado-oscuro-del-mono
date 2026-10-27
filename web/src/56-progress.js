// ═══════════════════════════════════════════════════════════════════════════════════════════
// CATALOG  (records, floors, chapters — every link goes through stable ids)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const ELODM = 'elodm', PP = 'pp';
const albumTracks = (album) => tracks.filter((t) => t.album === album);
const trackById = (id) => tracks.find((t) => t.id === id) || null;
/** The floor whose challenge reveals chapter `id` (BOOK.pages[].id). */
const trackForChapter = (id) => tracks.find((t) => t.chapter === id) || null;
const isBasement = (n) => n < 0;
/** How a floor is called out loud and on the plates: "Piso 3", "Subsuelo 2". */
const floorName = (n) => (n < 0 ? `Subsuelo ${-n}` : n === 0 ? 'PB' : `Piso ${n}`);
/** Engraved number: "3", "−2" (a real minus sign), "PB". */
const floorMark = (n) => (n < 0 ? '−' + -n : n === 0 ? 'PB' : String(n));
/** The chapter's texts (05-book-text.js); null when missing. */
const bookText = (id) => (typeof BOOK_TEXT !== 'undefined' && BOOK_TEXT[id]) || null;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PROGRESS  (what this visitor solved, kept on this device across visits)
//   Versioned and keyed by challenge = track id. Only the nine challenges of El Lado Oscuro del Mono count: the old
//   prototype level, the visited floors or an old book (eldom.book, eldom.level.v1) never solve anything here.
//   Unreadable data is set aside under KEY + ".bad" (never silently thrown away) and the visit starts clean.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Progress = {
  KEY: 'eldom.progress.v2',
  s: null,
  fresh() { return { v: 2, solved: {}, hints: {}, revealed: false }; },
  ids() { return albumTracks(ELODM).map((t) => t.id); },
  load() {
    const raw = store.local.get(this.KEY), f = this.fresh();
    if (raw) {
      let d = null;
      try { d = JSON.parse(raw); } catch { d = null; }
      if (d && typeof d === 'object' && d.v === 2) {
        const ok = new Set(this.ids());
        if (d.solved && typeof d.solved === 'object') {
          for (const [id, it] of Object.entries(d.solved)) if (ok.has(id)) f.solved[id] = { at: Number(it && it.at) || 0 };
        }
        if (d.hints && typeof d.hints === 'object') {
          for (const [id, n] of Object.entries(d.hints)) if (ok.has(id)) f.hints[id] = clamp(Math.round(Number(n) || 0), 0, 99);
        }
        f.revealed = !!d.revealed && this.ids().every((id) => f.solved[id]);
      } else {
        store.local.set(this.KEY + '.bad', raw);
        console.warn('progress: unreadable saved state kept under ' + this.KEY + '.bad');
      }
    }
    this.s = f;
  },
  save() { store.local.setJson(this.KEY, this.s); },
  solved(id) { return !!(this.s && this.s.solved[id]); },
  /** Marks a challenge solved. Returns false when it already was (the reward is given once). */
  solve(id) {
    if (!this.ids().includes(id) || this.solved(id)) return false;
    this.s.solved[id] = { at: Date.now() };
    this.save();
    return true;
  },
  count() { return this.ids().filter((id) => this.solved(id)).length; },
  total() { return this.ids().length; },
  complete() { return this.total() > 0 && this.count() === this.total(); },
  /** The basements answer only to the nine solved challenges. */
  basementsOpen() { return this.complete(); },
  chapterOpen(chapterId) { const t = trackForChapter(chapterId); return !!(t && this.solved(t.id)); },
  hints(id) { return (this.s && this.s.hints[id]) || 0; },
  hint(id) { this.s.hints[id] = (this.s.hints[id] || 0) + 1; this.save(); },
  /** The reveal of the basements is shown once; after that the panel simply has them. */
  markRevealed() { this.s.revealed = true; this.save(); },
  reset() { this.s = this.fresh(); store.local.remove(this.KEY); },
  debug() { return { solved: this.ids().filter((id) => this.solved(id)), count: this.count(), open: this.basementsOpen(), revealed: !!(this.s && this.s.revealed), saved: store.local.json(this.KEY, null) }; },
};
