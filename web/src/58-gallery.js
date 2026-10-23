// ═══════════════════════════════════════════════════════════════════════════════════════════
// GALLERY — visiting  (walk the corridor, stand in front of a piece, read what belongs to it)
//   Two ways in: the inscription beside the elevator (works before the release) and the top row of the panel.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Builds what stands outside the doors on floor n: a song's world, the gallery, or nothing (the entrance). */
function setPlace(n) {
  R.setGallery(false);
  R.setFloor(null);
  if (n === GALLERY_FLOOR && GALLERY.enabled) R.setGallery(true);
  else if (trackOf(n)) R.setFloor(trackOf(n));
}

const Gallery = {
  from: 'lobby', // how the visitor came in: 'lobby' (the inscription) or 'elevator'
  item(i) { return galleryLayout().items[i] || null; },
  count() { return GALLERY.pieces.length + 1; }, // + the thanks plate
  /** A narrow screen cannot take in the corridor (the nearest pieces hang outside the view): there the visit is a walk, one piece at a time. */
  guided() { return aspectNow() < 1.2; },
  /** From the entrance: a short fade carries the visitor in (no elevator needed, so it works before the release). */
  enterFromLobby() {
    const p = world.phase;
    if (!GALLERY.enabled || App.overlay || (p !== 'prelaunch' && p !== 'open')) return;
    bakeWalk();
    setPhase('entering');
    Seq.run('main', async (c) => {
      await c.to(world, { exposure: 0 }, rm(0.7), Ease.inOutSine);
      Gallery.apply();
    });
  },
  /** Jump straight into the room (after the fade above, from a #galeria link, or from the dev panel). */
  apply() {
    if (!GALLERY.enabled) return;
    resetWorld();
    const open = Clock.remaining() <= 0;
    Object.assign(world, { env: GALLERY_FLOOR, doors: open ? 1 : 0, lamp: open ? 1 : 0, spill: open ? 1 : 0, line: open ? 1 : 0, lineFade: 0.45, needle: 0, exposure: 0 });
    setPlace(GALLERY_FLOOR);
    setPose(GalleryShots.room(aspectNow()));
    this.arrive('lobby');
    Seq.run('main', (c) => c.to(world, { exposure: 1 }, rm(0.9), Ease.inOutSine));
  },
  arrive(from) {
    this.from = from;
    Roam.reset();
    world.gallery.at = -1;
    world.lookScale = 1;
    Links.setHash(GALLERY.id);
    setPhase('gallery');
    live(`Piso ${GALLERY_FLOOR}: ${GALLERY.label.toLowerCase()}.`);
    if (this.guided()) Seq.run('cam', async (c) => { await c.wait(rm(1.3)); if (world.phase === 'gallery' && world.gallery.at < 0 && !App.overlay) Gallery.focus(0); });
  },
  focus(i) {
    const it = this.item(i);
    if (world.phase !== 'gallery' || App.overlay || !it) return;
    bakeWalk();
    world.gallery.at = i;
    Seq.run('cam', (c) => toPose(c, GalleryShots.piece(it, aspectNow()), rm(1.2), Ease.inOutCubic));
    this.caption();
    syncUI();
  },
  step(d) { const i = clamp(world.gallery.at + d, 0, this.count() - 1); if (i !== world.gallery.at) this.focus(i); },
  /** Step back from the piece into the corridor. */
  back() {
    const it = this.item(world.gallery.at);
    if (world.phase !== 'gallery' || !it) return;
    if (this.guided()) { this.leave(); return; }
    world.gallery.at = -1;
    Seq.run('cam', (c) => toPose(c, GalleryShots.beside(it, aspectNow()), rm(1.0), Ease.inOutCubic));
    syncUI();
  },
  leave() {
    if (world.phase !== 'gallery') return;
    world.gallery.at = -1;
    if (location.hash === '#' + GALLERY.id) Links.setHash(null);
    if (this.from === 'elevator') { returnToElevator(); return; }
    setPhase('returning');
    Seq.run('main', async (c) => {
      await c.to(world, { exposure: 0 }, rm(0.6), Ease.inOutSine);
      if (Clock.remaining() > 0) applyPrelaunch(); else applyOpen(); // (this also ends this sequence)
      world.exposure = 0;
      Seq.run('main', (cc) => cc.to(world, { exposure: 1 }, rm(0.9), Ease.inOutSine));
    });
  },
  /** Text of the piece in front of the visitor. Empty fields simply do not show; a piece with nothing says so. */
  caption() {
    const i = world.gallery.at, piece = GALLERY.pieces[i];
    const title = $('#gal-title'), body = $('#gal-body'), thanks = $('#gal-thanks');
    title.textContent = ''; thanks.textContent = '';
    body.className = ''; body.replaceChildren();
    if (i === GALLERY.pieces.length) { // the closing plate
      title.textContent = GALLERY.thanks.heading || COPY.thanksHeading;
      if (GALLERY.thanks.lines.length) for (const ln of GALLERY.thanks.lines) body.append(h('span', { class: 'gal-name', text: ln }));
      else { body.className = 'gal-pending'; body.textContent = COPY.thanksPending; }
    } else if (piece) {
      title.textContent = piece.title || '';
      if (piece.caption) body.textContent = piece.caption;
      if (piece.thanks) thanks.textContent = piece.thanks;
      if (!piece.title && !piece.caption && !piece.thanks) { body.className = 'gal-pending'; body.textContent = COPY.piecePending; }
    }
    $('#gal-prev').disabled = i <= 0;
    $('#gal-next').disabled = i >= this.count() - 1;
  },
  /** After a resize, or when an image arrives with its real proportions. */
  reframe() {
    if (world.phase !== 'gallery' || Seq.busy('main') || Seq.busy('cam')) return;
    const it = this.item(world.gallery.at), a = aspectNow();
    setPose(it ? GalleryShots.piece(it, a) : { ...GalleryShots.room(a), z: world.cam.z });
  },
};
