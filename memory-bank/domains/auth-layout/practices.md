# auth-layout — practices

## Measured values (2026-09-21)

**Surface sheen** (pointer-following, card-local, clipped to the card):

| Card | radius | colour | filter |
| --- | --- | --- | --- |
| dashboard | 180px | `rgba(113,112,255,0.13)` | `blur(24px)` |
| metrics | 140px | `rgba(113,112,255,0.10)` | `blur(20px)` |
| terminal | 120px | `rgba(113,112,255,0.10)` | `blur(20px)` |

No white specular core on this surface — a bright dot inside a card this size reads as a disc, and the
colour belongs to the underglow. Light mode mirrors the dashboard's own indigo veil (`rgba(94,106,210,…)`).

**Spotlight stroke** (SVG `<rect>` in a `userSpaceOnUse` radialGradient, one per card id):

| Card | gradient `r` | stroke | whole-perimeter ring on hover |
| --- | --- | --- | --- |
| dashboard | 160 | 1.5px | `0 0 0 1px rgba(94,106,210,0.20)` (light: 0.25) |
| metrics | 145 | 1.5px | same |
| terminal | 130 | 1.5px | same |

The ring and the travelling arc are **additive** by decision (2026-09-21): the ring says "the border is
lit", the stroke says "here is the pointer". Removing the ring makes the secondary cards read as dimmer
than the dashboard — measured border-band blue-shift went +48 / +49 / +46 counts in that configuration.

**Underglow** (scene-level layer, see `principles.md` P1):

| Knob | Value |
| --- | --- |
| emitter radius | 110px, last stop at 80% (= 88px of light) |
| box margin | 136px on **every** side (= 88px light + 2×24px blur) |
| vertical bleed | 24px above · 56px below the card |
| blur | 24px |
| dark / light peak | `rgba(94,106,210,0.42)` / `rgba(80,92,200,0.52)` |

**Tilt** (`useCardTilt`): `referenceRadius = hypot(w,h)/2.4` (isotropic — every axis advances the same
angle per pixel, so a flat card is no longer hypersensitive vertically: 448×170 was 2.64× worse before
this). `intensity` 8 / 8 / 6 · `depthMultiplier` 0.8 / 0.8 / 1.2 · `MAX_ROTATION_STEP` 0.65°/frame ·
`SCALE_STEP` 0.0035/frame · `maxScale` 1.03 · `LEAVE_MARGIN` 4px.

## Motion: one clock, an isotropic field, and a resting contract (2026-09-21, v0.48.1 → v0.51.0)

**One kinematic clock** — all three cards are integrated by a single `requestAnimationFrame` loop, not by
CSS transitions: each frame moves the angle toward its target by `(target − current) × smoothness` with
`smoothness = 0.2`, clamped to `MAX_ROTATION_STEP = 0.65°` per frame. Scale targets `1.03` on hover and a
5px lift follows from the same envelope. Measured: resting = identity matrix and `rect == layout size`;
hover `matrix3d(0.998…)`; leaving returns to identity; under `reduce` nothing moves.

**Isotropic tilt radius** — `referenceRadius = hypot(W, H) / 2.4` so any aspect ratio reaches the same
normalised radius; before this the vertical axis was **2.64×** more sensitive than the horizontal. A
`softFactor = sin(d·π/2)/d` term was **deleted** — it *amplified* mid-radius by 1.41× instead of softening.

**Resting contract (why "static" needed three fixes, not one)** — the entry keyframe's `to` is the
identity transform and `animation-fill-mode: forwards` **kept owning `transform` forever**, so the
component's `baseRotate*` / `translateZ` never applied (that is why cards *looked* straight). Flipping to
`backwards` alone unlocks an inline `translateZ(+40px)` and the scene `perspective: 1000px` then *enlarges
and blurs* the top card. The real layer was deeper: `useCardTilt` was **dead code** — `currentRotate*` were
plain `let`s (a dependency-free `computed` evaluated once) and `rafId` was never reset, so its loop never
started. Fix all three together: component zeros `baseRotate*`/`translateZ`, fill `forwards → backwards`,
`currentRotate*` become `ref`s and `rafId` is released. Regression test went red first (2/2 on the old
implementation).

**Measuring tilt/hover must freeze geometry** — hover changes `transform` (scale + rotation), so a naive
hover-vs-idle pixel difference measures *displacement*, not light (25.3 counts → **3.7** after freezing).
See `principles.md` P4.
