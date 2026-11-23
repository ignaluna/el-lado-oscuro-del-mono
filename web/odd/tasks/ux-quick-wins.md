# Feature: ux-quick-wins — fewer stuck and lost moments for a first-time visitor

## Objective
A first-time visitor knows how to move and look, is invited to a hint when stuck, is not punished hard for a wrong
guess, knows what comes next after a chapter, and can hit every small control with a thumb.

## Why / problem
User (2026-11-22): "Necesitamos generar una mejor experiencia de usuario para el juego, los botones, la jugabilidad,
para que el usuario no se frustre." A read-only audit (Engram `ux/frustration-audit`) ranked the friction points.
User decision (2026-11-23) on hints: "PISTA que brilla" — the PISTA button glows when the visitor seems stuck; hints
are never shown automatically.

## Scope / constraints
- Q1 Hint invitation: in rooms (`#rm-hint`) and levels (`#lv-hint`), PISTA starts to glow after 2 wrong tries or
  about 90 s in the floor without progress (stage change), whichever comes first; the glow stops once PISTA is
  opened, on progress, or when the floor is done. Reuse the existing `nudge` glow if it exists (`59-level.js`).
  PISTA is styled as a primary action (brighter than INVITAR), keeping the D4 backing and 44 px.
  Respect `prefers-reduced-motion` (a steady highlight instead of a pulse).
- Q2 Floor 6 (Explotar, `59-room-5-explotar.js` `sing()`): a wrong word resets the sung order only; the three found
  notes stay. Update the line the visitor reads if it says the notes scatter, and RECORRIDO.
- Q3 First arrival on a floor (once per visitor, stored like other progress): one dismissible line on how to move and
  look — touch: walking ring + drag to look; desktop: WASD/arrows + mouse to look. It stays until the visitor moves,
  taps it or a few seconds after moving; it never overlaps the walking ring or the arrival line.
- Q4 After a chapter is freed and the book closes: a short line "Capítulo n/9 · Seguí por el piso X, «Title»", where
  X is the lowest floor whose chapter is still closed; when all are free, a closing line instead. Copy in Spanish,
  neutral, in COPY.
- Q5 Touch targets: `.plate-x`, `#sound`, `.portal-mini` controls (and any similar corner control found) at least
  44 px tall under `(pointer: coarse)`, without moving the desktop layout.
- Out of scope (need a product/copy decision): unifying ALEJARSE / VOLVER / CERRAR, shortening the band's arrival
  texts, skipping floors, backings for `.portal-label`, `#gal-cap` and exterior captions.
- Visitor copy in Spanish (neutral); code, comments and harness in English. About 400 authored changed lines per
  task is a planning heuristic only.

## TDD
Mode: off (source: no project/session TDD configuration). Runner: `node web/tools/check.cjs` after
`node web/tools/build.cjs`.

## Delivery
Strategy: ask-on-risk. Branch `feat/ux-quick-wins` stacked on `fix/dialog-dismiss` (e710544), worktree
`el-lado-oscuro-del-mono-wt-dlg`. Push and PR are the user's decision.

## Tasks
- [x] Q1 Glowing PISTA (rooms and levels) + primary styling.
- [x] Q2 Floor 6 keeps the notes on a wrong order.
- [x] Q3 First-arrival move/look line.
- [x] Q4 Next-step line after a chapter.
- [x] Q5 44 px touch targets for the small controls.
- [x] Q6 Harness assertions for Q1–Q5 and RECORRIDO notes.
- [x] Q7 (review R3-001/002) Plates bound their bottom: with the upright top from plateClear, maxHeight keeps CERRAR/OTRA PISTA on screen and above the docked player; long plates scroll inside.
- [x] Q8 (review R3-003) Explotar resets heardN with the sung order after a wrong word.
- [x] Q9 (review R3-004/005) Stale tap entries are pruned so dismissTap keeps working; Book.fresh is cleared whenever the book hides, not only in close().

## Acceptance criteria
- After 2 wrong tries, or about 90 s without progress, PISTA glows; opening it stops the glow.
- A wrong word on floor 6 keeps the three notes.
- A first arrival shows how to move and look once; a later arrival does not.
- Closing the book after a chapter says how many chapters are free and which floor is next.
- On touch, CERRAR, OTRA PISTA, SONIDO and the player's corner controls are at least 44 px tall.

## Checks
- `node web/tools/build.cjs`
- `node web/tools/check.cjs --scenario smoke,dismiss,phoneview,landscape --viewport both`
- `node web/tools/check.cjs --scenario trials,book --viewport both`
- `node web/tools/check.cjs --scenario room --floors 1,6 --viewport both`

## Progress
- 2026-11-23: document created; Q1 starting.
- 2026-11-23: Q1–Q6 implemented. Route: delegated writer (trigger: 2+ non-trivial files). New `src/59-nudge.js` (glow after 2 wrong tries in the stage or ~90 s idle, only with the floor showing and nothing open; stops on PISTA, progress, done); `.cap-pista` primary styling; Q2 `sing()` keeps notes; Q3 `Roam.moveTip` (one-time line, key `eldom.moved.v1`); Q4 `Book.nextLine` + `Reveal.stay`; Q5 `(pointer: coarse)` 44 px block. Harness: `quickWins()` runs inside `dismiss`; every context starts with the Q3 key set. Observed (all exit 0): build ok; smoke,dismiss,phoneview,landscape both viewports pass; trials,book both pass; room floors 1,6 both pass; room floor 5 (thorough Explotar, updated for kept notes) both pass. Note: Explotar is floor 5 in the catalog (chapter 6); the brief's "floor 6" was read as that room.
- 2026-11-23 parent spot check: the upright-phone plate covered the book icon; `plateClear()` now also clears
  `#sound` and `#book-open`, and syncUI places the plates after the book icon's visibility is set. A desktop Q3 flake
  (test race: reset and arrival in separate `ev()` calls let a frame show the line on the previous floor) was fixed in
  the test only. Observed: `dismiss --viewport both` 3/3 by the writer plus 1/1 by the parent; smoke, phoneview,
  landscape both pass; next-step shot shows the book icon clear.
- 2026-11-23 review: assess vs df208a0 medium, review_due (slice_budget_reached, 680 lines); user granted; lens
  reliability; approved and acknowledged (lineage review-487cbdbdd9f484ae, authority burned). Advisory, non-blocking
  follow-ups: R3-001/002 plate maxHeight ignores the new upright top (a long plate's CERRAR could fall under the player
  or off screen); R3-003 Explotar `heardN` no longer reset after a wrong word; R3-004 stale tap entry could disable
  dismissTap; R3-005 `Book.fresh` could fire the next-step line on a later unrelated close.
- 2026-11-23: Q7–Q9 done (delegated writer, same trigger). Q7: `plateMaxH(top, floor)` bounds `Room.place` / `Level.place` between their real top and the docked player (or the screen bottom); `#rm-panel` / `#lv-tip` are now flex columns whose body (`#rm-body`, `#lv-tip-body`) scrolls while the CERRAR / OTRA PISTA bar stays. Q8: `heardN` only drives the "a note is near" line in the notes phase, so after a wrong word (phase stays `song`) it has no visible effect; it is reset with the sung order anyway and exposed as `heard` in `Room.debug()` (asserted in the thorough Explotar walk). Q9: stale `taps` entries are pruned on pointerdown; `Book.fresh` is cleared when the book did not open, on Book.reset, on a phase change and in resetWorld. Harness: `plateAndRobustness()` in `dismiss` (longest hint tier of floors 1–9, ring and clock plates, a 360×640 phone, stale pointerdown, book that never opened). Checked red-green: without the Q9 fixes two checks failed; without the Q7 source the ring plate ended at 418 px over a player at 367 px. All runs exit 0: build; dismiss both x2; smoke,phoneview,landscape,book both; room floor 5 both.
- 2026-11-23 parent spot check (Q7–Q9): rebuild ok; `dismiss --viewport mobile` all checks passed; the hint plates were
  made opaque (`rgb(16,14,13)` instead of .95 alpha) because the arrival line showed through a long hint on a
  360×640 phone; re-run passed and the shot is clean.
