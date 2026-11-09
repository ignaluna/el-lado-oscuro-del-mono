# Feature: En una room (cover challenge) and Spotify sign-in at selection

Locator: `web/odd/tasks/en-una-room.md` · Engram mirror: `odd/en-una-room/tasks`
Branch: `feat/en-una-room`, stacked on `feat/web-launch-polish` (not pushed)

## Objective

User request (2026-11-08): the challenges that earn the book are the core of the game. Give them
more strength, not necessarily more complexity but more movement, escape-room style, floor by
floor. Start with floor 1 "En una": draw its cover art (a simulated reality) in the floor and build
the challenge around that art. The Tan Buena exploration puzzle shows the kind of challenge wanted;
the record floors do not need to be connected to it. Also cover the Spotify case: YouTube plays
right away, Spotify plays only a sample unless the visitor is signed in.

## The cover (reference, described for implementers)

Black square paper, white line drawing, signed "11:11" bottom right. Center: a computer whose
monitor and tower are topped by two big brains; an antenna on top with orbit rings and sparks; the
screen shows an eight-spoke asterisk; keyboard on a desk, a steaming coffee cup, a cable/pipe down
the right side. Left: a small figure with a brain head, a pointed night cap with a pompom, silver
glitter on the brain (asleep). Right: a figure with a gold glitter visor and a party hat, looking
into a cone of dots, circles and binary digits (the simulation). Hands with jagged sleeves come up
from below, typing on the keyboard and resting on the desk.

## Design: "La simulación"

The floor becomes the drawing in 3D (white chalk lines on black, walkable). Ambient movement while
unsolved: hands type, binary data falls from the antenna into the cone, antenna sparks, the cup
steams, the sleeper breathes.

1. **Screen lock.** The asterisk on the screen has 8 spokes the visitor toggles. It needs a code.
2. **Look through the visor.** Inspecting the visor figure offers "MIRAR POR SU VISOR": the camera
   moves to its eyes. Only from that point the scattered dots line up into the code
   `1 0 1 1 0 0 1 0` (clockwise from the top spoke). Reality only makes sense from inside.
3. **The clock.** With the code the screen becomes a clock stuck at the algorithm's hour. Turning
   the cup over shows "11:11", the drawing's signature. Setting the clock to 11:11 shuts the
   machine down: data, sparks and typing stop.
4. **The mirror.** The dark screen shows the mono (book: the mono waits in the mirror). A slow
   "MIRARLO DE NUEVO" hold solves the floor: page, then chapter 1.

Clue, hints and done lines keep the book's own words (the check requires a verbatim clue).

## Decisions

- Record floors keep the plate framework for floors 2-9. En una moves to a walkable room, built so
  later floors can reuse it (a small room registry), without touching the working Tan Buena level.
- Spotify (revisits the launch-polish "no modal" decision at the user's request): when the visitor
  picks Spotify, show once per session a short, non-blocking notice that without a session it is a
  30 s sample, with sign-in, "ya tengo sesión" and "mejor por YouTube". When a sample is detected
  and the song has a YouTube id, offer "SEGUIR EN YOUTUBE" from the same second. Never bypass login.
- Record floors 1-9 still have no audio ids, so Spotify flows are checked on the basements.

## TDD

Mode: off (source: no project/session TDD configuration; same as earlier web features). Runner for
ordinary checks: `node web/tools/check.cjs --syntax` and `--scenario <name> --viewport both`.

## Tasks

- [x] S1 Spotify notice at selection + "seguir en YouTube" on sample (route: delegated writer; commit: the work-unit commit "feat(web): explain Spotify samples at selection...";
      trigger: 2+ non-trivial edits in `00-base.html`, `60-director.js`, `check.cjs`)
- [x] R1 Room framework + En una drawing world (route: delegated writer; trigger: new 3D set and
      controller across several files; commit: "feat(web): draw the En una cover as a walkable room")
- [ ] R2 En una puzzle logic, page/book hand-off, checks (route: same writer as R1)
- [ ] D1 Docs: `RECORRIDO.md` floor 1 section, this document's evidence

## Acceptance

- Floor 1 shows the cover drawn in 3D; the four steps work with buttons only (keyboard, screen
  reader, reduced motion, phone); solving gives the page and chapter 1 exactly once; state
  survives reload; a hint ladder exists.
- Choosing Spotify shows the notice once per session; the three choices work; sample detection
  offers YouTube where an id exists.
- `--syntax` and `--scenario all --viewport both` pass with no pageerror.

## Progress

- 2026-11-08: branch and document created.
- S1 done (same work-unit commit). `SpNotice` (`60-director.js`) shows a region (`#spn`, not a modal, no overlay state) once per visit after Spotify is chosen in the cabin; it leaves on Escape, on any button, or when the cabin phase ends. Sign-in opens Spotify's login (continue = the album) in a new tab; "MEJOR POR YOUTUBE" goes through `choosePlatform('youtube')`. A Spotify sample with a `videoId` adds the primary button "SEGUIR EN YOUTUBE" (start = the track's own YouTube start + the Spotify position in whole seconds, so basement tracks land on the right second of the album video). Not verified with a real signed-in account or a real phone.
  - `check.cjs --syntax`: OK.
  - `--scenario signin --viewport both`: all checks passed (desktop, mobile). New scenario `spnotice` `--viewport both`: all checks passed.
  - `--scenario all --viewport both --fast`: exit 0, 843 ok, no failures.
  - `build.cjs --release --site https://example.netlify.app` then `--scenario signin,spnotice --dist --viewport both`: all passed, no CSP violation.
- R1 done. `49-r3d-room-0.js` is the framework (ribbon lines drawn as quads in the vertex shader, point sprites, `ROOM_SETS[trackId]`, disposed whole on leaving); `49-r3d-room-1-en-una.js` draws the cover as white chalk on black (monitor, tower, two folded brains, antenna with turning rings and sparks, desk, keys that dip, hands with jagged sleeves, cup with steam, cable, sleeper with silver glitter, visor figure with gold glitter, cone of dots, falling binary, "11:11" on the floor). It already knows the states the puzzle will drive (`world.room`). `59-room-0.js` is the controller skeleton (`ROOMS`, hotspots `rm-`, first view); Roam collides with the room's desk and sleepers; the player docks in the corner on arrival (wide). Floor 1's plate still opens from the machine's screen until R2. Lite tier draws fewer folds, glitter and particles. Screenshots: `web/shots/en-una-room-desktop.png`, `web/shots/en-una-room-mobile.png` (not tracked). On a phone the first view shows the machine; the two sleepers are around the corner (drag to look).
  - `check.cjs --syntax`: OK. `--scenario trials --viewport both`: all checks passed (desktop 304 s, mobile 305 s). `--scenario roam --viewport both`: all checks passed (new: the desk and the sleepers are solid). `--scenario tier --viewport both`: all checks passed (new: the room is built for the lite/full tier, fewer lines on lite). `--scenario level` and `fallback2d` (desktop): ok.
