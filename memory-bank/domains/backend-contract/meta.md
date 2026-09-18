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

## Verification baseline

| | |
| --- | --- |
| Checked against source | Whole domain: `../ctt-server` **v0.72.0 – v0.73.0** · last full read 2026-09-14. Leaderboard contracts only: **re-read at v0.77.0 on 2026-09-18** |
| Coverage | Endpoint map, error codes and payload shapes read from controllers and DTOs at v0.72.0–v0.73.0; the leaderboard contract was repaired against live responses at v0.73.0. On 2026-09-18 the leaderboard's seven dimensions, four periods, `LeaderboardResponse` (`totalParticipants`, `currentUserRank`), `LanguageBoardDto.hasMembers` and `LanguageBoardsResponse.languages` were compared against v0.77.0 — all match, no drift |
| Known drift | **Two versions have been followed since the full read** — v0.75.0 (LANGUAGE dimension) and v0.76.1 (catalogue default), both recorded in `progress.md` and reflected in the code. **Everything outside the leaderboard has not been re-read since v0.73.0**: treat those entries as accurate to that version rather than to the running server. |

### Leaderboard re-checked at v0.77.0 (2026-09-18) — no drift

The backend's `leaderboard/` package showed a fresh mtime on every file, so the contract was
re-compared rather than assumed. The mtimes were the v0.75.0/v0.76.1 work this project had already
followed, not new movement: the seven `LeaderboardDimension` constants, the four periods,
`LeaderboardResponse`'s `totalParticipants` and `currentUserRank`, `LanguageBoardDto.hasMembers`
and `LanguageBoardsResponse.languages` all still match the schema in `src/lib/schemas/leaderboard.schema.ts`.

**Scope limit:** that is the leaderboard only. The rest of this domain was last read at v0.73.0 and
has not been verified since — see the baseline table above.

### Leaderboard drift — found, then repaired (2026-09-15)

The first calibration run caught it: `LeaderboardDimension`/`LeaderboardResponse` moved at v0.73.0
(commit `0111900`, "widen dimension coverage") while our schema still encoded the previous matrix —
which we had recorded **correctly** at the time, so this was genuine drift rather than a transcription
error (`0111900^`'s `supports()` matches what we encoded, line for line).

All three items are now fixed in the page (v0.43.0): `ACTIVE_DAYS` added as a sixth dimension; the
period sets widened to what `supports()` allows; `totalParticipants` added to the schema and used for
the next-page decision, which removed the "a full page means maybe more" heuristic and the extra page
it offered on an exact-multiple board.

**Coverage blind spot worth knowing.** The E2E case "never sends a dimension/period pair the server
rejects" walks *our* dimension list, so it proves we send nothing illegal. It cannot detect a
dimension the server **added** — that failure mode is invisible to it by construction.
