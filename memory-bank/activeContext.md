# Active Context: ctt-web

## Current Status

**Phase**: Auth API Layer — Reset Password Refactoring (v0.5.31)
**Version**: 0.5.31 (2026-04-30)

## Recent Activity

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
