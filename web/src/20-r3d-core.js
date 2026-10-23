// ═══════════════════════════════════════════════════════════════════════════════════════════
// VIEW MODEL EXTENSIONS  (camera pose, cabin, travel, floors)
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** Converts a {pos,target,fov} shot into a yaw/pitch pose (yaw 0 looks toward −Z). */
function poseFromShot(s) {
  const dx = s.target[0] - s.pos[0], dy = s.target[1] - s.pos[1], dz = s.target[2] - s.pos[2];
  return { x: s.pos[0], y: s.pos[1], z: s.pos[2], yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), fov: s.fov };
}
const aspectNow = () => window.innerWidth / Math.max(1, window.innerHeight);

Object.assign(Shots, {
  PANEL: [-0.92, 1.5, -0.26],
  STAND: [-0.25, 1.85, -1.62],
  /** Facing the button panel from inside the cabin. */
  panel(a) {
    if (a >= 1 && window.innerHeight < 520) { // a phone lying down: the selector, then the floor buttons, each filling the height
      const view = world.cabView || (world.platform ? 'rows' : 'top');
      const [y0, y1] = view === 'rows' ? [0.57, 1.27] : [0.06, 0.56];
      const fov = 50, d = (y1 - y0) / (0.94 * 2 * Math.tan((fov * Math.PI) / 360));
      const cy = 1.5 + CAB_LIFT + 0.66 - (y0 + y1) / 2;
      return { pos: [-0.92, cy + 0.02, -0.26 - d], target: [-0.92, cy, -0.26], fov };
    }
    if (a >= 1) return { pos: [-0.44, 1.62 + CAB_LIFT, -1.34], target: [-0.58, 1.5 + CAB_LIFT, -0.26], fov: 63 };
    const fov = 58, tv = 2 * Math.tan((fov * Math.PI) / 360);
    const visH = Math.max(0.58 / 0.88 / a, 1.3); // metres of plate height in view
    const d = Math.min(1.75, visH / tv);
    const cy = 1.5 + CAB_LIFT + Math.min(0, (d * tv) / 2 - 0.67); // short views sit on the bottom edge of the plate
    return { pos: [-0.92, cy + 0.06, -0.26 - d], target: [-0.92, cy, -0.26], fov };
  },
  /** Facing the doors from inside. */
  doors(a) {
    return a >= 1 ? { pos: [-0.25, 1.85 + CAB_LIFT, -1.7], target: [-0.1, 1.5 + CAB_LIFT, -0.25], fov: 56 } : { pos: [-0.1, 1.85 + CAB_LIFT, -1.9], target: [0, 1.45 + CAB_LIFT, -0.25], fov: 64 };
  },
  /** Standing just outside the cabin on a floor, looking away from the elevator (+Z). */
  floor(a) {
    const aim = world.floorAim ? world.floorAim(a) : null; // a world may turn its first view (the level, on phones)
    return { pos: [0, 1.6, 2.7], target: aim || [0, a >= 1 ? 2.35 : 2.9, 14], fov: a >= 1 ? 48 : 62 };
  },
});

Object.assign(world, {
  cam: poseFromShot(Shots.spawn(aspectNow())),
  bob: 0,            // walking head-bob amount 0..1
  inside: false,     // camera is inside the cabin
  env: 0,            // 0 = the void lobby, n = floor n
  playing: false,    // the official player reports "playing"
  platform: null,    // 'youtube' | 'spotify'
  floor: 0,          // floor where the cabin is
  visited: [],
  hover: null,       // hovered panel control id
  pressed: {},       // id -> 0..1 sink amount
  lit: {},           // id -> 0..1 light amount
  refuse: 0,         // selector pulse when a floor is pressed without platform
  bands: 0,          // travel light bands intensity
  bandPhase: 0,      // travel distance (floors) → band offset
  arrow: 0,          // -1 down, 0 off, 1 up
  hand: { reach: 0, press: 0, point: 0, lift: 0, target: null },
  cabinJolt: 0,
});

// ═══════════════════════════════════════════════════════════════════════════════════════════
// RENDERER 3D  (three.js r160 — Ink materials, mirror water, post pass)
// ═══════════════════════════════════════════════════════════════════════════════════════════
async function loadThree() {
  const urls = [
    'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js',
    'https://unpkg.com/three@0.160.0/build/three.module.min.js',
  ];
  let err;
  for (const u of urls) {
    try { return await withTimeout(import(u), 9000, 'three'); } catch (e) { err = e; }
  }
  throw err;
}

function createRenderer3D(THREE) {
  THREE.ColorManagement.enabled = false;
  const stage = $('#stage');
  const canvas = h('canvas', {});
  stage.append(canvas);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 1); // scene black = bare paper (the post pass adds the paper tone)
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const dprCap = coarse ? 1.25 : 1.5;
  let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  let mirrorDiv = 2;
  let W = 1, H = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.04, 240);
  camera.rotation.order = 'YXZ';
  camera.layers.enable(1); // layer 1 = not reflected by the water (hand, motes, particles)
  scene.add(camera);

  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const vecHex = (hex) => new THREE.Vector3(...hex3(hex));
  const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  black.needsUpdate = true;
  const disposables = [black];

  // ---- shared lighting uniforms (same objects referenced by every Ink material and the water) ----
  const LU = {
    uKeyDir: { value: V3(-0.35, 0.8, 0.5).normalize() },
    uKeyCol: { value: V3(0.9, 0.87, 0.8) },
    uAmbient: { value: V3(0.065, 0.065, 0.072) },
    uVoid: { value: V3(0, 0, 0) },
    uFog: { value: new THREE.Vector2(16, 62) },
    uTime: { value: 0 },
    uPPos: { value: [V3(0, 4.7, 0.9), V3(0, 2.62 + CAB_LIFT, -1.25), V3(0, 1.3 + CAB_LIFT, 1.3), V3(0, 3, 12)] },
    uPCol: { value: [V3(), V3(), V3(), V3()] },
    uPRange: { value: [6, 4.4, 3.3, 14] },
  };
  /** Interior surfaces ignore the exterior key light. */
  const LU_IN = { ...LU, uKeyCol: { value: V3(0, 0, 0) }, uAmbient: { value: V3(0.05, 0.047, 0.042) }, uFog: { value: new THREE.Vector2(200, 400) } };

  function ink(o = {}) {
    const m = new THREE.ShaderMaterial({
      vertexShader: INK_VERT, fragmentShader: INK_FRAG, side: o.side ?? THREE.FrontSide,
      extensions: { derivatives: true },
      uniforms: {
        ...(o.interior ? LU_IN : LU),
        uBase: { value: vecHex(o.base || '#1b1b20') },
        uLineColor: { value: vecHex(o.line || '#eceaea') },
        uEmissive: { value: V3(0, 0, 0) },
        uMap: { value: o.map || black },
        uMapStrength: { value: o.map ? (o.mapStrength ?? 1) : 0 },
        uGlow: { value: o.glow ?? 0 },
        uEngrave: { value: o.engrave ?? 0 },
        uEngraveFreq: { value: o.freq ?? 20 },
        uEngraveAxis: { value: o.axis ?? 0 },
        uWobble: { value: o.wobble ?? 0.12 },
        uRim: { value: o.rim ?? 0.6 },
        uHeightFade: { value: new THREE.Vector2(o.fade ? o.fade[0] : 1e4, o.fade ? o.fade[1] : 1e4 + 1) },
        uHasMap: { value: o.map ? 1 : 0 },
      },
    });
    disposables.push(m);
    return m;
  }
  function glowMat(frag, uniforms, o = {}) {
    const m = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT, fragmentShader: frag, uniforms, transparent: true, depthWrite: false,
      depthTest: o.depthTest ?? true, blending: THREE.AdditiveBlending, side: o.side ?? THREE.DoubleSide,
    });
    disposables.push(m);
    return m;
  }
  function canvasTex(w, hh, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = hh;
    const ctx = c.getContext('2d');
    draw(ctx, w, hh);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = maxAniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    disposables.push(t);
    return t;
  }
  const geos = [];
  const keep = (g) => { geos.push(g); return g; };
  const boxGeo = (w, hh, d) => keep(new THREE.BoxGeometry(w, hh, d));
  const planeGeo = (w, hh) => keep(new THREE.PlaneGeometry(w, hh));
  /** Maps one box face (0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z) to a texture sub-rectangle. */
  function faceUV(g, face, u0, v0, u1, v1) {
    const uv = g.attributes.uv, i = face * 4;
    uv.setXY(i, u0, v1); uv.setXY(i + 1, u1, v1); uv.setXY(i + 2, u0, v0); uv.setXY(i + 3, u1, v0);
    uv.needsUpdate = true;
  }
  function flatUV(g, u, v) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u, v); uv.needsUpdate = true; }
  const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || el).add(m); return m; };

  // ═════════════ elevator (exterior): the one drawn on the album cover ═════════════
  const el = new THREE.Group();
  el.position.y = CAB_LIFT; // the cabin floor (local y 0.25) sits on top of three steps
  scene.add(el);
  const shell = new THREE.Group(); // only seen from outside; hidden while the camera rides inside the (larger) cabin
  el.add(shell);
  const C = Tex.COVER;
  const texFront = canvasTex(1024, Math.round((1024 * C.h) / C.w), (c, w, hh) => Tex.coverFront(c, w, hh, PAL3D));
  const texLeafL = canvasTex(384, 1440, (c, w, hh) => Tex.coverLeaf(c, w, hh, PAL3D, false));
  const texLeafR = canvasTex(384, 1440, (c, w, hh) => Tex.coverLeaf(c, w, hh, PAL3D, true));
  const texCall = canvasTex(384, 666, (c, w, hh) => Tex.coverCall(c, w, hh, PAL3D));
  const texWall = canvasTex(768, 1400, (c, w, hh) => Tex.sketchBox(c, w, hh, PAL3D, 0.5, 21));
  const texRiser = canvasTex(1536, 162, (c, w, hh) => Tex.sketchBox(c, w, hh, PAL3D, 0.9, 22));
  const texTread = canvasTex(1536, 486, (c, w, hh) => Tex.sketchBox(c, w, hh, PAL3D, 0.35, 23));
  const texSquare = canvasTex(512, 512, (c, w, hh) => Tex.sketchBox(c, w, hh, PAL3D, 0.5, 24));
  const BODY = '#0c0b0b';
  const mFront = ink({ base: BODY, map: texFront, glow: 0.92, rim: 0.2 });
  const mTymp = ink({ base: BODY, map: texFront, glow: 0.92, rim: 0.2 });
  const mWall = ink({ base: BODY, map: texWall, glow: 0.8, rim: 0.9 });
  const mRoof = ink({ base: BODY, engrave: 0.5, freq: 9, axis: 0, rim: 1.6, wobble: 0.5 });
  const mRiser = ink({ base: BODY, map: texRiser, glow: 0.9, rim: 0.3 });
  const mTread = ink({ base: '#141211', map: texTread, glow: 0.85, rim: 0.3 });
  const mSq = ink({ base: BODY, map: texSquare, glow: 0.8, rim: 0.5 });
  const mBody = ink({ base: BODY, rim: 0.9 });
  /** UV rectangle of a local front-face rectangle inside the facade drawing. */
  const fuv = (xa, ya, xb, yb) => [(xa - C.x0) / C.w, (ya - C.y0) / C.h, (xb - C.x0) / C.w, (yb - C.y0) / C.h];
  const sh = (geo, mat, x, y, z) => add(geo, mat, x, y, z, shell);
  {
    // front wall: two jambs + lintel + the arch
    const gL = boxGeo(0.25, 2.25, 0.25); flatUV(gL, 0.5, 0.3); faceUV(gL, 4, ...fuv(-0.85, 0.25, -0.6, 2.5));
    sh(gL, mFront, -0.725, 1.375, -0.125);
    const gR = boxGeo(0.25, 2.25, 0.25); flatUV(gR, 0.5, 0.3); faceUV(gR, 4, ...fuv(0.6, 0.25, 0.85, 2.5));
    sh(gR, mFront, 0.725, 1.375, -0.125);
    const gT = boxGeo(1.7, 0.25, 0.25); flatUV(gT, 0.5, 0.3); faceUV(gT, 4, ...fuv(-0.85, 2.5, 0.85, 2.75));
    sh(gT, mFront, 0, 2.625, -0.125);
    const gA = keep(new THREE.CircleGeometry(C.r, 48, 0, Math.PI));
    const p = gA.attributes.position, uv = gA.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - C.x0) / C.w, (C.spring + p.getY(i) - C.y0) / C.h);
    sh(gA, mTymp, 0, C.spring, 0);
    // body: side walls, back, barrel roof, base under the cabin floor
    sh(planeGeo(1.7, 3.1), mWall, -0.85, 1.2, -0.85).rotation.y = -Math.PI / 2;
    sh(planeGeo(1.7, 3.1), mWall, 0.85, 1.2, -0.85).rotation.y = Math.PI / 2;
    sh(planeGeo(1.7, 3.1), mBody, 0, 1.2, -1.7).rotation.y = Math.PI;
    const roof = keep(new THREE.CylinderGeometry(C.r, C.r, 1.7, 40, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2));
    sh(roof, mRoof, 0, C.spring, -0.85);
    sh(boxGeo(1.7, 0.6, 1.7), mBody, 0, -0.05, -0.85);
    // three steps down to the water (stacked slabs, each drawn with its own outline)
    for (const [d, y] of [[0.3, 0.15], [0.6, -0.05], [0.9, -0.25]]) sh(boxGeo(1.9, 0.2, d), [mSq, mSq, mTread, mBody, mRiser, mBody], 0, y, d / 2);
  }
  // doors (they slide behind the jambs; the depth mask below hides whatever would stick out of the narrow body)
  const mDoorBack = ink({ interior: true, base: '#1c1d22', engrave: 0.5, freq: 26, axis: 0, rim: 0.2, wobble: 0.05 });
  const mEdge = ink({ base: '#0f0f12', rim: 0.2 });
  function makeLeaf(tex, sign) {
    const g = boxGeo(0.6, 2.25, 0.05);
    const front = ink({ base: '#12100f', map: tex, glow: 0.9, rim: 0.2 });
    const leaf = new THREE.Mesh(g, [mEdge, mEdge, mEdge, mEdge, front, mDoorBack]);
    leaf.position.set(sign * 0.3, 1.375, -0.1);
    leaf.renderOrder = 2;
    el.add(leaf);
    return leaf;
  }
  const leafL = makeLeaf(texLeafL, -1), leafR = makeLeaf(texLeafR, 1);
  // Depth-only mask: the cabin is larger inside than the body drawn on the cover. Seen from outside, anything of the
  // interior (and the open door leaves) that is not behind the doorway is rejected by this invisible sheet.
  {
    const s = new THREE.Shape();
    s.moveTo(-2.2, -0.4); s.lineTo(2.2, -0.4); s.lineTo(2.2, 3.5); s.lineTo(-2.2, 3.5); s.lineTo(-2.2, -0.4);
    const hole = new THREE.Path();
    hole.moveTo(-0.6, 0.25); hole.lineTo(-0.6, 2.5); hole.lineTo(0.6, 2.5); hole.lineTo(0.6, 0.25); hole.lineTo(-0.6, 0.25);
    s.holes.push(hole);
    const m = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
    disposables.push(m);
    const mask = add(keep(new THREE.ShapeGeometry(s)), m, 0, 0, -0.04);
    mask.renderOrder = 1;
  }

  // light ribbons: door surround line (path 0..1) + seam (uv.y in 2..3)
  const lineU = { uLine: { value: 0 }, uSeam: { value: 0 }, uFlare: { value: 0 }, uFade: { value: 1 }, uTint: { value: V3(0.98, 0.94, 0.84) } };
  {
    const pos = [], uv = [], idx = [];
    const quad = (a, b, c, d, ua, ub, uc, ud) => { // corners + (path, across) per corner
      const i = pos.length / 3;
      for (const q of [a, b, c, d]) pos.push(q[0], q[1], q[2]);
      for (const q of [ua, ub, uc, ud]) uv.push(q[0], q[1]);
      idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    };
    const z = 0.012, wd = 0.02, y0 = 0.25, y1 = 2.5, k = 2.25 / 2.85;
    for (const s of [-1, 1]) {
      const x = s * 0.612;
      quad([x - wd, y0, z], [x + wd, y0, z], [x + wd, y1, z], [x - wd, y1, z], [0, 0], [0, 1], [k, 1], [k, 0]);
      quad([x, y1 - wd, z], [0, y1 - wd, z], [0, y1 + wd, z], [x, y1 + wd, z], [k, 0], [1, 0], [1, 1], [k, 1]);
    }
    quad([-0.014, y0, -0.07], [0.014, y0, -0.07], [0.014, y1, -0.07], [-0.014, y1, -0.07], [0, 2], [0, 3], [1, 3], [1, 2]);
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    el.add(new THREE.Mesh(g, glowMat(LINE_FRAG, lineU)));
  }

  // call plate floating beside the body, as on the cover
  const CALL = V3(1.32, 1.3, 0.06);
  {
    const g = boxGeo(0.3, 0.52, 0.03); flatUV(g, 0.5, 0.52); faceUV(g, 4, 0, 0, 1, 1);
    sh(g, ink({ base: BODY, map: texCall, glow: 0.92, rim: 0.4 }), CALL.x, CALL.y, CALL.z);
  }
  const callHalo = sh(planeGeo(0.5, 0.5), glowMat(HALO_FRAG, { uTint: { value: V3(0.95, 0.9, 0.78) }, uAlpha: { value: 0 }, uStripes: { value: 0 } }), CALL.x, CALL.y + 0.09, CALL.z + 0.03);

  // prism beam: pencil rays leaving the door, crossed by the rainbow of the cover
  const beamU = { uBeam: { value: 0 }, uAlpha: { value: 1 }, uTime: LU.uTime };
  {
    const n = 46, r = mulberry32(19), pos = [], uv = [], seed = [], idx = [];
    for (let i = 0; i < n; i++) {
      const sx = (r() - 0.5) * 1.05, sy = 0.4 + r() * 1.95, L = 3.6 + r() * 4.6;
      const ex = sx + (sx * 1.5 + (r() - 0.5) * 1.5) * (L / 4), ey = Math.max(-CAB_LIFT + 0.04, sy + (-0.22 - r() * 0.5 + (sy - 1.3) * 0.28) * (L / 4)), ez = 0.06 + L;
      let px = ey - sy, py = -(ex - sx); // perpendicular in the screen plane (rays run toward the viewer)
      const pl = Math.hypot(px, py) || 1; const wq = 0.01 + r() * 0.024;
      px = (px / pl) * wq; py = (py / pl) * wq;
      const b = pos.length / 3, sd = r();
      pos.push(sx - px, sy - py, 0.06, sx + px, sy + py, 0.06, ex + px * 2.2, ey + py * 2.2, ez, ex - px * 2.2, ey - py * 2.2, ez);
      uv.push(0, 0, 0, 1, 1, 1, 1, 0); seed.push(sd, sd, sd, sd);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: beamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    disposables.push(m);
    const beam = new THREE.Mesh(g, m);
    beam.frustumCulled = false;
    el.add(beam);
  }

  // the two fingerprints that hold the cover
  const prints = [ASSETS.fingerL, ASSETS.fingerR].map((src) => {
    const tex = new THREE.Texture();
    const img = new Image();
    img.onload = () => { tex.image = img; tex.needsUpdate = true; };
    img.src = src;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
    disposables.push(tex, m);
    const mesh = new THREE.Mesh(planeGeo(1, 1.05), m);
    mesh.layers.set(1); // paint on the paper: not mirrored by the water
    scene.add(mesh);
    return mesh;
  });

  // ═════════════ cabin interior shell ═════════════
  const texWood = canvasTex(512, 512, (c, w, hh) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    const r = mulberry32(5);
    c.strokeStyle = '#ff0000'; c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const x = (i + 0.5) * (w / 4); c.lineWidth = 5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hh); c.stroke(); }
    c.lineWidth = 2; c.strokeRect(10, 10, w - 20, hh - 20);
    for (let i = 0; i < 26; i++) { c.globalAlpha = 0.25 + r() * 0.3; const x = r() * w; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, r() * hh); c.bezierCurveTo(x + 8, r() * hh, x - 8, r() * hh, x + (r() - 0.5) * 12, r() * hh); c.stroke(); }
    c.globalAlpha = 1;
  });
  texWood.wrapS = texWood.wrapT = THREE.RepeatWrapping;
  const texFloor = canvasTex(512, 512, (c, w, hh) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    c.strokeStyle = '#ff0000'; c.lineWidth = 3;
    for (let i = -4; i <= 8; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128 + 512, hh); c.stroke(); c.beginPath(); c.moveTo(i * 128, hh); c.lineTo(i * 128 + 512, 0); c.stroke(); }
    c.lineWidth = 8; c.strokeRect(20, 20, w - 40, hh - 40);
  });
  const mWood = ink({ interior: true, base: '#221b12', map: texWood, mapStrength: 0.32, engrave: 0.22, freq: 46, axis: 0, wobble: 0.5, rim: 0.15 });
  const mCeil = ink({ interior: true, base: '#17140f', engrave: 0.3, freq: 8, axis: 0, rim: 0.1 });
  const mFloor = ink({ interior: true, base: '#17161a', map: texFloor, mapStrength: 0.4, rim: 0.1 });
  const mBrass = ink({ interior: true, base: '#4a3f2a', engrave: 0.8, freq: 60, axis: 1, rim: 0.9, wobble: 0.02 });
  const interior = new THREE.Group();
  el.add(interior);
  const lining = (w, hh, x, y, z, ry, rx, mat) => { const m = add(planeGeo(w, hh), mat, x, y, z, interior); m.rotation.set(rx || 0, ry || 0, 0); return m; };
  lining(2.0, 2.5, 1.195, 1.5, -1.25, -Math.PI / 2, 0, mWood);
  lining(2.0, 2.5, -1.195, 1.5, -1.25, Math.PI / 2, 0, mWood);
  lining(2.4, 2.5, 0, 1.5, -2.245, 0, 0, mWood);
  lining(2.4, 2.0, 0, 2.745, -1.25, 0, Math.PI / 2, mCeil);
  lining(2.4, 2.0, 0, 0.255, -1.25, 0, -Math.PI / 2, mFloor);
  lining(0.6, 2.5, 0.9, 1.5, -0.255, Math.PI, 0, mWood);
  lining(0.6, 2.5, -0.9, 1.5, -0.255, Math.PI, 0, mWood);
  lining(1.2, 0.25, 0, 2.625, -0.255, Math.PI, 0, mWood);
  // handrails
  {
    const rail = (len, x, y, z, ry) => { const m = add(keep(new THREE.CylinderGeometry(0.02, 0.02, len, 12).rotateZ(Math.PI / 2)), mBrass, x, y, z, interior); m.rotation.y = ry; };
    rail(1.7, 1.13, 1.2, -1.25, Math.PI / 2); rail(2.0, 0, 1.2, -2.18, 0);
  }
  // ceiling lamp
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2d6 });
  disposables.push(lampMat);
  const lampDisc = add(keep(new THREE.CircleGeometry(0.2, 32)), lampMat, 0, 2.74, -1.25, interior);
  lampDisc.rotation.x = Math.PI / 2;
  const lampHaloU = { uTint: { value: V3(1.0, 0.9, 0.72) }, uAlpha: { value: 0 }, uStripes: { value: 0 } };
  const lampHalo = add(planeGeo(1.5, 1.5), glowMat(HALO_FRAG, lampHaloU), 0, 2.72, -1.25, interior);
  lampHalo.rotation.x = Math.PI / 2;
  // travel light bands across the door seam (inside view)
  const bandsU = { uTint: { value: V3(1.0, 0.95, 0.85) }, uAlpha: { value: 0 }, uPhase: { value: 0 } };
  {
    const m = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: bandsU,
      fragmentShader: /* glsl */`uniform vec3 uTint; uniform float uAlpha; uniform float uPhase; varying vec2 vUv;
        void main(){ float y = fract(vUv.y*1.6 + uPhase); float b = smoothstep(0.0,0.08,y)*smoothstep(0.34,0.16,y);
          float x = pow(1.0 - abs(vUv.x*2.0-1.0), 1.6); gl_FragColor = vec4(uTint*b*x*uAlpha, 1.0); }`,
    });
    disposables.push(m);
    const seamBand = add(planeGeo(0.09, 2.25), m, 0, 1.375, -0.128, interior); seamBand.rotation.y = Math.PI;
    for (const s of [-1, 1]) { const b = add(planeGeo(0.05, 2.25), m, s * 0.6, 1.375, -0.128, interior); b.rotation.y = Math.PI; }
  }

  // ═════════════ water + mirror ═════════════
  const mirrorRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
  const sceneRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true, samples: coarse ? 2 : 4 });
  const waterU = {
    ...LU,
    uTexMat: { value: new THREE.Matrix4() }, uReflect: { value: mirrorRT.texture },
    uRip: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0)) },
    uAccent: { value: vecHex('#ebe5d5') }, uAccentAmt: { value: 0 },
    uSpill: { value: 0 }, uPool: { value: 1 }, uTremor: { value: 0 }, uMirror: { value: 1 }, uLamp: { value: 0 },
  };
  const water = new THREE.Mesh(keep(new THREE.CircleGeometry(90, 72).rotateX(-Math.PI / 2)),
    new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, uniforms: waterU, extensions: { derivatives: true } }));
  disposables.push(water.material);
  scene.add(water);
  let ripI = 0;
  function ripple(x, z, amp) { waterU.uRip.value[ripI].set(x, z, LU.uTime.value, amp); ripI = (ripI + 1) % 6; }

  const vCam = new THREE.PerspectiveCamera();
  vCam.layers.enable(2); // layer 2 = only in the water (the marks of the level's clue)
  const mir = { p: V3(), look: V3(), rot: new THREE.Matrix4(), plane: new THREE.Plane(), clip: new THREE.Vector4(), q: new THREE.Vector4(), up: V3(0, 1, 0), o: V3() };
  function renderMirror() {
    mir.p.setFromMatrixPosition(camera.matrixWorld);
    if (mir.p.y <= 0.02) return;
    mir.rot.extractRotation(camera.matrixWorld);
    mir.look.set(0, 0, -1).applyMatrix4(mir.rot).add(mir.p);
    vCam.position.set(mir.p.x, -mir.p.y, mir.p.z);
    vCam.up.set(0, 1, 0).applyMatrix4(mir.rot); vCam.up.y *= -1;
    vCam.lookAt(mir.look.x, -mir.look.y, mir.look.z);
    vCam.near = camera.near; vCam.far = camera.far;
    vCam.updateMatrixWorld();
    vCam.projectionMatrix.copy(camera.projectionMatrix);
    waterU.uTexMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(vCam.projectionMatrix).multiply(vCam.matrixWorldInverse);
    // oblique near plane = the water surface (nothing below it is mirrored)
    mir.plane.setFromNormalAndCoplanarPoint(mir.up, mir.o).applyMatrix4(vCam.matrixWorldInverse);
    mir.clip.set(mir.plane.normal.x, mir.plane.normal.y, mir.plane.normal.z, mir.plane.constant);
    const pm = vCam.projectionMatrix.elements;
    mir.q.set((Math.sign(mir.clip.x) + pm[8]) / pm[0], (Math.sign(mir.clip.y) + pm[9]) / pm[5], -1, (1 + pm[10]) / pm[14]);
    mir.clip.multiplyScalar(2 / mir.clip.dot(mir.q));
    pm[2] = mir.clip.x; pm[6] = mir.clip.y; pm[10] = mir.clip.z + 1 - 0.003; pm[14] = mir.clip.w;
    water.visible = false;
    renderer.setRenderTarget(mirrorRT);
    renderer.clear();
    renderer.render(scene, vCam);
    water.visible = true;
  }

  // ═════════════ post pass ═════════════
  const postU = {
    tScene: { value: sceneRT.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uExposure: { value: 1 },
    uReduced: { value: 0 }, uSpeed: { value: 0 }, uPrism: { value: 0 }, uPrismT: { value: 0.5 }, uFlick: { value: 1 },
    uVoid: { value: vecHex(PAPER) }, uBoot: { value: 1 },
  };
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({ vertexShader: POST_VERT, fragmentShader: POST_FRAG, uniforms: postU, depthTest: false, depthWrite: false });
  disposables.push(postMat);
  const postQuad = new THREE.Mesh(planeGeo(2, 2), postMat);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);

  // ═════════════ world typography: countdown + messages ═════════════
  const IVORY = '#ffffff';
  function glowText(c, draw) { // blurred pass + sharp pass (reads as light)
    c.save(); c.shadowColor = 'rgba(255,255,255,0.55)'; c.shadowBlur = 18; c.fillStyle = 'rgba(255,255,255,0.5)'; draw(); c.restore();
    c.fillStyle = IVORY; draw();
  }
  const texDigits = canvasTex(2560, 384, (c, w, hh) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = FONT_DISPLAY(330, '', 400);
    for (let d = 0; d < 10; d++) glowText(c, () => c.fillText(String(d), d * 256 + 128, 312));
  });
  const digitGeo = planeGeo(0.667, 1);
  const cd = new THREE.Group();
  scene.add(cd);
  const digits = [];
  function makeDigit(parent, x) {
    const u = { uAtlas: { value: texDigits }, uDigit: { value: 0 }, uPrev: { value: 0 }, uMix: { value: 1 }, uIgnite: { value: 0 }, uAlpha: { value: 1 } };
    const m = new THREE.Mesh(digitGeo, glowMat(DIGIT_FRAG, u));
    m.position.x = x;
    parent.add(m);
    const d = { mesh: m, u, cur: -1, group: null };
    digits.push(d);
    return d;
  }
  /** Additive text plane whose canvas is redrawn when its text changes. `lines` may hold 1–2 lines. */
  function makeText(pxW, pxH, font, spacing) {
    const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
    const ctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = maxAniso; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    disposables.push(tex);
    const u = { uTex: { value: tex }, uAlpha: { value: 0 }, uReveal: { value: 1 }, uTint: { value: V3(0.93, 0.9, 0.82) } };
    const mesh = new THREE.Mesh(planeGeo(pxW / pxH, 1), glowMat(TEXT_FRAG, u));
    const t = {
      mesh, u, text: null,
      set(str) {
        if (str === this.text) return;
        this.text = str;
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, pxW, pxH);
        const lines = String(str || '').split('\n');
        const size = (pxH / lines.length) * 0.58;
        ctx.font = font(size); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        lines.forEach((ln, i) => {
          const y = (pxH / lines.length) * (i + 0.5) + size * 0.04;
          // shrink to fit
          let sp = spacing * size, k = 1;
          const wNow = [...ln].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + sp * Math.max(0, ln.length - 1);
          if (wNow > pxW * 0.94) k = (pxW * 0.94) / wNow;
          ctx.font = font(size * k); sp *= k;
          glowText(ctx, () => drawSpaced(ctx, ln, pxW / 2, y, sp, 'center'));
          ctx.font = font(size);
        });
        tex.needsUpdate = true;
      },
    };
    return t;
  }
  const fItalic = (px) => FONT_DISPLAY(px, 'italic', 400);
  const groupsCD = {};
  const labelGeoH = 0.25;
  ['d', 'h', 'm', 's'].forEach((k) => {
    const g = new THREE.Group();
    const n = k === 'd' ? 3 : 2;
    const ds = [];
    for (let i = 0; i < n; i++) { const d = makeDigit(g, 0); d.group = k; ds.push(d); }
    const label = makeText(384, 96, FONT_CAPS, 0.3);
    label.set(COPY.units[k]);
    label.mesh.scale.setScalar(labelGeoH);
    label.mesh.position.y = -0.7;
    g.add(label.mesh);
    cd.add(g);
    groupsCD[k] = { g, ds, label };
  });
  const seps = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(planeGeo(0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0x8f8b7f, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    disposables.push(s.material);
    s.rotation.z = Math.PI / 4;
    cd.add(s); seps.push(s);
  }
  const subtitle = makeText(1400, 150, fItalic, 0.02);
  const note = makeText(1400, 150, fItalic, 0.02);
  const mainMsg = makeText(2048, 300, FONT_CAPS, 0.28);
  const mainMsgWide = makeText(2048, 150, FONT_CAPS, 0.28);
  cd.add(subtitle.mesh); cd.add(note.mesh);
  scene.add(mainMsg.mesh); scene.add(mainMsgWide.mesh);

  /** Camera used only to place things in screen space for a given shot. */
  const probe = new THREE.PerspectiveCamera();
  probe.rotation.order = 'YXZ';
  function aimProbe(pose, aspect) {
    probe.fov = pose.fov; probe.aspect = aspect; probe.near = 0.05; probe.far = 240;
    probe.position.set(pose.x, pose.y, pose.z); probe.rotation.set(pose.pitch, pose.yaw, 0);
    probe.updateProjectionMatrix(); probe.updateMatrixWorld(true);
  }
  const rayV = V3();
  /** World point on the plane z = zPlane that appears at screen fraction (sx, sy) for the probe camera. */
  function screenToZ(sx, sy, zPlane) {
    rayV.set(sx * 2 - 1, 1 - sy * 2, 0.5).unproject(probe).sub(probe.position).normalize();
    const k = (zPlane - probe.position.z) / rayV.z;
    return V3(probe.position.x + rayV.x * k, probe.position.y + rayV.y * k, zPlane);
  }
  /** World height that covers `frac` of the viewport height at distance `dist`. */
  const worldH = (frac, dist, fov) => frac * 2 * dist * Math.tan((fov * Math.PI) / 360);

  let cdMode = '';
  function layoutCountdown() {
    const a = W / H;
    const pose = poseFromShot(Shots.spawn(a));
    aimProbe(pose, a);
    const portrait = a < 0.8;
    const zP = portrait ? 2.2 : 0.7;
    const dist = pose.z - zP;
    const wide = world.countdown.d.length > 2;
    const G = 1.2, GD = wide ? 1.8 : 1.2, gap = 0.52;
    let unit, center;
    if (!portrait) {
      const total = GD + G * 3 + gap * 3;
      unit = Math.min(worldH(0.088, dist, pose.fov), (worldH(0.86, dist, pose.fov) * a) / total);
      center = screenToZ(0.5, 0.185, zP);
      let x = -total / 2;
      for (const k of ['d', 'h', 'm', 's']) { const wdt = k === 'd' ? GD : G; groupsCD[k].g.position.set(x + wdt / 2, 0, 0); x += wdt + gap; }
      seps.forEach((s, i) => { const k = ['d', 'h', 'm'][i]; s.visible = true; s.position.set(groupsCD[k].g.position.x + (k === 'd' ? GD : G) / 2 + gap / 2, 0, 0); });
      subtitle.mesh.position.set(0, -1.3, 0); subtitle.mesh.scale.setScalar(0.42);
      note.mesh.position.set(0, -1.3, 0); note.mesh.scale.setScalar(0.42);
    } else {
      const total = Math.max(GD, G) + G + gap;
      unit = Math.min(worldH(0.074, dist, pose.fov), (worldH(0.8, dist, pose.fov) * a) / total);
      center = screenToZ(0.5, 0.224, zP);
      const xl = -total / 2 + Math.max(GD, G) / 2, xr = total / 2 - G / 2;
      groupsCD.d.g.position.set(xl, 0.78, 0); groupsCD.h.g.position.set(xr, 0.78, 0);
      groupsCD.m.g.position.set(xl, -0.78, 0); groupsCD.s.g.position.set(xr, -0.78, 0);
      seps.forEach((s, i) => { s.visible = i < 2; s.position.set((xl + xr) / 2 + (Math.max(GD, G) - G) / 4, i === 0 ? 0.78 : -0.78, 0); });
      subtitle.mesh.position.set(0, -2.02, 0); subtitle.mesh.scale.setScalar(0.47);
      note.mesh.position.set(0, -2.02, 0); note.mesh.scale.setScalar(0.47);
    }
    for (const k of ['d', 'h', 'm', 's']) {
      const { ds, label } = groupsCD[k];
      label.mesh.scale.setScalar(portrait ? 0.33 : labelGeoH); label.mesh.position.y = portrait ? -0.72 : -0.7; // readable unit names on a phone
      const n = k === 'd' && !wide ? 2 : ds.length;
      ds.forEach((d, i) => { const j = i - (ds.length - n); d.mesh.visible = j >= 0; d.mesh.position.x = (j - (n - 1) / 2) * 0.6; });
    }
    cd.position.copy(center);
    cd.scale.setScalar(unit);
    cd.rotation.x = pose.pitch * 0.6;
    LU.uPPos.value[0].set(center.x, center.y - unit * 0.4, zP + 0.4);
    // the launch message takes the place of the countdown
    const msg = portrait ? mainMsg : mainMsgWide;
    (portrait ? mainMsgWide : mainMsg).mesh.visible = false;
    msg.mesh.visible = true;
const aspectM = portrait ? 2048 / 300 : 2048 / 150;
    const mh = Math.min((worldH(0.9, dist, pose.fov) * a) / aspectM, worldH(portrait ? 0.12 : 0.085, dist, pose.fov));
    msg.mesh.scale.setScalar(mh);
    msg.mesh.position.copy(screenToZ(0.5, portrait ? 0.24 : 0.2, zP));
    msg.mesh.rotation.x = pose.pitch * 0.6;
    // the fingerprints flank the elevator as on the cover (there, too, one of them touches the edge)
    const ps = worldH(portrait ? 0.15 : 0.27, pose.z, pose.fov);
    [[portrait ? 0.06 : 0.2, portrait ? 0.78 : 0.63, -0.22], [portrait ? 0.95 : 0.8, portrait ? 0.46 : 0.56, 0.3]].forEach(([sx, sy, rot], i) => {
      prints[i].position.copy(screenToZ(sx, sy, 0.12)); prints[i].scale.setScalar(ps); prints[i].rotation.z = rot;
    });
    cdMode = (portrait ? 'p' : 'l') + (wide ? '3' : '2');
  }

  // ═════════════ motes (only near light) ═════════════
  const motesU = { uTime: LU.uTime, uScale: { value: 10 }, uSpill: { value: 0 }, uCount: { value: 1 } };
  {
    const n = 56, r = mulberry32(41);
    const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const inSpill = i % 2;
      pos[i * 3] = inSpill ? (r() - 0.5) * 1.6 : (r() - 0.5) * 5.5;
      pos[i * 3 + 1] = inSpill ? 0.35 + r() * 1.5 : 3.7 + r() * 1.4;
      pos[i * 3 + 2] = inSpill ? 0.3 + r() * 3.4 : 0.3 + r() * 1.5;
      seed[i * 4] = r(); seed[i * 4 + 1] = r(); seed[i * 4 + 2] = r(); seed[i * 4 + 3] = inSpill;
    }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, uniforms: motesU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(m);
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false; pts.layers.set(1);
    scene.add(pts);
  }

  // ═════════════ portal light wall (behind the DOM player; reflected by the water) ═════════════
  const wallU = { uTint: { value: V3(0.9, 0.87, 0.78) }, uAlpha: { value: 0 }, uTime: LU.uTime, uSize: { value: new THREE.Vector2(4, 2) } };
  const wall = new THREE.Mesh(planeGeo(1, 1), glowMat(WALL_FRAG, wallU));
  wall.visible = false;
  scene.add(wall);

  // ═════════════ hotspot anchors ═════════════
  const anchors = {
    call: { pos: V3(CALL.x, CALL.y + CAB_LIFT, 0.1), w: 0.36, h: 0.58 },
    elevator: { pos: V3(0, 1.375 + CAB_LIFT, 0.05), w: 1.3, h: 2.35 },
  };

  /** Context shared with the cabin and floor builders (defined in the next sections). */
  const ctx = {
    THREE, scene, camera, renderer, el, interior, LU, LU_IN, V3, vecHex, ink, glowMat, canvasTex, keep, boxGeo, planeGeo, add,
    shell, faceUV, flatUV, anchors, ripple, makeText, glowText, disposables, geos, aimProbe, screenToZ, updaters: [], waterU, postU, wall, wallU, worldH, pointAt,
    get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
  };
  const cabin = buildCabin3D(ctx);
  interior.traverse((o) => { o.renderOrder = 2; }); // drawn after the depth mask (see the exterior block)
  const floors = buildFloors3D(ctx);
  ctx.floorAnchor = () => floors.anchor();
  const bookObj = buildBook3D(ctx);
  const galleryObj = buildGallery3D(ctx);
  /** World point where the book icon sits on screen (the level's page flies there). */
  ctx.bookIconPoint = (dist) => {
    const el = document.getElementById('book-open'), r = el && !el.hidden ? el.getBoundingClientRect() : null;
    return pointAt(r && r.width ? r.left + r.width / 2 : W - 30, r && r.width ? r.top + r.height / 2 : 70, dist);
  };
  const levelObj = buildLevel3D(ctx);

  // ═════════════ frame ═════════════
  const tmp = { a: V3(), b: V3(), c: V3(), r: V3(), u: V3() };
  let last10Prev = 0;
  function applyCamera(dt, t) {
    const c = world.cam;
    const red = world.reduced;
    const ls = world.lookScale;
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    // walk offsets live in the camera's ground frame (right, forward)
    const px = c.x + cy * look.walkX - sy * look.walkZ;
    const pz = c.z - sy * look.walkX - cy * look.walkZ;
    const still = ls < 0.1 ? 0.15 : 1; // looking closely at something small: hold the breath, the targets stay put
    const breath = red ? 0 : (Math.sin(t * 1.13) * 0.006 + Math.sin(t * 0.47) * 0.004) * still;
    const bob = red ? 0 : world.bob * Math.sin(t * 11.3) * 0.028;
    let sx = 0, sy2 = 0, sr = 0;
    const sh = red ? 0 : world.shake + world.cabinJolt;
    if (sh > 0) {
      sx = (Math.sin(t * 69.1) * 0.6 + Math.sin(t * 43.7 + 1.3) * 0.4) * sh;
      sy2 = (Math.sin(t * 57.3 + 0.7) * 0.6 + Math.sin(t * 38.1) * 0.4) * sh;
      sr = Math.sin(t * 31.0) * sh * 0.5;
    }
    camera.position.set(px + (red ? 0 : world.bob * Math.sin(t * 5.65) * 0.012), c.y + breath + bob, pz);
    camera.rotation.set(c.pitch + look.pitch * ls + sy2 + (red ? 0 : Math.sin(t * 0.61) * 0.0016), c.yaw + look.yaw * ls + sx, sr);
    if (camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld(true);
  }

  function updateScene(dt, t) {
    LU.uTime.value = t;
    const w = world, cdw = w.countdown;
    // doors, needle, lights
    leafL.position.x = -0.3 - 0.585 * w.doors; leafR.position.x = 0.3 + 0.585 * w.doors;
    shell.visible = !w.inside;
    mTymp.uniforms.uGlow.value = 0.8 + 0.45 * w.lamp + 0.5 * cdw.pulse + w.flare; // the two bars light up when the cabin arrives
    beamU.uBeam.value = w.spill * w.lamp; beamU.uAlpha.value = w.env === 0 ? (w.inside ? 0.3 : 1) : 0; // only in the lobby: on a floor the rays would cross the camera
    const pv = w.env === 0 && !w.inside ? 0.94 : 0;
    for (const m of prints) { m.material.opacity = damp(m.material.opacity, pv, 3, dt); m.visible = m.material.opacity > 0.01; }
    lineU.uLine.value = w.line; lineU.uSeam.value = w.seam * (1 - smooth(0.02, 0.2, w.doors)); lineU.uFlare.value = w.flare; lineU.uFade.value = w.lineFade;
    const pulse = w.called ? 1 : 0.28 + 0.2 * Math.sin(t * Math.PI);
    callHalo.material.uniforms.uAlpha.value = pulse * 0.4 * (w.env === 0 ? 1 : 0.3);
    const flick = w.reduced ? 1 : 1 - 0.05 * Math.max(0, Math.sin(t * 13.0) * Math.sin(t * 2.3) - 0.72) * 3;
    const lamp = w.lamp * flick;
    LU.uPCol.value[1].set(1.0, 0.92, 0.8).multiplyScalar(lamp * 1.55);
    LU.uPCol.value[2].set(1.0, 0.9, 0.72).multiplyScalar(w.spill * w.lamp * 0.75);
    LU.uPCol.value[0].set(0.93, 0.9, 0.82).multiplyScalar(0.42 * cdw.alpha * (w.env === 0 ? 1 : 0));
    lampMat.color.setRGB(lamp, lamp * 0.95, lamp * 0.84);
    lampHaloU.uAlpha.value = lamp * 0.5;
    bandsU.uAlpha.value = w.bands; bandsU.uPhase.value = w.bandPhase;
    waterU.uSpill.value = w.spill; waterU.uLamp.value = w.lamp; waterU.uTremor.value = w.tremor;
    waterU.uPool.value = w.env === 0 ? 1 : 0;
    motesU.uSpill.value = w.inside ? 0 : w.spill * w.lamp; motesU.uScale.value = (w.inside ? 0 : 9) * dpr * (H / 900);
    // countdown digits
    const mode = (W / H < 0.8 ? 'p' : 'l') + (cdw.d.length > 2 ? '3' : '2');
    if (mode !== cdMode) layoutCountdown();
    const vis = cdw.alpha > 0.002 && w.env === 0;
    cd.visible = vis || w.say.note.alpha > 0.002 || w.say.subtitle.alpha > 0.002;
    for (const k of ['d', 'h', 'm', 's']) {
      const { ds, label, g } = groupsCD[k];
      const str = cdw[k].padStart(ds.length, ' ');
      const dimK = k === 's' ? 1 : lerp(1, 0.3, cdw.last10);
      g.scale.setScalar(k === 's' ? 1 + 0.5 * cdw.last10 * (W / H < 0.8 ? 0.4 : 1) + 0.06 * cdw.pulse : 1);
      ds.forEach((d, i) => {
        const ch = str[i];
        const val = ch === ' ' ? 0 : Number(ch);
        if (d.cur !== val) { d.u.uPrev.value = d.cur < 0 ? val : d.cur; d.u.uDigit.value = val; d.u.uMix.value = d.cur < 0 ? 1 : 0; d.u.uIgnite.value = d.cur < 0 ? 0 : 1; d.cur = val; }
        d.u.uMix.value = Math.min(1, d.u.uMix.value + dt / 0.22);
        d.u.uIgnite.value = Math.max(0, d.u.uIgnite.value - dt / 0.45);
        d.u.uAlpha.value = cdw.alpha * cdw.dim * dimK * (ch === ' ' ? 0 : 1);
      });
      label.u.uAlpha.value = cdw.alpha * cdw.dim * 0.8 * dimK;
    }
    for (const s of seps) s.material.opacity = cdw.alpha * cdw.dim * 0.8 * (1 - cdw.last10);
    subtitle.set(w.say.subtitle.text); subtitle.u.uAlpha.value = w.say.subtitle.alpha * cdw.dim * 0.92;
    note.set(w.say.note.text); note.u.uAlpha.value = w.say.note.alpha;
    for (const m of [mainMsg, mainMsgWide]) { m.set(m === mainMsg ? w.say.main.text.replace(' ESTÁN', '\nESTÁN') : w.say.main.text); m.u.uAlpha.value = w.say.main.alpha; m.u.uReveal.value = w.say.main.reveal; }
    // post
    postU.uTime.value = t; postU.uExposure.value = w.exposure; postU.uReduced.value = w.reduced ? 1 : 0;
    postU.uSpeed.value = w.reduced ? 0 : w.speed; postU.uPrism.value = w.prism; postU.uFlick.value = w.reduced ? 0 : 1;
    postU.uPrismT.value = 0.5 + 0.5 * Math.sin(t * 2.1);
    // light wall behind the DOM player
    const gl = w.glow;
    if (gl.rect && gl.amount > 0.001) placeWall(gl.rect, gl.accent, gl.amount); else wall.visible = false;
    for (const f of ctx.updaters) f(dt, t);
    last10Prev = cdw.last10;
  }

  const ndc = V3();
  /** Unprojects a CSS-pixel rect to a camera-facing plane `dist` metres ahead and parks the light wall there. */
  function placeWall(rect, accent, amount) {
    const dist = world.inside ? 3 : (world.env === 0 ? 6.5 : floors.portalDepth());
    const center = pointAt(rect.x + rect.w / 2, rect.y + rect.h / 2, dist);
    const edge = pointAt(rect.x + rect.w, rect.y + rect.h / 2, dist);
    const top = pointAt(rect.x + rect.w / 2, rect.y, dist);
    const ww = center.distanceTo(edge) * 2, wh = center.distanceTo(top) * 2;
    wall.visible = true;
    wall.position.copy(center);
    wall.quaternion.copy(camera.quaternion);
    wall.scale.set(ww * 1.06, wh * 1.1, 1);
    wallU.uSize.value.set(ww, wh);
    wallU.uTint.value.set(...hex3(accent)).multiplyScalar(0.55);
    wallU.uAlpha.value = amount * 0.3;
  }
  /** World point `dist` metres along the view axis that projects to CSS pixel (px, py). */
  function pointAt(px, py, dist) {
    ndc.set((px / W) * 2 - 1, 1 - (py / H) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    tmp.c.set(0, 0, -1).applyQuaternion(camera.quaternion);
    return ndc.multiplyScalar(dist / Math.max(0.2, ndc.dot(tmp.c))).add(camera.position).clone();
  }

  let frameAcc = 0, frameN = 0, slowFor = 0, fastFor = 0;
  function adapt(dt) {
    frameAcc += dt; frameN++;
    if (frameAcc < 2) return;
    const avg = (frameAcc / frameN) * 1000;
    frameAcc = 0; frameN = 0;
    if (avg > 26) { slowFor++; fastFor = 0; } else if (avg < 12) { fastFor++; slowFor = 0; } else { slowFor = 0; fastFor = 0; }
    if (slowFor >= 1 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); mirrorDiv = 4; resize(); slowFor = 0; }
    else if (fastFor >= 3 && dpr < Math.min(window.devicePixelRatio || 1, dprCap)) { dpr = Math.min(dpr + 0.25, Math.min(window.devicePixelRatio || 1, dprCap)); if (dpr >= 1) mirrorDiv = 2; resize(); fastFor = 0; }
    api.avgMs = avg;
  }

  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    const bw = Math.max(2, Math.round(W * dpr)), bh = Math.max(2, Math.round(H * dpr));
    sceneRT.setSize(bw, bh);
    mirrorRT.setSize(Math.max(2, Math.round(bw / mirrorDiv)), Math.max(2, Math.round(bh / mirrorDiv)));
    postU.uRes.value.set(bw, bh);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    layoutCountdown();
    floors.refit();
  }

  const api = {
    kind: '3d', canvas, avgMs: 0,
    get dpr() { return dpr; },
    resize,
    ripple,
    render(dt, t) {
      applyCamera(dt, t);
      updateScene(dt, t);
      const seesWater = !(world.inside && world.doors < 0.004);
      water.visible = seesWater;
      if (seesWater) renderMirror();
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
      adapt(dt);
    },
    /** Screen rectangle (CSS px) of a hotspot anchor, or null when it is behind the camera/off-screen. */
    project(id) {
      const a = anchors[id];
      if (!a) return null;
      tmp.a.copy(a.pos).project(camera);
      if (tmp.a.z > 1 || tmp.a.z < -1) return null;
      const x = (tmp.a.x * 0.5 + 0.5) * W, y = (0.5 - tmp.a.y * 0.5) * H;
      tmp.r.set(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(a.w / 2).add(a.pos).project(camera);
      tmp.u.set(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(a.h / 2).add(a.pos).project(camera);
      const hw = Math.abs(tmp.r.x - tmp.a.x) * 0.5 * W, hh = Math.abs(tmp.u.y - tmp.a.y) * 0.5 * H;
      if (x < -hw || x > W + hw || y < -hh || y > H + hh) return null;
      return { x: x - hw, y: y - hh, w: hw * 2, h: hh * 2 };
    },
    setFloor(track) { floors.set(track); levelObj.set(!!track && Level.hosts(track)); },
    levelPose(view, a) { return levelObj.pose(view, a); },
    levelInfo() { return levelObj.info(); },
    levelSolids() { return levelObj.solids(); },
    bookTarget() { return bookObj.target(); },
    setGallery(on) { galleryObj.set(on); },
    galleryRefit() { galleryObj.refit(); },
    floorAnchorChanged() { floors.refit(); },
    setBoot(v) { postU.uBoot.value = v; },
    cabin, floors,
    onContextLost: null,
    dispose() {
      floors.set(null);
      levelObj.set(false);
      galleryObj.set(false);
      for (const g of geos) g.dispose();
      for (const d of disposables) d.dispose && d.dispose();
      mirrorRT.dispose(); sceneRT.dispose(); renderer.dispose();
      canvas.remove();
    },
  };
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (api.onContextLost) api.onContextLost(); });
  resize();
  return api;
}
