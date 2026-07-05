# Active Context: ctt-web

## Current Status

**Phase**: v0.10.x Security & Account Features + UI Polish
**Version**: 0.10.4 (2026-07-05)
**Branch**: develop, master at 9899288
**Tests**: 892/892 pass (verified 2026-07-05)

## Recent Activity (v0.10.4 — 2026-07-05)

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
