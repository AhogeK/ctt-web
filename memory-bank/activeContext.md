# Active Context: ctt-web

## Current Status

**Phase**: v0.10.x Security & Account Features (CSRF + Set Password + CSP)
**Version**: 0.10.3 (2026-07-05)
**Branch**: develop at d0ebea9, master at 9899288
**Tests**: 892/892 pass (verified 2026-07-05)
**Code Review**: FAILED (2026-07-04) — 3 blocking issues found (all fixed)
**Plans**:
- docs/plans/2026-05-02-terms-acceptance-tracking.md — completed
- docs/plans/2026-05-23-hcaptcha-integration.md — completed
- .dev/plans/2026-05-28-github-oauth.md — completed

## Recent Activity (v0.10.3 — 2026-07-05)

### ForgotPasswordView idempotentSkip UX Fix

- **Issue**: When backend returns `idempotentSkip: true` (email already sent within rate limit), frontend showed "Check your email" as if a new email was sent
- **Fix**: Added `isIdempotent` ref to track idempotent responses; template now shows different text:
  - Title: "Email already sent" (vs "Check your email")
  - Description: "We already sent a reset link to {email} recently. Please check your inbox or spam folder. If you didn't receive it, please wait a few minutes before trying again."
- **Tests**: 6 new tests for idempotentSkip behavior; 892/892 pass

## Code Review Findings (2026-07-04)

### Blocking Issues (must fix before merge)

1. **Missing Base64 encoding**: `confirmPasswordReset` in `auth.ts` does not encode password with `encodeBase64()`, inconsistent with all other password endpoints
2. **Missing tests**: `codec.ts`, `usePasswordDetection.ts`, `useSetPassword.ts` have zero test coverage
3. **Weak assertion**: `password.test.ts` uses `expect.any(String)` instead of verifying actual base64 encoding

### Major Issues

4. **Button style duplication**: `AccountSection.vue` repeats `cn()` styling 3 times
5. **Inconsistent error handling**: `SetPasswordDialog.vue` doesn't show inline error for unknown error codes
6. **Anti-pattern**: `usePasswordDetection` calls write endpoint for read-only detection

### Minor Issues

7. `docs/architecture.md` missing CSRF and Set Password sections
8. `docs/dev-handbook.md` missing base64 encoding guidance
9. `README.md` missing CSP Hardening feature row
10. `activeContext.md` phase label was misleading (now fixed)

## Recent Activity (v0.10.x — 2026-07)

### Password Detection Robustness Fix (v0.10.2+)

- **Issue**: `usePasswordDetection` composable incorrectly set `hasPassword = false` on network errors
- **Root cause**: `else` branch in catch block treated all non-USER_015 errors as "no password"
- **Fix**: Added `isApiError(error)` check to distinguish API responses from network errors
  - `USER_015` → `hasPassword = true` (user has password)
  - Other API errors → `hasPassword = false` (API responded, user doesn't have password)
  - Network/unknown errors → `checkError` set, `hasPassword` unchanged
- **Backend**: ctt-server `UserProfileResponse` does NOT have `hasPassword` field; `setPassword` approach retained
- **Tests**: 815/815 pass (no test changes needed — existing mock-based tests cover the behavior)

### CSRF Protection (v0.10.2)

- **Backend**: ctt-server v0.33.1 CSRF protection (synchronizer token pattern)
- **Cookie reading**: `XSRF-TOKEN` cookie parsed via `document.cookie` in `src/lib/api/instance.ts`
- **Header injection**: `X-XSRF-TOKEN` header added to all state-changing requests (POST/PUT/PATCH/DELETE) in the `onRequest` interceptor
- **403 handling**: `onResponseError` interceptor detects 403 with CSRF error body → shows Sonner toast ("Security token expired. Refreshing…") → reloads page to refresh token
- **Exclusions**: GET/HEAD/OPTIONS requests skip CSRF header; login/register endpoints excluded (no session yet)
- **Tests**: 30 new (12 interceptor + 10 cookie parsing + 8 error handling); 815/815 pass
- **Dependencies**: None added

### CSP Meta Tag (v0.10.1)

- `index.html`: added `<meta http-equiv="Content-Security-Policy">` as defense-in-depth fallback for backend CSP headers
- Policy: same-origin default + hCaptcha (`*.hcaptcha.com`) for script/frame/connect/img + inline styles (shadcn-vue/Radix runtime) + data URIs (fonts/images) + `object-src 'none'` + `frame-ancestors 'none'` (clickjacking)
- Zero dependencies; no code changes; HTML-only hardening

### Set Password Feature (v0.10.0)

- **Backend integration**: ctt-server Set Password API (`POST /api/v1/users/me/password/set`)
- **API layer**: `src/lib/api/user.ts` — `setPassword()` wrapper (apiFetch + RestApiResponseSchema)
- **Schemas**: `src/lib/schemas/user.schema.ts` — added `SetPasswordSchema` (newPassword + confirmPassword)
- **Composables**: `src/features/settings/composables/useSetPassword.ts` (mutation)
- **Components**: `SetPasswordDialog.vue` (password form with validation), `AccountSection.vue` updated with Set Password button
- **Integration**: Set Password button shown only for OAuth users (no password set); works alongside Email Change flow
- **Error codes**: USER_015 (password already set) mapped in `api-error.ts`
- **Tests**: 34 new (8 API + 12 composable + 14 component); 785/785 pass
- **Dependencies**: None added

### Email Change Feature (v0.9.0)

- **Backend integration**: ctt-server v0.31.2 Email Change API (5 endpoints)
- **API layer**: `src/lib/api/email.ts` — `fetchEmailStatus()`, `requestEmailChange()`, `confirmEmailChange()`, `cancelEmailChange()`, `resendEmailChangeVerification()`
- **Schemas**: `src/lib/schemas/user.schema.ts` — added `emailChangePending: z.boolean().default(false)`
- **Composables**: `src/features/settings/composables/useEmailChange.ts` (4 mutations), `useEmailStatus.ts` (query)
- **Components**: `AccountSection.vue`, `EmailChangeDialog.vue`, `EmailVerificationBanner.vue`
- **Route**: `/auth/change-email` added for email change confirmation
- **Error codes**: USER_009/010/011/013/014 mapped in `api-error.ts`
- **Auth store**: Added `createdAt` field for registration time display
- **Dependencies**: None added

### User Profile API + AppHeader Display (v0.8.44)

- **Endpoint integration**: `GET /api/v1/users/me` (ctt-server v0.30.0/0.30.1) returning `{id, email, displayName, emailVerified, createdAt, lastLoginAt, termsVersion}`
- **Schema**: `src/lib/schemas/user.schema.ts` — `UserProfileSchema` with Zod validation; `lastLoginAt: z.iso.datetime().nullable().default(null)` (defensive: field may be absent — backend v0.30.1 guarantees presence via `@JsonInclude(ALWAYS)`)
- **API**: `src/lib/api/user.ts` — `fetchCurrentUser()` wrapper (apiFetch + RestApiResponseSchema + inner schema)
- **Auth store extension**: `src/stores/auth.ts` — 4 new ref fields (`displayName`, `email`, `emailVerified`, `lastLoginAt`) + `fetchUserProfile()` with Promise lock (dedup pattern); `clearAuth()` resets all
- **Lifecycle wiring**: `main.ts` — startup profile fetch removed (avoid premature `/users/me` 401 before localStorage sync); `login()` and `loginWithOAuth()` call `fetchUserProfile()` after `nextTick()` to ensure localStorage token is written (VueUse's `useStorage` is async)
- **Avatar enhancement**: `UserAvatar.vue` seed now prefers `displayName` over `userId` for readable initials; width/height uses Tailwind `w-9 h-9` (R9 inline style fix)
- **AppHeader dropdown**: `displayName` + `email` in DropdownMenuLabel; tooltip hidden when displayName null (N5 nit fix); removed hardcoded "My Account" (v0.8.43 i18n fix)
- **Tests**: 41 new (13 schema + 10 API + 12 avatar + 6 AppHeader); 620/620 pass
- **Dependencies**: None added (existing `zod`, `ofetch`, `vue`)

### UserAvatar in Header (v0.8.43)

- `src/lib/utils/avatar.ts`: `stringToHue` (djb2 hash → 0-359 HSL hue), `stringToAvatarColor` (HSL with fixed S=65% L=45%), `getInitials` (handles email/Unicode/empty fallback to `?`)
- `src/components/app/UserAvatar.vue`: 36px circle avatar reading `authStore.userId` for hash seed and initials; deterministic per user
- `src/components/app/AppHeader.vue`: replaced Tooltip+Logout with Tooltip+DropdownMenu wrapping UserAvatar; logout moved into dropdown menu item
- 14 new tests (12 avatar utils + 2 AppHeader integration); 589/589 pass
- Zero dependencies added; pure TypeScript + project primitives

### OAuth Account Unbind Flow (v0.8.41)

- Closes ctt-server PR-B loop: enable GitHub account disconnection from ProfileView
- `unbindOAuthAccount(provider)` in `src/lib/api/oauth-account.ts`: issues `DELETE /api/v1/auth/oauth/accounts/{provider}` with JWT
- `src/lib/errors/oauth-bind-error-messages.ts`: new `OAUTH_UNBIND_ERROR_MESSAGES` + `getOAuthUnbindErrorMessage(code)` (AUTH_017 + AUTH_018) with fallback + dev breadcrumb
- `ProfileView.vue`: state-aware button — `v-if="!githubBinding"` shows Connect (existing BIND flow), `v-else` shows Disconnect button + shadcn-vue `Dialog` confirmation. Error handling mirrors BIND pattern (AUTH_001 short-circuit, refetch on success, toast + dialog close on error)
- approximately 32 new tests (6 API + 5 error mapping + 8 view + 7 state-aware + 6 defensive cleanups); 580/580 pass
- Session invariant: backend guarantees no token rotation; mirror of v0.8.40 BIND
- v0.8.41 cleanup: removed redundant `@click` on Disconnect button (DialogTrigger as-child handles it); added `extractErrorCode()` helper in `src/lib/utils/api-error.ts` to DRY the type-cast pattern in BIND/UNBIND `onError`; added `COMMON_001` mapping in `OAUTH_UNBIND_ERROR_MESSAGES` for future-proofing

### OAuth Account Binding Flow (v0.8.40)

- Closes ctt-server PR-A loop: enable GitHub account linking from ProfileView
- `getGitHubAuthorizeUrl(action: 'login' | 'bind' = 'login')` — adds `?action=bind` query param; JWT auto-injected by apiFetch for bind (handled by backend interceptor)
- `LoginView.vue`: wraps `mutationFn` in `() => getGitHubAuthorizeUrl('login')` for TanStack Query TVariables inference (mutationFn must be 0-arg to keep `mutate()` call-site compatible)
- `src/lib/errors/oauth-bind-error-messages.ts`: 8 BIND error codes → user-friendly toast copy (AUTH_006/013/016, USER_004, OAUTH_PROVIDER_ERROR, OAUTH_INTERNAL_ERROR, MISSING_OAUTH_PARAMS, INVALID_STATE_ACTION) + fallback
- `ProfileView.vue`: bind button calls `'bind'` action; `onMounted` handler reacts to `?linked=github` (success) / `?linked=github&error={code}` (failure) and clears query params via `router.replace({ query: {} })`
- 17 new tests (8 error-mapping + 2 auth action + 4 ProfileView BIND scenarios + 3 mock infrastructure); 548/548 pass

### OAuth Account Binding Status (v0.8.39)

### Sidebar Branding & Copyright (v0.8.42)

- `src/components/app/AppSidebar.vue`: header "CTT" → "Code Time Tracker" (with `text-sm` to fit sidebar width); SidebarFooter Logout button → "© 2026 AhogeK" copyright line
- `src/components/app/__tests__/AppSidebar.test.ts`: removed 8 Logout tests, added 2 new tests (copyright line + no-Logout-button)
- Net change: 580 → 575 tests (removed 8 + added 2, plus pre-existing test count baseline)
- AI content stays on develop only; master cherry-picks will get only the code commit, not this memory


- Closes backend `GET /api/v1/auth/oauth/accounts` endpoint (ctt-server 1e333dd)
- `oauth-account.schema.ts`: `OAuthAccountBindingSchema` + `OAuthAccountsResponseDataSchema` (provider as free-form string for future expansion, nullable providerLogin/email, ISO 8601 timestamps)
- `oauth-account.ts`: `fetchLinkedOAuthAccounts()` wraps `apiFetch` + `RestApiResponseSchema` + inner data schema; 401 propagates to existing interceptor
- `ProfileView.vue`: `useQuery` with `queryKey: ['oauth-accounts']`, `staleTime: 30s`, `refetchOnWindowFocus: true`; dynamic rendering for loading / error / connected / disconnected; `getProviderDisplay` switch/case for future provider icons; providerLogin → providerEmail → bare "Connected" fallback chain
- Added 35 new tests (schema, API, view); 531/531 pass

### GitHub Button Loading & NProgress Spinner Fix (v0.8.29)

- `LoginForm.vue`: Added `isGithubLoading` ref, disabled state, spinner, "Connecting to GitHub..." text
- `guard.ts`: Disabled NProgress spinner with `NProgress.configure({ showSpinner: false })`
- Added 5 tests for GitHub button loading state

### AppLayout Router Fix (v0.8.28)

- `AppLayout.vue`: Replaced `<slot />` with `<router-view />` for child route rendering
- Settings/profile page now displays correctly

### Captcha Fixes (v0.8.25–v0.8.26)

- GitHub login button now checks captcha completion before proceeding
- Removed CaptchaWidget success text to prevent layout jump

### GitHub Button Hover Fix (v0.8.24)

- Removed `hover:text-[#5e6ad2]!` — light mode text stays black on hover

### Dependency Updates (v0.8.9–v0.8.23)

Routine dependency updates via `vp update`. See git log for details.

## Major Features (v0.7.x–v0.8.x)

### GitHub OAuth (v0.8.3)

Complete OAuth login flow: authorize/callback/error pages, GitHub button in LoginForm, 13 error codes, URL param cleanup, GitHub binding in ProfileView.

### hCaptcha Integration (v0.7.6)

Frontend CaptchaWidget + backend CaptchaService. Graceful degradation when captchaSiteKey=null. SECURITY_006/007 error codes.

### Terms Acceptance (v0.7.0)

Integrated with ctt-server v0.25.1. Fixed 3 P0 bugs (error code, endpoint path, schema). Added Chinese terms content, request queue replay.

## Bug Fixes (v0.5.x–v0.6.x)

### 0.6.9 — Accessibility Warning Fix
Fixed label-for mismatch and missing autocomplete attributes.

### 0.6.8 — Console Warnings Elimination
Fixed router config warning, guard next() deprecation, FormField injection, publicConfig ZodError.

### 0.6.7 — ResetPasswordForm TypeScript Fix
TS2322 fix: type assertion `as string` for optional schema.

### 0.6.6 — RegisterForm TypeScript Fix
TS2561/TS2345 fix: removed validateOnInput, created RegisterFormData type.

### 0.6.4 — Terms Acceptance Test Coverage
Added 53 new tests, JSDoc, lint cleanup, proper token storage.

### 0.5.83 — Code Review Fixes
Test assertion fix, documentation updates, atomic commits.

### 0.5.75–0.5.82 — UI Polish
Password error simplification, form spacing, 404 button centering, TermsDialog width, cursor styles, compact layout.

### 0.5.66–0.5.74 — ResetPasswordView
Complete implementation with error handling, cooldown, code review.

### 0.5.31–0.5.65 — Auth Module Completion
Password validation, logout fixes, auth initialization, guest guard, double toast fix, accessibility, ghost button system.

## Architecture Decisions

- CustomEvent pattern for cross-component communication (UNAUTHORIZED_EVENT, TERMS_EXPIRED_EVENT)
- Request queue with Promise callbacks for terms acceptance replay
- Layer separation: form components emit form-layer types, views inject API-layer fields
- Vue Router 4 guards use return values instead of next()
- NProgress spinner disabled for cleaner UX
