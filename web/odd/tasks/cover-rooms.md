# Feature: cover rooms for floors 2, 3, 4, 8 and 9

Locator: `web/odd/tasks/cover-rooms.md` · Engram mirror: `odd/cover-rooms/tasks`
Branch: `feat/cover-rooms`, stacked on `feat/en-una-room` (PR #10, open)

## Objective

User request (2026-11-09): build the other levels the way floor 1 "En una" was built. Each floor
becomes a walkable 3D room that draws its song's cover art as faithfully as possible (it should
look like the 3D version of the drawing), with an escape-room challenge based on the drawing and
its book chapter. Solving still gives the chapter exactly as today.

Cover photos (the black square paper is the cover; the orange graffiti heart around it is the
wall it was photographed on). Implementers must open them with their Read tool:

| Floor | Song (id) | Chapter | Cover photo | User's meaning |
|---|---|---|---|---|
| 2 | Qué te está pasando (`que-te-esta-pasando`) | cap-2 | `C:\Users\ignal\AppData\Local\Temp\claude\dc13f129e1763973\0eac0aa8-0668-4002-8daf-f59480b8c6b2\images\2.jpg` | the system |
| 3 | El lado oscuro del mono (`el-lado-oscuro-del-mono`) | cap-3 | `...\images\6.jpg` | the dark side of the mono |
| 4 | Qué carajo (`que-carajo`) | cap-4 | `...\images\3.jpg` | taking life with both hands |
| 8 | No me perdones (`no-me-perdones`) | cap-7 | `...\images\5.jpg` | the void |
| 9 | Portales (`portales`) | cap-9 | `...\images\4.jpg` | portals |

(`...` = `C:\Users\ignal\AppData\Local\Temp\claude\dc13f129e1763973\0eac0aa8-0668-4002-8daf-f59480b8c6b2`.)
Temp folders get wiped, so local copies live in `web/shots/covers/<floor>-<id>.jpg` (gitignored,
not published): `1-en-una`, `2-que-te-esta-pasando`, `3-el-lado-oscuro-del-mono`, `4-que-carajo`,
`8-no-me-perdones`, `9-portales`. Use these paths.
Floors 5, 6 and 7 have no cover yet and keep their plates.

## Shared rules

- Reuse the room framework from PR #10 (`ROOMS` in `59-room-0.js`, `ROOM_SETS` in
  `49-r3d-room-0.js`, the chalk-line kit). The first room generalizes whatever is still special to
  floor 1, for example the `trials` scenario's `t.floor === 1` branch, so later rooms only add files.
- One file pair per floor: `49-r3d-room-<floor>-<id>.js` (set) and `59-room-<floor>-<id>.js`
  (controller). The 2D fallback keeps the floor's current plate (`TRIALS[id]`).
- Faithful drawing: white chalk lines on black, with the cover's gold and silver glitter as small
  sparkling accents. Compare a screenshot with the cover photo and iterate until they look alike.
- Escape-room shape: about three locks and a finale. At least one lock's answer is found somewhere
  else in the room, so the visitor walks and looks. Ambient movement runs until the floor is solved.
- Accessibility stays as on floor 1: everything works with buttons, keyboard and screen reader. Any
  visual clue is also announced. No speed, hover or drag is needed. Slow holds use the existing
  semantics. Reduced motion and the lite tier are respected.
- The clue is verbatim chapter text, as the check requires. Each step has three hint tiers, the last
  of which gives the solution. Feedback uses the chapter's own words where possible.
- Replays never give a chapter twice. State is saved as `eldom.room.<id>.v1` and survives a reload.
- Elements follow the covers. Floor 3: `bar-keller` becomes `grito` ("El grito del mono"). Floor 4:
  `paloma` becomes `manos` ("Las dos manos"). Update the `trials` catalog string at
  `check.cjs:572` to match.

## Designs

### Floor 2 — "El sistema" (Qué te está pasando)

**Drawing:** an isometric city that doubles as a circuit:
- Blocks with gold-dotted windows and a winding road that flows into the center.
- A middle road with dashed lanes and capsule (pill) shapes on it.
- On the left, a circuit maze with dotted drips.
- Top left, a cloud with a spiral, stars and flowers.
- On the right, towers with a smoke column rising.
- A rocket/arrow with ✓ and ✗, a lying computer box, a star constellation, and circuit lines top
  right.

**Chapter:** "Nos obligan a llenarlo. Con plata, con éxito, con amor, con sustancias. Pero no se
llena. Se habita."

**Puzzle:**
1. Every road and wire drains into a hole in the center. A gauge there reads "LLENO: 0 %" and never
   moves.
2. **The circuit.** In the left maze the wires run from one start pin to four feeds. Tracing it
   gives the order in which to cut them, and the order is announced.
3. **The four feeds.** Each feed is a place in the city:
   - PLATA: the gold-window block, whose lights you switch off.
   - ÉXITO: the rocket's ✓, which you flip to ✗.
   - AMOR: the cloud with the spiral and flowers.
   - SUSTANCIAS: the capsules on the road and the smoke tower.

   You walk to each one in the circuit's order. A wrong order makes the system reopen everything.
4. **Finale.** Once everything is cut the smoke stops, the roads empty and the windows go dark.
   You stay in the silence: INHALAR / EXHALAR three times, then "Se habita".

### Floor 3 — "El grito" (El lado oscuro del mono)

**Drawing:**
- A huge screaming monkey mouth, framed by fur, with some gold and some silver teeth. Several teeth
  carry an ✗.
- A graffiti tag scribble that loops out of the mouth.
- Two asterisk stars, ink splatter, and "11:11".

**Chapter:** the body warns ("Calor. Tensión. La palabra empujando."), then "Callate", things break,
"perdón", "No alcanza. Ya sé."

**Puzzle:**
1. **The body warns.** Three signs are hidden in the room: heat in the splatter, tension in the
   bristling fur, and the word as the tag starts to grow. Notice them in the clue's order. When all
   three are noticed, the tag freezes half out of the mouth.
2. **Swallow the word.** A slow hold, "TRAGAR LA PALABRA", coils the tag back into the mouth.
   Touching the tag instead lets out "Callate." and breaks another tooth (one more ✗).
3. **Gather the pieces.** Tooth shards are scattered across the floor, three plus one per break.
   Walk to collect them, then set each one into an ✗ tooth. Each repaired tooth turns gold, like
   kintsugi: forgiveness does not erase the break, but it repairs it in sight.
4. **Finale:** "perdón. No alcanza, ya sé. Pero es lo único que tengo."

### Floor 4 — "Las dos manos" (Qué carajo)

**Drawing:** two huge raised hands with palms forward, furry monkey wrists, and detailed palm
lines. Three drops fall: one from each wrist and one between them.

**Chapter:** the backpack of inherited things — dad's bags, the shared sneakers, Pepe's sword, Eva's
gnocchi, Rolando's wines — "pesa distinto ... cuando lo sostengo con las dos manos en vez de
arrastrarlo"; "no quiero vivir buscando el sentido. Quiero detenerme a sentirlo."

**Puzzle:**
1. **The drag trail.** A backpack's drag marks cross the dark floor and fork. The left palm's life
   line is the map: it shows which fork to take, and the shape is announced. Five inherited objects
   lie along the trail. Following the wrong fork only drags you around.
2. **Hold it with both hands.** Each object found is set in the hands. Both hands must close on it;
   one hand alone keeps dragging it. Five times.
3. **Finale.** The three drops slow down, birds sing and the mate cools. A slow hold, "QUEDARTE",
   finishes it: stop to feel it.

### Floor 8 — "El vacío" (No me perdones)

**Drawing:** almost all black. A small sinking shape sits in the middle of concentric ripples on
water, with splashes, a zigzag reflection with one drop below, and a tiny star above.

**Chapter:** the trembling glass of water, waves that break but do not calm, paper castles that were
excuses, "no hay meta, que solo hay camino", "Pedirte que no me perdones es un gesto de amor."

**Puzzle:**
1. **The star.** In the dark, walking toward the star moves it further away: there is no goal.
2. **The castles.** Three paper castles drift in the void. They are visible only when you are near,
   so you have to walk to find them. Unfolding one turns it into a flat sheet on the water, a stretch
   of road toward the center ripple.
3. **The glass.** At the center a glass trembles with the waves. Set it down while the wave
   retreats. This keeps today's slow wave cycle, and the button names the phase.
4. **Finale.** Choose between "PERDONAME" and "NO ME PERDONES". The first makes the ripples grow
   again. The second calms the water, and the zigzag reflection straightens.

### Floor 9 — "Portales" (Portales)

**Drawing:**
- A great tree whose two trunks arch around a central spiral vortex.
- A canopy of curling clouds, with a treehouse that has a round window.
- A ladder rising to another spiral at the top right.
- A gold sparkle and a silver sparkle at the portal.
- Spirals on both trunks, and roots carved with maze patterns.
- A small figure standing in a glow at the bottom.

**Chapter:** trees as witnesses; old pain "eran llaves. Cada una abriendo una puerta, hasta llegar a
esta."; leave something in a tree root, a dog's bark, a guitar's echo; neighbors greeting, shared
laughter; "los portales no desaparecen. Se transforman."

**Puzzle:**
1. **The four roots.** Walk around the tree. At each root you choose what to leave there: PERRO,
   GUITARRA, VECINOS or RISA. The decoys ESCENARIO, LUCES and PÚBLICO make the root pull back.
2. **The treehouse.** Climb the ladder. Through the round window the gold and silver sparkles show
   which way each trunk spiral must turn (gold clockwise, silver counter-clockwise), and the answer
   is announced.
3. **The spirals.** Turn the three spirals (left trunk, center, right trunk) the right way, and the
   vortex opens.
4. **Finale.** Step into the glow. The camera crosses the portal and comes back to the same place,
   facing the small figure: "siempre te llevan de vuelta a vos."

## TDD

Mode: off (no project or session TDD configuration). Runner: `node web/tools/check.cjs`.

## Tasks

The route for each task is a delegated writer. The trigger is a new 3D set plus a controller plus
checks across several files. Writers run one at a time.

- [x] C2 Floor 2 room, plus generalizing the room checks (route: delegated writer; commits: "refactor(web): let any floor host a room in the framework, dev hooks and checks" and "feat(web): draw the Qué te está pasando cover as the system room")
- [x] C3 Floor 3 room, element `grito` (route: delegated writer; commits: d61b0df "refactor(web): let a room hotspot act without a close look and let a room show its final state" and b07c46d "feat(web): draw the El lado oscuro del mono cover as the scream room")
- [x] C4 Floor 4 room, element `manos` (route: delegated writer; commits: 4771e4b "fix(web): keep a solved scream room solved after reload" and "feat(web): draw the Qué carajo cover as the two hands room")
- [ ] C8 Floor 8 room
- [ ] C9 Floor 9 room
- [ ] CX Full check run and `RECORRIDO.md`

## Acceptance (per floor)

- A desktop screenshot and a mobile screenshot look like the cover.
- The `room` scenario walks that floor's whole puzzle with real clicks.
- `trials` still passes for all nine floors.
- `--scenario all --viewport both` runs with no pageerror.
- A release build passes `--dist` with no CSP violation.

## Progress

- 2026-11-09: branch, designs and document created.
- C2 done. **Generalization** (its own commit): `Room.solveNow` asks the definition for the last-step state (`almost(s)`), `Room.debug` takes extra fields from `def.debug(s)` and serialises `world.room` generically, `world.room.v` is the per-room data bag a set reads, the director builds `ROOM_HOTS` from `ROOMS`, `config().rooms` lists the rooms. In `check.cjs` the `room` and `trials` scenarios walk every floor with a room through the `ROOM_WALKS` table (`--floors 2` runs one room), and the roam / rotate-hint / tier-measure steps moved to floor 6, a world with no room (a room's first view is turned toward its set and its footprint is solid).
  **The room** (`49-r3d-room-2-que-te-esta-pasando.js`, `59-room-2-que-te-esta-pasando.js`): the cover is a relief board leaning back toward the visitor (so the whole drawing reads from where they stand, with the blocks standing out of it), drawn in the cover's own pixels: the gold-window block, the winding road and the middle road with dashes and pills, the hole with draining rings and its gauge (LLENO: 0 %), the left maze with one wire, hatched buildings and drips, the cloud with spiral, stars and flowers, the rocket with ✓ and ✗, the lying computer, the constellation, the top-right circuits, the towers with a smoke column, the crossed sparkle and 11:11. The maze's wire visits four feeds in the order sustancias, amor, plata, éxito (a pulse lights each icon in turn; looking at the circuit announces the order). Each feed is a hotspot with a close look and one button (APAGAR LA CHIMENEA, FRENAR LA ESPIRAL, APAGAR LAS LUCES, TACHAR EL TILDE); a cut out of turn reopens everything ("El sistema vuelve a abrir todo."); four cuts quiet the city (smoke, flows, windows) and the hole offers INHALAR / EXHALAR three times, then the page and chapter 2, once. State `eldom.room.que-te-esta-pasando.v1` is `{v, stage, seen, cuts[], breaths, inNext, done, tries, hints}`; three hint tiers per stage (nothing known, cutting, silence). The 2D plate (`TRIALS['que-te-esta-pasando']`) stays as the fallback and `ELODM_KINDS.machine` no longer draws art (the room does). Lite tier: fewer filler wires, hatch lines, windows, flow points and smoke. Interpretation note: the set is a leaning relief board, not a flat city to walk inside, because the camera stands at eye height 7 m away and a flat plan would be seen at a 10 degree slant; the visitor walks in front of it and its footprint is solid.
  - `check.cjs --syntax`: OK.
  - `--scenario room --viewport both`: all checks passed for floors 1 and 2 (desktop 194 s, mobile 197 s). One earlier run had a mobile-only 8 s click timeout in floor 1's visor/cup steps (the cup hotspot around the corner, the same turn-and-click helper as before) that did not repeat in the next room run, the trials run or the release run.
  - `--scenario trials --viewport both`: all checks passed (all nine floors, floor 2 through its room; desktop 352 s, mobile 356 s); after a last lite-tier edit `--floors 2` passed again on both viewports.
  - `--scenario roam --viewport both` and `--scenario tier --viewport both`: all checks passed (new: the board is solid; floor 2's room is built for each tier and draws fewer lines on the lite one).
  - Release build (`--release --site https://example.netlify.app`) then `--scenario room --dist --viewport both`: all checks passed, no CSP violation (full run before the last lite edit, floor 2 again after it); normal artifact rebuilt.
  - Screenshots (not tracked): `web/shots/room-2-desktop.png`, `web/shots/room-2-mobile.png`.
  - Not verified: a real phone, real screen-reader speech, frame rate on a real GPU, and `--scenario all` (the parent runs it at the end).
  - Contract for the next floors: a floor with a room needs `ROOMS[id]` (59-room-N-id.js, with `almost(s)` and `debug(s)` besides the usual fields), `ROOM_SETS[id]` (49-r3d-room-N-id.js, reading `world.room.v`, registering `rm-…` anchors, returning `{root, update, pose, solids, extra, info}` with `info().segments`), an `ELODM_KINDS` kind that draws no art, and one `ROOM_WALKS[id]` entry plus a `play…` function in `check.cjs`. A solved room's plate must offer `leer` and `otra-vez` acts (see the replay checks).
- Review of floor 2 (lineage review-73e9464b12bb043f, slice 19eb972..ce44cd7): the user granted the review and it was approved with 3 non-blocking suggestions: R3-001 (`normalize` of floor 2 untested with invalid input), R3-002 (the hint tiers of stages 1 and 2 unasserted) and R3-003 (the "ECHAR MÁS" surge sampled once at a fixed 500 ms). R3-003 is fixed in C3 (an `until()` poll for surge > 0.05). R3-002 is covered for floor 3 (every stage's ladder) and the floor 2 walkthrough still asserts stage 0 only; R3-001 is covered for floor 3 by corrupted saved states; neither is back-ported to floor 2.
- C3 done. **Generalization** (its own commit, d61b0df): a room hotspot may carry `on(room)` (hidden while false) and `tap(room)` (an action in place of a close look), and a definition may implement `onSolved(state)` (the state is final: the set shows it; `Room.solveNow` from the dev panel and the checks needs it). Floors 1 and 2 do not use them.
  **The room** (`49-r3d-room-3-el-lado-oscuro-del-mono.js`, `59-room-3-el-lado-oscuro-del-mono.js`): the cover is a relief board leaning back toward the visitor (as on floor 2), drawn in the cover's own pixels: the jagged fur and the angry eyes, the open mouth with its double lip, the gum, the throat stipple and the cheek strap, 19 teeth (relief blocks; gold fills 4 of them and silver the upper left ones, with glitter sprites), the pale tube and the graffiti tag with its loops and letters, two asterisk stars, the ink splatter, the drip from the lip, the scratches and flecks, and 11:11. Ambient motion until solved: the mouth trembles, the fur shivers, the tag grows and shrinks, the splatter shimmers with heat, the gold glints, the stars twinkle, the drip falls, the shards bob on the water. Interpretation note: like floor 2 it is a leaning board, not a flat plan at eye height; its footprint is solid. The puzzle follows the design: three signs (heat in the splatter, tension in the fur, the word in the tag) noticed in the clue's order (any other order loses what was noticed), a 5 s slow swallow (one tap starts, another or any other button interrupts) or TOCAR LA FIRMA (Callate: one more ✗ and one more shard, up to 8), 3 + breaks shards floating on the water to the sides, far from where one arrives (turn and walk; a hotspot each, a tap takes it), and ENCASTRAR UN PEDAZO in the mouth (the tooth turns gold with its crack kept). The last tooth calms the mouth and writes "perdón."; then the page and chapter 3, once. State `eldom.room.el-lado-oscuro-del-mono.v1` is `{v, stage, noticed[], swallowed, breaks, taken[], fixed, done, tries, hints}`; `normalize` keeps only a valid prefix (signs in the clue's order with no repeats; a breaks count in range; shards unique and in range; mended teeth never more than shards taken; done only with every tooth mended). Three hint tiers per stage (signs, swallow, shards and teeth); the counter starts again when the stage advances. The element is now `grito` ("El grito del mono") and `ELODM_KINDS.bar` draws no art. The 2D plate (`TRIALS['el-lado-oscuro-del-mono']`) stays as the fallback. Lite tier: 1298 segments instead of 1593, half the glitter, hair, stipple and heat sprites.
  Design deviation: none of substance. The set's targets are damped in the set (nothing animated through sequences) so a state change is never left half done; shards are visible from the start but can only be taken after the word is swallowed; a shard needs no close look (the tap takes it).
  - `check.cjs --syntax`: OK (10897 lines).
  - `--scenario room --viewport both` (floors 1, 2 and 3): all checks passed (desktop 329.5 s, mobile 332.6 s).
  - `--scenario trials --viewport both`: all checks passed (all nine floors, floor 3 through its room; desktop 382.5 s, mobile 386.2 s).
  - `--scenario roam --viewport both` and `--scenario tier --viewport both`: all checks passed (new: floor 3's board is solid, stopping the visitor 1.80 m from its centre; the tier check now loops over every room: floor 3 is built for each tier and draws fewer lines on the lite one, 1298 < 1593).
  - Release build (`--release --site https://example.netlify.app`) then `--scenario room --dist --viewport both`: no CSP violation; desktop passed (328.9 s). The first mobile run failed with the known floor 1 mobile-only 8 s click timeout (the cup/visor steps, as noted for C2); the mobile run alone, repeated on a fresh release build, passed (334.8 s). Normal artifact rebuilt.
  - Screenshots (not tracked): `web/shots/room-3-desktop.png`, `web/shots/room-3-mobile.png`.
  - Fixed in the shared checks (review R3-003): the floor 2 "ECHAR MÁS" assertion polls for the surge instead of one sample at 500 ms. The tier check and `ROOM_WALKS` gained `tierBuilt(set)` so a new room needs no edit of the loop.
  - Not verified: a real phone, real screen-reader speech, frame rate on a real GPU, and `--scenario all` (the parent runs it at the end).
  - Contract for the next floors (on top of C2's): a hotspot of a room may carry `on(room)` and `tap(room)`, a definition may carry `onSolved(state)`; `ROOM_WALKS[id]` also needs `tierBuilt(set)` (what the set reports in the tier check). A view is any name the set's `pose(view, a, free)` answers (a hotspot with `tap` needs none). Walking checks should use a turn-until-visible helper (`seeHot` in `playGrito`: hold Q in short steps) and `.hot:not([hidden])` locators, since hidden hotspots keep their DOM order. Targets in `world.room.v` may be damped by the set; the checks then read the target, so poll with `until()` when asserting an animated value. Replace a half-finished sequence with targets, not with a second tween on the same channel (`Seq.run('rmv')` cancels the one before).
- Review of floor 3 (lineage review-bef9a006ed3682a3, slice ce44cd7..2374212): the user granted the review and it was approved with 3 non-blocking suggestions. R3-001 (`onSolved` state lost on reload): `onSolved` now sets the signs and the swallow itself (4771e4b); reading the code shows `almost()` already did, so `solveNow` never reached the bad state and the bug was latent. R3-002 (the invalid-`breaks` branch of `normalize` unfixtured): covered by `playGrito` (three valid signs with 99, -1 and "x" breaks). R3-003 (break cap unasserted): covered (a planted 4-break state, touching the tag four times: 8 crossed teeth and 8 shards, further touches change nothing). A generic check in the `room` scenario also solves every room from fresh with the dev hook and reloads (floors 1 to 4).
- C4 done. **The room** (`49-r3d-room-4-que-carajo.js`, `49-r3d-room-4-que-carajo-hands.js`, `59-room-4-que-carajo.js`): the cover is a relief board leaning toward the visitor. The two hands are the photo's own strokes: a threshold of the photo, thinned to centre lines, simplified and stored as data (1143 strokes, about 1500 segments; class by thickness, one group per hand turning about its wrist), so fingers, thumbs, palm creases, wrist fur and outlines keep their real proportions and places. The three drops are drawn solid (outline plus chalk fill) with a falling copy each; "11:11", the paper's edge and a dent are drawn too. The cover has no gold or silver, so none is drawn (only small white glints on the drops). Ambient motion until solved: the hands breathe, the hair shimmers, the drops fall. In front, on the water, a backpack's drag marks fork five times (arrows on posts); the right turn lets the marks go on to something inherited drawn in chalk (bags, sneakers, sword, gnocchi, wines); the wrong one draws a curl. Puzzle: the left palm's line (five glints zigzag, announced: izquierda, derecha, derecha, izquierda, derecha) is the map; five forks; take each thing; both hands (MANO IZQUIERDA and MANO DERECHA; one alone or ARRASTRARLA only warns) close on it, lighting a pair of fingertips and leaning the hands in; with five held the drops slow, and QUEDARTE (6 s slow hold, one tap starts, another or any other button interrupts) solves it. State `eldom.room.que-carajo.v1` is `{v, stage, seen, forks, found, held, done, tries, hints}`; `normalize` keeps a count only while it fits the ones before it (found within held..held+1, forks within found..found+1; a bad one drops what follows; done only with five held). Element renamed `paloma` to `manos` ("Las dos manos"); `ELODM_KINDS.dove` draws no art; the 2D plate (`TRIALS['que-carajo']`, still with its dove) stays as the fallback. Lite tier: 2291 vs 2762 segments, thinner lines, a third of the hairlines.
  Design deviations: (1) the map is the palm's glints and the announced turns, not an overlaid line; the palm creases do not encode left and right. (2) Birds and the mate are in the text (chapter words), not drawn. (3) A wrong fork changes nothing (no penalty), so trial and error works at 1 in 2 per fork; each fork needs the previous thing held. (4) Posts, arrows and things on the water are added to the cover's drawing (the board itself is not changed). The trail sits at 0.8 m steps close to the visitor so that phones (narrow view, the player in the lower right) can reach every hotspot.
  Fidelity vs the cover (compared side by side): silhouettes, fingers, thumbs, creases and drop positions match; the cover's outlines are thicker bands and its fur is denser and bushier than the traced centre lines; the dark mid-tones of the fur are not drawn; the hands look a little thin on desktop and soft on phones.
  - `check.cjs --syntax`: OK.
  - `--scenario room --viewport both`: desktop all passed (547.9 s); mobile failed once at the known floor 1 click timeout (visor/cup steps), then the mobile run alone passed (549.0 s).
  - `--scenario trials --viewport both`: desktop all passed (414.5 s); mobile failed once at the same floor 1 timeout, then the mobile run alone passed (417.6 s).
  - `--scenario roam,tier --viewport both`: all passed (new: floor 4's board is solid; its room is built for each tier, fewer lines on the lite one).
  - Release build then `--scenario room --dist --viewport both`: all passed on both viewports, no CSP violation (desktop 545.9 s, mobile 546.8 s); normal artifact rebuilt.
  - Screenshots (not tracked): `web/shots/room-4-desktop.png`, `web/shots/room-4-mobile.png`, `web/shots/room-4-hands-desktop.png`.
  - Not verified: a real phone, real screen-reader speech, frame rate on a real GPU, `--scenario all`.
  - Contract notes for floors 8 and 9: a progress reset leaves the floor's challenge, so a check that resets progress must arrive again (reload) before solving. A hotspot that sits low on the floor is unreachable on a phone (the player covers the lower right, the view is narrow): put anything to tap between roughly 3.5 and 6 m ahead of the arrival spot and within about 1 m to each side, at chest height. Keep `ROOMS[id].aim.z` equal to the set's z. Traced data can live in its own `49-r3d-room-N-id-…` part (it sorts before the set). Check text that is shown in capitals is uppercase in the DOM: match with /i.
