# Feature: floor-autoplay-gallery — each world plays its song on arrival; the floor-10 plaque works from the worlds

## Objective
User 2026-10-25: (1) "cuando entre a cada piso se reproduzca automáticamente la canción como si fuese la música de
cada lugar, que el usuario no tenga que clickear en el cuadro"; (2) "el piso diez cuando clickeo al lado del ascensor
en los pisos no me está llevando, solo me lleva en planta baja".

## Why / problem
- Players start only with a tap on the official player: the original rule ("no usar autoplay", SPEC.md; "Never
  autoplay", DESIGN.md). The user now wants the song as the place's music.
- The "10 GALERÍA" plaque hangs on the elevator shell, so it shows beside the elevator in every world, but its hotspot
  is enabled only at the entrance (prelaunch / open): on the worlds a tap on it does nothing.

## Scope / constraints
- YouTube (Required Minimum Functionality, "Autoplay and scripted playbacks", checked 2026-10-25): autoplay through the
  `autoplay` player parameter is allowed; it must not start before the player is visible and more than half of it is
  in view; one autoplaying YouTube player per page. A world has exactly one player, shown when the visitor arrives.
  No `playVideo()`.
- Spotify: its official iframe controller starts playback with the `{ command: 'play' }` message (the same channel the
  page already uses for `pause`); sent once, after the embed says it is ready.
- Browsers allow sound only after a user gesture (the floor button, the platform choice) and with
  `allow="autoplay"` on the frame; iPhone keeps requiring a tap inside the player: there the play button stays.
- A site set to "SONIDO: NO" does not start the song on its own. "Mientras esperás" keeps starting with a tap (not
  asked).
- Floor 10 from a world: the plaque does what the panel's 10 does — back into the elevator, press 10, ride up — so
  leaving the gallery returns to the elevator.
- SPEC.md stays as the user's original words; DESIGN.md records the new decision. Branch `feat/floor-autoplay-gallery`
  from main 9c544fa. Route: inline (user declined subagents for this website). TDD not configured: harness scenarios.

## Tasks
- [x] F1 Autoplay on the worlds: PlayerPortal `o.autoplay` (YouTube `autoplay=1` + `allow` autoplay; Spotify `play`
      after `ready`), worlds pass `!Sound.muted`; DESIGN.md.
- [x] F2 Floor-10 plaque on the worlds: hotspot enabled on floors (not in a close-up), `returnToElevator(then)` →
      `pressGallery()`.
- [x] F3 Checks: scenario `autoplay` (real taps: platform, floor; the song plays without touching the player; muted
      site does not start it) and `gallery` from a world; regression; PR.

## Acceptance criteria
Arriving on a world with real taps, its song plays without a tap on the player (YouTube and Spotify, desktop and
Android-like phones); "SONIDO: NO" keeps it still; the plaque beside the elevator on a world takes the visitor to the
gallery and back to the elevator.

## Progress / evidence
- 2026-10-25: document created (3 tasks).
- F1 (inline): `o.autoplay` → YouTube `&autoplay=1` + `autoplay` in `allow`; Spotify `{command:'play'}` once after
  `ready`. Found and fixed on the way: `post()` sends JSON text (YouTube's protocol) but Spotify's embed reads objects
  — the play command (and the old Spotify `pause()`) was ignored. A standalone probe (a bare page, a real tap, the
  embed + `{command:'play'}`) showed the object form plays (position 0 → 7.4 s) with or without the controller's
  `load_complete_ack` / `utm_source=iframe-api`; new `postSpotify()`. Worlds pass `autoplay: !Sound.muted`.
  DESIGN.md records the decision (SPEC.md left as the user's original words).
- F2 (inline): the `gallery` hotspot is on in phase `floor` (not in a level close-up); `galleryFromFloor()` =
  `returnToElevator(() => pressGallery())` (`returnToElevator(then)` runs `then` after the cabin is reached), so the
  gallery's back button returns to the elevator.
- `autoplay` scenario (real tap on the floor button; the player is never touched): desktop and mobile — YouTube plays
  on arrival and keeps playing (189.0 → 192.1 s), Spotify too (0.0 → 2.1 s), SONIDO: NO stays still, the plaque on a
  world → ride → gallery ("← VOLVER AL ASCENSOR") → back to the cabin; landscape green. On a phone held upright the
  full-size player can cover the lower part of the plaque when standing close: the visible part is tappable (the test
  taps there, as a visitor would). YouTube's own autoplay did not start once in ~8 desktop runs (playerState −1): the
  play button stays and one tap starts it.
- Harness: floors that press play (integrations, mini, ytplay, spotify) now press only when the song did not start on
  its own (a tap on a playing player would pause it).

- F3: regression (`shots/regress-autoplay.log`, local): desktop and mobile — autoplay, integrations (floors 1–2, both
  platforms, real playback), mini, waiting, ytplay, spotify, smoke, tour, leads, level, roam, gallery, failures,
  selftest, floors, return, one, press, cabin — 19/19 each; landscape — autoplay, tour, level, roam, landscape, mini
  6/6; release build with its headers (`--dist`, mobile) — smoke, selftest, autoplay green, no CSP violation.

## Next step
PR; on a real iPhone the player still asks for a tap (browser rule).
