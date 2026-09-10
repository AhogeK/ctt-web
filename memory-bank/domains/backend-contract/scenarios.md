# backend-contract — scenarios

## S1. Wiring a new backend endpoint into the frontend

1. **Read the contract** (P1): controller method → DTO record → validation annotations. Note
   defaults, required/optional, and the exact param names.
2. **Write the Zod schema** in `lib/schemas/<domain>.schema.ts`, with `.nullable().default(null)`
   on every optional field (P3). Derive the type with `z.infer` — do not write a parallel type.
3. **Add the API function** in `lib/api/<domain>.ts`, parsing through the envelope schema:
   `RestApiResponseSchema.parse(raw)` then the payload schema.
4. **Add the composable** in `src/composables/` with a query key from the shared key factory and a
   `MaybeRefOrGetter` params signature so reactive filters re-key the query automatically.
5. **Verify against the real backend before UI work**: call the endpoint directly with the same
   params the panel will send (including `timezoneOffset`) and confirm the payload shape.

## S2. "The panel shows numbers that contradict another panel"

1. Classify both statistics first (P2) — time-axis vs categorical. Many "mismatches" are two
   different, both-correct statistics.
2. If they are the *same* family and should agree, compare the **request params** before the code:
   the usual culprit is one panel receiving the date window and the other not (S4).
3. Only after both are ruled out, look at aggregation code — and verify with a direct endpoint
   call rather than by reading the frontend.

## S3. "We need the backend to do something it does not do"

Raise a **requirement text** to the user (R3) — never patch the backend, never fake it in the
frontend. Format:

```
现状       what the backend does today (with the exact endpoint/params you read)
期望行为   what the frontend needs
理由       why the current behaviour cannot be worked around client-side
影响面     which endpoints/services change
前端配合   what the frontend will change once it lands (usually: pass the new param)
```

Precedent: `/stats/distribution` gained `start`/`end` (inclusive, default full history,
`end < start` → 400 `COMMON_003`) exactly this way; the frontend then only had to pass the window.

## S4. "Panel X ignores the filter bar / ignores a window change"

1. Check whether the panel's query params actually carry `start`/`end` — a panel that receives
   only the origin filter will silently stay on full history.
2. Check the query **key** includes the window, otherwise TanStack Query serves the cached
   full-history result and never refetches.
3. Confirm with two direct endpoint calls (windowed vs unwindowed) that the backend honours it
   (P7 — a 200 does not prove the param was used).

## S5. "A response throws a Zod error in production"

1. Read the failing path — most often a missing optional key (P3). Add `.default(null)`.
2. Check for a backend contract change: compare the DTO now vs when the schema was written.
3. Never "fix" it by loosening a schema to `z.unknown()` / `z.any()`; that discards the contract
   check that makes the boundary trustworthy. If the field is genuinely free-form, model it as
   such (`z.string()` with a comment explaining why).

## S6. 401 / 403 / 429 arriving in the app

| Status | Meaning here                                                       | Handling                                                       |
| ------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| 401 `AUTH_002/003` | access token expired                                    | refresh flow; failure → logout                                 |
| 401 `AUTH_010`     | BOLA — another user's resource                           | **never** log the user out; surface a generic message          |
| 401 `USER_014`     | business check on an authenticated user (wrong password) | field-level error, no logout                                   |
| 403                | CSRF token missing/stale                                 | toast + reload (see `practices.md`)                            |
| 429 `RATE_LIMIT_001` | rate limited                                          | honour `Retry-After` header, else the body's timing, else static toast |

The distinction that matters: **resource-level 401 is not a session failure** — whitelist those
codes explicitly (the `USER_014` incident logged users out until it was added).

## S7. Local scripted verification (no browser)

Stats endpoints need an authenticated JWT; writing endpoints additionally need CSRF. See
`practices.md` for the exact sequence, and reuse the fixed test account rather than registering a
new one per run.
