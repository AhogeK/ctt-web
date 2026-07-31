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
| UI            | Radix Vue + shadcn-vue                 | latest       |
| Styles        | Tailwind CSS + @tailwindcss/vite       | ^4           |
| Charts        | Apache ECharts + vue-echarts           | ^6 / ^8      |
| HTTP          | ofetch                                 | ^1           |
| Validation    | Vee-Validate + Zod                     | ^4 / ^4.3.6  |
| Icons         | @iconify/vue                           | ^5           |
| i18n          | Vue I18n                               | ^11          |
| Captcha       | @hcaptcha/vue3-hcaptcha                | ^1           |
| Package Mgr   | pnpm (via corepack)                    | ^10          |
| Design System | DESIGN.md                              | Linear-style |

## Dev Toolchain (Vite+ Unified)

| Tool             | Role                            |
| ---------------- | ------------------------------- |
| Vite+ (`vp` CLI) | Unified dev/build/test/lint/fmt |
| Playwright       | E2E tests                       |
| vue-tsc          | Type checking                   |
| simple-git-hooks | Pre-commit hooks                |
| lint-staged      | Staged file lint/format         |

## API Authentication

- Web users: JWT Bearer token (from ctt-server `/api/v1/auth/login`)
- GitHub OAuth: supported via ctt-server OAuth flow
- API keys: managed in settings section (`/settings/api-keys`). `GET /api/v1/auth/api-keys` list, `POST /` create (rate 10/hr, limit 20 active), `GET /{id}` detail, `DELETE /{id}` revoke. Raw key shown only once at creation; errors: `AUTH_014` (limit), `AUTH_010` (BOLA), `RATE_LIMIT_001`.

## API Layer Architecture

- **HTTP Client**: `ofetch` instance in `src/lib/api/instance.ts`
- **Token Injection**: Request interceptor reads from localStorage, injects `Authorization: Bearer <token>`
- **Error Handling**: Global `onResponseError` interceptor handles 401/403/500 with toast notifications
- **Decoupling**: CustomEvent (`api:unauthorized`) dispatched on 401, listened in `main.ts` for auth cleanup + redirect
- **Token Persistence**: localStorage with `ctt_` prefix keys (`ctt_access_token`, `ctt_refresh_token`, `ctt_user_id`)

### OAuth Provider Enumeration (v0.8.39)

- `OAuthAccountBinding.provider` is modeled as a free-form `z.string()` (NOT a `z.enum`) to allow the backend to ship new providers (google, gitlab, …) without a frontend schema bump
- UI must map known providers to icons/labels via a `switch (provider)` statement in the consuming component
- Only GitHub has a hardcoded SVG today; future providers should add their own case + icon block, or render an icon component keyed by the case branch
- Sensitive fields (`accessToken`, `refreshToken`, `providerUserId`) are intentionally excluded from the DTO contract — do NOT add them to `OAuthAccountBindingSchema`

### Zod Runtime Validation

- Location: `src/lib/schemas/api.schema.ts`
- Purpose: Runtime validation of API responses to prevent undefined/null errors
- Pattern: Factory functions for generic response wrappers
- Integration: Use `.parse()` method in API layer before returning to components
- Benefits:
  - Fail-fast on backend schema changes
  - Clear error messages for debugging
  - Single source of truth (types derived from Zod)
  - Catches backend typos/changes at network boundary

### TanStack Query (Server State Management)

- Location: `src/lib/query.ts`
- Purpose: Separate server state from client state (Pinia)
- Key Configuration:
  - staleTime: 30s - Data fresh window, uses cache without network calls
  - gcTime: 5min - Inactive data retention before garbage collection
  - refetchOnWindowFocus: false - Prevent API flooding from tab switching
  - retry: 1 - Fail-Fast behavior (default is 3)
- Integration: VueQueryPlugin registered in main.ts after Pinia and Router
- Benefits:
  - Automatic caching and deduplication
  - Background refetch (SWR pattern)
  - Loading and error state management
  - Reduces Pinia boilerplate (no more isLoading, isError)

### Pinia State Management

- Location: `src/stores/`
- Stores:
  - `auth.ts` - Authentication state (JWT tokens, userId, expiry)
  - `theme.ts` - Theme preference (dark/light/auto with system detection)
  - `counter.ts` - Example store (reference only)
- VueUse Integration:
  - `useStorage` - Automatic localStorage sync with reactivity
  - `useDark` - System preference detection and DOM class sync
- Benefits:
  - Cross-tab synchronization via storage events
  - Automatic persistence without manual localStorage calls
  - Type-safe state management
  - Computed properties for derived state (isAuthenticated)

### OAuth Flow Discriminator Pattern

GitHub OAuth has three flows with the same authorize endpoint (or DELETE for unbind):
- `action='login'`: public endpoint, used by LoginForm for first-time sign-in
- `action='bind'`: requires JWT, used by ProfileView to link existing account
- `DELETE /api/v1/auth/oauth/accounts/{provider}`: requires JWT, used by ProfileView to unlink account

Implementation notes:
- `getGitHubAuthorizeUrl(action: 'login' | 'bind' = 'login')` in `src/lib/api/auth.ts`
- `unbindOAuthAccount(provider)` in `src/lib/api/oauth-account.ts` (v0.8.42+)
- For bind/unbind flows, JWT is auto-injected by `apiFetch` interceptor (`instance.ts:188-196`)
- TanStack Query mutation: `mutationFn` must wrap the API function (e.g., `() => getGitHubAuthorizeUrl('login')`) so `TVariables` infers as `void` and `mutate()` works without args
- BIND success redirect: `{frontendUrl}/settings/profile?linked={provider}`
- BIND failure redirect: `{frontendUrl}/settings/profile?linked={provider}&error={errorCode}`
- UNBIND has no redirect (DELETE returns 204 No Content); frontend triggers `refetchOAuthAccounts()` to update UI
- Browser tokens unchanged by BIND/UNBIND flows (backend guarantee)
- Frontend listens for BIND query params in ProfileView `onMounted` and clears URL via `router.replace({ query: {} })` to prevent toast re-trigger on refresh
- UNBIND uses shadcn-vue Dialog for confirmation; click handler is single-purpose


### Email Change API (v0.31.2)

5 endpoints under `/api/v1/users/me/email/`. All require JWT Bearer auth. Frontend implementation: `src/lib/api/email.ts`.

| Method   | Path                                 | Description                          |
| -------- | ------------------------------------ | ------------------------------------ |
| `GET`    | `/api/v1/users/me/email/status`      | Get current email + verification status |
| `POST`   | `/api/v1/users/me/email/change-request`  | Initiate email change (sends verification to new address) |
| `POST`   | `/api/v1/users/me/email/change-confirm`  | Confirm email change with token from email |
| `DELETE` | `/api/v1/users/me/email/change-request`  | Cancel pending email change          |
| `POST`   | `/api/v1/users/me/email/resend-verification` | Resend verification email for pending change |

**Request/Response formats:**

```ts
// GET /status → EmailStatus
{ email: string; emailVerified: boolean; emailChangePending: boolean; pendingNewEmail: string | null }

// POST /change-request
{ newEmail: string; password: string } → EmptyResponse

// POST /change-confirm
{ token: string } → EmptyResponse

// DELETE /change-request
(no body) → EmptyResponse

// POST /resend-verification
(no body) → EmptyResponse
```

**Error codes:**

| Code       | Meaning                              |
| ---------- | ------------------------------------ |
| `USER_009` | New email same as current email      |
| `USER_010` | Email already in use by another user |
| `USER_011` | No pending email change to confirm/cancel |
| `USER_013` | Invalid or expired confirmation token |
| `USER_014` | Password verification failed         |

**Security considerations:**

- Password re-verification required on every change request (prevents account takeover via session hijack)
- Verification token is single-use and time-limited
- Rate limiting on `/change-request` and `/resend-verification` to prevent email bombing
- Pending change can be cancelled (DELETE) to reset state
- Email change is atomic: old email stays active until confirmation succeeds

### CSRF Protection (v0.10.2)

ctt-server v0.33.1 implements CSRF protection using the synchronizer token pattern. Frontend handles token propagation and error recovery.

**Mechanism:**

| Step | Location | Description |
| ---- | -------- | ----------- |
| Token source | `XSRF-TOKEN` cookie | Backend sets cookie on login/session start |
| Cookie read | `src/lib/api/instance.ts` | Parses `document.cookie` to extract `XSRF-TOKEN` value |
| Header injection | `onRequest` interceptor | Adds `X-XSRF-TOKEN` header to POST/PUT/PATCH/DELETE requests |
| Error handling | `onResponseError` interceptor | 403 + CSRF error body → Sonner toast + page reload |

**Implementation details:**

- GET/HEAD/OPTIONS requests are excluded from CSRF header injection (safe methods)
- Login/register endpoints are excluded (no session cookie yet)
- 403 CSRF error triggers a user-facing toast ("Security token expired. Refreshing…") followed by `window.location.reload()` to obtain a fresh token
- Cookie reading is lazy (on each request) to handle token rotation

**Security considerations:**

- CSRF token is bound to the session (backend validates token matches the one issued for the current session)
- Token is not stored in localStorage — only in the cookie (HttpOnly not required for XSRF-TOKEN as it's read by JS)
- Page reload on 403 CSRF ensures a clean state (clears any stale in-flight mutations)

### Set Password API (v0.10.0)

1 endpoint under `/api/v1/users/me/password/`. Requires JWT Bearer auth. Frontend implementation: `src/lib/api/user.ts`.

| Method   | Path                                 | Description                          |
| -------- | ------------------------------------ | ------------------------------------ |
| `POST`   | `/api/v1/users/me/password/set`      | Set password for OAuth users who don't have one yet |

**Request/Response formats:**

```ts
// POST /set
{ newPassword: string } → EmptyResponse
```

**Error codes:**

| Code       | Meaning                              |
| ---------- | ------------------------------------ |
| `USER_015` | User already has a password (cannot set again) |
| `COMMON_003` | Invalid password format (8-64 printable ASCII chars) |

**Security considerations:**

- Only available for OAuth users without an existing password
- Password must meet format requirements (8-64 printable ASCII chars)
- Rate limiting on `/set` endpoint to prevent brute force attacks
- After setting password, user can use email/password login in addition to OAuth

### Sidebar UI Branding (v0.8.42)

- `src/components/app/AppSidebar.vue` header displays the full project name "Code Time Tracker" (instead of abbreviated "CTT")
- Footer shows copyright line "© 2026 AhogeK"
- Logout button removed from sidebar; the `useAuthStore.logout()` method is still used by other code paths (token expiry interceptor)


## Key Architectural Decisions

- Server State (API data) → TanStack Query only, never Pinia
- URL state (filters, pagination) → vue-router SearchParams
- Global state (auth session, theme) → Pinia
- All API types defined as Zod schemas in `lib/schemas/`, aligned with ctt-server DTOs
- `ofetch` instance in `lib/api/` is the single HTTP boundary

## Design System

Visual spec follows root `DESIGN.md` (Linear-style, light/dark dual mode).
All UI component colors, typography, spacing, and states must be sourced from that file.
