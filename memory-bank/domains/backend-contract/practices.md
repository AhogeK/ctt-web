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
- **口令字段一律 base64**：`/auth/register`、`/auth/login`、`/users/me/2fa/totp/start` 的 `currentPassword` 都是先
  base64 再上送的字符串，服务端直接 `passwordEncoder.matches` 比对 ⇒ 传明文得 `USER_014`「Invalid password」（2026-11-01 实测）。
  新增加密类端点前先看前端有没有 `encodeBase64` 那一层。
- **`otpauth://` 只有验证器 App 认**：相机、相册、微信「识别二维码」扫出来会报「无法扫描此二维码」——
  它们只处理 http(s) 链接。同一台手机上也无法扫自己的屏幕 ⇒ 界面必须同时给「复制密钥」与「在验证器应用中打开」，
  文案要写明用验证器里的扫描功能 ✓（2026-11-02 用户真机踩到）。
- **TOTP 密钥：服务端已修（v0.89.1）⇒ 32 字符、无填充**（2026-11-02）：根因**不是部署漂移**，而是 `SecretGenerator.generate(160)`
  返回的已是 Base32 字节，`TotpService` 又编码了一次 ⇒ 20 字节 → 52 字符 + `====`；改成「20 个随机字节 + 编码一次」后固定 32 字符。
  前端因此**不应假设** 52 字符、也**不必**去填充（保留去填充作防御即可）；二维码直接用 `otpauthUri`，**不改 issuer / secret**
  （`issuer` 在 Key URI Format 里是 strongly recommended）。旧账号需 `disable → start → confirm` 重新绑定，恢复码全部换新。
- **2FA 状态自带分支依据**：`GET /users/me/2fa` 返回 `hasPassword` / `recentAuthentication` ⇒ 界面据此决定开启向导要不要密码框、
  以及按钮是否可用（OAuth-only 且会话不新时会得 `AUTH_031`）—— 不要在客户端自己推断账号有没有口令 ✓。
- **近期认证的窗口是 10 分钟**（`ctt.security.two-factor.recent-authentication-window`，默认 `10m`）：OAuth-only 账号超过这个
  时间就**开不了** 2FA（`AUTH_031`）⇒ 界面必须给出「重新登录」的出路，只把按钮置灰等于把人卡死 ✗。
- **开启两步验证要先验身份**：带口令的账号必须传 `currentPassword`（缺 ⇒ `USER_013`），OAuth-only 账号才走「近期认证」判定；
  没有这一步，被劫会话可以绑上攻击者自己的验证器。恢复码固定 **10 串**、形如 `A1B2-C3D4-E5F6-G7H8`，只在确认时返回一次 ✓
- **`getActiveUserRequired()` 接受 API key**：`getCurrentUser()` 会把 `ApiKeyPrincipal` 换成它所属的用户 ⇒
  「只限登录会话」的端点必须**显式**判 `CurrentUser.AuthenticationType.WEB_SESSION`（现状只有 `DELETE /users/me` 这么做，
  `AUTH_025` 全仓仅此一处抛出）⇒ 别以为带 `@RequiresApiKeyScope` 就挡住了 API key ✗。
- **429 一律读服务端给的 `Retry-After`，不要自己猜窗口**：限流是**固定窗口**，响应头里就是剩余秒数；
  首版批量撤销硬等一小时 ⇒ 把人挡了最久的一小时 ✗。`getRetryAfterSeconds()`（`lib/utils/api-error.ts`）
  已同时读头与响应体的 `retryAfter`；只有拿不到时才回退到窗口长度，并把截止时间持久化 ✓。
- **导出文件名有两个来源，别统一**：服务端 `Content-Disposition` 给的是**带连字符**的
  `ctt-export-2026-07-09.json`；我们自己的兜底（响应没有该头）是紧凑的 `ctt-export-<yyyyMMdd>.json`。
- **会话列表是裸数组**（`RestApiResponse.data` 里直接是数组），不是 `{ sessions: [...] }`。
- 显示名校验**复用注册正则**（`REGEX_DISPLAY_NAME`，定义在 `auth.schema.ts`）—— 前后端同一条规则，
  前端拒掉的名字服务端也会拒。`z.uuid()` 在 zod v4 **校验版本位** ⇒ 测试夹具要用合法 v4 UUID。

## 通行密钥（2026-11-03 · v0.75.0 Accepted）

- 端点与限流：`POST /auth/passkey/{options,assert}` 匿名（取挑战 30 / 断言 20 次每 5 分钟每 IP）；
  管理面 `POST|GET /users/me/passkey`、`POST /users/me/passkey/options`、`PATCH|DELETE /users/me/passkey/{id}`。
- 断言成功返回**与密码登录相同**的响应，**不进入第二步**（通行密钥本身就是两因素）。
- 第二步来源两处：登录 `202` 的 `data.passkeyCount`（恒在，`0` = 隐藏入口）、OAuth fragment 的 `passkeyCount=`；
  `/auth/login/2fa/passkey/{options,assert}` 带 `challengeToken`，断言**原样**带 `allowCredentials`（挑战已绑定账号）。
- 失败语义：`AUTH_032` 只消费浏览器挑战（`challengeToken` 仍可换用验证码），成功后 `challengeToken` 作废（`AUTH_026` 整步过期）。
- 管理面需要近期认证（`AUTH_031`，10 分钟窗口）；`AUTH_018` = 不能删最后一条登录路径；两个登录端点**不带验证码**。
- 删除最后一把后必须清本地「用过通行密钥」标记，否则登录页每次开一个空选择器。

## 刷新令牌只在 Cookie（2026-11-04 · 后端 0.91.2）

- `POST /auth/refresh` 的请求体**可为空**（`@RequestBody(required = false)`），令牌读取顺序是
  **Cookie 优先**：`ctt_refresh_token`（HttpOnly · Secure · SameSite=Strict · Path 只到刷新端点），其次才是 body 字段。
- 响应体仍给 `refreshToken`，但前端**不存**：存一份等于把 httpOnly 凭据复制成脚本可读的。
- 令牌**单次使用**：两个标签各花一次 ⇒ 服务端判重放 `AUTH_009`，可能撤销该账号全部刷新令牌 ⇒ 跨标签必须串行（`navigator.locks`）。
- 错误语义：`400 COMMON_003`（Cookie 与 body 都没有）、`401 AUTH_003/007`、`403 AUTH_009`（重放，勿自动重试）、
  `429 RATE_LIMIT_001`（120 次/小时/IP，按 `Retry-After` 退避，**不要**当成会话失效）。
