# backend-contract — practices

## Schema + API + composable (the shape every endpoint follows)

```ts
// lib/schemas/stats.schema.ts — optional field MUST default (P3)
export const DistributionEntrySchema = z.object({ name: z.string(), seconds: z.number().int().nonnegative() })
export const DistributionResponseSchema = z.object({
  type: DistributionTypeSchema,
  entries: z.array(DistributionEntrySchema),
})

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

## 设备与 IDE（2026-10-26 Accepted）

- `deviceId` 是安装级身份；禁止按 IDE 拆分设备，禁止建 `device_ides` 子表。
- IDE 属于会话：会话带 `ideName`/`ideVersion`；设备字段只作旧数据回退/最近值投影。
- 统计按会话 IDE 筛选；设备页只显示最近 IDE；`DeviceResponse` 字段名不变。

## 账号与安全接线（2026-10-28 · v0.70.1 Accepted）

- **导出的 401 拿不到错误码**：ofetch 的 `responseType` 对成功体与错误体一视同仁，且**每请求的
  `onResponseError` 会顶掉全局钩子**（`resolveFetchOptions` = `{...defaults, ...input}`）⇒ 用 blob 下载时
  错误体也是 blob ⇒ `getErrorCode` 读不出码 ⇒ 落到 `handle401Error(null)` 的「清令牌 + 登出」安全兜底，
  **不是**刷新后重试。要兼得需让 `getErrorCode` 异步支持 Blob，或给导出单独的 401 处理。
- **blob 请求只能按 status 分支，不能按错误码**：错误体也是 blob ⇒ `提取的 code` 永远是 undefined
  （实例：导出把 429 写成 `code === 'RATE_LIMIT_001'` ⇒ 该分支**不可达**，用户只看到通用失败文案 ✗）。
  `401` 交给拦截器（清会话 + 跳登录），其余按 `statusCode` 决定文案 ✓。
- **429 一律读服务端给的 `Retry-After`，不要自己猜窗口**：限流是**固定窗口**，响应头里就是剩余秒数；
  首版批量撤销硬等一小时 ⇒ 把人挡了最久的一小时 ✗。`getRetryAfterSeconds()`（`lib/utils/api-error.ts`）
  已同时读头与响应体的 `retryAfter`；只有拿不到时才回退到窗口长度，并把截止时间持久化 ✓。
- **导出文件名有两个来源，别统一**：服务端 `Content-Disposition` 给的是**带连字符**的
  `ctt-export-2026-07-09.json`；我们自己的兜底（响应没有该头）是紧凑的 `ctt-export-<yyyyMMdd>.json`。
- **会话列表是裸数组**（`RestApiResponse.data` 里直接是数组），不是 `{ sessions: [...] }`。
- 显示名校验**复用注册正则**（`REGEX_DISPLAY_NAME`，定义在 `auth.schema.ts`）—— 前后端同一条规则，
  前端拒掉的名字服务端也会拒。`z.uuid()` 在 zod v4 **校验版本位** ⇒ 测试夹具要用合法 v4 UUID。
