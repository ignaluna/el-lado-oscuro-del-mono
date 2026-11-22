# Feature: dialog-dismiss — a visitor never gets stuck in a message, a hint or a close look

## Objective
A visitor inside a close look (the room's inspect panel, a level's close view) or reading a hint can always get out:
the way back is visible on every screen, a phone lying down included, and a tap outside the message closes it.

## Why / problem
User (2026-11-22): "Si el usuario está en un mensaje o una pista para alejarse tiene que clickear en alejarse y si
acuesta el celular no se ve eso. Y además la gente no lo entiende; si alguien hace un clickeo por fuera de los
mensajes debería cerrar los diálogos. Para manejar más ese momento porque la gente se traba ahí."

## Scope / constraints
- `← ALEJARSE` (`#rm-back`, `#lv-back`) and the panel's `CERRAR` (`#rm-panel`, `#lv-tip`) stay reachable and at
  least 44 px on desktop, a phone held upright and a phone lying down (landscape, short viewport).
- A tap or click outside the open message closes the topmost thing, one step at a time:
  1. an open hint (`#lv-tip`, the room's hint text) closes;
  2. otherwise, in a close look, a tap on empty space (no interactive object under it) steps back, like `← ALEJARSE`.
  A tap on an object that the close look is about keeps working as today (cutting, turning, picking).
- Escape keeps its current behaviour. The level completion card (`#lv-card`) and forms are not in scope.
- Copy stays as is (no new text unless needed for clarity).
- About 400 authored changed lines per task is a planning heuristic only.

## TDD
Mode: off (source: no project/session TDD configuration; same as earlier web features). Runner:
`node web/tools/check.cjs` after `node web/tools/build.cjs`.

## Delivery
Strategy: ask-on-risk. Branch `fix/dialog-dismiss` from `origin/main` df208a0, worktree
`el-lado-oscuro-del-mono-wt-dlg`. Push and PR are the user's decision.

## Tasks
- [x] D1 Way back visible on a phone lying down: reproduce in landscape (`--viewport` mobile landscape), find why
      `#floor-actions` / `#rm-back` / `#lv-back` / panel buttons fall off screen, fix the layout.
- [x] D2 Tap outside closes: hint first, then the close look on an empty-space tap; objects keep working.
- [x] D3 Harness: assertions for D1 (visible, in viewport, ≥ 44 px, landscape and upright) and D2 (outside tap closes
      the hint, then steps back; an object tap does not), plus `RECORRIDO.md` note.

- [x] D4 Legibility: white labels drawn over the artwork (`#floor-actions` buttons: PISTA, REINICIAR, ← ALEJARSE, ← VOLVER AL ASCENSOR, INVITAR, the trial button; also `#lv-tip`, `#rm-panel`, `#cap-hint`, `#lift`) get a dark backing so they read over light drawings; same type, sizes and 44 px targets; checked on desktop, upright phone and phone lying down.

## Acceptance criteria
- On a phone lying down, inside a close look, `← ALEJARSE` is fully on screen and tappable.
- A tap outside an open hint closes it; a second tap on empty space leaves the close look.
- Tapping an object in a close look still does what it did.
- Every label drawn over the artwork stays readable over a white or light drawing (dark solid or semi-opaque backing, contrast asserted in the harness).

## Checks
- `node web/tools/build.cjs`
- `node web/tools/check.cjs --scenario smoke,room,trials,phoneview,landscape --viewport both`

## Progress
- 2026-11-22: document created; D1 starting.
- 2026-11-22: D1-D4 done by one delegated writer (trigger: 2+ non-trivial files). Root cause of D1: on a short wide screen (phone
  lying down, max-height 480) the floor's buttons stack at the top left, exactly where `#rm-panel` / `#lv-tip` sit (left 16, top 16,
  z-index above), so the panel covered ← ALEJARSE and PISTA; upright, `#lv-tip` (top 12) covered the row too. Fix: `plateClear()` /
  `plateFit()` (59-level.js) place plates beside / below the buttons, re-placed on every syncUI; CERRAR / OTRA PISTA 44 px. D2: stage
  tap in `Input` (60-director.js `dismissTap`, 600 ms, 10 px, single pointer): hint first, then ALEJARSE. D4: dark backing
  rgba(10,9,8,.8) on floor/gallery buttons, SONIDO, INVITAR, libro, the player's AMPLIAR/MINIMIZAR/links; labels at 5.4-9:1 over white.
  D3: `dialogDismiss` helper in check.cjs (scenario `dismiss`, also run by phoneview and landscape); RECORRIDO.md note.
  Checks observed: build ok; smoke, phoneview, landscape on desktop + mobile + landscape (780x360): all checks passed; room and
  trials on desktop + mobile: no FAIL (room 1631 s / 1636 s, trials 647 s). Not committed.
- 2026-11-22 parent spot check: rebuild ok; `check.cjs --scenario dismiss --viewport landscape` all checks passed;
  landscape room-hint shot shows the plate beside the buttons and dark backings. Commit 9151da7. Review assess vs
  df208a0: risk medium, review_due false (under_budget); pending in the slice.
