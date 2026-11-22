# Feature: youtube-only — every song plays on YouTube, Spotify is hidden

## Objective
The launch web plays every song through the official YouTube player. The visitor is never asked where to listen
("¿POR DÓNDE QUERÉS VIAJAR?" and the "MIENTRAS ESPERÁS" YouTube/Spotify choice are skipped) and no Spotify player,
notice, sign-in link or button is shown.

## Why / problem
User (2026-11-21): a Spotify Premium visitor had to sign in and found it very complex. The Spotify embed only plays
the whole song to a browser that has a Spotify session inside the iframe; third-party cookie blocking (Safari,
Firefox, Brave, private windows) can keep it on the 30 s sample even after signing in, and the Web Playback SDK needs
OAuth, Premium and extended API access. Decision: "ocultemos spotify, que solo se pueda ver por youtube ... no le
preguntamos por donde viaja, directamente todo en youtube".

## Scope / constraints
- Hide, do not delete: one central switch in the config of `src/00-base.html` (platforms on offer = YouTube only).
  The Spotify code, ids and tests stay so it can come back by flipping the switch.
- With one platform on offer, the platform question is skipped everywhere and `state.platform` is `'youtube'`.
- No Spotify text or control reaches the visitor (selector tokens, Spotify notice, sign-in, "abrir en Spotify",
  album links, DEV self-test rows for Spotify).
- Official YouTube player rules unchanged (user-initiated or YouTube's own autoplay parameter, never `playVideo()`).
- A song with no YouTube id keeps today's fallback (link mode / pending), never a Spotify player.
- Harness `tools/check.cjs` and `tools/preflight.cjs` follow the switch: Spotify scenarios/rows are skipped while
  Spotify is hidden; YouTube coverage stays.
- About 400 authored changed lines per task is a planning heuristic only.

## TDD
Mode: off (source: no project/session TDD configuration; same as earlier web features). Runner for functional
checks: `node web/tools/check.cjs` (browser harness), after `node web/tools/build.cjs`.

## Delivery
Strategy: ask-on-risk. Branch `feat/youtube-only` from `origin/main` 4b25c65, worktree
`el-lado-oscuro-del-mono-wt-yt`. Push and PR are the user's decision.

## Tasks
- [x] Y1 Central switch + skip the platform question in the cabin and the waiting listen flow; hide every Spotify
      control and notice (route: delegated writer; trigger: 2+ non-trivial files, `src/` + harness).
- [x] Y2 Harness and preflight follow the switch; YouTube-only expectations in `cabin`/`integrations`/`selftest`
      (route: same writer as Y1).
- [x] Y3 Docs: `web/README.md`, `web/RECORRIDO.md` mention YouTube only (route: same writer).

## Acceptance criteria
- Choosing a floor goes straight to YouTube; no "¿POR DÓNDE QUERÉS VIAJAR?" step on desktop or phone.
- "MIENTRAS ESPERÁS: PEQUEÑO PRIMATE" opens the YouTube player directly.
- No visible "Spotify" text anywhere in a normal visit (DEV panel included).
- Flipping the switch back restores today's behaviour.

## Checks
- `node web/tools/build.cjs`
- `node web/tools/check.cjs --scenario smoke,cabin,mini --viewport both`
- `node web/tools/check.cjs --scenario integrations,failures,selftest --viewport desktop` (live YouTube; ads may be
  environmental)

## Progress
- 2026-11-21: document created; Y1 starting.
- 2026-11-21: Y1-Y3 done by one delegated writer (route: delegated direct; trigger: 2+ non-trivial files across src/ and
  harness). Switch: `const PLATFORMS = ['youtube']` in src/00-base.html (with PLATFORM_CHOICE, DEFAULT_PLATFORM); the cabin
  selector, gate question, waiting-room question, Spotify notice trigger, DEV platform group and Spotify self-test rows
  all derive from it; setPlatform/choosePlatform/openPortal refuse a hidden platform and a stored 'spotify' is ignored.
  Harness: check.cjs and preflight.cjs read the switch (SKIPPED log lines for Spotify), youtubeOnlyIssues assertion in
  smoke/cabin/listen/mini. Observed: build ok; smoke,cabin,mini desktop+mobile all ok; integrations (all 9 YouTube floors +
  listen), failures (YouTube modes ok, 6-7 skipped) and selftest (9 YouTube rows) ok on desktop; invite scenario ok;
  preflight --offline 0 errors. Not run: the other scenarios that mention Spotify (waiting, autoplay, phoneview,
  landscape) were adapted but not executed. Known cosmetic: the cabin panel keeps an empty band where the selector was.
- 2026-11-21 parent spot check: rebuild ok; `check.cjs --scenario waiting,autoplay,phoneview,landscape --viewport both`
  exit 0 (all passed). Open: the empty band in the cabin panel is a design call for the user.
- Commit 915f4a6 (Y1-Y3). Review assess vs 4b25c65: risk medium, review_due false (under_budget, 277 lines);
  pending in the slice until a later commit reaches the budget or the PR is cut.
