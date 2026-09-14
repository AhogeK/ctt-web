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

## Where to start

- Changing how trophies group or order → `principles.md`, then `trophy-model.ts`.
- Adding or replacing artwork → `practices.md` (the SVG set's shared language).
- Asking the backend for more → `references.md`, then a requirement text (cross-repo changes are
  read-only here, R3).
