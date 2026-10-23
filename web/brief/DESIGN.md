# DESIGN — "El Lado Oscuro del Mono" launch Artifact

Source of truth for HOW. `SPEC.md` (same folder) is the user's verbatim request (WHAT).
Where they disagree, this file wins only on the points it explicitly calls out.
UI copy is Spanish (Rioplatense voseo, exactly as given). Code, identifiers and comments are English.

Root folder (below: `ROOT`): `web/` in this repository (it started in a temporary scratchpad of the session that built it).

---------------------------------------------------------------------------------------------------

## 0. Deliverable

- ONE file: `ROOT/artifact/index.html`. It is published as a claude.ai Artifact, which wraps the file in its own
  `<!doctype html><html><head>…</head><body>` skeleton. So the file contains NO doctype/html/head/body tags:
  it starts with `<title>El Lado Oscuro del Mono</title>`, then the Google Fonts `<link>`, then one `<style>`,
  then the markup, then ONE `<script type="module">` with all logic. No build step. No other local files.
- The skeleton adds: charset + viewport meta (`viewport-fit=cover`), `:root{color-scheme:light; padding-top/bottom:
  env(safe-area-inset-*)}`, `body{margin:0;font:14px system-ui;background:off-white}`, `img{max-width:100%}`,
  `[hidden]{display:none!important}`. Our CSS must override: `:root{color-scheme:dark}`, `html,body{height:100%;
  background:var(--void);overflow:hidden}`. Keep the `:root` padding rule untouched; full-bleed layers use
  `position:fixed; inset:0` and UI bars add `env(safe-area-inset-*)` to their own padding. Toggle visibility with
  `el.hidden`.
- Local preview harness: `ROOT/tools/check.cjs` (already written, see §24). It wraps the file in the same skeleton.

## 1. Platform constraints (read carefully — they shape the players)

claude.ai Artifacts run under a strict CSP:
- Scripts ONLY from `https://cdn.jsdelivr.net/npm/`, `https://cdnjs.cloudflare.com`, `https://unpkg.com`.
  Styles only inline + `https://fonts.googleapis.com` (fonts from `https://fonts.gstatic.com`).
- NO fetch/XHR to other hosts, NO images/media from other hosts (use canvas/data: URIs), NO `alert/confirm/prompt`,
  `window.open` unreliable (use real `<a href target="_blank" rel="noopener">`), only plain `#token` hashes survive.
- **Third-party iframes are BLOCKED inside claude.ai** ("no YouTube, map or form iframes").

Therefore the SAME file must work in two hosts:
1. **Standalone host** (localhost, any static host, later the real site): official YouTube and Spotify embeds work.
   Verified 2026-09-28 on `http://127.0.0.1` in Edge: YouTube embed loads (no error 153), Spotify embed loads.
2. **claude.ai Artifact**: frames are refused by CSP → players automatically degrade to an in-scene "link mode"
   with official links (open YouTube at the chapter / open the Spotify track). Nothing else changes.

Detection (`EMBED_MODE = "auto"`): register at boot `document.addEventListener('securitypolicyviolation', …)`.
If a violation has `effectiveDirective`/`violatedDirective` starting with `frame-src`, `child-src` or `default-src`
and `blockedURI` contains `youtube` / `spotify` (or is empty for a frame directive) → set `embedsBlocked = true`
for the session and swap any open portal to link mode immediately. Later portals open directly in link mode.
Secondary heuristic: if the iframe fires no `load` and the provider sends no message within 7 s, show a small
hint row under the player ("¿No carga? ABRIR EN YOUTUBE ↗") without removing the iframe.
Config `EMBED_MODE: "auto" | "embed" | "link"`; dev control can force it.
Never probe with hidden iframes. Never load vendor API scripts (they are blocked in the Artifact anyway);
use the postMessage protocols in §12, verified empirically.

## 2. Art direction

Concept: an Art Deco elevator (1930s) stands alone on still black water in an infinite void — a surreal object,
drawn like a **scratchboard / steel engraving**: black masses, ivory linework, hatching whose line width follows
light, hard graphic shadows, film grain, slight ink wobble. The album title parodies "The Dark Side of the Moon";
the band's own cover uses a prism beam, so the **prism is the signature motif** — only as tiny, brief spectral glints.
It must feel like a living album cover, not a Three.js demo.

Lessons from this project's earlier iterations (the user rejected them):
- A pure-black void with grain removed looked dead. → Never pure `#000`. Grain ALWAYS on. Blacks have 3–4 readable steps.
- A procedural elevator from plain boxes was "unreadable". → Readability comes from silhouette + ivory engraved
  detail + a lit facade + rim light, not from geometry count. The facade must be the brightest large surface.

Palette (CSS tokens and GLSL constants):
- `--void #070708` background / fog target (never darker)
- `--ink #0d0d10` surfaces in shadow
- `--charcoal #1b1b20` body surfaces
- `--graphite #34343b`
- `--metal #7e7d82` metallic mid-tone
- `--ivory #ebe5d5` lines, type, light
- `--ivory-dim #b9b2a1`
- `--error #e3a07a` (muted amber for form errors, readable on void)
- prism spectrum (glints only, low alpha): `#ff5a4e #ff9442 #ffd24a #5fe07a #45d9cf #5aa8ff #8c82ff`
- per-floor accents come from config (§22), all muted (no neon).

Value targets (exterior frame): mean luma ≈ 0.07–0.13; void 0.03; water 0.04–0.07; elevator body 0.08–0.14;
engraved facade lines 0.55–0.80 where lit; countdown numerals 0.9. Something ivory must always anchor the frame.

Typography (Google Fonts, one `<link>`):
`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Marcellus+SC&display=swap`
- **Bodoni Moda** — display: album title, countdown numerals (lining), song titles, italic sublines. Large sizes only.
- **Marcellus SC** — inscriptions on plates/panel/buttons, captions (engraved-brass feel), letter-spaced .18–.42em.
- **Courier Prime** — the passenger register (form inputs, helper/errors), dev panel. Inputs ≥16px (iOS zoom).
- Fallbacks: `"Bodoni Moda", "Bodoni 72", Didot, Georgia, serif`; `"Marcellus SC", "Trajan Pro", Georgia, serif`;
  `"Courier Prime", "Courier New", ui-monospace, monospace`.
- Canvas text: `await document.fonts.load('400 64px "Bodoni Moda"')` etc. (3 s timeout) before drawing textures;
  redraw textures once if fonts arrive late.

Motion principles: anticipation, ease-in/out, overlapping action, holds, secondary motion, nothing at constant
speed. Idle loops slow and hypnotic (breathing ≈ 0.18 Hz, water ≈ 0.05 Hz). Every sequence must be cancellable.

## 3. World layout (meters, Y up, water plane y = 0)

- Elevator group at origin, doors facing **+Z**. Exterior viewer spawns at +Z looking toward −Z.
- Outer cabin: width 2.8 (x −1.4..1.4), depth 2.5 (z −2.5..0), plinth y 0..0.25, cabin y 0.25..3.2,
  Deco crown above the doors up to y ≈ 3.75. Front wall thickness 0.25 (z −0.25..0).
- Door opening: 1.2 wide (x −0.6..0.6), y 0.25..2.5. Two sliding panels 0.6 each, center-opening into wall pockets.
- Interior: x −1.2..1.2, z −2.25..−0.25, floor y 0.25, ceiling y 2.75.
- From INSIDE facing the doors (+Z), "right" is world −X. The interior panel is on the right of the door as seen
  from inside: plate centered at x −0.92, y 1.36, on the inner face of the front wall (z −0.26), normal −Z.
- Exterior call panel: on the right pilaster as seen from outside (world +X ≈ 1.0), y ≈ 1.25, z +0.02.
- Floor scenes live in front of the elevator (+Z, z 4..30). The elevator stays in place; environments swap around it.

Camera shots (vertical FOV; derive sizes from desired screen fractions, don't hardcode per device):
- `spawn` (exterior): pos (0, 1.55, 10.5) → target (0, 2.05, 0), vFOV 44 landscape. Portrait: widen vFOV (≈60) and/or
  move back so the whole elevator + countdown fit with ≥16px side margins. Rule: elevator (plinth→crown) spans
  ≈40–48% of viewport height; nothing important clipped at any aspect from 0.45 to 2.4.
- Exterior walk zone prelaunch: x ±1.4, z 9.2..11.6. After launch: corridor x ±1.0 from z 11.6 to 2.4; crossing
  z < 3.0 hands over to the scripted entry (§7).
- `form` shot: dolly to ≈(1.3, 1.45, 6.2) looking at the call panel; world exposure −20%.
- `cabin-panel` shot: standing at ≈(−0.25, 1.62, −1.55); look at the panel. Landscape: panel ≥ 24% of width and the
  full door visible on its left. Portrait: panel fills ≈ 85–92% of the viewport width (step 0.3 m closer, vFOV ≈ 58).
- `cabin-doors` shot: same standing spot, look at (0, 1.35, −0.25) framing the whole door (used for close/travel/open).
- `floor-arrival`: after stepping out, (0, 1.6, 2.6) looking toward +Z.

## 4. Rendering architecture

- Feature-detect WebGL (`canvas.getContext('webgl2') || getContext('webgl')`) BEFORE importing three. No WebGL → 2D.
- three.js r160 via dynamic import with timeout 9 s and fallback URL:
  `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js`, then
  `https://unpkg.com/three@0.160.0/build/three.module.min.js`. Failure → 2D fallback (§18). No addons.
- Renderer: `antialias: true`, `powerPreference: 'high-performance'`, output sRGB, clear color `--void`.
  DPR cap: `min(devicePixelRatio, 1.5)` fine pointer, `min(devicePixelRatio, 1.25)` coarse pointer; adaptive (§17).
- Frame: (1) mirror pass for water reflection into a half-res target; (2) scene into a render target;
  (3) one fullscreen post pass to screen.

### 4.1 InkMaterial (one ShaderMaterial family for all solid objects)
Uniforms (per material): `uBase` (albedo), `uLineColor` (ivory), `uMap` (optional line mask texture, R = line),
`uMapStrength`, `uEngrave` (0..1), `uEngraveFreq`, `uEngraveAxis` (0 = along U, 1 = along V), `uWobble`,
`uEmissive`, `uRim`, `uHeightFade` (y0, y1 — fade to void above), plus shared lighting uniforms
(key dir/color, ambient, up to 4 point lights with color+range, void color, fog near/far, time).
Fragment recipe:
1. Light L = ambient + key·max(n·l,0) + Σ point lights (smooth falloff). lum = luminance(L).
2. Graphic shadows: 3 soft bands (≈0.14 / 0.45 / 0.78) instead of smooth shading.
3. Engraving: `coord = (axis ? vUv.y : vUv.x) * uEngraveFreq + wobble·noise(vUv·6)`; line width w = clamp(lum·1.1);
   `f = abs(fract(coord)-0.5)*2`, `aa = fwidth(coord)*1.5`, `line = smoothstep(1-w-aa, 1-w+aa, f)`;
   fade to flat tone `w*0.5` as `aa` grows (distance). Cylinders get cross-contour rings (lines ⟂ the axis).
4. Detail map: `mapMask * smoothstep(0.02, 0.3, lum)` — engraved textures appear only where light reaches.
5. `col = uBase*(0.3+bands)`; `col = mix(col, uLineColor*(0.35+0.65*lum), max(line*uEngrave, detail))`.
6. Rim: `pow(1-max(dot(n,v),0), 3) * uRim` in ivory/cool grey on the lit side → silhouettes read against the void.
7. `+ uEmissive`; wear: multiply by `0.85+0.15*noise(vUv*40)`; fog + height fade to `--void` (no horizon).

### 4.2 Water (custom mirror)
- Implement a small mirror renderer (port of three's `Reflector` logic: reflected virtual camera, oblique clip plane,
  `textureMatrix`). Half resolution. Use layers so the hand, hotspot helpers and particles are NOT reflected.
  Skip the mirror pass when the camera is inside the cabin with doors closed.
- Water plane radius 80. Fragment: reflection sampled with distortion from (a) faint slow noise normals,
  (b) up to 6 ripple rings `vec4(x, z, t0, amp)` (launch wave, footsteps, arrival, floor rhythms).
  Reflection is dark (×0.5) and **incomplete**: multiplied by a horizontally-stretched noise streak mask and faded
  with distance. Engraved water lines: horizontal lines along world Z (spacing ≈0.45 m near), AA-faded with distance,
  brightness 0.04–0.09, brighter near light sources and on ripple crests (the launch wave reads as ivory rings).
  Sparse twinkling glints on a hashed world grid; ~15% of them prismatic. Fog to void so there is no horizon line.
  Floors tint reflection + lines with the floor accent (`uAccent`, subtle).

### 4.3 Post pass
Grain (animated; stronger in darks; amplitude ≈0.045; never disabled), uneven ink vignette, black lift (never below
`--void`), faint flicker (±1.2%), ink wobble (UV noise ≈0.6 px), rare dust specks / vertical scratch (≤3% opacity).
Travel uniforms: `uSpeed` → vertical smear (5 taps) + grain ×1.6 + wobble ×3; `uPrism` → radial chromatic split
(max ≈2.5 px) and a spectral band sweep masked by bright pixels (the "reflejos prismáticos muy breves").
Reduced motion: no wobble/flicker/scratches/smear; grain updated at 8 fps.

### 4.4 Text in the world
`makeTextPlane(draw, pxW, pxH, worldH)` → CanvasTexture (mipmaps, max anisotropy), additive ivory, soft glow drawn
into the canvas (blurred pass + sharp pass). Used for: countdown, subtitle, "Tu piso quedó reservado.",
"LAS PUERTAS ESTÁN ABIERTAS", floor titles, panel engravings. Planes are reflected by the water.

### 4.5 Hotspots (DOM over 3D)
Every interactive 3D object gets a real `<button>` in `#hotspots`, positioned each frame over the object's projected
bounds (transform only), transparent, with `:focus-visible` ivory ring, `aria-label`, pointer cursor. Clicks, taps and
keyboard all go through these buttons (no raycasting needed). Hide hotspots whose object is off-screen or occluded by
phase. Minimum hit size 44×44 CSS px (grow the button, not the visual).

## 5. Exterior

### 5.1 Elevator (spend effort here; readability first)
- Plinth: two stepped tiers (3.4 × 0.12 × 3.0 and 3.1 × 0.13 × 2.8), engraved horizontal lines. Anchors the reflection.
- Cabin shell: charcoal; side walls with vertical panel seams and rivet rows (texture), darker than the facade.
- Facade (canvas textures, 2048-class, ivory lines on transparent, applied through `uMap`):
  - Pilasters left/right (0.42 wide) with 7 vertical flutes and stepped Deco capitals.
  - Stepped door surround (3 receding steps, each edge an ivory hairline).
  - Door panels: Art Deco sunburst (rays from the bottom of the seam), chevrons, thin border, dense-line kick plates.
    Seam = 3 mm dark gap. Interior faces: brushed vertical lines.
  - Crown (ziggurat silhouette rising above the roof): semicircular floor dial (r ≈ 0.42) with `PB 1 2 3 4 5 6 7 8 9`
    around the arc (Marcellus SC), a lozenge needle pivoting at the arc's base, a small fan ornament above.
    Prelaunch the needle rests beyond 9 and "hunts" slightly (tiny jitter every few seconds): the elevator is far away.
  - Call panel on the right pilaster: plate 0.16 × 0.34, round call button Ø0.07 with ivory ring, engraved "LLAMAR".
    Breathing pulse (0.5 Hz) until the visitor registers; afterwards steady light ("called").
- Roof: pulley housing; 4 cables rising to y ≈ 40, thin ivory lines at ~25% fading upward into the void.
- Lighting (exterior): key from the viewer's upper-left `normalize(-0.35, 0.8, 0.5)`, ivory ×0.9; ambient 0.06;
  cool rim; a faint soft light pool decal on the water in front of the plinth; the countdown adds a dim ivory point
  light above the crown. Top of the cabin/crown fades into the void (`uHeightFade` ≈ 3.4..5.2) — it "emerges".
- A handful (≤ 60) of dim dust motes only within ~3 m of light sources (never a starfield).

### 5.2 Title (printed layer, DOM)
Top center, safe-area aware: "MONOS DEL AMBIENTE" (Marcellus SC 11px, .42em, 55%) above
"EL LADO OSCURO DEL MONO" (Bodoni Moda 500, `clamp(17px, 3vw, 40px)`, .22em, ivory) with worn-ink texture
(`background-clip:text` over a runtime noise data-URI). Must fit one line at 360px wide. Hidden inside the cabin.

### 5.3 Countdown (in the world)
- Suspended above the crown (landscape) — the "arrival indicator" of an elevator that hasn't come yet. In portrait,
  move the plane toward the camera so numerals stay large. Targets: numerals ≥ 9% of viewport height (landscape),
  ≥ 5.5% (portrait); plane width ≤ 88% of viewport width.
- Layout: 4 groups DD · HH · MM · SS, Bodoni Moda lining numerals, unit labels under each (`DÍAS HORAS MIN SEG`,
  Marcellus SC small), thin Deco separators. Landscape = one row; aspect < 0.8 = 2×2 grid. Days ≥ 100 → 3 digits.
- Subtitle under it (same plane or sibling): "El ascensor todavía no llegó." (Bodoni Moda italic).
- On each change, the changed digits "ignite" like nixie tubes (220 ms crossfade, brief overexposure).
- Last 10 s: DD/HH/MM dim to 30%, SS grows ×1.5 and pulses per tick, tiny water tremor per tick, soft tick sound.
- Hidden live region (`role="timer"`, `aria-live="polite"`) updated once per minute: "Faltan 64 días, 3 horas y 12 minutos."

### 5.4 Calls to action (DOM captions, printed-credit style — never generic buttons)
Bottom center, stacked, safe-area aware:
- Primary: "AVISAME CUANDO SE ABRAN LAS PUERTAS" — Marcellus SC ~14px, .24em, thin rules on both sides that extend on
  hover/focus. Opens the register (same as clicking the call button in the world).
- Secondary: "MIENTRAS ESPERÁS: PEQUEÑO PRIMATE" — smaller, 65% ivory.
- After registration the primary becomes a non-button line "TU PISO QUEDÓ RESERVADO" (+ call button stays lit).
- Top-right: sound toggle "SONIDO: SÍ / NO" (Marcellus SC 11px, `aria-pressed`).

### 5.5 Passenger register (form as a scene object)
Clicking the call button (or the primary caption) → camera dollies to the `form` shot (1.4 s, easeInOutSine), and a
DOM "plate" unfolds from the call button's projected position (clip-path/scale from that origin, 600 ms).
Desktop: right side, width min(420px, 38vw), slight perspective `rotateY(-6deg)` as if mounted on the pilaster.
Mobile: bottom plate, full width minus 16px gutters, max-height 78vh, internal scroll, scene visible above.
Look: dark engraved metal (runtime noise texture + fine vertical brushing), double hairline border (ivory 35% / 15%),
four small screw heads in the corners, text engraved (subtle 1px shadow/highlight). No rounded card, no drop shadow.
Content and behavior: §14. Escape / "CERRAR" folds it back and returns the camera.

### 5.6 Listening while waiting
Secondary caption → in-scene question "¿DÓNDE QUERÉS ESCUCHAR?" with two brass tokens (Ø ≈ 96px circles, engraved
"YOUTUBE" / "SPOTIFY") → portal (§12) with the album (`start=0` on YouTube; album embed on Spotify).
Desktop: portal on the left (≈5vw from the edge, width min(36vw, 620px)) so the elevator stays visible;
mobile: portal in the lower half (full width − 32px), camera pitches up so the elevator sits in the upper half.
World exposure −15%, countdown dimmed but alive. "CERRAR" returns to the countdown and fully unloads the player.
Never autoplay.

## 6. Launch sequence (countdown reaches 0 while the page is open, or dev "Últimos 10 s")
T = 0 at zero. No reload. Cancellable.
- 0.0–0.8 numerals flicker off (3 flickers), subtitle fades.
- 0.6–5.5 water: slow ring wave from the plinth (speed ≈1.4 m/s, λ ≈1.2 m), second weaker ring at 1.6 s.
- 1.0–2.4 an ivory light line traces the door surround from bottom center up both sides, meets at the top, then the
  door seam lights. Dial needle sweeps 9 → PB with a small overshoot and settle (the elevator arrives).
- 2.0–4.0 vibration: camera micro-shake (≤0.004 rad, noise ~11 Hz, envelope), elevator jitter 2 mm, water micro-tremor,
  low rumble (only if audio unlocked; otherwise visual only).
- 4.0 ding (if audio). Seam flares.
- 4.2–8.7 doors open slowly (4.5 s; hesitate the first 3% for 0.4 s, then easeInOutSine). Interior light (warm ivory)
  spills: a light trapezoid grows on the water toward the viewer; dust motes appear in the light.
- 6.0–7.5 "LAS PUERTAS ESTÁN ABIERTAS" appears in the world where the countdown was (Marcellus SC, letters ink in).
- 8.0 caption "ENTRAR AL ASCENSOR" appears; walk zone expands; elevator hotspot enabled.
Visiting after release (page loaded after RELEASE_AT, or dev "Publicado"): short version — 1.2 s after load the line
traces the frame, doors open in 2.8 s, message appears. Same end state (`open`).

## 7. Entering (walk or tap)
Tap/click the elevator or "ENTRAR AL ASCENSOR", or walk forward past z 3.0 → scripted path (≈5.5 s, cancellable):
walk to (0, 1.6, 1.4) with subtle head bob (≈1.8 Hz) and a small ripple under each step; pass through the door frame
(it slides around the camera — this is the physical entry); step up 0.25 onto the cabin floor; reach the standing spot;
turn 180° in the last 1.6 s (easeInOutCubic) to face the doors; settle into `cabin-panel`. Title layer fades out.

## 8. Cabin interior
- Walls: dark lacquered wood (`#17140f`), vertical grain engraving; brass handrail (cross-contour rings) on side/back
  walls at y 0.95. Ceiling: coffered, round frosted lamp (emissive + glow), warm point light (1.0, 0.92, 0.8), range ≈3.5 m,
  rare subtle flicker. Floor: dark tiles, diamond inlay hairlines (15%), soft light pool under the lamp.
- Door inner faces: brushed metal lines. Left inner segment (world +X): three enamel signs (Marcellus SC, ivory on
  black, tiny screws): "CAPACIDAD MÁX.: 5 MONOS", "PROHIBIDO DAR DE COMER A LOS MÚSICOS", "ÚLTIMA INSPECCIÓN: NUNCA".
- **Panel** (plate 0.58 × 1.32, dark brass `#2a2418` with ivory engraving), top → bottom:
  1. Mini arched floor dial (PB, 1–9) with needle + ▲▼ lamps — the interior "indicador del piso".
  2. Engraved "¿POR DÓNDE QUERÉS VIAJAR?".
  3. Two square illuminated push buttons side by side, engraved labels "YOUTUBE" / "SPOTIFY" below, each with a tiny
     pilot lamp (YouTube muted red `#c4533f`, Spotify muted green `#5c9e6c`, both dim until latched).
     Radio behavior: pressing one sinks it (6 mm) and lights it (ivory cap glow + pilot lamp), the other pops back out
     but stays available. Stored in `sessionStorage` (the visit). Changing platform later is allowed any time.
  4. Hairline divider + small "PISOS".
  5. Nine rows, 9 at the top … 1 at the bottom: round button Ø0.058 (cylinder in a torus bezel; numeral on the cap),
     title engraved to its right (Marcellus SC; long titles wrap to 2 lines), visited mark at the far right.
     States: disabled (no platform yet: dim numerals, dark rings); enabled (faint ivory ring); hover/focus (ring and
     title brighten; the idle hand lifts slightly — anticipation); pressed (sinks 5 mm, glows in the track accent);
     visited (small ✦ lit, title brighter, ring faintly tinted with the accent); current floor (steady ring light).
     If a floor is pressed before choosing a platform: the question and both selector buttons pulse twice, a short
     buzz sound, and the live region says "Elegí primero por dónde viajar." No travel.
  6. Bottom engraving: "MONOS DEL AMBIENTE · EL LADO OSCURO DEL MONO".
- Keyboard: 1–9 press floors, Y / S choose platform (plus Tab through hotspots, Enter/Space activate).

## 9. Hand (the most delicate piece — poses and timing sell it)
Right forearm + hand parented to the camera, built from primitives (capsules/rounded boxes) with InkMaterial
(cross-contour engraving + rim). Dark coat sleeve covers the forearm with an ivory cuff line; the far end of the
forearm always extends off-screen (anchor ≈ camera-local (0.34, −0.46, 0.08)).
Skeleton: palm (rounded box ≈ 0.085 × 0.024 × 0.09), index / middle / ring / pinky with 3 phalanges each
(proportions ≈ 0.045/0.028/0.022 m for the index), thumb with 3 segments. Each joint = a Group with a rotation.
Poses (per-joint curl radians): RELAXED (≈0.35 each, thumb relaxed); POINT (index 0.05/0.05/0.08; middle/ring/pinky
≈1.2/1.35/1.05 curled; thumb tucked over the middle finger); PRESS = POINT with the distal index joint 0.14.
Idle: low at the bottom-right, mostly out of frame (knuckles visible), breathing with the camera, slow micro-motion.
Hovering a floor (desktop): hand rises ~3 cm, index starts to extend.
Press timeline (≈1.35 s):
- 0.00–0.18 anticipation: wrist pulls back 2 cm and down, fingers go to POINT.
- 0.18–0.68 reach along a slight arc (easeOutCubic) until the fingertip is 1.5 cm in front of the button.
- 0.68–0.80 contact: fingertip travels 1 cm in, the button sinks with it, click sound, accent light on.
- 0.80–0.95 hold.
- 0.95–1.35 retract (easeInOutCubic); fingers relax 0.2 s later (overlapping action).
Orientation: palm down, slight roll (≈ −18°), index aimed at the target; approach from lower-right so the fingertip
does not hide its own button. Same gesture for the platform buttons. In portrait keep the idle hand low enough
never to cover the panel. Reduced motion: shorter reach (0.35 s), no anticipation, no idle micro-motion.

## 10. Travel (after the press)
d = |target − current| (lobby = 0). All phases cancellable; audio only if unlocked.
- 0.0–0.3 hold; pressed button glows with the accent.
- 0.3–1.0 head turns from `cabin-panel` to `cabin-doors`.
- 0.4–2.1 doors close (easeInOutSine, last 10% slow), thunk + micro-shake on contact.
- 2.1–2.6 pause; hum rises; ▲ or ▼ lamp lights.
- 2.6 → 2.6+T travel, T = min(6.2, 2.8 + 0.35·d). Speed profile: smooth accel (0.9 s) → cruise → decel (1.1 s).
  Needle follows the integrated position. Cabin vibration ∝ |acceleration| + light constant hum jitter.
  Light bands slide across the door seam and door edges (direction depends on up/down) at a speed ∝ velocity.
  Post: `uSpeed` ∝ velocity (smear, grain, wobble). One brief prismatic flash (`uPrism` pulse ≈180 ms) each time a
  floor is passed; the last one on arrival.
- Arrival: settle with a 1 cm bounce, 0.6 s hold, two-tone ding, arrow lamp off. The floor scene is built during travel.
- Doors open (1.8 s) onto the floor; step out (≈2 s) with a small bob and a ripple, stop at `floor-arrival`;
  then the portal appears (§12). Phase `floor`.
Reduced motion: no shake/smear; travel T ×0.6; head turn replaced by a 250 ms cross-fade cut.

## 11. Floors
One data-driven system. `buildFloor(track)` returns `{ group, update(dt, t, playing), portalAnchor, dispose() }`.
Common pieces: water tinted with the accent; in-world title (Bodoni Moda italic, large) + small
"PISO n · m:ss" (Marcellus SC; duration from config); particles (≤ 600, one Points object, custom shader);
ripple rhythm; one light source for the scene; the portal anchor (where the player sits); `update(…, playing)`
reacts when the player reports playing (brighter light, faster particles, quicker ripples). Leaving a floor disposes
geometry, materials and textures. Only the current floor exists in memory.

Portal placement is DOM-first: CSS rules decide the player rect (usable size guaranteed), then the floor composition is
fitted around it by unprojecting that rect at the anchor depth (e.g. the halo ring is scaled/positioned to circumscribe
it). While a player is visible, camera look is locked (breathing ≤ 0.1°) so world and DOM stay aligned; the scene keeps
moving (particles, light, ripples) so it never feels frozen.

**Floor 1 — Tan Buena (fully finished; highest quality)** accent `#ded8c8`:
A monumental thin ivory ring (torus, tube ≈0.03 m) stands on the water ahead; with its reflection it forms a vertical
figure-eight. The player sits inside the ring. A second, larger faint ring (25%) behind it turns slowly (period ≈90 s),
reading as a changing ellipse. 300 ivory motes rise slowly (0.05 m/s) and sway; ~3% glint prismatic. Concentric
ripples leave the ring's base every 5 s (2.5 s while playing). Title "Tan Buena" floats above the ring; "PISO 1 · 3:12"
small beside it. The ring is the light source (warm ivory point light), so nearby water lines glow. While playing:
ring brightness ×1.25, a thin prismatic shimmer travels around the ring (period 6 s), motes rise ×2.

**Floors 2–9 — light variations** (same system, different `kind` generator; keep each ≈40–90 lines):
| floor | title | kind | accent | composition / particles / rhythm |
|---|---|---|---|---|
| 2 | Amor Libre | `flock` | `#d6a3a0` | portal center-left; an open wire birdcage (empty, door open) floating right; 30–40 ink birds (V strokes) circling wide and slow; feathers drifting down; airy rhythm |
| 3 | Ni un WhatsApp | `chat` | `#9db8ad` | portal center; outlined speech bubbles at several depths with "…" typing dots that never resolve; grey double-check marks; sporadic rhythm |
| 4 | Te Necesito | `thread` | `#c0645a` | portal center; one thin red thread crossing the whole void behind the portal with a gentle sag/wave; two tiny lanterns at the far ends; slow embers; lonely, wide |
| 5 | Cebadora de Mates Internacional | `mate` | `#b9b071` | portal left; giant mate gourd (LatheGeometry) with a metal bombilla on the right, steam wisps rising; an engraved globe of latitude/longitude rings turning far behind |
| 6 | Estás Acá | `pin` | `#d9a45e` | portal center; a giant map pin standing on the water to the right with an engraved plate "ESTÁS ACÁ"; contour rings + faint grid on the water around it |
| 7 | Coca y Fernet | `glass` | `#a8744f` | portal right; giant glass (Lathe, engraved outline) with dark liquid on the left; ice cubes floating in the void; fizz bubbles rising from the water; effervescent rhythm |
| 8 | La Frase Mágica | `letters` | `#a79bd8` | portal center; Bodoni letters (from the title) orbiting in a loose ring around the portal, forming/unforming; more frequent prismatic sparkles |
| 9 | Yo No Hago Música | `staff` | `#86a3bd` | portal center-low; five staff lines spanning the void behind with no notes; now and then one note falls and splashes (ripple); a silent gramophone horn standing on the water left |

"VOLVER AL ASCENSOR" (§13) is always present on floors.

## 12. Players (shared `PlayerPortal` component: listen-while-waiting AND floors)
DOM structure: `.portal` → label row above the frame (provider name, Marcellus SC 11px) → `.portal-frame` (double
hairline border + small Deco corner brackets drawn OUTSIDE the iframe area via padding; nothing overlaps the iframe)
→ iframe → links row below ("ABRIR EN YOUTUBE ↗" / "ABRIR EN SPOTIFY ↗"; Spotify preview emphasis, see below).
Z-order: the portal is the top-most layer; no grain/overlay/hotspot/caption may overlap the iframe rect.
A 3D "light wall" glow sits behind the portal (camera-aligned plane at the portal's unprojected rect) so the water
reflects it. Sizes: YouTube 16:9, width min(58vw, 880px) on floors, min(36vw, 620px) listening on desktop,
100vw − 32px on phones; never smaller than 320×180. Spotify width same; height 352 when viewport height ≥ 720,
else 232. Only one portal can exist; opening a new one fully destroys the previous one first.

YouTube (official embed, no API script):
- `src = https://www.youtube.com/embed/${videoId}?start=${s}&enablejsapi=1&playsinline=1&rel=0` + `&origin=${location.origin}`
  only when `location.origin` starts with `http`. Attributes: `title`, `allow="accelerometer; clipboard-write;
  encrypted-media; gyroscope; picture-in-picture; web-share"` (no autoplay), `allowfullscreen`,
  `referrerpolicy="strict-origin-when-cross-origin"`.
- Bridge (verified): after `load`, post `JSON.stringify({event:'listening', id:1, channel:'widget'})` to
  `https://www.youtube.com` every 250 ms until an `initialDelivery`/`onReady` arrives (max 40 tries). Accept messages
  only from `https://www.youtube.com` / `https://www.youtube-nocookie.com` AND `event.source === iframe.contentWindow`.
  State from `onStateChange.info` or `infoDelivery.info.playerState` (1 = playing, 2 = paused, 0 = ended, 3 = buffering).
  `onError.info` → show a row under the player: "Este video no se pudo cargar acá." + link.
- NEVER call `playVideo`, never autoplay, never mute. Stop = post
  `{event:'command', func:'pauseVideo', args:[], id:1, channel:'widget'}`, then remove the iframe on the next frame.
- Link: `https://www.youtube.com/watch?v=${videoId}&t=${s}s`.

Spotify (official embed, no API script):
- `src = https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0` when `spotifyTrackUri` is set
  (`spotify:track:ID`), else `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`.
  Attribute exactly: `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"`, `title`.
- Listener (verified): from `https://open.spotify.com` and the iframe's window: `{type:'ready'}`,
  `{type:'playback_update', payload:{isPaused,isBuffering,duration,position,playingURI}}`, `{type:'playback_started'}`.
  playing = `!isPaused && !isBuffering`. Preview detection: `duration > 0 && duration < 35000` while the configured
  track is longer than 60 s → reveal "Estás escuchando una muestra." + prominent "CONTINUAR EN SPOTIFY ↗".
  Logged-out visitors get previews (verified: ~21.8 s, "Muestra" badge). Never try to bypass login.
- Stop = post `{command:'pause'}` (targetOrigin `https://open.spotify.com`; harmless if ignored), then remove iframe.
- Links: track `https://open.spotify.com/track/${id}`, album `https://open.spotify.com/album/${albumId}` ("Abrir el álbum").

Lifecycle (both): one `message` listener per portal, removed on destroy; timers cleared; `playing` flag reset;
destroy on: close, return to elevator, travel start, dev jumps. Page hide: never destroy; YouTube pauses (its rules allow
no background player), Spotify goes on.
Ambient/SFX audio is fully faded out while a portal exists (no overlapping audio).

Link mode (embeds blocked): the same frame and size, but inside: provider name (Marcellus SC), "Pequeño Primate" or the
track title (Bodoni Moda italic), for YouTube "desde 03:09", a large engraved link "ESCUCHAR EN YOUTUBE ↗" /
"ESCUCHAR EN SPOTIFY ↗", and "Se abre en una pestaña nueva." No technical wording anywhere.

## 13. Return to the elevator
Floor caption bottom-left "← VOLVER AL ASCENSOR" (Marcellus SC, printed style; safe-area aware; never overlapping the
portal) + hotspot on the open elevator behind (visible if the user turns around) + Escape.
Sequence: stop & destroy the player → turn around (1.1 s) → walk back into the cabin (2.2 s) → face doors/panel →
doors close (1.6 s) → dispose the floor scene once doors are closed → `cabin-panel` shot. Platform stays latched,
visited floors marked (sessionStorage `eldom.visited`), current floor lit. Ready for another floor.

## 14. Lead form ("REGISTRO DE PASAJEROS")
Fields (stable ids): `lead-name` (optional, max 80), `lead-whatsapp` (`type=tel`, `autocomplete=tel`, placeholder
"+598 99 123 456"), `lead-email` (`type=email`, `autocomplete=email`), `lead-instagram` (placeholder "@usuario",
`autocapitalize=none`), `lead-consent` (required checkbox), honeypot `lead-website` (off-screen, `tabindex=-1`,
`aria-hidden`, `autocomplete=off`). Real `<label for>` on each. Group hint: "Completá al menos una: WhatsApp, email o Instagram."
Normalization/validation:
- WhatsApp: strip spaces, dashes, dots, parentheses → must match `^\+[1-9]\d{7,14}$`.
  Error: "Escribí el número con código de país, por ejemplo +598 99 123 456."
- Email: trim, lowercase; `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`, ≤ 254. Error: "Revisá el email: parece que le falta algo."
- Instagram: accept `@user`, `user`, or an instagram.com URL → handle; `^(?!.*\.\.)(?!\.)[A-Za-z0-9._]{1,30}(?<!\.)$`.
  Error: "Ese usuario de Instagram no parece válido: solo letras, números, puntos y guiones bajos."
- None of the three: group error "Dejanos al menos una forma de avisarte: WhatsApp, email o Instagram." (highlight all three).
- Consent missing: "Para avisarte necesitamos tu consentimiento."
- Errors inline (Courier Prime italic, `--error`), `aria-invalid`, `aria-describedby`, focus the first invalid field.
Consent label: "Acepto recibir novedades de Monos del Ambiente sobre el disco y el lanzamiento por las vías que dejé.
Me puedo dar de baja cuando quiera." + link "Política de privacidad" (`PRIVACY_URL`; if it is `#privacidad`, open an
in-scene engraved note — text in §21 — otherwise a normal external link).
Submit: "AVISAME CUANDO SE ABRAN LAS PUERTAS" (engraved push bar). While submitting: disabled + "Registrando…".
`submitLead(data)` — separate, JSDoc-documented function:
- Input `{ name, whatsapp, email, instagram, consent, consentText, consentVersion, source, locale, timeZone, createdAt }`.
- If `LEAD_ENDPOINT` (config) is a URL: `POST` JSON, 10 s timeout, returns `{ ok, id, destination: 'remote' }`;
  document that the real backend must validate again, dedupe, store consent evidence, and never log PII.
- Otherwise: store in `localStorage['eldom.leads.v1']` (array, keep last 20) → `{ ok, id, destination: 'local' }`;
  storage unavailable → keep in memory → `{ ok, id, destination: 'memory' }`.
- Duplicate protection: fingerprint = normalized `whatsapp|email|instagram`; if already submitted this session
  (sessionStorage set + in-memory set) or already present in the stored leads → `{ ok: true, duplicate: true }`
  without storing again. Honeypot filled → pretend success, store nothing.
Confirmation (in the scene, never claiming a server when local):
- Plate shows "Tu piso quedó reservado." and, for `local`: "Guardado en este dispositivo." / `memory`: "Guardado solo
  durante esta visita." / `remote`: nothing extra. Then it folds back into the call button (1.6 s later), camera
  returns, a light line runs along the door seam and surround (1.6 s), the call button stays lit, and
  "Tu piso quedó reservado." appears in the world under the countdown for ≈7 s.
- Duplicate: "Ya estabas en la lista. No hace falta tocar el botón dos veces (aunque todos lo hacemos)."
consentVersion `"v1-2026-09"`, source `"artifact-prelaunch"`.

## 15. Audio (WebAudio synthesis only — no files)
Unlock on the first `pointerdown`/`keydown`. Master gain + mute toggle (sessionStorage). Sounds: void ambience (two
detuned low sines + filtered noise with slow LFO, very quiet, fades in over 4 s), countdown tick (last 10 s), launch
rumble (sub + low-passed noise, 4 s), door motor (band-passed noise sweep + low hum), door thunk, button click, latch
click, refusal buzz, travel hum (saw through low-pass, gain/cutoff follow speed) + whoosh, floor-pass tick, arrival
ding (two-tone bell with partials), soft water steps. While a player portal exists: ambience and SFX gain → 0 (fade
300 ms) — no overlapping audio. Suspend the AudioContext when the tab is hidden.

## 16. Input & accessibility
- Desktop: mouse position gently steers the view (±6° yaw, ±4° pitch), drag looks further (±24° / ±12°), WASD/arrows
  walk inside the current zone (damped, ≈1.1 m/s). Touch: drag to look; tap hotspots. `touch-action:none` on the canvas.
- Escape closes the topmost layer (plate → question → portal) or returns to the elevator on floors.
- Backquote (`) toggles the dev panel.
- All interactive things are real buttons/links/inputs; hotspots have labels ("Piso 3: Ni un WhatsApp, visitado").
- Live region (polite) announces: "Las puertas están abiertas.", "Viajando al piso 3.", "Llegaste al piso 3: Ni un WhatsApp."
- Focus: plate/question/portal move focus inside on open and restore it on close. Visible `:focus-visible` everywhere.
- `prefers-reduced-motion`: no sway/shake/bob/flicker/wobble/smear, shorter sequences, fades instead of long camera
  flights, particles ×0.3. A dev toggle simulates it.

## 17. Performance & lifecycle
DPR caps as §4; adaptive: every 2 s average frame time > 24 ms → DPR −0.25 (floor 0.75) and mirror at quarter res;
< 12 ms for 6 s → step back up. `visibilitychange` hidden → stop the rAF loop, suspend audio, pause timers (time is
wall-clock based, so the countdown stays correct); visible → resume (if zero was crossed while hidden, run the launch
sequence on return). Dispose floors/players on exit. WebGL `contextlost` → preventDefault, try restore for 3 s, else
switch to 2D. Any exception inside the render loop → log once, switch to 2D, keep the DOM experience alive.

## 18. 2D fallback (Canvas2D) — same state machine and DOM layer
Triggers: no WebGL, three import failure/timeout, context failure, runtime render error, `#2d` hash or dev toggle.
Reuse the same procedural canvas drawings (facade, doors, dial, panel, text) as frontal elevations:
exterior (void, engraved water lines in perspective, elevator elevation with sliding doors, broken reflection drawn in
offset horizontal strips, countdown above, parallax layers following the pointer), launch (line, ripples, doors),
interior (large frontal panel elevation; door at its left in landscape; hotspots positioned from the 2D layout),
travel (light bands across the door, needle, vibration via canvas offset), floors (accent composition: ring or a 2D
silhouette per kind, particles, title) + the same DOM portal. It must look intentional, never "broken".

## 19. Loading & errors
Boot overlay on `--void`: centered thin ivory line that grows with progress + "EL LADO OSCURO DEL MONO" in
Marcellus SC 11px at 40%. Steps: fonts (≤3 s) → WebGL check → three import (≤9 s, 2 URLs) → textures → first frame
→ overlay fades out over 1.2 s (eyes adjusting). If everything fails, the 2D scene still appears. User-facing errors are
short and actionable (player rows in §12; nothing like "WebGL"/"CSP" in visible copy).

## 20. Dev controls + automation API
`SHOW_DEV_TOOLS = true` in config (prototype). A tiny low-contrast chip "DEV" bottom-left; click or backquote expands the
panel (Courier Prime 12px, dark, compact, scrollable on mobile). `#dev` hash opens it expanded. "Ocultar" hides the
chip entirely (backquote or five taps in the bottom-left 48×48 corner bring it back).
Panel groups: Estado [Previo] [Últimos 10 s] [Publicado] · Puertas [Abrir] [Cerrar] · Vista [Exterior] [Interior] ·
Llegar al piso [1]…[9] · Plataforma [YouTube] [Spotify] · Embeds [Auto] [Embed] [Links] · Extra [Borrar registro]
[Forzar 2D] [Movimiento reducido] [Velocidad ×1/×3] · readout: phase, renderer, DPR, fps, remaining time.
Every dev jump cancels running sequences and applies the target state idempotently (`applyState`).
"Previo" = time offset so that release is 3 days ahead (or real time if still before release).
"Últimos 10 s" = offset so that release is 10 s ahead (exterior, doors closed) → launch plays at zero.
"Publicado" = offset past release → short arrival version (§6) → `open`.

`window.__eldom` (used by the harness — implement exactly):
```
ready: Promise<void>                       // resolves after the first rendered frame (3D or 2D)
state(): { phase, renderer:'3d'|'2d', platform:null|'youtube'|'spotify', floor:number, visited:number[],
           doors:number /*0..1*/, embedMode:'auto'|'embed'|'link', embedsBlocked:boolean,
           portal:null|{provider, mode:'embed'|'link', playing:boolean, preview:boolean},
           remainingMs:number, formOpen:boolean, reducedMotion:boolean }
waitFor(phaseOrPredicate, timeoutMs=20000): Promise<void>
ui:  { openForm(), closeForm(), openListen(), chooseListen(p), closeListen(), enter(), returnToElevator() }
dev: { prelaunch(), lastTen(), released(), openDoors(), closeDoors(), exterior(), interior(), arrive(n),
       platform(p), press(n) /* full hand+travel */, embedMode(m), clearLead(), force2D(),
       reducedMotion(bool), timeScale(x) }
```
Phases: `boot, prelaunch, launching, open, entering, cabin, pressing, departing, traveling, arriving, exiting, floor,
returning`. `dev.interior()` → `cabin` at the lobby with doors open and no platform change. `dev.arrive(n)` → `floor`
at n with the portal for the current platform (default youtube if none chosen).

## 21. Copy deck (use verbatim)
- "MONOS DEL AMBIENTE" · "EL LADO OSCURO DEL MONO" · "El ascensor todavía no llegó." · "DÍAS" "HORAS" "MIN" "SEG"
- "AVISAME CUANDO SE ABRAN LAS PUERTAS" · "MIENTRAS ESPERÁS: PEQUEÑO PRIMATE" · "TU PISO QUEDÓ RESERVADO"
- "¿DÓNDE QUERÉS ESCUCHAR?" · "YOUTUBE" · "SPOTIFY" · "CERRAR"
- Register: "REGISTRO DE PASAJEROS" · "Dejanos cómo avisarte y te escribimos cuando se abran las puertas."
  Labels: "Nombre (opcional)", "WhatsApp con código de país", "Email", "Instagram".
- "Tu piso quedó reservado." · "Guardado en este dispositivo." · "Guardado solo durante esta visita."
- "LAS PUERTAS ESTÁN ABIERTAS" · "ENTRAR AL ASCENSOR"
- "¿POR DÓNDE QUERÉS VIAJAR?" · "PISOS" · "Elegí primero por dónde viajar."
- "← VOLVER AL ASCENSOR" · "ABRIR EN YOUTUBE ↗" · "ABRIR EN SPOTIFY ↗" · "Abrir el álbum ↗"
- "Estás escuchando una muestra." · "CONTINUAR EN SPOTIFY ↗" · "Se abre en una pestaña nueva."
- "Este video no se pudo cargar acá." · "El reproductor de Spotify no respondió."
- "SONIDO: SÍ" / "SONIDO: NO"
- Privacy note (`#privacidad`): "Usamos tus datos solo para avisarte del lanzamiento de El Lado Oscuro del Mono y
  mandarte novedades de Monos del Ambiente por las vías que elegiste. No los compartimos con nadie. Podés darte de baja
  cuando quieras respondiendo cualquier mensaje. En esta versión de prueba, el registro queda guardado solo en este navegador."

## 22. Config block (top of the script, exactly this shape)
```js
/** Release moment, ISO 8601 with offset (Montevideo, UTC-3). Temporary: replace freely. */
const RELEASE_AT = "2026-12-01T21:00:00-03:00";
/** "#privacidad" opens the in-scene note; set an https URL to link to the real policy. */
const PRIVACY_URL = "#privacidad";
/** Set to your API URL to send registrations to a server (see submitLead). null = this device only. */
const LEAD_ENDPOINT = null;
/** "auto" detects blocked iframes (claude.ai) and falls back to official links. */
const EMBED_MODE = "auto";
const SHOW_DEV_TOOLS = true;
const CONSENT_VERSION = "v1-2026-09";

/** Demo album used while "El Lado Oscuro del Mono" is not out. */
const DEMO_ALBUM = {
  title: "Pequeño Primate",
  youtubeVideoId: "doxiX5RHT7Q",
  spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
};

/**
 * One entry per floor. Navigation, panel, floors and players are generated from this list only.
 * youtubeStartSeconds: verified 2026-09-28 from the chapters in the public YouTube description.
 * spotifyTrackUri: verified 2026-09-28 from the official Spotify album embed. null = album embed fallback.
 * durationSeconds: from Spotify (display only).
 */
const tracks = [
  { floor: 1, title: "Tan Buena", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 0,
    spotifyTrackUri: "spotify:track:7xmiGFAeOF15ZN6QAsENFk", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#ded8c8", shortText: "", durationSeconds: 192, visual: { kind: "halo" } },
  { floor: 2, title: "Amor Libre", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 189,
    spotifyTrackUri: "spotify:track:7mzy5OVBJhlgVKvG7RVlVj", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#d6a3a0", shortText: "", durationSeconds: 218, visual: { kind: "flock" } },
  { floor: 3, title: "Ni un WhatsApp", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 408,
    spotifyTrackUri: "spotify:track:1dtZfodLIHHyqO8shTfXNE", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#9db8ad", shortText: "", durationSeconds: 201, visual: { kind: "chat" } },
  { floor: 4, title: "Te Necesito", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 609,
    spotifyTrackUri: "spotify:track:0V2SLoxbJK8jzMqBUOzXg8", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#c0645a", shortText: "", durationSeconds: 245, visual: { kind: "thread" } },
  { floor: 5, title: "Cebadora de Mates Internacional", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 852,
    spotifyTrackUri: "spotify:track:39aaLfBeqRi3MFEHWz3ZrN", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#b9b071", shortText: "", durationSeconds: 213, visual: { kind: "mate" } },
  { floor: 6, title: "Estás Acá", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 1065,
    spotifyTrackUri: "spotify:track:0gqx6nE1tY3cLFVLYLcJ3T", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#d9a45e", shortText: "", durationSeconds: 160, visual: { kind: "pin" } },
  { floor: 7, title: "Coca y Fernet", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 1227,
    spotifyTrackUri: "spotify:track:3jPLD7tdaol3b69Q3IXsOG", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#a8744f", shortText: "", durationSeconds: 192, visual: { kind: "glass" } },
  { floor: 8, title: "La Frase Mágica", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 1419,
    spotifyTrackUri: "spotify:track:1zkaXH1LT2rOPzXqlsnP4E", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#a79bd8", shortText: "", durationSeconds: 188, visual: { kind: "letters" } },
  { floor: 9, title: "Yo No Hago Música", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 1606,
    spotifyTrackUri: "spotify:track:7FAnf2IhSYJVvCZlFDxkXb", spotifyAlbumId: "0p8WjCX93rdndct41myh0x",
    visualAccent: "#86a3bd", shortText: "", durationSeconds: 198, visual: { kind: "staff" } },
];
```
`shortText` (optional) is drawn small under the floor title when non-empty. The number of floors = `tracks.length`
(panel rows are generated; keep the layout working for 1–12 entries).

## 23. Code organization (single module, banner-commented sections, in this order)
CONFIG → COPY → utils (math, easing, rng, color) → storage (safe wrappers, try/catch everywhere) → clock (wall time +
dev offset, countdown parts) → sequencer (promise-based `wait/tween`, time-scaled, cancellable tokens) → audio →
lead (validation, `submitLead`) → players (`PlayerPortal`) → procedural textures (canvas drawings shared by 3D and 2D) →
Renderer3D (materials, water/mirror, post, exterior, cabin, panel, hand, floors, portal glow, hotspot projection) →
Renderer2D → UI (DOM layer, plate, captions, question, portal layout, messages, live region, dev panel) → Director
(state machine, sequences, `applyState`) → input → boot (loading, detection, errors, visibility) → `window.__eldom`.
Renderers implement one interface (`setPhase`, `setDoors`, `update(dt,t)`, `project(id)` for hotspots, `resize`,
`dispose`) so the Director never branches on 3D vs 2D. Keep functions small; no dead code; no console noise
(one `console.info` line with renderer + DPR at boot is fine).

## 24. Verification harness (already written — use it)
`node ROOT/tools/check.cjs --scenario <names> [--viewport desktop|mobile|both] [--csp] [--slow]`
Scenarios: `smoke, form, listen, launch, enter, cabin, press, floors, return, fallback2d, ytplay, spotify, csp`, or `all`.
It serves `artifact/index.html` inside the Artifact skeleton on 127.0.0.1, drives `window.__eldom`, saves
screenshots to `ROOT/shots/`, prints console errors and exits non-zero on page errors. `--csp` adds the Artifact-like
CSP header (frames blocked) to test link mode. Syntax check: `node ROOT/tools/check.cjs --syntax`.
Headless Edge uses software WebGL: slow frames are expected there; don't tune quality to it.

## 25. Quality bar (priority order)
1. Exterior prelaunch composition, readability of the elevator, the living water, the countdown.
2. Launch + door opening. 3. Cabin interior + panel + hand press. 4. Floor 1. 5. Travel. 6. Floors 2–9.
Anti-goals: generic app UI, cards, dashboards, decorative gradients, neon, sky/horizon/buildings/stars, web buttons
dominating the scene, visible technical text, robotic constant-speed motion, clipped elements on phones.
