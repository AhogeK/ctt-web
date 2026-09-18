# achievements — meta

## Boundary

Everything about the trophy cabinet at `/achievements`: how the flat badge list the API returns is
shaped into trophies, how tier rank is expressed visually, and how lifetime and resetting goals are
presented.

**In scope**: badge → trophy grouping, tier ladders, measurement windows, tier colour grades, the
SVG artwork set, progress-to-next-tier, card and page composition, the `/achievements` route.

**Out of scope** (belongs elsewhere):

- The history the badges are computed from (`streaks`, sessions, time-of-day windows) →
  [`backend-contract`](../backend-contract/meta.md)
- The endpoint's Zod schema and API-layer plumbing → [`backend-contract`](../backend-contract/meta.md)
- Design tokens (the indigo ramp's values) → root `DESIGN.md`
- Generic card/list/scroll a11y → `systemPatterns.md` and
  [`dashboard-visualization`](../dashboard-visualization/practices.md)

## Owned paths

| Path                                                              | Role                                                        |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/features/achievements/composables/trophy-model.ts`           | Presentation map, `(type, window)` grouping, tier progress, ordering, `splitByWindow` |
| `src/features/achievements/components/TrophyMedal.vue`            | Inline SVG artwork, tier-driven paint                        |
| `src/features/achievements/components/TrophyCard.vue`             | One trophy: artwork, rung strip, progress                    |
| `src/features/achievements/views/AchievementsView.vue`            | Page shell: header totals, grid, three states                |
| `src/router/modules/achievements.ts`                              | Route (must wrap `AppLayout`, see `practices.md`)            |

## Terminology

| Term | Meaning |
| --- | --- |
| **Badge** | One entry in the API response — a single threshold, e.g. `STREAK_7`. 67 exist. |
| **Tier** | A rung of a trophy's ladder. One badge is one tier; `tier` is its 1-based ordinal. |
| **Family** | The server's `type`, e.g. `TOTAL_SECONDS`. 8 exist. |
| **Window** | The measurement period — `LIFETIME` or a resetting `DAY`/`WEEK`/`MONTH`/`YEAR`. |
| **Trophy** | One `(family, window)` ladder as a whole — 14 exist. What a user sees as one object. |
| **Grade** | The visual rank of a trophy's artwork (0 locked, 1–3 earned). Derived, not from the API. |
| **Maxed** | Every tier of the trophy earned. |

## Files beyond the five

`trophy-geometry.md` — the measured per-artwork extents and the transform that fits each
one inside the completion ring, plus how to measure SVG geometry correctly. Split out of
`practices.md` when that file outgrew the 200-line limit (same pattern as
`dashboard-visualization/rendering.md`).

## Where to start

- Changing how trophies group or order → `principles.md`, then `trophy-model.ts`.
- Adding or replacing artwork → `practices.md` (the SVG set's shared language).
- Asking the backend for more → `references.md`, then a requirement text (cross-repo changes are
  read-only here, R3).

## Verification baseline

| | |
| --- | --- |
| Checked against source | `../ctt-server` **v0.71.0 – v0.72.0** (full read) · **contract re-read at v0.77.0 on 2026-09-18** |
| Coverage | The `/api/v1/stats/achievements` contract (badge fields, `totalUnlocks`/`periodStreak`, window dates) read from the DTO and service at v0.71.0–v0.72.0. On 2026-09-18 `AchievementResponse`'s fifteen fields were compared term by term against `AchievementSchema` in `src/lib/schemas/stats.schema.ts`: nothing present on one side is missing from the other |
| Known drift | None. The **shape** is unchanged — that is what the v0.77.0 comparison establishes. The **counts** pinned below (67 badges / 14 ladders at v0.71.0) are data rather than schema and were **not** re-measured, so they stand only as of that revision |

Treat the version-pinned numbers here (67 badges / 14 ladders at v0.71.0) as "true as of that
revision": re-check the specific file before relying on them.
