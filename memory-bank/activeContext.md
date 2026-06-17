# Active Context: ctt-web

## Current Status

**Phase**: GitHub OAuth Frontend Complete
**Version**: 0.8.29 (2026-06-17)
**Branch**: develop at 1bccea6, master at 647f5ac
**Tests**: 495/495 pass (verified 2026-06-17)
**Plans**:
- docs/plans/2026-05-02-terms-acceptance-tracking.md — completed
- docs/plans/2026-05-23-hcaptcha-integration.md — completed
- .dev/plans/2026-05-28-github-oauth.md — completed

## Recent Activity (v0.8.x — 2026-06)

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
