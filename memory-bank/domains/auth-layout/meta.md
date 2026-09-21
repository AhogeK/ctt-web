# auth-layout — meta

## Boundary

The **login/registration shell** (`AuthLayout.vue`): the glass panel, the left showcase column with its
three stacked panels (dashboard preview, metrics, terminal) and the right form area. Covers the 3D hover
gesture, the pointer light (surface sheen + underglow) and the **stacking model** that decides which
card occludes which light.

Not this domain: the form itself (auth feature), the marketing surface (`landing-page`), charts inside
the panels (`dashboard-visualization`).

## Verification baseline

Recorded 2026-09-21 against working tree state at that date (branch `develop`, version 0.51.0).
Every value below was read from the running page (`getComputedStyle` / pixel差分 on the real build),
never inferred from the stylesheet. Re-derive before trusting after any change to `AuthLayout.css`.
