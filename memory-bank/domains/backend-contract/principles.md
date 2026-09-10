# backend-contract — principles

## P1. The backend source is the contract; reading it is mandatory

Never infer a payload shape, a param name, a default or an error code from a similar endpoint or
from memory. Before writing a schema:

1. read the controller method (params, defaults, validation),
2. read the DTO/record (field names, nullability),
3. read the service only when the *semantics* (not the shape) are in question.

Related projects are read-only. If the contract is wrong or missing, raise a requirement — do not
work around it silently.

*Evidence*: a distribution panel shipped a "stale window" behaviour that read as a data bug; the
controller signature showed the endpoint simply had **no** `start`/`end` params at that time, and
unknown query params are silently ignored by Spring — so the frontend could never have fixed it.

## P2. Know which statistic you are looking at (conservation vs accumulation)

| Family        | Examples                                  | Overlap handling                        | Bucket sum                     | Total readout        |
| ------------- | ----------------------------------------- | --------------------------------------- | ------------------------------ | -------------------- |
| **Time-axis** | time-of-day, heatmap, trend, hourly        | merge/dedupe — concurrency is one activity | **== `summary.total`**         | Show it, as a cross-check |
| **Categorical** | languages, projects, devices, IDEs       | raw accumulation — concurrency is real  | **≥ real activity** (super-linear) | Never show it        |

A categorical bucket sum printed as a "Total" invites a false bug report; a time-axis panel
without conservation is a real bug. Decide the family **before** touching numbers.

*Backend ruling (ctt-server v0.66.0)*: "时间轴分布必须守恒恒等，分类分布必然超线性."

## P3. Nullability is a backend fact, not a frontend preference

ctt-server sets `jackson.default-property-inclusion: non_null`, so absent optional fields arrive
as **missing keys**, not `null`. Every optional DTO field must be
`.nullable().default(null)` (or an equivalent default) in its Zod schema — otherwise a valid
response throws `expected string, received undefined` at the network boundary.

*Evidence*: fresh API keys have no `lastUsedAt`/`revokedAt`; `.nullable()` alone broke key creation
until every optional field gained `.default(null)`.

## P4. One HTTP boundary, one validation point

Components never call `ofetch` directly. The path is always:
`component → composable (TanStack Query) → lib/api/<domain>.ts → apiFetch → Zod .parse()`.
Types are **derived** from schemas (`z.infer`), never hand-written alongside them — a hand-written
type drifts silently, a derived one cannot.

## P5. Error codes are the API; messages are the mapping

Business failures arrive as an envelope with `code` (e.g. `AUTH_024`, `RATE_LIMIT_001`,
`COMMON_003`). Read `error.data.code` — never `error.error`. Map codes to user-facing text in
`lib/utils/api-error.ts`; each mapping is a documented product decision, and unmapped codes must
fall back to something honest rather than leak the raw code.

## P6. Performance-sensitive semantics belong to the caller

`timezoneOffset` is computed per request from the browser; the window (`start`/`end`) is owned by
URL state and passed down. A panel that hardcodes either of these is a bug waiting for a
timezone or a preset change — filter state has exactly one owner (`useDashboardFilters`).

## P7. A silent 200 can still be a wrong answer

Spring ignores unknown query params, so a request with a parameter the endpoint does not support
returns **200 with full-history data**. Always confirm behaviour with two contrasting requests
(e.g. windowed vs unwindowed) before concluding a parameter works. A plausible-looking 200 is not
proof.
