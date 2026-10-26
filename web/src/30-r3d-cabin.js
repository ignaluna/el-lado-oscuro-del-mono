// ═══════════════════════════════════════════════════════════════════════════════════════════
// CABIN  (button panel drawing shared by 3D and 2D, 3D panel + signs + hand)
// ═══════════════════════════════════════════════════════════════════════════════════════════
/**
 * The platforms' own marks (vector paths from Simple Icons, CC0), drawn unaltered in their official colours:
 * YouTube red with the white play, Spotify green with black waves. Units: the 24-unit icon box.
 */
const LOGOS = {
  youtube: { w: 24, h: 16.91, oy: 3.545, parts: [
    ['#ff0000', 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z'],
    ['#ffffff', 'M9.545 15.568V8.432L15.818 12l-6.273 3.568z']] },
  spotify: { w: 24, h: 24, oy: 0, parts: [
    ['#000000', 'M12 1.2a10.8 10.8 0 1 0 0 21.6a10.8 10.8 0 1 0 0-21.6z'],
    ['#1ed760', 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z', 'evenodd']] },
};
/** Draws one platform mark centred on (cx, cy), `width` pixels wide. */
function drawLogo(ctx, which, cx, cy, width) {
  const L = LOGOS[which], k = width / L.w;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(cx - width / 2, cy - (L.h * k) / 2 - L.oy * k); ctx.scale(k, k);
  for (const [fill, d, rule] of L.parts) { ctx.fillStyle = fill; ctx.fill(new Path2D(d), rule || 'nonzero'); }
  ctx.restore();
}

/** Panel layout in metres, origin top-left of the 0.58 × 1.32 plate. Everything derives from `tracks`. */
const PanelLayout = {
  W: 0.58, H: 1.32,
  dial: { x: 0.29, y: 0.205, r: 0.12 },
  ask: { y: 0.292 },
  sel: { youtube: { x: 0.17, y: 0.428 }, spotify: { x: 0.41, y: 0.428 }, size: 0.105, labelY: 0.34 }, // the name, then the button with its logo
  rowsTop: 0.64, rowsBottom: 1.228,
  /** "PISOS" engraved over the rows; once the basements open, the switch between the two sections. */
  section: { y: 0.586, h: 0.078, up: 0.17, down: 0.41 },
  btnX: 0.07, numX: 0.13, titleX: 0.164, markX: 0.497,
  /** Place of floor n counted from the bottom row. Pisos: PB at the bottom, the gallery on top, as in a real cab.
   *  Subsuelos: −9 at the bottom, PB on top. */
  slot(n, down) { return n < 0 ? n + basementCount() : n === 0 && down ? basementCount() : n; },
  rowY(n, down = panelDown()) { return this.rowsBottom - this.slot(n, down) * this.rowStep(); },
  rowStep() { return Math.min(0.075, (this.rowsBottom - this.rowsTop) / Math.max(1, panelTop())); },
};

Object.assign(Tex, {
  /**
   * Button plate. 3D palette: R = engraving lit by the lamp, G = self-lit. `st` = { platform, visited, floor, hover }.
   */
  panel(ctx, w, h, pal, st) {
    fillBg(ctx, w, h, pal);
    const S = w / PanelLayout.W;
    const is3D = pal === PAL3D;
    const col = (ch, k = 1) => (is3D ? (ch === 'r' ? `rgb(${Math.round(255 * k)},0,0)` : `rgb(0,${Math.round(255 * k)},0)`) : `rgba(235,229,213,${(ch === 'r' ? 0.62 : 0.95) * k})`);
    ctx.globalCompositeOperation = pal.op;
    const stroke = (ch, k, lw) => { ctx.strokeStyle = col(ch, k); ctx.lineWidth = Math.max(1.2, lw * S); };
    const text = (str, x, y, size, font, ch, k, spacing = 0, align = 'left') => {
      ctx.fillStyle = col(ch, k); ctx.font = font(size * S); ctx.textBaseline = 'middle';
      return drawSpaced(ctx, str, x * S, y * S, spacing * S, align);
    };
    const L = PanelLayout;
    // plate border + screws
    stroke('r', 1, 0.006); ctx.strokeRect(0.012 * S, 0.012 * S, w - 0.024 * S, h - 0.024 * S);
    stroke('r', 0.7, 0.0025); ctx.strokeRect(0.024 * S, 0.024 * S, w - 0.048 * S, h - 0.048 * S);
    ctx.fillStyle = col('r', 1);
    for (const [sx, sy] of [[0.045, 0.045], [L.W - 0.045, 0.045], [0.045, L.H - 0.045], [L.W - 0.045, L.H - 0.045]]) { ctx.beginPath(); ctx.arc(sx * S, sy * S, 0.007 * S, 0, TAU); ctx.fill(); }
    // mini floor dial
    const d = L.dial;
    stroke('g', 0.75, 0.005); ctx.beginPath(); ctx.arc(d.x * S, d.y * S, d.r * S, Math.PI, TAU); ctx.stroke();
    stroke('g', 0.5, 0.003); ctx.beginPath(); ctx.moveTo((d.x - d.r) * S, d.y * S); ctx.lineTo((d.x + d.r) * S, d.y * S); ctx.stroke();
    const TOP = panelTop(), [LO, HI] = st.down ? [-basementCount(), 0] : [0, TOP];
    for (let n = LO; n <= HI; n++) {
      const a = Math.PI - ((n - LO) * Math.PI) / (HI - LO);
      const c = Math.cos(a), s = -Math.sin(a), end = n === LO || n === HI;
      stroke('g', 0.7, 0.003); ctx.beginPath(); ctx.moveTo((d.x + c * (d.r - 0.014)) * S, (d.y + s * (d.r - 0.014)) * S); ctx.lineTo((d.x + c * d.r) * S, (d.y + s * d.r) * S); ctx.stroke();
      text(floorMark(n), d.x + c * (d.r - 0.034), d.y + s * (d.r - 0.034) - (end ? 0.013 : 0), n === 0 || n > 9 || n < 0 ? 0.0155 : 0.02, FONT_CAPS, 'g', 0.85, 0, 'center');
    }
    // question + selector labels
    text('¿POR DÓNDE QUERÉS VIAJAR?', L.W / 2, L.ask.y, 0.0245, FONT_CAPS, st.platform ? 'r' : 'g', st.platform ? 0.95 : 0.9, 0.0032, 'center');
    for (const p of ['youtube', 'spotify']) {
      const b = L.sel[p], hs = L.sel.size / 2 + 0.012;
      stroke('r', 1, 0.004); ctx.strokeRect((b.x - hs) * S, (b.y - hs) * S, hs * 2 * S, hs * 2 * S);
      const on = st.platform === p, hov = st.hover === 'sel-' + p;
      text(p === 'youtube' ? COPY.youtube : COPY.spotify, b.x, L.sel.labelY, 0.0195, FONT_CAPS, 'g', on || hov ? 1 : 0.6, 0.004, 'center');
    }
    stroke('r', 0.8, 0.003); ctx.beginPath(); ctx.moveTo(0.05 * S, 0.531 * S); ctx.lineTo((L.W - 0.05) * S, 0.531 * S); ctx.stroke();
    if (!st.open) text('PISOS', L.W / 2, L.section.y - 0.012, 0.0145, FONT_CAPS, 'g', 0.5, 0.007, 'center');
    else { // the switch: the section shown is lit, the other one waits
      const hov = st.hover === 'panel-section';
      text('▲ PISOS', L.section.up, L.section.y, 0.019, FONT_CAPS, 'g', st.down ? (hov ? 0.85 : 0.5) : 1, 0.005, 'center');
      text('SUBSUELOS ▼', L.section.down, L.section.y, 0.019, FONT_CAPS, 'g', st.down ? 1 : (hov ? 0.85 : 0.5), 0.005, 'center');
      stroke('g', 0.85, 0.003); const ux = st.down ? L.section.down : L.section.up;
      ctx.beginPath(); ctx.moveTo((ux - 0.085) * S, (L.section.y + 0.02) * S); ctx.lineTo((ux + 0.085) * S, (L.section.y + 0.02) * S); ctx.stroke();
    }
    // rows (generated from the track list): the section shown
    const step = L.rowStep();
    const maxW = L.markX - 0.03 - L.titleX;
    const rowsNow = tracks.filter((t) => (st.down ? t.floor < 0 : t.floor > 0));
    const lowest = st.down ? -basementCount() : 1;
    for (const tr of rowsNow) {
      const y = L.rowY(tr.floor, st.down);
      const enabled = !!st.platform, visited = st.visited.includes(tr.floor), here = st.floor === tr.floor, hov = st.hover === 'floor-' + tr.floor;
      const ch = hov || here || enabled ? 'g' : 'r';
      const k = hov || here ? 1 : enabled ? (visited ? 0.82 : 0.68) : 0.62;
      text(floorMark(tr.floor), L.numX, y + 0.002, tr.floor < 0 ? 0.029 : 0.036, FONT_CAPS, ch, k, 0, 'center');
      const title = tr.title.toUpperCase();
      let size = Math.min(0.0235, step * 0.37);
      ctx.font = FONT_CAPS(size * S);
      const sp = 0.0016;
      const width = (str) => ([...str].reduce((a, c) => a + ctx.measureText(c).width, 0) + sp * S * (str.length - 1)) / S;
      if (width(title) <= maxW) text(title, L.titleX, y + 0.001, size, FONT_CAPS, ch, k, sp);
      else {
        const words = title.split(' ');
        let best = 1, bestDiff = 1e9;
        for (let i = 1; i < words.length; i++) { const dlt = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (dlt < bestDiff) { bestDiff = dlt; best = i; } }
        const l1 = words.slice(0, best).join(' '), l2 = words.slice(best).join(' ');
        size = Math.min(size * 0.82, step * 0.27);
        ctx.font = FONT_CAPS(size * S);
        const fit = Math.min(1, maxW / Math.max(width(l1), width(l2)));
        size *= fit;
        text(l1, L.titleX, y - size * 0.62, size, FONT_CAPS, ch, k, sp);
        text(l2, L.titleX, y + size * 0.62, size, FONT_CAPS, ch, k, sp);
      }
      if (visited) { // a small fingerprint: this floor has been touched
        ctx.strokeStyle = col('g', 0.95); ctx.lineWidth = Math.max(1.2, 0.0022 * S);
        for (let q = 1; q <= 3; q++) { ctx.beginPath(); ctx.ellipse(L.markX * S, y * S, q * 0.0052 * S, q * 0.0068 * S, 0.3, q === 1 ? 0 : -2.4, q === 1 ? TAU : 2.0); ctx.stroke(); }
      }
      if (st.down ? tr.floor > lowest : tr.floor < TOP) { stroke('r', 0.3, 0.0018); ctx.beginPath(); ctx.moveTo(L.titleX * S, (y - step / 2) * S); ctx.lineTo((L.W - 0.04) * S, (y - step / 2) * S); ctx.stroke(); }
      if (st.solved && st.solved.includes(tr.id)) { // a chapter found here: a small open book beside the number
        stroke('g', 0.9, 0.0022); const bx = L.markX + 0.033, by = y;
        ctx.beginPath(); ctx.moveTo((bx - 0.012) * S, (by - 0.006) * S); ctx.quadraticCurveTo((bx - 0.006) * S, (by - 0.009) * S, bx * S, (by - 0.005) * S);
        ctx.quadraticCurveTo((bx + 0.006) * S, (by - 0.009) * S, (bx + 0.012) * S, (by - 0.006) * S); ctx.lineTo((bx + 0.012) * S, (by + 0.007) * S);
        ctx.quadraticCurveTo((bx + 0.006) * S, (by + 0.004) * S, bx * S, (by + 0.008) * S); ctx.quadraticCurveTo((bx - 0.006) * S, (by + 0.004) * S, (bx - 0.012) * S, (by + 0.007) * S);
        ctx.closePath(); ctx.moveTo(bx * S, (by - 0.005) * S); ctx.lineTo(bx * S, (by + 0.008) * S); ctx.stroke();
      }
    }
    if (GALLERY.enabled && !st.down) { // the gallery: the floor above the songs (needs no platform either)
      const y = L.rowY(GALLERY_FLOOR), here = st.floor === GALLERY_FLOOR, hov = st.hover === 'floor-' + GALLERY_FLOOR;
      const ch = 'g', k = hov || here ? 1 : 0.68;
      text(String(GALLERY_FLOOR), L.numX, y + 0.002, GALLERY_FLOOR > 9 ? 0.028 : 0.036, FONT_CAPS, ch, k, 0, 'center');
      text(GALLERY.label, L.titleX, y + 0.001, Math.min(0.0235, step * 0.37), FONT_CAPS, ch, k, 0.0016);
    }
    { // PB: back to the entrance (needs no platform)
      const y = L.rowY(0, st.down), here = st.floor === 0, hov = st.hover === 'floor-0';
      const ch = 'g', k = hov || here ? 1 : 0.68;
      text('PB', L.numX, y + 0.002, 0.024, FONT_CAPS, ch, k, 0, 'center');
      text(COPY.lobby, L.titleX, y + 0.001, Math.min(0.0235, step * 0.37), FONT_CAPS, ch, k, 0.0016);
      const ly = st.down ? y + step / 2 : y - step / 2;
      stroke('r', 0.3, 0.0018); ctx.beginPath(); ctx.moveTo(L.titleX * S, ly * S); ctx.lineTo((L.W - 0.04) * S, ly * S); ctx.stroke();
    }
    text('MONOS DEL AMBIENTE · EL LADO OSCURO DEL MONO', L.W / 2, 1.277, 0.0105, FONT_CAPS, 'r', 0.7, 0.0022, 'center');
  },

  /** Small enamel sign 0.44 × 0.11 m. */
  sign(ctx, w, h, pal, str) {
    fillBg(ctx, w, h, pal);
    const S = w / 0.44;
    const p = makePen(ctx, pal, S);
    p.rect(0.008 * S, 0.008 * S, w - 0.016 * S, h - 0.016 * S, 0.004, 'r');
    for (const [sx, sy] of [[0.02, 0.02], [0.42, 0.02], [0.02, 0.09], [0.42, 0.09]]) p.dot(sx * S, sy * S, 0.004 * S, 'r');
    let size = 0.026;
    ctx.font = FONT_CAPS(size * S);
    const wd = [...str].reduce((a, c) => a + ctx.measureText(c).width, 0) + 0.003 * S * (str.length - 1);
    if (wd > 0.38 * S) size *= (0.38 * S) / wd;
    p.text(str, w / 2, h / 2 + 0.002 * S, size, FONT_CAPS, 'r', 0.003 * (size / 0.026));
  },
});

const CABIN_SIGNS = ['CAPACIDAD MÁX.: 5 MONOS', 'PROHIBIDO DAR DE COMER A LOS MÚSICOS', 'ÚLTIMA INSPECCIÓN: NUNCA'];

function buildCabin3D(ctx) {
  const { THREE, camera, interior, V3, ink, glowMat, canvasTex, keep, boxGeo, planeGeo, add, faceUV, flatUV, anchors, disposables } = ctx;
  const L = PanelLayout;
  const PX = Shots.PANEL[0], PY = Shots.PANEL[1], ZF = -0.276; // plate centre and its visible (−Z) face
  /** Plate texture coordinates (metres from the top-left) → world position on the plate face. */
  const onPlate = (tx, ty, lift = 0) => V3(PX + L.W / 2 - tx, PY + L.H / 2 - ty, ZF - lift);
  /** Local (elevator group) → world: the whole elevator stands on its steps. */
  const lifted = (v) => { v.y += CAB_LIFT; return v; };

  // ---- plate with a live canvas texture ----
  const pc = document.createElement('canvas'); pc.width = 1024; pc.height = Math.round((1024 * L.H) / L.W);
  const pctx = pc.getContext('2d');
  const texPanel = new THREE.CanvasTexture(pc);
  texPanel.anisotropy = 8; texPanel.generateMipmaps = true; texPanel.minFilter = THREE.LinearMipmapLinearFilter;
  disposables.push(texPanel);
  let panelKey = '';
  function redrawPanel(force) {
    const st = { platform: world.platform, visited: world.visited, floor: world.floor, hover: world.hover, down: panelDown(), open: Progress.basementsOpen(),
      solved: Progress.debug().solved };
    const key = JSON.stringify(st);
    if (key === panelKey && !force) return;
    panelKey = key;
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    Tex.panel(pctx, pc.width, pc.height, PAL3D, st);
    texPanel.needsUpdate = true;
  }
  const mPlate = ink({ interior: true, base: '#33291a', map: texPanel, glow: 0.95, rim: 0.3 });
  {
    const g = boxGeo(L.W, L.H, 0.022); flatUV(g, 0.5, 0.001); faceUV(g, 5, 0, 0, 1, 1);
    add(g, mPlate, PX, PY, -0.266, interior);
  }

  // ---- buttons ----
  const controls = {}; // id -> { mesh, mat, base: z, accent: [r,g,b], ring }
  const mBezel = ink({ interior: true, base: '#5a4d33', engrave: 0.9, freq: 40, axis: 0, rim: 1.0 });
  const capGeo = keep(new THREE.CylinderGeometry(0.0255, 0.0255, 0.02, 28).rotateX(Math.PI / 2));
  const bezelGeo = keep(new THREE.TorusGeometry(0.03, 0.0048, 10, 32));
  const ringGeo = planeGeo(0.13, 0.13);
  const rowParts = {}; // floor -> the meshes of its button, moved or hidden when the panel changes section
  for (const tr of panelAllRows()) { // PB, the record, the gallery, the basements
    const p = onPlate(L.btnX, L.rowY(tr.floor, false), 0.006);
    const mat = ink({ interior: true, base: '#201c15', engrave: 0.38, freq: 8, axis: 1, rim: 0.9 });
    const mesh = add(capGeo, mat, p.x, p.y, p.z, interior);
    const bezel = add(bezelGeo, mBezel, p.x, p.y, ZF - 0.002, interior);
    const ringU = { uTint: { value: V3(...hex3(tr.visualAccent)) }, uAlpha: { value: 0 }, uStripes: { value: 0 } };
    const ring = add(ringGeo, glowMat(HALO_FRAG, ringU), p.x, p.y, ZF - 0.02, interior);
    ring.rotation.y = Math.PI;
    controls['floor-' + tr.floor] = { mesh, mat, base: p.z, accent: hex3(tr.visualAccent), ringU, sink: 0.007 };
    rowParts[tr.floor] = [mesh, bezel, ring];
  }
  const OFF = V3(0, -100, 0); // where the anchors of the hidden section wait
  let sectionKey = '';
  /** Puts the buttons of the section shown in their rows and hides the others (their hotspots go with them). */
  function placeRows() {
    const down = panelDown(), key = String(down) + Progress.basementsOpen();
    if (key === sectionKey) return;
    sectionKey = key;
    const shown = new Set(panelRows().map((r) => r.floor));
    for (const [f, parts] of Object.entries(rowParts)) {
      const n = Number(f), on = shown.has(n), y = L.rowY(n, down), p = onPlate(L.btnX, y, 0.006);
      for (const m of parts) { m.visible = on; m.position.y = p.y; }
      anchors['floor-' + n] = { pos: on ? lifted(onPlate(0.2695, y)) : OFF.clone(), w: 0.509, h: Math.max(0.05, L.rowStep() - 0.002) };
    }
    anchors['panel-section'] = { pos: Progress.basementsOpen() ? lifted(onPlate(L.W / 2, L.section.y)) : OFF.clone(), w: 0.46, h: L.section.h };
  }
  placeRows();
  const selGeo = boxGeo(L.sel.size, L.sel.size, 0.024);
  for (const p of ['youtube', 'spotify']) {
    const b = L.sel[p];
    const pos = onPlate(b.x, b.y, 0.008);
    const mat = ink({ interior: true, base: '#2a251b', engrave: 0.55, freq: 9, axis: 1, rim: 0.9 });
    const mesh = add(selGeo, mat, pos.x, pos.y, pos.z, interior);
    { // the platform's mark on the button face: it sinks with the button
      const tex = canvasTex(256, 256, (g, w, hh) => drawLogo(g, p, w / 2, hh / 2, w * (p === 'youtube' ? 0.9 : 0.76)));
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      disposables.push(m);
      const logo = new THREE.Mesh(planeGeo(0.084, 0.084), m);
      logo.position.set(0, 0, -0.0125); logo.rotation.y = Math.PI;
      mesh.add(logo);
      world.panelLogos = ['youtube', 'spotify'].indexOf(p) + 1; // read by the checks
    }
    const ringU = { uTint: { value: V3(0.95, 0.9, 0.76) }, uAlpha: { value: 0 }, uStripes: { value: 0 } };
    const ring = add(planeGeo(0.3, 0.3), glowMat(HALO_FRAG, ringU), pos.x, pos.y, ZF - 0.024, interior);
    ring.rotation.y = Math.PI;
    // pilot lamp
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    disposables.push(lampMat);
    const lp = onPlate(b.x + (p === 'youtube' ? -0.068 : 0.068), b.y + 0.062, 0.003);
    const lamp = add(keep(new THREE.CircleGeometry(0.006, 12)), lampMat, lp.x, lp.y, lp.z, interior);
    lamp.rotation.y = Math.PI;
    controls['sel-' + p] = { mesh, mat, base: pos.z, accent: [0.95, 0.9, 0.76], ringU, sink: 0.007, lampMat, lampCol: p === 'youtube' ? [0.77, 0.33, 0.25] : [0.36, 0.62, 0.42] };
    anchors['sel-' + p] = { pos: lifted(onPlate(b.x, b.y - 0.026)), w: 0.2, h: 0.2 }; // the name and the button
  }
  // mini dial needle + direction lamps
  const miniNeedle = new THREE.Group();
  {
    const p = onPlate(L.dial.x, L.dial.y, 0.004);
    miniNeedle.position.copy(p);
    const g = boxGeo(L.dial.r - 0.022, 0.005, 0.002); g.translate((L.dial.r - 0.022) / 2, 0, 0);
    const m = new THREE.MeshBasicMaterial({ color: 0xf2ecdc });
    disposables.push(m);
    miniNeedle.add(new THREE.Mesh(g, m));
    interior.add(miniNeedle);
  }
  const arrows = [];
  for (const dir of [1, -1]) {
    const m = new THREE.MeshBasicMaterial({ color: 0x1a1712 });
    disposables.push(m);
    const tri = keep(new THREE.BufferGeometry());
    const s = 0.018 * dir;
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.016, -s * 0.6, 0, 0.016, -s * 0.6, 0, 0, s * 0.9, 0], 3));
    const p = onPlate(dir > 0 ? 0.075 : L.W - 0.075, 0.17, 0.003);
    const mesh = add(tri, m, p.x, p.y, p.z, interior);
    m.side = THREE.DoubleSide;
    arrows.push({ m, dir });
  }
  // enamel signs on the other side of the door
  CABIN_SIGNS.forEach((str, i) => {
    const tex = canvasTex(704, 176, (c, w, hh) => Tex.sign(c, w, hh, PAL3D, str));
    const m = add(planeGeo(0.44, 0.11), ink({ interior: true, base: '#0c0c0f', map: tex, rim: 0.2 }), 0.9, 2.02 - i * 0.145, -0.2585, interior);
    m.rotation.y = Math.PI;
  });

  // ---- hand (right forearm, camera space, never reflected) ----
  const hand = new THREE.Group();
  camera.add(hand);
  const skin = ink({ interior: true, base: '#4b453c', line: '#e6dfcd', engrave: 0.8, freq: 6, axis: 1, rim: 1.0, wobble: 0.04 });
  const cloth = ink({ interior: true, base: '#17171c', line: '#77736a', engrave: 0.22, freq: 22, axis: 1, rim: 1.1, wobble: 0.3 });
  const cuff = ink({ interior: true, base: '#9a9382', engrave: 0.9, freq: 2, axis: 1, rim: 0.6 });
  const segMesh = (len, r, mat) => { const g = keep(new THREE.CapsuleGeometry(r, len, 5, 12)); g.rotateX(-Math.PI / 2); g.translate(0, 0, -len / 2); return new THREE.Mesh(g, mat); };
  {
    const palm = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.045, 0.052, 6, 16).rotateX(-Math.PI / 2)), skin);
    palm.scale.set(1, 0.36, 1); palm.position.set(0, 0, -0.05);
    hand.add(palm);
    const wrist = segMesh(0.05, 0.03, skin); wrist.position.set(0, 0, 0.045); wrist.scale.set(1.15, 0.72, 1);
    hand.add(wrist);
    const arm = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.062, 0.041, 0.62, 16).rotateX(Math.PI / 2)), cloth);
    arm.position.set(0.004, -0.004, 0.345);
    hand.add(arm);
    const cf = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.0445, 0.043, 0.03, 16).rotateX(Math.PI / 2)), cuff);
    cf.position.set(0.002, -0.002, 0.045);
    hand.add(cf);
  }
  function finger(x, y, z, lens, r, yaw = 0, roll = 0) {
    const joints = [];
    let parent = new THREE.Group();
    parent.position.set(x, y, z); parent.rotation.set(0, yaw, roll);
    hand.add(parent);
    lens.forEach((len, i) => {
      const j = new THREE.Group();
      if (i) j.position.z = -lens[i - 1];
      parent.add(j);
      j.add(segMesh(len, r * (1 - i * 0.09), skin));
      joints.push(j);
      parent = j;
    });
    return joints;
  }
  const fingers = {
    i: finger(-0.031, 0.002, -0.094, [0.046, 0.028, 0.023], 0.0108),
    m: finger(-0.0095, 0.003, -0.098, [0.05, 0.031, 0.024], 0.0112),
    r: finger(0.0115, 0.002, -0.095, [0.046, 0.029, 0.023], 0.0106),
    p: finger(0.031, 0, -0.088, [0.036, 0.022, 0.02], 0.0094),
    t: finger(-0.042, -0.006, -0.022, [0.04, 0.032, 0.026], 0.0125, 0.85, 0.5),
  };
  const POSE = {
    relaxed: { i: [0.22, 0.34, 0.24], m: [0.34, 0.44, 0.3], r: [0.42, 0.5, 0.32], p: [0.5, 0.52, 0.34], t: [0.12, 0.22, 0.18] },
    point: { i: [0.03, 0.05, 0.06], m: [1.2, 1.42, 1.0], r: [1.28, 1.46, 1.04], p: [1.3, 1.4, 1.0], t: [0.42, 0.62, 0.55] },
  };
  const HS = 1.3; // drawn slightly larger than life: it has to read at arm's length
  hand.scale.setScalar(HS);
  hand.traverse((o) => o.layers.set(1));
  const hv = { idle: V3(), wrist: V3(), dir: V3(), aim: V3(), tl: V3(), elbow: V3(0.33, -0.56, 0.22), q: new THREE.Quaternion(), qr: new THREE.Quaternion(), m: new THREE.Matrix4(), o: V3(), up: V3(0, 1, 0), off: V3(), z: V3(0, 0, 1) };
  const TIP = 0.094 + 0.046 + 0.028 + 0.023 + 0.008;
  function updateHand(dt, t) {
    const hd = world.hand;
    hand.visible = world.inside || hd.show; // also outside, to pick up the book
    if (!hand.visible) return;
    const tanH = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
    const breathe = world.reduced ? 0 : Math.sin(t * 1.13 + 0.6) * 0.004;
    const narrow = camera.aspect < 1; // on phones the resting hand stays almost out of frame
    hv.idle.set(Math.min(0.3, 0.44 * tanH * 0.9), (narrow ? -0.5 : -0.43) + 0.035 * hd.lift + breathe, -0.44);
    hv.dir.set(-0.2, (narrow ? 0.16 : 0.36) + 0.1 * hd.lift, -1).normalize();
    let reach = 0;
    if (hd.target) {
      reach = hd.reach;
      hv.tl.copy(hd.target); camera.worldToLocal(hv.tl);
      hv.aim.copy(hv.tl).sub(hv.elbow).normalize();
      // fingertip stops 1.5 cm short, then travels in with the press
      hv.tl.addScaledVector(hv.aim, -0.016 * (1 - hd.press) + 0.004 * hd.press);
      hv.wrist.copy(hv.tl).addScaledVector(hv.aim, -TIP * HS);
      hv.wrist.lerpVectors(hv.idle, hv.wrist, reach);
      hv.wrist.y += Math.sin(reach * Math.PI) * 0.028; // slight arc
      hv.dir.lerp(hv.aim, reach).normalize();
    } else hv.wrist.copy(hv.idle);
    hv.m.lookAt(hv.o, hv.dir, hv.up);
    hv.q.setFromRotationMatrix(hv.m);
    hv.qr.setFromAxisAngle(hv.z, lerp(-0.5, -0.32, reach)); // thumb side slightly up
    hv.q.multiply(hv.qr);
    hand.quaternion.copy(hv.q);
    hv.off.set(0.031 * HS * reach, 0, 0).applyQuaternion(hv.q); // put the index (not the palm centre) on the target
    hand.position.copy(hv.wrist).add(hv.off);
    const pt = clamp(Math.max(hd.point, hd.lift * 0.45));
    for (const k of ['i', 'm', 'r', 'p', 't']) {
      fingers[k].forEach((j, n) => {
        let c = lerp(POSE.relaxed[k][n], POSE.point[k][n], pt);
        if (k === 'i' && n === 2) c += 0.1 * hd.press;
        if (!world.reduced) c += Math.sin(t * 0.9 + n + k.charCodeAt(0)) * 0.012 * (1 - pt);
        j.rotation.x = -c;
      });
    }
  }

  ctx.updaters.push((dt, t) => {
    placeRows();
    redrawPanel(false);
    for (const id in controls) {
      const c = controls[id];
      const pressed = world.pressed[id] || 0, lit = world.lit[id] || 0;
      c.mesh.position.z = c.base + pressed * c.sink;
      let glow = lit;
      if (id.startsWith('sel-')) {
        const on = world.platform === id.slice(4) ? 1 : 0;
        const pulse = world.refuse > 0 ? world.refuse * (0.5 + 0.5 * Math.sin(t * 18)) : (world.platform ? 0 : 0.16 + 0.1 * Math.sin(t * 2.2));
        glow = Math.max(lit, on, pulse);
        c.lampMat.color.setRGB(c.lampCol[0] * (0.12 + on * 0.88), c.lampCol[1] * (0.12 + on * 0.88), c.lampCol[2] * (0.12 + on * 0.88));
      } else {
        const n = Number(id.slice(6));
        const free = !trackOf(n); // PB and the gallery need no platform
        const hov = world.hover === id && (world.platform || free) ? 0.3 : 0;
        const here = world.floor === n ? 0.5 : 0;
        const seen = world.visited.includes(n) ? 0.16 : 0;
        const idle = world.platform || free ? 0.07 : 0;
        glow = Math.max(lit, hov, here, seen, idle);
      }
      c.mat.uniforms.uEmissive.value.set(c.accent[0], c.accent[1], c.accent[2]).multiplyScalar(glow * 0.85);
      c.ringU.uAlpha.value = glow * 0.5;
    }
    const [LO, HI] = panelRange();
    miniNeedle.rotation.z = Math.PI - ((clamp(world.needle, LO, HI) - LO) * Math.PI) / (HI - LO); // the plate faces −Z: the Y flip below mirrors it back
    miniNeedle.rotation.y = Math.PI;
    for (const a of arrows) { const on = world.arrow === a.dir ? 1 : 0; a.m.color.setRGB(0.1 + on * 0.85, 0.09 + on * 0.8, 0.07 + on * 0.62); }
    updateHand(dt, t);
  });

  return {
    /** World position where the index fingertip must land to press control `id`. */
    target(id) {
      if (id === 'panel-section') return lifted(onPlate(panelDown() ? L.section.up : L.section.down, L.section.y, 0.004));
      const a = id.startsWith('sel-') ? L.sel[id.slice(4)] : { x: L.btnX, y: L.rowY(Number(id.slice(6))) };
      return lifted(onPlate(a.x, a.y, id.startsWith('sel-') ? 0.021 : 0.017));
    },
    redrawPanel,
  };
}
