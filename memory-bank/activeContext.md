# Active Context: ctt-web

## Current Status

**Phase**: v0.10.x Security & Account Features + UI Polish
**Version**: 0.10.6 (2026-07-05)
**Branch**: develop, master at 9899288
**Tests**: 897/897 pass (verified 2026-07-05)

## Recent Activity (v0.10.6 — 2026-07-05)

### Favicon replaced with PluginIcon SVG

- **Change**: Browser tab icon now uses the Code Time Tracker plugin icon (SVG) instead of the default Vite favicon
- **Files changed**:
  - `public/favicon.svg` — new file, SVG extracted from `PluginIcon.vue`
  - `index.html` — `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` + title changed from "Vite App" to "Code Time Tracker"
  - `package.json` — version 0.10.5 → 0.10.6

## Recent Activity (v0.10.5 — 2026-07-05)

### Bug fix: remove auto-call of `/api/v1/users/me/password/set` on mount

- **User report**: "登入进页面后，会自动调用不该调用的接口：/api/v1/users/me/password/set"
- **Root cause**: `usePasswordDetection` composable had `onMounted(() => { void checkPasswordStatus() })` which automatically called `setPassword('')` (POST to write endpoint) when `AccountSection.vue` mounted. Since `ProfileView` is the default landing page after login, this triggered the unwanted API call on every login.
- **Fix**: Removed `onMounted` auto-call. `hasPassword` starts as `null` (unknown) instead of `false`. `isChecking` starts as `false` instead of `true`. Detection is now lazy — `recheck()` is called explicitly only when user clicks "Set Password" button.
- **Files changed**:
  - `src/features/settings/composables/usePasswordDetection.ts` — removed `onMounted`, changed initial `hasPassword` to `null`, removed `onMounted` import
  - `src/features/settings/components/AccountSection.vue` — `handleOpenSetPasswordDialog` now `async`, calls `recheckPassword()` before opening dialog
  - `src/features/settings/composables/__tests__/usePasswordDetection.test.ts` — rewrote tests: removed onMounted auto-trigger tests, all tests now call `recheck()` explicitly
  - `src/features/settings/components/__tests__/AccountSection.test.ts` — added `recheck` mock to usePasswordDetection mock
- **Design decision**: `hasPassword: null` tri-state (null=unknown, false=no password, true=has password). `!hasPassword` in template evaluates `!null` as `true`, so "Set Password" button shows by default (correct UX for OAuth users).

### Appearance submenu: state-adaptive subtitle color (Round 5 — REPLACES Round 4)

- **User feedback (Round 4 was still bad)**: The `!text-muted-foreground` from Round 4 prevented the parent's `data-[state=open]:text-accent-foreground` from re-coloring the subtitle, but the result was still unreadable: `text-muted-foreground` is a **dark gray** (zinc-500 in light mode), which has insufficient contrast against the **strong purple accent background** when the trigger row is highlighted ("还是有看不清的问题要解决"). User posted a screenshot showing "Appearance" (white on purple, OK) next to "System (Light)" (dark gray on purple, hard to read).
- **Root cause**: A single static color token cannot be readable on both white (normal) and strong purple (highlighted) backgrounds. The subtitle must switch between two color tokens depending on the parent row's state.
- **Pattern adopted**: Tailwind `group-` variants on the subtitle, with `class="group"` added to the SubTrigger parent. The subtitle now carries three classes:
  - `text-muted-foreground` — default, dark gray on white
  - `group-focus:!text-accent-foreground/80` — when parent has `:focus` (keyboard nav), switch to white at 80% opacity for purple bg
  - `group-data-[state=open]:!text-accent-foreground/80` — when parent has `data-state="open"` (submenu showing), same light color
- **Why `!important`**: The parent's `data-[state=open]:text-accent-foreground` (selector specificity 0,2,0) sets the inherited `color` on children. The subtitle's group-data variant has lower specificity (`:where(.group)` from the `group-` prefix makes it (0,1,0)) so without `!`, CSS inheritance would override the explicit color. The `!` forces the subtitle's explicit color to win over inherited.
- **Why `/80` opacity**: Preserves visual distinction from the parent's full-opacity "Appearance" title — subtitle stays muted in both states (70-80% opacity mimics the muted-secondary-line UX from Perplexity).
- **Why both `group-focus:` and `group-data-[state=open]:`**: They cover disjoint states (keyboard nav vs submenu open). Both render the same light color so the visual transition is seamless.
- **Files modified**:
  - `src/components/app/AppHeader.vue`: added `class="group"` to `DropdownMenuSubTrigger`; updated subtitle class string; expanded JSDoc explaining state-adaptive coloring + why `!important` is needed
- **Tests**: unchanged — `data-testid="appearance-current"` selector still resolves; text assertions still pass against new structure.
- **Type-check**: Clean (vue-tsc exit 0)
- **Tests**: 897/897 pass (48 files)

### Appearance submenu: vertical two-line trigger (Round 4 — SUPERSEDED by Round 5)

- **User feedback (Round 3 was visually bad)**: Right-aligned inline label looked cramped ("在右边挤在一起") and the text became unreadable when the row was highlighted ("高亮下字都看不清了"). Asked to follow the Perplexity reference exactly — title on first line, current-theme value as a subtitle line below in muted smaller text.
- **Round 4 implementation**: Two-line column layout `[icon] [flex-col(Appearance / currentThemeLabel)] [chevron@ml-auto]`, with `!text-muted-foreground` to defeat the parent's `data-[state=open]:text-accent-foreground` override.
- **Round 4 verdict**: Layout fix was correct, but the static `text-muted-foreground` color is dark gray — unreadable on the strong purple accent background that appears when the trigger is highlighted. Round 5 replaces it with state-adaptive coloring.
- **Tests added in Round 4** (still passing in Round 5): "System (Light)" default, "System (Dark)" auto+dark, "Light" explicit, "Dark" explicit — 4 label variants covered.
- **Status**: Superseded by Round 5. The `currentThemeLabel` computed and theme-store mock additions are kept (Round 5 reuses both unchanged).

### Appearance submenu: show current theme on trigger (Round 3 — SUPERSEDED by Round 4)

- **User feedback (Round 2 was incomplete)**: Submenu only displays Light/Dark/System options, but the outer Appearance trigger does NOT show the current theme. User has to click into the submenu to know the current state. Asked for Perplexity-style: right-aligned label of the active theme visible without opening the submenu.
- **Round 3 implementation**: Added `ml-auto text-xs text-muted-foreground` span to the right of "Appearance" — but this put the value inline on the right edge (cramped) and the text-muted-foreground class was overridden by the SubTrigger's `data-[state=open]:text-accent-foreground` state styling, making the subtitle hard to read on highlight.
- **Tests added in Round 3** (still passing in Round 4): "System (Light)" default, "System (Dark)" auto+dark, "Light" explicit, "Dark" explicit — 4 label variants covered.
- **Status**: Superseded by Round 4. The `currentThemeLabel` computed and theme-store mock additions are kept (Round 4 reuses both unchanged).
- **Type-check**: Clean (vue-tsc exit 0)
- **Tests**: 897/897 pass

### lucide-vue-next → @lucide/vue migration (completed alongside Round 3)

- **Reason**: `lucide-vue-next` deprecated upstream — author message: "Package deprecated. Please use @lucide/vue instead." Latest published 3 months ago.
- **API**: Identical (same icon names, same default-import pattern). Only the package name changed.
- **Files touched** (sed across whole tree):
  - 25 source files (every `import { ... } from 'lucide-vue-next'` → `from '@lucide/vue'`)
  - 4 test files (`vi.mock('lucide-vue-next'` → `vi.mock('@lucide/vue'`)
- **package.json**: `"lucide-vue-next": "^1.0.0"` → `"@lucide/vue": "^1.23.0"` (R7 dependency change requested explicitly by user)
- **pnpm-lock.yaml**: regenerated via `pnpm install`
- **Verification**: type-check clean, 895/895 tests pass (pre-Round 3 baseline)
- **Risk**: Near-zero — `@lucide/vue` is the maintained successor from the same author (Lucide team), published on the same icon set

### Appearance submenu in avatar dropdown (Round 2 — SUPERSEDED by Round 3)

- **User feedback (Round 1 was rejected)**: Standalone `<ThemeToggle />` button next to avatar looked ugly ("有点丑"). Asked for Perplexity-style: theme options inside the avatar dropdown as a submenu.
- **Pattern adopted**: Avatar dropdown now contains `Appearance` submenu → Light / Dark / System radio group, matching Perplexity's "Current theme marked with checkmark" UX (shadcn-vue's `DropdownMenuRadioItem` provides the Circle indicator).
- **Implementation** (`src/components/app/AppHeader.vue`):
  - Removed `ThemeToggle` import + standalone button
  - Imported `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`
  - Imported `useThemeStore` + `ThemeMode` type from `@/stores/theme`
  - `handleThemeChange(value: unknown)` type-guards before calling `setTheme` (reka-ui's `AcceptableValue` includes `null`, which would not match a `string | number | undefined | (string | number)[]` signature)
  - ThemeToggle component kept — still used by `AuthLayout.vue`
- **Test mock** (`src/components/app/__tests__/AppHeader.test.ts`):
  - Module-level `vi.mock('@/stores/theme')` exposing `mode` as ref + `setTheme` as spy (mirrors the existing `useAuthStore` mock pattern)
  - Added stubs for `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`
  - New tests: "renders the Appearance submenu trigger", "renders Light/Dark/System radio items", "binds the Appearance radio group to the current theme mode"
- **Type-check**: Clean (exit 0, vue-tsc)
- **Tests**: vitest runner pre-existing pnpm 11 / `builtin:vite-wasm-fallback` breakage (unrelated, same blocker as v0.10.4 noted below)

### ThemeToggle in AppHeader (Round 1 — SUPERSEDED by Round 2)

- **Issue**: After login, theme toggle was only available on auth pages (AuthLayout); AppHeader had no theme control
- **Fix**: Added `ThemeToggle` component to `AppHeader.vue`, positioned left of avatar dropdown (industry common pattern)
- **File**: `src/components/app/AppHeader.vue` — imported ThemeToggle, placed before TooltipProvider in header's right-aligned flex container
- **Status**: Round 1 visually unpolished; replaced by Appearance submenu above. ThemeToggle component remains in tree for AuthLayout use.
- **Type-check**: Clean (exit 0)
- **Tests**: vitest runner has pnpm 11 binary resolution issue (pre-existing, unrelated to this change)

### Sidebar Icon & Collapse Enhancement

- **Plugin icon**: Replaced lucide `Clock` with JetBrains plugin icon (`src/components/app/PluginIcon.vue`); SVG inline in Vue component (no external asset)
- **Collapse behavior**: `collapsible="icon"` — sidebar shrinks to icon width instead of disappearing
- **Header behavior** (v-if/v-else conditional rendering):
  - **Desktop expanded**: `flex w-full justify-between` — PluginIcon left, SidebarTrigger right
  - **Desktop collapsed**: `grid grid-cols-1 grid-rows-1 h-9 w-9 group/trigger` — grid 1×1 stacks PluginIcon + SidebarTrigger in same cell for icon swap (opacity-0/100 with pointer-events control)
  - **Mobile**: SidebarTrigger in AppHeader (only when `isMobile=true`); AppSidebar hides desktop toggle on mobile (`!isMobile && state !== 'collapsed'`)
- **Perplexity-style compact layout**:
  - `SIDEBAR_WIDTH`: 16rem → 14rem
  - `SidebarMenuButton`: text 15px, height 9, icon 18px
  - `SidebarGroupLabel`: 11px uppercase tracking-wider
- **Accessibility**: PluginIcon SVG has `role="img" aria-label="Code Time Tracker"`
- **SVG cleanup**: Removed hardcoded width/height attributes, removed HTML comments (~250 bytes saved)
- **Import fix**: `useSidebar` from canonical path `@/components/ui/sidebar`
- **Copyright**: Hidden when collapsed (`group-data-[state=collapsed]:hidden`)
- **Profile icon**: Changed from `Settings` to `User`
- **Test mock fix**: Added `emailChangePending: false` to 3 test mocks; type-check clean (exit 0)

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

## Major Features (v0.7.x–v0.9.x)

- **Email Change (v0.9.0)**: 5 endpoints, 4 mutations, AccountSection integration
- **GitHub OAuth (v0.8.3)**: Complete OAuth login flow, 13 error codes, GitHub binding in ProfileView
- **hCaptcha (v0.7.6)**: Frontend CaptchaWidget + backend CaptchaService, graceful degradation
- **Terms Acceptance (v0.7.0)**: Integrated with ctt-server v0.25.1, Chinese terms content

## Architecture Decisions

- CustomEvent pattern for cross-component communication (UNAUTHORIZED_EVENT, TERMS_EXPIRED_EVENT)
- Request queue with Promise callbacks for terms acceptance replay
- Layer separation: form components emit form-layer types, views inject API-layer fields
- Vue Router 4 guards use return values instead of next()
- NProgress spinner disabled for cleaner UX
