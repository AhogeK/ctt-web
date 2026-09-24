# auth-layout — references

## Where the truth lives

| Fact | Source |
| --- | --- |
| Stylesheet sections (sheen / spotlight / underglow) | `src/layouts/AuthLayout.css` — file ends with the two labelled blocks |
| Scene markup + layer element | `src/layouts/AuthLayout.vue` (`.auth-3d-scene` → `.auth-underglow` → cards) |
| Pointer physics, underglow sync | `src/composables/useCardTilt.ts` (`referenceRadius`, `anchorUnderglow`, `publishUnderglowCore`) |
| Per-card presets | `AuthDashboard.vue` / `AuthMetricsCard.vue` / `AuthTerminalCard.vue` (spotlight `r`, sheen) |
| CSS custom properties | `--sheen-x/y` (card-local, scale-compensated) · `--ug-card-*` · `--ug-spot-*` |
| Session evidence (grading, not authority) | `.omp/report/2026-09-24/` (gitignored; index: `.omp/report/README.md`) |

## Traps paid for

- The stylesheet exceeded 3400 lines from duplicate copies; restoring from `HEAD` and re-applying one
  labelled block is the recovery. Never run a bulk delete regex over it (two accidents, one destroyed
  the file down to 187 lines).
- `clip-path: inset()` rejects negative values silently — the cut appeared to "not work" while the
  declaration was being dropped.
- `@media (hover: hover)` around a `.is-tilting::before/::after` block survives after those
  pseudo-elements are removed and then fails the lightningcss parse with "dangling combinator".
