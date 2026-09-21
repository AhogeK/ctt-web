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
