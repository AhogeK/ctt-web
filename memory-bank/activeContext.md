# Active Context: ctt-web

## Current Status

**Phase**: GitHub OAuth Frontend Complete
**Version**: 0.8.16 (2026-06-09)
**Branch**: develop at 38bd342, master at 9d1572d
**Tests**: 490/490 pass (verified 2026-06-01)
**Plans**:
- docs/plans/2026-05-02-terms-acceptance-tracking.md — status: completed
- docs/plans/2026-05-23-hcaptcha-integration.md — status: completed
- .dev/plans/2026-05-28-github-oauth.md — status: completed

## Recent Activity

### Dependency Update (2026-06-09)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `pnpm-lock.yaml`: Updated indirect dependencies (@typescript-eslint 8.60.1→8.61.0)

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-06)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated vue-tsc from 3.3.3 to 3.3.4
- `pnpm-lock.yaml`: Updated lock file with new dependency versions

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-05)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated vue-i18n from 11.4.4 to 11.4.5
- `package.json`: Updated @types/node from 25.9.1 to 25.9.2
- `pnpm-lock.yaml`: Updated lock file with new dependency versions

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-04)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated vue from 3.6.0-beta.13 to 3.6.0-beta.14
- `package.json`: Updated @vue/eslint-config-typescript from 14.7.0 to 14.8.0
- `package.json`: Updated @vue/test-utils from 2.4.10 to 2.4.11
- `pnpm-lock.yaml`: Updated lock file with new dependency versions

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-03)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `pnpm-lock.yaml`: Updated indirect dependencies (csstools, electron-to-chromium, enhanced-resolve, undici)

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-02)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated @tanstack/vue-query from 5.100.14 to 5.101.0
- `package.json`: Updated reka-ui from 2.9.8 to 2.9.9
- `package.json`: Updated eslint-plugin-vue from 10.9.1 to 10.9.2
- `pnpm-lock.yaml`: Updated lock file with new dependency versions

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-01)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated vite-plus from 0.1.23 to 0.1.24
- `package.json`: Updated @voidzero-dev/vite-plus-core from 0.1.23 to 0.1.24
- `package.json`: Updated @voidzero-dev/vite-plus-test from 0.1.23 to 0.1.24
- `pnpm-lock.yaml`: Updated lock file with new dependency versions
- `pnpm-workspace.yaml`: Updated vite-plus catalog version

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### Dependency Update (2026-06-01)

**Status**: ✅ All dependencies updated successfully

**Changes**:
- `package.json`: Updated zod from 3.x to 4.4.3 (major version upgrade)
- `package.json`: Updated @vitest/coverage-v8 from 4.1.7 to 4.1.8
- `package.json`: Updated @vitest/eslint-plugin from 1.6.18 to 1.6.19
- `pnpm-lock.yaml`: Updated lock file with new dependency versions

**Verification**:
- ✅ All 490 tests pass
- ✅ Build successful
- ✅ No breaking changes detected

### OAuth Security Fix (2026-05-28)

**Status**: ✅ Open redirect vulnerability fixed

**Changes**:
- `src/features/auth/views/OAuthCallbackView.vue`: Added `isSafeRedirect()` function to validate redirect URLs
- `src/features/auth/views/__tests__/LoginView.test.ts`: Fixed mock to handle dual `useMutation` calls

**Verification**:
- ✅ TypeScript diagnostics clean
- ✅ All 490 tests pass
- ✅ Lint clean

## Recent Activity

### GitHub OAuth Frontend Complete (2026-05-28)

**Status**: ✅ All requirements from OAuth guide implemented

**Changes**:
- `src/lib/schemas/auth.schema.ts`: Added `GitHubAuthorizeResponseSchema` with `z.url()` validation
- `src/lib/api/auth.ts`: Added `getGitHubAuthorizeUrl()` function for `GET /api/v1/auth/oauth/github/authorize`
- `src/lib/api/index.ts`: Exported new function
- `src/features/auth/views/OAuthErrorView.vue`: Error page with 13 error codes
- `src/features/auth/views/OAuthCallbackView.vue`: Added `history.replaceState` to clean URL params
- `src/router/modules/oauth.ts`: Added `/oauth/error` route
- `src/router/route-names.ts`: Added `OAUTH_ERROR` constant
- `src/features/auth/components/LoginForm.vue`: Added GitHub login button with "or" divider
- `src/features/auth/views/LoginView.vue`: Added GitHub login mutation and handler
- `src/features/settings/views/ProfileView.vue`: Added GitHub binding button

**Verification**:
- ✅ TypeScript diagnostics clean
- ✅ All 490 tests pass
- ✅ All OAuth guide requirements implemented

### hCaptcha Code Review Fixes (2026-05-24)

**Status**: ✅ All review issues resolved

**Review Findings & Fixes**:
1. RegisterForm.vue emit type simplified (`RegisterFormData & { captchaToken?: string }` → `RegisterFormData`)
2. docs/architecture.md: 3 hCaptcha entries added (Tech Stack, Directory, API Layer)
3. ForgotPasswordView.test.ts: SECURITY_006/007 tests + usePublicConfig mock
4. 5 new test files created: LoginForm, RegisterForm, ForgotPasswordForm, LoginView, RegisterView
5. LoginView/RegisterView captcha ref reset tests: `vi.mock` → `global.stubs` fix

**Root Cause of Test Failure**: `vi.mock` creates module-level mock that doesn't integrate with VTU's template ref system. `expose()` in `vi.mock`'s `defineComponent` doesn't bind to template refs. Fix: use `global.stubs` in mount options so VTU creates the stub itself.

**Verification**: 490/490 tests pass, type-check OK, build OK

### hCaptcha Integration Complete (2026-05-23)

**Status**: ✅ Frontend + Backend integration complete

**Frontend (ctt-web)**:
- CaptchaWidget.vue: Thin wrapper around @hcaptcha/vue3-hcaptcha with v-model support
- PublicConfigSchema: Added captchaSiteKey (nullable, null = captcha disabled)
- Auth schemas: captchaToken added to LoginRequest, RegisterRequest, ForgotPasswordRequest
- Auth forms: LoginForm, RegisterForm, ForgotPasswordForm integrated with CaptchaWidget
- Views: Config fetch via usePublicConfig(), captcha reset on mutation result
- Verification: type-check ✅, lint ✅, build ✅

**Backend (ctt-server)**:
- CaptchaService.java: Server-side verification via hcaptcha.com/siteverify
- Auth DTOs: captchaToken field added to login/register/forgot-password requests
- Public config: GET /api/v1/config/public returns captchaSiteKey
- Error codes: SECURITY_006 (verification failed), SECURITY_007 (missing token)

**Architecture**:
- Graceful degradation: captchaSiteKey=null → no widget rendered
- Backend verification mandatory (frontend token is just a signed string)
- hCaptcha Free Tier: 100K verifications/month, visible challenges to users

**Plan**: docs/plans/2026-05-23-hcaptcha-integration.md — status: completed

### 0.7.5 — Terms Decline Flow Fix (2026-05-23)

Fixed bug where declining terms dialog didn't block app access.

**Problem**: When `termsExpired=true` during login, clicking "Decline" in TermsDialog only closed the dialog but didn't clear auth tokens or redirect to login. User could continue using the app with valid tokens.

**Root Cause**: `handleTermsRejected()` in App.vue only called `rejectTermsQueue()` (rejecting queued API requests) but didn't clear auth state or navigate to login.

**Fix**:
1. `src/App.vue`: Added `authStore.clearAuth()` + `router.push({ name: RouteNames.LOGIN })` + `toast.error()` to `handleTermsRejected()`
2. `src/features/auth/components/TermsDialog.vue`: Removed direct `rejectTermsQueue()` call from dialog close watcher — now only emits `rejected` event, parent handles all cleanup
3. `src/features/auth/components/__tests__/TermsDialog.test.ts`: Updated tests to verify event emission instead of direct function call, removed unused mock

**Verification**:
- ✅ TypeScript diagnostics clean (0 errors)
- ✅ All 451 tests pass
- ✅ Production build successful

### 0.7.3 — RegisterForm agreedToTerms Undefined Fix (2026-05-22)

Fixed Zod validation error on registration page: "Invalid input: expected boolean, received undefined" appeared below the terms checkbox when clicking "Create Account".

**Root Cause**: `RegisterForm.vue` `useForm()` had no `initialValues`, so `agreedToTerms` started as `undefined`. Zod's `z.boolean()` rejected `undefined` before `.refine()` could run.

**Fix**: Added `initialValues: { agreedToTerms: false }` to `useForm()` call in `RegisterForm.vue` line 25-30.

**Verification**:
- ✅ TypeScript diagnostics clean (0 errors)
- ✅ All 451 tests pass
- ✅ Production build successful (1.26s)

### 0.7.2 — TermsDialog readOnly Mode + Test Fixes (2026-05-19)

Fixed registration flow 401 error: clicking "Accept" in TermsDialog during registration called `acceptTerms()` API which requires JWT, but user isn't logged in yet.

**Fix**: Added `readOnly` prop to TermsDialog. When `readOnly=true` (used in registration), only shows "Close" button, hides Accept/Decline, no API call. RegisterForm passes `:read-only="true"`.

**Also fixed**: 7 pre-existing test failures from v0.7.0 (TERMS_EXPIRED→AUTH_019, acceptTerms endpoint path, LoginResponse schema fields, empty password validation).

**Commits on develop**: `1260846` fix(terms): add readOnly mode, `a6cdabc` fix(test): update tests, `e213e10` chore: bump version to 0.7.2
**Cherry-picked to master**: `9197cdc` + `b154fd6` + `ad67ecf`

### 0.7.1 — TermsDialog Scrollbar Theme Fix (2026-05-19)

Fixed TermsDialog scrollbar not adapting to dark theme (white scrollbar on dark background).

**Fix**: Added `.terms-scrollable` class + `<style scoped>` block with shadcn-vue CSS variables (`--muted-foreground`, `--foreground`) for automatic light/dark adaptation. 6px thin scrollbar, transparent track, themed thumb.

**Commits on develop**: `3438af5` fix(terms): add themed scrollbar styling to TermsDialog, `48707dd` chore: bump version to 0.7.1
**Cherry-picked to master**: `6a270a6` + `c576e51`

### 0.7.0 — Terms Acceptance Frontend Integration (2026-05-09)

Integrated with ctt-server v0.25.1 Terms Acceptance API. Fixed 3 P0 bugs and added 4 P1 features.

**P0 Bugs Fixed**:

1. **Error code mismatch** (`src/lib/api/instance.ts`): Changed `'TERMS_EXPIRED'` → `'AUTH_019' || 'USER_008'` in 403 interceptor
2. **Wrong endpoint path** (`src/lib/api/auth.ts`): Fixed `/api/v1/terms/accept` → `/api/v1/auth/terms/accept`
3. **Response schema mismatch** (`src/lib/api/auth.ts`): Changed `AuthResponseSchema` → `LoginResponseSchema` for acceptTerms response

**P1 Features Added**: 4. **Error code mapping** (`src/lib/utils/api-error.ts`): Added AUTH_019 and USER_008 user-friendly messages 5. **Registration error handling** (`src/features/auth/views/RegisterView.vue`): Added 400+USER_008 toast with terms update message 6. **Chinese terms content** (`src/features/auth/content/terms-zh.ts`): Full Simplified Chinese translation of terms 7. **Refresh token termsExpired** (`src/stores/auth.ts`): Added termsExpired check in refreshAccessToken response

**Files Modified**:

- `src/lib/api/instance.ts` — 403 interceptor error code fix
- `src/lib/api/auth.ts` — acceptTerms endpoint path + response schema fix
- `src/lib/utils/api-error.ts` — AUTH_019, USER_008 error mapping
- `src/features/auth/views/RegisterView.vue` — USER_008 error handling
- `src/features/auth/content/terms-zh.ts` — NEW: Chinese terms content
- `src/stores/auth.ts` — refreshAccessToken termsExpired check
- `package.json` — version 0.6.9 → 0.7.0

**Verification**:

- ✅ TypeScript diagnostics clean (0 errors)
- ✅ Production build successful (672ms)

**Already Implemented (from prior sessions)**:

- TermsDialog.vue, TermsCheckbox.vue components
- terms-en.ts English content
- Request queue mechanism (resolveTermsQueue/rejectTermsQueue)
- App.vue TERMS_EXPIRED_EVENT listener
- usePublicConfig composable for /api/v1/config/public
- RegisterView termsVersion injection
- LoginForm termsExpired handling

### 0.6.9 — Accessibility Warning Fix (2026-05-06)

Fixed 2 accessibility warnings identified by user:

**Problems Fixed**:

1. **Label for mismatch**: FormLabel's `for` attribute doesn't match input id (3 violating nodes)
2. **Missing autocomplete**: Form fields lack autocomplete attributes (1 violating node)

**Root Causes & Solutions**:

1. **RegisterForm.vue agreedToTerms Checkbox**: Checkbox NOT wrapped in FormControl → FormLabel's `for` has no matching input id → Wrapped Checkbox in `<FormControl>` component
2. **All auth forms Inputs**: Missing `autocomplete` attributes → Browser autofill doesn't work → Added autocomplete attributes:
   - RegisterForm: email → `"email"`, password → `"new-password"`, confirmPassword → `"new-password"`
   - LoginForm: email → `"email"`, password → `"current-password"`
   - ForgotPasswordForm: email → `"email"`
   - ResetPasswordForm: newPassword → `"new-password"`, confirmPassword → `"new-password"`

**Files Modified**:

- `src/features/auth/components/RegisterForm.vue` (lines 195-214): Wrapped Checkbox in `<FormControl>`
- `src/features/auth/components/RegisterForm.vue` (lines 71, 125, 165): Added autocomplete attributes
- `src/features/auth/components/LoginForm.vue` (lines 66, 100): Added autocomplete attributes
- `src/features/auth/components/ForgotPasswordForm.vue` (line 39): Added autocomplete attribute
- `src/features/auth/components/ResetPasswordForm.vue` (lines 41, 71): Added autocomplete attributes
- `package.json`: version 0.6.8 → 0.6.9

**Verification**:

- ✅ TypeScript diagnostics clean (0 errors)
- ✅ Lint clean (0 warnings, 0 errors on 213 files)
- ✅ Tests pass (444/444)

**Accessibility Best Practices**: shadcn-vue FormField requires FormControl wrapper for all form controls (including Checkbox), standard autocomplete values for auth forms improve autofill UX.

### 0.6.8 — Console Warnings/Errors Elimination (2026-05-06)

Fixed 5 console warnings/errors identified by user:

**Problems Fixed**:

1. **Router Config Warning**: "home" route has child without name, empty path, no children
2. **Guard next() Deprecation**: Vue Router 4+ deprecates `next()` callback
3. **PasswordStrengthMeter Prop Undefined**: `useFieldValue` returns `ComputedRef<string | undefined>`, prop expects `string`
4. **agreedToTerms FormField Injection Missing**: `FormLabel/FormMessage` outside `FormItem`, missing injection context
5. **publicConfig ZodError (CRITICAL)**: Missing `RestApiResponse` wrapper parsing, unhandled promise rejection

**Root Causes & Solutions**:

1. **router/index.ts**: Child route with `path: ''` lacked `name` property → Added `RouteNames.HOME_INDEX`
2. **router/guard.ts**: Deprecated `next()` callback pattern → Replaced with return value pattern (Vue Router 4 best practice)
3. **RegisterForm.vue password**: `useFieldValue<string>('password')` returns undefined before field value set → Added `?? ''` fallback
4. **RegisterForm.vue agreedToTerms**: Checkbox + FormLabel/FormMessage without FormItem wrapper → Wrapped in `<FormItem>` component
5. **config.ts**: Backend returns `RestApiResponse` wrapper `{ success, message, data, timestamp }`, frontend directly parsed as `{ termsVersion }` → Added wrapper parsing step

**Files Modified**:

- `src/lib/api/config.ts` (lines 1, 14-16): Import RestApiResponseSchema, parse wrapper → extract data
- `src/router/route-names.ts` (line 8): Added `HOME_INDEX: 'home-index'`
- `src/router/index.ts` (line 22): Added `name: RouteNames.HOME_INDEX` to child route
- `src/router/guard.ts` (lines 11-32): Removed `next` parameter, replaced callbacks with return values
- `src/features/auth/components/RegisterForm.vue` (line 151): `passwordValue` → `passwordValue ?? ''`
- `src/features/auth/components/RegisterForm.vue` (lines 195-212): Wrapped agreedToTerms content in `<FormItem>`
- `src/lib/api/__tests__/config.test.ts` (lines 16-48): Updated mocks to match RestApiResponse wrapper structure
- `package.json`: version 0.6.7 → 0.6.8

**Verification**:

- ✅ TypeScript diagnostics clean (0 errors in modified files)
- ✅ Lint clean (0 warnings, 0 errors on 213 files)
- ✅ Tests pass (444/444)
- ✅ Console warnings eliminated

**Architecture Insight**: Vue Router 4 navigation guards should return values instead of calling `next()`. Return route object to redirect, return false to cancel, return undefined to proceed.

**Agent Research**: Systematic debugging process (Phase 1-4) - 6 parallel agents (4 explore + 2 librarian) collected evidence, librarian confirmed Vue Router 4 patterns + vee-validate Field integration.

### 0.6.7 — ResetPasswordForm TypeScript TS2322 Fix (2026-05-06)

Fixed TypeScript compilation error in ResetPasswordForm.vue:

**Problem**: TS2322 error line 26 - `values.newPassword` (string | undefined) not assignable to emit type `{ newPassword: string }`

**Root Cause**: StrongPasswordSchema defined as `.optional()` for reuse across login/register/reset contexts. Vee-validate form values are optional by default, but after handleSubmit validation passes, newPassword is guaranteed defined.

**Solution**: Applied type assertion `as string` matching existing pattern at line 55 (PasswordStrengthMeter already uses same assertion).

**Files Modified**:

- `src/features/auth/components/ResetPasswordForm.vue` (line 26): `emit('submit', { newPassword: values.newPassword as string })`
- `package.json`: version 0.6.6 → 0.6.7

**Verification**:

- ✅ TypeScript diagnostics clean (no TS2322 errors)
- ✅ Build succeeds

**Architecture Note**: ResetPasswordForm.vue is currently unused - ResetPasswordView.vue has inline form implementation that injects `token` from URL query param. If ResetPasswordForm component is used in future, parent must inject token similar to RegisterView injecting termsVersion.

### 0.6.6 — RegisterForm TypeScript TS2561 + TS2345 Fix (2026-05-06)

Fixed two TypeScript compilation errors in RegisterForm.vue:

**Problem 1**: TS2561 error line 27 - `validateOnInput: true` doesn't exist in FormOptions type
**Problem 2**: TS2345 error lines 54-58 - emit missing `termsVersion` (required field)

**Root Causes**:

1. **vee-validate v4.15.1 API change**: FormOptions only accepts `validateOnMount`. `validateOnInput`, `validateOnBlur`, `validateOnChange` must be configured via global `configure()` or per-field `defineField()`.
2. **Type mismatch**: RegisterForm emit declared as `RegisterRequest` (API-layer type with termsVersion), but actual emit sent `RegisterFormData` (form-layer type without termsVersion).

**Solution**:

1. Removed `validateOnInput: true` from 4 form components (RegisterForm, LoginForm, ResetPasswordForm, ForgotPasswordForm) - rely on vee-validate defaults.
2. Created `RegisterFormData` type (Omit<RegisterRequest, 'termsVersion'>) to distinguish form-layer vs API-layer data structures.
3. Updated RegisterForm emit declaration to `RegisterFormData`.
4. Updated RegisterView.handleSubmit parameter to `RegisterFormData` (injects termsVersion before API call).

**Files Modified**:

- `src/lib/schemas/auth.schema.ts`: added `RegisterFormData` type with docstring
- `src/features/auth/components/RegisterForm.vue`: removed validateOnInput (line 27), updated emit type (lines 20-23)
- `src/features/auth/views/RegisterView.vue`: imported RegisterFormData, updated handleSubmit signature (line 55)
- `src/features/auth/components/LoginForm.vue`: removed validateOnInput (line 23)
- `src/features/auth/components/ResetPasswordForm.vue`: removed validateOnInput (line 23)
- `src/features/auth/components/ForgotPasswordForm.vue`: removed validateOnInput (line 22)
- `package.json`: version 0.6.5 → 0.6.6

**Verification**:

- ✅ TypeScript diagnostics clean (0 errors in auth components directory)
- ✅ All 467 tests pass
- ✅ Build succeeds

**Architecture Insight**: Layer separation - form components emit form-layer types (RegisterFormData), views inject missing fields for API-layer types (RegisterRequest). This prevents tight coupling between UI and API schemas.

**Agent Research**: Librarian agent (bg_3f7c97b0) confirmed vee-validate v4 API changes. Explore agent (bg_2ad27a25) verified backend requires termsVersion (not auto-injected).

Fixed TypeScript compilation error for defineModel v-model testing:

**Problem**: TS2353 error on lines 385, 398 - `wrapper.setProps({ open: false })` causing "Object literal may only specify known properties, and 'open' does not exist in type".

**Root Cause**: Vue 3 defineModel macro creates two-way binding (`open` prop + `update:open` event), but TypeScript doesn't recognize defineModel-generated props in `wrapper.setProps` context.

**Solution**: Applied `as any` type assertion to preserve original behavior (librarian agent recommendation, matches openobserve/openobserve real-world pattern).

**Files Modified**:

- `src/features/auth/components/__tests__/TermsDialog.test.ts` (lines 385, 398): `await wrapper.setProps({ open: false } as any)`
- `package.json`: version 0.6.4 → 0.6.5

**Verification**:

- ✅ TypeScript diagnostics clean (no TS2353 errors)
- ✅ All 22 TermsDialog tests pass (including 2 previously failing tests)
- ✅ Tests compile and run correctly

**Alternative Approaches Tried**:

- `$emit('update:open', false)`: Fixed TS error but broke test behavior (watch not triggered)
- `wrapper.vm.open = false`: Same issue
- Type assertion `as any`: **SUCCESS** - pragmatic solution used in production codebases

**Architecture Insight**: Vue Test Utils documentation recommends event pattern for v-model testing, but defineModel's watch behavior requires `setProps` to trigger reactive state changes. Type assertion is the pragmatic compromise.

### 0.6.4 — Duplicate API Request Elimination (2026-05-06)

Final audit and cleanup of the Terms Acceptance feature. All tests pass and lint warnings resolved.

**Key Fixes**:

- **Test Coverage**: Added 53 new tests covering API, Store, and UI layers (+23 in `TermsDialog.test.ts`).
- **Code Quality**: Added missing JSDoc for `TERMINAL_AUTH_CODES`, `PendingTermsRequest`, and `renderSectionContent`.
- **Lint Cleanup**: Resolved all SonarLint and ESLint warnings in test files (removed unnecessary assertions, replaced `window` with `globalThis`).
- **Logic Fixes**: Implemented proper token storage and navigation after terms acceptance; handled dialog closure edge cases.

**Commits on develop**:

- `e2539d0` feat(auth): add terms acceptance tracking API infrastructure (5 files)
- `3d91ea7` feat(auth): integrate terms acceptance UI with request queue replay (3 files)
- `f1bc345` test: update test data for terms acceptance feature (3 files)
- `181d5f1` chore: bump version to 0.6.0 (1 file)
- `4171d9e` chore: update memory-bank and docs for terms acceptance (2 files, AI content)

**Architecture Decision**: CustomEvent pattern for TERMS_EXPIRED (consistent with UNAUTHORIZED_EVENT). Request queue with Promise callbacks for replay after acceptance.

**Files Modified (8 total)**:

1. `src/lib/api/__tests__/auth.test.ts` — Added termsVersion to 2 register test payloads
2. `src/lib/schemas/__tests__/auth.schema.test.ts` — Added termsVersion to 7 test data/type objects
3. `src/features/auth/components/__tests__/TermsCheckbox.test.ts` — Button text 'Close' → 'Decline'
4. `src/lib/api/index.ts` — Added acceptTerms barrel export
5. `src/lib/api/instance.ts` — TERMS_EXPIRED_EVENT constant + request queue + resolve/reject exports
6. `src/features/auth/views/RegisterView.vue` — Error toast on getPublicConfig fail
7. `src/features/auth/components/TermsDialog.vue` — Accept/reject handlers + error handling + emits
8. `src/App.vue` — TERMS_EXPIRED event listener + TermsDialog integration

**Key Implementation Details**:

- `instance.ts`: Added `TERMS_EXPIRED_EVENT`, `PendingTermsRequest` interface, `processTermsQueue()` helper, `resolveTermsQueue()` and `rejectTermsQueue()` exports
- `TermsDialog.vue`: Added `defineEmits<{ accepted: []; rejected: [] }>()`, `handleAccept()` calling `acceptTerms()` API, `handleReject()`, loading state, error handling with toast
- `App.vue`: Added `isTermsDialogOpen` ref, event listener in onMounted/onUnmounted, TermsDialog component with v-model:open + @accepted + @rejected
- `RegisterView.vue`: Replaced silent catch with toast error + console.error

**Git Status**: 5 clean commits on develop, working tree clean. Pending cherry-pick to master.
**Plan Updated**: `docs/plans/2026-05-02-terms-acceptance-tracking.md` — status → in-progress, added implementation audit section

### 0.5.83 — Code Review Fixes & Atomic Commits

Fixed all critical and important issues identified in comprehensive code review:

**1. Test Assertion Fix**:

- Updated `auth.schema.test.ts` line 104: `toContain('ASCII')` → `toContain('invalid characters')`
- Matches simplified error message `'Password contains invalid characters'`
- Result: All 392 tests now pass

**2. Documentation Version Updates**:

- `memory-bank/activeContext.md`: Version 0.5.77 → 0.5.82 → 0.5.83, Phase → UI Polish & Refinement
- `memory-bank/techContext.md`: Vue Router ^4 → ^5, Vue ^3.5 → ^3.6 (beta)
- `memory-bank/systemPatterns.md`: Added devices.ts and leaderboard.ts to router modules

**3. README & Architecture Docs**:

- `README.md`: Added devices/ and leaderboard/ to project structure and features table
- `docs/architecture.md`: Added feature directories, router modules, and chunk groups

**4. Atomic Commits on develop** (5 commits, following AGENTS.md R6.5):

- `3e76f63` fix(ui): polish auth form spacing, cursor styles, and TermsDialog width (14 files)
- `a9767fb` fix(auth): simplify password error message and fix test assertion (2 files)
- `360e379` docs: add devices and leaderboard features to README and architecture (2 files)
- `cac123c` chore: update memory-bank for v0.5.82-v0.5.83 (3 files, AI content)
- `5fba086` chore: bump version to 0.5.83 (1 file, independent)

**5. Cherry-pick to master** (4 non-AI commits, skipped cac123c):

- `874845f` fix(ui): polish auth form spacing, cursor styles, and TermsDialog width
- `2a40414` fix(auth): simplify password error message and fix test assertion
- `5b6242f` docs: add devices and leaderboard features to README and architecture
- `469b496` chore: bump version to 0.5.83

**Verification**:

- ✅ 392/392 tests pass
- ✅ vp check pass (4 pre-existing lint errors unrelated)
- ✅ All documentation consistent with code state
- ✅ 5 atomic commits on develop, pushed to origin
- ✅ 4 cherry-picked commits on master, pushed to origin
- ✅ AI content isolated on develop, not polluting master

### 0.5.82 — Fix Terms of Service Dialog Width

Fixed Terms of Service dialog being too narrow:

**Problem**: Dialog appeared too narrow, making text content look cramped and awkward.

**Root Cause**: DialogContent base styles have `sm:max-w-lg` constraint. The `max-w-2xl` class without breakpoint prefix was being overridden.

**Solution**: Changed TermsDialog width from `max-w-2xl` to `sm:max-w-3xl` (768px) to properly override the base constraint.

**File Updated**: `src/features/auth/components/TermsDialog.vue` (line 23)

**Result**:

- ✅ Dialog width increased from 672px to 768px
- ✅ More comfortable line length for reading terms content
- ✅ Properly overrides DialogContent base styles
- ✅ Maintains mobile responsiveness

**Verification**: lsp_diagnostics clean

### 0.5.81 — Fix Password Eye Icon Cursor

Fixed missing pointer cursor on password visibility toggle buttons:

**Problem**: Eye icons for showing/hiding password did NOT show pointer cursor on hover.

**Files Updated**:

- `src/features/auth/components/LoginForm.vue` — password toggle button
- `src/features/auth/components/RegisterForm.vue` — password toggle button
- `src/features/auth/components/RegisterForm.vue` — confirm password toggle button

**Fix**: Added `cursor-pointer` class to all 3 password toggle buttons.

**Result**:

- ✅ Hovering over eye icons now shows pointer cursor
- ✅ Click functionality unchanged
- ✅ Consistent with other interactive elements

**Verification**: lsp_diagnostics clean

### 0.5.80 — Fix Cursor Pointer Styles

Fixed incorrect cursor styles in RegisterForm terms agreement section:

**Problem**:

1. "I agree to the" (plain text) showed pointer cursor incorrectly
2. "Terms of Service" (clickable link) did NOT show pointer cursor
3. Checkbox did NOT show pointer cursor

**Root Cause**:

- `FormLabel` had `cursor-pointer` class, but it wraps both plain text AND the link
- Checkbox and link button lacked `cursor-pointer` class

**Fix Applied to `src/features/auth/components/RegisterForm.vue`**:

1. **Checkbox**: Added `cursor-pointer` class
2. **FormLabel**: Removed `cursor-pointer` class (was causing plain text to show pointer)
3. **Terms of Service button**: Added `cursor-pointer` class

**Result**:

- ✅ Checkbox → pointer cursor on hover
- ✅ "Terms of Service" link → pointer cursor on hover
- ✅ "I agree to the" plain text → default cursor (no pointer)

**Verification**: lsp_diagnostics clean

### 0.5.79 — Compact Form Layout

Made all auth forms more compact for better space efficiency:

**Changes Applied to All Auth Forms** (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm):

1. **Form gap**: `gap-4` (16px) → `gap-3` (12px) — saves 4px × 5 gaps = 20px
2. **Top padding**: `pt-6` (24px) → `pt-4` (16px) — saves 8px
3. **Input height**: `h-11` (44px) → `h-10` (40px) — saves 4px × 4 inputs = 16px
4. **Button margin**: `mt-4` (16px) → `mt-3` (12px) — saves 4px
5. **Button height**: `h-11` (44px) → `h-10` (40px) — saves 4px

**Total Vertical Savings**: ~52px per form

**Files Updated**:

- `src/features/auth/components/LoginForm.vue`
- `src/features/auth/components/RegisterForm.vue`
- `src/features/auth/components/ForgotPasswordForm.vue`
- `src/features/auth/components/ResetPasswordForm.vue`

**Design Rationale**:

- Input height h-10 (40px) still above shadcn default h-9 (36px)
- Touch targets remain usable (40px + focus rings)
- Maintains professional appearance while reducing wasted space
- Consistent with 4px-based spacing scale

**Verification**: vp check pass (4 pre-existing lint errors in test files unrelated)

### 0.5.78 — Password Error Message Simplification

Fixed long error message causing form layout shift:

**Problem**: Password ASCII validation error message was too long (~80 chars), wrapping to 2 lines and causing layout shift:

```
'Password must only contain standard ASCII characters (letters, digits, and symbols)'
```

**Solution**: Simplified to concise single-line message:

```
'Password contains invalid characters'
```

**File Updated**: `src/lib/schemas/auth.schema.ts` (line 22)

**Benefit**: Error message now fits on single line, no layout shift, clear and actionable.

### 0.5.77 — Form Spacing Consistency Fix

Fixed inconsistent form spacing across all auth pages for professional, uniform appearance:

**Problems Identified**:

1. FormMessage reserved excessive space (`min-h-12` = 48px)
2. Form internal gaps inconsistent (gap-2, gap-3 mixed)
3. View-level spacing inconsistent (space-y-6 vs space-y-10)
4. Submit button margins inconsistent (mt-3, mt-4, or none)

**Fixes Applied**:

1. **FormMessage.vue**: `min-h-12` → `min-h-8` (48px → 32px) — reserves appropriate space for 2 lines of error text
2. **All auth forms**: Unified to `gap-4` (16px) for field-to-field spacing
   - LoginForm.vue: gap-3 → gap-4
   - RegisterForm.vue: gap-2 → gap-4 (was too tight)
   - ForgotPasswordForm.vue: gap-3 → gap-4
   - ResetPasswordForm.vue: gap-3 → gap-4
3. **ResetPasswordView.vue**: `space-y-6` → `space-y-10` (matches all other auth views)
4. **All submit buttons**: Unified to `mt-4` (16px)
   - LoginForm.vue: mt-3 → mt-4
   - RegisterForm.vue: no mt → mt-4
   - ForgotPasswordForm.vue: mt-3 → mt-4
   - ResetPasswordForm.vue: mt-3 → mt-4

**Design System Alignment**:

- Field-to-field: 16px (gap-4) — professional standard
- Label-to-input: 8px (FormItem's internal gap-2) — shadcn-vue default
- View section separation: 40px (space-y-10) — consistent vertical rhythm
- Button separation: 16px (mt-4) — matches field spacing

**Files Updated**: 8 files total

- `src/components/ui/form/FormMessage.vue`
- `src/features/auth/components/LoginForm.vue`
- `src/features/auth/components/RegisterForm.vue`
- `src/features/auth/components/ForgotPasswordForm.vue`
- `src/features/auth/components/ResetPasswordForm.vue`
- `src/features/auth/views/ResetPasswordView.vue`

**Verification**: vp check pass (4 pre-existing lint errors in test files unrelated)

### 0.5.76 — 404View Button Centering Fix

Fixed button alignment in 404 Not Found page:

**Problem**: "Go Home" and "Go Back" buttons were not horizontally centered.

**Fix**: Added `justify-center` class to button container div (line 43).

**File Updated**: `src/views/Exception/404View.vue`

**Before**: `<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">`
**After**: `<div class="mt-8 flex justify-center flex-col gap-3 sm:flex-row sm:gap-4">`

**Result**: Buttons now centered in both mobile (stacked) and desktop (side-by-side) layouts.

### 0.5.75 — Complete Fix: All Identified Issues Resolved

Fixed all issues identified in code review with own judgment applied:

**1. Hardcoded Error Messages (ResetPasswordView.vue)**:

- Added `mapApiErrorCode` import from `@/lib/utils/api-error`
- Replaced hardcoded strings with `mapApiErrorCode('AUTH_003')` and `mapApiErrorCode('PASSWORD_SAME_AS_OLD')`
- Updated test mock to return proper messages

**2. Stale Authentication Tests (19 tests)**:

- `auth.schema.test.ts` (13 tests): Updated to match current `StrongPasswordSchema` (8-64 chars, printable ASCII, NO complexity requirements)
- `auth.test.ts` (6 tests): Same updates for API-level tests
- Test changes: "rejects X" → "accepts X (no complexity requirement)" for passwords that now pass validation

**3. Schema Cleanup**:

- Removed no-op `.extend({})` from `ForgotPasswordFormSchema`

**Test Results**: ✅ 384/384 tests pass (was 365/384 with 19 stale failures)

### 0.5.74 — ResetPasswordView Complete - Code Review Passed

Completed comprehensive code review for ResetPasswordView changes:

**Review Verdict**: ✅ Ready to commit

**Passed Categories**:

- Code Quality & Style: Naming conventions, TypeScript strict, Tailwind consistency
- Comments & Documentation: No emojis, English only, JSDoc on props
- Business Logic: Password validation matches backend, form submission prevents duplicates
- Security: No XSS, proper password field handling, no secrets logged
- Integration: API layer, Zod schemas, Toast, Router all correct
- Project Consistency: Matches LoginView/ForgotPasswordView patterns
- Test Results: 10/10 ResetPasswordView tests pass

**Issues Found** (non-blocking):

1. Hardcoded error messages (AUTH_003, PASSWORD_SAME_AS_OLD) — should use `mapApiErrorCode()`
2. Pre-existing test failures (19 tests in auth.schema.test.ts/auth.test.ts) — stale from v0.5.40 password policy sync
3. ForgotPasswordFormSchema empty `.extend({})` — cosmetic nit

**Documentation**: memory-bank version updated to 0.5.73

### 0.5.72 — ResetPasswordView PasswordStrengthMeter Order Fix

Added `text-muted-foreground` to all 6 "Back to sign in" ghost buttons across 5 auth views:

1. **Problem**: Ghost buttons inherited full-contrast page text (pure black in light mode, pure white in dark mode), making them visually compete with the primary CTA button.

2. **Solution**: Added `text-muted-foreground` to each button's `cn()` class, using shadcn-vue's muted foreground variable (`hsl(var(--muted-foreground))`) which automatically adjusts for both themes.

3. **Files Updated**:
   - RegisterSuccessView.vue (line 178)
   - VerifyEmailView.vue (line 185)
   - ResetPasswordView.vue (line 303)
   - ForgotPasswordView.vue (lines 118, 133 — 2 instances)
   - ForgotPasswordSuccessView.vue (line 75)

4. **Ghost variant unchanged**: Hover glow effect (`hover:text-[#7170ff]` + text-shadow) preserved.

### 0.5.56 — Resend Button Hover Simplified

Changed light mode Resend/Try another email button hover to match dark mode pattern:

- Before: `hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50` (background fill + tinted border)
- After: `hover:border-[#5e6ad2] hover:text-[#5e6ad2]` (border + text color only)

Files: RegisterSuccessView.vue, VerifyEmailView.vue, ForgotPasswordSuccessView.vue

### 0.5.55 — Inline Card Darker (Didn't receive email)

Made the "Didn't receive the email" inline card darker for better visual separation from main auth card:

1. **User Feedback**: "我让你改的卡又不是大卡，是 Didn't receive the email"

2. **Solution**: Card background `bg-[#f3f4f5]/60` → `bg-[#e5e7eb]/80`
   - More visible gray tone while staying subtle
   - Dark mode unchanged (`dark:bg-white/3`)

3. **Files Updated**:
   - RegisterSuccessView.vue (line 150)
   - VerifyEmailView.vue (line 144)
   - ForgotPasswordSuccessView.vue (line 48)

### 0.5.54 — Dark Mode Restore (Resend Button)

Restored Resend verification email button dark mode to git original:

1. **Problem**: Previous iterations broke dark mode with `!bg-[#a6aaaf]` and `!text-gray-700` important modifiers

2. **Solution**: `git checkout 509c6f9` restored all 3 auth views to original state

3. **Ghost Button Preserved**: "Back to sign in" buttons kept brand color glow (`variant="ghost"` + `cn('w-full h-11 font-[510]')`)

4. **Files Restored**:
   - RegisterSuccessView.vue (Resend button)
   - VerifyEmailView.vue (Resend button)
   - ForgotPasswordSuccessView.vue (Try another email button)

5. **Verification**: Dark mode colors confirmed:
   - Background: `rgba(255,255,255,0.02)` (outline variant)
   - Text: `#d0d6e0`
   - Border: `rgba(255,255,255,0.08)`

### 0.5.53 — Light Mode Button Contrast Fix (SUPERSEDED)

Fixed light mode Resend button contrast per Plan Agent analysis:

1. **User Feedback**: "现在又变回了没有差异的状态（亮主题下" — `bg-[#f7f8f8]` too close to card

2. **Root Cause Analysis** (Plan Agent ses_21a706649ffegALapozngkefvS):
   - Card effective color: `~rgb(250,251,251)` (near-white)
   - Button `bg-[#f7f8f8]`: contrast ratio only **1.01:1** → invisible
   - Dark mode pattern: button should be **distinctly different** from both page and card

3. **Solution**: Use darker gray for visible contrast:
   - Default: `bg-[#d9dce0]` (contrast 1.50:1 — clearly visible)
   - Hover: `bg-[#ced2d7]` (slightly darker)

4. **Files Fixed**:
   - RegisterSuccessView.vue (line 161)
   - ForgotPasswordSuccessView.vue (line 59)
   - VerifyEmailView.vue (line 170)

5. **Verification**: 384/384 tests pass

### 0.5.52 — Light Mode Button "Hole" Effect Fix (SUPERSEDED by 0.5.53)

Fixed light mode Resend button background to avoid "hole" effect in card:

1. **User Feedback**: "亮色主题的那个按钮不要用跟总背景一样的颜色，看着像在卡片里挖了个洞。学习暗色主题里的设计思路"

2. **Problem**: Light button `bg-white` = page background white, creating hole illusion in gray card `bg-[#f3f4f5]/60`

3. **Solution**: Learn from dark mode approach (`bg-white/2` semi-transparent):
   - Light: `bg-[#f7f8f8]` (off-white) → hover: `bg-[#ebedef]`
   - Dark: unchanged (`bg-white/2` → hover: `bg-white/5`)

4. **Files Fixed**:
   - RegisterSuccessView.vue (lines 161-162)
   - ForgotPasswordSuccessView.vue (lines 59-60)
   - VerifyEmailView.vue (lines 170-171)

5. **Verification**: 384/384 tests pass

### 0.5.51 — Ghost Button DESIGN.md Compliance + Light Mode Contrast Fix (SUPERSEDED)

Fixed Resend verification email button styling per DESIGN.md Ghost Button spec:

1. **DESIGN.md Reference**: Ghost Button spec (lines 125-134):
   - Background: `rgba(255,255,255,0.02)` ≈ `bg-white/2`
   - Border: `1px solid rgb(36, 40, 44)` ≈ `border-[#24282c]`
   - Text: `#e2e4e7`
2. **Problem**: Light mode button lacked explicit background → invisible against card `bg-[#f3f4f5]/60`

3. **Solution**: Updated button classes for all 3 auth views:
   - Light: `bg-white border-[#d0d6e0] text-gray-700` → hover: `bg-[#f7f8f8] border-[#5e6ad2]/50`
   - Dark: `bg-white/2 border-[#24282c] text-[#e2e4e7]` → hover: `bg-white/5 border-[#5e6ad2]/50`

4. **Files Fixed**:
   - VerifyEmailView.vue (lines 169-174)
   - RegisterSuccessView.vue (lines 160-165)
   - ForgotPasswordSuccessView.vue (lines 57-64)

5. **Verification**: 384/384 tests pass

### 0.5.50 — Auth Views Light Mode Button/Card Contrast Fix (SUPERSEDED)

Fixed secondary button vs card background contrast in light mode:

1. **User Feedback**: "我看你就改了暗色主题的按钮背景。但我的核心问题在亮色按钮背景色跟后面的Didn't receive the email 卡片背景色没啥差异，我是这个意思"
2. **Root Cause**: Button `bg-[#f3f4f5]/80` and card `bg-[#f3f4f5]/60` were same color with only 20% opacity difference
3. **Solution**: Changed button to pure white background
   - Light: `bg-white border-[#d0d6e0]` → hover: `bg-[#f3f4f5] border-[#5e6ad2]/50 text-[#5e6ad2]`
   - Dark: `bg-white/5 border-white/8` (unchanged) → hover: `bg-white/8 border-[#7170ff]/50 text-[#828fff]`
4. **Files Fixed**:
   - RegisterSuccessView.vue (lines 158-173)
   - VerifyEmailView.vue (lines 167-182)
   - ForgotPasswordSuccessView.vue (lines 56-70)
5. **Verification**: 384/384 tests pass

### 0.5.49 — Auth Views Light Mode Button Contrast Fix (SUPERSEDED by 0.5.50)

Initial attempt with gray background `bg-[#f3f4f5]/80` — user clarified the real issue was button vs card contrast.

### 0.5.48 — Ghost Button Brand Color Glow

Updated font glow effect with DESIGN.md brand colors:

1. **User Feedback**: "暗色主题缺少泛光，另外泛光应该符合 @DESIGN.md 的那个主题色" — wanted brand color glow, not generic black/white
2. **DESIGN.md Reference**: Accent Violet `#7170ff` for interactive elements, Accent Hover `#828fff` for hover states
3. **Solution**: Changed from generic black/white glow to brand indigo-violet glow
   - ghost: `hover:text-[#7170ff] dark:hover:text-[#828fff] hover:[text-shadow:0_0_8px_rgba(113,112,255,0.25),0_0_2px_rgba(113,112,255,0.15)] dark:hover:[text-shadow:0_0_12px_rgba(130,143,255,0.4),0_0_4px_rgba(130,143,255,0.2)] transition-all duration-200`
   - Light mode: `#7170ff` text color + soft glow
   - Dark mode: `#828fff` text color + stronger glow (12px outer + 4px inner)
4. **Verification**: 384/384 tests pass

### 0.5.47 — Ghost Button Font Glow Effect (SUPERSEDED by 0.5.48)

Implemented font glow effect per user request:

1. **User Feedback**: "鼠标移上去不还是有按钮边框样式，当我想要的是字体边框的那种效果" — wanted text edge glow, not button container border
2. **Solution**: Replaced inset shadow with `text-shadow` glow
   - ghost: `hover:[text-shadow:0_0_8px_rgba(0,0,0,0.15),0_0_2px_rgba(0,0,0,0.1)] dark:hover:[text-shadow:0_0_8px_rgba(255,255,255,0.2),0_0_2px_rgba(255,255,255,0.1)] transition-all duration-200`
   - Default: No style (inherits parent color)
   - Hover: Font glow — 8px outer glow + 2px inner highlight on text itself
3. **Verification**: 384/384 tests pass

### 0.5.46 — Ghost Button Final Fix (No Default Text Color) (SUPERSEDED by 0.5.47)

Previous attempt with inset shadow (user said still looked like button border):

### 0.5.45 — Ghost Button Hover Effect Refactor (SUPERSEDED by 0.5.46)

Initial ghost button hover refactor (later refined in 0.5.46):

1. Redefined ghost variant with inset shadow hover (had `text-muted-foreground` — removed in 0.5.46)
2. Deleted subtle variant (no longer needed)
3. Files reverted to ghost: AppSidebar.vue, AppHeader.vue, SidebarTrigger.vue
4. Superseded: 0.5.46 removed default text color for true invisible state

### 0.5.44 — Ghost Button Variant System Refactor (SUPERSEDED by 0.5.45)

Separated ghost/subtle variants per DESIGN.md spec (later reverted):

1. **Issue**: Ghost variant conflated two design intents — Ghost Button (permanent bg+border) vs Subtle Button (invisible until hover)
2. **Solution**: Redefined ghost + added new subtle variant in `button/index.ts`
   - ghost: `text-muted-foreground bg-black/2 dark:bg-white/2 border border-border hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors duration-200`
   - subtle: `text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors duration-200`
3. **Files Migrated to subtle**: AppSidebar.vue:104, AppHeader.vue:43, SidebarTrigger.vue:18
4. **Auth views keep ghost**: RegisterSuccessView, VerifyEmailView, ForgotPasswordView x2, ResetPasswordView, ForgotPasswordSuccessView (6 usages)
5. **User Feedback**: Wrong approach — user wanted invisible default + edge highlight hover, not permanent bg
6. **Superseded**: 0.5.45 reverted this approach

### 0.5.43 — Auth Button Ghost Conversion

Converted low-visibility RouterLinks to consistent Ghost Button pattern:

1. **Issue**: "Back to sign in" text links invisible on Light mode white background — violated Linear design system visual hierarchy
2. **Pattern A → B**: RouterLink (text-only) → Button variant="ghost" with font weight 510, feature settings 'cv01','ss03'
3. **Files Changed**:
   - ForgotPasswordView.vue: Lines 113-119 (success state) + 126-137 (pre-submission) → 2 Ghost Buttons
   - ResetPasswordView.vue: Lines 301-313 ("Remember your password?" paragraph) → Ghost Button
4. **Test Coverage**: Added assertion in ResetPasswordView.test.ts, ForgotPasswordView.test.ts line 194 still passes
5. **Verification**: 382/382 tests pass, `vp check` clean (4 pre-existing lint errors in instance.test.ts unrelated)

### 0.5.42 — Button Cursor Pointer Fix

Fixed missing cursor:pointer on all button variants:

1. **Issue**: Buttons lacked `cursor-pointer` class — mouse cursor stayed as default arrow on hover instead of showing hand icon
2. **Root Cause**: Base `buttonVariants` CVA definition in `index.ts` line 7 missing `cursor-pointer` utility class
3. **Fix**: Added `cursor-pointer` to base class string (shadcn-vue standard)
4. **Location**: `src/components/ui/button/index.ts` line 7
5. **Result**: All button variants now show hand cursor on hover (default, destructive, outline, secondary, ghost, link)
6. **Verification**: `lsp_diagnostics` clean, `vp check` pass (memory-bank formatting pre-existing)

### 0.5.41 — Button System Restoration

RESTORED button system to shadcn-vue original after failed Linear-style refactor:

1. **Root Cause**: I blindly applied user's "suggestions" instead of following DESIGN.md actual spec
2. **Failed Changes**: Deleted `outline` variant, changed `default`→`ghost`, added custom Linear-style variants with wrong colors/shadows
3. **User Feedback**: "风格直接被你改炸了...彻底烂掉了...风格不统一，单主题不统一，亮暗不统一"
4. **Restoration**: `git checkout HEAD -- src/components/ui/button/index.ts` → shadcn-vue original restored
5. **Cleanup**: Removed custom Button.test.ts
6. **Result**: 382/382 tests pass, button variants back to:
   - `default`: `bg-primary text-primary-foreground shadow-xs`
   - `outline`: `border bg-background shadow-xs`
   - `secondary`: `bg-secondary text-secondary-foreground`
   - `ghost`: `hover:bg-accent hover:text-accent-foreground`
   - `link`: `text-primary underline-offset-4 hover:underline`
7. **Lesson**: NEVER blindly apply user suggestions — ALWAYS read DESIGN.md spec first

### 0.5.40 — Password Validation Sync

### 0.5.40 — Password Validation Sync

Synced password validation with backend `^[!-~]+$` whitelist (ASCII 33-126):

1. **Schema**: Added `REGEX_PASSWORD_CHARS = /^[!-~]+$/` constant + `.regex()` to `StrongPasswordSchema` before `.min(8)`. Parentheses/brackets now allowed.
2. **Tests**: Added 7 charset tests (parentheses, brackets, ASCII range, spaces, Chinese, emoji, priority).
3. **PasswordStrengthMeter**: Replaced 7-rule penalty system with 4-rule additive system — adding chars never reduces strength.
4. **Verification**: 382/382 tests pass, `vp check` clean.

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
