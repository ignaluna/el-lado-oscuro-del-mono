#!/usr/bin/env node
// Release-night preflight for the YouTube and Spotify players.
//
//   node tools/preflight.cjs                 checks the config in src/00-base.html against the live services
//   node tools/preflight.cjs --file X.html   checks another copy (for example the built artifact/index.html)
//   node tools/preflight.cjs --offline       format and consistency checks only (no network)
//   node tools/preflight.cjs --json          machine-readable report
//   node tools/preflight.cjs --site https://dominio.com   the deployed site: headers the players need, link preview,
//                                            and the config of the file actually online
//
// Exit code 1 when anything would break a player on release night; warnings never fail the run.
// Sources: YouTube oEmbed + the public watch page (playability, embeddability, length); Spotify oEmbed + the official
// embed pages (title, duration, playability, release date, album track list). No API keys.
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
let FILE = path.resolve(opt('--file', path.join(__dirname, '..', 'src', '00-base.html')));
const SITE = opt('--site', null);
const OFFLINE = flag('--offline');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

let RELEASE_AT_STR = '';
const report = { file: FILE, errors: [], warnings: [], ok: [] };
const err = (where, msg) => report.errors.push(`${where}: ${msg}`);
const warn = (where, msg) => report.warnings.push(`${where}: ${msg}`);
const ok = (where, msg) => report.ok.push(`${where}: ${msg}`);

/** Evaluates the CONFIG block of the page (from RELEASE_AT up to the book) in isolation. */
function loadConfig(file) {
  const src = fs.readFileSync(file, 'utf8');
  const a = src.indexOf('const RELEASE_AT');
  const b = src.indexOf('const BOOK', a);
  if (a < 0 || b < 0) throw new Error('config block not found (const RELEASE_AT … const BOOK)');
  const code = src.slice(a, b);
  // eslint-disable-next-line no-new-func
  return new Function(`${code}\nreturn { RELEASE_AT, EMBED_MODE, SHARE_BASE_URL, SHOW_DEV_TOOLS, DEMO_ALBUM, tracks };`)();
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const SP_ID = /^[A-Za-z0-9]{22}$/;
const spId = (uri) => (uri ? String(uri).split(':').pop() : null);

function checkFormat(cfg) {
  const rel = Date.parse(cfg.RELEASE_AT);
  if (!/[+-]\d\d:\d\d$|Z$/.test(cfg.RELEASE_AT)) err('RELEASE_AT', `"${cfg.RELEASE_AT}" has no explicit UTC offset`);
  if (Number.isNaN(rel)) err('RELEASE_AT', `"${cfg.RELEASE_AT}" is not a date`);
  else if (rel < Date.now()) warn('RELEASE_AT', `${cfg.RELEASE_AT} is in the past: the site opens immediately`);
  else ok('RELEASE_AT', `${cfg.RELEASE_AT} (${new Date(rel).toISOString()})`);
  if (!['auto', 'embed', 'link'].includes(cfg.EMBED_MODE)) err('EMBED_MODE', `"${cfg.EMBED_MODE}" is not auto|embed|link`);
  else if (cfg.EMBED_MODE !== 'auto') warn('EMBED_MODE', `"${cfg.EMBED_MODE}": the automatic fallback to links is off`);
  if (cfg.SHARE_BASE_URL !== null && !/^https:\/\//.test(cfg.SHARE_BASE_URL || '')) err('SHARE_BASE_URL', 'must be an https URL or null (invitation links)');

  const d = cfg.DEMO_ALBUM || {};
  if (!YT_ID.test(d.youtubeVideoId || '')) err('DEMO_ALBUM', `youtubeVideoId "${d.youtubeVideoId}" is not an 11-character id`);
  if (!SP_ID.test(d.spotifyAlbumId || '')) err('DEMO_ALBUM', `spotifyAlbumId "${d.spotifyAlbumId}" is not a 22-character id`);

  const T = cfg.tracks;
  if (!Array.isArray(T) || !T.length) { err('tracks', 'empty'); return; }
  const ids = new Set(), uris = new Set();
  T.forEach((t, i) => {
    const w = `piso ${t.floor} «${t.title}»`;
    if (t.floor !== i + 1) err(w, `floor should be ${i + 1} (floors are 1..N in order)`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id || '')) err(w, `id "${t.id}" is not a lowercase slug (it is the invitation hash)`);
    if (ids.has(t.id)) err(w, `id "${t.id}" repeated`); ids.add(t.id);
    if (!t.title) err(w, 'title empty');
    if (!YT_ID.test(t.youtubeVideoId || '')) err(w, `youtubeVideoId "${t.youtubeVideoId}" is not an 11-character id`);
    if (!Number.isInteger(t.youtubeStartSeconds) || t.youtubeStartSeconds < 0) err(w, `youtubeStartSeconds "${t.youtubeStartSeconds}" must be an integer ≥ 0`);
    if (t.spotifyTrackUri != null) {
      if (!/^spotify:track:/.test(t.spotifyTrackUri) || !SP_ID.test(spId(t.spotifyTrackUri))) err(w, `spotifyTrackUri "${t.spotifyTrackUri}" is not spotify:track:<22 chars>`);
      if (uris.has(t.spotifyTrackUri)) err(w, `spotifyTrackUri repeated (${t.spotifyTrackUri})`); uris.add(t.spotifyTrackUri);
    } else warn(w, 'no spotifyTrackUri: this floor opens the whole album on Spotify');
    if (!SP_ID.test(t.spotifyAlbumId || '')) err(w, `spotifyAlbumId "${t.spotifyAlbumId}" is not a 22-character id`);
    if (!(t.durationSeconds > 0)) warn(w, 'durationSeconds missing: the floor shows no duration and the preview check is off');
  });
  // several floors sharing one video (a full-album video with chapters): the starts must climb with the floors
  const byVideo = new Map();
  for (const t of T) { if (!byVideo.has(t.youtubeVideoId)) byVideo.set(t.youtubeVideoId, []); byVideo.get(t.youtubeVideoId).push(t); }
  for (const [vid, list] of byVideo) {
    if (list.length < 2) continue;
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      if (b.youtubeStartSeconds <= a.youtubeStartSeconds) err(`piso ${b.floor}`, `starts at ${b.youtubeStartSeconds}s, not after piso ${a.floor} (${a.youtubeStartSeconds}s) in the same video ${vid}`);
      else if (a.durationSeconds > 0) {
        const gap = b.youtubeStartSeconds - a.youtubeStartSeconds - a.durationSeconds;
        if (Math.abs(gap) > 15) warn(`piso ${a.floor}`, `chapter length ${b.youtubeStartSeconds - a.youtubeStartSeconds}s vs song ${a.durationSeconds}s (gap ${gap}s): check the chapter starts`);
      }
    }
  }
  ok('tracks', `${T.length} floors, format OK`);
}

async function get(url, { json = false, timeout = 15000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' });
    const body = await r.text();
    return { status: r.status, body, data: json && r.ok ? JSON.parse(body) : null };
  } catch (e) {
    return { status: 0, body: '', error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(t); }
}
const pick = (s, re) => { const m = re.exec(s); return m ? m[1] : null; };
/** Local midnight of Spotify's release day, in the time zone of RELEASE_AT (Spotify's default go-live, unless the
 *  distributor set an exact global time). */
const goLive = (iso, releaseAt) => { const off = /([+-]\d\d:\d\d|Z)$/.exec(releaseAt); return Date.parse(iso.slice(0, 10) + 'T00:00:00' + (off ? off[1] : 'Z')); };

/** One YouTube video: exists, public or unlisted, embeddable, long enough for every start that points into it. */
async function checkYouTube(vid, users, rel) {
  const w = `YouTube ${vid}`;
  const o = await get(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + vid)}&format=json`, { json: true });
  if (o.status === 0) { err(w, `oEmbed unreachable (${o.error})`); return; }
  if (o.status === 401) err(w, 'embedding is disabled by the owner (oEmbed 401): the player shows error 101/150');
  else if (o.status === 403) err(w, 'private (oEmbed 403)');
  else if (o.status === 400 || o.status === 404) err(w, `not found (oEmbed ${o.status}): removed, private, or a wrong id`);
  else if (o.status !== 200) warn(w, `oEmbed answered ${o.status}`);
  const page = await get(`https://www.youtube.com/watch?v=${vid}&hl=es`);
  const status = pick(page.body, /"playabilityStatus":\{"status":"([A-Z_]+)"/);
  const embed = pick(page.body, /"playableInEmbed":(true|false)/);
  const length = Number(pick(page.body, /"lengthSeconds":"(\d+)"/) || 0);
  const unlisted = pick(page.body, /"isUnlisted":(true|false)/);
  const upcoming = /"isUpcoming":true/.test(page.body);
  const title = o.data ? o.data.title : pick(page.body, /<meta name="title" content="([^"]*)"/);
  if (status && status !== 'OK') {
    if (upcoming || status === 'LIVE_STREAM_OFFLINE') warn(w, `scheduled / premiere (${status}): it plays only once it starts — it must start no later than RELEASE_AT`);
    else err(w, `not playable (${status})`);
  }
  if (embed === 'false') err(w, 'playableInEmbed=false: embedding disabled');
  if (unlisted === 'true') warn(w, 'unlisted: plays in the site, but nobody finds it on YouTube (fine for a rehearsal, not for release)');
  if (!page.body) warn(w, `watch page unreachable (${page.error || page.status}): length and embeddability not double-checked`);
  for (const t of users) {
    if (length && t.youtubeStartSeconds >= length) err(`piso ${t.floor}`, `starts at ${t.youtubeStartSeconds}s but the video lasts ${length}s`);
    else if (length && t.durationSeconds && t.youtubeStartSeconds + t.durationSeconds > length + 5) warn(`piso ${t.floor}`, `start ${t.youtubeStartSeconds}s + ${t.durationSeconds}s runs past the end of the video (${length}s)`);
  }
  if (users.length === 1 && title && !norm(title).includes(norm(users[0].title))) warn(w, `title "${title}" does not mention «${users[0].title}»: wrong video?`);
  if (!report.errors.some((e) => e.startsWith(w))) ok(w, `${title || '?'} · ${length || '?'}s · embeddable ${embed || '?'} · used by ${users.map((t) => t.floor).join(', ')}`);
  void rel;
}

/** Spotify album: exists and lists the configured tracks; release date compared with RELEASE_AT. */
async function checkSpotifyAlbum(albumId, tracksIn, rel) {
  const w = `Spotify album ${albumId}`;
  const o = await get(`https://open.spotify.com/oembed?url=${encodeURIComponent('https://open.spotify.com/album/' + albumId)}`, { json: true });
  if (o.status === 0) { err(w, `oEmbed unreachable (${o.error})`); return; }
  if (o.status !== 200) { err(w, `not found (oEmbed ${o.status})`); return; }
  const page = await get(`https://open.spotify.com/embed/album/${albumId}`);
  const listed = new Set((page.body.match(/spotify:track:[A-Za-z0-9]{22}/g) || []));
  const relIso = pick(page.body, /"releaseDate":\{"isoString":"([^"]+)"/);
  for (const t of tracksIn) if (t.spotifyTrackUri && listed.size && !listed.has(t.spotifyTrackUri)) err(`piso ${t.floor}`, `${t.spotifyTrackUri} is not on the album ${albumId}`);
  if (relIso && rel && goLive(relIso, RELEASE_AT_STR) > rel) err(w, `Spotify releases it on ${relIso.slice(0, 10)} (local midnight), after RELEASE_AT ${RELEASE_AT_STR}`);
  ok(w, `${o.data.title} · ${listed.size} tracks listed · release ${relIso || '?'}`);
}

/** One Spotify track: exists, playable, title and duration agree with the config. */
async function checkSpotifyTrack(t, rel) {
  const id = spId(t.spotifyTrackUri), w = `piso ${t.floor} Spotify`;
  const o = await get(`https://open.spotify.com/oembed?url=${encodeURIComponent('https://open.spotify.com/track/' + id)}`, { json: true });
  if (o.status === 0) { err(w, `oEmbed unreachable (${o.error})`); return; }
  if (o.status !== 200) { err(w, `${t.spotifyTrackUri} not found (oEmbed ${o.status})`); return; }
  const name = o.data.title || '';
  if (norm(name) !== norm(t.title)) {
    if (norm(name).includes(norm(t.title)) || norm(t.title).includes(norm(name))) warn(w, `Spotify says «${name}», config says «${t.title}»`);
    else err(w, `Spotify says «${name}», config says «${t.title}»: wrong track?`);
  }
  const page = await get(`https://open.spotify.com/embed/track/${id}`);
  const ms = Number(pick(page.body, /"duration":(\d+)/) || 0);
  const playable = pick(page.body, /"isPlayable":(true|false)/);
  const relIso = pick(page.body, /"releaseDate":{"isoString":"([^"]+)"/);
  if (relIso && rel && goLive(relIso, RELEASE_AT_STR) > rel) err(w, `Spotify releases it on ${relIso.slice(0, 10)} (local midnight), after RELEASE_AT ${RELEASE_AT_STR}: the player would be empty when the doors open — unless the distributor set an exact earlier time`);
  if (playable === 'false') err(w, 'isPlayable=false in the embed (not released yet in this market, or blocked)');
  if (ms && t.durationSeconds && Math.abs(ms / 1000 - t.durationSeconds) > 3) warn(w, `lasts ${Math.round(ms / 1000)}s, config durationSeconds ${t.durationSeconds}`);
  if (!report.errors.some((e) => e.startsWith(w))) ok(w, `«${name}» · ${ms ? Math.round(ms / 1000) + 's' : '?'} · playable ${playable || '?'} · release ${relIso || '?'}`);
}

/** The deployed page: answers, is https, sends the headers the official players need, has a link preview. */
async function checkSite(site) {
  const base = site.replace(/\/+$/, '') + '/', w = 'site';
  if (!/^https:\/\//.test(base)) err(w, 'the address must be https');
  const r = await fetch(base, { headers: { 'User-Agent': UA }, redirect: 'follow' }).catch((e) => ({ error: e.message }));
  if (!r || r.error) { err(w, `${base} unreachable (${r && r.error})`); return null; }
  const html = await r.text();
  if (r.status !== 200) err(w, `${base} answered ${r.status}`);
  if (!/text\/html/.test(r.headers.get('content-type') || '')) err(w, `content-type is "${r.headers.get('content-type')}", not text/html`);
  if (!r.url.startsWith('https://')) err(w, `ends at ${r.url}, not https`);
  const rp = (r.headers.get('referrer-policy') || '').toLowerCase();
  if (/(^|,)\s*(no-referrer|same-origin)\s*$/.test(rp)) err('headers', `Referrer-Policy "${rp}": YouTube refuses the embed (error 153). Use strict-origin-when-cross-origin`);
  else ok('headers', `Referrer-Policy ${rp || '(browser default: strict-origin-when-cross-origin)'}`);
  const csp = r.headers.get('content-security-policy') || (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i) || [])[1] || '';
  if (csp) {
    const dir = (name) => { const m = new RegExp('(?:^|;)\\s*' + name + '\\s+([^;]*)', 'i').exec(csp); return m ? m[1] : null; };
    const frames = dir('frame-src') ?? dir('child-src') ?? dir('default-src') ?? '';
    for (const host of ['https://www.youtube.com', 'https://open.spotify.com']) if (!frames.includes(host) && !/\*|https:(\s|$)/.test(frames)) err('headers', `CSP frame-src does not allow ${host}: that player turns into a link`);
    const scripts = dir('script-src') ?? dir('default-src') ?? '';
    if (!/cdn\.jsdelivr\.net|unpkg\.com|https:(\s|$)|\*/.test(scripts)) err('headers', 'CSP script-src does not allow cdn.jsdelivr.net / unpkg.com: no 3D (three.js), only the 2D fallback');
    const inline = /<script type="module">([\s\S]*?)<\/script>/.exec(html);
    if (inline && !/'unsafe-inline'/.test(scripts)) {
      const hash = `'sha256-${require('crypto').createHash('sha256').update(inline[1], 'utf8').digest('base64')}'`;
      if (!scripts.includes(hash)) err('headers', 'CSP script-src lacks the hash of this index.html (deploy _headers from the same build as index.html)');
      else ok('headers', 'CSP allows this build\'s script (hash matches)');
    }
  } else ok('headers', 'no Content-Security-Policy (nothing blocks the players)');
  const pp = (r.headers.get('permissions-policy') || '').toLowerCase();
  for (const f of ['encrypted-media', 'autoplay', 'fullscreen', 'picture-in-picture']) if (new RegExp(f + '=\\(\\)').test(pp)) err('headers', `Permissions-Policy disables ${f}: the official players need it`);
  // link preview (WhatsApp, Instagram, X)
  const img = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (!img) warn('preview', 'no og:image: shared links show no image (build with --site)');
  else if (!/^https:\/\//.test(img)) warn('preview', `og:image "${img}" is not absolute https`);
  else { const ri = await fetch(img, { method: 'GET', headers: { 'User-Agent': UA } }).catch(() => null); if (!ri || ri.status !== 200 || !/^image\//.test(ri.headers.get('content-type') || '')) err('preview', `og:image ${img} does not answer with an image`); else ok('preview', `og:image ${img}`); }
  if (!/<meta property="og:title"/.test(html)) warn('preview', 'no og:title');
  // the config actually online
  if (!html.includes('const RELEASE_AT')) { err(w, 'the page has no config block: is this the right build?'); return null; }
  const tmp = path.join(require('os').tmpdir(), 'eldom-preflight-site.html');
  fs.writeFileSync(tmp, html);
  return tmp;
}

(async () => {
  let cfg;
  if (SITE && !OFFLINE) { const f = await checkSite(SITE); if (!f) { print(); process.exit(1); } FILE = f; report.file = SITE; }
  try { cfg = loadConfig(FILE); } catch (e) { console.error('preflight: ' + e.message); process.exit(2); }
  checkFormat(cfg);
  RELEASE_AT_STR = cfg.RELEASE_AT;
  if (SITE) {
    const site = SITE.replace(/\/+$/, '') + '/';
    if (cfg.SHARE_BASE_URL && cfg.SHARE_BASE_URL !== site) warn('SHARE_BASE_URL', `invitation links point to ${cfg.SHARE_BASE_URL}, not ${site}`);
    if (cfg.SHOW_DEV_TOOLS) warn('SHOW_DEV_TOOLS', 'the DEV chip is visible on the public site (build with --release before the release)');
  }
  if (!OFFLINE) {
    const rel = Date.parse(cfg.RELEASE_AT);
    const videos = new Map();
    for (const t of cfg.tracks) { if (!videos.has(t.youtubeVideoId)) videos.set(t.youtubeVideoId, []); videos.get(t.youtubeVideoId).push(t); }
    const jobs = [];
    for (const [vid, users] of videos) jobs.push(checkYouTube(vid, users, rel));
    if (cfg.DEMO_ALBUM && !videos.has(cfg.DEMO_ALBUM.youtubeVideoId)) jobs.push(checkYouTube(cfg.DEMO_ALBUM.youtubeVideoId, [], rel));
    const albums = new Map();
    for (const t of cfg.tracks) { if (!albums.has(t.spotifyAlbumId)) albums.set(t.spotifyAlbumId, []); albums.get(t.spotifyAlbumId).push(t); }
    for (const [aid, list] of albums) jobs.push(checkSpotifyAlbum(aid, list, rel));
    if (cfg.DEMO_ALBUM && !albums.has(cfg.DEMO_ALBUM.spotifyAlbumId)) jobs.push(checkSpotifyAlbum(cfg.DEMO_ALBUM.spotifyAlbumId, [], NaN));
    for (const t of cfg.tracks) if (t.spotifyTrackUri) jobs.push(checkSpotifyTrack(t, rel));
    await Promise.all(jobs);
  }
  print();
  process.exit(report.errors.length ? 1 : 0);
})();

function print() {
  if (flag('--json')) { console.log(JSON.stringify(report, null, 2)); }
  else {
    console.log(`preflight ${SITE || path.relative(process.cwd(), FILE)}${OFFLINE ? ' (offline)' : ''}`);
    for (const s of report.ok.sort()) console.log('  ok    ' + s);
    for (const s of report.warnings) console.log('  WARN  ' + s);
    for (const s of report.errors) console.log('  ERROR ' + s);
    console.log(`${report.errors.length} error(s), ${report.warnings.length} warning(s)`);
  }
}
