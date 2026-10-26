// ═══════════════════════════════════════════════════════════════════════════════════════════
// RENDERER 2D  (Canvas2D fallback: same world state, frontal elevations of the same drawings)
// ═══════════════════════════════════════════════════════════════════════════════════════════
function createRenderer2D() {
  const stage = $('#stage');
  const canvas = h('canvas', {});
  stage.append(canvas);
  const g = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1;
  const IV = (a) => `rgba(235,229,213,${a})`;
  const sprite = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(hh)); const x = c.getContext('2d'); draw(x, c.width, c.height); return c; };
  const PPM = 230; // sprite pixels per metre
  const spr = {
    front: sprite(1.7 * PPM, 3.95 * PPM, (c, w, hh) => Tex.coverFront(c, w, hh, PAL2D)),
    leafL: sprite(0.6 * PPM, 2.25 * PPM, (c, w, hh) => Tex.coverLeaf(c, w, hh, PAL2D, false)),
    leafR: sprite(0.6 * PPM, 2.25 * PPM, (c, w, hh) => Tex.coverLeaf(c, w, hh, PAL2D, true)),
    call: sprite(0.3 * PPM * 1.5, 0.52 * PPM * 1.5, (c, w, hh) => Tex.coverCall(c, w, hh, PAL2D)),
    plate: sprite(0.34 * PPM * 1.5, 0.52 * PPM * 1.5, (c, w, hh) => Tex.galleryPlate(c, w, hh, PAL2D)),
    printL: Object.assign(new Image(), { src: ASSETS.fingerL }),
    printR: Object.assign(new Image(), { src: ASSETS.fingerR }),
    noise: sprite(180, 180, (c, w, hh) => { const im = c.createImageData(w, hh); for (let i = 0; i < w * hh; i++) { const v = Math.random() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 26; } c.putImageData(im, 0, 0); }),
  };
  let panelSpr = null, panelKey = '';
  function panelSprite(px) {
    const st = { platform: world.platform, visited: world.visited, floor: world.floor, hover: world.hover, down: panelDown(), open: Progress.basementsOpen(),
      solved: Progress.debug().solved };
    const key = JSON.stringify(st) + Math.round(px);
    if (key !== panelKey) { panelKey = key; panelSpr = sprite(px, (px * PanelLayout.H) / PanelLayout.W, (c, w, hh) => Tex.panel(c, w, hh, PAL2D, st)); }
    return panelSpr;
  }
  const rays = (() => { const r = mulberry32(19); return Array.from({ length: 30 }, () => { const sx = (r() - 0.5) * 1.05, sy = 0.4 + r() * 1.95, L = 2.2 + r() * 3.2; return { sx, sy, dx: (sx * 1.6 + (r() - 0.5) * 1.6) * L * 0.5, dy: (0.25 + r() * 0.5 - (sy - 1.3) * 0.3) * L * 0.5, w: 0.01 + r() * 0.02 }; }); })();
  const bookSpr = sprite(192, 256, () => {});
  let bookKey = '';
  const rips = [];
  const rects = {}; // hotspot rectangles of the last frame
  const dots = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 0.3 + Math.random() * 0.7, p: i }));

  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }

  function textGlow(str, x, y, font, color, spacing = 0, align = 'center') {
    g.font = font; g.textBaseline = 'middle'; g.fillStyle = color;
    g.save(); g.shadowColor = IV(0.5); g.shadowBlur = 14; drawSpaced(g, str, x, y, spacing, align); g.restore();
  }

  function water(base, tint, t) {
    const n = 26;
    for (let k = 1; k <= n; k++) {
      const f = Math.pow(k / n, 1.9);
      const y = base + (H - base) * f;
      g.strokeStyle = `rgba(${tint},${0.03 + 0.1 * f})`; g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= W; x += 24) { let yy = y + Math.sin(x * 0.012 + t * 0.4 + k) * 1.2 * f; for (const r of rips) { const age = t - r.t; const d = Math.hypot(x - r.x, (y - r.y) * 3.2); const wv = d - age * 60; yy += Math.cos(wv * 0.09) * Math.exp(-(wv * wv) / 1800) * r.a * 5 * Math.exp(-age * 0.4); } if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.stroke();
    }
    while (rips.length && t - rips[0].t > 9) rips.shift();
  }

  function drawExterior(dt, t) {
    const w = world, a = W / H;
    const spawnZ = Shots.spawn(a).pos[2];
    const zoom = clamp(spawnZ / Math.max(1.4, w.cam.z), 1, 5.5);
    const u = Math.min((H * 0.44) / 3.85, (W * 0.8) / 3.4) * zoom; // px per metre
    const par = world.reduced ? 0 : 1;
    const cx = W / 2 - (look.yaw * 520 + look.walkX * 40) * par - w.cam.x * u * 0.5;
    const base = H * 0.79 + (zoom - 1) * H * 0.33 + look.pitch * 300 * par;
    const X = (m) => cx + m * u, Y = (m) => base - m * u;
    const sx = w.reduced ? 0 : (Math.sin(t * 61) * w.shake + Math.sin(t * 47) * w.shake) * 900;
    g.save(); g.translate(sx, sx * 0.6);
    water(base, '235,229,213', t);
    // light on the water + broken reflection
    if (w.spill > 0.01) { const gr = g.createLinearGradient(0, base, 0, base + H * 0.3 * w.spill); gr.addColorStop(0, `rgba(242,214,160,${0.2 * w.spill * w.lamp})`); gr.addColorStop(1, 'rgba(242,214,160,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(X(-0.6), base); g.lineTo(X(0.6), base); g.lineTo(X(2.2), base + H * 0.3); g.lineTo(X(-2.2), base + H * 0.3); g.fill(); }
    // elevator of the cover: arched body on three steps, sketched in white pencil
    const LY = (m) => Y(m + CAB_LIFT); // elevator-local metres → screen
    const body = () => {
      g.fillStyle = '#1d1a19';
      g.beginPath(); g.moveTo(X(-0.85), LY(-0.35)); g.lineTo(X(-0.85), LY(2.75)); g.arc(X(0), LY(2.75), 0.85 * u, Math.PI, 0); g.lineTo(X(0.85), LY(-0.35)); g.closePath(); g.fill();
      // interior behind the doors
      const lampA = w.lamp;
      g.fillStyle = lampA > 0.01 ? `rgb(${Math.round(34 + 190 * lampA)},${Math.round(30 + 160 * lampA)},${Math.round(26 + 105 * lampA)})` : '#151312';
      g.fillRect(X(-0.6), LY(2.5), 1.2 * u, 2.25 * u);
      g.save(); g.beginPath(); g.rect(X(-0.6), LY(2.5), 1.2 * u, 2.25 * u); g.clip();
      const s = 0.585 * w.doors;
      g.fillStyle = '#1f1c1b';
      g.fillRect(X(-0.6 - s), LY(2.5), 0.6 * u, 2.25 * u); g.fillRect(X(s), LY(2.5), 0.6 * u, 2.25 * u);
      g.drawImage(spr.leafL, X(-0.6 - s), LY(2.5), 0.6 * u, 2.25 * u); g.drawImage(spr.leafR, X(s), LY(2.5), 0.6 * u, 2.25 * u);
      g.restore();
      g.drawImage(spr.front, X(-0.85), LY(3.6), 1.7 * u, 3.95 * u);
      // steps
      for (const [top, grow] of [[-0.15, 0.06], [0.05, 0.03], [0.25, 0]]) {
        g.fillStyle = '#211e1d'; g.fillRect(X(-0.95 - grow), LY(top), (1.9 + 2 * grow) * u, 0.2 * u);
        g.strokeStyle = IV(0.85); g.lineWidth = Math.max(1.2, u * 0.016); g.strokeRect(X(-0.95 - grow), LY(top), (1.9 + 2 * grow) * u, 0.2 * u);
      }
    };
    body();
    // reflection: flipped copy, broken by drifting gaps
    g.save(); g.beginPath(); g.rect(0, base, W, H - base); g.clip();
    g.globalAlpha = 0.18; g.translate(0, base * 2); g.scale(1, -1); body(); g.restore();
    g.fillStyle = 'rgba(43,39,37,0.5)';
    for (let y = base; y < H; y += 9) g.fillRect(0, y + ((t * 6 + y * 0.37) % 9) * 0.3, W, 2.2 + 2 * Math.sin(y * 0.21 + t * 0.6));
    // prism beam of the cover
    const beam = w.spill * w.lamp;
    if (beam > 0.01) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const r of rays) {
        const x0 = X(r.sx), y0 = LY(r.sy), x1 = x0 + r.dx * u * beam, y1 = y0 + r.dy * u * beam;
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, 'rgba(190,184,108,0)'); gr.addColorStop(0.08, `rgba(190,184,108,${0.34 * beam})`); gr.addColorStop(0.26, `rgba(190,184,108,${0.34 * beam})`);
        ['255,90,78', '255,170,66', '250,220,80', '95,224,122', '90,168,255', '150,120,255'].forEach((c, i) => gr.addColorStop(0.3 + i * 0.05, `rgba(${c},${0.5 * beam})`));
        gr.addColorStop(0.62, `rgba(190,184,108,${0.26 * beam})`); gr.addColorStop(1, 'rgba(190,184,108,0)');
        g.strokeStyle = gr; g.lineWidth = Math.max(1, u * r.w); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      g.restore();
    }
    // light line around the door, seam, call plate
    if (w.line > 0.001) {
      const tot = 2.85, len = w.line * tot;
      g.strokeStyle = `rgba(250,240,214,${0.9 * w.lineFade})`; g.lineWidth = Math.max(2, u * 0.03); g.shadowColor = 'rgba(250,240,214,0.9)'; g.shadowBlur = 14;
      for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(X(sg * 0.612), LY(0.25)); g.lineTo(X(sg * 0.612), LY(0.25 + Math.min(len, 2.25))); if (len > 2.25) g.lineTo(X(sg * (0.612 - (len - 2.25))), LY(2.5)); g.stroke(); }
      g.shadowBlur = 0;
    }
    const seam = w.seam * (1 - smooth(0.02, 0.2, w.doors));
    if (seam > 0.01) { g.strokeStyle = `rgba(250,240,214,${0.9 * (1 + w.flare)})`; g.lineWidth = Math.max(1.5, u * 0.02); g.beginPath(); g.moveTo(X(0), LY(0.25)); g.lineTo(X(0), LY(0.25 + 2.25 * seam)); g.stroke(); }
    g.drawImage(spr.call, X(1.17), LY(1.56), 0.3 * u, 0.52 * u);
    const pulse = w.called ? 1 : 0.3 + 0.2 * Math.sin(t * Math.PI);
    g.fillStyle = `rgba(245,236,210,${pulse * 0.35})`; g.beginPath(); g.arc(X(1.32), LY(1.39), 0.09 * u, 0, TAU); g.fill();
    rects.call = { x: X(1.14), y: LY(1.59), w: 0.36 * u, h: 0.58 * u };
    rects.elevator = { x: X(-0.65), y: LY(2.55), w: 1.3 * u, h: 2.35 * u };
    if (GALLERY.enabled) { // the inscription that leads to the gallery
      g.drawImage(spr.plate, X(-1.53), LY(1.56), 0.34 * u, 0.52 * u);
      rects.gallery = { x: X(-1.56), y: LY(1.59), w: 0.4 * u, h: 0.58 * u };
    }
    // the book left on the steps
    if (BOOK.enabled && (!w.book.found || w.book.lift > 0.001)) {
      const key = JSON.stringify(w.book.print) + BookArt.ready(BookArt.cover);
      if (key !== bookKey) { bookKey = key; BookArt.drawCover(bookSpr.getContext('2d'), bookSpr.width, bookSpr.height, w.book.print); }
      const k = w.book.lift, bw = 0.24 * u * (1 + k * 2.2), bh = bw * (4 / 3);
      const bx = lerp(X(0.7), W / 2, k), by = lerp(LY(0.0), H / 2, k);
      g.save(); g.translate(bx, by); g.rotate(-0.1 * (1 - k)); g.drawImage(bookSpr, -bw / 2, -bh / 2, bw, bh); g.restore();
      rects.book = { x: bx - bw / 2 - 4, y: by - bh / 2 - 4, w: bw + 8, h: bh + 8 };
    }
    // the fingerprints that hold the cover
    if (zoom < 1.3) {
      const ps = Math.min(H * 0.27, W * 0.2);
      [[spr.printL, a < 0.8 ? 0.06 : 0.2, a < 0.8 ? 0.78 : 0.63, 0.22], [spr.printR, a < 0.8 ? 0.95 : 0.8, a < 0.8 ? 0.46 : 0.56, -0.3]].forEach(([img, fx, fy, rot]) => {
        if (!img.complete || !img.naturalWidth) return;
        g.save(); g.globalAlpha = 0.92; g.translate(W * fx - (look.yaw * 300) * par, H * fy); g.rotate(rot); g.drawImage(img, -ps / 2, -ps * 0.525, ps, ps * 1.05); g.restore();
      });
    }
    // countdown + messages
    const cd = w.countdown, portrait = a < 0.8;
    const cy = H * (portrait ? 0.22 : 0.2) + (zoom - 1) * -H;
    if (cd.alpha > 0.01 && zoom < 1.5) {
      const size = Math.min(H * (portrait ? 0.075 : 0.105), W * (portrait ? 0.16 : 0.07));
      const groups = [['d', cd.d], ['h', cd.h], ['m', cd.m], ['s', cd.s]];
      const gw = size * 1.5, gap = size * 0.55;
      groups.forEach(([k, v], i) => {
        const col = portrait ? i % 2 : i, row = portrait ? Math.floor(i / 2) : 0, cols = portrait ? 2 : 4;
        const x = W / 2 + (col - (cols - 1) / 2) * (gw + gap), y = cy + row * size * 1.75 - (portrait ? size * 0.85 : 0);
        const dim = k === 's' ? 1 : lerp(1, 0.3, cd.last10);
        textGlow(v, x, y, FONT_DISPLAY(size * (k === 's' ? 1 + 0.3 * cd.last10 : 1), '', 400), IV(0.95 * cd.alpha * cd.dim * dim));
        textGlow(COPY.units[k], x, y + size * 0.72, FONT_CAPS(size * 0.15), IV(0.6 * cd.alpha * cd.dim * dim), size * 0.05);
      });
    }
    const subY = cy + (portrait ? Math.min(H * 0.075, W * 0.16) * 2.4 : Math.min(H * 0.105, W * 0.07) * 1.45);
    const subSize = Math.min(H * 0.032, W * 0.05);
    if (w.say.subtitle.alpha * cd.dim > 0.01 && zoom < 1.5) textGlow(w.say.subtitle.text, W / 2, subY, FONT_DISPLAY(subSize, 'italic', 400), IV(0.85 * w.say.subtitle.alpha * cd.dim));
    if (w.say.note.alpha > 0.01) textGlow(w.say.note.text, W / 2, subY, FONT_DISPLAY(subSize, 'italic', 400), IV(0.95 * w.say.note.alpha));
    if (w.say.main.alpha > 0.01 && zoom < 2.2) {
      const size = Math.min(H * 0.04, W * (portrait ? 0.058 : 0.03));
      const lines = portrait ? w.say.main.text.replace(' ESTÁN', '\nESTÁN').split('\n') : [w.say.main.text];
      lines.forEach((ln, i) => { const shown = ln.slice(0, Math.ceil(ln.length * clamp(w.say.main.reveal * 1.2))); textGlow(shown, W / 2, cy + (i - (lines.length - 1) / 2) * size * 1.7, FONT_CAPS(size), IV(w.say.main.alpha), size * 0.28); });
    }
    g.restore();
  }

  function drawCabin(dt, t) {
    const w = world, a = W / H, L = PanelLayout;
    const jolt = w.reduced ? 0 : (Math.sin(t * 63) + Math.sin(t * 41)) * (w.cabinJolt + w.shake) * 700;
    g.save(); g.translate(jolt * 0.6, jolt);
    g.fillStyle = '#191510'; g.fillRect(-20, -20, W + 40, H + 40);
    g.strokeStyle = IV(0.05 + 0.06 * w.lamp); g.lineWidth = 1;
    for (let x = 0; x < W; x += Math.max(26, W / 26)) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Math.sin(x) * 3, H); g.stroke(); }
    const lamp = g.createRadialGradient(W * 0.4, -H * 0.1, 10, W * 0.4, -H * 0.1, H * 0.9);
    lamp.addColorStop(0, `rgba(255,230,180,${0.32 * w.lamp})`); lamp.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = lamp; g.fillRect(0, 0, W, H);
    // plate
    const ph = Math.min(H * 0.9, ((W * (a >= 1 ? 0.32 : 0.9)) * L.H) / L.W), pw = (ph * L.W) / L.H;
    const px = a >= 1 ? W * 0.62 : (W - pw) / 2, py = (H - ph) / 2;
    const S = pw / L.W;
    // door (landscape only)
    if (a >= 1) {
      const dw = Math.min(W * 0.38, H * 0.56), dx = W * 0.12, dy = H * 0.06, dh = H * 1.1;
      g.fillStyle = w.doors > 0.01 ? (w.env === 0 ? PAPER : `rgba(${hex3((trackOf(w.env) || PB_ROW).visualAccent).map((v) => Math.round(v * 60)).join(',')},1)`) : '#101014';
      g.fillRect(dx, dy, dw, dh);
      g.save(); g.beginPath(); g.rect(dx, dy, dw, dh); g.clip();
      const s = (dw / 2) * w.doors * 0.98;
      for (const sgn of [-1, 1]) {
        const x0 = sgn < 0 ? dx - s : dx + dw / 2 + s;
        g.fillStyle = '#1c1d22'; g.fillRect(x0, dy, dw / 2, dh);
        g.strokeStyle = IV(0.1); for (let x = x0 + 6; x < x0 + dw / 2; x += 9) { g.beginPath(); g.moveTo(x, dy); g.lineTo(x, dy + dh); g.stroke(); }
      }
      if (w.bands > 0.01) { g.fillStyle = `rgba(255,240,210,${0.5 * w.bands})`; for (let k = 0; k < 4; k++) { const y = dy + (((k / 4 + w.bandPhase) % 1 + 1) % 1) * dh; g.fillRect(dx + dw / 2 - 5 - s, y, 10 + 2 * s, dh * 0.07); } }
      g.restore();
      g.strokeStyle = IV(0.35); g.lineWidth = 2; g.strokeRect(dx, dy, dw, dh);
    }
    g.fillStyle = '#2b2317'; g.fillRect(px, py, pw, ph);
    g.drawImage(panelSprite(pw * dpr), px, py, pw, ph);
    const P = (tx, ty) => [px + tx * S, py + ty * S];
    const button = (id, tx, ty, r, square, accent) => {
      const pr = w.pressed[id] || 0;
      let glow = w.lit[id] || 0;
      if (id.startsWith('sel-')) glow = Math.max(glow, w.platform === id.slice(4) ? 1 : 0, w.refuse * (0.5 + 0.5 * Math.sin(t * 18)), w.platform ? 0 : 0.2 + 0.1 * Math.sin(t * 2.2));
      else { const n = Number(id.slice(6)); glow = Math.max(glow, w.floor === n ? 0.5 : 0, w.visited.includes(n) ? 0.18 : 0, w.platform || !trackOf(n) ? 0.08 : 0, w.hover === id && (w.platform || !trackOf(n)) ? 0.3 : 0); }
      const [x, y] = P(tx, ty); const rr = r * S * (1 - 0.1 * pr);
      g.save(); g.shadowColor = `rgba(${accent.map((v) => Math.round(v * 255)).join(',')},${glow})`; g.shadowBlur = 22 * glow;
      g.fillStyle = `rgb(${accent.map((v) => Math.round(32 + v * 215 * glow)).join(',')})`;
      g.beginPath(); if (square) g.rect(x - rr, y - rr, rr * 2, rr * 2); else g.arc(x, y, rr, 0, TAU); g.fill(); g.restore();
      g.strokeStyle = IV(0.55); g.lineWidth = 1.5; g.beginPath(); if (square) g.rect(x - rr, y - rr, rr * 2, rr * 2); else g.arc(x, y, rr + 2, 0, TAU); g.stroke();
    };
    for (const k in rects) if (k.startsWith('floor-')) rects[k] = null; // the other section's rows are not there
    for (const tr of panelRows()) {
      const y = L.rowY(tr.floor);
      button('floor-' + tr.floor, L.btnX, y, 0.026, false, hex3(tr.visualAccent));
      const [x0, y0] = P(0.015, y - L.rowStep() / 2 + 0.003);
      rects['floor-' + tr.floor] = { x: x0, y: y0, w: 0.509 * S, h: (L.rowStep() - 0.006) * S };
    }
    for (const p of ['youtube', 'spotify']) {
      const b = L.sel[p];
      button('sel-' + p, b.x, b.y, L.sel.size / 2, true, [0.95, 0.9, 0.76]);
      { const [lx, ly] = P(b.x, b.y), pr = w.pressed['sel-' + p] || 0; drawLogo(g, p, lx, ly, L.sel.size * S * (p === 'youtube' ? 0.78 : 0.66) * (1 - 0.1 * pr)); }
      w.panelLogos = 2; // read by the checks
      const [x0, y0] = P(b.x - 0.1, b.y - 0.126);
      rects['sel-' + p] = { x: x0, y: y0, w: 0.2 * S, h: 0.2 * S };
    }
    if (Progress.basementsOpen()) { const [x0, y0] = P(L.W / 2 - 0.23, L.section.y - L.section.h / 2); rects['panel-section'] = { x: x0, y: y0, w: 0.46 * S, h: L.section.h * S }; }
    else rects['panel-section'] = null;
    const [LO, HI] = panelRange(), na = Math.PI - ((clamp(w.needle, LO, HI) - LO) * Math.PI) / (HI - LO), [nx, ny] = P(L.dial.x, L.dial.y);
    g.strokeStyle = IV(0.95); g.lineWidth = 2; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(na) * (L.dial.r - 0.022) * S, ny - Math.sin(na) * (L.dial.r - 0.022) * S); g.stroke();
    for (const dir of [1, -1]) { const [ax, ay] = P(dir > 0 ? 0.075 : L.W - 0.075, 0.17); g.fillStyle = w.arrow === dir ? IV(0.95) : IV(0.12); g.beginPath(); g.moveTo(ax - 0.016 * S, ay + dir * 0.011 * S); g.lineTo(ax + 0.016 * S, ay + dir * 0.011 * S); g.lineTo(ax, ay - dir * 0.016 * S); g.fill(); }
    g.restore();
  }

  function drawFloor(dt, t) {
    const w = world, tr = trackOf(w.env) || tracks[0];
    const acc = hex3(tr.visualAccent).map((v) => Math.round(v * 255)).join(',');
    const r = (PlayerPortal.current && PlayerPortal.current.rect()) || PlayerPortal.expectedRect('floor', w.platform || 'youtube', alignFor(tr));
    const base = Math.min(H * 0.97, r.y + r.h + H * 0.05);
    water(base, acc, t);
    const cx = r.x + r.w / 2, R = Math.hypot(r.w / 2, base - r.y) * 1.08;
    const live = w.playing ? 1 : 0;
    g.save(); g.shadowColor = `rgba(${acc},0.8)`; g.shadowBlur = 18 + 10 * live;
    g.strokeStyle = IV(0.9); g.lineWidth = 2.5; g.beginPath(); g.arc(cx, base, R, Math.PI, TAU); g.stroke(); g.restore();
    g.strokeStyle = `rgba(${acc},0.25)`; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, base, R * 1.7 * Math.abs(Math.cos(t * 0.07)), R * 1.7, 0, Math.PI, TAU); g.stroke();
    g.save(); g.globalAlpha = 0.25; g.beginPath(); g.rect(0, base, W, H - base); g.clip(); g.strokeStyle = IV(0.8); g.lineWidth = 2; g.beginPath(); g.arc(cx, base, R, 0, Math.PI); g.stroke(); g.restore();
    for (const d of dots) { const y = (((d.y - t * 0.012 * d.s * (1 + live)) % 1) + 1) % 1; g.fillStyle = `rgba(${acc},${0.25 + 0.3 * Math.sin(t * d.s + d.p)})`; g.beginPath(); g.arc(d.x * W + Math.sin(t * 0.3 + d.p) * 12, y * base, 1 + d.s, 0, TAU); g.fill(); }
    const phone = W < 640, ty = phone ? H * 0.2 : Math.max(H * 0.1, r.y - H * 0.105);
    const size = Math.min(H * (phone ? 0.05 : 0.07), (W * 0.9) / (tr.title.length * 0.5));
    textGlow(`${floorName(tr.floor).toUpperCase()}${tr.durationSeconds ? ' · ' + fmtDuration(tr.durationSeconds) : ''}`, cx, ty - size * 0.95, FONT_CAPS(size * 0.3), IV(0.7), size * 0.1);
    textGlow(tr.title, cx, ty, FONT_DISPLAY(size, 'italic', 400), IV(0.95));
    rects.elevator = null;
    if (w.book.sheet) { // the loose page of this world
      const [fx, fy] = pageSpot(tr.visual.kind, phone), k = w.book.take, sh = H * 0.075 * (1 - 0.8 * k), sw = sh * 0.72;
      const sx = lerp(W * fx, W - 30, k * k), sy = lerp(H * fy + Math.sin(t * 0.8) * 4, 70, k * k);
      g.save(); g.translate(sx, sy); g.rotate(0.12 + k); g.globalAlpha = 1 - k * k; g.strokeStyle = IV(0.9); g.lineWidth = 1.5; g.strokeRect(-sw / 2, -sh / 2, sw, sh);
      g.globalAlpha *= 0.6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-sw * 0.3, -sh * 0.2 + i * sh * 0.11); g.lineTo(sw * 0.3, -sh * 0.2 + i * sh * 0.11); g.stroke(); }
      g.restore();
      rects.page = { x: W * fx - sw / 2 - 6, y: H * fy - sh / 2 - 6, w: sw + 12, h: sh + 12 };
    }
  }

  /** The gallery as a flat room: the pieces in a row seen in simple perspective, or the chosen one up close. */
  function drawGallery(dt, t) {
    const w = world, L = galleryLayout(), at = w.gallery.at;
    water(H * 0.8, '235,229,213', t);
    const frame = (it, cx, cy, fw) => {
      const fh = fw * (it.h / it.w), img = it.thanks ? null : GalleryArt.image(it.i);
      g.fillStyle = '#1d1a19'; g.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);
      if (GalleryArt.ready(img)) g.drawImage(img, cx - fw / 2, cy - fh / 2, fw, fh);
      g.strokeStyle = IV(0.9); g.lineWidth = Math.max(1.5, fw * 0.012); g.strokeRect(cx - fw / 2 - fw * 0.04, cy - fh / 2 - fw * 0.04, fw * 1.08, fh + fw * 0.08);
      if (it.thanks) textGlow(GALLERY.thanks.heading || COPY.thanksHeading, cx, cy, FONT_CAPS(fw * 0.06), IV(0.95), fw * 0.018);
      return { x: cx - fw / 2, y: cy - fh / 2, w: fw, h: fh };
    };
    if (at >= 0 && L.items[at]) { const it = L.items[at]; frame(it, W / 2, H * 0.36, Math.min(W * 0.8, (H * 0.44 * it.w) / it.h)); return; }
    const f = H * 0.95, cz = w.cam.z + look.walkZ;
    for (const it of [...L.items].reverse()) {
      const dz = it.z - cz;
      if (dz < 1.2) continue;
      const r = frame(it, W / 2 - (it.x * f) / dz, H * 0.5 - ((it.y - 1.6) * f) / dz, (it.w * f) / dz);
      rects['piece-' + it.i] = r;
    }
  }

  const api = {
    kind: '2d', canvas, avgMs: 0,
    get dpr() { return dpr; },
    resize,
    ripple(x, z, amp) { rips.push({ x: W / 2 + x * 40, y: H * 0.8 + z * 6, t: api.time || 0, a: amp }); if (rips.length > 6) rips.shift(); },
    render(dt, t) {
      api.time = t;
      const w = world;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
      for (const k in rects) rects[k] = null;
      if (w.inside) drawCabin(dt, t); else if (w.env === 0) drawExterior(dt, t); else if (w.env === GALLERY_FLOOR) drawGallery(dt, t); else drawFloor(dt, t);
      // exposure, vignette, grain
      if (w.exposure < 0.999) { g.fillStyle = `rgba(16,14,13,${1 - w.exposure})`; g.fillRect(0, 0, W, H); }
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
      vg.addColorStop(0, 'rgba(16,14,13,0)'); vg.addColorStop(1, 'rgba(16,14,13,0.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (w.prism > 0.01) { const gr = g.createLinearGradient(0, 0, W, 0); ['255,90,78', '255,210,74', '95,224,122', '90,168,255', '140,130,255'].forEach((c, i) => gr.addColorStop(i / 4, `rgba(${c},${0.07 * w.prism})`)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      const ox = w.reduced ? 0 : Math.floor(Math.random() * 180), oy = w.reduced ? 0 : Math.floor(Math.random() * 180);
      g.globalCompositeOperation = 'lighter';
      for (let y = -oy; y < H; y += 180) for (let x = -ox; x < W; x += 180) g.drawImage(spr.noise, x, y);
      g.globalCompositeOperation = 'source-over';
      if (api.boot < 1) { g.fillStyle = `rgba(16,14,13,${1 - api.boot})`; g.fillRect(0, 0, W, H); }
    },
    project(id) { return rects[id] || null; },
    setFloor() {}, floorAnchorChanged() {}, bookTarget: () => null, setGallery() {}, galleryRefit() {},
    boot: 1,
    setBoot(v) { api.boot = v; },
    cabin: { target: () => null, redrawPanel() {} },
    dispose() { canvas.remove(); },
  };
  resize();
  return api;
}
