# backend-contract — practices

## Schema + API + composable (the shape every endpoint follows)

```ts
// lib/schemas/stats.schema.ts — optional field MUST default (P3)
export const DistributionEntrySchema = z.object({ name: z.string(), seconds: z.number().int().nonnegative() })
export const DistributionResponseSchema = z.object({ type: DistributionTypeSchema, entries: z.array(DistributionEntrySchema) })

// lib/api/stats.ts — the single HTTP boundary, parsed
export async function getStatsDistribution(type: DistributionType, params: StatsFilterParams = {}) {
  const raw = await apiFetch<unknown>('/api/v1/stats/distribution', {
    method: 'GET',
    query: { type, timezoneOffset: timezoneOffset(), ...filterQuery(params) },
  })
  return DistributionResponseSchema.parse(RestApiResponseSchema.parse(raw).data)
}

// composables/useStats.ts — reactive params drive the query key
export function useStatsDistribution(type: DistributionType, params: MaybeRefOrGetter<StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => STATS_QUERY_KEYS.distribution(type, toValue(params))),
    queryFn: () => getStatsDistribution(type, toValue(params)),
    staleTime: 1000 * 30,
  })
}
```

Written-param conventions:

- `filterQuery()` transmits `deviceId`, `ideName`, `start`, `end` — only when present.
- `timezoneOffset()` = `-new Date().getTimezoneOffset()` (minutes east of UTC), computed per request.
- `timeRange` (the `summary` endpoint) is a fixed enum of windows; `summary` returns all six
  fields at once, so it does **not** take `start`/`end`.

## Direct endpoint verification (before writing any UI)

```bash
TOKEN=$(bash .sisyphus/get-token.sh <prefix> | tail -1)          # reuses a persisted account
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/ctt-server/api/v1/stats/distribution?type=LANGUAGES&timezoneOffset=480"
```

- Always send `timezoneOffset` — omitting it silently buckets in UTC and produces confusing results
  (a 23:00 UTC session lands in the next day's morning bucket locally).
- Prove a window param works by **two contrasting calls** (windowed vs unwindowed); Spring returns
  200 for unknown params (P7).

## Scripted writes need CSRF + a registered device

1. `GET` any CSRF-checked endpoint to receive the `XSRF-TOKEN` cookie.
2. Replay it as the `X-XSRF-TOKEN` header (the project uses `CsrfTokenRequestAttributeHandler`, so
   the header value equals the cookie value — no XOR masking).
3. `POST /api/v1/devices` to register the `deviceId` **before** `POST /api/v1/sync/push`;
   pushing with an unregistered device → 404 `COMMON_002`.

```bash
JAR=/tmp/jar; curl -s -c $JAR -o /dev/null -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/ctt-server/api/v1/stats/summary?timeRange=TODAY"
XSRF=$(awk '/XSRF-TOKEN/ {print $7}' $JAR)
curl -s -b $JAR -X POST ".../api/v1/sync/push" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" --data @payload.json
```

## Seeding realistic test data

- Generate session times in **local time, then convert to UTC** — the server buckets by local hour,
  so a UTC-generated "23:00" night session is really next-day 07:00 and lands in Morning.
- Cover the boundaries deliberately: an hour-straddling session (e.g. 11:00–13:00) and a
  midnight-crossing one (23:50–00:10) exercise the bucket-splitting semantics.
- Reuse the fixed account (`get-token.sh <prefix>`); `FRESH=1` only when you truly need a clean one.

## Error handling at the boundary

```ts
// instance.ts — resource-level 401 must NOT become a logout
const RESOURCE_401 = new Set(['AUTH_010', 'USER_014'])   // BOLA + business check
```

- `onResponseError`: 401 → refresh or surface; 403 → CSRF toast + reload; 500 → generic toast.
- Map codes in `lib/utils/api-error.ts`; keep unmapped codes on a neutral fallback message.
- Never surface a raw backend string when a mapped message exists — the mapping is the product
  decision, and it is where i18n will later hook in.

## Query keys

- One factory (`STATS_QUERY_KEYS`) per endpoint family: every parameter that changes the answer
  belongs in the key, otherwise cached data leaks across filters.
- Mutations invalidate their family on success; queries keep `retry: 1` (fail fast, surface errors).
- Long-lived data (e.g. the list of years that have data) may use a longer `staleTime`; live
  aggregates stay short (~30s).
