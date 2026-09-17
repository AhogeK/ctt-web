# backend-contract — references

Lookup facts. No judgement here.

## Endpoint map (paths relative to `/api/v1`)

### Stats — `lib/api/stats.ts`, `composables/useStats.ts`

| Endpoint                   | Params                                                        | Returns                                    | Window support |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------ | -------------- |
| `GET /stats/summary`       | `timeRange` (`TODAY|WEEK|MONTH|YEAR|ALL`), `timezoneOffset`, origin filter | 6 fields at once: today / dailyAverage / thisWeek / thisMonth / thisYear / total | n/a (fixed windows) |
| `GET /stats/heatmap`       | `start`, `end`, `timezoneOffset`, origin filter                | dense per-day points incl. zero days       | required (defaults to this year) |
| `GET /stats/heatmap-years` | `timezoneOffset`                                              | `Integer[]` descending, years with real data | n/a            |
| `GET /stats/heatmap-months`| `timezoneOffset`                                              | `String[]` (`yyyy-MM`) descending, months with real data | n/a  |
| `GET /stats/week-hour`     | `start`, `end`, `timezoneOffset`, origin filter                | sparse points + weekday counts             | optional       |
| `GET /stats/hourly`        | `start`, `end`, `timezoneOffset`, origin filter                | per-hour averages + active-day count       | optional       |
| `GET /stats/distribution`  | `type`, `timezoneOffset`, `start`, `end`, origin filter        | `{ type, entries: [{ name, seconds }] }`   | optional (v0.66.0+) |
| `GET /stats/recent`        | `limit` (1–100, default 20), origin filter                     | sessions by start time desc                | **none** — no date params |
| `GET /stats/achievements`  | `timezoneOffset`                                               | 15 badges (7 families × 2–3 tiers)          | n/a — see `achievements` domain |

`type` values: `LANGUAGES`, `PROJECTS`, `TIME_OF_DAY`, `WEEKDAY`, `DEVICES`, `IDES` — entries are
sorted by duration descending.

Two of these carry traps worth knowing before wiring a panel:

- **`/stats/recent` takes no `start`/`end`.** A panel for it cannot follow the filter bar's period;
  it follows the origin filters only. See `dashboard-visualization/references.md`.
- **`/stats/achievements` reports progress per (family, window), not per badge** — every `STREAK_*`
  entry returns the same `progress`. Since v0.71.0 it *does* send `type` and `tier`, so grouping is
  data-driven; full detail in [`achievements`](../achievements/references.md).
- **`/leaderboard` requires `dimension`**, and the legal `period` values depend on it — **since
  v0.73.0** (`LeaderboardDimension.supports()`): six dimensions, of which only `STREAK` is `ALL`-only
  and only `GROWTH` excludes `ALL` (a period-over-period delta cannot rank an unbounded history);
  `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD`/`ACTIVE_DAYS` take every period. An unsupported pair is HTTP 400
  `COMMON_003` — not a quiet fallback.
- `/leaderboard` **scores**: seconds for `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD`, a **count of days** for
  `STREAK` (run length) and `ACTIVE_DAYS` (distinct days with time — `activeDaysIn` counts entries in
  `secondsByDay`, so it is not a duration), and a **signed** delta for `GROWTH`.
- **`/leaderboard/languages`** lists the language boards. The **default returns only boards that have
  members** (v0.76.1 — v0.76.0 briefly returned everything, which made a selector of ~842 rows);
  `?includeEmpty=true` returns the whole vocabulary of 842, where `hasMembers` finally distinguishes
  anything (813 have nobody). Shape `{ languages: [{ name, type, hasMembers }] }`, name-sorted, with
  GitHub Linguist's category. `hasMembers` is one set lookup, not a count per board, so it is cheap
  but **lazy**: a board flips to `true` when somebody is first scored on it, which happens on sync
  push. The client requests the default, so every entry it sees has members.
- **A board can still be empty for the current period**, because the flag is not period-scoped: a
  board with members all-time can have nobody this week. That is the reachable empty state — the
  ranking answers 200 with `totalParticipants: 0`, which is a different fact from "not a language"
  (that is a 400, and the language is simply absent from the catalogue).
- **`totalParticipants` can decrease.** Since v0.76.1, deleting sessions removes the member from the
  board rather than leaving a stale score behind, so a cached count going down is correct, and the
  reader can be left on a page offset that no longer exists.
- **The former `Other` listing defect is fixed.** It used to be possible to receive
  `{"name":"Other","type":"OTHER"}` — repeated once per IDE internal, since `LanguageVocabulary.OTHER`
  is `recognized = true` while the old listing filtered on `recognized` alone — and querying it was a
  400. The list comes from the canonical vocabulary, which is never `OTHER`, and
  `canonical ∩ nonLanguages = ∅` (verified: 842 entries, none `OTHER`; every listed name answers 200).
  There is nothing left to filter client-side.
- `/leaderboard` **response**: `entries`, `currentUserRank`, `totalParticipants` (v0.73.0; a `long`
  primitive, so the key is always present — it is what makes "is there another page" exact).
  `displayName` and `currentUserRank` arrive as **absent keys** (not nulls) for a deleted account and
  an unranked caller, and `rank` is the server's own with ties shared, so it must never be derived
  from the row index.

### Auth / account

| Endpoint                                          | Notes                                                        |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `POST /auth/login`, `/auth/register`              | hCaptcha token required (dev: official test keys)             |
| `GET /users/me`                                   | displayName, email, emailVerified, hasPassword, timestamps    |
| `POST /users/me/password/set`                     | OAuth users only; `USER_015` if already set                   |
| `DELETE /users/me`                                | Body `{password?}` (**base64**). `USER_013` if a password is set and none sent; `USER_014` if it does not match; refuses an API-key session |
| `GET /devices`, `POST /devices`, `DELETE /devices/{id}` | device registry; `revokedAt` marks revocation             |
| `POST /sync/push`, `POST /sync/pull`              | body: `{ deviceId, sessions[] }`; device must exist first     |

### API keys — `lib/api/api-keys.ts`

| Endpoint                        | Notes                                          |
| ------------------------------- | ---------------------------------------------- |
| `GET /auth/api-keys`            | list; `AUTH_010` for a foreign key             |
| `POST /auth/api-keys`           | rate 10/hr, max 20 active; raw key shown once  |
| `DELETE /auth/api-keys/{id}`    | revoke (idempotent)                            |
| `DELETE /auth/api-keys/{id}/delete` | permanent delete, `REVOKED`/`EXPIRED` only |

## Error codes seen in this project

| Code             | HTTP | Meaning                                                     |
| ---------------- | ---- | ----------------------------------------------------------- |
| `COMMON_002`     | 404  | Unknown/foreign resource (device, IDE name)                 |
| `COMMON_003`     | 400  | Validation — includes mutually exclusive origin filters, and `end < start` on windows |
| `AUTH_010`       | 401  | BOLA — another user's resource (never log out)              |
| `AUTH_014`       | 409  | Active API key limit reached (token case retained separately)|
| `AUTH_023`       | 409  | Active key must be revoked before deletion                  |
| `AUTH_024`       | 409  | Maximum active API keys reached                             |
| `USER_014`       | 401  | Business check (wrong current password) — no logout         |
| `USER_013`       | 403  | A password is required and none was supplied                |
| `USER_015`       | 409  | Password already set                                        |
| `AUTH_025`       | 403  | Endpoint refused a session opened with an API key rather than the web app |
| `RATE_LIMIT_001` | 429  | Rate limited; `Retry-After` header when available           |

## Distribution semantics (backend ruling, ctt-server v0.66.0)

- **Time-axis** (`TIME_OF_DAY`): sessions merged/deduped; bucket sum **equals** `summary.total`.
- **Categorical** (`LANGUAGES`, `PROJECTS`, `DEVICES`, `IDES`): raw accumulation; bucket sum
  **≥** real activity because same-second concurrency counts once per category.
- Window params: inclusive `start`/`end`, omitted = full history, `end < start` → 400 `COMMON_003`.
- **Option lists are timezone-resolved and must agree with what they label** (v0.67.0):
  `heatmap-years` and `heatmap-months` both take `timezoneOffset`, are derived from ONE server-side
  source, and define "has data" as *at least one non-zero day after day-splitting* — the same rule
  the heatmap renders with. So a listed window always has something to draw, a listed month always
  belongs to a listed year, and the picker can disable the rest without a second source of truth.
- `timezoneOffset` = minutes east of UTC; boundaries are computed in that zone.

## Local test infrastructure

| Thing                | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| API base             | `http://localhost:8080/ctt-server`                              |
| Swagger              | `http://localhost:8080/ctt-server/swagger-ui`                   |
| Mail capture         | `http://localhost:8025` (mailpit)                               |
| Token helper         | `.sisyphus/get-token.sh <prefix>` prints the access token; `SESSION=1` also prints `REFRESH=` (needed to drive the app in a browser). Persists and reuses an account; `FRESH=1` re-registers. Pick an EXISTING prefix — see `ai-workflow` |
| Device registration  | `POST /devices` requires `deviceId` as a UUID — a plain string returns `COMMON_001` |
| hCaptcha (dev)       | dummy token `10000000-aaaa-bbbb-cccc-000000000001` always verifies |
| CSRF                 | `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header (raw value, no masking) |
