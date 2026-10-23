// ═══════════════════════════════════════════════════════════════════════════════════════════
// FLOORS  (one data-driven system; `track.visual.kind` picks a light variation)
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Where the official player sits on desktop for each kind (phones always dock it at the bottom). */
const FLOOR_ALIGN = { halo: 'center', flock: 'left', chat: 'center', thread: 'center', mate: 'left', pin: 'left', glass: 'right', letters: 'center', staff: 'center' };
/** The level's world puts its player on the right on wide screens: the wall and the stones stand on the left. */
const alignFor = (tr) => (LEVEL.enabled && tr.floor === LEVEL.floor ? 'right' : FLOOR_ALIGN[tr.visual.kind] || 'center');
const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const PARTICLE_VERT = /* glsl */`
attribute vec4 aSeed; uniform float uPhase; uniform float uTime; uniform float uScale; uniform float uMode; uniform float uAlpha; uniform vec3 uBox; uniform vec3 uOrigin;
varying float vA; varying float vP; varying float vS;
void main(){
  vec3 p = position;
  if(uMode < 0.5){ p.y = mod(position.y + uPhase*(0.35+aSeed.y), uBox.y); p.x += sin(uPhase*0.7 + aSeed.x*40.0)*0.3*aSeed.z; p.z += cos(uPhase*0.6 + aSeed.y*30.0)*0.3*aSeed.z; }
  else if(uMode < 1.5){ p.y = uBox.y - mod(uBox.y - position.y + uPhase*(0.3+aSeed.y*0.5), uBox.y); p.x += sin(uPhase*0.9 + aSeed.x*40.0)*0.55; p.z += cos(uPhase*0.5 + aSeed.z*20.0)*0.3; }
  else { float a = aSeed.x*6.2832 + uPhase*(0.12+aSeed.y*0.2); float r = length(position.xz); p.x = cos(a)*r; p.z = sin(a)*r*0.45; p.y = position.y + sin(uPhase*0.6 + aSeed.z*20.0)*0.25; }
  p += uOrigin;
  vP = aSeed.w; vS = aSeed.x;
  vA = (0.35 + 0.65*(0.5+0.5*sin(uTime*(0.8+aSeed.z*2.0)+aSeed.x*50.0))) * uAlpha * smoothstep(0.0, 0.5, p.y);
  vec4 mv = viewMatrix * vec4(p,1.0);
  gl_PointSize = clamp(uScale*(1.0+aSeed.y*1.8)/-mv.z, 1.0, 14.0);
  gl_Position = projectionMatrix * mv;
}`;
const PARTICLE_FRAG = /* glsl */`
uniform vec3 uTint; uniform float uPrism; uniform float uSoft;
varying float vA; varying float vP; varying float vS;
void main(){
  float r = length(gl_PointCoord - 0.5)*2.0;
  float a = mix(smoothstep(1.0, 0.55, r), pow(clamp(1.0-r,0.0,1.0), 2.0), uSoft) * vA;
  vec3 c = vP > 1.0 - uPrism ? 0.5 + 0.5*cos(6.2832*(vS*3.0 + vec3(0.0,0.33,0.67))) : uTint;
  gl_FragColor = vec4(c*a, 1.0);
}`;
const BIRD_VERT = /* glsl */`
attribute vec4 aBird; attribute float aWing; uniform float uPhase; uniform vec3 uOrigin; uniform float uSize;
void main(){
  float a = aBird.y + uPhase*aBird.w;
  vec3 c = uOrigin + vec3(cos(a)*aBird.x, aBird.z + sin(a*2.0 + aBird.y)*0.35, sin(a)*aBird.x*0.55);
  vec3 tg = normalize(vec3(-sin(a), 0.0, cos(a)*0.55));
  vec3 side = vec3(-tg.z, 0.0, tg.x);
  float flap = sin(uPhase*5.0*aBird.w*4.0 + aBird.y*9.0);
  vec3 p = c + side*aWing*uSize + vec3(0.0, abs(aWing)*uSize*(0.25 + 0.45*flap), 0.0) - tg*abs(aWing)*uSize*0.35;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

function buildFloors3D(ctx) {
  const { THREE, scene, LU, V3, ink, glowMat, keep, planeGeo, makeText, disposables, waterU, ripple } = ctx;
  let cur = null; // { track, group, update, A, marks }
  const RAISE = { depthWrite: false, transparent: true, blending: THREE.AdditiveBlending };

  /** Portal anchor: the DOM player rectangle unprojected onto a vertical plane where its base meets the water. */
  function computeAnchor(track) {
    const W = ctx.W, H = ctx.H, a = W / H;
    const pose = poseFromShot(Shots.floor(a));
    ctx.aimProbe(pose, a);
    const r = PlayerPortal.expectedRect('floor', world.platform || 'youtube', alignFor(track));
    const base = ctx.screenToZ(0.5, Math.min(0.985, (r.y + r.h) / H + 0.03), pose.z + 1);
    const dy = base.y - pose.y, dz = base.z - pose.z; // ray toward the base of the player
    const z = dy < -0.01 ? pose.z + (dz * pose.y) / -dy : pose.z + 13;
    const zA = clamp(z, pose.z + 5, pose.z + 12.5);
    const c = ctx.screenToZ((r.x + r.w / 2) / W, (r.y + r.h / 2) / H, zA);
    const l = ctx.screenToZ(r.x / W, (r.y + r.h / 2) / H, zA);
    const t = ctx.screenToZ((r.x + r.w / 2) / W, r.y / H, zA);
    const w = Math.abs(c.x - l.x) * 2, hh = Math.abs(t.y - c.y) * 2;
    const dist = zA - pose.z;
    const A = {
      kind: track.visual.kind,
      x: c.x, y: c.y, y0: c.y - hh / 2, y1: c.y + hh / 2, w, h: hh, z: zA, dist, pose, phone: W < 640, rect: r, aspect: a,
      /** World point at a screen fraction, `dz` metres behind the anchor plane. */
      at: (sx, sy, dzz = 0) => ctx.screenToZ(sx, sy, zA + dzz),
      /** World height covering `frac` of the viewport at the anchor plane (+dz). */
      size: (frac, dzz = 0) => ctx.worldH(frac, dist + dzz, pose.fov),
    };
    // where this world's loose book page floats (resolved now, while the probe camera is aimed at this floor)
    const [px, py] = pageSpot(A.kind, A.phone);
    // it must float above the water: walk the sight line toward the viewer until it clears the surface
    let dzp = -1.2;
    for (let i = 0; i < 14; i++) {
      A.pagePos = A.at(px, py, dzp);
      A.pageH = A.size(A.phone ? 0.075 : 0.095, dzp);
      if (A.pagePos.y >= A.pageH * 0.66 || dist + dzp < 2.4) break;
      dzp -= 0.45;
    }
    return A;
  }

  function build(track) {
    const marks = { d: disposables.length, g: ctx.geos.length, u: ctx.updaters.length };
    const group = new THREE.Group();
    scene.add(group);
    const A = computeAnchor(track);
    const accent = hex3(track.visualAccent);
    const accV = V3(...accent);
    const F = { // helpers bound to this floor
      A, accent, accV, group, track,
      basic: (color, opacity = 1, extra = {}) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color[0], color[1], color[2]), opacity, ...RAISE, ...extra }); disposables.push(m); return m; },
      lineMat: (color, opacity = 1) => { const m = new THREE.LineBasicMaterial({ color: new THREE.Color(color[0], color[1], color[2]), opacity, ...RAISE }); disposables.push(m); return m; },
      line(points, mat, closed = false) { const g = keep(new THREE.BufferGeometry().setFromPoints(points)); const l = closed ? new THREE.LineLoop(g, mat) : new THREE.Line(g, mat); group.add(l); return l; },
      mesh(geo, mat, x = 0, y = 0, z = 0, parent = group) { const m = new THREE.Mesh(keep(geo), mat); m.position.set(x, y, z); parent.add(m); return m; },
      circle(r, n = 64) { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; pts.push(V3(Math.cos(a) * r, Math.sin(a) * r, 0)); } return pts; },
      /** One Points object with a few motion modes (0 rise, 1 fall, 2 orbit). */
      particles(n, o) {
        const r = mulberry32(track.floor * 97 + 3);
        const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) {
          pos[i * 3] = (r() - 0.5) * o.box[0]; pos[i * 3 + 1] = r() * o.box[1]; pos[i * 3 + 2] = (r() - 0.5) * o.box[2];
          if (o.mode === 2) { const rad = o.radius * (0.75 + r() * 0.5); pos[i * 3] = rad; pos[i * 3 + 2] = 0; pos[i * 3 + 1] = (r() - 0.5) * o.box[1]; }
          seed[i * 4] = r(); seed[i * 4 + 1] = r(); seed[i * 4 + 2] = r(); seed[i * 4 + 3] = r();
        }
        const g = keep(new THREE.BufferGeometry());
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
        const u = { uPhase: { value: 0 }, uTime: LU.uTime, uScale: { value: (o.size || 12) * ctx.dpr * (ctx.H / 900) }, uMode: { value: o.mode || 0 }, uAlpha: { value: o.alpha ?? 0.5 },
          uBox: { value: V3(...o.box) }, uOrigin: { value: o.origin.clone() }, uTint: { value: V3(...(o.tint || accent)) }, uPrism: { value: o.prism ?? 0.03 }, uSoft: { value: o.soft ?? 0 } };
        const m = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG, uniforms: u, ...RAISE });
        disposables.push(m);
        const p = new THREE.Points(g, m);
        p.frustumCulled = false; p.layers.set(1);
        group.add(p);
        return { u, speed: o.speed ?? 0.2 };
      },
      text(str, pxW, pxH, font, spacing, height, pos, alpha = 0.95) {
        const t = makeText(pxW, pxH, font, spacing);
        t.set(str); t.u.uAlpha.value = alpha;
        t.mesh.scale.setScalar(height); t.mesh.position.copy(pos); t.mesh.rotation.y = Math.PI;
        group.add(t.mesh);
        return t;
      },
      light(pos, k, range) { LU.uPPos.value[3].copy(pos); LU.uPRange.value[3] = range; F.lightK = k; },
      lightK: 0.8,
    };
    // title + "PISO n · m:ss" (in the world, never in a card)
    const tFrac = A.phone ? 0.072 : ctx.H < 520 ? 0.07 : 0.082;
    const titleH = A.size(tFrac);
    const tSy = A.phone ? 0.215 : Math.max(tFrac / 2 + 0.05, (A.rect.y - 42) / ctx.H - tFrac / 2);
    const tSx = (A.rect.x + A.rect.w / 2) / ctx.W;
    const title = F.text(track.title, 1800, 230, (px) => FONT_DISPLAY(px, 'italic', 400), 0.01, titleH, A.at(tSx, tSy, 0.4));
    const maxW = A.size(0.92) * A.aspect;
    if (titleH * (1800 / 230) > maxW) title.mesh.scale.setScalar(maxW / (1800 / 230));
    const infoStr = `PISO ${track.floor}${track.durationSeconds ? ' · ' + fmtDuration(track.durationSeconds) : ''}`;
    F.text(infoStr, 1024, 96, FONT_CAPS, 0.34, A.size(A.phone ? 0.025 : 0.024), A.at(tSx, tSy - (A.phone ? 0.062 : tFrac / 2 + 0.03), 0.4), 0.8);
    if (track.shortText) F.text(track.shortText, 1600, 110, (px) => FONT_DISPLAY(px, 'italic', 400), 0.01, A.size(0.03), A.at(tSx, tSy + (A.phone ? 0.05 : 0.066), 0.4), 0.75);

    const kind = FLOOR_KINDS[track.visual.kind] || FLOOR_KINDS.halo;
    const tick = kind(F, ctx) || (() => {});
    waterU.uAccent.value.set(...accent);
    let live = 0, ripT = 2;
    const state = { track, group, A, marks, live: 0 };
    state.update = (dt, t) => {
      live = damp(live, world.playing ? 1 : 0, 2.5, dt);
      state.live = live;
      waterU.uAccentAmt.value = damp(waterU.uAccentAmt.value, 0.85, 2, dt);
      LU.uPCol.value[3].set(...accent).multiplyScalar(F.lightK * (1 + 0.3 * live));
      tick(dt * (world.reduced ? 0.3 : 1), t, live, (period, fn) => { ripT -= dt; if (ripT <= 0) { ripT = period; fn(); } });
    };
    return state;
  }

  function destroy() {
    if (!cur) return;
    scene.remove(cur.group);
    for (let i = cur.marks.d; i < disposables.length; i++) disposables[i].dispose && disposables[i].dispose();
    disposables.length = cur.marks.d;
    for (let i = cur.marks.g; i < ctx.geos.length; i++) ctx.geos[i].dispose();
    ctx.geos.length = cur.marks.g;
    cur = null;
    LU.uPCol.value[3].set(0, 0, 0);
  }

  ctx.updaters.push((dt, t) => {
    if (cur) cur.update(dt, t);
    else waterU.uAccentAmt.value = damp(waterU.uAccentAmt.value, 0, 2, dt);
  });

  return {
    set(track) { destroy(); if (track) cur = build(track); },
    refit() { if (cur) { const tr = cur.track; destroy(); cur = build(tr); } },
    portalDepth() { return cur ? cur.A.dist : 8; },
    anchor() { return cur ? cur.A : null; },
  };
}

/** Each kind receives the floor helpers and returns tick(dt, t, live, every). Keep them small. */
const FLOOR_KINDS = {
  // 1 — a monumental ring standing on the water; with its reflection it draws a figure-eight. Fully finished floor.
  halo(F, ctx) {
    const { THREE, V3, ripple } = ctx, A = F.A;
    const R = 1.1 * Math.hypot(A.w / 2, Math.max(0.4, A.y1));
    const cz = A.z + 0.7;
    const ring = F.mesh(new THREE.TorusGeometry(R, 0.03, 12, 160), F.basic([0.95, 0.92, 0.84], 0.95), A.x, 0, cz);
    const aura = F.mesh(new THREE.TorusGeometry(R, 0.16, 8, 120), F.basic(F.accent, 0.07), A.x, 0, cz + 0.02);
    const inner = F.mesh(new THREE.TorusGeometry(R * 0.93, 0.008, 6, 120), F.basic(F.accent, 0.4), A.x, 0, cz + 0.05);
    const far = F.mesh(new THREE.TorusGeometry(R * 1.9, 0.014, 6, 160), F.basic(F.accent, 0.22), A.x, 0.2, cz + 6);
    // prismatic shimmer travelling around the ring while the song plays
    const spark = F.mesh(new THREE.PlaneGeometry(1, 1), ctx.glowMat(HALO_FRAG, { uTint: { value: V3(1, 1, 1) }, uAlpha: { value: 0 }, uStripes: { value: 0 } }), 0, 0, cz - 0.05);
    spark.scale.setScalar(R * 0.5);
    F.light(V3(A.x, R * 0.55, A.z - 0.8), 0.95, R * 5);
    const motes = F.particles(300, { mode: 0, box: [R * 3.4, R * 2.3, 9], origin: V3(A.x, 0, A.z + 1), size: 13, alpha: 0.5, prism: 0.03, speed: 0.05, tint: [0.93, 0.9, 0.82] });
    let ang = 0;
    return (dt, t, live, every) => {
      motes.u.uPhase.value += dt * motes.speed * (1 + live) * 4;
      far.rotation.y += (dt * TAU) / 90;
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.7);
      ring.material.opacity = 0.82 + 0.1 * breathe + 0.08 * live;
      aura.material.opacity = 0.05 + 0.03 * breathe + 0.07 * live;
      inner.material.opacity = 0.25 + 0.25 * live;
      ang += (dt * TAU) / 6;
      spark.position.set(A.x + Math.cos(ang) * R, Math.sin(ang) * R, cz - 0.05);
      const hue = 0.5 + 0.5 * Math.sin(ang * 2);
      spark.material.uniforms.uTint.value.set(0.6 + 0.4 * Math.cos(TAU * hue), 0.6 + 0.4 * Math.cos(TAU * (hue + 0.33)), 0.6 + 0.4 * Math.cos(TAU * (hue + 0.67)));
      spark.material.uniforms.uAlpha.value = (spark.position.y > 0 ? 1 : 0) * live * 0.85;
      every(lerp(5, 2.5, live), () => { ripple(A.x - R, cz, 0.42); ripple(A.x + R, cz, 0.42); });
    };
  },

  // 2 — an open, empty birdcage and a slow flock circling wide
  flock(F, ctx) {
    const { THREE, V3 } = ctx, A = F.A;
    const c = A.phone ? A.at(0.72, 0.4, 1.5) : A.at(0.8, 0.44, 1.5);
    const s = A.size(A.phone ? 0.2 : 0.3, 1.5);
    const cage = new THREE.Group(); cage.position.copy(c); F.group.add(cage);
    const lm = F.lineMat([0.92, 0.89, 0.82], 0.75);
    const add = (pts, closed) => { const l = F.line(pts, lm, closed); cage.add(l); return l; };
    const r = s * 0.34;
    for (let i = 0; i < 14; i++) { if (i === 3 || i === 4) continue; const a = (i / 14) * TAU; const x = Math.cos(a) * r, z = Math.sin(a) * r; const pts = [V3(x, -s * 0.5, z), V3(x, s * 0.2, z)]; for (let k = 1; k <= 8; k++) { const b = (k / 8) * (Math.PI / 2); pts.push(V3(x * Math.cos(b), s * 0.2 + Math.sin(b) * r * 0.9, z * Math.cos(b))); } add(pts); }
    for (const y of [-0.5, -0.15, 0.2]) add(F.circle(r, 40).map((p) => V3(p.x, y * s, p.y)), true);
    add([V3(0, s * 0.2 + r * 0.9, 0), V3(0, s * 0.2 + r * 1.25, 0)]);
    add(F.circle(r * 0.12, 16).map((p) => V3(p.x, s * 0.2 + r * 1.37 + p.y, 0)), true);
    const door = add([V3(0, -s * 0.5, 0), V3(r * 0.5, -s * 0.5, 0), V3(r * 0.5, -s * 0.05, 0), V3(0, -s * 0.05, 0)], true);
    door.position.set(Math.cos((3 / 14) * TAU) * r, 0, Math.sin((3 / 14) * TAU) * r); door.rotation.y = -1.9;
    // flock
    const n = 36, rr = mulberry32(8);
    const bird = new Float32Array(n * 3 * 4), wing = new Float32Array(n * 3), pos = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) { const b = [A.size(0.16) + rr() * A.size(A.phone ? 0.3 : 0.6), rr() * TAU, rr() * A.size(0.46) - A.size(0.06), 0.18 + rr() * 0.16]; for (let v = 0; v < 3; v++) { bird.set(b, (i * 3 + v) * 4); wing[i * 3 + v] = v - 1; } }
    const g = ctx.keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aBird', new THREE.BufferAttribute(bird, 4));
    g.setAttribute('aWing', new THREE.BufferAttribute(wing, 1));
    const idx = []; for (let i = 0; i < n; i++) idx.push(i * 3, i * 3 + 1, i * 3 + 1, i * 3 + 2);
    g.setIndex(idx);
    const bu = { uPhase: { value: 0 }, uOrigin: { value: V3(lerp(A.x, c.x, A.phone ? 0.3 : 0.7), c.y - A.size(0.1), c.z + 1.5) }, uSize: { value: A.size(0.017) } };
    const bm = new THREE.ShaderMaterial({ vertexShader: BIRD_VERT, fragmentShader: 'void main(){ gl_FragColor = vec4(0.86,0.83,0.76,1.0); }', uniforms: bu, depthWrite: false });
    ctx.disposables.push(bm);
    const flock = new THREE.LineSegments(g, bm); flock.frustumCulled = false; F.group.add(flock);
    const feathers = F.particles(70, { mode: 1, box: [A.size(1.3), A.size(0.9), 6], origin: V3(A.x, 0, A.z + 1), size: 16, alpha: 0.4, soft: 0.2, prism: 0.02 });
    F.light(V3(c.x, c.y, c.z - 1.2), 0.7, A.size(2));
    return (dt, t, live) => { bu.uPhase.value += dt * (1 + live * 0.8); feathers.u.uPhase.value += dt * 0.5 * (1 + live); cage.rotation.y = Math.sin(t * 0.21) * 0.35; cage.position.y = c.y + Math.sin(t * 0.5) * s * 0.03; };
  },

  // 3 — speech bubbles whose typing dots never resolve
  chat(F, ctx) {
    const { THREE, V3 } = ctx, A = F.A;
    const spots = A.phone ? [[0.2, 0.34, 0.11, 0], [0.74, 0.43, 0.13, 1], [0.3, 0.55, 0.1, 1], [0.82, 0.3, 0.08, 0]]
      : [[0.1, 0.3, 0.13, 0], [0.9, 0.36, 0.15, 1], [0.08, 0.62, 0.11, 1], [0.91, 0.66, 0.1, 0], [0.16, 0.86, 0.08, 0], [0.8, 0.12, 0.07, 1]];
    const lm = F.lineMat(F.accent, 0.8), grey = F.lineMat([0.5, 0.5, 0.5], 0.7), dm = F.basic([0.92, 0.9, 0.84], 0.9);
    const bubbles = spots.map(([sx, sy, sf, mine], i) => {
      const g = new THREE.Group(); const dz = 0.5 + (i % 3) * 1.6;
      g.position.copy(A.at(sx, sy, dz)); F.group.add(g);
      const hh = A.size(sf, dz), ww = hh * 1.9, rad = hh * 0.36, pts = [];
      const corner = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push(V3(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0)); } };
      corner(ww / 2 - rad, hh / 2 - rad, 0); corner(-ww / 2 + rad, hh / 2 - rad, Math.PI / 2); corner(-ww / 2 + rad, -hh / 2 + rad, Math.PI);
      const tx = mine ? ww * 0.28 : -ww * 0.28; // tail
      pts.push(V3(tx - hh * 0.1, -hh / 2, 0), V3(tx + (mine ? 1 : -1) * hh * 0.16, -hh * 0.82, 0), V3(tx + hh * 0.14, -hh / 2, 0));
      corner(ww / 2 - rad, -hh / 2 + rad, -Math.PI / 2);
      g.add(F.line(pts, lm, true));
      const dots = [-1, 0, 1].map((k) => F.mesh(new THREE.CircleGeometry(hh * 0.075, 14), dm, -k * hh * 0.34, 0, 0, g));
      dots.forEach((d) => { d.rotation.y = Math.PI; });
      if (mine) { for (const o of [0, hh * 0.13]) g.add(F.line([V3(-ww / 2 - hh * 0.1 - o, -hh * 0.72, 0), V3(-ww / 2 - hh * 0.18 - o, -hh * 0.82, 0), V3(-ww / 2 - hh * 0.36 - o, -hh * 0.6, 0)], grey)); }
      return { g, dots, base: g.position.clone(), ph: i * 1.7, hh };
    });
    const dust = F.particles(90, { mode: 0, box: [A.size(1.6) * A.aspect, A.size(1), 7], origin: V3(A.x, 0, A.z + 1), size: 9, alpha: 0.32, speed: 0.04 });
    F.light(V3(A.x, A.y1 + 0.5, A.z - 1), 0.7, A.size(2.2));
    return (dt, t, live) => {
      dust.u.uPhase.value += dt * dust.speed * 4 * (1 + live);
      bubbles.forEach((b) => {
        b.g.position.y = b.base.y + Math.sin(t * 0.4 + b.ph) * b.hh * 0.12;
        const cyc = (t * (0.9 + live * 0.5) + b.ph) % 7; // types, hesitates, deletes, starts again
        b.dots.forEach((d, k) => { const on = cyc < 4.6 ? 1 : cyc < 5.4 ? 0 : clamp((cyc - 5.4 - k * 0.25) * 3); const hop = Math.max(0, Math.sin(t * 5 - k * 0.9 + b.ph)); d.position.y = hop * b.hh * 0.11 * on; d.scale.setScalar(0.001 + on * (0.8 + 0.25 * hop)); });
      });
    };
  },

  // 4 — one red thread crossing the whole void
  thread(F, ctx) {
    const { THREE, V3 } = ctx, A = F.A;
    const n = 90, dz = 1.2;
    const L = A.at(-0.25, 0.5, dz), Rr = A.at(1.25, 0.5, dz);
    const yMid = A.phone ? A.at(0.5, 0.47, dz).y : A.y + A.h * 0.08, thick = A.size(A.phone ? 0.0034 : 0.0045, dz);
    const pos = new Float32Array(n * 2 * 3), idx = [];
    for (let i = 0; i < n - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = ctx.keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = F.basic([F.accent[0] * 1.15, F.accent[1] * 0.85, F.accent[2] * 0.8], 1, { side: THREE.DoubleSide, blending: THREE.NormalBlending, transparent: false, depthWrite: true });
    const ribbon = new THREE.Mesh(g, m); ribbon.frustumCulled = false; F.group.add(ribbon);
    const ends = [0.07, 0.93].map((sx) => { const p = A.at(sx, 0.5, dz); const h = F.mesh(new THREE.PlaneGeometry(1, 1), ctx.glowMat(HALO_FRAG, { uTint: { value: V3(1.0, 0.78, 0.6) }, uAlpha: { value: 0.8 }, uStripes: { value: 0 } }), p.x, yMid, dz + A.z - 0.02); h.scale.setScalar(A.size(0.16, dz)); return { h, x: p.x }; });
    const embers = F.particles(80, { mode: 0, box: [A.size(1.7) * A.aspect, A.size(0.9), 6], origin: V3(A.x, 0, A.z + 1), size: 9, alpha: 0.5, speed: 0.07, tint: [1.0, 0.55, 0.4], prism: 0 });
    F.light(V3(A.x, yMid, A.z - 0.5), 0.75, A.size(2.2));
    const yAt = (x, t, live) => { const k = (x - L.x) / (Rr.x - L.x); return yMid - Math.sin(k * Math.PI) * A.size(0.07) + Math.sin(k * 14 + t * (0.6 + live * 0.8)) * A.size(0.006 + 0.008 * live) + Math.sin(k * 5 - t * 0.31) * A.size(0.012); };
    return (dt, t, live) => {
      for (let i = 0; i < n; i++) { const x = lerp(L.x, Rr.x, i / (n - 1)); const y = yAt(x, t, live); pos.set([x, y - thick, A.z + dz, x, y + thick, A.z + dz], i * 6); }
      g.attributes.position.needsUpdate = true;
      ends.forEach((e, i) => { e.h.position.y = yAt(e.x, t, live); e.h.material.uniforms.uAlpha.value = 0.55 + 0.25 * Math.sin(t * 1.3 + i * 2) + 0.2 * live; });
      embers.u.uPhase.value += dt * embers.speed * 4 * (1 + live);
    };
  },

  // 5 — a giant mate with steam, and a slow globe of latitude/longitude rings far behind
  mate(F, ctx) {
    const { THREE, V3, ink } = ctx, A = F.A;
    const dz = 1.2, s = A.size(A.phone ? 0.24 : 0.4, dz);
    const p = A.phone ? A.at(0.5, 0.47, dz) : A.at(0.79, 0.62, dz);
    const g = new THREE.Group(); g.position.set(p.x, Math.max(p.y - s * 0.5, 0.35), p.z); g.rotation.z = -0.1; F.group.add(g);
    const prof = [[0.0, 0], [0.2, 0.01], [0.33, 0.1], [0.4, 0.26], [0.41, 0.42], [0.36, 0.58], [0.28, 0.7], [0.25, 0.78], [0.27, 0.84]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
    F.mesh(new THREE.LatheGeometry(prof, 40), ink({ base: '#3a2c1c', engrave: 0.8, freq: 22, axis: 1, rim: 1.3, wobble: 0.3, side: THREE.DoubleSide }), 0, 0, 0, g);
    F.mesh(new THREE.TorusGeometry(0.27 * s, 0.022 * s, 8, 40).rotateX(Math.PI / 2), ink({ base: '#8f8a7c', engrave: 0.9, freq: 30, axis: 0, rim: 1.2 }), 0, 0.84 * s, 0, g);
    F.mesh(new THREE.CircleGeometry(0.25 * s, 32).rotateX(-Math.PI / 2), ink({ base: '#3a3d24', engrave: 0.5, freq: 14, axis: 0, rim: 0.2 }), 0, 0.8 * s, 0, g);
    const straw = F.mesh(new THREE.CylinderGeometry(0.014 * s, 0.014 * s, 0.9 * s, 10), ink({ base: '#a09a8a', engrave: 0.9, freq: 40, axis: 1, rim: 1.4 }), 0.12 * s, 1.1 * s, 0, g);
    straw.rotation.z = -0.38;
    const steam = F.particles(70, { mode: 0, box: [s * 0.45, s * 1.5, s * 0.4], origin: V3(g.position.x, g.position.y + 0.82 * s, g.position.z), size: 30, alpha: 0.16, soft: 1, speed: 0.12, tint: [0.9, 0.9, 0.86], prism: 0 });
    // globe
    const globe = new THREE.Group(); const gr = A.size(0.34, 9);
    globe.position.copy(A.at(A.phone ? 0.22 : 0.3, A.phone ? 0.3 : 0.26, 9)); F.group.add(globe);
    const gm = F.lineMat(F.accent, 0.3);
    for (let i = 1; i < 6; i++) { const lat = -Math.PI / 2 + (i / 6) * Math.PI; globe.add(F.line(F.circle(Math.cos(lat) * gr, 48).map((q) => V3(q.x, Math.sin(lat) * gr, q.y)), gm, true)); }
    for (let i = 0; i < 6; i++) { const l = F.line(F.circle(gr, 48), gm, true); l.rotation.y = (i / 6) * Math.PI; globe.add(l); }
    globe.rotation.z = 0.41;
    F.light(V3(g.position.x - s * 0.9, g.position.y + s * 0.9, g.position.z - 1.4), 1.0, A.size(1.6));
    return (dt, t, live) => { steam.u.uPhase.value += dt * steam.speed * 4 * (1 + live * 0.6); globe.rotation.y += dt * 0.08 * (1 + live); g.rotation.z = -0.1 + Math.sin(t * 0.4) * 0.02; };
  },

  // 6 — "you are here": a giant map pin standing on its point, contour rings on the water
  pin(F, ctx) {
    const { THREE, V3, ink, ripple } = ctx, A = F.A;
    const dz = 1.5, s = A.size(A.phone ? 0.3 : 0.5, dz);
    const p = A.phone ? A.at(0.5, 0.5, dz) : A.at(0.8, 0.6, dz);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); F.group.add(g);
    const prof = []; for (let i = 0; i <= 26; i++) { const k = i / 26; const y = k * s; const r = k < 0.62 ? Math.pow(k / 0.62, 0.8) * 0.3 * s : Math.sqrt(Math.max(0, 1 - Math.pow((k - 0.62) / 0.38, 2))) * 0.3 * s; prof.push(new THREE.Vector2(r, y)); }
    F.mesh(new THREE.LatheGeometry(prof, 44), ink({ base: '#4a3520', engrave: 0.85, freq: 26, axis: 1, rim: 1.3, wobble: 0.1 }), 0, 0, 0, g);
    const hole = F.mesh(new THREE.TorusGeometry(0.11 * s, 0.018 * s, 8, 32), F.basic([0.95, 0.9, 0.78], 0.95), 0, 0.66 * s, -0.3 * s, g);
    F.text('ESTÁS ACÁ', 900, 130, FONT_CAPS, 0.3, A.size(0.03, dz), V3(p.x, s * 1.09, p.z), 0.9);
    const lm = F.lineMat(F.accent, 0.45), rr = mulberry32(6), rings = [];
    for (let i = 1; i <= 7; i++) { const base = s * (0.3 + i * 0.32); const wob = Array.from({ length: 72 }, (_, k) => 1 + 0.06 * Math.sin(k * 0.35 + i) + 0.03 * (rr() - 0.5)); const l = F.line(wob.map((w, k) => V3(Math.cos((k / 72) * TAU) * base * w, 0.012, Math.sin((k / 72) * TAU) * base * w * 0.9)), lm, true); l.position.set(p.x, 0, p.z); rings.push(l); }
    const grid = F.lineMat([0.8, 0.78, 0.7], 0.1);
    for (let i = -5; i <= 5; i++) { F.line([V3(p.x + i * s * 0.55, 0.01, p.z - s * 3), V3(p.x + i * s * 0.55, 0.01, p.z + s * 3)], grid); F.line([V3(p.x - s * 3, 0.01, p.z + i * s * 0.55), V3(p.x + s * 3, 0.01, p.z + i * s * 0.55)], grid); }
    F.light(V3(p.x - s * 0.5, s * 0.9, p.z - 1.5), 1.0, A.size(1.8));
    return (dt, t, live, every) => { g.position.y = Math.abs(Math.sin(t * (0.9 + live * 0.6))) * s * 0.035; hole.material.opacity = 0.75 + 0.2 * Math.sin(t * 2); rings.forEach((l, i) => { l.material.opacity = 0.3 + 0.2 * Math.sin(t * 0.8 - i * 0.7); }); every(lerp(4, 2, live), () => ripple(p.x, p.z, 0.4)); };
  },

  // 7 — a tall glass, ice floating in the void, fizz rising from the water
  glass(F, ctx) {
    const { THREE, V3, ink } = ctx, A = F.A;
    const dz = 1.2, s = A.size(A.phone ? 0.28 : 0.48, dz);
    const p = A.phone ? A.at(0.5, 0.5, dz) : A.at(0.2, 0.66, dz);
    const g = new THREE.Group(); g.position.set(p.x, Math.max(0.3, p.y - s * 0.5), p.z); F.group.add(g);
    const prof = [[0.0, 0], [0.26, 0], [0.29, 0.03], [0.33, 1.0]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
    F.mesh(new THREE.LatheGeometry(prof, 40), ink({ base: '#14141a', engrave: 0.45, freq: 14, axis: 0, rim: 2.2, side: THREE.DoubleSide, wobble: 0.02 }), 0, 0, 0, g);
    F.mesh(new THREE.CylinderGeometry(0.31 * s, 0.265 * s, 0.7 * s, 36), ink({ base: '#3b2317', engrave: 0.3, freq: 5, axis: 1, rim: 0.7 }), 0, 0.37 * s, 0, g);
    F.mesh(new THREE.TorusGeometry(0.33 * s, 0.008 * s, 6, 48).rotateX(Math.PI / 2), F.basic([0.95, 0.92, 0.84], 0.9), 0, 1.0 * s, 0, g);
    const iceM = ink({ base: '#3d4046', engrave: 0.7, freq: 4, axis: 0, rim: 2.0 });
    const rr = mulberry32(12), cubes = [];
    for (let i = 0; i < 9; i++) { const inG = i < 2; const sz = s * (inG ? 0.2 : 0.1 + rr() * 0.12); const m = F.mesh(new THREE.BoxGeometry(sz, sz, sz), iceM, 0, 0, 0, inG ? g : F.group); const q = inG ? V3((i - 0.5) * 0.2 * s, 0.76 * s, 0) : A.at(0.08 + rr() * 0.84, (A.phone ? 0.31 : 0.15) + rr() * (A.phone ? 0.33 : 0.55), 0.5 + rr() * 5); m.position.copy(q); m.rotation.set(rr() * 3, rr() * 3, rr() * 3); cubes.push({ m, y: q.y, ph: rr() * 6, sp: 0.1 + rr() * 0.25, inG }); }
    const fizz = F.particles(150, { mode: 0, box: [A.size(1.5) * A.aspect, A.size(1.0), 7], origin: V3(A.x, 0, A.z + 1), size: 9, alpha: 0.55, speed: 0.3, tint: [0.95, 0.85, 0.7], prism: 0.02 });
    const inner = F.particles(50, { mode: 0, box: [s * 0.4, s * 0.72, s * 0.4], origin: V3(g.position.x, g.position.y + 0.02 * s, g.position.z - s * 0.34), size: 7, alpha: 0.7, speed: 0.4, tint: [1, 0.9, 0.75], prism: 0 });
    F.light(V3(g.position.x + s * 0.8, g.position.y + s * 0.9, g.position.z - 1.5), 1.0, A.size(1.8));
    return (dt, t, live) => { fizz.u.uPhase.value += dt * fizz.speed * (1 + live * 1.2); inner.u.uPhase.value += dt * inner.speed * (1 + live); cubes.forEach((c) => { c.m.rotation.x += dt * c.sp; c.m.rotation.y += dt * c.sp * 0.7; c.m.position.y = c.y + Math.sin(t * 0.5 + c.ph) * s * (c.inG ? 0.012 : 0.05); }); };
  },

  // 8 — the letters of the phrase orbit the player, never quite forming it
  letters(F, ctx) {
    const { V3 } = ctx, A = F.A;
    const chars = [...F.track.title.toUpperCase()].filter((c) => c.trim());
    const hh = A.size(A.phone ? 0.05 : 0.075);
    const rx = A.phone ? A.size(0.19) : A.w * 0.5 + A.size(0.1), ry = A.phone ? A.size(0.14) : A.h * 0.5 + A.size(0.06);
    const cy = A.phone ? A.at(0.5, 0.47).y : A.y - A.size(0.03);
    const cx = A.x;
    const items = chars.map((ch, i) => ({ t: F.text(ch, 128, 128, (px) => FONT_DISPLAY(px * 1.25, '', 500), 0, hh, V3(), 0.9), a: (i / chars.length) * TAU, k: i }));
    const sparks = F.particles(160, { mode: 2, radius: rx * 1.15, box: [0, A.size(0.7), 0], origin: V3(cx, cy, A.z + 0.8), size: 11, alpha: 0.6, speed: 0.5, prism: 0.3 });
    F.light(V3(A.x, cy + 0.5, A.z - 1), 0.75, A.size(2.2));
    let ang = 0;
    return (dt, t, live) => {
      ang += dt * (0.1 + 0.12 * live);
      sparks.u.uPhase.value += dt * sparks.speed * (1 + live);
      for (const it of items) { const a = it.a + ang + Math.sin(t * 0.3 + it.k) * 0.12; const sq = Math.pow(Math.abs(Math.cos(a)), 0.6) * Math.sign(Math.cos(a)), sq2 = Math.pow(Math.abs(Math.sin(a)), 0.6) * Math.sign(Math.sin(a)); it.t.mesh.position.set(cx + sq * rx * (1 + 0.04 * Math.sin(t * 0.5 + it.k)), cy + sq2 * ry + Math.sin(t * 0.6 + it.k * 2.1) * hh * 0.3, A.z + 0.5 + Math.sin(it.k * 1.7) * 0.8); it.t.mesh.rotation.z = Math.sin(t * 0.4 + it.k * 1.3) * 0.3; it.t.u.uAlpha.value = 0.55 + 0.4 * Math.sin(t * 0.7 + it.k * 0.9); }
    };
  },

  // 9 — an empty staff; now and then a single note falls and is swallowed by the water
  staff(F, ctx) {
    const { THREE, V3, ink, ripple } = ctx, A = F.A;
    const dz = 3, gap = A.size(0.035, dz), y0 = A.phone ? A.at(0.5, 0.47, dz).y : A.y1 + A.size(0.02, dz) - gap * 5.2;
    const lm = F.basic([0.86, 0.84, 0.78], 0.5), lines = [];
    const yBase = A.phone ? y0 : Math.max(A.y1 * 0.4, A.y - gap * 2);
    for (let i = 0; i < 5; i++) { const l = F.mesh(new THREE.PlaneGeometry(90, A.size(0.0028, dz)), lm, A.x, yBase + i * gap, A.z + dz); l.rotation.y = Math.PI; lines.push(l); }
    const noteG = new THREE.Group(); F.group.add(noteG);
    const nm = F.basic(F.accent, 0.95);
    const head = F.mesh(new THREE.CircleGeometry(gap * 0.52, 20), nm, 0, 0, 0, noteG); head.scale.set(1.25, 0.9, 1); head.rotation.set(0, Math.PI, 0.35);
    const stem = F.mesh(new THREE.PlaneGeometry(gap * 0.09, gap * 3.2), nm, -gap * 0.56, gap * 1.6, 0, noteG); stem.rotation.y = Math.PI;
    noteG.visible = false;
    // silent gramophone horn
    const hs = A.size(A.phone ? 0.2 : 0.3, 1), hp = A.phone ? A.at(0.24, 0.5, 1) : A.at(0.13, 0.7, 1);
    const horn = new THREE.Group(); horn.position.set(hp.x, 0, hp.z); F.group.add(horn);
    const prof = []; for (let i = 0; i <= 18; i++) { const k = i / 18; prof.push(new THREE.Vector2((0.03 + Math.pow(k, 2.4) * 0.42) * hs, k * hs * 0.8)); }
    const bell = F.mesh(new THREE.LatheGeometry(prof, 36), ink({ base: '#33302a', engrave: 0.85, freq: 18, axis: 0, rim: 1.5, side: THREE.DoubleSide, wobble: 0.05 }), 0, hs * 0.42, 0, horn);
    bell.rotation.set(0.5, 0, 0.75);
    F.mesh(new THREE.BoxGeometry(hs * 0.5, hs * 0.16, hs * 0.5), ink({ base: '#231d15', engrave: 0.6, freq: 8, axis: 1, rim: 1.0 }), 0, hs * 0.08, 0, horn);
    F.mesh(new THREE.CylinderGeometry(hs * 0.2, hs * 0.2, hs * 0.02, 28), ink({ base: '#0f0f12', engrave: 0.9, freq: 14, axis: 0, rim: 1.2 }), 0, hs * 0.17, 0, horn);
    const dust = F.particles(70, { mode: 1, box: [A.size(1.6) * A.aspect, A.size(1.0), 7], origin: V3(A.x, 0, A.z + 1), size: 8, alpha: 0.3, speed: 0.05 });
    F.light(V3(hp.x + hs, hs * 1.3, hp.z - 1.4), 0.9, A.size(1.9));
    let fall = -1, nx = 0, wait = 3;
    return (dt, t, live) => {
      dust.u.uPhase.value += dt * dust.speed * 4;
      lines.forEach((l, i) => { l.position.y = yBase + i * gap + Math.sin(t * 0.5 + i * 0.6) * gap * 0.03 * (1 + live * 2); });
      if (fall < 0) { wait -= dt * (1 + live); if (wait <= 0) { fall = 0; nx = A.at(0.12 + Math.random() * 0.76, 0.5, dz).x; noteG.visible = true; } }
      else {
        fall += dt;
        const y = yBase + gap * 6 - 0.5 * 2.2 * fall * fall;
        noteG.position.set(nx, y, A.z + dz - 0.05); noteG.rotation.z = fall * 0.7;
        if (y <= 0) { fall = -1; wait = 4 + Math.random() * 4; noteG.visible = false; ripple(nx, A.z + dz, 0.6); }
      }
    };
  },
};
