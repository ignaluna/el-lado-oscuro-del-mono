# ELODM route — nine floors, the book, Pequeño Primate in the basements

Branch `feat/elodm-recorrido` (from PR #7 + PR #8, merge c2a66df). Delivery: one branch and one open PR, no merge, no
production deploy (the band's brief, 2026-10-26). Delivery strategy: `single-pr`, by the brief's explicit request.

## Objective
The elevator's floors 1–9 become the record "El Lado Oscuro del Mono". Each floor has a challenge tied to its song,
its book chapter and the cover element that Luján is drawing. Solving it reveals the authentic chapter. Solving the
nine completes the book and opens basements −1..−9, where Pequeño Primate (all its existing worlds) lives on.

## Definitive order (the band's table — never derived from array positions)
| Floor | Song | Element (cover) | Chapter |
|---|---|---|---|
| 1 | En una | Una realidad simulada por computadora | 1 |
| 2 | ¿Qué te está pasando? | El sistema | 2 |
| 3 | El lado oscuro del mono | El bar Keller | 3 |
| 4 | ¿Qué carajo? | Una paloma | 4 |
| 5 | Explotar | El dolor heredado | 6 |
| 6 | Pato | Un pato | 5 |
| 7 | Casi Perdido | El fuego | 8 |
| 8 | No me perdones | Vacío | 7 |
| 9 | Portales | Un árbol grande | 9 |

## Constraints
- Edit `web/src/` and regenerate with `node web/tools/build.cjs`; never only `dist/` or `artifact/`.
- No invented audio IDs, links, lyrics or recordings. The WAV masters stay out of the public repo (unreleased album).
- The book text is the author's, word for word (paragraphs, spacing, voice). Possible typos are only listed below.
- No test rows in the real sheet (the harness mocks the endpoint unless `--real-leads`).
- Keep the elevator, worlds, gallery, register, invitations, players, free movement and the PP level.
- Release date and conditions unchanged: tests use the dev tools.

## Tasks
Route per task: inline (the user chose inline work for this site; recorded in earlier sessions).
TDD: off (no project TDD config); checks = `web/tools/check.cjs` scenarios, run on desktop + mobile (+ landscape).

- [x] E1 Data model: ELODM tracks on 1–9 + PP on −1..−9 (same ids), albums, cover-art map, authentic book text
      (chapters by stable id, reading order kept), versioned progress `eldom.progress.v2` with safe load. (a8cdc74)
- [x] E2 Navigation with basements: floor lookups by number (negatives), gallery fixed on 10, panel section switch
      (PISOS / SUBSUELOS), dial and readout, keys, 2D fallback, visited by id, locked-basement links. (a8cdc74)
- [x] E3 Players: ELODM floors show a "pending audio" box until the real IDs exist; PP floors keep their players. (a8cdc74)
- [x] E4 Challenge frame: element hotspot + accessible button, close-up plate beside the player, hints, solve →
      element turns into a page → chapter unlocked → book opens on it; no duplicate rewards. (a8cdc74)
- [x] E5 Nine worlds (3D scenery with the element) and nine challenges. (a8cdc74)
- [x] E6 Basements reveal after the ninth chapter; go down, listen, come back up. (a8cdc74)
- [x] E7 Harness: challenge, book, basements, progress and regression scenarios; desktop/mobile/landscape. (c34cb36)
- [x] E8 Docs per song (web/RECORRIDO.md) + cover publishing in the build (7f8db46, 8cf1504); PR below.

## Acceptance
- Each challenge is solvable from clues inside the experience; correct song/element/chapter per floor.
- Book keeps the original order; chapters reread later; survives reload.
- With 8 solved the basements stay locked; the 9th opens them and that persists; old PP progress unlocks nothing.
- Register, gallery, invitations, players and PP worlds still work.

## Decisions
- Challenges are DOM/SVG plates beside the player (accessible, testable, work in the 2D fallback through the floor
  button); the 3D world stages the element and reacts to progress (`world.trial`). The element's hotspot opens it.
- The book: opening pages (dedication, thanks, prologue) come with it; chapters by challenge; the closing lines with all
  nine; the back cover always at the end. The print "(QR → …)" lines become "♪ «song» · Piso N".
- Chapter texts are generated from the manuscript (tools/book-text.cjs) and checked paragraph by paragraph.
- PP's prototype level stays in "Tan Buena" (−1) and gives no chapter. Old session pages (pagina-N) are dropped.
- Basements: shown in a separate panel section (21 rows in one plate would make touch targets too small).
- WAV masters stay out of the repo and the site (unreleased album; README rule).
- Delivery: single PR (brief). RDD assessment: medium, `slice_budget_reached` (2278 lines) → review due, pending the
  user's candidate consent (the user was away; not started).

## Progress
- 2026-10-26: E1–E7 done and committed (a8cdc74, c34cb36).
- E8: web/RECORRIDO.md, README, build publishes assets/portadas, preflight knows both records (7f8db46, 8cf1504).
- Regression found and fixed: on phones the element's hotspot sat where the walking thumb goes (touch adjustment
  snapped the joystick touch onto it) → element moved right on phones, hotspot reduced to its silhouette; roam and
  landscape checks moved to the basements (the level and the official players live there now).
- Checks passed (2026-10-26):
  - desktop: smoke, cabin, mini, trials (all nine), book, basements, level, invite, gallery, galleryphotos,
    fallback2d, press, return, autoplay, roam;
  - mobile: smoke, cabin, mini, trials (all nine), book, basements, level, invite, gallery, galleryphotos, roam;
  - landscape: landscape, trials (floors 1 and 9).
- Not run in this pass: integrations/failures/ytplay/spotify/csp against the real players (they now target the
  basements, unchanged otherwise); the deployed preview (`--url`) once Netlify builds the PR.
- Next: PR with the preview link; RDD candidate consent is the user's decision.
