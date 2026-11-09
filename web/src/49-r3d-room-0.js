// ═══════════════════════════════════════════════════════════════════════════════════════════
// ROOMS, 3D  (a record floor drawn as a walkable set: its cover, as white chalk lines on black)
//   The framework: ribbon lines (a line with a real width on screen, drawn as quads in the vertex shader), point sprites
//   (sparkle, dots, glyphs, steam), and the registry ROOM_SETS[trackId] that builds one set. A set returns
//   { root, update(dt, t), pose(view, a, free), solids(), info(), anchors in ctx.anchors }.
//   Rooms are built when their floor is, and disposed completely when it is left (see destroy()).
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** What the controller (59-room-0.js) animates and the set reads every frame. */
Object.assign(world, { room: { shut: 0, mode: 'code', spokes: [0, 0, 0, 0, 0, 0, 0, 0], clock: [0, 3, 4, 7], cup: 0, through: 0, mono: 0, page: 0, flash: 0, key: '' } });

const RIBBON_VERT = /* glsl */`
attribute vec3 aOther; attribute vec4 aInfo; attribute float aSeed;
uniform vec2 uRes; uniform float uPx; uniform float uWidth;
varying float vAcross; varying float vAlpha; varying float vSeed;
void main(){
  vec4 pa = modelViewMatrix * vec4(position, 1.0);
  vec4 pb = modelViewMatrix * vec4(aOther, 1.0);
  float near = 0.06;
  if (pa.z > -near && pb.z > -near) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec4 a = pa, b = pb;
  if (a.z > -near) a = mix(a, pb, (-near - a.z) / (pb.z - a.z));
  if (b.z > -near) b = mix(b, pa, (-near - b.z) / (pa.z - b.z));
  vec4 ca = projectionMatrix * a, cb = projectionMatrix * b;
  vec2 d = (ca.xy / ca.w - cb.xy / cb.w) * uRes;
  float len = length(d);
  d = len > 1e-4 ? d / len : vec2(1.0, 0.0);
  vec2 n = vec2(-d.y, d.x);
  float wpx = aInfo.z * uPx * uWidth;
  vec2 off = (d + n * aInfo.x) * wpx / uRes;
  gl_Position = vec4(ca.xy + off * ca.w, ca.zw);
  vAcross = aInfo.x; vAlpha = aInfo.w; vSeed = aSeed;
}`;
const RIBBON_FRAG = /* glsl */`
uniform vec3 uTint; uniform float uAlpha;
varying float vAcross; varying float vAlpha; varying float vSeed;
void main(){
  float core = smoothstep(0.0, 0.6, 1.0 - abs(vAcross));
  float chalk = 0.76 + 0.24 * fract(sin(vSeed * 91.7) * 437.5);
  gl_FragColor = vec4(uTint * core * chalk * vAlpha * uAlpha, 1.0);
}`;
const SPRITE_VERT = /* glsl */`
attribute vec4 aData; // size (m), alpha, seed, kind
uniform float uTime; uniform float uK; uniform float uMode; uniform float uTwinkle; uniform vec3 uRise; uniform float uSpeed; uniform float uSpread;
uniform vec3 uP0; uniform vec3 uP1; uniform vec3 uP2; uniform vec3 uP3; uniform float uAlpha;
varying float vA; varying float vKind; varying float vSeed;
vec3 bez(float t){ float u = 1.0 - t; return u*u*u*uP0 + 3.0*u*u*t*uP1 + 3.0*u*t*t*uP2 + t*t*t*uP3; }
void main(){
  vec3 p = position; float a = aData.y; float sz = aData.x;
  if (uMode > 1.5) { // a stream along a curve: data falling from the antenna into the cone
    float t = fract(uTime * uSpeed + aData.z);
    p = bez(t) + vec3(sin(aData.z * 91.0), sin(aData.z * 57.0), cos(aData.z * 73.0)) * uSpread * (0.35 + t);
    a *= sin(t * 3.14159);
  } else if (uMode > 0.5) { // steam rising and widening
    float t = fract(uTime * uSpeed + aData.z);
    p += uRise * t + vec3(sin(t * 6.0 + aData.z * 40.0), 0.0, cos(t * 5.0 + aData.z * 30.0)) * uSpread * t;
    a *= sin(t * 3.14159); sz *= 0.6 + t * 1.3;
  } else { a *= (1.0 - uTwinkle) + uTwinkle * (0.5 + 0.5 * sin(uTime * (2.0 + aData.z * 5.0) + aData.z * 60.0)); }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = a * uAlpha; vKind = aData.w; vSeed = aData.z;
  gl_PointSize = clamp(sz * uK / max(0.05, -mv.z), 1.0, 96.0);
  gl_Position = projectionMatrix * mv;
}`;
const SPRITE_FRAG = /* glsl */`
uniform vec3 uTint; uniform float uShape; uniform sampler2D uAtlas;
varying float vA; varying float vKind; varying float vSeed;
void main(){
  vec2 c = gl_PointCoord - 0.5; float r = length(c) * 2.0; float a;
  if (uShape < 0.5) a = smoothstep(1.0, 0.4, r);
  else if (uShape < 1.5) a = texture2D(uAtlas, vec2((gl_PointCoord.x + floor(vKind + 0.5)) * 0.5, 1.0 - gl_PointCoord.y)).r;
  else if (uShape < 2.5) a = smoothstep(0.2, 0.0, abs(r - 0.8));
  else a = max(0.0, 1.0 - min(abs(c.x), abs(c.y)) * 16.0) * (1.0 - r) + smoothstep(1.0, 0.2, r) * 0.55;
  gl_FragColor = vec4(uTint * a * vA, 1.0);
}`;

/** Collects segments (a, b: [x, y, z]; w: width in CSS px; al: 0..1) and builds one geometry of quads. */
function makeRibbons(seed = 5) {
  const rnd = mulberry32(seed);
  const P = [], O = [], I = [], S = [], X = [];
  let n = 0;
  const api = {
    rnd,
    get count() { return n; },
    seg(a, b, w = 2, al = 1) {
      if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) return api;
      const sd = rnd();
      for (let k = 0; k < 4; k++) {
        const end = k >> 1, side = k & 1 ? 1 : -1, p = end ? b : a, o = end ? a : b;
        P.push(p[0], p[1], p[2]); O.push(o[0], o[1], o[2]); I.push(side, end, w, al); S.push(sd);
      }
      const q = n * 4; X.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
      n++;
      return api;
    },
    poly(pts, w = 2, al = 1, closed = false) {
      for (let i = 0; i < pts.length - 1; i++) api.seg(pts[i], pts[i + 1], w, al);
      if (closed && pts.length > 2) api.seg(pts[pts.length - 1], pts[0], w, al);
      return api;
    },
    build() {
      const g = new THREE_REF.BufferGeometry();
      g.setAttribute('position', new THREE_REF.Float32BufferAttribute(P, 3));
      g.setAttribute('aOther', new THREE_REF.Float32BufferAttribute(O, 3));
      g.setAttribute('aInfo', new THREE_REF.Float32BufferAttribute(I, 4));
      g.setAttribute('aSeed', new THREE_REF.Float32BufferAttribute(S, 1));
      g.setIndex(X);
      return g;
    },
  };
  return api;
}
let THREE_REF = null; // three.js, set once the renderer exists (the shader helpers above need its classes)

/** Small geometry helpers for sets (points are [x, y, z]; everything in the set's own metres). */
const RG = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  box(R, x0, y0, z0, x1, y1, z1, w, al) {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) R.seg(c[i], c[j], w, al);
  },
  /** An ellipse in the plane spanned by unit vectors u and v (arrays), from angle a0 to a1. */
  arc(c, u, v, ru, rv, n = 32, a0 = 0, a1 = TAU) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n, cs = Math.cos(a) * ru, sn = Math.sin(a) * rv; pts.push([c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn]); }
    return pts;
  },
  /** A point of an ellipsoid: th around the vertical axis (0 = front, +z), ph the elevation (0 equator … π/2 top). */
  ell(c, rx, ry, rz, th, ph) { return [c[0] + rx * Math.cos(ph) * Math.sin(th), c[1] + ry * Math.sin(ph), c[2] + rz * Math.cos(ph) * Math.cos(th)]; },
  /** A wavy path over the dome of a brain: meridians and parallels wobbling like folds. */
  folds(R, c, rx, ry, rz, count, seed, w = 1.5, al = 0.9, steps = 26) {
    const r = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const th0 = (r() - 0.5) * TAU, ph0 = 0.08 + r() * 1.3, along = r() < 0.5;
      const dth = along ? (r() - 0.5) * 0.9 : (r() < 0.5 ? 1 : -1) * (0.7 + r() * 1.1), dph = along ? (0.35 + r() * 0.8) * (r() < 0.5 ? 1 : -1) : (r() - 0.5) * 0.3;
      const f1 = 7 + r() * 8, f2 = 6 + r() * 8, p1 = r() * TAU, p2 = r() * TAU, a1 = 0.05 + r() * 0.07, a2 = 0.08 + r() * 0.1;
      const pts = [];
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, th = th0 + dth * u + a2 * Math.sin(f2 * u + p2), ph = clamp(ph0 + dph * u + a1 * Math.sin(f1 * u + p1), 0.02, 1.52);
        pts.push(RG.ell(c, rx * 1.01, ry * 1.01, rz * 1.01, th, ph));
      }
      R.poly(pts, w, al);
    }
  },
};

/** One kit per renderer: the shared uniforms and the factories sets use. */
function makeRoomKit(ctx, RU) {
  const { THREE, V3, canvasTex, disposables } = ctx;
  const kit = {
    RU,
    ribbons: makeRibbons,
    /** A group of ribbons (one draw call, plus an unreflected soft halo when `glow`). */
    lines(rib, o = {}) {
      const geo = ctx.keep(rib.build());
      const tint = o.tint || [1.08, 1.05, 0.97];
      const mk = (wk, ak) => {
        const m = new THREE.ShaderMaterial({ vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uRes: RU.uRes, uPx: RU.uPx, uTint: { value: V3(...tint) }, uAlpha: { value: ak }, uWidth: { value: wk } } });
        disposables.push(m);
        return m;
      };
      const obj = new THREE.Group(), core = new THREE.Mesh(geo, mk(1, 1)), halo = o.glow ? new THREE.Mesh(geo, mk(3.4, 0.14)) : null;
      core.frustumCulled = false; obj.add(core);
      if (halo) { halo.frustumCulled = false; halo.layers.set(1); obj.add(halo); } // the halo is not reflected: cheaper, and cleaner on the water
      const L = { obj, core, halo, a: 1, set(a) { L.a = a; core.material.uniforms.uAlpha.value = a; if (halo) halo.material.uniforms.uAlpha.value = a * 0.14; }, count: rib.count };
      return L;
    },
    /** Point sprites. data: [x, y, z, size, alpha, seed, kind] per point. shape: 0 disc, 1 glyph (atlas), 2 ring, 3 sparkle. */
    points(rows, o = {}) {
      const n = rows.length, pos = new Float32Array(n * 3), dat = new Float32Array(n * 4);
      rows.forEach((r, i) => { pos.set(r.slice(0, 3), i * 3); dat.set([r[3], r[4] ?? 1, r[5] ?? i * 0.6180339 % 1, r[6] ?? 0], i * 4); });
      const g = ctx.keep(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aData', new THREE.BufferAttribute(dat, 4));
      const u = { uTime: RU.uTime, uK: RU.uK, uMode: { value: o.mode || 0 }, uTwinkle: { value: o.twinkle ?? 0 }, uRise: { value: V3(...(o.rise || [0, 0.4, 0])) }, uSpeed: { value: o.speed ?? 0.2 }, uSpread: { value: o.spread ?? 0.1 },
        uP0: { value: V3(...(o.curve ? o.curve[0] : [0, 0, 0])) }, uP1: { value: V3(...(o.curve ? o.curve[1] : [0, 0, 0])) }, uP2: { value: V3(...(o.curve ? o.curve[2] : [0, 0, 0])) }, uP3: { value: V3(...(o.curve ? o.curve[3] : [0, 0, 0])) },
        uAlpha: { value: o.alpha ?? 1 }, uTint: { value: V3(...(o.tint || [0.93, 0.9, 0.82])) }, uShape: { value: o.shape || 0 }, uAtlas: { value: o.atlas || kit.atlas() } };
      const m = new THREE.ShaderMaterial({ vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      disposables.push(m);
      const obj = new THREE.Points(g, m);
      obj.frustumCulled = false; obj.layers.set(1); // not reflected by the water
      return { obj, u, geo: g, pos, dat, set(a) { u.uAlpha.value = a; } };
    },
    /** The glyphs "0" and "1" (left and right halves) for the falling data. */
    atlas() {
      if (kit._atlas) return kit._atlas;
      kit._atlas = canvasTex(128, 64, (c, w, hh) => {
        c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 50px "Courier Prime","Courier New",monospace';
        c.fillText('0', 32, 34); c.fillText('1', 96, 34);
      });
      return kit._atlas;
    },
    /** A plane showing a canvas (additive: black is nothing), with an alpha uniform. */
    plane(tex, w, hh, o = {}) {
      const u = { uTex: { value: tex }, uAlpha: { value: o.alpha ?? 1 }, uReveal: { value: 1 }, uTint: { value: V3(...(o.tint || [0.95, 0.92, 0.84])) } };
      const m = ctx.glowMat(TEXT_FRAG, u, { side: o.side });
      const mesh = new THREE.Mesh(ctx.planeGeo(w, hh), m);
      return { mesh, u, set(a) { u.uAlpha.value = a; } };
    },
  };
  return kit;
}

/** The registry: ROOM_SETS[trackId] = (ctx, kit, track) => set (see 49-r3d-room-1-en-una.js). */
const ROOM_SETS = {};

function buildRoom3D(ctx) {
  const { THREE, scene, anchors, disposables, LU } = ctx;
  THREE_REF = THREE;
  let cur = null;
  const RU = { uRes: { value: new THREE.Vector2(1, 1) }, uPx: { value: 1 }, uTime: { value: 0 }, uK: { value: 600 } };
  const kit = makeRoomKit(ctx, RU);

  function build(track) {
    const marks = { d: disposables.length, g: ctx.geos.length };
    const set = ROOM_SETS[track.id](ctx, kit, track);
    scene.add(set.root);
    set.marks = marks;
    return set;
  }
  function destroy() {
    for (const k of Object.keys(anchors)) if (k.startsWith('rm-')) delete anchors[k];
    if (!cur) return;
    scene.remove(cur.root);
    for (const o of cur.extra || []) scene.remove(o);
    for (let i = cur.marks.d; i < disposables.length; i++) disposables[i].dispose && disposables[i].dispose();
    disposables.length = cur.marks.d;
    for (let i = cur.marks.g; i < ctx.geos.length; i++) ctx.geos[i].dispose();
    ctx.geos.length = cur.marks.g;
    cur = null;
  }
  ctx.updaters.push((dt, t) => {
    if (!cur) return;
    RU.uRes.value.set(Math.max(1, ctx.W * ctx.dpr), Math.max(1, ctx.H * ctx.dpr));
    RU.uPx.value = ctx.dpr;
    RU.uK.value = (ctx.H * ctx.dpr) / (2 * Math.tan((ctx.camera.fov * Math.PI) / 360));
    cur.update(dt, t);
  });
  return {
    set(track) { destroy(); if (track && ROOM_SETS[track.id]) cur = build(track); },
    built: () => !!cur,
    solids: () => (cur ? cur.solids() : []),
    pose: (view, a, free) => (cur ? cur.pose(view, a, free) : null),
    info: () => (cur ? cur.info() : null),
    /** For the checks: the largest on-screen error of the aligned dots against their intended layout (NDC units). */
    alignError: () => (cur && cur.alignError ? cur.alignError() : null),
    cur: () => cur,
  };
}
