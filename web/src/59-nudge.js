// ═══════════════════════════════════════════════════════════════════════════════════════════
// NUDGE  (PISTA glows when the visitor seems stuck; a hint is never shown by itself)
//   The glow (class "nudge" on #rm-hint / #lv-hint) starts after two wrong tries in the current stage, or after idleMs (about 90 s) on the floor
//   without progress, whichever comes first. Progress is a change of the saved stage. Idle time only counts while the floor is showing
//   and nothing is open over it. The glow stops when PISTA is opened, on progress, and when the floor is done.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Nudge = {
  TRIES: 2,
  idleMs: 90000,    // about 90 s on the floor without progress (the checks shorten it: Dev.actions.nudgeIdle)
  key: '',          // what the floor is at: which one and which stage (a change is progress)
  idle: 0,          // ms on the floor, nothing open over it, since the stage last changed
  tries0: 0,        // wrong tries the visitor had when this stage began
  opened: false,    // PISTA was opened in this stage: it stays quiet until the stage changes
  on: false,

  /** What the visitor is stuck at now: { key, tries, btn } or null (no floor with a hint, a finished one). */
  target() {
    if (Room.here() && Room.s && !Room.s.done) return { key: `room:${Room.id}:${Room.s.stage}`, tries: Room.s.tries || 0, btn: '#rm-hint' };
    if (Level.here() && Level.s && !Level.s.done) return { key: `level:${Level.s.stage}`, tries: Level.s.tries || 0, btn: '#lv-hint' };
    return null;
  },
  /** A new floor, a reset, a floor left: starts counting again from nothing. */
  reset() { this.key = ''; this.idle = 0; this.opened = false; this.show(false); },
  /** PISTA was opened: the invitation was taken up. */
  take() { this.opened = true; this.idle = 0; this.show(false); },
  show(on) {
    this.on = on;
    for (const id of ['#rm-hint', '#lv-hint']) { const b = $(id); if (b && b.classList.contains('nudge') !== (on && id === this.btn)) b.classList.toggle('nudge', on && id === this.btn); }
  },
  /** One frame (dt in seconds). */
  tick(dt) {
    const t = this.target();
    if (!t) { if (this.key) this.reset(); return; }
    if (t.key !== this.key) { this.key = t.key; this.idle = 0; this.tries0 = t.tries; this.opened = false; } // (arriving, or progress)
    this.btn = t.btn;
    if (!App.overlay && !document.hidden && world.phase === 'floor') this.idle += dt * 1000;
    const stuck = t.tries - this.tries0 >= this.TRIES || this.idle >= this.idleMs;
    const want = stuck && !this.opened;
    if (want !== this.on || (want && !$(t.btn).classList.contains('nudge'))) this.show(want);
  },
};
