// ═══════════════════════════════════════════════════════════════════════════════════════════
// GALLERY  (the floor above the songs: the making of the record and the thanks, hung as pieces in the void)
//   Open before the release too. Every image, name and text comes from GALLERY in the config; nothing is invented:
//   an entry without `src` hangs as an empty frame.
// ═══════════════════════════════════════════════════════════════════════════════════════════
/** The gallery is the floor right above the last song of the record (10 for nine songs); the basements never move it. */
const GALLERY_FLOOR = tracks.filter((t) => t.floor > 0).length + 1;
/**
 * The cabin panel shows one section at a time. "Pisos", bottom to top: PB (the entrance), the record, the gallery.
 * "Subsuelos" (once open), top to bottom: PB, −1 … −9. Both sections share the row spacing, so PB only changes place.
 */
const PB_ROW = { floor: 0, visualAccent: '#f2ead6' };
const panelUpRows = () => [PB_ROW, ...tracks.filter((t) => t.floor > 0), ...(GALLERY.enabled ? [{ floor: GALLERY_FLOOR, visualAccent: '#f2ead6' }] : [])];
const panelDownRows = () => [PB_ROW, ...tracks.filter((t) => t.floor < 0)];
/** True while the panel shows the basements (only possible once they are open). */
const panelDown = () => !!world.panelDown && Progress.basementsOpen();
const panelRows = () => (panelDown() ? panelDownRows() : panelUpRows());
/** Every button the cabin has, both sections (PB once). */
const panelAllRows = () => [...panelUpRows(), ...tracks.filter((t) => t.floor < 0)];
const panelTop = () => tracks.filter((t) => t.floor > 0).length + (GALLERY.enabled ? 1 : 0);
const basementCount = () => tracks.filter((t) => t.floor < 0).length;
/** Floors the dial and the readout cover now. */
const panelRange = () => (panelDown() ? [-basementCount(), 0] : [0, panelTop()]);
Object.assign(world, { gallery: { at: -1 }, panelDown: false }); // at: -1 = walking the corridor, i = standing in front of piece i

const GalleryArt = {
  images: [],
  /** One shared Image per piece (both renderers use it); the room is refitted when its real proportions arrive. */
  image(i) {
    const p = GALLERY.pieces[i];
    if (!p || !p.src) return null;
    if (!this.images[i] || this.images[i].dataset.src !== p.src) {
      const img = new Image();
      img.dataset.src = p.src;
      img.onload = () => { if (R && R.galleryRefit) R.galleryRefit(); Gallery.reframe(); };
      img.src = p.src;
      this.images[i] = img;
    }
    return this.images[i];
  },
  ready: (img) => !!img && img.complete && img.naturalWidth > 0,
  /** Size of a piece in metres: fitted in a 1.6 × 1.3 box by the image's own proportions (4:3 until it loads). */
  size(i) {
    const img = this.image(i);
    const ar = this.ready(img) ? img.naturalWidth / img.naturalHeight : 4 / 3;
    const w = Math.min(1.6, 1.3 * ar);
    return { w, h: w / ar };
  },
};

/** Where everything hangs: a corridor along +Z from the elevator, pieces zigzagging left/right, turned toward the visitor; the thanks plate closes it. */
function galleryLayout() {
  const n = GALLERY.pieces.length, items = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? -1 : 1; // +x is the visitor's left when walking away from the elevator
    const s = GalleryArt.size(i);
    items.push({ i, x: side * 2.5, y: 1.75, z: 6 + i * 1.7, nx: -side * 0.9, nz: -0.436, ry: Math.atan2(-side * 0.9, -0.436), w: s.w, h: s.h });
  }
  items.push({ i: n, thanks: true, x: 0, y: 1.8, z: 6 + n * 1.7 + 2.4, nx: 0, nz: -1, ry: Math.PI, w: 2.6, h: 1.5 });
  return { items, end: items[n].z };
}
const GalleryShots = {
  room(a) { return { x: 0, y: 1.6, z: 2.9, yaw: Math.PI, pitch: 0.03, fov: a >= 1 ? clamp(56 + (1.6 - a) * 25, 56, 68) : 70 }; },
  /** Standing in front of an item: it sits in the upper part of the view, leaving room for its text below. */
  piece(it, a) {
    const fov = a >= 1 ? 46 : 60, tv = Math.tan((fov * Math.PI) / 360), th = tv * a;
    const d = Math.max(it.w / (2 * th * 0.8), it.h / (2 * tv * 0.5), 1.4);
    return { x: it.x + it.nx * d, y: it.y - it.h * 0.3, z: it.z + it.nz * d, yaw: Math.atan2(it.nx, it.nz), pitch: 0, fov };
  },
  /** Back in the corridor, a few steps before that item. */
  beside(it, a) { return { ...this.room(a), z: Math.max(2.9, it.z - 3.4) }; },
};

Object.assign(Tex, {
  /** Floating plate beside the elevator: the floor number and the word, as an inscription. */
  galleryPlate(ctx, w, h, pal) {
    fillBg(ctx, w, h, pal);
    const S = w / 0.34;
    const k = makeChalk(ctx, pal, S, 13);
    const rr = 0.045 * S, x0 = 0.022 * S, y0 = 0.022 * S, x1 = w - x0, y1 = h - y0, pts = [];
    const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } };
    corner(x1 - rr, y0 + rr, -Math.PI / 2); corner(x1 - rr, y1 - rr, 0); corner(x0 + rr, y1 - rr, Math.PI / 2); corner(x0 + rr, y0 + rr, Math.PI); pts.push(pts[0]);
    k.path(pts, 0.014, 'g', 2);
    const p = makePen(ctx, pal, S);
    p.text(String(GALLERY_FLOOR), w / 2, 0.15 * S, 0.15, (px) => FONT_DISPLAY(px, '', 400), 'g', 0);
    k.rect(w / 2 - 0.075 * S, 0.265 * S, 0.15 * S, 0.105 * S, 0.01, 'g', 2); // a small frame
    k.rect(w / 2 - 0.05 * S, 0.287 * S, 0.1 * S, 0.061 * S, 0.005, 'g', 1);
    p.text(GALLERY.label, w / 2, 0.44 * S, 0.034, FONT_CAPS, 'g', 0.007);
  },
  /** A hanging frame w × h metres (white on black, drawn as light). `empty` adds the faint cross of a bare stretcher. */
  galleryFrame(ctx, w, h, S, empty, seed) {
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const k = makeChalk(ctx, PAL2D, S, seed);
    const m = 0.03 * S;
    k.rect(m, m, w - 2 * m, h - 2 * m, 0.02, 'g', 2);
    k.rect(m + 0.05 * S, m + 0.05 * S, w - 2 * m - 0.1 * S, h - 2 * m - 0.1 * S, 0.007, 'g', 1);
    if (empty) { k.line(m + 0.07 * S, m + 0.07 * S, w - m - 0.07 * S, h - m - 0.07 * S, 0.005, 'r', 1, 0.5); k.line(w - m - 0.07 * S, m + 0.07 * S, m + 0.07 * S, h - m - 0.07 * S, 0.005, 'r', 1, 0.5); }
  },
});

function buildGallery3D(ctx) {
  const { THREE, scene, camera, LU, V3, glowMat, keep, planeGeo, makeText, canvasTex, anchors, disposables, ink } = ctx;
  // ---- the inscription beside the elevator (lobby) ----
  if (GALLERY.enabled) {
    const tex = canvasTex(408, 624, (c, w, hh) => Tex.galleryPlate(c, w, hh, PAL3D));
    const g = ctx.boxGeo(0.34, 0.52, 0.03); ctx.flatUV(g, 0.5, 0.985); ctx.faceUV(g, 4, 0, 0, 1, 1);
    ctx.add(g, ink({ base: '#0c0b0b', map: tex, glow: 0.92, rim: 0.4 }), -1.36, 1.3, 0.06, ctx.shell);
    anchors.gallery = { pos: V3(-1.36, 1.3 + CAB_LIFT, 0.1), w: 0.4, h: 0.58 };
  }
  // ---- the room, built when visited and released when left ----
  let cur = null;
  function build() {
    const marks = { d: disposables.length, g: ctx.geos.length };
    const group = new THREE.Group();
    scene.add(group);
    const L = galleryLayout();
    const add = (geo, mat, parent, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.z = z; parent.add(m); return m; };
    for (const it of L.items) {
      const holder = new THREE.Group();
      holder.position.set(it.x, it.y, it.z); holder.rotation.y = it.ry;
      group.add(holder);
      const img = it.thanks ? null : GalleryArt.image(it.i), has = GalleryArt.ready(img);
      const S = 300, fw = it.w + 0.16, fh = it.h + 0.16;
      const ftex = canvasTex(Math.round(fw * S), Math.round(fh * S), (c, w, hh) => Tex.galleryFrame(c, w, hh, S, !has && !it.thanks, 30 + it.i));
      add(planeGeo(fw, fh), glowMat(TEXT_FRAG, { uTex: { value: ftex }, uAlpha: { value: 0.95 }, uReveal: { value: 1 }, uTint: { value: V3(0.93, 0.9, 0.84) } }), holder, 0.01);
      const halo = add(planeGeo(fw * 2.2, fh * 2.2), glowMat(HALO_FRAG, { uTint: { value: V3(0.9, 0.87, 0.78) }, uAlpha: { value: 0.07 }, uStripes: { value: 0 } }), holder, -0.02);
      halo.renderOrder = -1;
      if (has) {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true; tex.anisotropy = 8;
        const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xdadada });
        disposables.push(tex, mat);
        add(planeGeo(it.w, it.h), mat, holder, 0.004);
      }
      if (it.thanks) {
        const head = makeText(1400, 170, FONT_CAPS, 0.3);
        head.set(GALLERY.thanks.heading || COPY.thanksHeading); head.u.uAlpha.value = 0.95;
        head.mesh.scale.setScalar(0.24); head.mesh.position.set(0, it.h / 2 - 0.3, 0.02);
        holder.add(head.mesh);
        const lines = GALLERY.thanks.lines.slice(0, 12);
        if (lines.length) {
          const list = canvasTex(1200, 560, (c, w, hh) => {
            c.fillStyle = '#000'; c.fillRect(0, 0, w, hh); c.fillStyle = '#fff'; c.font = FONT_MONO(30); c.textBaseline = 'middle'; c.textAlign = 'center';
            const cols = lines.length > 6 ? 2 : 1, per = Math.ceil(lines.length / cols), colW = w / cols - 60;
            // a long line wraps within its column (a name keeps one row, a sentence takes a few)
            const wrap = (s) => {
              const out = []; let cur = '';
              for (const word of String(s).split(/\s+/)) { const t = cur ? cur + ' ' + word : word; if (cur && c.measureText(t).width > colW) { out.push(cur); cur = word; } else cur = t; }
              if (cur) out.push(cur);
              return out;
            };
            for (let col = 0; col < cols; col++) {
              let y = 60;
              for (const ln of lines.slice(col * per, col * per + per)) { for (const part of wrap(ln)) { c.fillText(part, (w * (col + 0.5)) / cols, y); y += 42; } y += 26; }
            }
          });
          add(planeGeo(2.2, 2.2 * (560 / 1200)), glowMat(TEXT_FRAG, { uTex: { value: list }, uAlpha: { value: 0.85 }, uReveal: { value: 1 }, uTint: { value: V3(0.93, 0.9, 0.84) } }), holder, 0.02).position.y = -0.2;
        }
      }
      anchors['piece-' + it.i] = { pos: V3(it.x, it.y, it.z), w: it.w * 0.9, h: it.h };
    }
    // two pencil lines on the water mark the way
    const rail = new THREE.MeshBasicMaterial({ color: 0xd8d2c2, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(rail);
    for (const x of [-1.25, 1.25]) { const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.03, L.end - 2).rotateX(-Math.PI / 2)), rail); m.position.set(x, 0.012, 3 + (L.end - 2) / 2); group.add(m); }
    return { group, marks, L };
  }
  function destroy() {
    if (!cur) return;
    scene.remove(cur.group);
    for (let i = cur.marks.d; i < disposables.length; i++) disposables[i].dispose && disposables[i].dispose();
    disposables.length = cur.marks.d;
    for (let i = cur.marks.g; i < ctx.geos.length; i++) ctx.geos[i].dispose();
    ctx.geos.length = cur.marks.g;
    for (const k of Object.keys(anchors)) if (k.startsWith('piece-')) delete anchors[k];
    cur = null;
    LU.uPCol.value[3].set(0, 0, 0);
  }
  ctx.updaters.push(() => {
    if (!cur) return;
    // a soft light walks with the visitor, so the water lines read along the corridor
    LU.uPPos.value[3].set(0, 2.6, camera.position.z + 3.5); LU.uPRange.value[3] = 10;
    LU.uPCol.value[3].set(0.9, 0.87, 0.8).multiplyScalar(0.55);
  });
  return {
    set(on) { destroy(); if (on && GALLERY.enabled) cur = build(); },
    refit() { if (cur) { destroy(); cur = build(); } },
  };
}
