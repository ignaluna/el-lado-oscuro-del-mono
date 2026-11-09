// ═══════════════════════════════════════════════════════════════════════════════════════════
// ROOMS  (a record floor as a walkable set: the floor's cover is drawn in the world and the challenge happens in it)
//   ROOMS[trackId] describes one room (59-room-1-en-una.js); its 3D set is ROOM_SETS[trackId] (49-r3d-room-1-en-una.js).
//   Like the level of the basements the controller owns what can be touched (hotspots "rm-…"); unlike it, it lives on the
//   nine floors of the record. Free walking is the same as everywhere (Roam): the set stops the visitor where it is solid.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const ROOMS = {};

const Room = {
  id: null,          // track id of the room being visited (null elsewhere, and always null without the 3D world)
  view: 'wide',

  def() { return this.id ? ROOMS[this.id] : null; },
  track() { return this.id ? trackById(this.id) : null; },
  hosts(track) { return !!(track && ROOMS[track.id]); },
  /** The room needs the 3D world (the 2D fallback keeps the plate of Trial). */
  available() { return !!(R && R.kind === '3d' && R.roomPose && this.id); },
  here() { return this.available() && world.phase === 'floor' && !!this.track() && world.floor === this.track().floor; },
  inspecting() { return this.here() && this.view !== 'wide'; },

  arrive(n) {
    const tr = trackOf(n);
    this.leave();
    if (!tr || !this.hosts(tr) || !R || R.kind !== '3d') return;
    this.id = tr.id;
    const port = PlayerPortal.current;
    if (port && window.innerWidth >= 640) { Roam.docked = true; port.setDock('compact'); } // the room is the floor: the player waits in its corner
    const d = this.def();
    if (d.intro) hint(d.intro, 6200);
    syncUI();
  },
  leave() { this.id = null; this.view = 'wide'; },

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

  // ---- what can be touched now ----
  hotOn(id) {
    const d = this.def();
    return !!(d && this.here() && d.hots && d.hots[id] && this.view === 'wide');
  },
  label(id) { const d = this.def() || Object.values(ROOMS)[0]; const h = d && d.hots && d.hots[id]; return h ? (typeof h.label === 'function' ? h.label(this) : h.label) : id; },
  tap(id) {
    if (!this.hotOn(id)) return;
    Sound.unlock();
    const h = this.def().hots[id];
    if (h.tap) h.tap(this);
  },

  /** For the checks. */
  debug() { return { id: this.id, here: this.here(), view: this.view, set: R && R.roomInfo ? R.roomInfo() : null }; },
};
const lvAim = world.floorAim;
world.floorAim = (a) => lvAim(a) || Room.floorAim(a);
