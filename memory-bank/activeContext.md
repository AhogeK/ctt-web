# Active Context: ctt-web

## Current Status

**Phase**: Code Quality Fixes — Type Safety & Redundancy (v0.5.39)
**Version**: 0.5.39 (2026-05-01)

## Recent Activity

### 0.5.39 — Code Quality Fixes

Fixed issues found in code review:

1. **Type safety**: Added `guestOnly` to `RouteMeta` interface in `vue-router.d.ts`
2. **Type safety**: Created `ApiFetchOptions` interface for `__authRetry` flag
3. **Code redundancy**: Consolidated AUTH_003 handling using `handleTerminalAuthError`
4. **Documentation**: Updated README.md with new features (auth init, guest guard, password reset)
5. **Verification**: 384/384 tests pass, `vp check` clean.

### 0.5.38 — Auth Initialization with Token Validation

Implemented professional-standard token validation on app startup:

1. **Feature**: Added `initializeAuth()` method to auth store - validates tokens via refresh endpoint on page load
2. **Logic**: If refreshToken exists → try refresh → success = authenticated, failure = clear auth and return false
3. **Integration**: `main.ts` calls `initializeAuth()` before mounting app
4. **Test coverage**: Added 3 unit tests for initializeAuth() (no token, refresh success, refresh failure)
5. **Verification**: 384/384 tests pass, `vp check` clean.

### 0.5.37 — Logout Button Color Fix

Fixed logout button color to match DESIGN.md Ghost Button spec:

1. **Issue**: Button used `text-muted-foreground` (`#8a8f98`, tertiary text) which was too muted
2. **Fix**: Changed to `text-secondary-foreground` (`#d0d6e0`, secondary text) per DESIGN.md Ghost Button spec
3. **Verification**: 381/381 tests pass, `vp check` clean.

### 0.5.36 — Logout Bug Fix

Fixed logout bug where app gets stuck on "Logging out" when token is expired:

1. **Root cause**: Interceptor in `instance.ts` returned `undefined` (line 122) after handling terminal AUTH_003 error, preventing error propagation to `logout()` function
2. **Fix**: Removed `return` statement to let error propagate naturally to the caller's catch-finally block
3. **Behavior**: Error now propagates → `logout()` catches it → `finally` block runs → auth cleared, UI state reset
4. **Verification**: 381/381 tests pass, `vp check` clean.

### 0.5.35 — Guest Guard for Auth Routes

Implemented guest guard to redirect authenticated users away from auth pages:

1. **Feature**: Added `guestOnly: true` meta to all `/auth/*` routes (login, register, register-success, verify-email, forgot-password, reset-password)
2. **Guard logic**: Added guest-only check in `guard.ts` — authenticated users visiting guestOnly routes are automatically redirected to dashboard
3. **Test coverage**: Added 3 unit tests for guest guard behavior (redirect authenticated on login/register, allow unauthenticated on guest routes)
4. **Verification**: 381/381 tests pass, `vp check` clean.

### 0.5.34 — Double Toast Bug Fix

Fixed double toast bug in `src/lib/api/instance.ts`:

1. **Root cause**: Interceptor showed generic "Connection failed" toast when refresh failed (line 131), while `ResetPasswordView.vue` also showed its own toast for AUTH_003 → double toast.
2. **Fix**: Removed generic toast at line 131. Added comment explaining intentional error propagation. Now returns silently when `!refreshErrCode`, letting component's `onError` handle the error.
3. **Test fix**: Updated `instance.test.ts` to expect `toast.error` NOT to be called for network errors during refresh.
4. **Verification**: 368/368 tests pass, `vp check` clean.

### 0.5.33 — Review Fixes: R8 Violation + Localization Consistency

Post-implementation review fixes for ResetPasswordView.vue:

1. **R8 violation fix**: Replaced `(componentField as any).modelValue` with `useFieldValue('password')` (matches RegisterForm.vue pattern).
2. **Localization consistency**: Changed no-token English text to Chinese to match all other error messages in the same file.
3. **Test mock fix**: Added `useFieldValue` export to vee-validate mock in `ResetPasswordView.test.ts`.
4. **Verification**: 369/369 tests pass, `vp check` clean.

### 0.5.32 — ResetPasswordView Page Layer Completion

Completed remaining ResetPasswordView.vue page layer requirements:

1. **Success flow**: Redirect to `/login` with Chinese toast「密码已重置，所有设备已强制下线」.
2. **Error mapping**:
   - `401 AUTH_003` → Chinese toast「重置链接已失效或已使用，请重新申请」+ redirect to forgot-password
   - `409 PASSWORD_SAME_AS_OLD` → inline field error「新密码不能与当前密码相同」
   - `429` → `useCooldown` integration with countdown in toast
   - Default → Chinese fallback toast「密码重置失败，请稍后重试」
3. **Test Coverage**: Created `ResetPasswordView.test.ts` with 10 test cases covering all error scenarios + success flow (369/369 pass, `vp check` clean).

### 0.5.31 — Auth API Layer Refactoring

Refactored password reset API methods to match architect practice requirements:

1. **forgotPassword**: signature changed to `(data: ForgotPasswordRequest): Promise<void>`, removed response parsing.
2. **confirmPasswordReset**: renamed from `resetPassword`, signature changed to `(data: ResetPasswordRequest): Promise<void>`, removed response parsing.
3. **View Adaptation**: Updated `ForgotPasswordView.vue` (removed idempotentSkip logic) and `ResetPasswordView.vue` to match new signatures.
4. **Export Update**: Updated `src/lib/api/index.ts` export name.
5. **Test Coverage**: Added/updated tests in `auth.test.ts` (359/359 pass).

### 0.5.30 — Schema Layer Review Fixes

Fixed both issues from the review:

1. **Added 16 unit tests** for `ForgotPasswordRequestSchema` (3), `ResetPasswordRequestSchema` (5), `ResetPasswordFormSchema` (5), type inference (3) in `auth.schema.test.ts`
2. **Exported `ForgotPasswordFormSchema`** from `auth.schema.ts` + updated `ForgotPasswordForm.vue` to import it instead of inline definition

346/346 tests pass. `vp check` clean.

## History

### 0.5.0–0.5.15 Summary

| Version | Date       | Summary                                                                                                                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.5.14  | 2026-04-30 | globalThis migration in test setup (SonarQube S7764)                                                                                                                                         |
| 0.5.13  | 2026-04-30 | Zod v4 deprecated API fix: `z.string().uuid()` → `z.uuid()`                                                                                                                                  |
| 0.5.12  | 2026-04-30 | R9 violation fix: Chinese text → English in useResendVerification                                                                                                                            |
| 0.5.11  | 2026-04-30 | SonarQube VSCode config + over-120-char class string splits                                                                                                                                  |
| 0.5.10  | 2026-04-30 | Split over-120-char class strings with cn()                                                                                                                                                  |
| 0.5.9   | 2026-04-29 | Final cn removal + multiline class split                                                                                                                                                     |
| 0.5.8   | 2026-04-29 | Removed cn utility from UI components (native Vue array syntax)                                                                                                                              |
| 0.5.7   | 2026-04-29 | vp check AI file exclusion + TS config fix                                                                                                                                                   |
| 0.5.6   | 2026-04-29 | Reverted printWidth to 120                                                                                                                                                                   |
| 0.5.4   | 2026-04-29 | Switched to Vue stable release (removed beta overrides)                                                                                                                                      |
| 0.5.3   | 2026-04-29 | HTML lang corrected to `en`                                                                                                                                                                  |
| 0.5.2   | 2026-04-29 | HTML lang fixed (empty → `zh-CN`)                                                                                                                                                            |
| 0.5.1   | 2026-04-29 | Removed redundant env.d.ts module declaration                                                                                                                                                |
| 0.5.0   | 2026-04-29 | **Milestone**: Login + JWT auth complete (login page, token management, route guards, email verification, password reset, registration, auth layout, API contract skill, error code mapping) |

### Beta Era (0.5.0-beta.61–beta.95)

**Error Code Field Extraction (beta.84)**: Multiple views read `error.error` but backend returns `{ "code": "XXX" }`. Fixed all occurrences in LoginView, RegisterView, VerifyEmailView, useResendVerification, api-error.ts. Policy: error toasts use fixed messages, never leak HTTP details.

**Vite+ Migration (beta.84)**: Migrated to unified Vite+ toolchain. All configs merged into `vite.config.ts`. Scripts use `vp` CLI. Fixed env.d.ts, tsconfig references, test imports.

| Version       | Date       | Summary                                             |
| ------------- | ---------- | --------------------------------------------------- |
| 0.5.0-beta.95 | 2026-04-29 | Verified checklist file deleted (merged into 0.5.0) |
| 0.5.0-beta.94 | 2026-04-29 | AuthLayout short viewport responsive fix            |
| 0.5.0-beta.93 | 2026-04-29 | Verify-email 401 handler fixed (route-aware skip)   |
| 0.5.0-beta.92 | 2026-04-29 | EmptyResponse idempotentSkip field location fix     |
| 0.5.0-beta.91 | 2026-04-29 | Dialog footer button spacing fix                    |
| 0.5.0-beta.90 | 2026-04-28 | Vite dev server port fix (strictPort: true)         |
| 0.5.0-beta.89 | 2026-04-28 | Idempotent skip detection (10-min resend window)    |
| 0.5.0-beta.88 | 2026-04-28 | API contract verification skill created             |
| 0.5.0-beta.87 | 2026-04-28 | Login success Zod schema mismatch fix               |
| 0.5.0-beta.86 | 2026-04-28 | Double toast on backend errors fix                  |
| 0.5.0-beta.85 | 2026-04-28 | Auth UI consistency + error handling polish         |
| 0.5.0-beta.84 | 2026-04-28 | AuthLayout 1080p responsive + Vite+ migration       |
| 0.5.0-beta.82 | 2026-04-25 | LoginView form submission fix                       |
| 0.5.0-beta.80 | 2026-04-23 | DeviceId utility refactoring                        |
| 0.5.0-beta.79 | 2026-04-21 | StrongPassword schema + literal tokenType           |
| 0.5.0-beta.76 | 2026-04-17 | Toast format fix — short title + description        |
| 0.5.0-beta.74 | 2026-04-17 | Self-learning skill creation (transient-ui-capture) |
| 0.5.0-beta.67 | 2026-04-17 | Tailwind class strings → cn() multi-line            |
| 0.5.0-beta.61 | 2026-04-17 | Auth form zero-jump spacing                         |
