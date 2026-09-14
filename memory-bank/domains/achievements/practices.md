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

`buildTrophies(badges)` buckets the response by `` `${type}:${window}` ``, builds one trophy per
bucket, then sorts. Since v0.71.0 the key and the order both come from the payload, so there is no
declaration to walk and no code list to keep in sync — the hardcoded `TROPHY_FAMILIES` table was
deleted (~130 lines).

Two things the key must do:

- **Include the window.** `TOTAL_SECONDS` is five independent ladders whose `tier` each restart at 1;
  keying on `type` alone folds the 3 daily rungs into the lifetime ladder as tiers 9–11.
- **Sort tiers by the server's `tier`**, never by `code`. The codes are not ordered: `DAILY_BURST` is
  tier 3 while `DAILY_BURST_4` is tier 1. Ties break on `code` so the order is total.

`progress` is taken as the **max across the bucket's badges** rather than from the first. Under
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

## The countdown needs a clock, not `new Date()`

`groupByWindow(trophies, now)` takes its clock as an argument, and the view passes
`useNow({ interval: 60_000 })` from `@vueuse/core` (already a dependency — no timer to hand-roll,
R12). A bare `now: Date = new Date()` default would be evaluated **once** per computed run, so a page
left open across midnight would keep claiming yesterday's "N days left" indefinitely.

Minute granularity is deliberate: the countdown is expressed in whole days, so only the local *date*
changes its value, and a per-second tick would re-render four groups for nothing.

Injecting the clock is also what makes the countdown testable — pass a fixed date and the assertion
is exact (`new Date(2026, 8, 18)` → 2 days). Construct dates **locally** in tests (`new Date(y, m-1, d)`),
never `new Date('2026-09-18')`, or the result shifts by a day outside UTC.

## Validating a server date: range-checking the numbers is not enough

`m <= 12 && d <= 31` accepts `2026-02-31` and `2026-04-31`, and the range then renders **"Feb 31"** —
a date that does not exist, displayed to the user as fact (this shipped into a draft of v0.40.0 and
was caught by probing the parser, not by reading it).

Correct check: anchor with `/^(\d{4})-(\d{2})-(\d{2})$/` (which also rejects unpadded `2026-9-4`),
construct `new Date(y, m-1, d)`, then compare `getFullYear`/`getMonth`/`getDate` **back** against the
parsed numbers. `Date` normalises an impossible day into the next month (`2026-02-31` → March 3), so
the round-trip fails — and leap years fall out for free (`2028-02-29` passes, `2026-02-29` does not).
Years 0–99 are rejected rather than mis-rendered, because `new Date(26, …)` means 1926.

## A live clock beside frozen data will contradict itself

The countdown ticks (`useNow`) while the window dates come from a query that refreshes only on
mount: `refetchOnWindowFocus` is false app-wide (`src/lib/query.ts`) and this query sets no
`refetchInterval`, so `staleTime` alone never re-requests. A passed window clamps to 0 days, which
renders "Ends today" — so a page left open past a boundary shows a live "Ends today" beside a range
it has already left, and never self-corrects.

Rule: **anything that renders against a clock must trigger the refetch that can change it.** Here that
is `watch(() => now.value.toDateString(), () => refetch())` — keyed on the local *date*, since window
boundaries are local dates, so it fires once a day instead of 1440 times.

Testing that watch has a trap: `refetchSpy` is module-scoped, so wrappers left mounted from earlier
tests keep live watchers and fire on a later test's clock change (observed: 11 calls where 1 was
expected). Unmount every wrapper in `afterEach`.

## `font-*` utilities render nothing in this app (project-wide, pre-existing)

`src/assets/base.css` sets `font-family: Inter, …` but no `@font-face`, font file or fontsource
package exists, so Inter never loads and every `font-normal`/`font-medium`/`font-semibold` computes
to the **fallback's 400 weight**. Measured live: the page's `h1` and `h2` (both `font-semibold`) and a
control button report `fontWeight: 400`.

Consequences when building emphasis or hierarchy:

- Do **not** rely on weight to distinguish anything — it is a no-op. Typography here is effectively
  size + colour + decoration only.
- Non-colour emphasis needs another mechanism: `underline` / `decoration-dotted` render from the text
  engine and are mode-independent.
- This is not caused by the achievements work (dashboard code uses `font-semibold` the same way), so
  it is out of scope to fix here — but do not build on top of it.

Verification note: probing weights by injecting `<span class="font-bold">` gives a false negative,
because Tailwind only emits utilities it finds in source. Measure a real element that already carries
the class, or read the mounted DOM.

## Artwork geometry

The medal's ring is at the largest radius the 24-grid allows, so the artwork has to fit
inside it — measured per artwork, not assumed. The measurements, the transform that
enforces the fit, and the traps in measuring SVG are in
[`trophy-geometry.md`](./trophy-geometry.md).

## A lazily-evaluated write log is not an event history

`user_achievements` looks like a log of earned achievements, and it is not: rows are
written only when `evaluate` runs, and `evaluate` has a single caller — `GET
/achievements`. A push calls `evictCache` and nothing else. So the table records *the
periods in which the user opened the page*, and counting its rows as "times achieved"
would report how often someone looked.

Reading the schema was not enough to see this; tracing the **write path** was. Two greps
settle it: how many callers `insertIfAbsent` has (one), and how many callers *that* has
(one), and whether any other component references the service (a cache eviction only).

The same trap exists in reverse for any "derived" count: before trusting a stored row as
history, ask what triggers the write. If the trigger is a read, the data is a read log.

The server's fix is worth copying when this comes up again: recompute from the source of
truth (sessions) and take the **union** with stored rows — correct even where the log is
sparse, and monotone, since a deleted session cannot retract an award.

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
`formatDuration` (shared in `@/lib/utils`); `percent` prints as `32%` (not `32 percent`, which reads
as prose); other units print verbatim — `39 languages`, `7 days / 30 days`. Do **not** hand-roll a
formatter per card (systemPatterns: no inline per-view formatters).

`formatPercent` in `@/lib/utils/percent.ts` is **not** the right helper here: it is built for
adaptive precision on tiny *shares* (flooring to `0`, emitting a `<0.000001` sentinel, no `%` sign),
whereas this is an integer 0–100 measurement.

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
count of `unlocked: true` in the raw endpoint response, and the card count must equal the number of
distinct `(type, window)` pairs. Measured live: page `19 / 67 · 28%`, backend 19 unlocked, 14 cards
from 67 badges — a mismatch there means the grouping or the unlock counting drifted, before any
visual question is worth asking.

Write the header assertion as an **ordered pair** (`toMatch(/7\s*\/\s*11/)`), not two
`toContain`s: the loose form passes with `earned` and `total` swapped, and `toContain('7')` is
satisfied by the percentage alone.
