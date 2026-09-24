# landing-page — references

## Reference sites (probed 2026-09-19)

| Site | Category | Background | Why it is here |
| --- | --- | --- | --- |
| Linear | Design authority | dark (luma 9) | `DESIGN.md`'s original blueprint; 12-column grid, `grid-gap=32px`, next-themes bootstrap |
| Supabase | Design authority + open source | dark (18) | Token system in Tailwind 4 `@theme` + `oklch`; **source readable** |
| Raycast | Design authority | dark (8) | Cleanest three-layer token naming: `grey-*` → `color-bg` → `navbar-*` |
| Plausible | Peer | light (255) | Zero custom tokens, zero animated elements; single-theme |
| Cal.com | Peer | light (244) | Marketing page ships only ~24KB JS (app separated from marketing) |
| WakaTime | Peer (weak) | light (255) | Closest to ctt's category — **and the weakest by craft** (see `principles.md` L1) |

## Where the source lives (Supabase monorepo)

| Path | Contains |
| --- | --- |
| `apps/ui-library/components/theme-switcher-dropdown.tsx` | `useTheme` + `mounted` guard + `resolvedTheme` |
| `apps/ui-library/hooks/use-mounted.ts` | The 11-line hydration guard |
| `apps/ui-library/hooks/use-mobile-menu.ts` | 35-line `{open, setOpen}` state hook |
| `apps/ui-library/hooks/useIntersectionObserver.ts` | The observer wrapper (only one of three sites uses it) |
| `apps/www/components/SolutionsStickyNav.tsx` | Sticky-nav recipe |
| `apps/www/components/Nav/*` | `MobileMenu.tsx`, `useDropdownMenu.tsx` (menu *data*, not state) |
| `packages/ui/src/components/shadcn/ui/accordion.tsx` | Accordion: 89 lines, Radix primitives + Keyframes utilities |

## ctt anchors

| File | Role |
| --- | --- |
| `DESIGN.md` §3 | Typography rules |
| `DESIGN.md` §8 | Breakpoints (six tiers) · Touch Targets (qualitative) · Spacing (base 8px) · Radius scale |
| `src/stores/theme.ts` | `'light' \| 'dark' \| 'auto'` via VueUse `useDark` |
| `src/components/app/ThemeToggle.vue` | Cycle toggle; line 83 is the unguarded hover style |
| `systemPatterns.md` | Cross-cutting rules: `hover: hover`, `motion-reduce`, mounted guard |

## Measurement recipe

Probe with `tab.evaluate` in the page context (not `tab.run` — that scope has no `document`).
Collect: `document.styleSheets` rules (keyframes, custom properties, media queries), computed styles
for the type ladder, `rowGap`/`borderRadius`/`transitionDuration` tallies over `body *`, and
`document.body` background luminance for the light/dark call. For source, list directories through
the GitHub contents API rather than guessing paths.

## Migrated from the P2 research (2026-09-24 — the plan no longer keeps a second copy)

| Fact | Source | Why it is kept |
| --- | --- | --- |
| **Numeric token naming** — `spacing-none=0` · `spacing-0-5=4px` · `spacing-1=8px` · `rounding-xs=4px` · `rounding-sm=6px` | Raycast stylesheet | "The number *is* the multiple" — no invented semantic names for spacing/radius |
| **`data-platform` branching** — 12 occurrences (macOS/Windows) | Raycast JS | ctt ships a cross-platform plugin, so it needs the same branch point |
| **`inert` as the focus trap** — preferred over a hand-written `aria-hidden` | Linear JS | The modern primitive; check before writing a trap by hand |
| **`:focus-visible` and `:focus` governed separately** — 72 / 126 occurrences | Supabase CSS | Two different intents; collapsing them loses keyboard-only affordance |
| **Keyboard logic is mandatory** — `Escape` / `ArrowUp` / `ArrowDown` / `keydown` / `tabindex` present in all three sites' JS | Supabase · Raycast · Linear | The minimum a menu/dialog must ship |
