# Active Context: ctt-web

## Current Status

**Phase**: Auth Schema Layer — Review Fixes (v0.5.30)
**Version**: 0.5.30 (2026-04-30)

## Recent Activity

### 0.5.29 — Lint/SonarLint Warning Fix

Fixed 8 warnings in `AppSidebar.test.ts`: typed `vi.fn()` params, renamed unused `onClick` to `_onClick`, removed unnecessary type assertions, initialized `resolveLogout` with empty function to remove non-null assertions. 330/330 tests pass.

### 0.5.28 — Sidebar Light Mode Color Fix

Changed sidebar background from `#ffffff` to `#f3f4f5` (DESIGN.md "Light Surface") for proper visual hierarchy — sidebar recedes (grayest) < body (mid) < cards (brightest). Dark mode unchanged.

### 0.5.27 — DESIGN.md CSS Variable Alignment

Replaced all CSS variable colors in `main.css` with DESIGN.md exact hex values: dark mode `--background: #08090a`, `--foreground: #f7f8f8`, `--card: #191a1b`; light mode `--background: #f7f8f8`, `--card: #ffffff`. 330/330 tests pass.

### 0.5.26 — Dashboard DESIGN.md Compliance

Replaced DashboardHome.vue Tailwind light-mode defaults with CSS variable tokens (`text-foreground`, `bg-card`, `border-border`). Added `aria-label` to AppHeader logout button with Tooltip wrapper. 330/330 tests pass.

### 0.5.25 — Logout Code Review & Fixes

Added logout button to AppHeader.vue (requirement was "顶部导航"). Replaced `any` types with proper TypeScript. Added test cleanup, unmount, new tests (double-click, navigation, branding). README updated.

### 0.5.19 — Vitest .agents Exclusion Fix

Added 18 test cases to `instance.test.ts` covering AUTH_002/AUTH_003 refresh, retry with `__authRetry`, infinite loop guard, refresh failure handling, terminal auth errors, mutex behavior. 328/328 tests pass.

### 0.5.17 — Interceptor Code Review Fixes

**Critical**: Retry used raw `ofetch` instead of `apiFetch` → expired token sent → user kicked to login. Fixed by using `apiFetch` on retry. Added JSDoc to `apiFetch` and `UNAUTHORIZED_EVENT`. Added network error toast.

### 0.5.16 — AUTH_003 Refresh Trigger Fix

Backend returns `AUTH_003` for all JWT failures, but interceptor only triggered refresh on `AUTH_002` (never thrown). Extended 401 trigger to include `AUTH_003`. Added inline terminal handling for refresh failure.

### Atomic Git Commits & Cherry-pick (2026-04-30)

**6 atomic commits on `develop`**: logout button, dashboard CSS tokens, CSS variable alignment, README update, memory-bank (AI-only, NOT cherry-picked), version bump.

**Cherry-picked 5 non-AI commits to `master`**: All code/doc/version commits landed. Master HEAD: `faa6a60`. Working directory clean.

### Acceptance Verification — Token Refresh & Global Logout (2026-04-30)

| #   | Criterion                        | Verdict    | Evidence                                     |
| --- | -------------------------------- | ---------- | -------------------------------------------- |
| 1   | Auto-refresh expired token       | ✅ PASS    | instance.ts L102-109 refresh trigger + retry |
| 2   | Concurrent 401 dedup             | ✅ PASS    | Promise lock + mutex + \_\_authRetry flag    |
| 3   | Expired refresh → unified /login | ✅ PASS    | Mutex prevents multiple redirects            |
| 4   | Logout fail-safe (429)           | ✅ PASS    | try/catch/finally, clearAuth always runs     |
|     | **Test suite**                   | ✅ 330/330 | 17 files                                     |

### Notion Dev Plan Tracking Update (2026-04-30)

Updated Notion「🌐 ctt-web 开发计划」Section C「3. 导航栏接入」checkboxes to [x]. AppHeader.vue confirmed: `authStore.logout()` on click, `isLoggingOut` loading state, double-click guard.

### Auth Schema Layer Verification (2026-04-30)

**Task**: Notion Section D「忘记密码与重置密码」1. Schema 层 — verify `ForgotPasswordRequestSchema` and `ResetPasswordRequestSchema`.

**Result**: Both schemas **already implemented** in `src/lib/schemas/auth.schema.ts` (L176-179, L193-198). Also includes `ResetPasswordFormSchema` with `confirmPassword` + `refine` cross-field matching (L208-214) — follows same pattern as `RegisterRequestSchema` + `RegisterFormSchema`. No code changes needed. Notion D.1 checkboxes updated to [x], delivery table status → ✅ 已完成.

### Auth Schema Layer Code Review (2026-04-30)

**Scope**: Comprehensive 5-axis code review (deep agent + code-review-and-quality skill) of ForgotPassword/ResetPassword Schema layer. Full test suite 330/330 PASS.

**Findings**:
- Schema definitions ✅ correct (ForgotPasswordRequestSchema, ResetPasswordRequestSchema, ResetPasswordFormSchema)
- API integration ✅ correct (parse before send, EmptyResponseDataSchema response validation)
- Security ✅ correct (StrongPasswordSchema, anti-enumeration design, payload filtering)
- **Missing tests** 🔴 `ForgotPasswordRequestSchema`/`ResetPasswordRequestSchema`/`ResetPasswordFormSchema` have zero unit tests in `auth.schema.test.ts`
- `ForgotPasswordFormSchema` defined inline in component instead of `auth.schema.ts` (inconsistent with RegisterFormSchema pattern)
- `ResetPasswordForm.vue` dead code — component exists but unused; `ResetPasswordView.vue` inlines form (pre-existing issue)

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
