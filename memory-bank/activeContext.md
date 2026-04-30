# Active Context: ctt-web

## Current Status

**Phase**: Lint/SonarLint Warning Fix (v0.5.29)
**Version**: 0.5.29 (2026-04-30)

### CSS unknownAtRules IDE Config Fix

**Date**: 2026-04-30

**Issue**: VSCode CSS language server reports 4 `unknownAtRules` warnings for valid Tailwind CSS v4 directives in `main.css` (`@custom-variant`, `@theme`, `@apply`). These are not real errors — Tailwind processes them correctly.

**Fix**: Added `"css.lint.unknownAtRules": "ignore"` to `.vscode/settings.json` to suppress these false positives. Standard practice for Tailwind CSS projects.

**No version bump**: IDE-only config change, no functional impact.

### Lint/SonarLint Warning Fix (0.5.29)

**File**: `src/components/app/__tests__/AppSidebar.test.ts`

**Issues fixed (8 warnings)**:

1. `vi.fn()` missing type params (lines 12, 19, 20) — added `<() => typeof mockAuthStore>` and `<(key: string, defaultValue: unknown) => unknown>`
2. Unused `onClick` variable (line 47) — renamed to `_onClick` per eslint convention
3. Unnecessary `as Record<string, unknown>` assertion (line 47) — removed, type already inferred
4. Unnecessary non-null assertions `resolveLogout!()` (lines 177, 226) — initialized with `= () => {}`, removed `!`

**Verification**: LSP diagnostics clean (0 warnings). 330/330 tests pass.

### Sidebar Light Mode Color Fix (0.5.28)

**Issue**: Light mode sidebar (`#ffffff`) was brighter than body (`#f7f8f8`), inverting expected visual hierarchy — sidebar should recede, body should be focal.

**Fix**: Changed light mode sidebar background from `#ffffff` to `#f3f4f5` (DESIGN.md "Light Surface" value). This makes the sidebar slightly darker/grayer than the page background, creating proper hierarchy: sidebar recedes (grayest) < body (mid) < cards/content (pure white brightest).

**Dark mode unchanged**: sidebar `#0f1011`, body `#08090a`, card `#191a1b` — difference only ~7 RGB, barely perceptible.

**Verification**: 330/330 tests pass (17 files).

### DESIGN.md CSS Variable Alignment (0.5.27)

**Root cause**: DashboardHome.vue already uses CSS variable tokens (`text-foreground`, `bg-card`, `border-border`, etc.) from v0.5.26 fix, but `src/assets/main.css` still used shadcn-vue default oklch color values for both `:root` (light mode) and `.dark` (dark mode) — none matched DESIGN.md's specified hex colors.

**Fix**: Replaced all CSS variable color values with DESIGN.md exact colors:

- **Dark mode** (`.dark`): `--background: #08090a`, `--foreground: #f7f8f8`, `--card: #191a1b`, `--muted-foreground: #8a8f98`, `--border: rgba(255,255,255,0.08)`, `--primary: #5e6ad2`, `--accent: #7170ff`, `--sidebar: #0f1011`
- **Light mode** (`:root`): Light Background `#f7f8f8`, Pure White cards `#ffffff`, Light Border `#d0d6e0`. Brand colors (`--primary`/`--accent`) use same values in both modes for brand consistency.
- Preserved: chart colors, destructive/error red, radius system

**Verification**: All 15 CSS variable values confirmed via browser DevTools inspection. 330/330 tests pass.

### Critical Re-review & Dashboard DESIGN.md Compliance (0.5.26)

### Critical Re-review & Dashboard DESIGN.md Compliance (0.5.26)

**Re-review of all v0.5.25 fixes**: Sub-agent analysis found only 1 remaining issue — AppHeader logout button missing `aria-label`. All other fixes verified correct.

**Dashboard DESIGN.md compliance audit**: DashboardHome.vue was a minimal placeholder using Tailwind light-mode defaults (`bg-white`, `text-gray-900`, `shadow`, `font-bold`) that violated every aspect of the Linear-inspired dark-mode-first DESIGN.md. All visual classes replaced with CSS variable tokens (`text-foreground`, `bg-card`, `font-medium`, `tracking-tight`, `border-border/50`, `text-muted-foreground`) for theme-aware rendering.

**Verdict**: Component-level compliance achieved. Dark mode CSS variables in main.css are reasonably close to DESIGN.md values. CSS variable values could be further fine-tuned to exact DESIGN.md colors (`#08090a`, `#f7f8f8`, etc.) but that's a separate CSS variable definition concern.

**AppHeader accessibility fix**: Added `aria-label` attribute to icon-only logout button (dynamic "Logout" / "Logging out...") and wrapped in Tooltip/TooltipProvider for visual hover hint. Satisfies WCAG 4.1.2.

**Verification**: `vp test` — 330/330 tests pass across 17 files. LSP diagnostics clean.

### Logout Code Review & Fixes (0.5.25)

**Code review of uncommitted logout feature changes identified these issues and applied fixes:**

**Critical fix**: Logout button was only in AppSidebar (sidebar footer) but requirement was "顶部导航" (top navigation). Added logout button to `AppHeader.vue` with same fail-safe pattern. Both locations now have logout.

**Code quality fix**: Replaced `any` types in Button mock (`AppSidebar.test.ts`) with proper TypeScript types (`Record<string, unknown>`, typed `$emit`). Violated AGENTS.md R8 (prohibit `any`).

**Test coverage improvements** (`AppSidebar.test.ts`):

- Added `afterEach` cleanup block
- Added `wrapper.unmount()` to all 4 tests that lacked it
- Added new tests: double-click prevention, navigation links (Dashboard/Devices/Settings), header branding ("CTT"), sidebar content structure
- Fixed unhandled rejection by using `mockImplementation(() => Promise.reject(...).catch(() => {}))` pattern

**README.md**: Added "logout" to Authentication feature description.

**Verification**: `vp test` — 330/330 tests pass across 17 files. LSP diagnostics clean.

### Vitest .agents Exclusion Fix (0.5.19)

**File**: `src/lib/api/__tests__/instance.test.ts` (401 → 833 lines, +18 test cases)

**New test coverage** (previously 0):

- AUTH_002/AUTH_003 refresh trigger (2 tests)
- Refresh success with `__authRetry` flag retry (1 test)
- `__authRetry` infinite loop guard (1 test)
- Refresh failure handling: AUTH_003, AUTH_007, AUTH_009, network error (4 tests)
- Terminal auth errors on 401: AUTH_004/005/006/007/008 (5 tests)
- Terminal auth error on 403: AUTH_004 (1 test)
- `isTerminalAuthHandling` mutex preventing duplicate handling (1 test)
- `getErrorCode()` flat and wrapped response formats (3 tests)

**Mock additions**: `@/stores/auth` (useAuthStore, refreshAccessToken, clearAuth), `@/router` (push, currentRoute)

**Verification**: 328/328 project tests pass.

### Interceptor Code Review Findings + Fixes (0.5.17)

**Three parallel Oracle agent reviews** (logic, style, test) identified:

**Critical bug fixed**: Retry used raw `ofetch` instead of `apiFetch` → `onRequest` hook never fires → retry sends expired token → user kicked to login even after successful refresh. Fixed by changing `ofetch(request, ...)` → `apiFetch(request, ...)` on the retry line.

**Medium fixes applied**:

- Added JSDoc to `apiFetch` (public API surface) and `UNAUTHORIZED_EVENT` (cross-module contract)
- Added network error fallback toast in refresh catch block (previously silent failure)

**All review findings addressed**: Critical bug fixed, JSDoc added, network error toast added, full test coverage added.

### AUTH_003 Refresh Trigger Fix (0.5.16)

**Root cause**: Backend `JwtAuthenticationEntryPoint` returns `AUTH_003` for all JWT failures (expired, invalid, missing), but the interceptor only triggered token refresh on `AUTH_002`. Since `AUTH_002` is defined in `ErrorCode.java` but never thrown, the refresh flow never activated — users were immediately logged out on token expiry.

**File**: `src/lib/api/instance.ts`

**Changes**:

- Removed `AUTH_003` from `TERMINAL_AUTH_CODES` — it now triggers refresh instead of immediate redirect
- Extended 401 refresh trigger to include `AUTH_003` alongside `AUTH_002`: `errorCode === 'AUTH_002' || errorCode === 'AUTH_003'`
- Catch block in refresh failure handles error codes from the refresh endpoint:
  - `AUTH_003` (refresh token not found) → inline terminal handling with `isTerminalAuthHandling` mutex, `clearAuth()`, toast, and `router.push`
  - `AUTH_007` / `AUTH_009` (expired / reuse detected) → handled via existing `TERMINAL_AUTH_CODES` and `handleTerminalAuthError()`
- Unknown refresh failures fall through to legacy 401 handler (token clear + `UNAUTHORIZED_EVENT` dispatch)

**All existing protections preserved**: `isTerminalAuthHandling` mutex, `__authRetry` guard, legacy 401 fallback, `router.push().finally()` pattern, terminal handling for `AUTH_004/005/006/007/008/009`.

### globalThis Migration (0.5.14)

**Date**: 2026-04-30

**Issue**: SonarQube `typescript:S7764` flags `window` and `global` usage in test setup.

**File**: `src/test/setup.ts`

**Fixed**:

- Line 11: `Object.defineProperty(window, 'matchMedia', ...)` → `Object.defineProperty(globalThis, 'matchMedia', ...)`
- Line 25: `global.ResizeObserver` → `globalThis.ResizeObserver`

**Reason**: `globalThis` is modern JavaScript standard, works in all environments (browser, Node.js, jsdom).

### Zod v4 Deprecated API Fix (0.5.13)

**Date**: 2026-04-30

**Issue**: SonarQube `typescript:S1874` flags deprecated `z.string().uuid()` and `z.string().url()` methods.

**Reference**: Zod v4 migration - string format methods promoted to top-level functions.

**File**: `src/lib/schemas/leaderboard.schema.ts`

**Fixed**:

- Line 10: `z.string().uuid()` → `z.uuid()`
- Line 18: `z.string().url()` → `z.url()`

**Migration pattern** (per Zod v4 docs):
| Deprecated | Replacement |
|------------|-------------|
| `z.string().uuid()` | `z.uuid()` |
| `z.string().url()` | `z.url()` |
| `z.string().email()` | `z.email()` |
| `z.string().datetime()` | `z.iso.datetime()` |
| `z.string().ip()` | `z.ipv4()` / `z.ipv6()` |

**Verification**: ✅ Type check passes (199 files)

### R9 Violation Fix (0.5.12)

**Date**: 2026-04-30

**Issue**: Chinese text in code file violates R9 (code/comments/variables must be English).

**File**: `src/features/auth/composables/useResendVerification.ts`

**Fixed**:

- Line 47: `'邮件已在10分钟内发送'` → `'Verification email already sent within 10 minutes'`
- Line 48: `'请查看收件箱'` → `'Please check your inbox'`

**Verification**: ✅ Tests pass (15/15)

### SonarQube VSCode Config (0.5.11)

**Change**: Disabled `Web:S6853` rule in `.vscode/settings.json` for SonarQube VSCode plugin (Standalone Mode).

**Reason**: Rule flags Vue label components with slots as "missing text label", but this is false positive:

- `FormLabel.vue` — wrapper component, text comes via slot from parent
- `Label.vue` — primitive style component, doesn't require control association

**Config added**:

```json
{
  "sonarlint.rules": {
    "Web:S6853": "off"
  }
}
```

### Complete Over-120-Char Class String Fixes (0.5.11)

**Date**: 2026-04-30

**Issue**: After v0.5.10 fix, additional class strings >120 chars remained. All needed multi-line split via `cn()`.

**Files changed**:

- `src/components/ui/sidebar/SidebarMenuAction.vue` — split 121-char class string
- `src/components/ui/sidebar/SidebarMenuBadge.vue` — split class string
- `src/components/ui/sidebar/SidebarGroupAction.vue` — split class string
- `src/components/ui/dialog/DialogContent.vue` — split class string
- `src/components/ui/dialog/DialogScrollContent.vue` — split class string
- `src/components/ui/select/SelectTrigger.vue` — split 2 class strings
- `src/components/ui/select/SelectContent.vue` — split 2 class strings
- `src/components/ui/sheet/SheetContent.vue` — split 3 class strings (position variants)
- `src/components/ui/dropdown-menu/DropdownMenuContent.vue` — split class string
- `package.json` — version bump to 0.5.11

**Verification**:

- ✅ `find src/components/ui -name "*.vue" -exec awk '{if(length($0)>120) ...}'` → 0 lines over 120
- ✅ `vp check --fix` does NOT merge multi-line strings back to single line
- ✅ All class strings ≤120 chars

### Split Over-120-Char Class Strings with cn() (0.5.10)

**Date**: 2026-04-30

**Issue**: Several UI components had class strings exceeding 120 characters on single lines,
violating printWidth constraint. Previous cleanup incorrectly removed all `cn()` usage.

**Rule clarification**:

- Class strings > 120 chars → MUST use `cn()` to split into multi-line format
- Class strings ≤ 120 chars → Can use simple array syntax `['...', props.class]`

**Files changed**:

- `src/components/ui/dialog/DialogContent.vue` — added `cn` import, split DialogClose class (~280 chars) into 4 lines
- `src/components/ui/sheet/SheetContent.vue` — added `cn` import, split DialogClose class (~180 chars) into 3 lines
- `src/components/ui/dialog/DialogScrollContent.vue` — added `cn` import, split DialogOverlay class (~150 chars) into 3 lines
- `src/components/ui/sidebar/Sidebar.vue` — added `cn` import, split inner div class (~150 chars) into 4 lines
- `package.json` — version bump to 0.5.10

**Verification**:

- ✅ `vp check` — 228 files formatted, 199 files lint/type clean
- ✅ `vp test` — 310/310 tests pass

### Final cn utility removal + multiline class split (0.5.9)

**Date**: 2026-04-29

**Change**: Removed remaining `cn()` calls from TooltipContent.vue and AppIcon.vue.
Split overly long class strings (>120 chars) into multiline array format to satisfy printWidth constraint.

**Files changed**:

- `src/components/ui/tooltip/TooltipContent.vue` — removed cn import, split 300+ char class string into 8 array elements (base styles, animations, states, positions).
- `src/components/ui/app-icon/AppIcon.vue` — removed cn import, `cn(props.class)` → `props.class` (single element, no array needed).
- `package.json` — version bump to 0.5.9.

**Verification**:

- ✅ `vp check` — 228 files formatted, 199 files lint/type clean.
- ✅ `vp test` — 310/310 tests pass.

### Removed cn utility from UI components (0.5.8)

**Date**: 2026-04-29

**Change**: Replaced `cn()` calls with native Vue array syntax `['...', props.class]` in `src/components/ui`.
Removed `cn` imports from all UI components. This simplifies the code and avoids unnecessary dependency on `tailwind-merge` for simple class merging.

**Files changed**:

- `src/components/ui/**/*.vue` — replaced `cn(...)` with `[...]`, removed imports.
- `package.json` — version bump to 0.5.8.

**Verification**:

- ✅ `vp check` — 0 errors, 0 warnings.
- ✅ `vp test` — 310/310 tests pass.

### Fixed vp check AI file exclusion & TS config (0.5.7)

**Date**: 2026-04-29

**Changes**:

1. **AI File Exclusion**: Added `ignorePatterns` to both `fmt` and `lint` blocks in `vite.config.ts` to exclude `.agents/**`, `.claude/**`, `.cursor/**`. Prevents AI skill files from being formatted/linted.
2. **TS Config Fix**: Removed `composite: true` from `tsconfig.vitest.json`. It was causing `vue-tsc` to fail resolving `*.vue` modules in test files. Restored `declare module '*.vue'` in `env.d.ts` which is required for type checking.

**Files changed**:

- `vite.config.ts` — added `ignorePatterns` to `fmt` and `lint`.
- `tsconfig.vitest.json` — removed `composite: true`.
- `env.d.ts` — restored `declare module '*.vue'` block.
- `package.json` — version bump to 0.5.7.

**Verification**:

- ✅ `vp check` — 0 errors, 0 warnings.
- ✅ `vp test` — 310/310 tests pass.

### Reverted printWidth to 120 (0.5.6)

**Date**: 2026-04-29

**Change**: Reverted `vite.config.ts` `fmt.printWidth` from 100 back to 120 per user preference.
Long Tailwind class strings can be split using `cn()` function manually if needed.

**Files changed**:

- `vite.config.ts` — `printWidth: 120`.
- `package.json` — version bump to 0.5.6.

### Switched to Vue Stable Release (0.5.4)

**Date**: 2026-04-29

**Change**: Removed forced Vue Beta overrides from `pnpm-workspace.yaml`. Project now uses Vue latest stable release instead of beta.

**Files changed**:

- `pnpm-workspace.yaml` — removed 13 Vue beta overrides.
- `package.json` — version bump to 0.5.4.

**Verification**:

- ✅ `vp install` — dependencies updated successfully.
- ✅ `vp check` — 0 type/lint errors.
- ✅ `vp test` — 310/310 tests pass.

### HTML Lang Attribute Corrected to en (0.5.3)

**Date**: 2026-04-29

**Issue**: `index.html` had `lang="zh-CN"` but project content is English-only.

**Fix**:

- Changed `<html lang="zh-CN">` to `<html lang="en">` to match actual content language.

**Files changed**:

- `index.html` — corrected language code to `en`.
- `package.json` — version bump to 0.5.3.

### HTML Lang Attribute Fixed (0.5.2)

**Date**: 2026-04-29

**Issue**: `index.html` had empty `<html lang="">`, triggering SonarQube warning Web:S5254.

**Fix**:

- Set `<html lang="zh-CN">` for proper accessibility, SEO, and translation tool support.

**Files changed**:

- `index.html` — added `zh-CN` language code.
- `package.json` — version bump to 0.5.2.

**Verification**:

- ✅ `vp check` — 0 type/lint errors.

### Redundant env.d.ts Declaration Removed (0.5.1)

**Date**: 2026-04-29

**Issue**: `env.d.ts` contained a manual `declare module '*.vue'` block that was redundant.

**Root cause**:

- The project uses `@vue/tsconfig/tsconfig.dom.json` which handles `.vue` file types automatically via `vue-tsc` and Volar.
- The manual declaration was likely added by AI in a previous session as a "quick fix" for IDE errors, but it's unnecessary for the build/type-check pipeline.

**Fix**:

- Removed the `declare module '*.vue'` block from `env.d.ts`.
- Kept only `/// <reference types="vite-plus/client" />` which is required.

**Files changed**:

- `env.d.ts` — removed redundant module declaration.
- `package.json` — version bump to 0.5.1.

**Verification**:

- ✅ `vp check` — 0 type errors (only unrelated formatting issues in docs).
- ✅ `vp test` — 310/310 tests pass.

### Milestone: Login Page + JWT Authentication Complete (0.5.0)

**Date**: 2026-04-29

Login page and JWT-based authentication fully implemented and verified.

**Features delivered**:

- Login page with email/password form, loading states, error handling
- JWT token management (access token + refresh token)
- Route guards (requiresAuth middleware)
- Email verification flow (verify-email page, resend verification)
- Password reset flow (forgot-password, reset-password)
- Registration flow (register, register-success)
- Auth layout with responsive design (1080p+ support)
- API contract verification skill (prevents integration bugs)
- Error code mapping (backend codes → user-friendly messages)
- Idempotent skip detection (10-min resend window)
- Global 401 handler with route-aware skip logic

**Version strategy**: Switched from beta suffixes to semantic versioning (0.5.0 → 0.5.1 → 0.5.2...)

---

### Error Code Field Extraction Fixed (beta.84 partial)

**Date**: 2026-04-25

**Issue**: Multiple views read `error.error` to extract backend error codes, but ctt-server returns `{ "code": "XXX" }`. Fixed all occurrences.

---

### Historical Summary (beta.61–beta.95)

| Version       | Date       | Summary                                              |
| ------------- | ---------- | ---------------------------------------------------- |
| 0.5.0-beta.95 | 2026-04-29 | Verified checklist file deleted (merged into 0.5.0)  |
| 0.5.0-beta.94 | 2026-04-29 | AuthLayout short viewport responsive fix             |
| 0.5.0-beta.93 | 2026-04-29 | Verify-email 401 handler fixed (route-aware skip)    |
| 0.5.0-beta.92 | 2026-04-29 | EmptyResponse idempotentSkip field location fix      |
| 0.5.0-beta.91 | 2026-04-29 | Dialog footer button spacing fix                     |
| 0.5.0-beta.90 | 2026-04-28 | Vite dev server port fix (strictPort: true)          |
| 0.5.0-beta.89 | 2026-04-28 | Idempotent skip detection (10-min resend window)     |
| 0.5.0-beta.88 | 2026-04-28 | API contract verification skill created              |
| 0.5.0-beta.87 | 2026-04-28 | Login success Zod schema mismatch fix                |
| 0.5.0-beta.86 | 2026-04-28 | Double toast on backend errors fix                   |
| 0.5.0-beta.85 | 2026-04-28 | Auth UI consistency + error handling polish          |
| 0.5.0-beta.84 | 2026-04-28 | AuthLayout 1080p responsive fix + Vite+ migration    |
| 0.5.0-beta.82 | 2026-04-25 | LoginView form submission fix                        |
| 0.5.0-beta.80 | 2026-04-23 | DeviceId utility refactoring                         |
| 0.5.0-beta.79 | 2026-04-21 | StrongPassword schema + literal tokenType            |
| 0.5.0-beta.76 | 2026-04-17 | Toast format fix — short title + description pattern |
| 0.5.0-beta.74 | 2026-04-17 | Self-learning skill creation (transient-ui-capture)  |
| 0.5.0-beta.67 | 2026-04-17 | Tailwind class strings → cn() multi-line             |
| 0.5.0-beta.61 | 2026-04-17 | Auth form zero-jump spacing                          |

**Date**: 2026-04-25

**Issue**: Multiple views read `error.error` or `data.error` to extract backend error codes, but ctt-server returns `{ "code": "XXX", ... }` (not `error`). This caused:

1. RegisterView 409 USER_001 not recognized → leaked raw ofetch error `[POST] "/api/v1/auth/register": 409 Conflict` in toast
2. VerifyEmailView AUTH_004 not recognized → showed raw `error.message`
3. useResendVerification USER_007 not recognized → generic error instead of "Email already verified"
4. `getErrorMessage()` in api-error.ts also read `data?.error` → same issue

**Root Cause**: ofetch error object shape is `{ statusCode, data, message }` where `data` is the JSON response body. Backend uses `code` field, not `error`.

**Fix**:

1. `LoginView.vue` L48: `error.error` → `(error.data as { code?: string })?.code` (already fixed in prior session)
2. `RegisterView.vue` L31-32: `data?.error === 'USER_001'` → `data?.code === 'USER_001'`
3. `VerifyEmailView.vue` L46: `error.error === 'AUTH_004'` → `(error.data as { code?: string })?.code === 'AUTH_004'`
4. `useResendVerification.ts` L58: `error.error === 'USER_007'` → `(error.data as { code?: string })?.code === 'USER_007'`
5. `api-error.ts` `getErrorMessage()`: `data?.error` → `data?.code`, removed fallback to `error.message`/`error.statusMessage`
6. Added `USER_007` mapping to `mapApiErrorCode()`
7. All generic error toasts now use fixed "Please try again later" (no leaking technical details)
8. Updated 3 test cases in `useResendVerification.test.ts` to mock `data: { code: '...' }` instead of `error: '...'`

**Files Modified**:

- `src/features/auth/views/LoginView.vue` — error code extraction (prior fix)
- `src/features/auth/views/RegisterView.vue` — error code field + generic toast message
- `src/features/auth/views/VerifyEmailView.vue` — error code extraction + removed raw message leak
- `src/features/auth/composables/useResendVerification.ts` — error code field + generic toast message
- `src/lib/utils/api-error.ts` — `getErrorMessage()` + added USER_007 mapping
- `src/features/auth/composables/__tests__/useResendVerification.test.ts` — 3 test mocks updated

**Verified**:

- ✅ All 296 tests pass (15 files)
- ✅ type-check passes (0 errors)
- ✅ No remaining `error.error` or `data?.error` references in production code

**Policy Established**: All error toasts use fixed user-friendly messages, never leak HTTP methods/paths/status codes.

### Vite+ Migration (0.5.0-beta.84)

**Date**: 2026-04-25

**Changes**:

1. Migrated from standalone Vite/Vitest/Oxlint/Oxfmt to unified Vite+ toolchain
2. All tool configs merged into `vite.config.ts` (`fmt` + `lint` blocks)
3. Scripts updated to use `vp` CLI commands
4. pnpm catalog configured: `vite` → `@voidzero-dev/vite-plus-core`, `vitest` → `@voidzero-dev/vite-plus-test`
5. Fixed `env.d.ts` empty object type (`{}` → `Record<string, unknown>`)
6. Fixed `tsconfig.app.json` types reference (`vite/client` → `vite-plus/client`)
7. Fixed `tsconfig.vitest.json` missing `env.d.ts` in include
8. Fixed `instance.test.ts` unbound-method errors (7 occurrences)
9. Fixed `RegisterSuccessView.test.ts` no-base-to-string error
10. Added `.agents/skills/**` and `.claude/skills/**` to lint ignorePatterns

**Files Modified**:

- `package.json` — scripts migrated to `vp` commands
- `vite.config.ts` — import changed to `vite-plus`, fmt/lint blocks added
- `env.d.ts` — empty object type fix
- `tsconfig.app.json` — types reference fix
- `tsconfig.vitest.json` — added env.d.ts to include
- `src/__tests__/placeholder.test.js` — vitest → vite-plus/test import
- `src/lib/api/__tests__/instance.test.ts` — unbound-method fixes
- `src/features/auth/views/__tests__/RegisterSuccessView.test.ts` — no-base-to-string fix

**Verified**:

- ✅ `vp check` — 0 errors, 0 warnings
- ✅ `vp test` — 296/296 tests pass
- ✅ `vp build` — built successfully

### Notion Dev Plan Tracking Update (2026-04-30)

**Task**: Updated Notion「🌐 ctt-web 开发计划」Section C「3. 导航栏接入」checkboxes to [x].

**Verification**: AppHeader.vue confirmed:

- `authStore.logout()` called on logout button click (line 34)
- `isLoggingOut` loading state with `:disabled` button + `Loader2` spinner icon
- Double-click prevention guard (line 30)

**Conclusion**: Both items genuinely complete — no code changes needed, only Notion tracking update.

---

### Historical Summary (beta.61–beta.95)

| Version       | Date       | Summary                                              |
| ------------- | ---------- | ---------------------------------------------------- |
| 0.5.0-beta.95 | 2026-04-29 | Verified checklist file deleted (merged into 0.5.0)  |
| 0.5.0-beta.94 | 2026-04-29 | AuthLayout short viewport responsive fix             |
| 0.5.0-beta.93 | 2026-04-29 | Verify-email 401 handler fixed (route-aware skip)    |
| 0.5.0-beta.92 | 2026-04-29 | EmptyResponse idempotentSkip field location fix      |
| 0.5.0-beta.91 | 2026-04-29 | Dialog footer button spacing fix                     |
| 0.5.0-beta.90 | 2026-04-28 | Vite dev server port fix (strictPort: true)          |
| 0.5.0-beta.89 | 2026-04-28 | Idempotent skip detection (10-min resend window)     |
| 0.5.0-beta.88 | 2026-04-28 | API contract verification skill created              |
| 0.5.0-beta.87 | 2026-04-28 | Login success Zod schema mismatch fix                |
| 0.5.0-beta.86 | 2026-04-28 | Double toast on backend errors fix                   |
| 0.5.0-beta.85 | 2026-04-28 | Auth UI consistency + error handling polish          |
| 0.5.0-beta.84 | 2026-04-28 | AuthLayout 1080p responsive fix + Vite+ migration    |
| 0.5.0-beta.82 | 2026-04-25 | LoginView form submission fix                        |
| 0.5.0-beta.80 | 2026-04-23 | DeviceId utility refactoring                         |
| 0.5.0-beta.79 | 2026-04-21 | StrongPassword schema + literal tokenType            |
| 0.5.0-beta.76 | 2026-04-17 | Toast format fix — short title + description pattern |
| 0.5.0-beta.74 | 2026-04-17 | Self-learning skill creation (transient-ui-capture)  |
| 0.5.0-beta.67 | 2026-04-17 | Tailwind class strings → cn() multi-line             |
| 0.5.0-beta.61 | 2026-04-17 | Auth form zero-jump spacing                          |
