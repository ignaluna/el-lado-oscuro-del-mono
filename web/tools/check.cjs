#!/usr/bin/env node
// Local preview + verification harness for artifact/index.html.
//
//   node tools/check.cjs --syntax                     parse-check the inline module script
//   node tools/check.cjs --serve [--csp]              keep a local server running (real YouTube/Spotify embeds)
//   node tools/check.cjs --scenario smoke,form [--viewport desktop|mobile|both] [--csp] [--headed] [--fast]
//   node tools/check.cjs --serve --dist [--host 0.0.0.0]  serve dist/ (own-domain build) with its _headers; with
//                                                       --host 0.0.0.0 phones on the same Wi-Fi can open it
//   node tools/check.cjs --scenario … --dist             run the scenarios on dist/ with its headers (strict CSP)
//   node tools/check.cjs --scenario … --url https://…    run the scenarios against the deployed site
//   In --dist / --url runs any Content-Security-Policy violation of the page fails the run.
//   Sign-ups never reach the band's real sheet from a test: Google's addresses are answered by a mock sheet. The one
//   exception writes a single row on purpose:
//     node tools/check.cjs --scenario leadslive --url https://… --real-leads --lead-name "PRUEBA …" --lead-email …
//
// The page is served inside the same skeleton claude.ai adds at publish time. `--csp` adds an
// Artifact-like Content-Security-Policy header (third-party frames blocked) to exercise link mode.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ARTIFACT = path.join(ROOT, 'artifact', 'index.html');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, 'shots');
const PLAYWRIGHT = 'playwright'; // the repo's devDependency (npm install at the repo root)

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const SKELETON_OPEN =
  '<!doctype html><html><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'body{margin:0;font:14px/1.4 system-ui,sans-serif;background:#fafaf7}img{max-width:100%}[hidden]{display:none!important}</style>' +
  '</head><body>';
const SKELETON_CLOSE = '</body></html>';
const ARTIFACT_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.tailwindcss.com https://code.jquery.com",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  'img-src data: blob:',
  'media-src data: blob:',
  "connect-src 'none'",
  "frame-src 'none'",
  'worker-src blob:',
].join('; ');

function syntaxCheck() {
  const html = fs.readFileSync(ARTIFACT, 'utf8');
  const blocks = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) throw new Error('No <script type="module"> block found');
  const tmp = path.join(__dirname, '.syntax-check.mjs');
  fs.writeFileSync(tmp, blocks.sort((a, b) => b.length - a.length)[0]);
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  const lines = html.split('\n').length;
  console.log(`syntax OK — ${lines} lines, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}

/** Headers that dist/_headers assigns to a path (Netlify / Cloudflare Pages format: "/*" and exact paths). */
function distHeaders(urlPath) {
  const out = {};
  let on = false;
  for (const line of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { const pat = line.trim(); on = pat === '/*' || pat === urlPath; continue; }
    if (on) { const i = line.indexOf(':'); out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim(); }
  }
  return out;
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };

/**
 * The band's sign-up sheet, on another port like Google's: the real Apps Script (tools/leads/Code.gs) on an
 * in-memory sheet. Like Apps Script it answers a POST with a redirect to the JSON, answers no CORS preflight, and
 * can be made busy (`busy` answers before a success) or unreachable (`down`). Pages opened with ?leads=mock use it.
 */
const LeadsMock = {
  server: null, url: '', sim: null, busy: 0, down: false, requests: [], preflights: 0, answers: [],
  async start() {
    if (!this.server) {
      this.server = http.createServer((req, res) => this.handle(req, res));
      await new Promise((r) => this.server.listen(0, '127.0.0.1', r));
      this.url = `http://127.0.0.1:${this.server.address().port}/exec`;
    }
    this.reset();
    return this;
  },
  reset() { this.sim = require('./leads/sheet-sim.cjs').loadScript(); this.busy = 0; this.down = false; this.requests = []; this.preflights = 0; this.answers = []; },
  rows() { return this.sim.rows(); },
  /** Answers a request a page made to Google's addresses (the real sheet never receives test sign-ups). */
  async fulfill(route) {
    if (!this.sim) this.reset();
    const req = route.request();
    if (req.method() !== 'POST') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: this.sim.ctx.doGet().body });
    const body = req.postData() || '';
    this.requests.push({ type: req.headers()['content-type'] || '', body, intercepted: true });
    if (this.down) return route.abort('failed');
    let answer;
    if (this.busy > 0) { this.busy--; answer = JSON.stringify({ ok: false, error: 'busy' }); } else answer = this.sim.postRaw(body).body;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: answer });
  },
  handle(req, res) {
    const u = new URL(req.url, 'http://x');
    const send = (code, body, extra = {}) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...extra }); res.end(body); };
    if (req.method === 'OPTIONS') { this.preflights++; res.writeHead(405); return res.end(); }
    const echo = /^\/echo\/(\d+)$/.exec(u.pathname);
    if (echo) return send(200, this.answers[Number(echo[1])] || '{}');
    if (u.pathname !== '/exec') return send(404, '{}');
    if (req.method === 'GET') return send(200, this.sim.ctx.doGet().body);
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      this.requests.push({ type: req.headers['content-type'] || '', body });
      if (this.down) { req.socket.destroy(); return; }
      let answer;
      if (this.busy > 0) { this.busy--; answer = JSON.stringify({ ok: false, error: 'busy' }); } else answer = this.sim.postRaw(body).body;
      this.answers.push(answer);
      send(302, '', { location: `/echo/${this.answers.length - 1}` });
    });
  },
};

function startServer(port, csp, dist, host = '127.0.0.1') {
  const server = http.createServer((req, res) => {
    if (dist) {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const rel = p === '/' ? 'index.html' : p.slice(1);
      const file = path.join(DIST, rel);
      if (rel.includes('..') || rel.startsWith('_') || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', ...distHeaders(p) });
      return res.end(fs.readFileSync(file));
    }
    const gal = /^\/galeria\/([\w.-]+\.(jpe?g|png|webp))$/.exec(req.url.split('?')[0]); // the gallery photos, as the build publishes them
    if (gal && fs.existsSync(path.join(ROOT, 'assets', 'galeria', gal[1]))) {
      res.writeHead(200, { 'content-type': TYPES[path.extname(gal[1])] || 'image/jpeg', 'cache-control': 'no-store' });
      return res.end(fs.readFileSync(path.join(ROOT, 'assets', 'galeria', gal[1])));
    }
    if (req.url !== '/' && !req.url.startsWith('/?') && !req.url.startsWith('/#')) {
      res.writeHead(404);
      return res.end();
    }
    const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
    if (csp) headers['content-security-policy'] = ARTIFACT_CSP;
    res.writeHead(200, headers);
    let page = fs.readFileSync(ARTIFACT, 'utf8');
    if (/[?&]leads=mock\b/.test(req.url) && LeadsMock.url) page = page.replace(/const LEAD_ENDPOINT = (null|"[^"]*");/, `const LEAD_ENDPOINT = ${JSON.stringify(LeadsMock.url)};`);
    else if (/[?&]leads=none\b/.test(req.url)) page = page.replace(/const LEAD_ENDPOINT = (null|"[^"]*");/, 'const LEAD_ENDPOINT = null;'); // the device-only days
    res.end(SKELETON_OPEN + page + SKELETON_CLOSE);
  });
  return new Promise((resolve) => server.listen(port, host, () => resolve(server)));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const waitPhase = (p, phase, timeout = 30000) =>
  p.waitForFunction((ph) => window.__eldom && window.__eldom.state().phase === ph, phase, { timeout });
const waitFloor = (p, n, timeout = 40000) =>
  p.waitForFunction(
    (f) => window.__eldom && window.__eldom.state().phase === 'floor' && window.__eldom.state().floor === f,
    n,
    { timeout },
  );
const state = (p) => ev(p, () => window.__eldom.state());
// Official players only: a host may add frames of its own (Netlify's badge on free sites is an empty iframe).
const PLAYER_FRAMES = 'iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"], iframe[src*="open.spotify.com"]';
const iframeCount = (p) => ev(p, (sel) => document.querySelectorAll(sel).length, PLAYER_FRAMES);

async function clickSubmit(p) {
  const sel = (await p.$('#lead-submit')) ? '#lead-submit' : '#lead-form button[type=submit]';
  await p.click(sel);
}

const SCENARIOS = {
  async smoke(p, shot) {
    await shot('prelaunch');
    const vp = p.viewportSize();
    await p.mouse.move(vp.width * 0.8, vp.height * 0.35);
    await wait(1500);
    await shot('prelaunch-look');
  },
  async form(p, shot, log) {
    await ev(p, () => window.__eldom.dev.clearLead());
    await ev(p, () => window.__eldom.ui.openForm());
    await wait(2400);
    await shot('form-open');
    await clickSubmit(p);
    await wait(500);
    await shot('form-errors-empty');
    await p.locator('#lead-consent').check({ force: true });
    await clickSubmit(p);
    await wait(400);
    await shot('form-errors-nocontact');
    await p.fill('#lead-whatsapp', '099 123');
    await p.fill('#lead-instagram', 'mal..usuario');
    await clickSubmit(p);
    await wait(400);
    await shot('form-errors-invalid');
    await p.fill('#lead-whatsapp', '');
    await p.fill('#lead-instagram', '');
    await p.fill('#lead-name', 'Prueba');
    await p.fill('#lead-email', 'prueba@example.com');
    await clickSubmit(p);
    await wait(900);
    await shot('form-success');
    await wait(5500);
    await shot('form-after');
    log('stored leads: ' + (await ev(p, () => localStorage.getItem('eldom.leads.v1'))));
    await ev(p, () => window.__eldom.ui.openForm());
    await wait(2000);
    await p.fill('#lead-email', 'PRUEBA@example.com ');
    await p.locator('#lead-consent').check({ force: true });
    await clickSubmit(p);
    await wait(900);
    await shot('form-duplicate');
    log('stored leads after duplicate: ' + (await ev(p, () => JSON.parse(localStorage.getItem('eldom.leads.v1') || '[]').length)));
  },
  async listen(p, shot, log) {
    await ev(p, () => window.__eldom.ui.openListen());
    await wait(1200);
    await shot('listen-question');
    await ev(p, () => window.__eldom.ui.chooseListen('youtube'));
    await wait(5000);
    await shot('listen-youtube');
    log('state: ' + JSON.stringify((await state(p)).portal) + ' iframes=' + (await iframeCount(p)));
    await ev(p, () => window.__eldom.ui.closeListen());
    await wait(900);
    await ev(p, () => window.__eldom.ui.openListen());
    await wait(900);
    await ev(p, () => window.__eldom.ui.chooseListen('spotify'));
    await wait(5000);
    await shot('listen-spotify');
    log('state: ' + JSON.stringify((await state(p)).portal) + ' iframes=' + (await iframeCount(p)));
    await ev(p, () => window.__eldom.ui.closeListen());
    await wait(1000);
    await shot('listen-closed');
    log('iframes after close=' + (await iframeCount(p)));
  },
  async launch(p, shot) {
    await ev(p, () => window.__eldom.dev.lastTen());
    await wait(2500);
    await shot('last-ten');
    await wait(8300);
    await shot('launch-t0.8');
    await wait(1600);
    await shot('launch-t2.4');
    await wait(1500);
    await shot('launch-t3.9');
    await wait(2600);
    await shot('launch-t6.5');
    await wait(2400);
    await shot('launch-t8.9');
    await waitPhase(p, 'open', 20000);
    await wait(1200);
    await shot('open');
  },
  async enter(p, shot) {
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000);
    await wait(1500);
    await shot('released');
    await ev(p, () => window.__eldom.ui.enter());
    await wait(1800);
    await shot('entering-a');
    await wait(1800);
    await shot('entering-b');
    await waitPhase(p, 'cabin', 20000);
    await wait(900);
    await shot('cabin-arrived');
  },
  async cabin(p, shot, log) {
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await wait(1500);
    await shot('cabin-idle');
    await ev(p, () => window.__eldom.dev.press(3));
    await wait(900);
    await shot('cabin-refuse');
    await ev(p, () => window.__eldom.dev.platform('youtube'));
    await wait(2000);
    await shot('cabin-youtube');
    await ev(p, () => window.__eldom.dev.platform('spotify'));
    await wait(2000);
    await shot('cabin-spotify');
    log('state: ' + JSON.stringify(await state(p)));
  },
  async press(p, shot, log) {
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await ev(p, () => window.__eldom.dev.platform('youtube'));
    await wait(2200);
    await ev(p, () => window.__eldom.dev.press(1));
    await wait(250);
    await shot('press-anticipation');
    await wait(350);
    await shot('press-reach');
    await wait(200);
    await shot('press-contact');
    await wait(1400);
    await shot('doors-closing');
    await wait(1300);
    await shot('travel-start');
    await wait(1400);
    await shot('travel-mid');
    await waitFloor(p, 1);
    await wait(3500);
    await shot('floor-1-arrived');
    log('state: ' + JSON.stringify(await state(p)) + ' iframes=' + (await iframeCount(p)));
  },
  async hand(p, shot) {
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await ev(p, () => window.__eldom.dev.platform('youtube'));
    await wait(2500);
    await ev(p, () => window.__eldom.dev.timeScale(0.08));
    await ev(p, () => window.__eldom.dev.press(6));
    for (const [ms, label] of [[1200, 'hand-anticipation'], [3500, 'hand-reach-mid'], [4200, 'hand-reach-end'], [1500, 'hand-press'], [3500, 'hand-retract']]) { await wait(ms); await shot(label); }
    await ev(p, () => window.__eldom.dev.timeScale(1));
  },
  async one(p, shot, log) {
    const n = Number(opt('floor', '2'));
    await ev(p, (f) => window.__eldom.dev.arrive(f), n);
    await waitFloor(p, n);
    await wait(4000);
    await shot('floor-' + n);
  },
  async invite(p, shot, log) {
    // 1) before the release: a world link is remembered, nothing opens
    await p.evaluate(() => { location.hash = '#amor-libre'; });
    await wait(900);
    let s = await state(p);
    log('prelaunch with link: phase=' + s.phase + ' pending=' + s.pendingInvite + ' hash=' + s.hash);
    await shot('invite-prelaunch-note');
    // 2) release happens: the doors open and the invitation waits as a caption
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000);
    await wait(800);
    await shot('invite-open-caption');
    await p.click('#cap-invited-go');
    await wait(1200);
    s = await state(p);
    log('gate: overlay=' + s.overlay + ' phase=' + s.phase + ' visitedBefore=' + JSON.stringify(s.visited));
    await shot('invite-gate');
    await p.click('#g-youtube');
    await waitFloor(p, 2);
    await wait(3500);
    s = await state(p);
    log('arrived: floor=' + s.floor + ' platform=' + s.platform + ' hash=' + s.hash + ' pending=' + s.pendingInvite + ' portal=' + JSON.stringify(s.portal));
    log('player src: ' + (await ev(p, (sel) => (document.querySelector(sel) || {}).src || 'none', PLAYER_FRAMES)));
    // 3) invite from inside the world
    await p.click('#cap-invite');
    await wait(700);
    s = await state(p);
    log('world invite: ' + JSON.stringify(s.invite));
    log('whatsapp href: ' + (await ev(p, () => document.querySelector('#invite-wa').href)));
    await shot('invite-world-plate');
    const box = await p.locator('#invite').boundingBox();
    const ib = await p.locator(PLAYER_FRAMES).first().boundingBox();
    log('plate overlaps player: ' + !(box.x + box.width <= ib.x || ib.x + ib.width <= box.x || box.y + box.height <= ib.y || ib.y + ib.height <= box.y));
    await p.click('#invite-copy');
    await wait(500);
    log('copy status: ' + (await state(p)).invite.status + ' | clipboard: ' + (await ev(p, () => navigator.clipboard.readText().catch((e) => 'read refused: ' + e.name))));
    await p.click('#invite-close');
    // 4) back to the elevator: the address stops pointing to the world; an invitation to one world (by API)
    await ev(p, () => window.__eldom.ui.returnToElevator());
    await waitPhase(p, 'cabin', 25000);
    await wait(900);
    log('back in cabin: hash=' + JSON.stringify((await state(p)).hash));
    await ev(p, () => window.__eldom.ui.invite(5));
    await wait(600);
    log('panel invite: ' + JSON.stringify((await state(p)).invite));
    await shot('invite-panel-plate');
    await ev(p, () => window.__eldom.ui.closeInvite());
    await shot('invite-panel-rows');
    // 5) general invitation
    await ev(p, () => window.__eldom.ui.invite(0));
    await wait(500);
    log('general invite: ' + JSON.stringify((await state(p)).invite));
    await shot('invite-general');
    await ev(p, () => window.__eldom.ui.closeInvite());
    // 6) after the release a world link goes straight to the gate
    await p.evaluate(() => { location.hash = '#coca-y-fernet'; });
    await wait(1200);
    s = await state(p);
    log('link after release: overlay=' + s.overlay + ' pending=' + s.pendingInvite);
    await ev(p, () => window.__eldom.ui.gateDismiss());
    await wait(600);
    s = await state(p);
    log('dismissed: phase=' + s.phase + ' pending=' + s.pendingInvite + ' hash=' + JSON.stringify(s.hash) + ' visited=' + JSON.stringify(s.visited));
  },
  async book(p, shot, log) {
    const bk = async () => (await state(p)).book;
    await ev(p, () => window.__eldom.dev.clearBook());
    await wait(600);
    await shot('book-on-steps');
    log('before: ' + JSON.stringify(await bk()) + ' icon hidden=' + (await ev(p, () => document.querySelector('#book-open').hidden)));
    await ev(p, () => window.__eldom.ui.pickBook());
    await wait(1900);
    await shot('book-crouch');
    await wait(900);
    await shot('book-touch');
    await p.waitForFunction(() => window.__eldom.state().overlay === 'book', null, { timeout: 15000 });
    await wait(700);
    await shot('book-open-cover');
    log('picked: ' + JSON.stringify(await bk()));
    await ev(p, () => window.__eldom.ui.bookTurn(1));
    await wait(300);
    await shot('book-blank-page');
    await ev(p, () => window.__eldom.ui.closeBook());
    await wait(1800);
    await shot('book-carried');
    log('icon hidden=' + (await ev(p, () => document.querySelector('#book-open').hidden)) + ' hotspot gone=' + (await ev(p, () => !window.__eldom.state().book.found)));
    // survives a reload
    await p.reload();
    await p.waitForFunction(() => window.__eldom && window.__eldom.ready, null, { timeout: 30000 });
    await p.evaluate(() => window.__eldom.ready);
    await wait(1500);
    log('after reload: ' + JSON.stringify(await bk()));
    // a page waits in a world
    await ev(p, () => window.__eldom.dev.arrive(2));
    await waitFloor(p, 2);
    await wait(3200);
    await shot('book-page-in-world');
    log('in world 2: pageHere=' + (await bk()).pageHere);
    await ev(p, () => window.__eldom.ui.takePage());
    await wait(1600);
    log('after taking: ' + JSON.stringify(await bk()));
    await ev(p, () => window.__eldom.ui.openBook(2));
    await wait(500);
    await shot('book-page-reader');
    const bb = await p.locator('#book').boundingBox();
    const ib = await p.locator(PLAYER_FRAMES).first().boundingBox();
    log('reader overlaps player: ' + !(bb.x + bb.width <= ib.x || ib.x + ib.width <= bb.x || bb.y + bb.height <= ib.y || ib.y + ib.height <= bb.y) + ' reader=' + JSON.stringify(bb));
    log('page text: ' + JSON.stringify(await ev(p, () => document.querySelector('#bk-page').innerText)));
    // purchase: ebook always, paper only when complete
    await ev(p, () => window.__eldom.dev.bookBuy('https://example.com/ebook', 'https://example.com/papel'));
    await ev(p, () => window.__eldom.ui.bookTurn(99));
    await wait(300);
    log('colophon (incomplete): ' + JSON.stringify(await ev(p, () => [...document.querySelectorAll('#bk-page a')].map((a) => a.textContent))));
    await ev(p, () => window.__eldom.dev.bookAll());
    await wait(300);
    log('colophon (complete): ' + JSON.stringify(await ev(p, () => [...document.querySelectorAll('#bk-page a')].map((a) => a.textContent))));
    await shot('book-colophon');
    await ev(p, () => window.__eldom.ui.closeBook());
    await ev(p, () => window.__eldom.dev.clearBook());
    log('reset: ' + JSON.stringify(await bk()));
  },
  async pb(p, shot, log) {
    await ev(p, () => window.__eldom.dev.clearBook());
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000);
    await ev(p, () => window.__eldom.dev.arrive(3));
    await waitFloor(p, 3);
    await wait(1500);
    await ev(p, () => window.__eldom.ui.returnToElevator());
    await waitPhase(p, 'cabin', 25000);
    await wait(900);
    await shot('pb-panel');
    await ev(p, () => window.__eldom.ui.pressLobby());
    await wait(900);
    await shot('pb-press');
    await wait(4500);
    await shot('pb-travel');
    await waitPhase(p, 'open', 40000);
    await wait(1200);
    let s = await state(p);
    log('back at the entrance: phase=' + s.phase + ' floor=' + s.floor + ' doors=' + s.doors.toFixed(2) + ' visited=' + JSON.stringify(s.visited) + ' platform=' + s.platform);
    await shot('pb-entrance');
    log('book hotspot available: ' + (await ev(p, () => { const el = [...document.querySelectorAll('.hot')].find((e) => e.getAttribute('aria-label') === 'Un libro apoyado en los escalones'); return !!el && !el.hidden; })));
    await ev(p, () => window.__eldom.ui.enter());
    await waitPhase(p, 'cabin', 25000);
    await wait(600);
    await ev(p, () => window.__eldom.ui.pressLobby());
    await waitPhase(p, 'open', 30000);
    s = await state(p);
    log('PB at the entrance just walks out: phase=' + s.phase + ' floor=' + s.floor);
  },  // The gallery with the band's photos: every photo loads from where the build publishes it, and each piece and the
  // closing plate read what the band wrote (GALLERY in 00-base.html).
  async galleryphotos(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const cfg = await ev(p, () => window.__eldom.config().gallery);
    const loaded = await ev(p, (srcs) => Promise.all(srcs.map((s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = s; }))), cfg.pieces.map((x) => x.src));
    check(cfg.pieces.length > 0 && loaded.every(Boolean), `every photo loads (${cfg.pieces.map((x, i) => x.src + (loaded[i] ? '' : ' MISSING')).join(', ')})`);
    await ev(p, () => window.__eldom.ui.openGallery()); await waitPhase(p, 'gallery', 20000); await wait(2500);
    for (let i = 0; i <= cfg.pieces.length; i++) {
      await ev(p, (k) => window.__eldom.ui.galleryFocus(k), i); await wait(2200);
      const text = (await p.locator('.gal-text').innerText()).replace(/\s+/g, ' ').trim();
      const want = i < cfg.pieces.length ? [cfg.pieces[i].title, cfg.pieces[i].caption, cfg.pieces[i].thanks] : cfg.thanks;
      check(want.filter(Boolean).every((w) => text.includes(w.replace(/\s+/g, ' ').trim())), `${i < cfg.pieces.length ? 'piece ' + (i + 1) : 'thanks plate'}: "${text.slice(0, 110)}"`);
      await shot(`${String(i + 1).padStart(2, '0')}-${i < cfg.pieces.length ? cfg.pieces[i].id : 'thanks'}`);
    }
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' galleryphotos check(s) failed: ' + fails.join(' | '));
  },

  async gallery(p, shot, log) {
    const st = async () => { const s = await state(p); return 'phase=' + s.phase + ' floor=' + s.floor + ' gallery=' + JSON.stringify(s.gallery) + ' hash=' + s.hash; };
    // before the release, from the entrance
    await shot('gallery-plate');
    await ev(p, () => window.__eldom.ui.openGallery());
    await waitPhase(p, 'gallery', 15000);
    await wait(1800);
    log('entered before the release: ' + (await st()));
    await shot('gallery-room');
    await ev(p, () => window.__eldom.ui.galleryFocus(0));
    await wait(1900);
    await shot('gallery-piece-empty');
    log('empty piece: ' + JSON.stringify(await ev(p, () => document.querySelector('.gal-text').innerText)));
    await ev(p, () => window.__eldom.dev.gallerySample());
    await wait(1500);
    await shot('gallery-piece-sample');
    log('sample piece: ' + JSON.stringify(await ev(p, () => document.querySelector('.gal-text').innerText)));
    await ev(p, () => window.__eldom.ui.galleryStep(1));
    await wait(1700);
    await shot('gallery-piece-next');
    await ev(p, () => window.__eldom.ui.galleryFocus(8));
    await wait(1900);
    await shot('gallery-thanks');
    log('thanks plate: ' + JSON.stringify(await ev(p, () => document.querySelector('.gal-text').innerText)));
    await ev(p, () => window.__eldom.ui.galleryBack());
    await wait(1400);
    await ev(p, () => window.__eldom.ui.leaveGallery());
    await waitPhase(p, 'prelaunch', 15000);
    await wait(1200);
    log('left to the entrance: ' + (await st()));
    // after the release, by elevator
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000);
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await wait(900);
    await shot('gallery-panel');
    await ev(p, () => window.__eldom.ui.pressGallery());
    await waitPhase(p, 'gallery', 40000);
    await wait(1500);
    log('by elevator: ' + (await st()));
    await shot('gallery-by-elevator');
    await ev(p, () => window.__eldom.ui.galleryFocus(5));
    await wait(1600);
    await ev(p, () => window.__eldom.ui.leaveGallery());
    await waitPhase(p, 'cabin', 30000);
    await wait(800);
    log('back in the cabin: ' + (await st()));
  },
  // A visitor's whole trip in one pass, with real taps on the real controls wherever one exists.
  async tour(p, shot, log) {
    const tap = async (sel) => { await p.locator(sel).first().click({ timeout: 8000 }); };
    const hot = (label) => `.hot[aria-label^="${label}"]`;
    await ev(p, () => window.__eldom.dev.clearBook());
    await shot('01-prelaunch');
    await tap('#cap-primary'); await wait(2300); await shot('02-form');
    await tap('#lead-close'); await wait(1700);
    await tap('#cap-secondary'); await wait(900); await shot('03-question');
    await tap('#q-youtube'); await wait(4500); await shot('04-listen');
    await tap('.portal-close'); await wait(1600);
    await tap('#cap-invite-all'); await wait(700); await shot('05-invite-all');
    await tap('#invite-close'); await wait(400);
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000); await wait(1200); await shot('06-open');
    await tap('#cap-enter'); await waitPhase(p, 'cabin', 25000); await wait(900); await shot('07-cabin');
    const showCab = async (want) => { const cv = p.locator('#cab-view'); if (await cv.isVisible() && new RegExp(want).test(await cv.innerText())) { await cv.click(); await wait(1100); } };
    await showCab('PISOS');
    await tap(hot('Piso 4')); await wait(1100); await shot('08-refused');
    await showCab('PLATAFORMA');
    await tap(hot('Viajar por YouTube')); await wait(700); await shot('09-selector-press');
    await waitPhase(p, 'cabin', 10000); await wait(500);
    await tap(hot('Piso 4')); await wait(750); await shot('10-floor-press');
    await wait(2600); await shot('11-doors-closing');
    await wait(1900); await shot('12-travel');
    await waitFloor(p, 4); await wait(3200); await shot('13-world');
    await tap('#cap-invite'); await wait(700); await shot('14-world-invite');
    await tap('#invite-close'); await wait(300);
    await tap('#cap-back'); await wait(1500); await shot('15-returning');
    await waitPhase(p, 'cabin', 25000); await wait(900); await shot('16-cabin-visited');
    await tap(hot('Piso 10')); await waitPhase(p, 'gallery', 40000); await wait(1500); await shot('17-gallery');
    await wait(1800);
    if ((await state(p)).gallery.at >= 0) { await shot('17b-gallery-first-piece'); await tap('#gal-next'); } else await tap(hot('Obra 2'));
    await wait(1900); await shot('18-piece');
    await tap('#gal-back'); await wait(1300);
    if ((await state(p)).phase === 'gallery') await tap('#gal-back');
    await waitPhase(p, 'cabin', 30000); await wait(800);
    await tap(hot('PB')); await waitPhase(p, 'open', 45000); await wait(1200); await shot('19-entrance-again');
    await tap(hot('Un libro')); await wait(2300); await shot('20-book-crouch');
    await p.waitForFunction(() => window.__eldom.state().overlay === 'book', null, { timeout: 15000 }); await wait(600); await shot('21-book');
    await tap('#bk-next'); await wait(300); await shot('22-book-blank');
    await tap('#bk-close'); await wait(1800); await shot('23-carrying');
    log('end state: ' + JSON.stringify(await state(p)).slice(0, 300));
  },
  // Every official player the visitor can open, against the real services: the right video at the right second, the
  // right Spotify track, a real click starts it, leaving removes it. Fails the run on any mismatch.
  async integrations(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const cfg = await ev(p, () => window.__eldom.config());
    const portal = async () => (await state(p)).portal;
    const until = async (pred, ms) => { const t0 = Date.now(); let s; for (;;) { s = await portal(); if (s && pred(s)) return s; if (Date.now() - t0 > ms) return s; await wait(250); } };
    const frameSrc = () => ev(p, (sel) => { const f = document.querySelector(sel); return f ? f.src : ''; }, PLAYER_FRAMES);
    const playYouTube = async () => { const b = await p.locator('iframe[src*="youtube.com/embed"]').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    const playSpotify = async () => p.frameLocator('iframe[src*="open.spotify.com/embed"]').locator('button[data-testid="play-pause-button"]').first().click({ timeout: 10000 });
    const only = (opt('floors', '') || '').split(',').filter(Boolean).map(Number);
    const floors = cfg.tracks.filter((t) => !only.length || only.includes(t.floor));

    // 1. before the release: "Mientras esperás" (demo album) on both platforms
    for (const prov of ['youtube', 'spotify']) {
      await ev(p, () => window.__eldom.ui.openListen()); await wait(700);
      await ev(p, (pv) => window.__eldom.ui.chooseListen(pv), prov);
      await p.waitForSelector(PLAYER_FRAMES, { timeout: 15000 });
      const src = await frameSrc();
      check(prov === 'youtube' ? src.includes('/embed/' + cfg.demo.youtubeVideoId) : src.includes('/embed/album/' + cfg.demo.spotifyAlbumId), `listen ${prov}: embed ${src.split('?')[0]}`);
      const s0 = await until((s) => (prov === 'youtube' ? s.diag.videoId : s.diag.ready), 15000);
      check(prov === 'youtube' ? s0.diag.videoId === cfg.demo.youtubeVideoId : !!s0.diag.ready, `listen ${prov}: the player answered ${JSON.stringify(s0.diag)}`);
      try { await (prov === 'youtube' ? playYouTube() : playSpotify()); } catch (e) { log('click failed: ' + e.message.split('\n')[0]); }
      const s1 = await until((s) => s.playing, 15000);
      check(!!s1.playing, `listen ${prov}: plays after a real click ${JSON.stringify(s1.diag)}`);
      if (prov === 'spotify' && s1.diag.duration && s1.diag.duration < 35000) { const s2 = await until((s) => s.preview, 3000); check(s2.preview, 'listen spotify: preview detected → "Continuar en Spotify" offered'); }
      await shot(`listen-${prov}-playing`);
      await ev(p, () => window.__eldom.ui.closeListen()); await wait(900);
      check((await iframeCount(p)) === 0, `listen ${prov}: no player left after closing`);
    }

    // 2. after the release: every floor on both platforms
    await ev(p, () => window.__eldom.dev.released());
    for (const prov of opt('providers', 'youtube,spotify').split(',')) {
      await ev(p, () => window.__eldom.dev.interior()); await waitPhase(p, 'cabin');
      await ev(p, (pv) => window.__eldom.dev.platform(pv), prov); await wait(1600);
      for (const t of floors) {
        await ev(p, (n) => window.__eldom.dev.arrive(n), t.floor);
        await waitFloor(p, t.floor);
        await p.waitForSelector(PLAYER_FRAMES, { timeout: 15000 });
        await wait(600);
        check((await iframeCount(p)) === 1, `piso ${t.floor} ${prov}: exactly one player on screen`);
        const src = await frameSrc();
        if (prov === 'youtube') {
          check(src.includes('/embed/' + t.youtubeVideoId) && src.includes('start=' + t.youtubeStartSeconds + '&'), `piso ${t.floor} youtube: embed ${t.youtubeVideoId} start=${t.youtubeStartSeconds}`);
          const s0 = await until((s) => s.diag.videoId, 15000);
          check(s0.diag.videoId === t.youtubeVideoId, `piso ${t.floor} youtube: player loaded ${s0.diag.videoId}`);
          await playYouTube();
          const tPlay = Date.now();
          let s1 = await until((s) => s.playing && s.diag.currentTime > t.youtubeStartSeconds, 12000);
          if (!(s1.playing && s1.diag.currentTime > t.youtubeStartSeconds)) { // probably an ad first: skip it when YouTube allows
            const skip = p.frameLocator('iframe[src*="youtube.com/embed"]').locator('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, button[id^="skip-button"]');
            for (let k = 0; k < 8 && !(s1.playing && s1.diag.currentTime > t.youtubeStartSeconds); k++) { await skip.first().click({ timeout: 1500 }).catch(() => {}); s1 = await until((s) => s.playing && s.diag.currentTime > t.youtubeStartSeconds, 4000); }
            log(`piso ${t.floor} youtube: the song started after ${((Date.now() - tPlay) / 1000).toFixed(0)} s (an ad played first)`);
          }
          const ct = s1.diag.currentTime || 0;
          check(!!s1.playing && ct >= t.youtubeStartSeconds - 1 && ct < t.youtubeStartSeconds + 20, `piso ${t.floor} youtube: playing at ${ct.toFixed ? ct.toFixed(1) : ct}s (song starts at ${t.youtubeStartSeconds}s)`);
        } else {
          const id = t.spotifyTrackUri ? t.spotifyTrackUri.split(':').pop() : null;
          check(id ? src.includes('/embed/track/' + id) : src.includes('/embed/album/' + t.spotifyAlbumId), `piso ${t.floor} spotify: embed ${id ? 'track ' + id : 'album'}`);
          const s0 = await until((s) => s.diag.ready, 15000);
          check(!!s0.diag.ready, `piso ${t.floor} spotify: player ready`);
          try { await playSpotify(); } catch (e) { log('click failed: ' + e.message.split('\n')[0]); }
          const s1 = await until((s) => s.playing && s.diag.uri, 15000);
          check(!!s1.playing && (!t.spotifyTrackUri || s1.diag.uri === t.spotifyTrackUri), `piso ${t.floor} spotify: playing ${s1.diag.uri} (${Math.round((s1.diag.duration || 0) / 1000)}s${s1.preview ? ', muestra' : ''})`);
          if (s1.diag.duration && s1.diag.duration < 35000) check(s1.preview, `piso ${t.floor} spotify: preview detected → "Continuar en Spotify" offered`);
        }
        if (t.floor === floors[0].floor) await shot(`${prov}-floor-${t.floor}-playing`);
      }
      await ev(p, () => window.__eldom.ui.returnToElevator());
      await waitPhase(p, 'cabin', 25000);
      check((await iframeCount(p)) === 0, `${prov}: no player left after "volver al ascensor"`);
    }
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' integration check(s) failed: ' + fails.join(' | '));
  },
  // What the visitor sees when a player cannot work. Each case must end with an official link on screen.
  async failures(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const cfg = await ev(p, () => window.__eldom.config());
    const t = cfg.tracks[0];
    const portal = async () => (await state(p)).portal;
    const until = async (pred, ms) => { const t0 = Date.now(); let s; for (;;) { s = await portal(); if (s && pred(s)) return s; if (Date.now() - t0 > ms) return s; await wait(250); } };
    const visible = (sel) => ev(p, (q) => { const e = document.querySelector(q); if (!e) return ''; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? e.textContent.trim() : ''; }, sel);
    const officialLink = (host) => ev(p, (hh) => [...document.querySelectorAll('.portal a[href]')].filter((a) => a.href.includes(hh) && a.getBoundingClientRect().width > 0).map((a) => a.textContent.trim()), host);
    await ev(p, () => window.__eldom.dev.released());
    // a stand-in for youtube.com/embed that speaks the widget protocol and reports one error code
    const ytStub = (code) => `<!doctype html><body style="background:#000"><script>
      addEventListener('message', (e) => { let d; try { d = JSON.parse(e.data); } catch { return; }
        if (d.event === 'listening') { parent.postMessage(JSON.stringify({ event: 'initialDelivery', info: { playerState: -1 } }), '*');
          setTimeout(() => parent.postMessage(JSON.stringify({ event: 'onError', info: ${code} }), '*'), 300); } });
    </script></body>`;
    const floorWith = async (prov) => {
      await ev(p, () => window.__eldom.dev.interior()); await waitPhase(p, 'cabin');
      await ev(p, (pv) => window.__eldom.dev.platform(pv), prov); await wait(1500);
      await ev(p, (n) => window.__eldom.dev.arrive(n), t.floor); await waitFloor(p, t.floor);
    };
    const leave = async () => { await ev(p, () => window.__eldom.ui.returnToElevator()); await waitPhase(p, 'cabin', 25000); await p.unrouteAll({ behavior: 'ignoreErrors' }); };

    // 1. the real YouTube with a video that does not exist (wrong id, removed or private)
    await p.route('https://www.youtube.com/embed/**', (r) => r.continue({ url: r.request().url().replace('/embed/' + t.youtubeVideoId, '/embed/doxiX5RHT7R') }));
    await floorWith('youtube');
    let s = await until((x) => x.diag.error != null || x.mode === 'link', 20000);
    check(s.mode === 'link', `youtube missing video: the player reported error ${s.diag.error} → official link box (mode=${s.mode})`);
    check((await officialLink('youtube.com/watch')).length > 0, 'youtube missing video: a visible link to YouTube');
    await shot('yt-missing-video');
    await leave();

    // 2..4. error codes the real player sends: embedding disabled (101, 150) and no referrer (153)
    for (const code of [150, 101, 153]) {
      await p.route('https://www.youtube.com/embed/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: ytStub(code) }));
      await floorWith('youtube');
      s = await until((x) => x.mode === 'link', 12000);
      check(s.mode === 'link' && s.diag.error === code, `youtube error ${code}: official link box (mode=${s.mode}, error=${s.diag.error})`);
      check((await visible('.portal-note')).length > 0, `youtube error ${code}: explanation shown ("${await visible('.portal-note')}")`);
      if (code === 150) await shot('yt-error-150');
      await leave();
    }

    // 5. YouTube unreachable (network down, blocked by a firewall or a content filter)
    await p.route('https://www.youtube.com/**', (r) => r.abort('connectionrefused'));
    await floorWith('youtube');
    await wait(8500);
    s = await portal();
    check((await visible('.portal-note')).length > 0 && (await officialLink('youtube.com')).length === 1, `youtube unreachable at 8 s: note "${await visible('.portal-note')}" + one link (mode=${s.mode})`);
    await shot('yt-unreachable');
    s = await until((x) => x.mode === 'link', 15000);
    check(s.mode === 'link' && (await officialLink('youtube.com/watch')).length > 0, `youtube unreachable at 20 s: official link box (mode=${s.mode})`);
    await shot('yt-unreachable-link');
    await leave();

    // 6. Spotify: a track that does not exist (or is not out yet in this market)
    await p.route('https://open.spotify.com/embed/**', (r) => r.continue({ url: r.request().url().replace(/\/embed\/track\/[A-Za-z0-9]{22}/, '/embed/track/0000000000000000000000') }));
    await floorWith('spotify');
    await wait(9000);
    s = await portal();
    log('spotify missing track: player said ' + JSON.stringify(s.diag) + ' note="' + (await visible('.portal-note')) + '"');
    check((await officialLink('open.spotify.com')).length > 0, 'spotify missing track: a visible link to Spotify (track or album)');
    await shot('sp-missing-track');
    await leave();

    // 7. Spotify unreachable
    await p.route('https://open.spotify.com/**', (r) => r.abort('connectionrefused'));
    await floorWith('spotify');
    await wait(8500);
    check((await visible('.portal-note')).length > 0 && (await officialLink('open.spotify.com')).length > 0, `spotify unreachable at 8 s: note "${await visible('.portal-note')}" + links`);
    await shot('sp-unreachable');
    s = await until((x) => x.mode === 'link', 15000);
    check(s.mode === 'link', `spotify unreachable at 20 s: official link box (mode=${s.mode})`);
    await shot('sp-unreachable-link');
    await leave();

    // 8. a silent player the visitor is already using stays (only the note appears)
    await p.route('https://www.youtube.com/embed/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body style="background:#000"><button style="width:100%;height:100vh">x</button></body>' }));
    await floorWith('youtube');
    await wait(1500);
    { const b = await p.locator('.portal iframe').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
    await wait(20000);
    s = await portal();
    check(s.mode === 'embed', `silent player in use: kept on screen after 20 s (mode=${s.mode})`);
    await leave();

    // 9. after any failure, a working floor still works (no state left behind)
    await floorWith('youtube');
    s = await until((x) => x.diag.videoId, 15000);
    check(s.mode === 'embed' && s.diag.videoId === t.youtubeVideoId, `recovery: next visit loads the real player again (${s.mode}, ${s.diag.videoId})`);
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' failure-mode check(s) failed: ' + fails.join(' | '));
  },
  // The puzzle level end to end, with real taps: arrive by elevator, painting, hatch, a wrong try, the hint, the clue
  // in the water, the deduced combination, the object → page → book, "Nivel completado", no second page, reload,
  // reset, and the card's way back to the elevator.
  async level(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const tap = async (sel) => { await p.locator(sel).first().click({ timeout: 8000 }); };
    const hot = (label) => `.hot[aria-label^="${label}"]`;
    const lv = async () => (await state(p)).level;
    const untilLv = async (pred, ms = 15000) => { const t0 = Date.now(); let s; for (;;) { s = await lv(); if (s && pred(s)) return s; if (Date.now() - t0 > ms) return s; await wait(200); } };
    const cfg = await ev(p, () => window.__eldom.config().level);
    await ev(p, () => { window.__eldom.dev.clearBook(); window.__eldom.dev.levelReset(); });
    await ev(p, () => window.__eldom.dev.released());
    await waitPhase(p, 'open', 20000); await wait(800);

    // arrive from the elevator
    await tap('#cap-enter'); await waitPhase(p, 'cabin', 25000); await wait(700);
    await tap(hot('Viajar por YouTube')); await wait(700); await waitPhase(p, 'cabin', 10000); await wait(400);
    await tap(hot('Piso 1')); await waitFloor(p, 1); await wait(3200);
    await shot('01-arrive');
    let s = await lv();
    check(s.here && s.stage === 0 && !s.done, `arrived on floor 1 by elevator: level at the start (stage ${s.stage})`);
    check(((await state(p)).portal || {}).provider === 'youtube', 'the song\'s official player is on screen');

    // 1. the painting moves
    await tap(hot('Una pared con un cuadro')); await wait(1500); await shot('02-wall');
    await tap(hot('Mover el cuadro'));
    s = await untilLv((x) => x.stage === 1 && !x.busy); await wait(300); await shot('03-painting-moved');
    check(s.stage === 1, 'the painting slid aside: a hatch behind it');
    // 2. the hatch opens, the box appears
    await tap(hot('Abrir la tapa'));
    s = await untilLv((x) => x.stage === 2 && x.view === 'box' && !x.busy); await wait(1400); await shot('04-box');
    check(s.stage === 2 && s.view === 'box', `the hatch opened: a box with three dials (${s.dials.join(', ')})`);
    // 3. a wrong try (the dials as found)
    await tap(hot('Probar la combinación')); await wait(500);
    s = await lv();
    check(s.stage === 2 && s.tries === 1 && /No cede/.test(s.tip), `wrong combination: the box stays shut ("${s.tip}")`);
    await shot('05-wrong');
    await wait(2300);
    // optional hint, two levels
    await tap('#lv-hint'); await wait(400); s = await lv();
    check(s.tip.length > 10, `hint 1: "${s.tip}"`);
    await tap('#lv-tip-more'); await wait(400); s = await lv();
    check(/agua/.test(s.tip), `hint 2: "${s.tip}"`);
    await shot('06-hint');
    await tap('#lv-tip-close'); await wait(300);
    // 4. the clue: step back, look at the stones; the marks are only in the water
    await tap('#lv-back'); await wait(1500);
    await tap(hot('Tres piedras')); await wait(1800); await shot('07-clue');
    s = await lv();
    check(s.set && s.set.layer2 && s.set.marks.filter(Boolean).length === 3, `clue: marks under the stones in the water only: ${s.set && s.set.marks.join(' ')} (stones ${cfg.stones.join(', ')})`);
    const order = []; s.set.marks.forEach((m, i) => { if (m) order[m - 1] = cfg.stones[i]; });
    log('deduced from the reflection: ' + order.join(' → '));
    // 5. set the dials to the deduced order and open
    await tap('#lv-back'); await wait(1500);
    await tap(hot('Una pared con un cuadro')); await wait(1400);
    await tap(hot('Mirar la caja')); await wait(1400);
    for (let i = 0; i < 3; i++) for (let k = 0; k < cfg.symbols.length; k++) { s = await lv(); if (s.dials[i] === order[i]) break; await tap(hot(`Rueda ${i + 1}`)); await wait(380); }
    s = await lv();
    check(order.every((id, i) => s.dials[i] === id), `dials set by taps to ${s.dials.join(', ')}`);
    await tap(hot('Probar la combinación'));
    s = await untilLv((x) => x.stage === 3 && !x.busy, 9000); await wait(500); await shot('08-open');
    check(s.stage === 3, 'the box opened: something inside');
    // 6. take it: it turns into a page and joins the book, which opens on it
    await tap(hot('Tomar lo que hay en la caja')); await wait(1300); await shot('09-transform');
    await p.waitForFunction(() => window.__eldom.state().overlay === 'book', null, { timeout: 15000 }); await wait(600);
    await shot('10-book-page');
    const pageText = (await p.locator('#bk-page').innerText()).replace(/\s+/g, ' ');
    check(/CONTENIDO PROVISIONAL/.test(pageText) && /Tan Buena/i.test(pageText), `the book opens on the new page: "${pageText}"`);
    let st = await state(p);
    check(st.book.found && st.book.pages.filter((x) => x === s.page).length === 1, `page ${s.page} in the book, once`);
    // close the book → "Nivel completado"
    await tap('#bk-close'); await wait(700);
    s = await lv();
    check(s.card && (await p.locator('#lv-card').innerText()).includes('NIVEL COMPLETADO'), '"NIVEL COMPLETADO" after closing the book');
    await shot('11-done');
    // the page cannot be obtained twice
    await ev(p, () => { window.__eldom.ui.levelTake(); window.__eldom.ui.levelTap('lv-object'); }); await wait(900);
    st = await state(p);
    check(st.book.pages.length === 1 && st.level.done && st.level.stage === 4, 'taking again does nothing (one page)');
    // keep exploring
    await tap('#lv-keep'); await wait(1500);
    s = await lv();
    check(!s.card && s.view === 'wide' && (await state(p)).phase === 'floor' && (await p.locator(hot('Tomar')).count()) >= 0 && !(await p.locator(hot('Tomar')).isVisible().catch(() => false)), '"Seguir explorando": back on the floor, nothing left to take');
    check(await p.locator('#lv-reset').isVisible(), '"Reiniciar nivel" offered once done');
    // reload: completion and page persist
    await p.reload(); await p.waitForFunction(() => window.__eldom && window.__eldom.state && window.__eldom.state().phase !== 'boot', null, { timeout: 60000 }); await wait(1500);
    st = await state(p);
    check(st.level.done && st.level.stage === 4 && st.book.pages.includes(st.level.page), `after reload: level done (saved ${JSON.stringify(st.level.saved)}), page still in the book`);
    await ev(p, () => window.__eldom.dev.levelFloor()); await waitFloor(p, 1); await wait(2600);
    await shot('12-after-reload');
    s = await lv();
    check(s.here && s.done && !(await p.locator(hot('Tomar')).isVisible().catch(() => false)), 'the finished level shows open and empty');
    // reset (two taps: the first one asks)
    await tap('#lv-reset'); await wait(250);
    check((await p.locator('#lv-reset').innerText()).includes('REINICIAR?'), `reset asks first ("${await p.locator('#lv-reset').innerText()}")`);
    await tap('#lv-reset'); await wait(900);
    st = await state(p);
    check(st.level.stage === 0 && !st.level.done && !st.book.pages.includes(st.level.page), 'reset: level from the start, its page out of the book');
    await shot('13-reset');
    // the card's other way out: back to the elevator (quick solve through the same controls)
    for (const id of ['lv-wall', 'lv-painting', 'lv-hatch']) { await ev(p, (x) => window.__eldom.ui.levelTap(x), id); await untilLv((x) => !x.busy, 6000); await wait(1300); }
    await ev(p, () => window.__eldom.dev.levelSolve());
    await ev(p, () => window.__eldom.ui.levelTap('lv-latch')); await untilLv((x) => x.stage === 3 && !x.busy, 9000);
    await ev(p, () => window.__eldom.ui.levelTap('lv-object'));
    await p.waitForFunction(() => window.__eldom.state().overlay === 'book', null, { timeout: 15000 }); await wait(400);
    await tap('#bk-close'); await wait(600);
    await tap('#lv-elev'); await waitPhase(p, 'cabin', 30000); await wait(600);
    st = await state(p);
    check(st.phase === 'cabin' && st.level.done && st.book.pages.length === 1, '"Volver al ascensor" from the card: back in the cabin, level done');
    check(JSON.stringify(st.visited) === '[1]', `no other floor touched (visited ${JSON.stringify(st.visited)})`);
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' level check(s) failed: ' + fails.join(' | '));
  },
  // DEV "Probar reproductores": the same check a phone can run by hand.
  async selftest(p, shot, log) {
    const rows = await p.evaluate(() => window.__eldom.dev.playerTest());
    await shot('selftest');
    for (const r of rows) log(`${r.ok ? 'ok   ' : 'FAIL '} ${r.provider} piso ${r.floor} · ${r.seconds} s ${r.why}`);
    const bad = rows.filter((r) => !r.ok);
    if (bad.length) throw new Error(`${bad.length} player(s) did not answer`);
    const st = await state(p);
    if (st.phase !== 'cabin' || st.visited.length) throw new Error('the self-test left state behind: ' + JSON.stringify({ phase: st.phase, visited: st.visited }));
    log('all ' + rows.length + ' players answered; back in the cabin, nothing marked as visited');
  },
  // The cabin panel (the platform marks on the selector, no envelopes on the floor rows) and the minimized player on
  // the worlds: smallest official size, the same frame (never reloaded), the song goes on, remembered for the visit;
  // YouTube never under 200 × 200.
  async mini(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const st = () => state(p);
    const vw = p.viewportSize();
    const portal = async () => (await state(p)).portal;
    const until = async (pred, ms) => { const t0 = Date.now(); let s; for (;;) { s = await portal(); if (s && pred(s)) return s; if (Date.now() - t0 > ms) return s; await wait(250); } };
    const box = () => p.locator('.portal iframe, .portal .portal-linkbox').first().boundingBox();
    const sz = (b) => (b ? `${Math.round(b.width)}×${Math.round(b.height)}` : 'none');
    const playYouTube = async () => { const b = await p.locator('iframe[src*="youtube.com/embed"]').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    const playSpotify = async () => p.frameLocator('iframe[src*="open.spotify.com/embed"]').locator('button[data-testid="play-pause-button"]').first().click({ timeout: 10000 });
    const clock = (s) => (s.provider === 'youtube' ? s.diag.currentTime || 0 : (s.diag.position || 0) / 1000);

    await ev(p, () => window.__eldom.dev.released());
    await ev(p, () => sessionStorage.removeItem('eldom.mini'));
    // the panel
    await ev(p, () => window.__eldom.dev.interior()); await waitPhase(p, 'cabin'); await wait(1500);
    const env = await p.locator('.hot[aria-label^="Invitar a alguien al mundo"]').count();
    check(env === 0, `no invitation envelopes on the floor rows (${env} hotspots)`);
    const logos = await ev(p, () => window.__eldom.state().panel);
    check(logos && logos.logos === 2, `the selector carries both platform marks (${JSON.stringify(logos)})`);
    await shot('01-cabin');

    for (const prov of (opt('providers', 'youtube,spotify')).split(',')) {
      await ev(p, (pv) => window.__eldom.dev.platform(pv), prov); await wait(900);
      await ev(p, () => window.__eldom.dev.arrive(2)); await waitFloor(p, 2); await wait(2600);
      let s = await st();
      const b0 = await box();
      check(s.portal && !s.portal.mini && !!b0, `${prov}: arrives full size (${sz(b0)}, ${s.portal && s.portal.mode})`);
      if (prov === 'youtube') check(b0 && b0.width >= 199.5 && b0.height >= 199.5, `${prov}: full size is never under YouTube's 200 px minimum (${sz(b0)})`);
      const embed = s.portal.mode === 'embed';
      let playing = false;
      if (embed) {
        await until((x) => (prov === 'youtube' ? x.diag.videoId : x.diag.ready), 15000);
        try { await (prov === 'youtube' ? playYouTube() : playSpotify()); } catch (e) { log('click failed: ' + e.message.split('\n')[0]); }
        const s1 = await until((x) => x.playing && clock(x) > (prov === 'youtube' ? 189 : 0.5), 20000);
        playing = !!s1.playing;
        log(`${prov}: ${playing ? 'playing at ' + clock(s1).toFixed(1) + ' s' : 'playback did not start in the test browser (an ad or a login wall): the size checks still run'}`);
      }
      await ev(p, () => { const f = document.querySelector('.portal iframe'); if (f) f.dataset.stamp = 'same-frame'; });
      await p.locator('.portal-mini').click(); await wait(700);
      s = await st();
      const b1 = await box();
      const stamp = await ev(p, () => { const f = document.querySelector('.portal iframe'); return f ? f.dataset.stamp || 'a new frame' : 'link box'; });
      check(s.portal.mini, `${prov}: MINIMIZAR minimizes it`);
      if (embed) check(stamp === 'same-frame', `${prov}: the same frame, never reloaded (${stamp})`);
      if (prov === 'youtube') check(b1 && b1.width >= 199.5 && b1.height >= 199.5 && b1.height <= 201 && b1.width <= b0.width + 1, `${prov}: the smallest player YouTube allows (${sz(b1)})`);
      else check(b1 && b1.height >= 79 && b1.height <= 81, `${prov}: Spotify's compact bar (${sz(b1)})`);
      check(b1 && b1.x >= 0 && b1.x + b1.width <= vw.width && b1.x + b1.width >= vw.width - 40 && b1.y + b1.height <= vw.height && b1.y >= vw.height * 0.3, `${prov}: lower right corner, fully on screen (x ${b1 && Math.round(b1.x)}, y ${b1 && Math.round(b1.y)})`);
      const btn = p.locator('.portal-mini');
      check(await btn.isVisible() && /AMPLIAR/.test(await btn.innerText()), `${prov}: "AMPLIAR" stays at hand`);
      if (playing) {
        const c0 = clock(await portal()); await wait(3500);
        const s2 = await portal();
        check(s2.playing && clock(s2) > c0 + 2, `${prov}: the song goes on while minimized (${c0.toFixed(1)} → ${clock(s2).toFixed(1)} s)`);
      }
      await shot(`02-${prov}-mini`);
      // walking around with it minimized, then the next world: it remembers
      await ev(p, () => window.__eldom.dev.arrive(3)); await waitFloor(p, 3); await wait(2600);
      s = await st();
      const b2 = await box();
      check(s.portal.mini && b2 && b2.height <= 201, `${prov}: the next world starts minimized, remembered for the visit (${sz(b2)})`);
      await p.locator('.portal-mini').click(); await wait(700);
      s = await st();
      const b3 = await box();
      check(!s.portal.mini && b3 && b3.width * b3.height > b2.width * b2.height * 1.3, `${prov}: AMPLIAR brings it back (${sz(b3)})`);
      await shot(`03-${prov}-back`);
      await ev(p, () => window.__eldom.ui.returnToElevator()); await waitPhase(p, 'cabin', 25000); await wait(600);
    }
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' mini check(s) failed: ' + fails.join(' | '));
  },
  // "Mientras esperás" minimized: the song goes on while the visitor uses the entrance (its buttons, the sign-up
  // plate), AMPLIAR brings the listening view back, CERRAR ends it from the minimized state; leaving the page:
  // Spotify goes on, YouTube pauses (no background player).
  async waiting(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const vw = p.viewportSize();
    const portal = async () => (await state(p)).portal;
    const until = async (pred, ms) => { const t0 = Date.now(); let s; for (;;) { s = await portal(); if (s && pred(s)) return s; if (Date.now() - t0 > ms) return s; await wait(250); } };
    const block = () => p.locator('.portal').boundingBox();
    const at = (b) => (b ? `${Math.round(b.width)}×${Math.round(b.height)} at ${Math.round(b.x)},${Math.round(b.y)}` : 'none');
    const overlap = (a, b) => !!(a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height);
    const onScreen = (b) => !!(b && b.x >= 0 && b.y >= 0 && b.x + b.width <= vw.width && b.y + b.height <= vw.height);
    const playYouTube = async () => { const b = await p.locator('iframe[src*="youtube.com/embed"]').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    const playSpotify = async () => p.frameLocator('iframe[src*="open.spotify.com/embed"]').locator('button[data-testid="play-pause-button"]').first().click({ timeout: 10000 });
    const clock = (s) => (s.provider === 'youtube' ? s.diag.currentTime || 0 : (s.diag.position || 0) / 1000);
    const pageHidden = (hidden) => ev(p, (hd) => {
      if (hd) { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); }
      else { delete document.hidden; delete document.visibilityState; }
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);

    for (const prov of (opt('providers', 'youtube,spotify')).split(',')) {
      await ev(p, () => window.__eldom.ui.openListen()); await wait(700);
      await ev(p, (pv) => window.__eldom.ui.chooseListen(pv), prov);
      await p.waitForSelector('.portal iframe, .portal .portal-linkbox', { timeout: 15000 }); await wait(1800);
      let s = await state(p);
      check(s.overlay === 'listen' && s.portal && !s.portal.mini, `${prov}: "Mientras esperás" opens full size (overlay ${s.overlay})`);
      const embed = s.portal.mode === 'embed';
      let playing = false;
      if (embed) {
        await until((x) => (prov === 'youtube' ? x.diag.videoId : x.diag.ready), 15000);
        try { await (prov === 'youtube' ? playYouTube() : playSpotify()); } catch (e) { log('click failed: ' + e.message.split('\n')[0]); }
        const s1 = await until((x) => x.playing && clock(x) > 0.5, 20000);
        playing = !!s1.playing;
        log(`${prov}: ${playing ? 'playing at ' + clock(s1).toFixed(1) + ' s' : 'playback did not start in the test browser: the layout checks still run'}`);
      }
      await ev(p, () => { const f = document.querySelector('.portal iframe'); if (f) f.dataset.stamp = 'same-frame'; });
      await p.locator('.portal-mini').click(); await wait(1700);
      s = await state(p);
      const b1 = await block();
      check(s.portal && s.portal.mini && !s.overlay, `${prov}: MINIMIZAR frees the entrance (overlay ${s.overlay})`);
      if (embed) check((await ev(p, () => { const f = document.querySelector('.portal iframe'); return f ? f.dataset.stamp || 'a new frame' : 'none'; })) === 'same-frame', `${prov}: the same frame, never reloaded`);
      const caps = [];
      for (const sel of ['#cap-primary', '#cap-secondary']) if (await p.locator(sel).isVisible()) caps.push(await p.locator(sel).boundingBox());
      check(caps.length === 2 && caps.every((c) => !overlap(b1, c)) && onScreen(b1), `${prov}: the player (${at(b1)}) sits clear of the entrance buttons, fully on screen`);
      if (playing) {
        const c0 = clock(await portal()); await wait(3000);
        const s2 = await portal();
        check(s2.playing && clock(s2) > c0 + 2, `${prov}: the song goes on while minimized (${c0.toFixed(1)} → ${clock(s2).toFixed(1)} s)`);
      }
      await shot(`01-${prov}-mini`);
      // signing up while it plays
      await p.locator('#cap-primary').click(); await wait(1800);
      s = await state(p);
      const b2 = await block(), plate = await p.locator('#plate').boundingBox();
      check(s.overlay === 'form' && s.portal && s.portal.mini, `${prov}: the sign-up plate opens with the player still on`);
      check(!overlap(b2, plate) && onScreen(b2), `${prov}: the player (${at(b2)}) keeps clear of the plate (${at(plate)})`);
      if (playing) {
        const c0 = clock(await portal()); await wait(2500);
        const s2 = await portal();
        check(s2.playing && clock(s2) > c0 + 1.5, `${prov}: still sounding while signing up (${c0.toFixed(1)} → ${clock(s2).toFixed(1)} s)`);
      }
      await shot(`02-${prov}-form`);
      await ev(p, () => window.__eldom.ui.closeForm()); await wait(1000);
      // leaving the page
      if (playing) {
        await pageHidden(true); await wait(3500);
        const s3 = await portal();
        if (prov === 'youtube') check(!s3.playing, 'youtube: leaving the page pauses it (YouTube allows no background player)');
        else check(s3.playing && clock(s3) > 0, `spotify: leaving the page, the song goes on (${clock(s3).toFixed(1)} s)`);
        await pageHidden(false); await wait(600);
      }
      // AMPLIAR brings the listening view back; CERRAR ends it from the minimized state
      await p.locator('.portal-mini').click(); await wait(1700);
      s = await state(p);
      check(s.portal && !s.portal.mini && s.overlay === 'listen', `${prov}: AMPLIAR brings the listening view back (overlay ${s.overlay})`);
      await p.locator('.portal-mini').click(); await wait(1200);
      await p.locator('.portal .portal-close').click(); await wait(1000);
      s = await state(p);
      const left = await ev(p, (sel) => [...document.querySelectorAll(sel)].map((f) => f.src.split('?')[0]), PLAYER_FRAMES);
      check(!s.portal && !s.overlay && left.length === 0, `${prov}: CERRAR while minimized ends it (portal ${s.portal ? s.portal.provider : 'none'}, overlay ${s.overlay}, frames ${JSON.stringify(left)})`);
      check(await p.locator('#cap-primary').isVisible(), `${prov}: and the entrance stays as it was`);
    }
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' waiting check(s) failed: ' + fails.join(' | '));
  },
  // Sign-ups → the band's sheet (the real Apps Script on a mock server, another port like Google's): one row as typed,
  // sent as text/plain (no preflight), the same person from another device stays one row, the honeypot sends nothing,
  // a busy sheet is retried, an unreachable one shows the error and keeps what the visitor typed.
  async leads(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const here = new URL(p.url());
    if (!/^(127\.0\.0\.1|localhost)$/.test(here.hostname) || flag('dist')) { log('skipped: needs the local page server (the mock sheet), not --url or --dist'); return; }
    const mock = await LeadsMock.start();
    const open = async (mode) => { here.search = '?leads=' + mode; await p.goto(here.toString()); await waitPhase(p, 'prelaunch'); await wait(1500); };
    const closed = () => p.waitForFunction(() => !window.__eldom.state().overlay, null, { timeout: 15000 });
    const signUp = async (v, bot) => {
      await ev(p, () => window.__eldom.ui.openForm()); await wait(1500);
      for (const k of ['name', 'whatsapp', 'email', 'instagram']) await p.fill('#lead-' + k, v[k] || '');
      await p.locator('#lead-consent').check({ force: true });
      if (bot) await ev(p, () => { document.querySelector('#lead-website').value = 'http://spam.example'; });
      await clickSubmit(p);
    };
    const confirmed = async () => { await p.waitForSelector('#plate-confirm:not([hidden])', { timeout: 25000 }); return p.locator('#plate-confirm .conf-main').innerText(); };
    const localLeads = () => ev(p, () => JSON.parse(localStorage.getItem('eldom.leads.v1') || '[]').length);
    const SAME = { name: 'Prueba', whatsapp: '+598 99 123 456', email: 'Prueba@Example.com', instagram: '@usuario.prueba' };

    // 0. someone who signed up in the device-only days: it stays in their browser...
    await open('none');
    await ev(p, () => window.__eldom.dev.clearLead());
    await signUp(SAME);
    await confirmed(); await closed();
    check((await localLeads()) === 1 && (await state(p)).registered && mock.requests.length === 0, 'device-only days: the sign-up stays in this browser and the page shows it reserved');
    // ...and with the sheet on, that earlier sign-up neither hides the form nor stops the send
    await open('mock');
    check(!(await state(p)).registered && (await p.locator('#cap-primary').isVisible()) && !(await p.locator('#cap-reserved').isVisible()),
      'with the sheet on, the page offers the form again ("AVISAME…", not "TU PISO QUEDÓ RESERVADO")');
    check(mock.requests.length === 0 && (await localLeads()) === 1, 'nothing kept in the browser is sent or deleted on its own');
    check(/planilla/.test(await p.locator('#privacy-where').innerText()), 'the privacy note says the sign-ups go to the band\'s sheet');
    // 1. one sign-up, one row, as typed — the same person as in the browser-only days
    await signUp(SAME);
    const c1 = await confirmed();
    let rows = mock.rows();
    const r = rows[0] || [];
    check(rows.length === 1 && r[1] === 'Prueba' && r[2] === '+59899123456' && r[3] === 'prueba@example.com' && r[4] === 'usuario.prueba' && r[5] === 'Sí',
      `one row in the sheet, as typed (${JSON.stringify(r.slice(0, 6))})`);
    check(/^prelaunch:127\.0\.0\.1/.test(r[8] || '') && r[6] && /Acepto recibir/.test(r[7] || ''), `with its origin and the consent the visitor accepted (${r[8]}, ${r[6]})`);
    check(mock.requests.length === 1 && /^text\/plain/.test(mock.requests[0].type) && mock.preflights === 0, `sent once as ${mock.requests[0] && mock.requests[0].type}, no CORS preflight (${mock.preflights})`);
    check(!/ya estabas/i.test(c1), `the visitor sees the confirmation only after the sheet's answer ("${c1}")`);
    check((await localLeads()) === 1, 'the old browser-only sign-up is left as it was (not migrated, not deleted)');
    await shot('01-confirmed');
    await closed();
    // 2. the same person again (same browser, different WhatsApp): it is sent, and the sheet answers it is the same one
    await signUp({ email: 'PRUEBA@example.com', whatsapp: '+598 98 765 432' });
    const c2 = await confirmed();
    check(mock.requests.length === 2 && mock.rows().length === 1 && /ya estabas/i.test(c2), `sent again and the sheet keeps one row ("${c2}")`);
    await closed();
    // 3. a bot filling the hidden field: told yes, nothing is sent
    const sent = mock.requests.length;
    await signUp({ email: 'bot@example.com' }, true);
    await confirmed();
    check(mock.requests.length === sent && mock.rows().length === 1, 'the honeypot sends nothing');
    await closed();
    // 4. a busy sheet (more than 30 at once): retried until it answers
    mock.busy = 2;
    const before = mock.requests.length;
    await signUp({ email: 'segunda@example.com' });
    await confirmed();
    check(mock.rows().length === 2 && mock.requests.length - before === 3, `a busy sheet is retried (${mock.requests.length - before} tries) and the row lands`);
    await closed();
    // 5. the sheet unreachable: the visitor is told and keeps what they typed; later it works
    mock.down = true;
    await signUp({ name: 'Tercera', email: 'tercera@example.com' });
    await p.waitForFunction(() => !document.querySelector('#err-group').hidden, null, { timeout: 30000 });
    const errText = await p.locator('#err-group').innerText();
    check(/No pudimos registrarte/.test(errText) && (await p.inputValue('#lead-email')) === 'tercera@example.com' && (await p.inputValue('#lead-name')) === 'Tercera',
      `an unreachable sheet shows "${errText}" and keeps the form filled`);
    await shot('02-unreachable');
    mock.down = false;
    await clickSubmit(p);
    await confirmed();
    check(mock.rows().length === 3, 'once the sheet is back, the same form goes through');
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' leads check(s) failed: ' + fails.join(' | '));
  },
  // The live site end to end against the band's REAL sheet: one sign-up through the real form, confirmed only by
  // Google's answer, then the same person again (the sheet must recognise it). Writes one row: only with --url and
  // --real-leads, and with --lead-name / --lead-email that say it is a test.
  async leadslive(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    if (!opt('url', '') || !flag('real-leads')) { log('skipped: needs --url and --real-leads (it writes one row to the real sheet)'); return; }
    const name = opt('lead-name', ''), email = opt('lead-email', '');
    if (!name || !email) throw new Error('leadslive needs --lead-name and --lead-email');
    const answers = [];
    p.on('response', async (r) => {
      if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(r.url())) return;
      try { answers.push(await r.json()); } catch { /* the redirect itself has no body */ }
    });
    const send = async () => {
      await ev(p, () => window.__eldom.ui.openForm()); await wait(1600);
      await p.fill('#lead-name', name); await p.fill('#lead-email', email);
      for (const k of ['whatsapp', 'instagram']) await p.fill('#lead-' + k, '');
      await p.locator('#lead-consent').check({ force: true });
      await clickSubmit(p);
      await p.waitForSelector('#plate-confirm:not([hidden]), #err-group:not([hidden])', { timeout: 60000 });
      const ok = await p.locator('#plate-confirm').isVisible();
      return { ok, text: await p.locator(ok ? '#plate-confirm .conf-main' : '#err-group').innerText() };
    };
    check(/planilla/.test(await p.locator('#privacy-where').innerText()), 'the live privacy note says the sign-ups go to the band\'s sheet');
    const first = await send();
    const a1 = answers.find((a) => a && a.ok);
    log('the sheet answered: ' + JSON.stringify(answers));
    check(first.ok && !/ya estabas/i.test(first.text) && a1 && a1.id && !a1.duplicate, `the live form shows the confirmation after Google's answer ("${first.text}", row id ${a1 && a1.id})`);
    await shot('01-confirmed');
    await p.waitForFunction(() => !window.__eldom.state().overlay, null, { timeout: 15000 });
    const n = answers.length;
    const second = await send();
    const a2 = answers.slice(n).find((a) => a && a.ok);
    check(second.ok && /ya estabas/i.test(second.text) && a2 && a2.duplicate, `the same person again: the real sheet already has the row ("${second.text}")`);
    await shot('02-again');
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' leadslive check(s) failed: ' + fails.join(' | '));
  },
  // Free movement: keys, mouse look, run, collisions, the elevator by walking; on touch screens the joystick
  // (real touch events through CDP), two thumbs at once, and the hint ring.
  async roam(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const st = () => state(p);
    const touch = !!(await ev(p, () => matchMedia('(pointer: coarse)').matches));
    const hold = async (keysDown, ms) => { for (const k of keysDown) await p.keyboard.down(k); await wait(ms); for (const k of [...keysDown].reverse()) await p.keyboard.up(k); await wait(250); };
    const cdp = touch ? await p.context().newCDPSession(p) : null;
    const T = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
    const vw = p.viewportSize();

    await ev(p, () => window.__eldom.dev.released());
    await ev(p, () => window.__eldom.dev.arrive(2)); await waitFloor(p, 2); await wait(2500);
    let s = await st();
    check(s.roam.scene === 'floor', `free walking on a world (scene ${s.roam.scene})`);
    if (touch) check(s.roam.ghost, 'touch screen: the joystick hint ring is shown');
    await shot('01-arrive');
    const c0 = s.cam;

    if (!touch) {
      // walk forward with W
      await hold(['w'], 1500);
      s = await st();
      const fwd = s.cam.z - c0.z;
      check(fwd > 1.5 && Math.abs(s.cam.x - c0.x) < 0.3, `W walks forward ${fwd.toFixed(2)} m (facing the world)`);
      check(s.portal && s.portal.dock === 'compact', `the player docks in the corner once the visitor moves (${s.portal && s.portal.dock})`);
      await shot('02-walked');
      // run with Shift: farther in the same time
      const z1 = s.cam.z; await hold(['Shift', 'w'], 1000); s = await st();
      check(s.cam.z - z1 > 2.2, `Shift runs (${(s.cam.z - z1).toFixed(2)} m in 1 s)`);
      // mouse drag looks around (no angle limit)
      const y0 = s.cam.yaw;
      await p.mouse.move(vw.width * 0.3, vw.height * 0.5); await p.mouse.down();
      for (let i = 1; i <= 12; i++) await p.mouse.move(vw.width * 0.3 + i * 60, vw.height * 0.5 - i * 6);
      await p.mouse.up(); await wait(300);
      s = await st();
      check(y0 - s.cam.yaw > 2.0, `mouse drag turns the view ${((y0 - s.cam.yaw) * 57.3).toFixed(0)}° to the right (beyond the old ±24°)`);
      check(s.cam.pitch > 0.1, `and looks up (${(s.cam.pitch * 57.3).toFixed(0)}°)`);
      await shot('03-looked');
      // E / Q turn
      const y1 = s.cam.yaw; await hold(['e'], 600); s = await st();
      check(y1 - s.cam.yaw > 0.6, `E turns right (${((y1 - s.cam.yaw) * 57.3).toFixed(0)}°)`);
      // walk back into the elevator: face it and walk
      await ev(p, () => window.__eldom.dev.roamTo(0, 3.2, 0));
      await hold(['w'], 1600);
      await waitPhase(p, 'cabin', 25000);
      check((await st()).phase === 'cabin', 'walking into the open elevator takes the visitor back to the cabin');
    } else {
      // the left thumb walks: press in the lower-left, push up, hold
      const lying = vw.width > vw.height;
      const jx = vw.width * (lying ? 0.14 : 0.2), jy = lying ? vw.height * 0.74 : Math.min(vw.height * 0.55, (s.portal ? (await p.locator('.portal').boundingBox()).y : vw.height) - 90);
      await T('touchStart', [[jx, jy, 1]]);
      for (let i = 1; i <= 6; i++) { await T('touchMove', [[jx, jy - i * 9, 1]]); await wait(30); }
      await wait(250);
      check((await st()).roam.joy, 'the joystick appears under the thumb');
      await shot('02-joystick');
      for (let i = 0; i < 18; i++) { await T('touchMove', [[jx + (i % 2), jy - 54, 1]]); await wait(80); }
      await T('touchEnd', []); await wait(300);
      s = await st();
      check(s.cam.z - c0.z > 1.2 && !s.roam.joy, `the joystick walks forward ${(s.cam.z - c0.z).toFixed(2)} m and disappears on release`);
      // two thumbs: walk (left) and look (right) at the same time
      const y0 = s.cam.yaw, z0 = s.cam.z, lx = vw.width * (lying ? 0.6 : 0.8), ly = lying ? vw.height * 0.22 : jy - 40;
      await T('touchStart', [[jx, jy, 1]]);
      await T('touchStart', [[jx, jy, 1], [lx, ly, 2]]);
      for (let i = 1; i <= 16; i++) { await T('touchMove', [[jx, jy - 50, 1], [lx - i * 7, ly, 2]]); await wait(70); }
      await T('touchEnd', [[lx - 112, ly, 2]]); await T('touchEnd', []); await wait(300);
      s = await st();
      check(Math.abs(s.cam.yaw - y0) > 0.35 && Math.hypot(s.cam.z - z0, s.cam.x - c0.x) > 0.6, `two thumbs: walking and turning together (turned ${((s.cam.yaw - y0) * 57.3).toFixed(0)}°)`);
      await shot('03-two-thumbs');
      // a tap on a hotspot still works (it is not taken by the joystick)
      await ev(p, () => window.__eldom.dev.arrive(1)); await waitFloor(p, 1); await wait(2500);
      await p.locator('.hot[aria-label^="Una pared"]').first().click({ timeout: 8000 }); await wait(1500);
      check((await st()).level.view === 'wall', 'a tap on the wall still opens the close look');
      await p.locator('#lv-back').click(); await wait(1500);
    }

    // collisions: walk straight into the level wall and the stones; the visitor stops outside
    await ev(p, () => window.__eldom.dev.arrive(1)); await waitFloor(p, 1); await wait(2200);
    const solids = await ev(p, () => window.__eldom.state().roam.solids);
    const wall = solids.find((x) => x.kind === 'box');
    await ev(p, ([x, z, y]) => window.__eldom.dev.roamTo(x, z, y), [wall.x - Math.sin(wall.ry) * -2.4, wall.z + Math.cos(wall.ry) * 2.4, wall.ry]);
    await ev(p, () => window.__eldom.dev.roamPush(0, 1, 2600));
    s = await st();
    const inside = await ev(p, ([x, z, w]) => { const c = Math.cos(w.ry), sn = Math.sin(w.ry), lx = (x - w.x) * c - (z - w.z) * sn, lz = (x - w.x) * sn + (z - w.z) * c; return Math.abs(lx) < w.hw && Math.abs(lz) < w.hd; }, [s.cam.x, s.cam.z, wall]);
    check(!inside && Math.hypot(s.cam.x - wall.x, s.cam.z - wall.z) > 1.2, `from the front, the floating stones stop the visitor (${Math.hypot(s.cam.x - wall.x, s.cam.z - wall.z).toFixed(2)} m from the wall)`);
    await shot('04-at-the-stones');
    // from behind, straight into the wall
    await ev(p, ([x, z, y]) => window.__eldom.dev.roamTo(x, z, y), [wall.x - Math.sin(wall.ry) * 2.2, wall.z - Math.cos(wall.ry) * 2.2, wall.ry + Math.PI]);
    await ev(p, () => window.__eldom.dev.roamPush(0, 1, 2600));
    s = await st();
    const inside2 = await ev(p, ([x, z, w]) => { const c = Math.cos(w.ry), sn = Math.sin(w.ry), lx = (x - w.x) * c - (z - w.z) * sn, lz = (x - w.x) * sn + (z - w.z) * c; return Math.abs(lx) < w.hw && Math.abs(lz) < w.hd; }, [s.cam.x, s.cam.z, wall]);
    check(!inside2 && Math.hypot(s.cam.x - wall.x, s.cam.z - wall.z) < 0.7, `from behind, the wall stops the visitor (${Math.hypot(s.cam.x - wall.x, s.cam.z - wall.z).toFixed(2)} m from its centre)`);
    await shot('05-behind-the-wall');
    // the edge of the world: a long walk away stops at the rim
    await ev(p, () => window.__eldom.dev.roamTo(0, 6, Math.PI));
    await ev(p, () => window.__eldom.dev.roamPush(0, 1, 9000));
    s = await st();
    check(Math.hypot(s.cam.x, s.cam.z - 8) <= 13.05, `the world has an edge (${Math.hypot(s.cam.x, s.cam.z - 8).toFixed(2)} m from its centre)`);

    // the entrance: walk up to the open doors and in
    await ev(p, () => window.__eldom.dev.exterior()); await waitPhase(p, 'open', 15000); await wait(1200);
    check((await st()).roam.scene === 'lobby', 'the entrance is walkable too');
    await ev(p, () => window.__eldom.dev.roamPush(0, 1, 9000));
    await waitPhase(p, 'cabin', 30000);
    check((await st()).phase === 'cabin', 'walking up to the open elevator enters it');
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' roam check(s) failed: ' + fails.join(' | '));
  },
  // A phone lying down (run with --viewport landscape): cabin selector → floors, the slim corner player, walking with
  // the joystick; and upright (--viewport mobile): the invitation to lie it down.
  async landscape(p, shot, log) {
    const fails = [];
    const check = (cond, msg) => { if (!cond) fails.push(msg); log((cond ? 'ok    ' : 'FAIL  ') + msg); };
    const st = () => state(p);
    const vw = p.viewportSize();
    const hot = (label) => `.hot[aria-label^="${label}"]`;
    if (!(await ev(p, () => matchMedia('(pointer: coarse)').matches))) { log('not a touch screen: nothing to check here (run with --viewport landscape or mobile)'); return; }
    await ev(p, () => window.__eldom.dev.released());
    if (vw.width < vw.height) { // upright: the invitation
      await ev(p, () => window.__eldom.dev.arrive(2)); await waitFloor(p, 2); await wait(2400);
      check(await p.locator('#rot-invite').isVisible(), 'upright phone in a world: invitation to lie it down');
      await shot('01-invite');
      await p.locator('#rot-keep').click(); await wait(300);
      check(!(await p.locator('#rot-invite').isVisible()), '"Seguir así" closes it');
      await ev(p, () => window.__eldom.dev.arrive(3)); await waitFloor(p, 3); await wait(2000);
      check(!(await p.locator('#rot-invite').isVisible()), 'and it does not come back in the next world');
    } else {
      await ev(p, () => { sessionStorage.removeItem('eldom.platform'); });
      await ev(p, () => window.__eldom.dev.interior()); await waitPhase(p, 'cabin'); await wait(1200);
      const cv = p.locator('#cab-view');
      check(await cv.isVisible() && /PISOS/.test(await cv.innerText()), `cabin lying down: the selector in view, "${await cv.innerText()}" to see the floors`);
      await shot('01-cabin-selector');
      const selBox = await p.locator(hot('Viajar por YouTube')).boundingBox();
      check(selBox && selBox.height >= 60, `selector buttons are big (${selBox && Math.round(selBox.height)} px)`);
      await p.locator(hot('Viajar por YouTube')).click(); await wait(2600); await waitPhase(p, 'cabin', 10000); await wait(500);
      const rowBox = await p.locator(hot('Piso 2')).boundingBox();
      check(rowBox && rowBox.height >= 26, `after choosing, the view moves to the floor buttons (rows ${rowBox && Math.round(rowBox.height)} px tall)`);
      check(/PLATAFORMA/.test(await cv.innerText()), `the switch now offers "${await cv.innerText()}"`);
      await shot('02-cabin-floors');
      await p.locator(hot('Piso 2')).click(); await waitFloor(p, 2, 45000); await wait(2600);
      const s = await st();
      const fr = await p.locator('.portal iframe').boundingBox();
      check(s.portal.dock === 'compact' && fr && fr.height >= 199 && fr.width >= 199, `in the world the player sits in the corner, slim (${fr && Math.round(fr.width)}×${fr && Math.round(fr.height)}, YouTube minimum 200)`);
      check(fr && fr.x + fr.width <= vw.width && fr.y + fr.height <= vw.height, 'and fully on screen');
      check(!(await p.locator('#rot-invite').isVisible()), 'no invitation when the phone already lies down');
      await shot('03-world');
      // walk with the left thumb
      const cdp = await p.context().newCDPSession(p);
      const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
      const z0 = s.cam.z, jx = vw.width * 0.14, jy = vw.height * 0.72;
      await T('touchStart', [[jx, jy, 1]]);
      for (let i = 0; i < 20; i++) { await T('touchMove', [[jx, jy - 40 - (i % 2), 1]]); await wait(70); }
      await shot('04-walking');
      await T('touchEnd', []); await wait(300);
      const s2 = await st();
      check(s2.cam.z - z0 > 1.0, `the joystick walks (${(s2.cam.z - z0).toFixed(2)} m)`);
    }
    log(`${fails.length ? 'FAILED CHECKS: ' + fails.length : 'all checks passed'}`);
    if (fails.length) throw new Error(fails.length + ' landscape check(s) failed: ' + fails.join(' | '));
  },
  async floors(p, shot, log) {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      await ev(p, (f) => window.__eldom.dev.arrive(f), n);
      await waitFloor(p, n);
      await wait(3800);
      await shot(`floor-${n}`);
      log(`floor ${n}: iframes=${await iframeCount(p)}`);
    }
  },
  async return(p, shot, log) {
    await ev(p, () => window.__eldom.dev.arrive(1));
    await waitFloor(p, 1);
    await wait(2500);
    await ev(p, () => window.__eldom.ui.returnToElevator());
    await wait(1400);
    await shot('returning');
    await waitPhase(p, 'cabin', 25000);
    await wait(1200);
    await shot('returned');
    log('state: ' + JSON.stringify(await state(p)) + ' iframes=' + (await iframeCount(p)));
  },
  async ytplay(p, shot, log) {
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await ev(p, () => window.__eldom.dev.platform('youtube'));
    await wait(1500);
    await ev(p, () => window.__eldom.dev.arrive(2));
    await waitFloor(p, 2);
    await p.waitForSelector('iframe[src*="youtube.com/embed"]', { timeout: 15000 });
    await wait(5000);
    const box = await p.locator('iframe[src*="youtube.com/embed"]').boundingBox();
    log('youtube iframe box: ' + JSON.stringify(box));
    await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await wait(7000);
    log('portal after manual play: ' + JSON.stringify((await state(p)).portal));
    await shot('yt-playing');
    await ev(p, () => window.__eldom.ui.returnToElevator());
    await waitPhase(p, 'cabin', 25000);
    log('iframes after return=' + (await iframeCount(p)));
  },
  async spotify(p, shot, log) {
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await ev(p, () => window.__eldom.dev.platform('spotify'));
    await wait(1500);
    await ev(p, () => window.__eldom.dev.arrive(1));
    await waitFloor(p, 1);
    await p.waitForSelector('iframe[src*="open.spotify.com/embed"]', { timeout: 15000 });
    await wait(6000);
    await shot('spotify-embed');
    try {
      await p
        .frameLocator('iframe[src*="open.spotify.com/embed"]')
        .locator('button[data-testid="play-pause-button"]')
        .first()
        .click({ timeout: 8000 });
      await wait(6000);
    } catch (e) {
      log('spotify play click failed: ' + e.message.split('\n')[0]);
    }
    log('portal after manual play: ' + JSON.stringify((await state(p)).portal));
    await shot('spotify-playing');
    await ev(p, () => window.__eldom.ui.returnToElevator());
    await waitPhase(p, 'cabin', 25000);
    log('iframes after return=' + (await iframeCount(p)));
  },
  async csp(p, shot, log) {
    await ev(p, () => window.__eldom.ui.openListen());
    await wait(900);
    await ev(p, () => window.__eldom.ui.chooseListen('youtube'));
    await wait(3500);
    log('listen portal: ' + JSON.stringify((await state(p)).portal) + ' blocked=' + (await state(p)).embedsBlocked);
    await shot('csp-listen');
    await ev(p, () => window.__eldom.ui.closeListen());
    await ev(p, () => window.__eldom.dev.arrive(1));
    await waitFloor(p, 1);
    await wait(3500);
    log('floor portal: ' + JSON.stringify((await state(p)).portal));
    await shot('csp-floor');
  },
  async fallback2d(p, shot) {
    await ev(p, () => window.__eldom.dev.force2D());
    await wait(2500);
    await shot('2d-prelaunch');
    await ev(p, () => window.__eldom.dev.interior());
    await waitPhase(p, 'cabin');
    await wait(1500);
    await shot('2d-cabin');
    await ev(p, () => window.__eldom.dev.arrive(1));
    await waitFloor(p, 1);
    await wait(3000);
    await shot('2d-floor-1');
  },
};

const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const VIEWPORTS = {
  small: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA },
  landscape: { viewport: { width: 780, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true, userAgent: PHONE_UA },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  },
};

async function run() {
  if (flag('syntax')) return syntaxCheck();
  const csp = flag('csp');
  if (flag('serve')) {
    const port = Number(opt('port', 5178)), host = opt('host', '127.0.0.1');
    await startServer(port, csp, flag('dist'), host);
    console.log(`Serving ${flag('dist') ? 'dist/ (own-domain build, its _headers)' : 'artifact'} on http://${host === '0.0.0.0' ? '<this computer\'s IP>' : host}:${port}/ ${csp ? '(Artifact CSP: embeds blocked)' : '(embeds enabled)'} — Ctrl+C to stop`);
    return;
  }
  const names = opt('scenario', 'smoke').split(',');
  const list = names.includes('all') ? Object.keys(SCENARIOS).filter((n) => n !== 'csp' || csp) : names;
  const vpArg = opt('viewport', 'desktop');
  const vps = vpArg === 'both' ? ['desktop', 'mobile'] : [vpArg];
  fs.mkdirSync(SHOTS, { recursive: true });
  const extUrl = opt('url', null), dist = flag('dist');
  const server = extUrl ? null : await startServer(0, csp, dist);
  const url = extUrl ? extUrl.replace(/\/?$/, '/') : `http://127.0.0.1:${server.address().port}/`;
  if (extUrl || dist) console.log(`testing ${url} (${extUrl ? 'deployed site' : 'dist/ with its _headers'})`);
  const { chromium } = require(PLAYWRIGHT);
  const engine = opt('browser', 'msedge');
  const browser = await chromium.launch({
    ...(engine === 'chromium' ? {} : { channel: engine }),
    headless: !flag('headed'),
    args: ['--autoplay-policy=user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  let failed = false;
  for (const vp of vps) {
    for (const name of list) {
      const fn = SCENARIOS[name];
      if (!fn) {
        console.log(`unknown scenario ${name}`);
        continue;
      }
      const ctx = await browser.newContext(VIEWPORTS[vp]);
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
      // The band's real sheet never gets test sign-ups: Google's addresses are answered by the mock sheet, unless
      // --real-leads (the one end-to-end check of the live site, scenario `leadslive`).
      if (!flag('real-leads')) await ctx.route(/^https:\/\/script\.google(usercontent)?\.com\//, (route) => LeadsMock.fulfill(route));
      if (extUrl || dist) await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`)); });
      const p = await ctx.newPage();
      const errors = [];
      p.on('console', (m) => {
        if (m.type() === 'error') errors.push('console: ' + m.text());
      });
      p.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
      const log = (s) => console.log(`  [${vp}/${name}] ${s}`);
      const shot = async (label) => {
        const file = path.join(SHOTS, `${vp}-${name}-${label}.png`);
        await p.screenshot({ path: file });
        log(`shot ${path.relative(ROOT, file)}`);
      };
      const t0 = Date.now();
      try {
        await p.goto(url + (name === 'fallback2d' ? '#2d' : ''));
        await p.waitForFunction(() => window.__eldom && window.__eldom.ready, null, { timeout: 30000 });
        await p.evaluate(() => window.__eldom.ready);
        if (flag('fast')) await ev(p, () => window.__eldom.dev.timeScale(3));
        await wait(1800);
        const s = await state(p);
        log(`booted renderer=${s.renderer} phase=${s.phase}`);
        await fn(p, shot, log);
        log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      } catch (e) {
        failed = true;
        log('FAILED: ' + e.message.split('\n')[0]);
        try {
          await shot('failure');
        } catch {}
      }
      if (extUrl || dist) {
        const v = await p.evaluate(() => window.__csp || []).catch(() => []);
        if (v.length) { failed = true; log('CSP VIOLATIONS: ' + [...new Set(v)].join(' | ')); }
      }
      const pageErrors = errors.filter((e) => e.startsWith('pageerror'));
      if (pageErrors.length) failed = true;
      for (const e of [...new Set(errors)].slice(0, 12)) log(e.slice(0, 400));
      await ctx.close();
    }
  }
  await browser.close();
  if (server) server.close();
  if (LeadsMock.server) LeadsMock.server.close();
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
