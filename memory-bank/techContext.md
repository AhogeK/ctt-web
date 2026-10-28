# Tech Context: ctt-web

## Core Stack

| Layer         | Technology                             | Version      |
| ------------- | -------------------------------------- | ------------ |
| Build         | Vite+ (unified toolchain via `vp` CLI) | latest       |
| Framework     | Vue 3 + TypeScript Strict              | ^3.6 (beta)  |
| TypeScript    | TypeScript 6.0.3                       | 6.0.3 (exact)|
| Routing       | Vue Router                             | ^5           |
| Server State  | TanStack Query                         | ^5           |
| Global State  | Pinia                                  | ^3           |
| UI            | Radix Vue (reka-ui) + shadcn-vue       | latest       |
| Styles        | Tailwind CSS + @tailwindcss/vite       | ^4           |
| Charts        | Apache ECharts + vue-echarts           | ^6 / ^8      |
| HTTP          | ofetch                                 | ^1           |
| Validation    | Vee-Validate + Zod                     | ^4 / ^4.3.6  |
| Icons         | @iconify/vue (migrated from lucide-vue-next v0.10.5) | ^5 |
| i18n          | Vue I18n                               | ^11          |
| Captcha       | @hcaptcha/vue3-hcaptcha (`hl` follows UI) | ^1        |
| Package Mgr   | pnpm (standalone `~/Library/pnpm`)     | 12.11.2      |
| Design System | DESIGN.md                              | Linear-style |

## Dev Toolchain (Vite+ Unified)

- `vp` CLI (dev/build/test/lint/fmt), Playwright (E2E), vue-tsc (type check), simple-git-hooks + lint-staged
  (pre-commit)

**Package commands go through `vp`, not `pnpm`** — Vite+ wraps package management too:

| Task | Command |
| --- | --- |
| Add | `vp add <pkg>` |
| Remove | `vp remove <pkg>` |
| Install everything | `vp install` (or `vp i`) |
| Why is this dependency here | `vp why <pkg>` |
- **`pnpm check:i18n`** — scans app source for Chinese literals, compares the en/zh catalogue key sets and
  rejects hard-coded `en-US` date formatting (`scripts/check-i18n.mjs`); run it after every migration batch.
- **The `enableGlobalVirtualStore` drift warning was a lockfile/toolchain version skew** (root-caused 2026-09-26,
  **resolved 2026-10-11**): the lockfile was pnpm-11-era (`packageManagerDependencies: pnpm@11.18.0`) while installs
  ran pnpm 12, so pnpm 12 compared its `enableGlobalVirtualStore` default against a tree that never recorded it and
  warned on every `pnpm run`/`pnpm exec`. Fix shipped in one `chore(deps)` change: the lockfile was regenerated and
  `packageManager: pnpm@12.10.1` recorded in `package.json` — lockfile, README and this snapshot all read 12 now.

- **pnpm 跟随最新，不是"固定"（2026-10-13 用户澄清 ✓）**：`packageManager` 的版本与 lockfile 的对应记录随**用户自行升级**推进
  （12.10.1 → 12.11.2，2026-10-13）；提交与汇报的措辞用"升级到 X / 保持最新"，**不要写成"固定 / pin"** ✗。

- **`pnpm-workspace.yaml` is the settings file** — not `.npmrc`, which pnpm does not read for
  `verify-deps-before-run`. `allowBuilds` holds the build-script decisions (`msw`, `simple-git-hooks`, `vue-demi`);
  `verifyDepsBeforeRun: warn` stops `pnpm run`/`pnpm exec` from implicitly installing — the only path that could
  write a non-boolean placeholder into this tracked file — while still reporting genuine drift. `error` blocks the
  write too, but fails *every* script after a lone version bump (that alone flips the workspace-state hash), so it
  does not survive contact with a release step. Runtime state lives in `node_modules/.modules.yaml`
  (`pendingBuilds`, `allowBuilds`). **Consequence, verified 2026-09-20**: any `package.json` change flips the
  workspace-state hash (a version bump does it; so does removing a config block), so the next
  `pnpm run`/`pnpm exec` — i.e. every pre-commit — prints
  `Your node_modules are out of sync with your lockfile. The workspace structure has changed since last install`.
  It is **drift reporting, not a broken install**; `vp install` re-records the state and clears it (output
  `Lockfile is up to date · Already up to date`, so it adds nothing), and the tree stays clean. Measured: warning 1
  → 0, `node_modules/.modules.yaml` Sep 18 → Sep 20, `git status` 0 items.
- Snapshot (2026-10-27, after `vp update -L`): **vite-plus + vite `1.4.0`** (bundled vite 8.3.5 /
  rolldown 1.2.15 / oxc 0.155.0), typescript 6.0.3 (exact), vitest + @vitest/coverage-v8 5.0.5,
  vue-tsc 3.3.13, @lucide/vue 1.61.0, @tanstack/vue-query 5.104.5, vue-i18n 11.4.16, reka-ui 2.11.0,
  zod 4.6.7, @types/node 26.6.5, eslint-plugin-oxlint 1.89.0, eslint-plugin-vue 10.11.1, jsdom 30.1.3,
  lint-staged 17.6.0, @playwright/test 1.64.1, @vueuse/core 15.0.0.
  (Verified 2026-10-27: `peers check` clean · type-check · build · **1588/1588** unit · `check:i18n`
  856 keys aligned · both lint engines exit 0 — the aggregate `pnpm lint` wrapper's ESLint JSON-parse
  bug is pre-existing, not a lint failure.)
  Notes that survive every `vp update -L` (numbers move with the toolchain, the rules do not):
  - **`vite-plus` / `vite` left its prerelease** (`1.0.0-rc.0` → **`1.1.0`**, 2026-10-09): `-L` takes this
    package's latest even across prerelease boundaries, so once the RC period ended the stable line is what
    installs. Evidence at 1.1.0: `peers check` clean · `type-check` · `build` · **1481/1481** unit · `lint` all
    exit 0, plus landing e2e **26/26** (Playwright 1.64 + its chromium 1248). `pnpm dev`/`vp dev` readiness probes
    miss it when the server binds `[::1]` only — probe `localhost`, not `127.0.0.1`.
  - **@vueuse/core 15 removed `useNow`'s `interval` option** — replaced by `scheduler?: (cb: Fn) => Pausable`. The
    countdown in `AchievementsView.vue` now passes `scheduler: (cb) => useIntervalFn(cb, 60_000)`. Grep for
    `interval:` on the next VueUse bump; type-check is what surfaced it, tests could not (the view's spec mocks
    `useNow` wholesale, so a dead clock would still pass).
  - **typescript 6.0.3 exact** — `-L` bumps it to 7.x every time (re-confirmed 2026-09-25, 10-09,
    10-18 and 2026-10-27: it installs 7.0.2 each run ⇒ roll back `pnpm add -D typescript@6.0.3
    --save-exact`). 7 is not forbidden — it is still **not runnable by the current toolchain**.
    Owner directive 2026-10-27: upgrade to 7 **the moment Vue actually supports it**, do not stay
    on 6.0.3 out of conservatism — so re-run this test on every update. Test by *running*, never by
    the peer range (`vue-tsc`'s own peer is only `>=5.0.0`, so it *looks* compatible): install 7 and
    run `vp run type-check`. Measured 2026-09-20 (ts 7.0.2) and again 2026-10-27 with **vue-tsc@latest
    3.3.13**: it **cannot even start** — `ERR_PACKAGE_PATH_NOT_EXPORTED` for `./lib/tsc` at
    `resolveTscPath` (TS 7 stopped exporting that programmatic API); `@typescript-eslint/*` (latest
    8.72.1) still caps its peer at `<6.1.0`. ⇒ 6.0.3 retained. Upgrade only once type-check + build +
    the full suite are green under 7. Re-pin: `pnpm add -D typescript@6.0.3 --save-exact`.
  - **vitest + @vitest/coverage-v8 follow vite-plus's hard pin** — the number changes with the
    toolchain, the rule does not. `0.3.x`→4.1.11 (and `-L`'s 5.0.1 caused a dual-instance peer
    conflict); `1.0.0-rc.0`→5.0.1; `1.1.0`→5.0.3; **`1.3.0` and `1.4.0`→5.0.5** (verified 2026-10-27
    from `node_modules/vite-plus/package.json`), so 5.0.5 is the *matching* pairing — `-L` alone
    gets it right. Re-check this pin from that file after every toolchain bump; `peers check`
    catches a mismatch.
  - **a `peers check` warning can be upstream declaration lag, not a real conflict** — when the
    only consumer is dev tooling, app source never imports it, and the full gate suite runs green
    at the "unmet" version, add a **bounded** entry to `pnpm-workspace.yaml`
    `peerDependencyRules.allowedVersions` instead of downgrading or reverting the toolchain. Two
    precedents so far: `zod` (see the file's own comment) and `@opentelemetry/api: '>=1.0.0 <1.11.0'`
    (2026-10-27 — `@opentelemetry/api@1.10.0` is the latest, reaching the tree only through
    `lighthouse→@sentry/node`, whose own `^1.9.1` pulls it up while the `@opentelemetry/core@2.x`
    Sentry pins still cap it at `<1.10.0`; the first core accepting 1.10.0 is 3.x, outside Sentry's
    `^2.9.0`. Dev-only, api stays at latest, drop the rule once Sentry moves to core 3.x). Never
    delete or rewrite an existing rule to dodge a new one.
  - Playwright bumps need `pnpm exec playwright install chromium` — verified again 2026-10-09
    (1.63 → 1.64: the old browser build is not reused; e2e cannot launch until chromium 1248 is
    installed). 1.64.0 → 1.64.1 keeps chromium 1248, so that install is a no-op (verified against
    `playwright-core/browsers.json`). **2026-10-27: `vp update -L` left @playwright/test at 1.64.1**
    — no browser reinstall needed.

- **The lint gate is oxlint-first** (`vite.config.ts` → `lint`; `pnpm lint` runs `--fix` and must end with **zero
  output** — a warning is fixed or suppressed with a stated reason). The IDE's SonarLint half that is closed source
  (SonarTypeScript, `typescript:S…`) cannot be gated: oxlint's equivalent is enabled where one exists
  (`unicorn/prefer-default-parameters` ← `S7760`), the rest needs SonarQube Cloud (stage 7). See AGENTS.md **R39**.
- **The E2E suite runs against the production build, locally and in CI** (2026-10-27 · v0.68.1).
  The dev server translates modules on demand, so a local run queued every spec behind the same
  bottleneck: a full run took **153s** and the heavy heatmap spec timed out under that load
  (165/166). Against a preview of the production build the same suite takes **52s** and passes
  outright, and the developer's own dev server stays free.
  **The build lives in the `test:e2e` script, not in the Playwright `webServer` command** — a reused
  server skips the command, so a build inside it would leave the suite testing a stale bundle
  without saying so.


## API Authentication

- Web users: JWT Bearer from `/api/v1/auth/login`; GitHub OAuth via ctt-server flow
- API keys (settings): `GET /api/v1/auth/api-keys` list, `POST /` create (rate 10/hr, limit 20 active), `GET /{id}`
  detail, `DELETE /{id}` revoke, `DELETE /{id}/delete` permanent (REVOKED/EXPIRED only). Errors: `AUTH_014` (limit),
  `AUTH_010` (BOLA), `AUTH_023` (active-key delete guard), `RATE_LIMIT_001`. Raw key shown once at creation
- Token persistence: localStorage `ctt_` prefix keys (`ctt_access_token`, `ctt_refresh_token`, `ctt_user_id`)

## API Layer Architecture

- ofetch instance in `lib/api/instance.ts`; Authorization Bearer injected on request; global `onResponseError`
  handles 401/403/500
- 401: CustomEvent `api:unauthorized` → `main.ts` auth cleanup + redirect (BOLA AUTH_010 excluded from logout)
- CSRF (v0.10.2): `XSRF-TOKEN` cookie read on each request → `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE
  (GET/HEAD/OPTIONS + login/register excluded); 403 CSRF → toast "Security token expired. Refreshing…" + reload
- Zod runtime validation: `lib/schemas/` factories (RestApiResponse etc.); `.parse()` before returning to
  components; types derived from schemas

### TanStack Query

- `lib/query.ts`: staleTime 30s, gcTime 5min, refetchOnWindowFocus false, retry 1 (fail-fast)
- Query keys via constants (e.g. `API_KEYS_QUERY_KEY`); mutations invalidate on success; register in main.ts after
  Pinia/Router

### Pinia

- `auth.ts` (JWT tokens, userId, expiry, hasPassword) + `theme.ts` (dark/light/auto via VueUse `useStorage` +
  `useDark`); `counter.ts` reference-only
- Cross-tab sync via storage events; derived computed (isAuthenticated)

### OAuth Provider Enumeration (v0.8.39)

- `OAuthAccountBinding.provider` = free-form `z.string()` (not enum) so backend can ship new providers without
  frontend bump; UI maps known providers via `switch`; only GitHub has hardcoded SVG
- Sensitive fields (`accessToken`, `refreshToken`, `providerUserId`) intentionally excluded from DTO contract

### OAuth Flow Discriminator (v0.8.40-42)

- `action='login'` (public, LoginForm) / `action='bind'` (JWT, ProfileView) on `getGitHubAuthorizeUrl`;
  `DELETE /api/v1/auth/oauth/accounts/{provider}` for unbind (204, no redirect)
- BIND redirect: `{frontendUrl}/settings/profile?linked={provider}[&error={code}]`; ProfileView `onMounted` reads
  query + `router.replace({query:{}})` to prevent toast re-trigger
- Browser tokens unchanged by BIND/UNBIND (backend guarantee); unbind uses shadcn Dialog confirmation

### Email Change API (v0.31.2) — `lib/api/email.ts`

| Method   | Path                                        | Description                       |
| -------- | ------------------------------------------- | --------------------------------- |
| `GET`    | `/api/v1/users/me/email/status`             | Current email + verification state |
| `POST`   | `/api/v1/users/me/email/change-request`     | Initiate change (newEmail+password)|
| `POST`   | `/api/v1/users/me/email/change-confirm`     | Confirm with token                 |
| `DELETE` | `/api/v1/users/me/email/change-request`     | Cancel pending change              |
| `POST`   | `/api/v1/users/me/email/resend-verification`| Resend verification               |

Errors: `USER_009` (same email), `USER_010` (in use), `USER_011` (no pending), `USER_013` (token), `USER_014`
(password). Password re-verified on every request; token single-use/time-limited; atomic (old email active until
confirm)

### Set Password API (v0.10.0) — `lib/api/user.ts`

- `POST /api/v1/users/me/password/set` `{ newPassword }` → EmptyResponse; errors `USER_015` (already set),
  `COMMON_003` (format 8-64 printable ASCII); OAuth users only; `hasPassword` from `GET /users/me` drives
  Set/Change label

### Sidebar UI (v0.8.42)

- AppSidebar header shows full "Code Time Tracker"; footer "© 2026 AhogeK"; logout moved to AppHeader avatar
  dropdown; mobile sheet auto-closes on nav, no header chrome on mobile (v0.16.5)

## Key Architectural Decisions

- Server state → TanStack Query only, never Pinia; URL state → router SearchParams; global state (auth/theme) → Pinia
- All API types = Zod schemas in `lib/schemas/`, aligned with ctt-server DTOs; `lib/api/` is the single HTTP boundary
- UI primitives from reka-ui wrappers in `src/components/ui/`; visual spec from root `DESIGN.md` (Linear-style,
  light/dark dual mode) — no colors/shadows/spacing outside it
