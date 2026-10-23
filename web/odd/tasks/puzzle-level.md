# Feature: puzzle-level — one exploration + puzzle level inside a song's world (playable prototype)

## Objective
A single playable level on floor 1 ("Tan Buena", Pequeño Primate) of the launch Artifact: the visitor arrives by
elevator, the song plays in the official player, and a small mystery leads to a page that joins the hidden book.
Goal: evaluate whether the mechanic is fun. Full route and downloads are out of scope.

## Why / problem
User request 2026-10-05 (pasted brief): painting that moves → panel that opens → box with a three-symbol
combination → a clue in the room gives the order (deducible, no random trying) → object inside → picking it up turns
it into a page that joins the book → open the book, read the page (provisional marker if no final text) → "Nivel
completado" with "seguir explorando" / "volver al ascensor". Optional hint, local save of completion, reset option,
existing desktop/phone controls. Do not unlock other floors. Verify every interaction, no double page, persistence.

## Scope / constraints
- Target: the Artifact (scratchpad `src/*`). The repo has no book and only demo audio, so the brief's "book",
  "Pequeño Primate songs" and "floors" exist only in the Artifact. Repo untouched.
- Music stays in the official players (original brief: user-initiated playback only, never `playVideo()`, never
  hide/cover/mute). The level never removes the player; on wide screens it docks it smaller while exploring.
- Existing controls only: tap/click hotspots, drag to look, keys; the same DOM caption style.
- No invented book text or meanings: the page uses `BOOK.pages` (empty → provisional marker). New copy written by
  the assistant is listed for confirmation.
- Symbols come from the cover/scene iconography (arch, II, fingerprint, ring); the clue uses the scene's own water.
- Route: inline (user declined delegated writers for this Artifact on 2026-10-02; recorded per task).
- TDD: not configured for the Artifact; functional checks via `tools/check.cjs` scenarios.
- Planning heuristic ~400 authored lines/task is advisory only.

## Tasks
- [x] P1 Level state: `LEVEL` config, `Level` controller, localStorage save (`eldom.level.v1`), reset, link with the
      book (page from the box, not floating; never twice; completed level keeps its page after a reload).
- [x] P2 3D set on floor 1: wall fragment, painting (album cover), hatch, box with three symbol dials, the object,
      the clue (three symbol stones whose marks appear only in the water), anchors and animations.
- [x] P3 Flow + UI: inspect poses, compact player on wide screens, dial turning + open, object → page → book,
      book opens on the page (provisional marker), "Nivel completado" card, optional hint, reset, keyboard/touch.
- [x] P4 Checks: `level` scenario with real taps on desktop and phone — wrong try, deduced solution, page once,
      reload keeps completion, reset; regression of book/floors/return; screenshots.
- [x] P5 Publish + how to playtest + list of provisional content.

## Acceptance criteria
End-to-end playthrough with real taps on desktop and phone; the solution follows from the clue; the page enters the
book once; completion survives a reload; reset restores the level; no other floor changes; no page errors.

## Progress / evidence
- 2026-10-05: document created (5 tasks).
- P1–P3 (route: inline; trigger evidence: 2 new files + 6 touched, user declined delegated writers for this Artifact):
  `src/48-r3d-level.js` (set: wall around a niche, painting = album cover hung crooked, hatch, box with three dials
  + latch, prism, rainbow fan, sheet; three stones whose marks are spheres on layer 2 — the water's mirror camera
  enables layer 2, the main camera does not), `src/59-level.js` (Level controller: stages 0–4, localStorage
  `eldom.level.v1`, views wide/wall/box/stones with computed inspect poses, hint tiers, flash, card, two-tap reset,
  page given once + restored after reload if the session book was lost), `LEVEL` config + copy + CSS + DOM in
  `00-base.html`, PlayerPortal `setDock('compact')` on wide screens while inspecting, `alignFor()` puts the floor-1
  player on the right, `world.floorAim` turns the phone's first view toward the wall, book reader shows
  "CONTENIDO PROVISIONAL" for empty pages, `Book.pageHere()` skips floor 1 (its page comes from the box).
- Bugs found by the checks and fixed: dial index parsed with slice(7) ("Rueda 0/−1", dials 2–3 dead); camera breath
  made the close-up hotspots unstable (now damped when lookScale < 0.1).
- P4 evidence: `level` scenario (real taps, 23 checks) green on desktop 1600×900 and mobile 390×844: arrival by
  elevator with the official player, painting, hatch, wrong try ("No cede."), hint ×2, clue marks 3·1·2 under
  dos/anillo/arco only in the water, order deduced from them (anillo → arco → dos), box opens, prism → page → book
  opens on it with the provisional marker, "NIVEL COMPLETADO" after closing the book, second take ignored, "Seguir
  explorando", reload keeps completion + page, reset asks first then clears level and page, "Volver al ascensor"
  from the card, visited stays [1]. Contact sheets: shots/sheet-level-d1/d2/m1/m2.png.

- Regression 2026-10-05: 21 scenarios (smoke … tour, level, failures) exit 0 on desktop and on mobile
  (shots/regress-level.log); no page errors (console noise only: YouTube ad request ERR_FAILED).
- Published v8 at https://claude.ai/artifact/5xCceHjVXcc1Rtcv9xq8EB (same URL).

## Playtest (P5)
- Published Artifact: DEV tab (right edge on phones) → "Nivel" → "Ir al piso del nivel" (jumps there), or the full
  way: DEV → "Publicado" → ENTRAR AL ASCENSOR → YouTube/Spotify → piso 1.
- Inside claude.ai the players are links (frames blocked): the song opens in YouTube/Spotify. With the embedded
  player (music playing while exploring): `node tools/check.cjs --serve` → http://127.0.0.1:5178/.
- Reset: "REINICIAR NIVEL" (two taps) on the floor or in the card, or DEV → "Nivel" → "Reiniciar nivel".

## Provisional content (to replace or confirm)
- Book page of "Tan Buena" (`BOOK.pages[0]`: heading/text empty → shows "CONTENIDO PROVISIONAL").
- Copy written for the prototype: hotspot labels, "No cede.", "Detrás del cuadro hay una tapa.", "La caja se abrió.",
  the 6 hint lines, "NIVEL COMPLETADO", "La página quedó en tu libro.", buttons, "← ALEJARSE", "PISTA", "OTRA PISTA".
- Design choices: painting = album cover; object = prism (the cover's rainbow beam); symbols ring/arch/two
  bars/fingerprint; clue in the water reflection; level on floor 1 "Tan Buena" (Pequeño Primate demo data).
- Not covered: 2D fallback (no level without WebGL), real phones, sound by ear.

## Next step
User playtest feedback (is it fun?), final page text, confirmation of the copy and design choices.
