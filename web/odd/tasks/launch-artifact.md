# Feature: launch-artifact — "El Lado Oscuro del Mono" launch experience (claude.ai Artifact prototype)

## Objective
One self-contained, executable prototype of the full launch web experience: prelaunch void + countdown + passenger
register + "listen while you wait", launch transition, first-person entry, platform selector, 9-floor panel with hand
press, travel, 9 floor scenes (floor 1 finished), official YouTube/Spotify players, return to the cabin.

## Why / problem
The band needs a shareable, runnable prototype of the whole journey before the real release, using "Pequeño Primate"
as demo content, with an architecture where swapping in the new album's tracks is config-only.

## Scope / constraints
- Deliverable lives OUTSIDE the repo: `scratchpad/artifact/index.html` (+ published claude.ai Artifact). No repo writes,
  no commits (the repo's branch `feat/ride-t9-articulated-elevator` holds unrelated user WIP).
- claude.ai CSP blocks third-party iframes → same file auto-degrades to official link-outs there; real embeds work when
  served from localhost/any host (verified). See `brief/DESIGN.md` §1.
- Spec: `brief/SPEC.md` (verbatim). Design: `brief/DESIGN.md`. Harness: `tools/check.cjs`.
- TDD: off — no test runner configured for this artifact (source: none in project/session config). Functional checks =
  harness scenarios (`smoke form listen launch enter cabin press floors return ytplay spotify csp fallback2d`).
- Planning heuristic ~400 authored lines/task is advisory only; a single-file artifact naturally exceeds it.

## Tasks
- [x] T0 Verify demo data — YouTube chapters (public description), Spotify track URIs (official embed data), embed
      postMessage protocols (probe on 127.0.0.1). Route: inline (verify). Evidence: `probe/embed-probe*.cjs` output, Engram #458.
- [x] T1 Foundation + exterior prelaunch + launch — config, copy, utils, storage, clock, sequencer, audio, lead/submitLead,
      PlayerPortal (embed + link modes), textures, Renderer3D base (InkMaterial, mirror water, post), exterior elevator,
      countdown, title/captions, register plate, listen flow, launch sequence, loading/errors, dev panel + `__eldom`,
      2D fallback (exterior). Route: delegated writer (trigger: non-mechanical single file with open design work; context).
      Checks: `--syntax`; scenarios smoke, form, listen, launch, csp (desktop + mobile).
- [x] T2 Entry + cabin + panel + selector + hand + travel — Route: delegated writer. Checks: enter, cabin, press.
- [x] T3 Floors 1–9 + floor players + return + 2D fallback completion + perf polish — Route: delegated writer.
      Checks: floors, return, ytplay, spotify, fallback2d.
- [x] T4 Verification + fixes + publish — full checklist from SPEC "Verificación", desktop 16:9 + phone portrait,
      manual YouTube play, Spotify embed, no overlapping audio, CSP link mode; publish Artifact. Route: inline verify,
      fixes inline when mechanical, delegated otherwise.

- [x] T6 QA iteration (user: "iteralo y testealo", no list given) — mobile-first pass with a real-taps `tour` scenario on
      six viewports. Route: inline (user declined delegation for this artifact). Patches `probe/patch-qa1..4.cjs`.
      Fixed: (1) BUG closing the book at the open entrance walked the visitor into the cabin (auto-enter fired on
      camera distance alone; now needs an actual step forward); (2) BUG official player ran past the bottom edge on a
      phone held sideways (block now always fits; `metrics().top`); (3) gallery on narrow screens: nearest pieces were
      out of view → guided walk (`Gallery.guided()`, aspect < 1.2: auto-focus first piece, ‹ ›, back = leave);
      (4) green/magenta fringes on every engraved line during travel → lens-like prism, weaker pulse per floor;
      (5) floor readout while riding (`#lift`); (6) panel: self-lit titles once a platform is chosen, buttons clear of
      the border, bigger dial, rows as full touch targets, readable refusal hint; (7) countdown unit names and
      subtitle readable in portrait; (8) thread floor crossed behind the docked player on phones; (9) small phones and
      tablets in portrait cut the plate (camera now steps back until every row shows); (10) short landscape: title no
      longer over the countdown, actions at the top, "GIRÁ EL TELÉFONO PARA ELEGIR PISO" in the cabin (rows are
      ~16 px there: not usable sideways); (11) dev chip is a thin edge tab on phones, hidden while a dialog is open;
      `SHOW_DEV_TOOLS = false` now hides only the chip (`#dev`, backquote, five taps bottom-left still open it).

## Acceptance criteria
Every item in SPEC "Alcance" and "Verificación" observed in harness screenshots/state logs; no page errors; no clipped
elements at 390×844 and 1600×900; blacks legible (grain on, facade readable); only official players, user-initiated.

## Progress / evidence
- 2026-09-28: T0 done. Chapters 0/189/408/609/852/1065/1227/1419/1606 s; Spotify URIs recorded in DESIGN §22.

- 2026-10-02: T1–T4 done. Route change: the delegated writer call was declined by the user, so the parent wrote the
  remaining parts inline on top of the partial base the interrupted writer had left (config, audio, lead, PlayerPortal,
  textures, shaders). Source now lives in `src/*.{html,js}`; `node tools/build.cjs` concatenates it into `artifact/index.html`.
- Evidence (harness, headless Edge, 1600×900 and 390×844): smoke, form (errors, success, duplicate → 1 stored lead), listen
  (YouTube + Spotify embeds, iframes=0 after close), launch, enter, cabin, press, floors 1–9, return (iframes=0, platform
  kept, visited marked), ytplay (manual click → playing:true, start=189), spotify (playing:true, preview:true), csp
  (frames blocked → mode "link" automatically), fallback2d. No page errors.
- Published: https://claude.ai/artifact/5xCceHjVXcc1Rtcv9xq8EB (v1). Inside claude.ai the players are official links
  (platform CSP); real embeds run with `node tools/check.cjs --serve`.
- Not verified: real phones/GPUs (only headless software WebGL), audio by ear, the published page inside claude.ai.

- 2026-10-02: T6 done, published as v7 (same URL). Evidence: real-taps `tour` green on mobile 390×844, small
  360×640, landscape 780×360, tablet 820×1180, laptop 1280×720, desktop 1600×900 (end state `phase:"open"`); full
  regression (18 scenarios) exit 0 on desktop and on mobile (`shots/regress-desktop.log`, `shots/regress-mobile.log`):
  ytplay `playing:true`, spotify `playing:true, preview:true`, iframes 0 after return; `csp` on mobile → link mode.
  Contact sheets `shots/sheet-qa*.png`. No page errors (console noise: favicon 404, YouTube ad fetch CORS).
- Still not verified: real phones/GPUs, audio by ear, the page inside claude.ai, native share sheet.
- Copy written by the assistant in T6, pending confirmation: "GIRÁ EL TELÉFONO PARA ELEGIR PISO".
- Open: the user's own list of things to improve (not given yet); whether to hide the DEV chip (it is the only way to
  see the post-release state before 2026-12-01, so it stays visible for now).

## Next step
User review of the published prototype; then swap the config to the new album's tracks and wire `LEAD_ENDPOINT`.
