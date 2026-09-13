# achievements — practices

## Route registration (the trap that shipped a nav-less page)

Every app page is a **parent record wrapping `AppLayout` with the view as a `path: ''` child**:

```ts
{
  path: '/achievements',
  name: RouteNames.ACHIEVEMENTS,
  component: () => import('@/layouts/AppLayout.vue'),
  meta: { title: 'Achievements', requiresAuth: true, layout: 'app' },
  children: [
    { path: '', name: RouteNames.ACHIEVEMENTS_CABINET, component: () => import('.../AchievementsView.vue') },
  ],
}
```

A bare single record (no `AppLayout`) renders the view **with no sidebar and no navigation** while
still looking correct in a screenshot — the page and its data were fine, which is why the defect was
invisible until the DOM was inspected for links. `src/router/modules/*.ts` are auto-globbed by
`router/index.ts`, so no index edit is needed, but the shape must match `dashboard.ts` / `devices.ts`.

`/leaderboard` is registered the other way and has the same missing-shell defect — out of scope for
the achievements work, but worth fixing when that page is next touched.

## Grouping, in one pass

`buildTrophies(badges)` maps the response by code, walks the declarations claiming their codes,
then appends whatever is left as single-tier trophies. Two passes over 15 items; no index to keep
in sync.

`progress` is taken as the **max across the family's badges** rather than from the first. Under
today's server that is the same number (verified), and it stays correct if the server ever starts
reporting per-tier values.

## Artwork: one path set per family, paint from the grade

`TrophyMedal.vue` draws inline SVG on a 24×24 grid with one stroke weight and one corner radius per
shape. The `grade` prop (`0 | 1 | 2 | 3`) swaps fill/stroke only — **a new tier never needs a new
asset**, and there is no raster output to keep in sync.

Grade is normalised across the trophy's own ladder:

```
earned === 0            → 0 (locked: no fill, 1.25 stroke, muted colour)
maxed                   → 3 (brightest stop + completion ring)
otherwise               → min(2, max(1, ceil(earned / total * 3)))
```

The `min(2, …)` matters: without it a 1-rung trophy that is earned would grade 3 and claim the
maxed treatment it has not got through a ladder for.

## Reading the grade back in a test

Computed paint is on the SVG element's inline `style`, so jsdom can assert it without a layout
engine:

```js
getComputedStyle(svg).fill          // 'rgba(0, 0, 0, 0)' when locked
getComputedStyle(svg).strokeWidth   // '1.25px' locked, '1.5px' earned
```

Verified live for all four states: locked = no fill + `1.25px`; mid = `rgb(130, 144, 240)`
(`#8290f0`); maxed = `rgb(185, 193, 255)` (`#b9c1ff`) **plus** the ring.

## Units in copy

`TOTAL_SECONDS` reports raw seconds (`460860`), which is unreadable. Route `seconds` through
`formatDuration` (shared in `@/lib/utils`) and print other units verbatim — `39 languages`,
`7 days / 30 days`. Do **not** hand-roll a formatter per card (systemPatterns: no inline per-view
formatters).

## Testing the view

Mock `useStatsAchievements` with a `computed` ref, mirroring `LanguageDistributionPanel.test.ts`.
Two traps found while doing it:

- **An unknown icon breaks the sidebar tests.** `AppSidebar.test.ts` mocks `@lucide/vue` with an
  exhaustive object; adding an import to `AppSidebar.vue` without adding it to that mock makes every
  sidebar test fail with `Cannot read properties of undefined`. Add the icon to the mock.
- **`attributes()` returns `string | undefined`**, so `keys.sort((a, b) => a.localeCompare(b))` does
  not type-check. Default to `''` before comparing.

## Assert the arithmetic against the server, not the UI

The page's header total is the cheapest cross-check there is: `earned / total` tiers must equal the
count of `unlocked: true` in the raw endpoint response. Measured live: page `8 / 15 · 53%`, backend
8 unlocked — a mismatch there means the grouping or the unlock counting drifted, before any visual
question is worth asking.
