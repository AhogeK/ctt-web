# Tech Context: ctt-web

## Core Stack

| Layer         | Technology                             | Version      |
| ------------- | -------------------------------------- | ------------ |
| Build         | Vite+ (unified toolchain via `vp` CLI) | latest       |
| Framework     | Vue 3 + TypeScript Strict              | ^3.6 (beta)  |
| TypeScript    | TypeScript 6.0.3                       | ~6.0.3       |
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
| Package Mgr   | pnpm (via corepack)                    | ^10          |
| Design System | DESIGN.md                              | Linear-style |

## Dev Toolchain (Vite+ Unified)

- `vp` CLI (dev/build/test/lint/fmt), Playwright (E2E), vue-tsc (type check), simple-git-hooks + lint-staged (pre-commit)
- Snapshot (2026-09-06): @playwright/test 1.63.0, lint-staged 17.5.0, vue-tsc 3.3.11, **typescript 6.0.3 pinned exact** — `vp update -L` auto-bumps TS to 7.x which breaks the Vue toolchain; re-pin after every `-L` run (`pnpm add -D typescript@6.0.3 --save-exact`)
- **vitest must stay 4.1.11** (exact): vite-plus@0.3.0 hard-pins `vitest: 4.1.11` as a dependency; letting `-L` bump the direct devDep to 5.x creates a dual-instance peer conflict (`peers check` exit 1). Re-pin vitest + @vitest/coverage-v8 to 4.1.11 after every `-L` run. Playwright major bumps need `pnpm exec playwright install chromium` (new browser build).

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
