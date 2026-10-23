// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE BOOK IN THE WORLD  (a copy left on the steps, and one loose page waiting in each world)
// ═══════════════════════════════════════════════════════════════════════════════════════════
Object.assign(world, {
  // found: the visitor carries it · lift: 0 on the step .. 1 in front of the eyes · light: glow while crouching
  // print: where the finger touched the cover {u, v, r} · sheet: a loose page waits in this world · take: 0..1 flying in
  book: { found: false, lift: 0, light: 0, print: null, sheet: false, take: 0 },
});
Object.assign(world.hand, { show: false });
Object.assign(Shots, {
  /** Crouching by the steps, at arm's length from the book. */
  book(a) { return { pos: [0.88, 0.98, 1.56], target: [0.7, 0.36, 0.66], fov: a >= 1 ? 46 : 62 }; },
});
/** Where the book rests, in the elevator group's local metres: leaning on the second riser, right end of the lowest step. */
const BOOK_REST = { x: 0.7, y: 0.003, z: 0.662, tilt: -0.3, yaw: 0.3, w: 0.24, h: 0.32 };
/** Where the loose page floats in each world, as screen fractions [desktop, phone] (kept clear of the player). */
const FLOOR_PAGE_SPOT = { glass: [[0.3, 0.9], [0.14, 0.5]], default: [[0.9, 0.86], [0.14, 0.5]] };
const pageSpot = (kind, phone) => (FLOOR_PAGE_SPOT[kind] || FLOOR_PAGE_SPOT.default)[phone ? 1 : 0];

const BookArt = {
  cover: Object.assign(new Image(), { src: ASSETS.cover }),
  print: Object.assign(new Image(), { src: ASSETS.fingerR }),
  ready: (img) => img.complete && img.naturalWidth > 0,
  /** Front cover 3:4 — the album cover (centre crop), a pencil border, and the visitor's fingerprint once touched. */
  drawCover(ctx, w, h, print) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2f2a28'; ctx.fillRect(0, 0, w, h);
    const img = this.cover;
    if (this.ready(img)) { const s = img.naturalHeight, sw = s * (w / h); ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, s, 0, 0, w, h); }
    ctx.strokeStyle = 'rgba(236,233,232,0.85)'; ctx.lineWidth = Math.max(2, w * 0.014);
    ctx.strokeRect(w * 0.025, w * 0.025, w - w * 0.05, h - w * 0.05);
    if (print && this.ready(this.print)) {
      const pw = w * 0.3;
      ctx.save(); ctx.translate(print.u * w, print.v * h); ctx.rotate(print.r); ctx.globalAlpha = 0.94;
      ctx.drawImage(this.print, -pw / 2, -pw * 0.525, pw, pw * 1.05); ctx.restore();
    }
  },
  /** A loose page: outline, a folded corner, a few lines of writing. White on black (drawn as light). */
  drawSheet(ctx, w, h) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, w * 0.022); ctx.lineJoin = 'round';
    const m = w * 0.1, f = w * 0.2;
    ctx.beginPath(); ctx.moveTo(m, m); ctx.lineTo(w - m - f, m); ctx.lineTo(w - m, m + f); ctx.lineTo(w - m, h - m); ctx.lineTo(m, h - m); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - m - f, m); ctx.lineTo(w - m - f, m + f); ctx.lineTo(w - m, m + f); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, w * 0.012); ctx.globalAlpha = 0.7;
    for (let i = 0; i < 6; i++) { const y = h * (0.34 + i * 0.085); ctx.beginPath(); ctx.moveTo(m * 2, y); ctx.lineTo(w - m * 2 - (i === 5 ? w * 0.25 : 0), y); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
};

function buildBook3D(ctx) {
  const { THREE, scene, camera, LU, V3, glowMat, keep, planeGeo, anchors, disposables } = ctx;
  // ---- the copy on the steps ----
  const cc = document.createElement('canvas'); cc.width = 384; cc.height = 512;
  const cctx = cc.getContext('2d');
  const tex = new THREE.CanvasTexture(cc);
  tex.anisotropy = 8;
  let drawnKey = '';
  const redraw = () => {
    const key = JSON.stringify(world.book.print) + BookArt.ready(BookArt.cover) + BookArt.ready(BookArt.print);
    if (key === drawnKey) return;
    drawnKey = key;
    BookArt.drawCover(cctx, cc.width, cc.height, world.book.print);
    tex.needsUpdate = true;
  };
  const edge = new THREE.MeshBasicMaterial({ color: 0x8a8580 });
  const front = new THREE.MeshBasicMaterial({ map: tex });
  disposables.push(tex, edge, front);
  const book = new THREE.Mesh(keep(new THREE.BoxGeometry(BOOK_REST.w, BOOK_REST.h, 0.03)), [edge, edge, edge, edge, front, edge]);
  scene.add(book);
  const restPos = V3(BOOK_REST.x, BOOK_REST.y + CAB_LIFT, BOOK_REST.z);
  const restQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(BOOK_REST.tilt, BOOK_REST.yaw, 0.06, 'YXZ'));
  const twinkleU = { uTint: { value: V3(0.95, 0.92, 0.84) }, uAlpha: { value: 0 }, uStripes: { value: 0 } };
  const twinkle = new THREE.Mesh(planeGeo(0.3, 0.3), glowMat(HALO_FRAG, twinkleU));
  twinkle.position.copy(restPos).add(V3(0.1, 0.13, 0.05));
  scene.add(twinkle);
  anchors.book = { pos: restPos.clone(), w: 0.3, h: 0.38 };
  const tmp = { p: V3(), q: new THREE.Quaternion(), n: V3() };
  // ---- the loose page of the current world ----
  const sheetTex = ctx.canvasTex(256, 352, (c, w, hh) => BookArt.drawSheet(c, w, hh));
  const sheetU = { uTex: { value: sheetTex }, uAlpha: { value: 0 }, uReveal: { value: 1 }, uTint: { value: V3(0.93, 0.9, 0.82) } };
  const sheet = new THREE.Mesh(planeGeo(256 / 352, 1), glowMat(TEXT_FRAG, sheetU));
  sheet.visible = false;
  scene.add(sheet);
  anchors.page = { pos: V3(0, -100, 0), w: 0.3, h: 0.4 };
  let anchorSeen = null;
  const sheetBase = V3();
  let sheetH = 0.5;

  ctx.updaters.push((dt, t) => {
    const b = world.book, lobby = world.env === 0 && !world.inside;
    redraw();
    book.visible = BOOK.enabled && lobby && (!b.found || b.lift > 0.001);
    if (book.visible) {
      // from the step to the eyes
      tmp.p.set(0, -0.02, -0.5); camera.localToWorld(tmp.p);
      const k = b.lift;
      book.position.lerpVectors(restPos, tmp.p, k);
      book.position.y += Math.sin(k * Math.PI) * 0.12;
      book.quaternion.copy(restQ).slerp(camera.quaternion, k);
    }
    const tw = book.visible && !b.found && b.lift < 0.01 && !world.reduced ? Math.pow(Math.max(0, Math.sin(t * 0.9)), 14) : 0;
    twinkle.visible = tw > 0.01;
    twinkleU.uAlpha.value = tw * 0.55;
    twinkle.quaternion.copy(camera.quaternion);
    if (lobby) LU.uPCol.value[3].set(1.0, 0.95, 0.82).multiplyScalar(b.light * 1.1);
    if (lobby && b.light > 0) { LU.uPPos.value[3].set(restPos.x - 0.2, restPos.y + 0.7, restPos.z + 0.8); LU.uPRange.value[3] = 3.4; }
    // loose page
    const A = ctx.floorAnchor();
    sheet.visible = !!A && b.sheet && !world.inside;
    if (sheet.visible) {
      if (A !== anchorSeen) { anchorSeen = A; sheetBase.copy(A.pagePos); sheetH = A.pageH; }
      const k = b.take, bob = world.reduced ? 0 : Math.sin(t * 0.8) * sheetH * 0.06;
      tmp.p.set(0.16, 0.14, -0.6); camera.localToWorld(tmp.p); // toward the corner where the book is kept
      sheet.position.lerpVectors(sheetBase, tmp.p, k * k);
      sheet.position.y += bob * (1 - k);
      sheet.quaternion.copy(camera.quaternion);
      sheet.rotateZ(0.12 + Math.sin(t * 0.5) * 0.05 + k * 1.2);
      sheet.scale.setScalar(sheetH * (1 - 0.8 * k));
      sheetU.uAlpha.value = (0.75 + 0.2 * Math.sin(t * 1.7)) * (1 - k * k);
      anchors.page.pos.copy(sheetBase); anchors.page.w = sheetH * 0.9; anchors.page.h = sheetH * 1.15;
    } else { anchors.page.pos.set(0, -100, 0); anchorSeen = null; }
  });

  return {
    /** Point on the cover where the index finger lands (world space). */
    target() { tmp.n.set(0.03, 0.02, 0.02).applyQuaternion(restQ); return restPos.clone().add(tmp.n); },
  };
}
