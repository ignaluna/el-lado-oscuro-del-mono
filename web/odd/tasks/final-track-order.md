# Feature: final-track-order — floors follow the released track list; release on 2026-12-11 11:11

## Objective
Floors 1–9 follow the record's published track list, and the launch happens on 11 December 2026 at 11:11 (−03:00).

## Why / problem
User (2026-11-22) sent the distributor's release page: "Este tiene que ser el orden de los pisos y la fecha de
lanzamiento es el 11/12 a las 11:11". Published order: 1 En Una, 2 ¿Qué Te Está Pasando?, 3 El Lado Oscuro del Mono,
4 ¿Qué Carajo?, 5 Pato, 6 Explotar, 7 Casi Perdido, 8 No Me Perdones, 9 Portales (feat. S1W); release 2026-12-11
11:11, time zone −03:00. The game had Explotar on floor 5 and Pato on floor 6. This matches the order the user
confirmed on 2026-10-02 (Engram album/track-order).

## Scope / constraints
- Swap floors 5 and 6 only: Pato → floor 5, Explotar → floor 6. Floors 7 and 8 stay (Casi Perdido 7, No me perdones 8).
- Track ids, chapters and invitation hashes do not change (`pato`, `explotar`, `cap-5`, `cap-6`). Rooms and trials
  are keyed by track id, so only the floor numbers, comments, docs and harness expectations move.
- `RELEASE_AT = "2026-12-11T11:11:00-03:00"`.
- Song titles unchanged (the "feat. S1W" credit on Portales is not part of this ask).
- Source file names (`59-room-5-explotar.js`, …) may keep their names; header comments must say the right floor.
- About 400 authored changed lines per task is a planning heuristic only.

## TDD
Mode: off (source: no project/session TDD configuration; same as earlier web features). Runner:
`node web/tools/check.cjs` after `node web/tools/build.cjs`.

## Delivery
Strategy: ask-on-risk. Branch `feat/final-track-order` from `origin/main` df208a0 (includes PR #14), worktree
`el-lado-oscuro-del-mono-wt-order`. Push and PR are the user's decision.

## Tasks
- [x] O1 Swap floors 5/6 in `tracks` (order the entries by floor) and set `RELEASE_AT`; fix floor numbers in
      comments and harness expectations (route: delegated writer; trigger: 2+ non-trivial files).
- [x] O2 Docs: `web/RECORRIDO.md` (order table, "pisos 5 a 8" note, floor 5/6 sections in the new order), README
      if it names the date or floors (route: same writer).

## Acceptance criteria
- The cabin panel lists 5 Pato and 6 Explotar; each floor opens its own room and frees its own chapter.
- A closed chapter says where it waits with the new floor ("Te espera en el piso 5, «Pato».").
- The countdown targets 2026-12-11 11:11 −03:00.

## Checks
- `node web/tools/build.cjs`
- `node web/tools/check.cjs --scenario smoke,cabin,trials,book,basements --viewport both`
- `node web/tools/check.cjs --scenario room --floors 5,6 --viewport both`

## Progress
- 2026-11-22: document created; O1 starting.
- 2026-11-22: O1/O2 done (route: delegated writer; trigger: 2+ non-trivial files). Edited `00-base.html` (tracks order,
  comment, `RELEASE_AT`), header comments of rooms/trials/art/`41-r3d-elodm.js`, `check.cjs` (floor numbers, table,
  closed-chapter and song-line expectations, generic world arrivals moved to floor 5 to keep the Pato world),
  `RECORRIDO.md` (table, notes, sections swapped), `brief/DESIGN.md` and `brief/SPEC.md` (date).
  Checks observed: `build.cjs` ok; `check.cjs --scenario smoke,cabin,trials,book,basements --viewport both` all passed
  (trials asserts the table 5:pato 6:explotar; book asserts "Te espera en el piso 5, «Pato»" and "Explotar · Piso 6");
  `check.cjs --scenario room --floors 5,6 --viewport both` all checks passed (desktop and mobile).
