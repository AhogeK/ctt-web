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

13 components (v0.71.0). Jackson omits nulls, so the real payload shows **11 keys** for a LIFETIME
badge and 13 for a windowed one — `windowStart`/`windowEnd` are absent rather than null.

| Field | Type | Notes |
| --- | --- | --- |
| `code` | string | Stable id, e.g. `STREAK_7`. Irregular — see below. |
| `type` | string | Family, e.g. `STREAK` / `TOTAL_SECONDS`. **Added v0.71.0.** |
| `tier` | number | 1-based ordinal within the family **and window**, ascending by target. **Added v0.71.0.** |
| `displayName` | string | Names the **tier** ("7-Day Streak"), not the family. |
| `description` | string | What the tier rewards. |
| `unlocked` | boolean | Server-set; written on first read where `progress >= target`. |
| `unlockedAt` | string \| null | Real achievement instant, back-derived (v0.71.0). Absent while locked. |
| `progress` | number | **Family-and-window scoped** — repeated across that ladder's tiers. Monotonic for LIFETIME (v0.71.0), resets for windowed. |
| `target` | number | This tier's threshold. |
| `unit` | string | `days` / `seconds` / `languages` / `percent`. |
| `window` | string | `LIFETIME` / `DAY` / `WEEK` / `MONTH` / `YEAR`. **Added v0.71.0.** Defaults to `LIFETIME`. |
| `windowStart` | string \| null | First local date of the current window; **key absent** for LIFETIME. |
| `windowEnd` | string \| null | Last local date; **key absent** for LIFETIME. |

`unit` changed for `PERFECT_MONTH` in v0.71.0: `month` → **`percent`** (0–100, the best month's
coverage). Its `progress` changed from binary `0/1` to that percentage.

## The 14 ladders (v0.71.0)

67 badges. `tier` restarts at 1 for each `(family, window)` pair, which is why the grouping key
must include the window. Measured from the live endpoint, 2026-09-13.

| Family | Window | Tiers | Targets | Unit |
| --- | --- | --- | --- | --- |
| `STREAK` | LIFETIME | 8 | 3, 7, 14, 30, 60, 100, 180, 365 | days |
| `TOTAL_SECONDS` | LIFETIME | 8 | 36000 … 9000000 | seconds |
| `LANGUAGE_COUNT` | LIFETIME | 9 | 2, 3, 5, 8, 10, 15, 25, 40, 60 | languages |
| `EARLY_BIRD_DAYS` | LIFETIME | 8 | 5, 10, 20, 30, 50, 75, 150, 300 | days |
| `NIGHT_OWL_DAYS` | LIFETIME | 8 | 5, 10, 20, 30, 50, 75, 150, 300 | days |
| `MAX_DAILY_SECONDS` | LIFETIME | 5 | 14400, 21600, 28800, 36000, 43200 | seconds |
| `PERFECT_MONTH` | LIFETIME | 5 | 50, 70, 90, 95, 100 | percent |
| `TOTAL_SECONDS` | DAY | 3 | 3600, 7200, 14400 | seconds |
| `ACTIVE_DAYS` | WEEK | 3 | 3, 5, 7 | days |
| `TOTAL_SECONDS` | WEEK | 2 | 36000, 90000 | seconds |
| `ACTIVE_DAYS` | MONTH | 2 | 10, 20 | days |
| `TOTAL_SECONDS` | MONTH | 2 | 144000, 288000 | seconds |
| `ACTIVE_DAYS` | YEAR | 2 | 100, 200 | days |
| `TOTAL_SECONDS` | YEAR | 2 | 1800000, 3600000 | seconds |

`ACTIVE_DAYS` is the one family with **no LIFETIME ladder** — periodic only. Backend source of
truth: `ctt-server/.../stats/achievement/enums/Achievement.java` and `AchievementWindow.java`.

### Window date shapes (measured)

`windowStart` / `windowEnd` are local `yyyy-MM-dd` strings. Each window's actual span:

| Window | Measured | Note |
| --- | --- | --- |
| `DAY` | `2026-09-14` → `2026-09-14` | **Start equals end** — a day window is one date, so the range must collapse to `Sep 14`, not print a range |
| `WEEK` | `2026-09-14` → `2026-09-20` | ISO week (Mon–Sun) |
| `MONTH` | `2026-09-01` → `2026-09-30` | real month length, so February is 28/29 |
| `YEAR` | `2026-01-01` → `2026-12-31` | |

`windowEnd` is inclusive and is what the countdown counts to; a window ending today reads **0 days
left** (`Ends today`), not 1. Both dates must be parsed as **local** dates — a UTC parse shifts the
countdown by a day for every user the endpoint already localises for.

### Why the codes cannot be parsed

They are irregular, so a regex or suffix-strip is not a safe way to recover family or order. This is
why v0.71.0 had to add `type` and `tier` rather than have the client infer them:

- `STREAK_3`, `LANGUAGES_3` → `<stem>_<n>`
- `TOTAL_10_HOURS` → `<stem>_<n>_<UNIT>`
- `DAILY_BURST`, `PERFECT_MONTH` → **no number**
- stems differ from the enum's type names: `LANGUAGES_*` vs `LANGUAGE_COUNT`,
  `DAILY_BURST` vs `MAX_DAILY_SECONDS`
- **the number is not even the tier.** `DAILY_BURST` is tier **3** while `DAILY_BURST_4` is tier
  **1**; `PERFECT_MONTH` is tier **5** while `PERFECT_MONTH_50` is tier **1**. The 15 original codes
  were kept byte-for-byte for backward compatibility, so new rungs sort around them.

## Measured sample (test account `langtail`, 2026-09-13)

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
| `PERFECT_MONTH_*` | 32 / 50, 70, 90, 95, 100 | — |

Header on this data: `19 / 67 tiers · 28%`, page renders **14 trophies** (7 lifetime + 7 period).

## Period history: `totalUnlocks` / `periodStreak` (v0.72.0)

Two fields answering "how many periods has this ladder been reached in" and "how many
in a row, ending now".

| Field | Type | LIFETIME value |
| --- | --- | --- |
| `totalUnlocks` | `int` | `unlocked ? 1 : 0` |
| `periodStreak` | `int` | always `0` |

Both are **per rung**, not per ladder: measured, a day ladder reads `13 / 12 / 11` from
its base rung up (`DAILY_TOTAL_1H` / `_2H` / `_4H`), a week ladder `3 / 2 / 0`. The card
shows its **base rung** (`tiers[0]`) — monotone by construction, and the only rung that
still has a value when the current period is unreached, which is the ordinary state
(measured: `unlocked: false` with `totalUnlocks: 13`).

Both are primitive `int` and **always present**, unlike `windowStart`/`windowEnd`. The
schema therefore omits `.default(0)`: a missing key means the contract changed, and
defaulting would silently render "never earned" for every badge.

### Why they are computed from sessions, not counted from unlock rows

The obvious implementation — count `user_achievements` rows per code — measures **how
often the user opened the achievements page**, not how often they achieved anything:

- `insertIfAbsent` has exactly **one** caller (`AchievementService`), reached from
  `evaluate`, which has exactly **one** caller: `getAchievements`, i.e. `GET /achievements`.
- `SyncPushService` calls only `evictCache` after a push — it invalidates, it does not
  evaluate.
- There is no scheduled job or listener that evaluates.

So rows exist only for periods in which the page happened to be opened. The server
recomputes each historical period from `coding_sessions` and takes the **union** with
the stored rows, which also keeps the count monotone: deleting a session cannot lower a
count that was already awarded.

### `periodStreak` is 0 whenever the current period is unmet

`consecutivePeriods` walks back from *today* and stops at the first unmet period, so an
open-but-unmet period yields `0` by construction — the server's stated reason is that a
run "beside a window that is still open" would contradict the `unlocked` flag on the
same card. Expect `0` on any account that has not hit the target this period; it is not
a bug.

## The contract gap — CLOSED in v0.71.0

This section used to describe a workaround: `AchievementResponse` did not project the family, so
the frontend carried a hardcoded `code → family` table (`TROPHY_FAMILIES`) and matched on `code`.

The backend has since projected it, plus the two other fields the requirement asked for:

| Field | Effect |
| --- | --- |
| `type` | Grouping is now data-driven; the hardcoded table was **deleted** (`trophy-model.ts` lost ~130 lines) |
| `tier` | Ladder order is authoritative server-side — no more sorting by code |
| `window` | Tells the client whether progress resets, and distinguishes the five `TOTAL_SECONDS` ladders |
| `windowStart` / `windowEnd` | The concrete local range; used for the window label ("This week") |

`FAMILY_PRESENTATION` in `trophy-model.ts` now holds **only** label / blurb / artwork.

Two behaviours to remember when parsing: the window keys are **absent** (not null) for LIFETIME
badges because Jackson omits nulls — modelled `.nullable().default(null)`, same as `unlockedAt` —
and the schema deliberately keeps `type`/`tier` **required** (a pre-v0.71.0 server would fail to
parse, which is correct: they are needed for grouping).

## Files

| Path | Role |
| --- | --- |
| `src/features/achievements/composables/trophy-model.ts` | Declarations + grouping + progress + ordering |
| `src/features/achievements/components/TrophyMedal.vue` | SVG set + grade paint |
| `src/features/achievements/components/TrophyCard.vue` | Card |
| `src/features/achievements/views/AchievementsView.vue` | Page |
| `src/router/modules/achievements.ts` | Route |
| `src/components/app/AppSidebar.vue` | Nav entry (`Trophy` icon, after Devices) |
