# achievements — references

Factual lookup. No judgement here — see `principles.md` / `scenarios.md`.

## Endpoint

`GET /api/v1/stats/achievements?timezoneOffset=<minutes>`

- `timezoneOffset` ±720, minutes; frontend sends `-new Date().getTimezoneOffset()` automatically.
- Response: `RestApiResponse<List<AchievementResponse>>`.
- Server caches 60 s per user **per timezone** (Redis), and unlocks are written on read.
- Progress windows (`06:00–09:00` early bird, `22:00–05:00` night owl) are resolved in the
  **requested** timezone, which is why the offset is not optional for correctness.

## `AchievementResponse` fields

| Field | Type | Notes |
| --- | --- | --- |
| `code` | string | Stable id, e.g. `STREAK_7`. Irregular — see below. |
| `displayName` | string | Names the **tier** ("7-Day Streak"), not the family. |
| `description` | string | What the tier rewards. |
| `unlocked` | boolean | Server-set; written on first read where `progress >= target`. |
| `unlockedAt` | string \| null | DB timestamp (`CURRENT_TIMESTAMP`), null while locked. |
| `progress` | number | **Family-scoped** — repeated across a family's tiers. |
| `target` | number | This tier's threshold. |
| `unit` | string | `days` / `seconds` / `languages` / `month`. |

**Not present**: the family (`type`) and a tier ordinal. See the gap below.

## The 7 families and their ladders

| Family key | Tiers | Codes (ascending) | Unit |
| --- | --- | --- | --- |
| `streak` | 3 | `STREAK_3` → `STREAK_7` → `STREAK_30` | days |
| `volume` | 3 | `TOTAL_10_HOURS` → `TOTAL_100_HOURS` → `TOTAL_500_HOURS` | seconds |
| `polyglot` | 3 | `LANGUAGES_3` → `LANGUAGES_5` → `LANGUAGES_10` | languages |
| `earlyBird` | 2 | `EARLY_BIRD_10` → `EARLY_BIRD_30` | days |
| `nightOwl` | 2 | `NIGHT_OWL_10` → `NIGHT_OWL_30` | days |
| `burst` | 1 | `DAILY_BURST` (8 h in one day) | seconds |
| `perfectMonth` | 1 | `PERFECT_MONTH` (every day of a month) | month |

`3+3+3+2+2+1+1 = 15` — matches the server enum exactly. Backend source of truth:
`ctt-server/.../stats/achievement/enums/Achievement.java` (and `AchievementType.java` for the
family names).

### Why the codes cannot be parsed

They are irregular, so a regex or suffix-strip is not a safe way to recover the family:

- `STREAK_3`, `LANGUAGES_3` → `<stem>_<n>`
- `TOTAL_10_HOURS` → `<stem>_<n>_<UNIT>`
- `DAILY_BURST`, `PERFECT_MONTH` → **no number**
- stems differ from the enum's type names: `LANGUAGES_*` vs `LANGUAGE_COUNT`,
  `DAILY_BURST` vs `MAX_DAILY_SECONDS`

## Measured sample (test account `langtail`, 2026-09-13)

Real values that the rendering was built against — useful as a fixture shape.

| Code | progress / target | unlocked |
| --- | --- | --- |
| `STREAK_3` | 7 / 3 | ✅ |
| `STREAK_7` | 7 / 7 | ✅ |
| `STREAK_30` | 7 / 30 | — |
| `TOTAL_10_HOURS` | 460860 / 36000 | ✅ |
| `TOTAL_100_HOURS` | 460860 / 360000 | ✅ |
| `TOTAL_500_HOURS` | 460860 / 1800000 | — |
| `LANGUAGES_3/5/10` | 39 / 3, 5, 10 | ✅ ✅ ✅ |
| `EARLY_BIRD_10/30` | 4 / 10, 30 | — — |
| `NIGHT_OWL_10` | 8 / 10 | — |
| `NIGHT_OWL_30` | 8 / 30 | — |
| `DAILY_BURST` | 86400 / 28800 | ✅ |
| `PERFECT_MONTH` | 0 / 1 | — |

Header on this data: `8 / 15 tiers · 53%`, page renders 7 trophies.

## The contract gap (frontend workaround in place)

The server's `Achievement` enum exposes `type()` but `AchievementResponse` **does not project it**.
Requested addition — both are projections of data the enum already holds, not new logic:

| Field | Source | Effect |
| --- | --- | --- |
| `type` | `Achievement.type()` | Removes the code list from `TROPHY_FAMILIES`; a new badge joins its ladder with no frontend change |
| `tier` | ordinal within the family | Ladder order becomes authoritative server-side |

Until then the frontend matches on `code` (`trophy-model.ts`) and degrades gracefully (P4).

## Backend requirement: periodic (resetting) achievements

**Status**: not requested yet — drafted here so it can be handed over verbatim.

**Current state.** All seven `AchievementType` values are lifetime-cumulative. Nothing resets, so an
active account exhausts the set: 15 tiers total, and a real account already sits at 12. Past that
point the feature shows a frozen number.

**Requested behaviour.** Add goals whose measurement window rolls. Illustrative, not prescriptive:

| Window | Examples |
| --- | --- |
| Day | code 2h today; start before 09:00 today |
| Week | 5 active days this week |
| Month | 20 active days this month; 40h this month |
| Year | 200 active days in 2026; 1,000h in 2026 |

**Contract additions this needs** (the first two are the ones already wanted above):

| Field | Why |
| --- | --- |
| `type` | group a badge into its family/ladder without a frontend code list |
| `tier` | ladder order authoritative server-side |
| `window` | `LIFETIME \| DAY \| WEEK \| MONTH \| YEAR` — tells the client whether progress resets |
| `windowStart` / `windowEnd` | the concrete local range being measured, so the card can label it (`August 2026`) instead of guessing |

**Why the backend should own the window, not the client.** The ranges are calendar-correct only in
the user's zone (already handled: the endpoint takes `timezoneOffset`), and `daily_stats` is already
materialised — so these are projections over data that exists, not new aggregation.

**Client-side cost when it lands.** One extra concept (a trophy's window) plus a label; the ladder,
grading, ordering and progress maths are unchanged, because a resetting tier still has a plain
threshold. No new rendering path.

**Guardrail to keep.** Keep each family's lifetime tier beside the periodic ones, so rolling a period
never erases long-term progress.

## Files

| Path | Role |
| --- | --- |
| `src/features/achievements/composables/trophy-model.ts` | Declarations + grouping + progress + ordering |
| `src/features/achievements/components/TrophyMedal.vue` | SVG set + grade paint |
| `src/features/achievements/components/TrophyCard.vue` | Card |
| `src/features/achievements/views/AchievementsView.vue` | Page |
| `src/router/modules/achievements.ts` | Route |
| `src/components/app/AppSidebar.vue` | Nav entry (`Trophy` icon, after Devices) |
