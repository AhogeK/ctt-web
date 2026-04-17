# Active Context: ctt-web

## Current Status

**Phase**: Bug fix — toast format consistency
**Version**: 0.5.0-beta.76 (2026-04-17)

### Toast Format Fix (0.5.0-beta.76)

**Date**: 2026-04-17

**Issue**: 2 tests in `useResendVerification.test.ts` failing — toast format mismatch

**Root Cause**: Implementation used `mapApiErrorCode()` returning long strings as toast title, tests expected short title + description format

**Fix**:
- USER_002: `toast.info('Email already verified', { description: 'Please proceed to login' })`
- 429: `toast.error('Too many requests', { description: 'Please wait ${retryAfter} seconds before trying again' })`

**Files**:
- `src/features/auth/composables/useResendVerification.ts` — direct toast calls, removed `mapApiErrorCode` import

**Verified**:
- ✅ All 293 tests pass (16 files)
- ✅ type-check passes

### sessionStorage Email Passing (0.5.0-beta.75)

**Date**: 2026-04-17

**Issue**: Email passed via URL query param (`?email=...`) leaked in browser history, referer headers, and server logs

**Security Fix**: Replaced URL query param with sessionStorage for email passing between RegisterView → RegisterSuccessView

**Files**:
- `src/router/routes/auth.ts` — removed `email` from route query schema
- `src/features/auth/views/RegisterView.vue` — store email in sessionStorage before navigation
- `src/features/auth/views/RegisterSuccessView.vue` — read email from sessionStorage, clear after use
- `src/features/auth/views/__tests__/RegisterView.test.ts` — updated tests for sessionStorage pattern
- `src/features/auth/views/__tests__/RegisterSuccessView.test.ts` — updated tests for sessionStorage pattern

**Verified**:
- ✅ Email no longer appears in URL
- ✅ sessionStorage cleared after reading
- ✅ All tests pass
- ✅ type-check passes

### Self-Learning Skill Creation (0.5.0-beta.74)

**Date**: 2026-04-17

**Trigger**: Toast capture issue during beta.73 fix verification — toast disappeared too fast for screenshot

**Solution**: Created `transient-ui-capture` skill documenting browser-use chain command pattern:
- `browser-use click 20 && browser-use screenshot` — click triggers toast, screenshot captures immediately
- Captures ephemeral UI elements (toast, animations, tooltips) that auto-dismiss

**Files**:
- `.agents/skills/transient-ui-capture/SKILL.md` — new skill file
- `AGENTS.md` — added R15 (Self-Learning rule)

**Verified**:
- ✅ Skill file created with problem/solution structure
- ✅ R15 added to AGENTS.md defining self-learning trigger conditions

### Toast CSS Import Fix (0.5.0-beta.73)

**Date**: 2026-04-17

**Issue**: vue-sonner toast notifications appeared as plain text without styling - no background, borders, or visual feedback

**Root Cause**: Missing CSS import for vue-sonner styles. The library requires explicit style import for proper toast appearance.

**Fix**: Added `import 'vue-sonner/style.css'` to `src/main.ts` before app mount

**Files**:
- `src/main.ts` - added vue-sonner style import

**Verified**:
- ✅ Toast notifications display with proper styling (background, borders, shadows)
- ✅ Light/dark mode toast variants work correctly
- ✅ All existing toast calls (copy success, error messages) render properly

## RegisterSuccessView Copy Fix + Email Truncation (0.5.0-beta.72)

**Date**: 2026-04-17

**Changes**:
1. **useClipboard fix**: Changed from `useClipboard()` to `useClipboard({ source: emailRef })` per VueUse docs - `copied` ref now auto-updates
2. **Email truncation**: `truncatedEmail` computed truncates local part to 15 chars + `...` + domain when > 30 chars total
3. **Hover tooltip**: `title` attribute shows full email on hover

**Files**:
- `src/features/auth/views/RegisterSuccessView.vue` — useClipboard fix + truncation logic

**Verified**:
- ✅ Copy button icon changes (Copy → Check → Copy)
- ✅ Toast "Email address copied!" appears
- ✅ Long emails truncated display
- ✅ Hover tooltip shows full email

### RegisterSuccessView Email Display + Copy (0.5.0-beta.71)
- **Issue**: Email address broke across lines, confusing users
- **Fix**: Email on separate line with `whitespace-nowrap`, added click-to-copy button using VueUse `useClipboard` + `vue-sonner` toast
- **Result**: Email never wraps, one-click copy with visual feedback (Copy → Check icon toggle)

### RegisterSuccessView Email Flow Fix (0.5.0-beta.70)
- **Issue**: User had to re-enter email in RegisterSuccessView for resend — redundant UX
- **Root Cause**: RegisterView didn't pass email to RegisterSuccessView; email input field collected duplicate data
- **Fix**: RegisterView passes email via route query; RegisterSuccessView displays email instead of input
- **Result**: Streamlined UX — no email input needed after registration

### Auth Error Mapping Style Polish (0.5.0-beta.69)
- **Issue**: RegisterView 429 toast description used redundant `isActive.value` ternary (`isActive.value ? ... : undefined`), while LoginView used direct template literal — style inconsistency
- **Root Cause**: `start()` always called before toast, so `countdown > 0` and `isActive` is always `true` — false branch unreachable
- **Fix**: Removed ternary, aligned RegisterView with LoginView pattern. Removed unused `isActive` destructure from `useCooldown()`
- **Result**: Both views use identical `description: \`Try again in ${countdown.value}s\`` pattern

### Auth Spacing + Layout Consistency (0.5.0-beta.73)
- **Issue 1**: RegisterSuccessView/VerifyEmailView elements cramped; Tailwind `space-y-*`/`mb-*` utilities not generating CSS
- **Fix 1**: Added scoped `<style>` blocks with explicit margin/gap classes (`.auth-spacing-*`, `.resend-section`)
- **Issue 2**: Resend section internal elements (title/input/button) stuck together
- **Fix 2**: `.resend-section { display: flex; flex-direction: column; gap: 0.75rem }` — native CSS gap, no Tailwind dependency
- **Issue 3**: Layout inconsistent with Login/Register (left panel was hidden)
- **Fix 3**: Restored full AuthLayout left-right split for all auth pages — design consistency
- **Result**: Left 3D cards + right form on all auth pages; proper spacing via scoped CSS

### Auth Layout Fix (0.5.0-beta.69)
- **Issue**: RegisterSuccessView and VerifyEmailView rendered inside AuthLayout's right panel, with left 3D cards still visible — cramped and inconsistent
- **Fix 1**: Moved these two routes out of AuthLayout children to top-level routes (no parent layout)
- **Fix 2**: Wrapped both views in centered layout (`flex min-h-screen items-center justify-center bg-[#0a0a0f]`)
- **Result**: Clean centered pages matching auth visual style, no left panel interference

### Error Mapping + Inline Server Errors (0.5.0-beta.68)
- **Issue 1**: USER_001 (email already registered) showed as toast instead of inline form error
- **Fix 1**: RegisterForm accepts `serverErrors` prop, watches it and calls `form.setFieldError()` to show inline on email field
- **Issue 2**: 429 rate limit had no cooldown countdown in RegisterView/LoginView
- **Fix 2**: Created `useCooldown` composable (generic countdown timer), added to both views
- **Issue 3**: Hardcoded error messages instead of using `mapApiErrorCode` utility
- **Fix 3**: RegisterView, LoginView, VerifyEmailView, useResendVerification all use `mapApiErrorCode`
- **Result**: USER_001 → inline field error, 429 → toast with countdown, consistent error messages

### Tailwind Class Strings → cn() Multi-Line (0.5.0-beta.67)
- **Issue**: Long Tailwind class strings in Vue templates (300+ chars) exceed printWidth, hurt readability
- **Root Cause**: oxfmt collapses class attribute string internal newlines into single line
- **Fix**: Replaced `class="..."` with `:class="cn(...)"` multi-line arrays in LoginForm.vue and RegisterForm.vue
- **Strategy**: Pure static strings use cn() for line-break preservation (oxfmt respects cn() multi-line structure)
- **Result**: All lines under 100 chars, oxfmt preserves formatting, vue-tsc 0 errors

### ESLint Max Line Length & Fix (0.5.0-beta.66)
- **Issue**: Long Tailwind class strings in Vue templates (300+ chars) hurt readability
- **Fix 1**: Added `vue/max-len` rule to `eslint.config.ts` (placed after `eslintConfigPrettier`)
- **Fix 2**: Refactored long class strings in `LoginForm.vue` and `RegisterForm.vue` into multi-line format
- **Config**: `code: 120, template: 120`, ignores comments/URLs/strings/template literals
- **Result**: Zero long-line violations; future violations blocked by ESLint

### Auth Form SonarQube Warning (0.5.0-beta.64)
- **Issue**: SonarQube Web:S6853 warning on `FormLabel.vue` (false positive due to `<slot />`)
- **Decision**: User prefers global warning suppression over inline `<!-- sonarqube-disable -->` comments
- **Action**: Reverted inline suppression; user will configure global exclusion in SonarQube settings
- **Result**: Clean code, zero inline suppression comments

### Auth Form Label Color Fix (0.5.0-beta.62)
- **Issue**: Form labels (Email, DisplayName, Password) turned red in light mode when field had validation errors
- **Root Cause**: `FormLabel.vue` had `data-[error=true]:text-destructive` — shadcn default that applies red color on validation error
- **Fix**: Removed `data-[error=true]:text-destructive` from FormLabel's class — labels keep their original `text-gray-600` / `dark:text-[#8a8f98]` color regardless of error state
- **Result**: Labels stay neutral gray in light mode, only FormMessage shows red error text

### Auth Form Zero-Jump Spacing (0.5.0-beta.61)
- **Issue**: Validation warnings still caused slight layout jump — `min-h-[0.5rem]` (8px) insufficient for `text-sm` error text (~20px line-height)
- **Fix 1**: Restored FormMessage to `min-h-[1.25rem]` (20px) — fully reserves space for error text, zero jump
- **Fix 2**: Reduced form `gap-5` → `gap-3` (20px → 12px) to compensate, keeping fields紧凑
- **Result**: Zero layout shift on validation, compact professional spacing