# Feature: listen-minimize — "Mientras esperás" keeps playing while minimized or out of sight

## Objective
User 2026-10-23: in "Mientras esperás", once Pequeño Primate is open, minimize the box and keep it playing, or leave
the page and keep listening.

## Why / problem
The listening player takes the whole entrance (camera, captions hidden, overlay 'listen'): the visitor cannot sign up
or look around while it plays, and any hidden tab paused it (our own rule, `visibilitychange` → pause).

## Scope / constraints
- Same MINIMIZAR / AMPLIAR as the worlds (smallest official size: YouTube ≥ 200 × 200, Spotify 80 px bar). Minimized,
  the entrance is free again (overlay released, camera back, captions and sign-up usable); AMPLIAR brings the
  listening view back; CERRAR still ends it. Not remembered between visits (it opens full size every time).
- Placement: clear of the entrance buttons (lifted above them on phones), of the sign-up plate (desktop: lower left
  while the plate is open; phones: top, the plate making room below it) and of the DEV chip.
- Leaving the page (another tab or app): Spotify goes on; YouTube pauses — YouTube Developer Policies III.I.9 forbid
  playing from a background player (one not displayed in the tab the user is viewing). Applies to every player.
  Phones may still stop web audio in the background (browser/OS decision, not ours).
- Entering the gallery or the release itself still ends the player (unchanged).
- Branch `feat/listen-mini` from main (worktree `el-lado-oscuro-del-mono-wt-web`). Route: inline (user declined
  subagents for this website). TDD not configured: harness scenario.

## Tasks
- [x] L1 PlayerPortal: mini for the listen kind, `onMini` / `place` options, `pageHidden()` (YouTube pauses, Spotify
      goes on); Listen: minimized ↔ expanded, close from either state, "MIENTRAS ESPERÁS" brings a minimized player
      back; plate room on phones; DESIGN.md lifecycle line.
- [x] L2 Checks: harness `waiting` scenario (desktop, mobile, landscape) + regression of the affected scenarios
      (listen, form, mini, integrations listen part, tour, smoke) + dist.
- [x] L3 Commit, PR, Netlify preview.

## Acceptance criteria
Minimized, the demo keeps sounding while the visitor signs up; the player never covers the entrance buttons or the
plate; AMPLIAR and CERRAR work from the minimized state; a hidden page leaves Spotify playing and pauses YouTube.

## Progress / evidence
- 2026-10-23: document created (3 tasks).
- L1 (inline): PlayerPortal `canMini(kind)` (floor, listen), `setMini` calls `o.onMini` and stores only for the worlds,
  `layout()` asks `o.place(m, height)` for a minimized player, `pageHidden()` (YouTube pauses, Spotify goes on). Listen:
  `portal()`, `minimized(v)` (releases / takes back the 'listen' overlay and the camera), `place()` (form open: lower
  left on wide screens, top below the sound toggle on phones with the plate making room through `--mini-reserve`;
  otherwise lower right, lifted above the entrance buttons, or — no room above them, phone lying down — the buttons
  step aside with `padding-right`), `view(on)`, `close()` from any state, `ask()` brings a minimized player back.
- `waiting` scenario green on desktop, mobile and landscape with real playback (YouTube 2.4 → 5.3 s and Spotify
  2.0 → 5.2 s minimized; still sounding with the plate open; hidden page: YouTube paused, Spotify on at 14.8 s; same
  iframe; AMPLIAR back to the listening view; CERRAR while minimized ends it).
- Found while looking at the screenshots and fixed: phone lying down, the lifted player reached the top and its
  controls ran into "SONIDO: SÍ" (→ the buttons step aside); phone with the plate open, same clash at the top
  (→ the player waits below the sound toggle, `Listen.TOP` 46 px).

- L2: full regression `shots/regress-listen.log` (local, not committed): desktop 26/26, mobile 26/26, landscape
  (landscape, roam, tour, level, mini, waiting) 6/6, own-domain build `--dist` on mobile (selftest, waiting,
  integrations floor 1) green, no CSP violations.

- L3: commit f0ae32e (+221 −19). Review assess (base 9e21782): medium (executable change), 240 lines → not due
  (`under_budget`). Branch `feat/listen-mini` → PR to `main`.

- PR https://github.com/ignaluna/el-lado-oscuro-del-mono/pull/2; Netlify preview
  https://deploy-preview-2--monosdelambiente.netlify.app: preflight 0 errors (DEV shown, as previews should); harness
  `--url` smoke + selftest (18/18) green on desktop and mobile, `waiting` partly red only because Netlify injects its
  Drawer into previews (`/.netlify/scripts/cdp`, same origin, then an app.netlify.com iframe that our CSP blocks): a
  grey strip at the bottom covers the entrance buttons and counts as an extra iframe. Production
  (https://monosdelambiente.netlify.app) has no Drawer: preflight 0 errors, 0 warnings. Fix on the user's side:
  Project configuration → Developer settings → Continuous deployment → Collaboration tools → Configure → Deploy
  Previews off.

- 2026-10-23: the user asked me to merge PR #2 ("Hacete el otro PR") → merged (860f00a), live on
  https://monosdelambiente.netlify.app ~20 s later. Live site: preflight 0 errors, 0 warnings; `--url` selftest
  (18/18), `waiting` and `integrations` (floor 1, both platforms, real playback) green on desktop and mobile — after
  one harness fix: on the free plan Netlify injects a "Powered by Netlify" badge into published sites
  (`/.netlify/scripts/hud`, an empty `#nl-badge-frame` iframe, bottom right). Our CSP blocks its inline script, so it
  stays closed (clip-path empty): invisible and click-through (`elementFromPoint` → the page). The harness counted it
  as a leftover player; it now counts only YouTube / Spotify frames (`PLAYER_FRAMES`). No Netlify term found that
  requires the badge (Terms of Use, Self-Serve Subscription Agreement).

## Next step
Optional: turn off the Netlify Drawer for Deploy Previews (it covers the entrance buttons on PR previews only). (Spotify sample → "CONTINUAR EN SPOTIFY"; minimized while signing up),
then merge.
