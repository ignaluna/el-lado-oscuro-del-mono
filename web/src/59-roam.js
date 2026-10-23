// ═══════════════════════════════════════════════════════════════════════════════════════════
// ROAM  (walking the worlds in first person: look all around, walk, run, bump into things, step back into the lift)
//   Worlds and the gallery are free; the entrance keeps its cover-like framing with a wider margin.
//   Owns world.cam directly while active (scripted sequences take it back whenever they run).
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Roam = {
  joy: { x: 0, y: 0 },          // touch joystick, −1..1 (y > 0 = forward)
  vx: 0, vz: 0,                 // current velocity in the camera frame (m/s; z forward)
  stepT: 0, side: 1,
  moved: 0,                     // metres walked since arriving: the player docks compact once the visitor moves
  docked: false,
  RADIUS: 0.3,

  /** Which free scene the visitor is in right now, or null (scripted moments, dialogs, close looks, the cabin). */
  scene() {
    const p = world.phase;
    if (App.overlay || Seq.busy('main') || Seq.busy('cam') || Seq.busy('lv')) return null;
    if (p === 'floor') return Level.inspecting() ? null : 'floor';
    if (p === 'gallery') return world.gallery.at < 0 ? 'gallery' : null;
    if (p === 'prelaunch' || p === 'open') return 'lobby';
    return null;
  },
  /** Called whenever a scene is set up from scratch. */
  reset() {
    this.vx = this.vz = 0; this.stepT = 0; this.moved = 0; this.docked = false;
    this.joy.x = this.joy.y = 0;
  },

  /** Drag to look (mouse or a finger). Returns false when looking is not free here (the cabin keeps its own). */
  look(dx, dy, kind) {
    const sc = this.scene();
    if (!sc) return false;
    const k = kind === 'touch' ? 0.0056 : 0.0034, c = world.cam;
    c.yaw -= dx * k;
    const pmax = sc === 'lobby' ? 0.42 : 1.05;
    c.pitch = clamp(c.pitch - dy * k, -pmax, pmax);
    if (sc === 'lobby') c.yaw = clamp(c.yaw, 0 - 0.95, 0 + 0.95);
    return true;
  },

  /** One frame. Returns true while the scene is free (the old look/walk offsets then stay at rest). */
  tick(dt, keys) {
    const sc = this.scene(), c = world.cam;
    this.rotateInvite();
    if (!sc) { this.vx = this.vz = 0; return false; }
    this.dockIfNeeded();
    let mx = this.joy.x, mz = this.joy.y, turn = 0;
    if (keys.has('a')) mx -= 1;
    if (keys.has('d')) mx += 1;
    if (keys.has('w') || keys.has('arrowup')) mz += 1;
    if (keys.has('s') || keys.has('arrowdown')) mz -= 1;
    if (keys.has('arrowleft') || keys.has('q')) turn += 1;
    if (keys.has('arrowright') || keys.has('e')) turn -= 1;
    const mag = Math.hypot(mx, mz);
    if (mag > 1) { mx /= mag; mz /= mag; }
    const run = keys.has('shift') || Math.hypot(this.joy.x, this.joy.y) > 0.97;
    const vmax = (run ? 2.9 : 1.6) * (sc === 'lobby' ? 0.75 : 1);
    this.vx = damp(this.vx, mx * vmax, 9, dt); this.vz = damp(this.vz, mz * vmax, 9, dt);
    if (turn) { c.yaw += turn * 1.9 * dt; if (sc === 'lobby') c.yaw = clamp(c.yaw, 0 - 0.95, 0 + 0.95); }
    const speed = Math.hypot(this.vx, this.vz);
    look.moving = speed > 0.35;
    if (speed < 0.01) return true;
    const sy = Math.sin(c.yaw), cy = Math.cos(c.yaw);
    let nx = c.x + (cy * this.vx - sy * this.vz) * dt, nz = c.z + (-sy * this.vx - cy * this.vz) * dt;
    // the open elevator: walking into its doorway steps in (entrance) or back in (a world)
    const intoDoor = Math.abs(nx) < 0.5 && -sy * this.vx - cy * this.vz < -0.25; // moving toward −Z
    if (sc === 'lobby' && world.phase === 'open' && intoDoor && nz < 2.75) { enterCabin(); return true; }
    if (sc === 'floor' && intoDoor && nz < 1.55) { returnToElevator(); return true; }
    [nx, nz] = this.collide(sc, nx, nz);
    const d = Math.hypot(nx - c.x, nz - c.z);
    c.x = nx; c.z = nz;
    this.moved += d;
    // footsteps on the water
    this.stepT += (d / 0.72);
    if (this.stepT >= 1) {
      this.stepT -= 1; this.side = -this.side;
      Sound.steps();
      if (R && R.ripple) R.ripple(c.x + cy * 0.14 * this.side - sy * 0.35, c.z - sy * 0.14 * this.side - cy * 0.35, run ? 0.2 : 0.13);
    }
    this.dockIfNeeded();
    return true;
  },

  /** Wide screens: the player moves to the corner once the visitor walks; a phone lying down: right away. */
  dockIfNeeded() {
    const port = PlayerPortal.current, W = window.innerWidth, H = window.innerHeight;
    if (!port || W < 640) return;
    const want = this.moved > 0.8 || H < 520;
    if (want && !this.docked) { this.docked = true; port.setDock('compact'); }
  },
  /** On a phone held upright in a world: once per visit, an invitation to lie it down. */
  rotateInvite() {
    const el = $('#rot-invite'), sc = this.scene();
    const portrait = window.innerWidth < window.innerHeight;
    const want = Joy.coarse && portrait && (sc === 'floor' || sc === 'gallery') && !store.session.get('eldom.rot');
    if (!portrait && !el.hidden) store.session.set('eldom.rot', '1'); // they did it
    if (el.hidden === !want) return;
    el.hidden = !want;
  },
  /** Keeps the visitor inside the scene and outside the solid things in it. */
  collide(sc, x, z) {
    const r = this.RADIUS;
    if (sc === 'floor') { // a wide disc of water in front of the elevator
      const cx = 0, cz = 8, R0 = 13, d = Math.hypot(x - cx, z - cz);
      if (d > R0) { x = cx + ((x - cx) * R0) / d; z = cz + ((z - cz) * R0) / d; }
    } else if (sc === 'gallery') {
      x = clamp(x, -1.5, 1.5); z = clamp(z, 2.4, Math.max(2.5, galleryLayout().end - 2.2));
    } else {
      x = clamp(x, -3.4, 3.4); z = clamp(z, world.phase === 'open' ? 2.4 : 3.2, Math.max(4, poseFromShot(Shots.spawn(aspectNow())).z + 1.2));
    }
    if (sc !== 'gallery') [x, z] = pushOutBox(x, z, 0, 0.0 - 0.9, 1.15, 2.15, 0, r); // the elevator, its jambs and steps (z −3.05 … 1.25)
    if (sc === 'floor' && R && R.levelSolids) for (const s of R.levelSolids()) {
      if (s.kind === 'box') [x, z] = pushOutBox(x, z, s.x, s.z, s.hw, s.hd, s.ry, r);
      else { const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz), m = s.r + r; if (d < m && d > 1e-6) { x = s.x + (dx / d) * m; z = s.z + (dz / d) * m; } }
    }
    return [x, z];
  },
};

/** Pushes a circle (x, z, r) out of an oriented box (centre, half width/depth, rotation about Y). */
function pushOutBox(x, z, bx, bz, hw, hd, ry, r) {
  const c = Math.cos(-ry), s = Math.sin(-ry);
  const lx = (x - bx) * c + (z - bz) * s, lz = -(x - bx) * s + (z - bz) * c; // into the box frame
  const ex = hw + r, ez = hd + r;
  if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) return [x, z];
  const px = ex - Math.abs(lx), pz = ez - Math.abs(lz);
  let nx = lx, nz = lz;
  if (px < pz) nx = Math.sign(lx || 1) * ex; else nz = Math.sign(lz || 1) * ez;
  const c2 = Math.cos(ry), s2 = Math.sin(ry);
  return [bx + nx * c2 + nz * s2, bz - nx * s2 + nz * c2];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TOUCH JOYSTICK  (left thumb walks, right thumb looks; it appears where the thumb lands)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const Joy = {
  id: null, ox: 0, oy: 0, R: 52,
  coarse: matchMedia('(pointer: coarse)').matches,
  /** A touch in the lower-left part of the screen becomes the joystick. */
  claim(e) {
    if (this.id !== null || e.pointerType !== 'touch' || !Roam.scene()) return false;
    const W = window.innerWidth, H = window.innerHeight;
    if (e.clientX > W * 0.45 || e.clientY < H * 0.3) return false;
    this.id = e.pointerId; this.ox = e.clientX; this.oy = e.clientY;
    const el = $('#joy');
    el.style.transform = `translate(${Math.round(this.ox - 70)}px,${Math.round(this.oy - 70)}px)`;
    el.hidden = false; el.classList.add('on');
    this.move(e);
    return true;
  },
  owns(id) { return this.id === id; },
  move(e) {
    let dx = e.clientX - this.ox, dy = e.clientY - this.oy;
    const d = Math.hypot(dx, dy);
    if (d > this.R) { dx = (dx / d) * this.R; dy = (dy / d) * this.R; }
    Roam.joy.x = dx / this.R; Roam.joy.y = -dy / this.R;
    const dead = Math.hypot(Roam.joy.x, Roam.joy.y) < 0.12;
    if (dead) Roam.joy.x = Roam.joy.y = 0;
    $('#joy-knob').style.transform = `translate(${Math.round(dx)}px,${Math.round(dy)}px)`;
  },
  release() {
    this.id = null; Roam.joy.x = Roam.joy.y = 0;
    const el = $('#joy'); el.classList.remove('on'); el.hidden = true;
    $('#joy-knob').style.transform = '';
  },
  /** The resting hint: a faint ring where the left thumb goes, only on touch screens in a free scene. */
  sync() {
    const g = $('#joy-ghost');
    const show = this.coarse && !!Roam.scene() && this.id === null && Roam.moved < 6;
    if (show) { // above the docked player in portrait, in the corner when the phone lies down
      const port = PlayerPortal.current, H = window.innerHeight, portrait = window.innerWidth < window.innerHeight;
      const top = portrait && port ? port.el.getBoundingClientRect().top - 132 : H - 132;
      g.style.top = Math.round(Math.max(H * 0.32, top)) + 'px';
    }
    if (g.hidden !== !show) g.hidden = !show;
  },
};
