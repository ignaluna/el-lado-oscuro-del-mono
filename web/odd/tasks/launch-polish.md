# Feature: launch polish (gallery off, Spotify sign-in, lighter phone experience)

Locator: `web/odd/tasks/launch-polish.md` · Engram mirror: `odd/launch-polish/tasks`
Branch: `feat/web-launch-polish`, stacked on `feat/elodm-recorrido` (PR #9, still open)

## Objective

Four requests from the user (2026-10-31): hide the thanks floor; review the Spotify flow, because
visitors who are not signed in only hear a sample; make the experience less loaded for people on a
phone; add the book's texts to the game.

## Findings

- "Thanks floor" is the gallery, floor 10 (`GALLERY` in `web/src/00-base.html`). It holds the
  photos and ends in the thanks plate. There is no other floor with thanks. The book's own
  "Agradecimientos" page is a different text and stays.
- Book: the Google Doc (id `1dhRfBwS9tYNF976OjnvtH28DPYKAQ0QukQeQImcjh1g`) exported as .docx and
  run through `tools/book-text.cjs` matches all 14 texts in `src/05-book-text.js` word for word
  (whitespace normalized). No text change is needed. The texts are on PR #9 and not on `main`, so
  they are not public yet.
- Spotify: the record floors 1-9 have no audio ids yet, so today Spotify only plays in
  "Mientras esperás" and the basements. Nothing tells the visitor to sign in before the sample
  ends; the page only reacts after detecting a sample.
- Sources on Spotify, all secondary, Spotify's docs do not state this: full playback needs a
  signed-in visitor plus `allow="encrypted-media"`; forum reports say phones get the sample even
  when signed in (2023, unconfirmed). OAuth with the Web Playback SDK is not viable for a band:
  Premium only, and new apps are capped at a small allowlist.

## Decisions

- Hide the whole floor with the existing flag `GALLERY.enabled = false`. Reversible in one line.
- Spotify stays non-blocking: no modal and no forced login. Sign-in or "open in Spotify" is offered
  from the player itself. Never try to bypass login (`brief/DESIGN.md`).
- Phone copy must stay true whatever Spotify does there: say that without a session it is a
  sample, never that a phone cannot play the full song.
- "Less loaded" covers both meanings: fewer things on screen and less work per frame.
- Book: no change. Typos stay listed in `RECORRIDO.md`; the author decides on them.

## TDD

Mode: off (no project or session TDD configuration). Runner: `node web/tools/check.cjs`.
Ordinary functional checks per task.

## Tasks

- [x] **P1 Hide the gallery floor.** Route: delegated (writer trigger: panel, director, checks). Commit: see Progress.
- [ ] **P2 Spotify sign-in flow.** Route: delegated.
- [ ] **P3 Lighter phone experience (rendering tier and on-screen load).** Route: delegated.
- [x] **P4 Book texts.** No change needed, see Findings.

## Acceptance criteria

- No route reaches the gallery: plaque, cabin row, world button, `#galeria`. The cabin panel shows
  no gap. Setting `GALLERY.enabled = true` brings it back.
- A Spotify listener sees, before the sample ends, how to hear the whole song. On desktop, signing
  in and coming back reloads the player without a page reload. On a phone the main action opens
  the song in Spotify. Links stay official.
- Desktop rendering and layout unchanged. On a phone, a world shows less at once and every action
  that moves stays reachable.
- `node web/tools/check.cjs --scenario all --viewport both` passes.

## Delivery

Forecast: under about 400 authored changed lines. Strategy: `ask-on-risk`, one branch.
Push and PR remain the user's decision.

## Progress

- Exploration, doc comparison and Spotify research done. Branch created.
- P1 done. `GALLERY.enabled = false`; every route was already gated by the flag (plaque, cabin row, hotspots, `#galeria` at boot and hashchange, 2D inscription, `panelTop`/`panelUpRows`), so the change is the flag plus tests. New scenario `galleryoff`; `gallery`, `galleryphotos`, `tour` and `autoplay` skip their gallery steps while it is off. The build still publishes `galeria/` photos to dist (unlinked).
  - `check.cjs --scenario galleryoff,gallery,galleryphotos,cabin --viewport both --fast`: galleryoff 8/8 ok on both, gallery and galleryphotos skipped, cabin ok.
  - `check.cjs --scenario tour,autoplay --viewport both --fast`: all passed.
  - Flag flipped to true locally: `galleryoff,gallery,galleryphotos,tour,autoplay --viewport both --fast` all passed (galleryoff skipped); flag set back to false.

## Next step

P1.
