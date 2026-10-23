# Feature: cabin-player-polish — platform logos, a lighter panel, a player that can be minimized

## Objective
User 2026-10-22: (1) in the elevator, the YouTube and Spotify choice must show each logo under its name ("si no, no
se entiende"); (2) remove the small envelope at the right of each floor row on the panel ("es mucha información");
(3) on the floors, the song player can be minimized: the song keeps sounding, the player stays visible but small.

## Why / problem
- The selector only says YOUTUBE / SPOTIFY in engraved caps: first-time visitors do not read it as the platform choice.
- Each floor row carries an invitation envelope: invitations already live in each world ("INVITAR A ALGUIEN A ESTE
  MUNDO") and in "INVITAR A ALGUIEN"; on the panel they are noise.
- On a world the player takes a large part of the screen (on a phone lying down, more than half of its height).

## Scope / constraints
- Official players only. YouTube rules (verified 2026-10-22): embedded player viewport at least 200 × 200 px
  (Required Minimum Functionality); no background player and no separating the audio (Developer Policies III.I.7,
  III.I.9). So "minimized" = the smallest visible official player, never hidden: YouTube 200 × 200 (small screens) or
  356 × 200 (wide screens) in the corner; Spotify its compact bar (80 px tall).
- The frame is resized, never reloaded: playback continues. The choice is remembered for the visit (session).
- Logos: official marks drawn from vector paths (Simple Icons, CC0), unaltered colours: YouTube red + white play,
  Spotify green + black waves.
- Found while scoping: on phones held upright the YouTube player was 346 × 195 (320 × 180 on 360 px phones), under
  YouTube's 200 px minimum → fixed in the same work.
- Artifact in the scratchpad; repo untouched; no commits. Route: inline (user declined subagents for this Artifact).
  TDD not configured: harness scenarios.
- 2026-10-22: the scratchpad was found empty (Windows temp cleanup on 2026-10-13). Rebuilt by replaying the session
  transcripts (recover/replay.cjs) and checked byte-for-byte against the published v9.

## Tasks
- [x] C0 Recover the scratchpad (src, tools, docs) and prove it equals the published v9.
- [x] C1 Panel: selector shows the name, then the logo on the button (3D + 2D fallback); envelopes removed (drawing,
      anchors, hotspots, labels).
- [x] C2 Player: minimize / expand on floors (YouTube 200 px minimum respected, Spotify compact bar, link mode too),
      remembered for the visit; phone YouTube height fixed to ≥ 200 px.
- [x] C3 Checks: harness `mini` scenario + cabin checks (no envelope hotspots, logos drawn) + regression desktop,
      mobile, landscape; dist build.
- [x] C4 Publish + how to try + provisional copy.

## Acceptance criteria
The cabin shows each platform name with its logo beneath; no envelopes on the panel; on any world the player can be
minimized and expanded without reloading or stopping the song; YouTube never under 200 × 200; previous scenarios green.

## Progress / evidence
- 2026-10-22: document created (5 tasks).
- C0 (inline): `recover/replay.cjs` replays the 271 file operations of the session transcripts (main + subagent) in
  timestamp order inside `recover/replay/`, with test runs, contact sheets and wait loops stubbed. The rebuilt
  `artifact/index.html` equals the published v9 line for line (6689 lines; the only extra line in the published page is
  the `</body></html>` claude.ai adds). The 25 commands that ended differently only failed on `cd shots` (screenshots
  folder gone) after their writes. Restored into the scratchpad; backups `src.bak-v12`, `tools/check.bak-v9.cjs`.
- C1 + C2 (inline, `probe/patch-cpp1.cjs` + small edits): `LOGOS` + `drawLogo()` (30-r3d-cabin.js), selector name at
  y 0.34 and the button at 0.428 with a logo plane on its face (sinks with it), lamps at the lower outer corners,
  hotspot centred on name + button; 2D fallback draws the same logo; envelope drawing, `inviteX`, anchors, rects,
  hotspots and labels removed. PlayerPortal: `mini` (session `eldom.mini`), `setMini()`, "MINIMIZAR / AMPLIAR" in the
  links row, metrics(…, mini): YouTube 200 × 200 (phones, short screens) or 356 × 200, Spotify 300 × 80; phones held
  upright: YouTube height `Math.max(200, …)`. Slim and minimized players are anchored to the lower right corner with
  their controls on top of the frame (bottom 40 px on wide screens, 12 px on phones).
- Found by the new checks and fixed: (1) minimized, "AMPLIAR" sat on the screen edge under the DEV chip (click
  blocked); (2) phone lying down, Spotify sample note pushed the slim player's controls (MINIMIZAR) off screen — the
  slim block was placed from its top with a fixed height that ignored the note row.
- `mini` scenario green on desktop (1600×900), mobile (390×844) and landscape (780×360), with real playback: YouTube
  189.6 → 193.4 s and Spotify 1.0 → 5.2 s while minimized, same iframe element before and after (never reloaded).

- C3: regression of 25 scenarios — desktop 25/25 and mobile 25/25 green (`shots/regress-cpp.log`). Landscape
  (landscape, roam, tour, level, mini): roam failed "two thumbs" because the slim player, raised 40 px to clear the
  DEV chip, covered the right-thumb look area → on short screens the corner player sits 8 px from the bottom again and
  the DEV chip moves to the lower left; rerun 5/5 green (`shots/regress-cpp-land.log`). Link mode (`--csp`, as on
  claude.ai) `mini` green desktop + mobile; own-domain build (`--dist`, real headers, no CSP violations) selftest
  18/18 players, failures, mini, integrations (floors 1–2, both platforms, real playback) green desktop + mobile
  (`shots/regress-cpp-dist.log`). 2D fallback cabin shows both logos.
- C4: published v10 at https://claude.ai/artifact/5xCceHjVXcc1Rtcv9xq8EB; dist/ rebuilt.
- Provisional copy: "MINIMIZAR", "AMPLIAR" (+ aria "Minimizar el reproductor (la canción sigue sonando)").

## Next step
User playtest on real phones (YouTube 200 × 200 corner player, Spotify bar). Keep a durable copy of the project
outside %TEMP% (the scratchpad was wiped once).
