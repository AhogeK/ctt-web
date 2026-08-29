# Active Context: ctt-web

## Current Status

**Phase**: Device Management O: test coverage complete (unit + component + E2E)
**Version**: 0.18.2 (2026-08-30)
**Branch**: develop
**Tests**: 1126/1126 unit + 9/9 devices E2E; vue-tsc + lint 0 error 0 warning

## Recent Activity (v0.18.2 — 2026-08-30)

### Device Management O: E2E test coverage

- **New E2E suite** `e2e/devices/`: fixtures.ts (DeviceFixture + TEST_DEVICES + error bodies), helpers.ts (setupDevicesPage: mockAuthApis + mutable devices route + loginViaForm + goto), list.spec.ts (empty state + install link, 3-card render with relative time/Active-Inactive, Revoke aria-labels), revoke.spec.ts (confirm → toast + list refresh; cancel), errors.spec.ts (list 404/network → ErrorState + Retry; revoke 404/409 → toast, dialog stays open). 9/9 chromium pass.
- **DeviceListView.vue**: added `data-testid="device-list"` / `data-testid="device-card"` (aligns with ApiKeysView api-key-* testids for stable E2E locators).
- **Gotchas**: (1) `CI=true` in this environment makes Playwright use the preview server (port 4173) — a stale preview process blocked startup; run E2E with `env -u CI ... playwright test` to reuse the running dev server (5173). (2) `page.reload()` after setup made the devices page bounce to login (mock-token auth re-init race) — project pattern for list-error tests is to seed the failing route BEFORE the first navigation (mockAuthApis + failing /api/v1/devices route + loginViaForm + goto), no reload needed.
- Tests: unit 1126/1126 (67 files) + devices E2E 9/9. type-check / build / lint clean.
- Version 0.18.1 → 0.18.2 (test coverage → PATCH).

## Recent Activity (v0.18.1 — 2026-08-30)

### Device Management O: unit + component test coverage

- **New unit tests**: `src/lib/api/__tests__/devices.test.ts` (list GET + envelope parse + non_null null-default + error propagation; revoke DELETE + void + error propagation, 7 cases), `src/lib/schemas/__tests__/device.schema.test.ts` (full/null/missing-field/empty-array/non-array + safeParse rejection, 10 cases), `src/composables/__tests__/useDevices.test.ts` (query key/staleTime/listDevices delegate; revoke mutation payload/invalidate/success toast/error toast-no-invalidate, 6 cases).
- **Consistency fix (found while testing)**: `useRevokeDevice` returned the raw `useMutation(...)` while `useRevokeApiKey` returns `{ mutation }` — unified to `{ mutation }` (JSDoc updated, DeviceListView.vue destructures `{ mutation: revokeMutation }`, DeviceListView.test.ts mock wraps `mutation`).
- **Component test** (`DeviceListView.test.ts`, 11 cases) already landed in v0.18.0; mock updated for the new return shape.
- **Tests**: +23 → 1126/1126 (67 files). type-check / build / lint clean.
- Version 0.18.0 → 0.18.1 (test coverage → PATCH).

## Recent Activity (v0.18.0 — 2026-08-29)

### Device Management N: error-code mapping + edge polish

- **Error-code mapping** (`src/lib/utils/api-error.ts`): COMMON_002 remapped from rate-limit text to "The requested resource was not found or you do not have access to it." — stale legacy mapping (backend 429 really returns RATE_LIMIT_001, verified live; COMMON_002 = 404 Resource not found per ErrorCode.java, surfaces on device 404). Added DEVICE_001 ("Device already registered to another user.").
- **Shared time utils** (`src/lib/utils/time.ts` + barrel export): `formatRelativeTime` / `formatDateTime` extracted from ApiKeysView inlines; DeviceListView + ApiKeysView now use them (no dayjs, R12).
- **DeviceListView polish**: first-load Skeleton ≥300ms anti-flicker (ApiKeysView pattern), Revoke button per-row aria-label, relative-time `title` shows absolute datetime, empty state gains "Install the JetBrains plugin" link to the plugin repo, unified relative time (30d/12mo granularity replaces the old 7-day cutoff).
- **ApiKeysView**: inline format helpers deleted (now import the shared util); `(name)` params in success-description explicitly typed `(name: string)` — vue-tsc loses contextual typing for these template arrow params once the helpers move to an import (TS7006 without the annotation).
- **Gotchas**: (1) edit-tool hygiene — bare non-`＋` lines in an edit payload can DELETE the matched anchor lines; api-error.ts + index.ts lost exports twice this session, caught by type-check. (2) DeviceListView RevokeDialog keeps default reka-ui focus (first tabbable = Cancel), no open-auto-focus needed — unlike AlertDialog.
- **Tests**: +time.test.ts (12), +DeviceListView.test.ts (11), +3 api-error mapping cases → 1102/1102 (64 files). Browser-verified: empty state + install link, device card (name/platform/relative time/Active), Revoke aria-label, dialog open, hover title; screenshot ~/Pictures/screenshots/v0.18.0-device-list.png.
- Version 0.17.3 → 0.18.0.

## Recent Activity (SKILL_GRAPH sync — 2026-08-24)

### SKILL_GRAPH.md rebuilt against actual skill sources

- **Task**: compare project skills + built-in skills + ~/.agents/skills + ~/.config/opencode/skills vs SKILL_GRAPH.md; update to cover all.
- **Measured reality**: ~/.agents/skills 371 (doc said 393), config 88, project .agents 38, project .claude 35 → 465 deduped (doc said 487). 0 skills missing from the graph after sync.
- **Ghost refs fixed (52)**: (1) 22 superpowers skills REMOVED (plugin uninstalled — brainstorming, systematic-debugging, test-driven-development, writing-plans, using-superpowers, etc.); flow references in 流程速查/优先级/加载模式 replaced with available alternatives (idea-refine, tdd, debugging/hunt). (2) 19 gstack unprefixed names FIXED to gstack-* (careful→gstack-careful, qa→gstack-qa, spec→gstack-spec, ios-*→gstack-ios-*). (3) 6 opencode built-ins ADDED (debugging, visual-qa, review-work, remove-ai-slops, init-deep, customize-opencode — marked 内置). (4) 5 stale/typos REMOVED (iso-13485-certification, obsidian-vault, finish-a-development-branch, finishing-a-development-branch). (5) arkcli/as/cm-xxx confirmed as description text, kept.
- Header stats updated (393→371, 487→465, date 2026-08-24, built-in note).
- Commit as AI content — NOT cherry-picked to master (per user).

## Recent Activity (deps update — 2026-08-24)

### Dependency update (vp update -L) + lint warning cleanup

- **Deps updated**: @lucide/vue 1.30.0→1.34.0, @tanstack/vue-query 5.101.4→5.102.2, pinia 4.0.2→4.0.3, reka-ui 2.10.1→2.10.3, vue-i18n 11.4.8→11.4.9, @commitlint/* 21.2.x→21.2.2, @faker-js/faker 10.5.0→10.6.0, @testing-library/jest-dom 7.0.0→7.0.1, @tsconfig/node24 24.0.4→24.0.5, @types/jsdom 28.0.3→30.0.0, @types/node 26.1.2→26.2.0, @vitest/* 4.1.10→4.1.11, eslint-plugin-oxlint ~1.77.0→~1.79.0, vite(vite-plus-core) 0.2.8→0.3.0, vite-plus 0.2.8→0.3.0, vitest 4.1.10→4.1.11, vue-tsc 3.3.9→3.3.11.
- **TypeScript 7 attempt — REJECTED by verification**: `vp update -L` bumps TS→7.0.2. Tried it (vue-tsc@3.3.11 peer says `typescript >=5.0.0` which LOOKS compatible), but type-check FAILS with `ERR_PACKAGE_PATH_NOT_EXPORTED` (vue-tsc can't resolve TS7's tsc path — the known programmatic-API removal). Reverted to exact `6.0.3`. RULE REINFORCED: TS must stay 6.0.3 pinned; vue-tsc's `>=5.0.0` peer is misleading (does NOT actually support 7). Verified all green on 6.0.3.
- **Lint warnings cleanup (user: no "pre-existing, don't fix" excuses)**: 2 long-standing `playwright(no-conditional-in-test)` warnings in e2e/api-keys/a11y-warnings.spec.ts fixed by extracting the console-warning collector to a module-level factory function (test body no longer contains conditionals). lint now 0 error 0 warning.
- **Verification (all green)**: peers check clean (zod peer rule intact), type-check PASS, build PASS, unit 1078/1078, lint 0/0, a11y e2e 1/1. pnpm-workspace.yaml untouched (zod `^4.4.3` peer rule preserved).
- Version unchanged (0.17.3) — deps + lint cleanup only, per task instruction.

## Recent Activity (v0.17.3 — 2026-08-24)

### SetPasswordDialog: password visibility toggles (parity with Login/Register)

- **Bug (user report)**: password fields in the Set/Change Password dialog had no show/hide toggle, while Login/Register forms do.
- **Fix**: mirrored the LoginForm/RegisterForm pattern — `showCurrentPassword`/`showNewPassword`/`showConfirmPassword` refs + Eye/EyeOff buttons in `relative` input wrappers (`pr-10` for icon space, `absolute right-2.5` button, `tabindex="-1"`, aria-label "Show/Hide …"). Three fields: currentPassword (change mode), newPassword (wrapped with PasswordStrengthMeter), confirmPassword.
- **Tests**: +2 (new password toggle password→text→password; current password toggle in change mode). 1076→1078.
- Version 0.17.2 → 0.17.3 (bug fix → PATCH).

## Recent Activity (v0.17.2 — 2026-08-24)

### SetPasswordDialog: server errors moved from bottom banner to field-level FormMessage

- **Bug (user report)**: "Current password is incorrect." appeared in a bottom error banner → (1) the banner's conditional mount/unmount shifted the layout (form jump), (2) style inconsistent with per-field validation errors (FormMessage under the input).
- **Fix**: removed the `errorMessage` ref + bottom `bg-destructive/10` div entirely. Server-side business errors now map onto the matching vee-validate field via `form.setFieldError(...)` so they render in the same FormMessage slot as validation errors — no layout jump, consistent styling:
  - USER_014 → currentPassword; PASSWORD_SAME_AS_OLD / COMMON_003 / USER_015 → newPassword.
  - Unknown errors: no inline message (toast from composable covers them — same as before via composable onError).
- **Tests**: error-handling suite rewritten (4 tests now assert setFieldError mapping per code instead of errorMessage ref rendering); `useForm` mock gained `setFieldError`; `ref` import removed from component. 1075→1076.
- Version 0.17.1 → 0.17.2 (bug fix → PATCH).

## Recent Activity (v0.17.1 — 2026-08-24)

### USER_014 401 triggered logout on password change (bug fix)

- **Bug (user report, real backend v0.44.0)**: changing password with an incorrect current password returned 401 USER_014 (correct backend behavior), but the frontend LOGGED THE USER OUT and redirected to login. Root cause: `handle401Error` (instance.ts) treated every 401 except AUTH_002/003 (refreshable), TERMINAL_AUTH_CODES, and AUTH_010 as a session-level failure → `removeItem(accessToken)` + `UNAUTHORIZED_EVENT`. USER_014 ("Invalid password" on password change) is a RESOURCE-level business 401 — the user IS authenticated, the operation failed a business check — so it must not clear auth.
- **Fix**: added USER_014 to the same no-logout branch as AUTH_010 (resource-level 401 whitelist). Comment updated to document both codes and the implicit contract (resource vs session 401 distinction is regression-prone).
- **Tests**: +2 in instance.test.ts (flat + wrapped formats, mirroring AUTH_010 tests): USER_014 must NOT call removeItem / dispatch UNAUTHORIZED_EVENT / toast. 1073→1075.
- Version 0.17.0 → 0.17.1 (bug fix → PATCH).

## Recent Activity (v0.17.0 — 2026-08-23)

### Change Password feature (dual-mode dialog) + Set Password bug fixes

- **Feature (user-reported logic gap)**: Account button flips "Set Password"→"Change Password" by hasPassword, but the dialog was hardcoded "Set Password" and the backend has ONLY POST /api/v1/users/me/password/set (409 USER_015 if already set) → "Change Password" was a dead end. Decision: implement REAL change-password flow (not cosmetic label fix). Frontend done this round; backend endpoint POST /api/v1/users/me/password/change is a REQUIREMENT TEXT handed to user (R3): body { currentPassword, newPassword } (both base64-encoded like setPassword — backend does NOT decode), wrong current → 401 USER_014, same-as-old → 409 PASSWORD_SAME_AS_OLD, weak → 400 COMMON_003 (all codes already exist in ErrorCode.java).
- **Implementation**: user.ts `changePassword()` (both fields base64); useSetPassword.ts `changePasswordMutation` (distinct toast "Password changed successfully", closes shared isDialogOpen, invalidates user query); SetPasswordDialog dual-mode via `hasPassword` prop + computed `mode` (dynamic title/desc/submit label, conditional "Current Password" FormField id=current-password autocomplete=current-password, change submits {currentPassword,newPassword}, USER_014/PASSWORD_SAME_AS_OLD inline errors); AccountSection passes :has-password="authStore.hasPassword".
- **Bug fixes folded in**: (1) SetPasswordDialog was missing PasswordStrengthMeter (ResetPasswordForm had it) — mirrored the exact pattern; (2) dialog never closed on success — AccountSection used its own local ref while useSetPassword's module-level shared isDialogOpen did the closing → now consumes the shared ref; (3) `:password="form.values.newPassword ?? ''"` on both meters (prop is string; `as string` masked undefined → Vue warn).
- **Review fixes (main agent)**: subagent left `as any` on toTypedSchema (R8 violation) + schema built once at setup (not reactive to hasPassword → current-password required check would fail after Set→profile refresh→reopen). Fixed: computed schema passed as computed to validationSchema (vee-validate supports MaybeRef schemas). Also form.test.ts mock lacked changePasswordMutation (3 crashes) — added.
- **Tests**: +changePassword API (base64 both fields, envelope, Zod reject); +6 composable (exposes mutation, calls API, success toast, closes dialog, invalidates, USER_014 toast, no close on error); dialog dual-mode unit (set: no current-password field, title Set; change: field visible, title Change, submits change mutation); form.test.ts real vee-validate stays green with mock sync. 1063→1073.
- Version 0.16.20 → 0.17.0 (new feature → MINOR; 0.16.20 was never committed).

## Recent Activity (v0.16.19 — 2026-08-21)

### 5.2 rate-limit verification (429 RATE_LIMIT_001) + E2E form-preservation

- **Backend 5.2a/c verified (real API, fresh account)**: creates #1-10 return 201, #11 returns **429 RATE_LIMIT_001**. **Backend 0.43.0 now ships retry timing on ALL 429s**: `Retry-After: 3599` header (RFC 7231 delta-seconds) + body `retryAfter: "2026-08-21T08:48:28Z"` (ISO-8601 window-reset instant, nullable). Verified against the real probe values: `getRetryAfterSeconds` returns header 3599 (priority) / body ≈3529s at probe time (clock-dependent). Rate-limit Redis key `rate_limit:user:ApiKeyController.createApiKey:{userId}` can be DEL'd between batches (raw socket RESP; AUTH reply must be consumed before next command — pipelining yields `-NOAUTH`).
- **Frontend 5.2a**: toast "Too many requests. Please wait a moment before trying again." (api-error.ts:128 RATE_LIMIT_001); countdown path (`/Please try again in \d+s\./`) covered by errors.spec.ts with RATE_LIMIT_WITH_RETRY_AFTER_BODY mock; real-format parsing locked by vitest probes (header delta-seconds, body ISO instant, priority, null fallback).
- **Coverage gap closed (5.2b)**: added E2E assertions that on 429 the dialog stays open and the typed name is preserved (`toHaveValue('Rate Limited Key')`) — previously only toast visibility was asserted. api-keys E2E 22/22.
- **CSRF note**: scripted POST to api-keys succeeds with plain Bearer (no XSRF) — `ApiKeySecurityConfig` header matcher ignores it; general rule: 403 in scripts → read SecurityConfig FIRST, don't rewrite requests blindly. Experience documented in test-auth-bootstrap references/ctt-server.md.
- Version 0.16.18 → 0.16.19 (test coverage → PATCH).

## Recent Activity (v0.16.18 — 2026-08-19)

### Error-code split: API key limit AUTH_014 → AUTH_024 (backend contract change)

- **Why**: ctt-server `ErrorCode.AUTH_014 = "Token creation failed"` was a dual-semantic code — used BOTH for the per-user API-key 20-limit (`ApiKeyServiceImpl.createApiKey`) AND for three token unique-constraint conflicts (`GlobalExceptionHandler` refresh/email-verification/password-reset token hash). "Token creation failed" fits the token cases but is non-descriptive for the key-limit case; changing its message would break the token cases. Split into AUTH_024 (key limit) per single-code-single-semantic convention.
- **Backend (ctt-server, by user)**: new `AUTH_024("Maximum active API keys reached", 409)`; create-api-key throws AUTH_024; AUTH_014 retained for token conflicts; Controller `@ExampleObject` updated; tests re-asserted; message intentionally has no hardcoded "20" (maxKeysPerUser is @DefaultValue("20")/configurable).
- **Frontend sync (this round)**: all API-key-limit references `AUTH_014 → AUTH_024` across 8 files — `api-error.ts` mapping (user-facing text unchanged), `CreateApiKeyDialog.vue` (`API_KEY_LIMIT_REACHED` constant + comments), `useApiKeys.ts`/`api-keys.ts` JSDoc, 3 unit-test mocks, `e2e/api-keys/fixtures.ts` (`AUTH_014_BODY` → `AUTH_024_BODY`), `errors.spec.ts`. AUTH_014 has zero remaining references in ctt-web (token conflict case is backend/other-client only).
- **Verification**: 1061/1061 unit, 22/22 api-keys E2E (errors.spec asserts AUTH_024 banner + form preservation + reset), lint 0 error, type-check clean. A live-backend 21st-create probe was attempted but blocked by the 10/hr Redis rate limit (key-clearing via raw TCP DEL succeeded but the shell JWT-sub decode failed on macOS `base64 -d` vs `-D`); E2E mock coverage is sufficient for the frontend contract.
- Version 0.16.17 → 0.16.18 (contract sync → PATCH).

## Recent Activity (v0.16.17 — 2026-08-17)

### 4.5.2 delete-constraint verification (defense) + E2E double-click coverage

- **Verification (4.5.2b/c/d/e, real backend via 2 bootstrapped accounts)**: ACTIVE delete → 409 AUTH_023 (actual message "Active API keys must be revoked before they can be deleted" — acceptance doc's "Only revoked API keys can be deleted" is stale, backend v0.42.0 authoritative); nonexistent UUID → 401 AUTH_010; repeat delete → 204→204→401 AUTH_010; BOLA cross-account → 401 AUTH_010, owner's key untouched. All PASS.
- **Verification (4.5.2a/f, code + tests)**: ACTIVE shows Revoke only; REVOKED **and EXPIRED** show Delete (acceptance doc says "REVOKED only" — intended drift since v0.16.7, backend v0.42.0 deletes EXPIRED directly); double-click guard verified (JS isPending early-return + :disabled + dialog-close block + unit test "does not double-mutate").
- **Coverage gap closed**: added E2E `rapid double-click on the confirm button fires exactly one delete request` (delete.spec.ts) — holds the delete response open (route + manual release) so the mutation stays pending across both clicks, dispatches the 2nd click via dispatchEvent (a real click() blocks on actionability since the button disables; the accessible name also switches to "Deleting..." so locators must be re-resolved), asserts deleteRequests === 1 via expect.poll. E2E api-keys suite now 22/22.
- Playwright chromium browsers were missing from cache — reinstalled via `pnpm exec playwright install chromium` (npm refuses: EBADDEVENGINES pnpm-only).
- Version 0.16.16 → 0.16.17 (test coverage → PATCH).

## Recent Activity (v0.16.16 — 2026-08-16)

### Component Render Error: Cannot read properties of undefined (reading 'length')

- **Bug (user report)**: Component Render Error `Cannot read properties of undefined (reading 'length')` in CreateApiKeyDialog — happened while using the dialog, not on open.
- **Root cause**: the scopes `<FormField>` only exists in Custom mode (`v-else` branch of the Recommended/Custom toggle). vee-validate 4 **unregisters a field when its FormField unmounts** (default `unregister: true`). Flow: dialog opens → `setFieldValue('scopes', ...)` registers the field → user switches to Custom (FormField mounts, takes over the field) → switches back to Recommended (FormField unmounts → vee-validate unregisters scopes) → `form.values.scopes` becomes `undefined` → the submit button's `:disabled="... || form.values.scopes.length === 0"` throws. The unit suite never caught it because its useForm mock always returns scopes.
- **Fix**: `keepValuesOnUnmount: true` on the `useForm` call — vee-validate keeps the value when the field unmounts (`field.keepValueOnUnmount ?? form.keepValuesOnUnmount` in vee-validate source). One-line, form-level.
- **Tests**: +1 real-integration regression in CreateApiKeyDialog.form.test.ts (toggle Custom → Recommended → assert values.scopes intact + submit still works). Also fixed a latent mock bug in that file: checkbox mock template used `($event.target as HTMLInputElement)` — TS `as` is NOT allowed in runtime-compiled mock templates (`SyntaxError: Unexpected identifier 'as'`); switched to `$event.target.checked`. 1061/1061 unit.
- **Similar-risk audit**: EmailChangeDialog's password FormField is also `v-if`-gated, but its submit callback guards with `values.password || ''` — no render-time `.length` access → not affected (kept minimal, no change).
- Version 0.16.15 → 0.16.16 (bug fix → PATCH).

## Recent Activity (v0.16.15 — 2026-08-16)

### Create API Key: click the mm/dd/yyyy text area opens the date picker

- **UX gap (user feedback)**: the custom expiration date field is a native `<input type="date">`; browsers only open the picker via the calendar indicator icon — clicking the mm/dd/yyyy text area did nothing. Follow-up: clicking a segment (e.g. "dd") highlighted/selected that text.
- **Fix (iterated)**: `handleDateFieldClick` calls the native `showPicker()` API (Chrome 99+/Firefox 101+/Safari 16.4+; user-gesture gated) on `@click` of the field, wrapped in try/catch so an already-open picker (InvalidStateError) or unsupported browsers silently degrade to native behavior. `handleDateFieldMouseDown` prevents the native segment text selection on mousedown (only when showPicker is available).
  - **Iteration 1 mistake**: also called `input.focus()` after preventDefault — focusing a date input makes Chrome auto-select its FIRST segment ("mm"), so every click highlighted mm. Removed the manual focus.
  - **Iteration 2**: dropping focus entirely also dropped the focus ring (user noticed: "选择时的边框高亮不见了"). CSS cannot restore it — verified pixel-identical screenshots for every variant (`::-webkit-datetime-edit-*-field:focus`, `::selection`, `user-select`) in headed Chrome; Chrome's segment highlight is UA-internal and unstylable. Final design: keep mousedown preventDefault (no real focus, no segment selection) and FAKE the focus styling via `dateFieldActive` ref (border-primary + ring tokens) while the picker interaction is active; cleared on date change, outside click, dialog close.
  - **Gotcha**: the document-level mousedown listener that clears the fake focus must register in the CAPTURE phase — reka-ui DialogContent stops propagation of bubble-phase mousedown inside the dialog. Also: headless Chromium does not render datetime-edit pseudo-elements at all (computed style returns defaults), so screenshot-based verification of segment highlight MUST use headed Chrome.
  - Diagnostic insight: ArrowUp value changes while the picker is open are picker-internal preview highlights (reverted on Escape), NOT field segment selection — do not mistake them for a regression.
- **Tests**: +3 (text-area click calls showPicker; already-open picker does not crash; mousedown prevents default + shows fake focus + clears on change). 1060/1060 unit. Test helper `installShowPickerMock` uses property descriptors (oxlint unbound-method rule); attachTo: document.body needed for focus assertions; nextTick after dispatchEvent for class assertions.
- **Verified in real Chrome** (Playwright, headed): click → activeElement stays empty (no real focus, no segment selection, ArrowUp after Escape is a no-op), simulated focus ring appears on click and clears on outside click; screenshots: ~/Pictures/screenshots/v0.16.15-date-simulated-focus.png.
- Version 0.16.14 → 0.16.15 (UX fix → PATCH).

## Recent Activity (v0.16.14 — 2026-08-14)

### Custom-mode scope descriptions (GitHub PAT style)

- **UX gap (user QA follow-up)**: the 4 Custom-mode scopes (READ/SYNC/WRITE/ADMIN) showed only names — users cannot tell what each grants (user had to ask). Decision: always-visible one-line descriptions instead of hover tooltips (tooltips vanish on touch devices; scope purpose is decision-critical at checkbox time).
- **Fix**: `SCOPE_DESCRIPTIONS` map (aligned with ctt-server ApiKeyScope semantics: READ=Read-only access, WRITE=Manage API keys & devices, SYNC=Bidirectional data sync, ADMIN=Full admin access (supersedes all)); label layout changed to checkbox + two-line text (name + muted description).
- **Tests**: +1 (all 4 descriptions render in Custom mode). 1057/1057 unit.
- **Verified in browser** (1024px + 375px): all 4 descriptions render on desktop AND mobile.
- Version 0.16.13 → 0.16.14 (bug fix → PATCH).
- **Dual-axis review (2 omo sub-agents, bg_30b0d502 Standards + bg_b34fbf3a Spec): both PASS, 0 findings. Committed as 4 atomic commits (code / version / memory / skills).

## Archived History

Entries before v0.16.14 (2026-08-13 and earlier) are archived to keep this
file within the AGENTS.md 200-line limit. See `docs/archives/2026-08-16-activeContext-archive.md`
for the full chronological record (v0.16.13 down to v0.8.x, incl. incidents
and lessons).

Archived on 2026-08-16 (v0.16.16).
