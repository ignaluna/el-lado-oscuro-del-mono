# Feature: free-movement — walk the worlds in first person (desktop + touch joystick + landscape)

## Objective
"Más pro" mobility: the visitor walks and looks freely through the song worlds, with mouse/keys on a computer and a
touch joystick on a phone, and the phone invites landscape for easier play.

## Why / problem
User 2026-10-06: improve player mobility and view control, "jugabilidad más pro", on mobile invite to lay the
phone sideways, a touch joystick so the player walks through the space. Levels will later be redesigned from
Luji's per-song cover drawings (content, not this task). Today floors allow ±0.3 m of walking and ±24° of look.

## Scope / constraints
- Worlds (floors) and gallery: free roam (360° look, walk, run, collisions, back into the elevator by walking).
- Entrance (prelaunch/open): keeps its cover-like framing; wider look/walk, walk into the open elevator.
- Cabin: stays a panel view; in short landscape a guided framing (selector, then the floor rows) + vertical look.
- Official players stay visible: on wide screens they dock compact (bottom-right) once the visitor moves; YouTube
  viewport never under 200 × 200 px (YouTube embed requirement).
- Existing interactions keep working (hotspots, level inspect views, gallery pieces, book, invitations).
- New copy is provisional (to confirm). Artifact in the scratchpad; repo untouched. Route: inline (user declined
  delegated writers for this Artifact). TDD not configured: harness scenarios.

## Tasks
- [x] V1 Roam core: look 360 (drag), walk/run (WASD/arrows, Q/E turn, Shift), bounds + colliders (elevator, level
      wall/stones, gallery corridor), footsteps with water ripples, walk into the elevator (lobby: enter; floor:
      return), Level inspect returns to where the visitor stood, resize keeps the position.
- [x] V2 Touch: floating joystick (left thumb) + look drag (right thumb), multi-touch, ghost hint; compact player
      dock after the first steps on wide screens.
- [x] V3 Landscape: invitation to rotate on floors/gallery (portrait, touch); landscape phone layout (compact player,
      actions); cabin guided framing in short landscape (drop the old "girá el teléfono" cabin note).
- [x] V4 Checks: harness `roam` (keys + simulated touch joystick, collisions, ripples/steps, elevator in/out,
      landscape) + regression on desktop, mobile, landscape; dist build.
- [x] V5 Publish + how to try + provisional copy.

## Acceptance criteria
Walk and look freely on floors and gallery with keys/mouse and with the touch joystick; cannot pass through the
wall/stones/elevator; walking into the open elevator enters/returns; landscape phone playable (cabin included);
all previous scenarios still green; no page errors.

## Progress / evidence
- 2026-10-06: document created (5 tasks).
- V1–V3 (route inline): `src/59-roam.js` (Roam: scene(), look(), tick() with walk 1.6 m/s, run 2.9 (Shift or
  joystick at the rim), Q/E/arrow turning, footsteps + water ripples, bounds per scene, colliders: elevator box,
  level wall OBB + stone circles via `R.levelSolids()`, doorway walk-in → enterCabin / returnToElevator;
  dockIfNeeded(); rotateInvite(). Joy: floating joystick, ghost ring "CAMINÁ"), Input with one entry per pointer
  (left-thumb joystick + right-thumb look at once), returnToElevator faces the elevator from any spot (fade when
  far), Level inspect returns to where the visitor stood, resize keeps the walked position, compact/slim corner
  player (YouTube never under 200 px: also fixed an older short-screen path that allowed 194 px), cabin lying down:
  selector view then floor rows (30 px) + "PLATAFORMA ▲ / PISOS ▼" switch; old "girá el teléfono" cabin note removed.
- Evidence so far: `roam` green desktop (W 2.6 m, Shift 3.1 m/s, drag 140°, E 65°, wall/stones/rim, elevator in/out)
  and mobile (joystick 7.5 m, two thumbs, hotspot tap still works); `landscape` green lying down (selector 138 px,
  rows 30 px, slim player 356×200 on screen, joystick) and upright (invitation shown once, "Seguir así").
- V4: full regression (24 scenarios) — desktop all green except the phone-only `landscape` scenario, which now
  skips non-touch screens; mobile 24/24 green; lying down: landscape, roam, tour, level green after two test fixes
  (thumb positions; the cabin switch) and one real fix: close-up views were framed under the corner player on a
  phone lying down (the latch was covered) — short screens now frame on the left. dist/ with its headers: roam +
  landscape green lying down (no CSP violations). Log: shots/regress-roam.log.
- V5: published v9 at https://claude.ai/artifact/5xCceHjVXcc1Rtcv9xq8EB; dist/ rebuilt.
- Provisional copy: "CAMINÁ", "ACOSTÁ EL TELÉFONO", "Se juega mejor así.", "SEGUIR ASÍ", "PLATAFORMA ▲", "PISOS ▼".

## Next step
User playtest on real phones (feel of speed and look sensitivity); per-song levels from Luji's drawings.
