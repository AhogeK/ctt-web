# backend-contract — references

Lookup facts. No judgement here.

## Endpoint map (paths relative to `/api/v1`)

### Stats — `lib/api/stats.ts`, `composables/useStats.ts`

| Endpoint                   | Params                                                        | Returns                                    | Window support |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------ | -------------- |
| `GET /stats/summary`       | `timeRange` (`TODAY|WEEK|MONTH|YEAR|ALL`), `timezoneOffset`, origin filter | 6 fields at once: today / dailyAverage / thisWeek / thisMonth / thisYear / total | n/a (fixed windows) |
| `GET /stats/heatmap`       | `start`, `end`, `timezoneOffset`, origin filter                | dense per-day points incl. zero days       | required (defaults to this year) |
| `GET /stats/heatmap-years` | —                                                             | `Integer[]` descending, years with real data | n/a            |
| `GET /stats/week-hour`     | `start`, `end`, `timezoneOffset`, origin filter                | sparse points + weekday counts             | optional       |
| `GET /stats/hourly`        | `start`, `end`, `timezoneOffset`, origin filter                | per-hour averages + active-day count       | optional       |
| `GET /stats/distribution`  | `type`, `timezoneOffset`, `start`, `end`, origin filter        | `{ type, entries: [{ name, seconds }] }`   | optional (v0.66.0+) |

`type` values: `LANGUAGES`, `PROJECTS`, `TIME_OF_DAY`, `WEEKDAY`, `DEVICES`, `IDES` — entries are
sorted by duration descending.

### Auth / account

| Endpoint                                          | Notes                                                        |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `POST /auth/login`, `/auth/register`              | hCaptcha token required (dev: official test keys)             |
| `GET /users/me`                                   | displayName, email, emailVerified, hasPassword, timestamps    |
| `POST /users/me/password/set`                     | OAuth users only; `USER_015` if already set                   |
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
| `USER_015`       | 409  | Password already set                                        |
| `RATE_LIMIT_001` | 429  | Rate limited; `Retry-After` header when available           |

## Distribution semantics (backend ruling, ctt-server v0.66.0)

- **Time-axis** (`TIME_OF_DAY`): sessions merged/deduped; bucket sum **equals** `summary.total`.
- **Categorical** (`LANGUAGES`, `PROJECTS`, `DEVICES`, `IDES`): raw accumulation; bucket sum
  **≥** real activity because same-second concurrency counts once per category.
- Window params: inclusive `start`/`end`, omitted = full history, `end < start` → 400 `COMMON_003`.
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
