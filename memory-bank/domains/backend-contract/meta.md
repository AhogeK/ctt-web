# backend-contract — meta

## Boundary

How this frontend consumes, verifies and (when needed) negotiates the ctt-server HTTP contract.
Covers the path from "a backend endpoint exists" to "a panel renders its payload correctly".

**In scope**: endpoint contracts (params, payloads, error codes), Zod schemas, the `lib/api/`
boundary, TanStack Query wiring, distribution statistic semantics, raising a requirement against
the read-only backend repo.

**Out of scope**:

- How the data is drawn → [`dashboard-visualization`](../dashboard-visualization/meta.md)
- Auth/session mechanics inside the app (guards, token storage, OAuth UI) → `systemPatterns.md` + `techContext.md`
- The backend's own implementation choices — we read them, we never change them

## Owned paths

| Path                                    | Role                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `src/lib/schemas/*.schema.ts`           | One Zod schema per DTO; types derived with `z.infer`          |
| `src/lib/api/*.ts`                      | The single HTTP boundary; every response parsed through Zod   |
| `src/lib/api/instance.ts`               | ofetch instance, bearer injection, global error handling      |
| `src/lib/query.ts`                      | TanStack Query defaults + query-key constants                 |
| `src/composables/useStats.ts`           | Stats query composables (`MaybeRefOrGetter` params)           |
| `src/lib/utils/api-error.ts`            | Error-code → user-facing message mapping                      |

## Read-only counterpart

`../ctt-server` (Spring Boot 4) is **read-only**: its controllers, DTOs and services are the
source of truth to be read, never edited. Capability gaps are raised as a requirement text
(see `scenarios.md` S3), not patched locally.

## Terminology

| Term                      | Meaning                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| Envelope                  | The `RestApiResponse<T>` wrapper every endpoint returns (`success/data/code/message`) |
| Contract-first            | Read the controller + DTO before writing any schema or call                  |
| Time-axis distribution    | Buckets are real time; overlapping sessions merge; sum must equal `summary.total` |
| Categorical distribution  | Buckets are independent categories; concurrency accumulates; sum ≥ activity   |
| Window                    | Inclusive `start`/`end` date range (`yyyy-MM-dd`); omitted = full history     |
| `timezoneOffset`          | Minutes east of UTC, sent on stats requests so the server buckets in the user's local zone |
| Origin filter             | `deviceId` or `ideName`, mutually exclusive (both → 400 `COMMON_003`)        |
| BOLA                      | Broken-object-level-authorization case: another user's resource → `AUTH_010` |

## Where to start

- Adding an endpoint or fixing a payload → `scenarios.md` S1/S2, then `practices.md`
- Deciding what a statistic *means* → `principles.md` P2
- Looking up a path, error code or test address → `references.md`
