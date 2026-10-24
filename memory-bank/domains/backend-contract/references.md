# backend-contract — references

Lookup facts. No judgement here.

## Endpoint map (paths relative to `/api/v1`)

### Stats — `lib/api/stats.ts`, `composables/useStats.ts`

- `GET /stats/summary` — `timeRange` (`TODAY — WEEK — MONTH — YEAR — ALL`), `timezoneOffset`, origin filter — 6
  fields at once: today / dailyAverage / thisWeek / thisMonth / thisYear / total — n/a (fixed windows)
- `GET /stats/heatmap` — `start`, `end`, `timezoneOffset`, origin filter — dense per-day points incl. zero days —
  required (defaults to this year)
- `GET /stats/heatmap-years` — `timezoneOffset` — `Integer[]` descending, years with real data — n/a
- `GET /stats/heatmap-months` — `timezoneOffset` — `String[]` (`yyyy-MM`) descending, months with real data — n/a
- `GET /stats/week-hour` — `start`, `end`, `timezoneOffset`, origin filter — sparse points + weekday counts — optional
- `GET /stats/hourly` — `start`, `end`, `timezoneOffset`, origin filter — per-hour averages + active-day count —
  optional
- **2026-10-14 修正 `hourly.activeDays`**：按「当天有编码即计一天」（跨本地午夜的会话计两天）——深夜用户数值变小属
  修正、非回归；`hourly-days` 与它恒等。
- `GET /stats/hourly-days` — `start`, `end`, `timezoneOffset`, origin filter — `{ days: [{ date, hourlySeconds[24] }],
  activeDays }`；最多最近 31 个活跃日、升序；`activeDays` 不受截断影响 — 新端点（2026-10-14 上线；前端 0.58.0 起接入淡灰日曲线）
- **两套分母口径不同（2026-10-14 回源核对）**：`hourly` ÷ 窗口内**活跃天数**（有编码的天）；`week-hour` ÷ 该星期几的
  **日历出现次数**（"该格本可被使用的次数"）⇒ 两个端点的曲线**不可直接叠画**（会把"每天平均"与"每个星期几平均"两个
  问题混在一张图上）；若做叠加需统一口径或新端点形状（需求草稿已出，2026-10-14）。
- `GET /stats/distribution` — `type`, `timezoneOffset`, `start`, `end`, origin filter —
  `{ type, entries: [{ name, seconds }] }` — optional (v0.66.0+)
- `GET /stats/recent` — `limit` (1–100, default 20), origin filter — sessions by start time desc — **none** — no
  date params
- `GET /stats/achievements` — `timezoneOffset` — 15 badges (7 families × 2–3 tiers) — n/a — see `achievements` domain

`type` values: `LANGUAGES`, `PROJECTS`, `TIME_OF_DAY`, `WEEKDAY`, `DEVICES`, `IDES` — entries are
sorted by duration descending.

Two of these carry traps worth knowing before wiring a panel:

- **`/stats/recent` takes no `start`/`end`.** A panel for it cannot follow the filter bar's period;
  it follows the origin filters only. See `dashboard-visualization/references.md`.
- **`/stats/achievements` reports progress per (family, window), not per badge** — every `STREAK_*`
  entry returns the same `progress`. Since v0.71.0 it *does* send `type` and `tier`, so grouping is
  data-driven; full detail in [`achievements`](../achievements/references.md).
- **`/leaderboard` requires `dimension`**, and the legal `period` values depend on it — **since
  v0.85.0**: every dimension accepts `ALL`/`WEEK`/`MONTH`/`QUARTER`/`HALF_YEAR`/`YEAR` except `GROWTH`,
  which rejects `ALL` (a period-over-period delta cannot rank an unbounded history) — that is now the
  **only** illegal pair, still HTTP 400 `COMMON_003`. `STREAK`'s windowed score is the longest run
  **fully inside** the window (v0.85.0; `ALL` keeps the lifetime key and semantics).
- `/leaderboard` **scores**: seconds for `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD`, a **count of days** for
  `STREAK` (run length) and `ACTIVE_DAYS` (distinct days with time — `activeDaysIn` counts entries in
  `secondsByDay`, so it is not a duration), and a **signed absolute** delta for `GROWTH`
  (`this period − previous period`, seconds). Because it is absolute, a small relative improvement on
  a heavy history outranks a doubling from a tiny one: it ranks prior volume, so the page does not
  offer it (decision 2026-10-23; the endpoint is unchanged).
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

- `POST /auth/login`, `/auth/register` — hCaptcha token required (dev: official test keys)
- `GET /users/me` — displayName, email, emailVerified, hasPassword, timestamps
- `POST /users/me/password/set` — OAuth users only; `USER_015` if already set
- `DELETE /users/me` — Body `{password?}` (**base64**). `USER_013` if a password is set and none sent; `USER_014`
  if it does not match; refuses an API-key session
- `GET /devices`, `POST /devices`, `DELETE /devices/{id}` — device registry; `revokedAt` marks revocation
- `POST /sync/push`, `POST /sync/pull` — body: `{ deviceId, sessions[] }`; device must exist first

### Auth / account — 阶段六（最终契约 2026-10-19 · ctt-server **v0.83.0 已实现**，部署待通知）

R1–R3 implemented and merged in ctt-server v0.83.0 (2026-10-19); **deployment pending — wire only after
their「端点已可用」notice.** This section is the final, current wording (it supersedes every earlier
round's export-shape / `timezoneOffset` / error-code notes).

- `PATCH /users/me` — body `{ displayName }` → 200 `UserProfileResponse` (same shape as `GET /users/me`).
  Validation = registration rule (2–50; CJK/kana/hangul/latin/digit/`_`/`-`); **same name = success (no
  write)**; errors `400 COMMON_003` / `403 AUTH_022` / `403 AUTH_020` (API-key caller) / `401`; rate 10/hr;
  **no uniqueness on displayName**. Sync local state from the response — no second `GET /users/me`.
- `GET /users/me/sessions?limit=20` (max 100, rate 60/hr) → `{ sessions: [{ id, kind, deviceName, ideName,
  userAgent, createdAt, lastUsedAt, expiresAt, current }] }`, **sorted by `lastUsedAt` desc**; `kind` =
  `WEB` | `PLUGIN` (deviceName/ideName only on PLUGIN; `userAgent` is on both — ignore it for PLUGIN rows);
  `userAgent` = raw header, nullable, truncated to 512, **not parsed server-side** (the web client derives
  the display label itself), stable across refresh rotation; `createdAt` = first login of the session,
  `lastUsedAt` = last refresh, **nullable (`null` = never refreshed)**; nullable keys are **always present**
  (value `null`) — that distinguishes "no device" from "unknown field"; **`current` is server-decided** —
  never send a refresh token to compare, and it is always `false` for an API-key caller; one login = one
  row (refresh/rotation does not add rows); rows carry **no `deviceId`** (a future session→device link
  would add it, no migration).
- `DELETE /users/me/sessions/{id}` (rate 10/hr) → 204; `404 COMMON_002` when not yours/absent (does not
  reveal whether someone else's session exists). Deleting the current session = logout (clear tokens, go
  to login). A kicked client gets **`401 AUTH_003`** on its next refresh (the earlier `AUTH_008` wording
  is void), other sessions of the account stay unaffected; already-issued access tokens keep a
  ≤15-minute window (same tradeoff as logout). **Wording trap:** the general message map uses `AUTH_003`
  for "reset link invalid" — the session flow must go through the terminal path (clear + redirect), never
  that map's copy.
- `GET /users/me/export?timezoneOffset=<minutes>` — **`timezoneOffset` is mandatory** (range ±720; missing
  or out of range → `400 COMMON_003`; value = `-new Date().getTimezoneOffset()`, UTC+8 → `480`), rate
  3/hr. Returns `200 application/json;charset=UTF-8` — **one JSON document** (not NDJSON, no
  `RestApiResponse` envelope), `Content-Disposition: attachment; filename="ctt-export-<yyyyMMdd>.json"`;
  **save the bytes as-is** (no `JSON.parse` → re-serialize, never drop `sessions`). Top level:
  `exportVersion` ("1.0") / `exportTime` / `totalSessions` / `sessions[]` (the plugin's import format,
  field-for-field) / `serverExport{}` (account, devices, dailyStats, achievements, achievementProgress,
  oauthAccounts, loginSessions, apiKeys — metadata only, no credentials). **All timestamps are local
  time with no zone** (the plugin parses them as local; a `Z` makes its whole import fail); the only
  exception is `serverExport.generatedAt` (UTC). **Soft-deleted sessions are NOT exported** (including
  them would "resurrect" deleted rows on plugin import). Empty values are **`""`, not `null`**. No async
  task (whole DB ≈ 707 kB); upgrade trigger = >10 MB per user or p95 >5 s.
- Login sessions and `/devices` stay separate endpoints (devices = sync subjects, sessions = credentials).
- Refresh vs revoke are **serialized per session** server-side ("kicked = dead" even if a kick races a
  refresh; the existing logout endpoint is covered too). JWT covers all three endpoints; with an API key
  they need WRITE (display name) / READ (sessions, export) — the web client uses JWT.
- Backend-found defect, fixed with R2: plugin sessions were recorded as web sessions with a 30-day expiry
  (the configured 14-day plugin TTL was never used).

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

- API base — `http://localhost:8080/ctt-server`
- Swagger — `http://localhost:8080/ctt-server/swagger-ui`
- Mail capture — `http://localhost:8025` (mailpit)
- Token helper — `.sisyphus/get-token.sh <prefix>` prints the access token; `SESSION=1` also prints `REFRESH=`
  (needed to drive the app in a browser). Persists and reuses an account; `FRESH=1` re-registers. Pick an EXISTING
  prefix — see `ai-workflow`
- Device registration — `POST /devices` requires `deviceId` as a UUID — a plain string returns `COMMON_001`
- hCaptcha (dev) — dummy token `10000000-aaaa-bbbb-cccc-000000000001` always verifies
- CSRF — `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header (raw value, no masking)

## Summary comparisons (ctt-server v0.78.0 · 2026-10-12)

- `GET /stats/summary` gained an **always-present** five-key `comparisons` object:
  `previousSeconds` (long; seconds per day for `dailyAverage`) + `changePercent`
  (number, 2 dp, `null` when the baseline is 0 or `dailyAverage`'s first day;
  `total` absent by design; keys never omitted — `@JsonInclude(ALWAYS)`).
- The web client parses it as **optional**: an older backend omits the object and the
  cards render without captions (zero change).
- Live-verified: seeded yesterday 1h + today 1.5h → `+50 / +25 / +50 / null / null`.
- **No server-side result cache exists on `/stats/*`** — the 60/min limit is a rate
  window, not freshness; `useStats.ts`'s old "server's 60s cache" comment was fixed in
  v0.56.0 (staleTime is purely a client-side choice).
