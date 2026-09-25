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
| Captcha       | @hcaptcha/vue3-hcaptcha                | ^1           |
| Package Mgr   | pnpm (standalone `~/Library/pnpm`)     | 11.18.0      |
| Design System | DESIGN.md                              | Linear-style |

## Dev Toolchain (Vite+ Unified)

- `vp` CLI (dev/build/test/lint/fmt), Playwright (E2E), vue-tsc (type check), simple-git-hooks + lint-staged (pre-commit)

**Package commands go through `vp`, not `pnpm`** — Vite+ wraps package management too:

| Task | Command |
| --- | --- |
| Add | `vp add <pkg>` |
| Remove | `vp remove <pkg>` |
| Install everything | `vp install` (or `vp i`) |
| Why is this dependency here | `vp why <pkg>` |
- **`pnpm-workspace.yaml` is pnpm 11's settings file** — not `.npmrc`, which pnpm 11 ignores for `verify-deps-before-run`. `allowBuilds` holds the build-script decisions (`msw`, `simple-git-hooks`, `vue-demi`); `verifyDepsBeforeRun: warn` stops `pnpm run`/`pnpm exec` from implicitly installing — the only path that could write a non-boolean placeholder into this tracked file — while still reporting genuine drift. `error` blocks the write too, but fails *every* script after a lone version bump (that alone flips the workspace-state hash), so it does not survive contact with a release step. Runtime state lives in `node_modules/.modules.yaml` (`pendingBuilds`, `allowBuilds`). **Consequence, verified 2026-09-20**: any `package.json` change flips the workspace-state hash (a version bump does it; so does removing a config block), so the next `pnpm run`/`pnpm exec` — i.e. every pre-commit — prints `Your node_modules are out of sync with your lockfile. The workspace structure has changed since last install`. It is **drift reporting, not a broken install**; `vp install` re-records the state and clears it (output `Lockfile is up to date · Already up to date`, so it adds nothing), and the tree stays clean. Measured: warning 1 → 0, `node_modules/.modules.yaml` Sep 18 → Sep 20, `git status` 0 items.
- Snapshot (2026-09-25, after `vp update -L`): **vite-plus + vite `1.0.0-rc.0`**, typescript 6.0.3 (exact), vitest + @vitest/coverage-v8 5.0.1, vue-tsc 3.3.11, @lucide/vue 1.48.0, @iconify/vue 5.0.3, @tanstack/vue-query 5.103.2, reka-ui 2.10.5, zod 4.6.5, @types/node 26.6.2, eslint-plugin-oxlint 1.85.0, eslint-plugin-vue 10.11.1, jsdom 30.1.1, lint-staged 17.5.1, @playwright/test 1.63.0, @vueuse/core 15.0.0. Four notes survive every `vp update -L`:
  - **`vite-plus` / `vite` moved to a prerelease** (`1.0.0-rc.0`): `-L` takes prereleases for this package, so the core toolchain is an RC by decision (2026-09-25). Evidence at that point: `peers check` clean · `type-check` · `build` · **1450/1450** unit · `lint` all exit 0, plus a **dev smoke** (`vp dev` → `/` 200, `/src/main.ts` 200 with real transform output, `theme.js` 200). `pnpm dev`/`vp dev` readiness probes miss it when the server binds `[::1]` only — probe `localhost`, not `127.0.0.1`.
  - **@vueuse/core 15 removed `useNow`'s `interval` option** — replaced by `scheduler?: (cb: Fn) => Pausable`. The countdown in `AchievementsView.vue` now passes `scheduler: (cb) => useIntervalFn(cb, 60_000)`. Grep for `interval:` on the next VueUse bump; type-check is what surfaced it, tests could not (the view's spec mocks `useNow` wholesale, so a dead clock would still pass).
  - **typescript 6.0.3 exact** — `-L` bumps it to 7.x (re-confirmed 2026-09-25: it again installed 7.0.2 ⇒ roll back with `pnpm add -D typescript@6.0.3 --save-exact`, which is what the commit for that run contains), and 7 is not *forbidden*, it is **not yet supported by the current toolchain** (measured 2026-09-20 with typescript 7.0.2 installed): ① `@typescript-eslint/*` (latest 8.70.0) declares peer `>=4.8.4 <6.1.0`, so `peers check` fails outright; ② `vue-tsc@3.3.11` **cannot even start** — `ERR_PACKAGE_PATH_NOT_EXPORTED` at `index.js:44` (TS 7 stopped exporting the programmatic API it imports). ② is why the peer ranges alone are not enough: `vue-tsc`'s own peer is only `>=5.0.0`, so it *looks* compatible — **install 7 and run `vp run type-check` to test it**, never the range. Upgrade only when vue-tsc/typescript-eslint ship support **and** type-check + build + the full suite are green. Re-pin: `pnpm add -D typescript@6.0.3 --save-exact`.
  - **vitest + @vitest/coverage-v8 follow vite-plus's hard pin** — the number changes with the toolchain, the rule does not. At `vite-plus 0.3.x` the pin was `4.1.11` (and `-L`'s 5.0.1 caused a dual-instance peer conflict); at **`1.0.0-rc.0` the pin is `5.0.1`** (verified 2026-09-25 from `node_modules/vite-plus/package.json`: `vitest: 5.0.1` + the `@vitest/*` 5.0.1 family), so 5.0.1 is now the *matching* pairing — `-L` alone gets it right. Re-check this pin from that file after every toolchain bump; `peers check` is what catches a mismatch.
  - Playwright major bumps need `pnpm exec playwright install chromium`.

## API Authentication

- Web users: JWT Bearer from `/api/v1/auth/login`; GitHub OAuth via ctt-server flow
- API keys (settings): `GET /api/v1/auth/api-keys` list, `POST /` create (rate 10/hr, limit 20 active), `GET /{id}` detail, `DELETE /{id}` revoke, `DELETE /{id}/delete` permanent (REVOKED/EXPIRED only). Errors: `AUTH_014` (limit), `AUTH_010` (BOLA), `AUTH_023` (active-key delete guard), `RATE_LIMIT_001`. Raw key shown once at creation
- Token persistence: localStorage `ctt_` prefix keys (`ctt_access_token`, `ctt_refresh_token`, `ctt_user_id`)

## API Layer Architecture

- ofetch instance in `lib/api/instance.ts`; Authorization Bearer injected on request; global `onResponseError` handles 401/403/500
- 401: CustomEvent `api:unauthorized` → `main.ts` auth cleanup + redirect (BOLA AUTH_010 excluded from logout)
- CSRF (v0.10.2): `XSRF-TOKEN` cookie read on each request → `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE (GET/HEAD/OPTIONS + login/register excluded); 403 CSRF → toast "Security token expired. Refreshing…" + reload
- Zod runtime validation: `lib/schemas/` factories (RestApiResponse etc.); `.parse()` before returning to components; types derived from schemas

### TanStack Query

- `lib/query.ts`: staleTime 30s, gcTime 5min, refetchOnWindowFocus false, retry 1 (fail-fast)
- Query keys via constants (e.g. `API_KEYS_QUERY_KEY`); mutations invalidate on success; register in main.ts after Pinia/Router

### Pinia

- `auth.ts` (JWT tokens, userId, expiry, hasPassword) + `theme.ts` (dark/light/auto via VueUse `useStorage` + `useDark`); `counter.ts` reference-only
- Cross-tab sync via storage events; derived computed (isAuthenticated)

### OAuth Provider Enumeration (v0.8.39)

- `OAuthAccountBinding.provider` = free-form `z.string()` (not enum) so backend can ship new providers without frontend bump; UI maps known providers via `switch`; only GitHub has hardcoded SVG
- Sensitive fields (`accessToken`, `refreshToken`, `providerUserId`) intentionally excluded from DTO contract

### OAuth Flow Discriminator (v0.8.40-42)

- `action='login'` (public, LoginForm) / `action='bind'` (JWT, ProfileView) on `getGitHubAuthorizeUrl`; `DELETE /api/v1/auth/oauth/accounts/{provider}` for unbind (204, no redirect)
- BIND redirect: `{frontendUrl}/settings/profile?linked={provider}[&error={code}]`; ProfileView `onMounted` reads query + `router.replace({query:{}})` to prevent toast re-trigger
- Browser tokens unchanged by BIND/UNBIND (backend guarantee); unbind uses shadcn Dialog confirmation

### Email Change API (v0.31.2) — `lib/api/email.ts`

| Method   | Path                                        | Description                       |
| -------- | ------------------------------------------- | --------------------------------- |
| `GET`    | `/api/v1/users/me/email/status`             | Current email + verification state |
| `POST`   | `/api/v1/users/me/email/change-request`     | Initiate change (newEmail+password)|
| `POST`   | `/api/v1/users/me/email/change-confirm`     | Confirm with token                 |
| `DELETE` | `/api/v1/users/me/email/change-request`     | Cancel pending change              |
| `POST`   | `/api/v1/users/me/email/resend-verification`| Resend verification               |

Errors: `USER_009` (same email), `USER_010` (in use), `USER_011` (no pending), `USER_013` (token), `USER_014` (password). Password re-verified on every request; token single-use/time-limited; atomic (old email active until confirm)

### Set Password API (v0.10.0) — `lib/api/user.ts`

- `POST /api/v1/users/me/password/set` `{ newPassword }` → EmptyResponse; errors `USER_015` (already set), `COMMON_003` (format 8-64 printable ASCII); OAuth users only; `hasPassword` from `GET /users/me` drives Set/Change label

### Sidebar UI (v0.8.42)

- AppSidebar header shows full "Code Time Tracker"; footer "© 2026 AhogeK"; logout moved to AppHeader avatar dropdown; mobile sheet auto-closes on nav, no header chrome on mobile (v0.16.5)

## Key Architectural Decisions

- Server state → TanStack Query only, never Pinia; URL state → router SearchParams; global state (auth/theme) → Pinia
- All API types = Zod schemas in `lib/schemas/`, aligned with ctt-server DTOs; `lib/api/` is the single HTTP boundary
- UI primitives from reka-ui wrappers in `src/components/ui/`; visual spec from root `DESIGN.md` (Linear-style, light/dark dual mode) — no colors/shadows/spacing outside it
