# Feature: launch-integrations — YouTube and Spotify must not fail on release night

## Objective
Prove, with automated checks against the real services, that every official player in the launch Artifact works,
and that every way it can fail on release night degrades to an official link instead of a dead box.

## Why / problem
User (2026-10-05): "Me gustaría testear las integraciones con spotify y youtube, no me gustaría que fallen el día del
estreno". Until now the harness checked one YouTube floor and one Spotify floor with demo data ("Pequeño Primate").
The real album ids do not exist yet; they will be swapped into `tracks` close to `RELEASE_AT`.

## Scope / constraints
- Artifact sources in the session scratchpad (`src/*`), harness `tools/check.cjs`; the repo stays untouched (the repo
  app plays its own audio from R2 and only links to Spotify/YouTube; its headers — `Referrer-Policy:
  strict-origin-when-cross-origin`, no CSP — would not block the embeds if the Artifact were served from it).
- Only official players, user-initiated playback, never `playVideo()`, never cover/mute/hide a working player.
- Available engines: Chromium, Edge, Chrome (no WebKit/Firefox): iPhone/Safari and in-app browsers need real devices.
- TDD: not configured for this artifact; ordinary functional checks (harness scenarios) per task.
- No invented data: ids, titles and durations come from `tracks`/`DEMO_ALBUM` and from the services themselves.

## Tasks
- [x] I1 Research named uncertainties (inline): YouTube embed error codes (incl. referrer error 153), oEmbed answers
      for private / non-embeddable / missing videos, Spotify embed preview rules (logged out, Safari/iOS, in-app
      browsers), Spotify release time vs `RELEASE_AT`, stability of the postMessage bridges. Route: inline.
- [x] I2 Preflight `tools/preflight.cjs`: reads the config from `src/00-base.html`, checks formats, asks YouTube and
      Spotify oEmbed for every id (exists, embeddable, title matches the configured title), start offsets ordered and
      inside the video. Route: inline. Check: run against the current demo config.
- [x] I3 Live player matrix in the harness (`integrations` scenario): every floor × {YouTube, Spotify} + the listen
      portal, embed mode — the right id loads, YouTube reports the right video/start after a real click, Spotify
      reports the configured track URI. Route: inline. Check: desktop + mobile.
- [x] I4 Failure modes (`failures` scenario): missing/private video, embedding disabled, player error, services
      unreachable, Spotify unknown track, framing refused (CSP). Each must end in an official link, visibly.
      Fix the gaps found. Route: inline.
- [x] I5 Release-night runbook: when to swap ids, how to run the preflight with the real ids, real-device checklist
      (iPhone Safari, Android Chrome, Instagram/WhatsApp in-app browsers, Spotify logged in/out). Route: inline.
- [x] I6 Own-domain build (user 2026-10-06: "Vamos a tener un dominio propio", buying it tomorrow): `dist/` with a full
      HTML document, link-preview tags, cover image, favicon, invitation links from the page's own address
      (`SHARE_BASE_URL = null`), recommended host headers (`dist/_headers`). Route: inline.
- [x] I7 Test the deployable: harness `--dist` (serves dist/ with its headers, incl. a strict CSP) and `--url` (runs the
      scenarios against the real domain); preflight `--site URL` (headers, page, config of the live file). Route: inline.
- [x] I8 Finish I3: ad-aware YouTube check (an ad may hold the video at the chapter start) + desktop rerun.
- [x] I9 Real-device self-test in DEV ("Probar reproductores"): every floor's official player must answer on that
      device/browser (iPhone Safari, Instagram/WhatsApp in-app); visible players only, no playback. Route: inline.

## Acceptance criteria
Preflight green on the demo config; `integrations` green on desktop and mobile for all 9 floors on both platforms;
every simulated failure ends with an official link on screen and no page errors; runbook delivered.

## Progress / evidence
- 2026-10-05: feature document created (5 tasks).
- I2: tools/preflight.cjs — demo config 0 errors; a broken copy (probe/broken-config.html) raises every planted
  mistake: swapped track, typo in a video id, start past the end, track from another album, doors before Spotify.
- I4: PlayerPortal fixes — any YouTube onError (seen: 150 for a missing video; stubbed 101/150/153) turns the box into
  the official link + note; a silent player gets a note at 7 s and the official link box at 20 s unless the visitor
  already clicked into it; album preview ("Mientras esperás") now detected. "failures" green on desktop, mobile (Edge)
  and mobile (Chrome).
- I3: "integrations" green on mobile (Edge and Chrome): 9 floors × YouTube (right video, right second after a real
  click) and Spotify (configured track URI playing, preview detected). Desktop run: 8 YouTube checks failed with the
  video held at the chapter start while "playing" — consistent with a pre-roll ad (googleads requests in the
  console); an earlier desktop run on floors 1–2 passed. Pending: ad-aware check + rerun. Release-night note: ads can
  precede the song in embeds of a monetised video.
- Paused 2026-10-05 for the puzzle-level request (odd/tasks/puzzle-level.md); resumed 2026-10-06.
- I6–I9 (2026-10-06): tools/build.cjs also writes dist/ (full document, og tags, portada.jpg, favicon.svg, _headers with
  a strict CSP that allows the inline module by its sha256); check.cjs --dist / --url / --host, CSP violations fail
  the run (negative test: removing youtube from frame-src was caught and the page fell back to links); preflight
  --site (https, Referrer-Policy, CSP frame/script/hash, Permissions-Policy, og:image, live config, DEV chip);
  integrations check skips/waits out a pre-roll ad; DEV "Probar reproductores" (visible players, no playback,
  restores platform/visited) + harness "selftest".
- Evidence: selftest, integrations, failures, level, smoke, book, tour on dist/ with its headers — exit 0 on desktop
  and mobile (shots/regress-dist.log); selftest 18/18 players answered on both.

## Next step
Tomorrow (domain bought): steps 1–5 of "Own-domain deploy"; then the real ids and step 6.

## Own-domain deploy (I6–I9) — the day the domain exists
Folder: the session scratchpad (`…\scratchpad`). `dist/` holds the four files to upload.
1. Build for the domain: `node tools/build.cjs --site https://DOMINIO` → dist/index.html, portada.jpg (link preview),
   favicon.svg, _headers (Netlify / Cloudflare Pages read it as is; on any other host set the same headers).
2. Upload the four files together (the CSP in _headers carries the hash of this exact index.html).
3. `node tools/preflight.cjs --site https://DOMINIO` → 0 errors (https, Referrer-Policy, CSP allows the players and
   three.js, the script hash matches, og:image answers, ids/titles/starts/release date of the file online).
4. `node tools/check.cjs --scenario selftest,integrations,failures,level --viewport both --url https://DOMINIO`.
5. Real phones (iPhone Safari, Android Chrome, the link opened from WhatsApp and from Instagram): DEV → "Probar
   reproductores" → "✓ 18 de 18". Spotify logged out / iPhone: previews + "CONTINUAR EN SPOTIFY" expected.
6. Release: real ids in `tracks` → preflight → `node tools/build.cjs --site https://DOMINIO --release` (DEV chip
   hidden, still reachable with #dev) → upload → steps 3–5 again.
Before the domain exists: `node tools/check.cjs --serve --dist --host 0.0.0.0` serves dist/ to phones on the same
Wi-Fi at http://<IP of this computer>:5178/ (players work; share/copy need https).
