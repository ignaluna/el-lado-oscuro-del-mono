# Feature: world-interactions — invitations, the hidden book, floor 10, community

## Objective
Add discreet, in-world interactions to the launch experience without changing its look, atmosphere, navigation or
behaviour. Only stage 1 is implemented in this iteration; stages 2–4 are defined here for later.

## Constraints
- Deliverable: `artifact/index.html` built from `src/` (outside the repo, no commits). Published at
  https://claude.ai/artifact/5xCceHjVXcc1Rtcv9xq8EB.
- No invented book texts, meanings, people, photos or anecdotes. Challenges per song wait for audio + lyrics + book.
- TDD off (no runner); checks = harness scenarios in `tools/check.cjs` + `probe/boot-hash.cjs`.

## Reference material (checked 2026-10-02)
- Songs: https://untitled.stream/library/project/EieiltAima533MDCRTdbE — page opens; lists 10 files, 38m49s:
  En Una (two masters: V1 and V1(B)), Qué te está pasando, ELODM, Qué carajo, Pato, Explotar, Casi Perdido(C),
  No me perdones, Portales. Audio cannot be heard by the assistant: titles/order only, no lyrics on the page.
- Book: Google Doc `1dhRfBwS9tYNF976OjnvtH28DPYKAQ0QukQeQImcjh1g` — opens; ≈2,700 words in the first tab. Headings found:
  Dedicatoria, Contraportada, "[Pensamientos intrusivos : Masticar el tiempo]", Capítulo 2 ¿Qué te está pasando?,
  Capítulo 5 Pato, 6 Explotar, 7 No me perdones, 8 Casi Perdido, 9 Portales. Not found as headings: chapters 1, 3, 4.
  Only the outline was read; the text itself is untouched until stage 2.
- Definitive order (confirmed by the user 2026-10-02 = the untitled.stream order): 1 En Una · 2 Qué te está pasando ·
  3 El Lado Oscuro del Mono · 4 Qué carajo · 5 Pato · 6 Explotar · 7 Casi Perdido · 8 No me perdones · 9 Portales.
  Masters on disk (WAV 48 kHz, headers read only): 3:53, 3:14, 4:25, 3:46, 4:28, 4:06, 3:52, 3:12, 3:59.
- "En Una": the user chose to try master V1 (2026-10-02; may still change).
- Still open: chapters 1, 3, 4 of the book; the book numbers 7/8 the
  other way round; the repo's `shared/site.config.ts` still has the old order (untouched).
- Earlier open questions from the material (kept for history): (a) track order differs between untitled.stream, the book (7/8 swapped) and
  `shared/site.config.ts` in the repo; (b) which "En Una" master is final; (c) where chapters 1, 3 and 4 live.

## Stage 1 — invite someone to each world  [DONE 2026-10-02]
What existed: `tracks` config (one entry per floor), generated panel, floors, players, session progress.
What was missing: stable ids, deep links, share/copy UI, a way in for the receiver, pre-release handling.
- [x] `id` (slug) per track; a world link = page address + `#id` (e.g. `#amor-libre`). `SHARE_BASE_URL` config.
- [x] Panel: small envelope at the end of each row → plate "¿A quién traerías a este mundo?" (share / WhatsApp / copy).
- [x] Inside each world: "INVITAR A ALGUIEN A ESTE MUNDO" next to "VOLVER AL ASCENSOR"; plate never covers the player.
- [x] General "INVITAR A ALGUIEN" (top-left, exterior and cabin) with the main address.
- [x] Receiver after release: in-cabin gate "Te invitaron a un mundo / [song] / ¿Por dónde querés viajar?" — one tap picks
      the platform, unlocks audio, short ride, doors open on that world. "AHORA NO" → normal entrance.
- [x] Receiver before release: normal countdown + note "Te invitaron a «X». Abre cuando llegue el ascensor."; the
      destination is kept (localStorage) and offered as a caption once the doors are open.
- [x] The address bar follows the current world (`replaceState`), cleared when going back to the elevator.
- [x] Links carry no state: opening one never resets or imports progress (the receiver's visited list only grows by
      actually arriving).
Evidence: `check.cjs --scenario invite` desktop + mobile (remembered before release, gate, arrival at floor 2 with
YouTube start=189, plate not overlapping the player, clipboard = link, hash cleared on return, panel + general plates,
link after release → gate, dismiss keeps progress); `probe/boot-hash.cjs` (load from link, reload without it, unknown
link); full regression green incl. CSP link mode and 2D. Not verified: real phones, native share sheet (headless has
none; in claude.ai the host refuses Web Share and the code falls back to copy), the published page itself.
Copy invented by the assistant (to confirm): general message "Te invito a El Lado Oscuro del Mono, de Monos del
Ambiente: [enlace]", title "¿A quién traerías?", gate texts, pre-release note, "AHORA NO".

## Stage 2 — the book as a discovery  [STRUCTURE DONE 2026-10-02, texts empty on purpose]
- [x] `BOOK` config: `pages` (one per world: id, foundIn, heading, text — all texts ""), `opening`, `buy` urls, `enabled`.
- [x] A copy with the real cover leans on the lowest step of the elevator (lobby, before and after the release).
      Tapping it: the camera crouches, the hand touches the cover, a fingerprint stays on it, the book rises and opens.
- [x] Once found: a small book glyph (top-right) reopens it. No counter, no mission text.
- [x] A loose page floats in each world only for whoever carries the book; tapping it sends it into the book.
- [x] Reader: cover with the visitor's print, one leaf per page (blank until found), colophon with the purchase links
      (ebook when set; paper copy only when every page was found). It never covers the official player.
- [x] Progress in sessionStorage (`eldom.book`): survives a reload, starts over with a new visit. Dev: reset / find / complete.
Files: `src/45-r3d-book.js`, `src/57-book.js`, cover in `src/10-assets.js`, 2D fallback in `src/50-r2d.js`.
Evidence: `check.cjs --scenario book` desktop + mobile (pick-up, print, reload keeps it, page appears in world 2, taken,
reader beside/above the player without overlap, placeholder text, colophon links by completeness, reset); full
regression green. Not verified: real phones, the published page.
- [x] PB button (user approved 2026-10-02): tenth row "PB · ENTRADA" at the bottom of the panel (key 0). The cabin rides
      down, the doors open and the visitor walks out to the entrance, where the book can still be found. Needs no
      platform; progress untouched. Scenario `pb` green on desktop + mobile.
Decisions taken by the assistant (to confirm): the book is findable before the release; pages are invisible to those
without the book.
Placeholder copy written by the assistant: "Texto del libro pendiente.", "ENCONTRADA EN «…»", "CONSEGUIR EL EBOOK ↗",
"CONSEGUIR EL LIBRO EN PAPEL ↗", "Guardaste una página en tu libro.".
Still needed from the band: the text of each page and which world it belongs to (the config is keyed to the demo
album's worlds today), opening pages if any, ebook and paper purchase URLs.

## Stage 3 — floor 10: gallery of the process and thanks  [STRUCTURE DONE 2026-10-02, content empty on purpose]
- [x] `GALLERY` config: `pieces` (id, group note, src, title, caption, thanks — all ""), `thanks` { heading, lines },
      `label`, `id` (link `#galeria`), `enabled`. The floor number is always songs + 1 (10 today).
- [x] The room: a corridor over the water, frames zigzagging left/right, the thanks plate at the end. Empty entries hang
      as bare frames; an image resizes its frame to its own proportions.
- [x] Visiting: walk (keys) or tap a piece → the camera stands in front of it and its text shows below (‹ › to move on).
- [x] Two ways in: an inscription "10 · GALERÍA" floating beside the elevator (works BEFORE the release) and the top
      row of the cabin panel (after it). Leaving returns to wherever the visitor came from.
- [x] Needs no platform, no songs heard, no book. Link `#galeria` opens it directly. 2D fallback included.
Files: `src/47-r3d-gallery.js`, `src/58-gallery.js`, panel/dial changes in `src/30-r3d-cabin.js`, `src/50-r2d.js`.
Evidence: `check.cjs --scenario gallery` desktop + mobile (in from the entrance before release, empty piece, sample
image via dev "Obras de muestra", thanks plate, out; in by elevator after release, back to the cabin at floor 10).
Still needed from the band: the photos (as files to publish next to the page, or data URIs), their titles, captions
and thanks, the list of people for the closing plate, and the order they should hang in.
Decisions taken by the assistant (to confirm): the entrance inscription and its wording, 8 placeholder frames (two per
group named in the brief), the corridor layout, "Obra pendiente." / "Agradecimientos pendientes." placeholders, the
panel getting an eleventh row (rows are tighter: ≈36 px on a phone).

## Stage 4 — community for those who heard everything  [DEFINED, to evaluate]
Exists: visited floors per session; players report "playing" (embed mode only).
Missing: a definition of "heard the nine songs" (arrived vs. played vs. played to the end — in link mode the page
cannot know), the dim button / inscription "Hay otros que también llegaron hasta acá", the WhatsApp link, the name.
Independent from the book; no sharing requirement; no secret floor.

## Next step
User review of stages 1–3; real content for the book and the gallery; then evaluate stage 4 (community).
