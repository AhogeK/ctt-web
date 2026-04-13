# Active Context: ctt-web

## Current Status

**Phase**: Auth module review complete — all issues fixed, tests passing
**Version**: 0.5.0-beta.23 (2026-04-12)

## Recent Changes (2026-04-12)

### Code Review Fixes
- **systemPatterns.md**: 237 lines → 147 lines (AGENTS.md 200-line limit)
- **instance.ts**: Hardcoded `'ctt_access_token'` → `STORAGE_KEYS.ACCESS_TOKEN`
- **Type guards**: 5 `as` assertions → `isApiError()` checks in LoginView/RegisterView/VerifyEmailView/useResendVerification
- **guard.ts**: Removed TODO, switched to Pinia auth store `isAuthenticated`
- **PasswordStrengthMeter**: Added max32 + allowed chars rules (7 rules total)
- **VerifyEmailView**: AUTH_004 precise error code check
- **Docs sync**: DESIGN.md/api-error.ts added to techContext.md/architecture.md

### Test Fixes
- **auth.test.ts**: Zod validation error expectation (`/accessToken|invalid/i`)
- **useResendVerification.test.ts**: Mock with `statusCode` for `isApiError` recognition

### Verification
- Type-check: 0 errors
- Lint: 0 warnings
- Tests: 285 passing (15 files)
- Format: 180 files formatted

## Previous Context

### Auth Module Component Extraction
Extracted 5 components from AuthLayout.vue (1576 lines → modular):

- **AuthDashboardMockup.vue** — Dashboard mockup + metrics card + terminal card composite (~200 lines), theme-aware, VueUse useTransition animations
- **AuthMetricsCard.vue** — Animated counters with spring easing, sparkline bars, language distribution, VueUse useTransition
- **AuthTerminalCard.vue** — Blinking cursor, command parsing, Berkeley Mono font, dark-themed terminal
- **AuthCodePreview.vue** — CSS syntax highlighting, language label, theme support
- **AuthFeatureShowcase.vue** — Feature cards grid, staggered entrance (80ms delay), spring hover lift, light/dark support

All components follow DESIGN.md Linear-style design, Vue 3 Composition API, proper JSDoc.

### Shared Error Utility
- **api-error.ts** — `src/lib/utils/api-error.ts` created
- Functions: `getErrorMessage()`, `isApiError()`, `mapApiErrorCode()`
- Types: `ApiError`, `ApiErrorResponse`
- Refactored `src/lib/utils.ts` → `src/lib/utils/index.ts` (directory structure)
- All imports (`@/lib/utils`) continue working

### Login Tests Added
- **auth.schema.test.ts** — +34 tests for LoginRequestSchema/LoginResponseSchema (67 total)
- **auth.test.ts** — +8 tests for login API (mock HTTP, success/error/network cases)
- **useDeviceId.test.ts** — 8 tests (UUID format, localStorage persistence, uniqueness)
- **useResendVerification.test.ts** — 15 tests (countdown, error handling, concurrent calls)

Total: +65 new tests, 282 tests passing (13 files)

### CSRF Protection Verification
- **Backend CSRF**: DISABLED — Stateless JWT architecture (correct)
- **OAuth CSRF**: ENABLED — State parameter via Redis (OAuthStateService)
- **Frontend**: No CSRF token handling needed for JWT endpoints
- **Security headers**: OWASP-compliant (CSP, X-Frame-Options, HSTS)

### Verification
- Type-check: 0 errors
- Lint: 0 warnings (oxlint + eslint)
- Tests: 282 passing (13 files), 3 pre-existing failures in guard.test.ts
- Format: all files formatted

## Previous Context

### Code Review Fixes (2026-04-12)
- **CRITICAL**: Fixed router guard token key mismatch — `guard.ts` now uses `STORAGE_KEYS.ACCESS_TOKEN`
- Removed meaningless numbered comments from `auth.ts`
- Synced README.md version from `beta.18` to `beta.21`
- Added Props JSDoc to PasswordStrengthMeter.vue, RegisterForm.vue, LoginForm.vue

### AuthLayout.vue Premium Redesign (2026-04-12)
- Wave 1-4: Shimmer removal, gradient border, theme consistency, metrics ticker, premium motion
- Dots flicker fix: Added `@keyframes dots-glow` for dark mode
- All DESIGN.md compliant, Inter Variable cv01/ss03

### Auth Pages (2026-04-11-12)
- RegisterView, RegisterForm, PasswordStrengthMeter, RegisterSuccessView, VerifyEmailView
- useDeviceId, useResendVerification composables
- Routes: /register, /register-success, /verify-email
- All 220 tests passing before new additions