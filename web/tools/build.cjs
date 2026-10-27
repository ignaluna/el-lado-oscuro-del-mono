#!/usr/bin/env node
// Concatenates src/*.html|js (sorted) into two outputs:
//   artifact/index.html  the claude.ai Artifact (no document skeleton: claude.ai adds it at publish time)
//   dist/                the same page for the band's own domain: a full HTML document, link-preview tags, cover
//                        image, favicon, and the recommended host headers (_headers: Netlify / Cloudflare Pages format)
//
//   node tools/build.cjs                              both outputs; dist uses the page's own address for invitations
//   node tools/build.cjs --site https://dominio.com   dist with absolute link-preview URLs and that address for invitations
//   node tools/build.cjs --site … --release           dist with the DEV chip hidden (still reachable with #dev)
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const SITE = (opt('--site') || '').replace(/\/+$/, '');
if (SITE && !/^https:\/\/[^/]+(\/.*)?$/.test(SITE)) { console.error('--site must be an https address, e.g. https://ellado.com'); process.exit(1); }

const dir = path.join(ROOT, 'src');
const files = fs.readdirSync(dir).filter((f) => /\.(html|js)$/.test(f)).sort();
const page = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+$/, '')).join('\n\n') + '\n</script>\n';
fs.mkdirSync(path.join(ROOT, 'artifact'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifact', 'index.html'), page);
console.log(`built ${files.length} parts → ${page.split('\n').length} lines, ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);

// ───────────────────────── dist (own domain) ─────────────────────────
const DIST = path.join(ROOT, 'dist');
fs.mkdirSync(DIST, { recursive: true });
let body = page;
const swap = (re, to, what) => { if (!re.test(body)) { console.error('build: ' + what + ' not found'); process.exit(1); } body = body.replace(re, to); };
// the head elements of the page move into <head>
const title = (body.match(/^<title>[^<]*<\/title>\n/) || [''])[0];
const fonts = (body.match(/^<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n/m) || [''])[0];
body = body.replace(title, '').replace(fonts, '');
// invitations point at the domain (or at whatever address the page is opened from)
swap(/const SHARE_BASE_URL = "[^"]*";/, `const SHARE_BASE_URL = ${SITE ? JSON.stringify(SITE + '/') : 'null'};`, 'SHARE_BASE_URL');
if (args.includes('--release')) swap(/const SHOW_DEV_TOOLS = true;/, 'const SHOW_DEV_TOOLS = false;', 'SHOW_DEV_TOOLS');

// cover image for link previews (WhatsApp, Instagram, X…), taken from the page's own asset
const cover = /cover:\s*['"]data:image\/jpeg;base64,([A-Za-z0-9+/=]+)['"]/.exec(fs.readFileSync(path.join(dir, '10-assets.js'), 'utf8'));
if (!cover) { console.error('build: cover image not found in 10-assets.js'); process.exit(1); }
fs.writeFileSync(path.join(DIST, 'portada.jpg'), Buffer.from(cover[1], 'base64'));
fs.writeFileSync(path.join(DIST, 'favicon.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2b2725"/>' +
  '<path d="M17 57V29a15 15 0 0 1 30 0v28" fill="none" stroke="#ebe5d5" stroke-width="3.4" stroke-linecap="round"/>' +
  '<rect x="25.5" y="21" width="4.5" height="11" fill="#ebe5d5"/><rect x="34" y="21" width="4.5" height="11" fill="#ebe5d5"/></svg>\n');

// gallery photos, published next to the page (GALLERY.pieces[].src: "galeria/…"); a missing file stops the build
const GAL = path.join(ROOT, 'assets', 'galeria');
const galSrcs = [...body.matchAll(/src: "galeria\/([^"]+)"/g)].map((m) => m[1]);
for (const f of galSrcs) if (!fs.existsSync(path.join(GAL, f))) { console.error(`build: gallery photo assets/galeria/${f} not found`); process.exit(1); }
fs.rmSync(path.join(DIST, 'galeria'), { recursive: true, force: true });
if (galSrcs.length) {
  fs.mkdirSync(path.join(DIST, 'galeria'), { recursive: true });
  for (const f of galSrcs) fs.copyFileSync(path.join(GAL, f), path.join(DIST, 'galeria', f));
}

// cover illustrations (COVER_ELEMENTS[].art: "portadas/…"), published next to the page the same way
const ART = path.join(ROOT, 'assets', 'portadas');
const artSrcs = [...body.matchAll(/art: "portadas\/([^"]+)"/g)].map((m) => m[1]);
for (const f of artSrcs) if (!fs.existsSync(path.join(ART, f))) { console.error(`build: cover illustration assets/portadas/${f} not found`); process.exit(1); }
fs.rmSync(path.join(DIST, 'portadas'), { recursive: true, force: true });
if (artSrcs.length) {
  fs.mkdirSync(path.join(DIST, 'portadas'), { recursive: true });
  for (const f of artSrcs) fs.copyFileSync(path.join(ART, f), path.join(DIST, 'portadas', f));
}

const DESC = 'El Lado Oscuro del Mono, de Monos del Ambiente.';
const abs = (p) => (SITE ? `${SITE}/${p}` : p);
const head = [
  '<!doctype html>',
  '<html lang="es">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  title.trim(),
  `<meta name="description" content="${DESC}">`,
  '<meta name="theme-color" content="#2b2725">',
  '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="El Lado Oscuro del Mono — Monos del Ambiente">',
  `<meta property="og:description" content="${DESC}">`,
  ...(SITE ? [`<meta property="og:url" content="${SITE}/">`, `<meta property="og:image" content="${abs('portada.jpg')}">`, '<meta property="og:image:width" content="512">', '<meta property="og:image:height" content="512">'] : []),
  '<meta name="twitter:card" content="summary">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
  fonts.trim(),
  '</head>',
  '<body>',
].filter(Boolean).join('\n');
const html = `${head}\n${body}</body>\n</html>\n`;
fs.writeFileSync(path.join(DIST, 'index.html'), html);

// host headers: the inline module is allowed by its hash (no 'unsafe-inline' for scripts)
const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
// the sign-ups' address may be reached; a Google Apps Script answers from script.googleusercontent.com after a redirect
const lead = (/const LEAD_ENDPOINT = ("[^"]*"|null);/.exec(body) || [])[1];
if (!lead) { console.error('build: LEAD_ENDPOINT not found'); process.exit(1); }
const connect = ["'self'"];
if (lead !== 'null') {
  const u = new URL(JSON.parse(lead));
  connect.push(u.origin);
  if (u.hostname === 'script.google.com') connect.push('https://script.googleusercontent.com');
}
const CSP = [
  "default-src 'self'",
  `script-src 'self' ${scripts.join(' ')} https://cdn.jsdelivr.net https://unpkg.com`, // three.js (jsdelivr, unpkg as fallback)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com', // the official players
  `connect-src ${connect.join(' ')}`, // the page itself and LEAD_ENDPOINT (where sign-ups go)
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
fs.writeFileSync(path.join(DIST, '_headers'), [
  '# Recommended headers for the site (Netlify / Cloudflare Pages "_headers" format; other hosts: same values).',
  '# Referrer-Policy must send the origin: YouTube refuses embeds without it (error 153).',
  '# Do not add a Permissions-Policy that blocks autoplay, encrypted-media, fullscreen or picture-in-picture: the',
  '# official players need them. The script hash changes with every build: deploy this file together with index.html.',
  '/*',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Content-Type-Options: nosniff',
  `  Content-Security-Policy: ${CSP}`,
  '/',
  '  Cache-Control: no-cache',
  '/index.html',
  '  Cache-Control: no-cache',
  '',
].join('\n'));
console.log(`dist → index.html ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, portada.jpg, favicon.svg, _headers${galSrcs.length ? `, galeria/ (${galSrcs.length})` : ''}${artSrcs.length ? `, portadas/ (${artSrcs.length})` : ''}${SITE ? ' · site ' + SITE : ' · invitations use the page address'}${args.includes('--release') ? ' · DEV chip hidden' : ''}`);
