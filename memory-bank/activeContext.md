# Active Context: ctt-web

## Current Status

**Phase**: v0.16.1 hCaptcha CSP sentry fix
**Version**: 0.16.1 (2026-08-10)
**Branch**: develop
**Tests**: 1041/1041 unit (61 files) + 19/19 API-key E2E; `pnpm build` (type-check + build-only) exit 0

## Recent Activity (v0.16.1 — 2026-08-10)

### hCaptcha CSP: disable sentry to stop prepare.js inline-script violations

- **BUG**: login page console kept reporting `prepare.js:1 Executing inline script violates CSP script-src` (no 'unsafe-inline'). Two-layer root cause:
  1. **Backend (ctt-server v0.41.1)**: CSP header hCaptcha hosts were quoted (`'https://hcaptcha.com'`) — CSP3 forbids quotes on host-sources, browser ignored them → whitelist dead. Backend fixed (removed quotes).
  2. **Frontend (this fix)**: CaptchaWidget didn't pass `sentry` → vue3-hcaptcha default `sentry: true` → api.js loads `sentry=true` → hCaptcha initialises its Sentry error reporter via inline script injection → blocked by CSP. Hash differs per browser (dynamic) — confirmed the sentry channel.
- **Fix**: `src/components/CaptchaWidget.vue` adds `:sentry="false"` (standard hCaptcha embed doesn't need Sentry reporting; strict-CSP sites should disable it). api.js URL now `sentry=false`; headed-Chrome checkbox click → zero CSP violations.
- **Verification**: 1041/1041 unit + type-check + lint + build green; headed browser no CSP violation after reload.
- Version 0.16.0 → 0.16.1 (bug fix → PATCH).

## Recent Activity (v0.16.0 — 2026-08-10)

## Recent Activity (v0.16.0 — 2026-08-10)

### API Key permanent delete (REVOKED keys only)

- **Feature**: REVOKED keys can now be permanently deleted (matches mainstream AI-platform UX; users can clean up dead rows). Backend delivered v0.41.0: `DELETE /api/v1/auth/api-keys/{id}/delete` → 204; only REVOKED keys allowed (409 AUTH_023); missing/foreign/already-deleted → 401 AUTH_010 (BOLA); audit via API_KEY_DELETED; JPA delete, no FK constraints.
- **Frontend**: `deleteApiKey(id)` API (204 no-envelope, mirrors revokeApiKey); `useDeleteApiKey()` mutation (invalidates ['api-keys']); **shared `ConfirmApiKeyActionDialog.vue`** replacing the previously separate RevokeApiKeyDialog + DeleteApiKeyDialog (both were ~95% identical ~70-LOC shells; parameterised by title/description/labels/toast copy + passed mutation — extraction decided at 2 copies per review, not deferred to a 3rd); `ApiKeysView` shows Delete button only on REVOKED rows (desktop table + mobile cards); AUTH_023 mapped in api-error.ts; README API Key Management row updated (R4).
- **Tests**: shared-dialog unit suite covers both revoke & delete configurations (13 cases incl. AUTH_023 error toast); ApiKeysView wiring tests migrated to shared-component stub (title prop distinguishes instances); E2E delete.spec.ts now 6 cases — happy flow, cancel, revoke→delete chained flow, AUTH_023 defensive toast, BOLA AUTH_010 toast (no logout), mobile-card view full flow. 1041/1041 unit, 19/19 E2E.
- Design: ACTIVE/EXPIRED have NO delete path (revoke-first is the only route to removal; server enforces 409 AUTH_023 as second line).
- Version 0.15.5 → 0.16.0 (new feature → MINOR).

## Recent Activity (v0.15.5 — 2026-08-09)

### Schema fix: Jackson NON_NULL omits null fields → .nullable() threw on undefined

- **BUG (real-integration, blocking create)**: clicking Create API Key threw `ZodError: expected string, received undefined` for apiKey.lastUsedAt/expiresAt/revokedAt/createdAt. Root cause: ctt-server runs `jackson.default-property-inclusion: non_null` (application.yaml), so null Instant fields are OMITTED from JSON — the frontend `z.string().nullable()` accepts null but NOT undefined → parse threw. This affects BOTH create (fresh key: lastUsedAt/revokedAt null) and list responses.
- **Fix**: `ApiKeySchema` nullable timestamps → `.nullable().default(null)` (aligns with existing user.schema.ts lastLoginAt precedent). **Blast sweep**: same latent bug fixed in `device.schema.ts` (deviceName/platform/ideName/ideVersion/appVersion — "may be null if not set by client") and `oauth-account.schema.ts` (providerLogin/providerEmail). All nullable-without-default occurrences in src/lib/schemas/ eliminated (only `api.schema.ts` data field uses `.nullable().optional()` which is intentional).
- **Regression tests**: api-key.schema.test.ts +3 (explicit null accepted; ABSENT fields accepted & coerced to null; missing createdAt rejected). 1029/1029 green, type-check/lint/build clean.
- **Lesson (R15 candidate)**: ctt-server's global NON_NULL Jackson config means any nullable backend field arrives as undefined. Frontend schema rule: nullable backend fields MUST use `.nullable().default(null)`, never bare `.nullable()`.

## Recent Activity (v0.15.4 — 2026-08-09)

### Sidebar regression fix: circular-import dropped defineProps declaration

- **BUG (layout-breaking, introduced by f702f32 TS 6.0.3 downgrade)**: `Sidebar.vue` used `defineProps</* @vue-ignore */ SidebarProps>()` importing `SidebarProps` from `'.'` (index barrel) — a circular import (index.ts re-exports Sidebar.vue). Rolldown's SFC compiler could not resolve the type, so with `@vue-ignore` suppressing the error it **silently dropped the entire props declaration** (`withDefaults` defaults never compiled). Runtime: `side` undefined → template ternary `side === 'left' ? 'left-0' : 'right-0'` always rendered `right-0` (sidebar on the RIGHT); `collapsible`/`variant` undefined → collapse feature and styling broken. Affected dev AND build (verified in compiled vendor JS: no `props:` field).
- **Fix**: new `src/components/ui/sidebar/props.ts` holds `SidebarProps`; `Sidebar.vue` imports from `./props` (breaks the cycle); `index.ts` re-exports the type; `@vue-ignore` removed (build passes without it — vue-tsc also clean). Compiled output now has `props:{side:{default:'left'},variant:{default:'sidebar'},collapsible:{default:'offcanvas'},class:{}}`.
- **Lesson (R15 candidate)**: `@vue-ignore` on a `defineProps<Type>()` whose type import is circular can make @vue/compiler-sfc silently emit a component with NO props — defaults vanish without any error. Circular type imports from index barrels in shadcn-style components are the trigger; keep prop interfaces in standalone files.
- Verification: browser check (Playwright) → `data-side:left`, `data-state:expanded`, inner div `position:fixed, left:0`, width 224px; collapse/reopen toggles. unit 1026/1026, type-check, lint, build green.

## Recent Activity (v0.15.1 — 2026-08-07)

### API Key E2E Suite + Production Bug Fixes

- **E2E suite created** (e2e/api-keys/, 7 files): fixtures.ts + helpers.ts (mutable-state page.route mocks, okEnvelope) + 5 specs: list (empty/3-key table/ACTIVE-only Revoke), create (full flow incl. copy-gated close), revoke (confirm→REVOKED→button gone), errors (409 banner+form preserved, 429 toast, 401 AUTH_010 toast + NOT logged out), rawkey-dialog (Esc/overlay no-close, copy-gated close). 13/13 pass (chromium).
- **BUG FIX 1 (blocking, pre-existing since v0.12.0)**: CreateApiKeyDialog Name field bound via `v-bind="form.defineField('name')[0]"` — with the Input component's passive `useVModel`, input values never synced to the vee-validate model → "Name is required" forever → create-key feature was unusable. Fixed by switching to the standard `FormField + componentField` pattern (same as LoginForm) + removing `passive: true` from ui/input/Input.vue.
- **BUG FIX 2 (same class, v0.10.x regressions)**: SetPasswordDialog + EmailChangeDialog used the same broken defineField binding — input never synced to the vee-validate model, so OAuth password-set and email-change forms were unusable (mocks masked it: they stubbed `onUpdate:modelValue` which real defineField never emits). Fixed both to FormField + componentField; mocks updated to ui/form stubs + real-vee-validate integration tests added (CreateApiKeyDialog.form.test.ts) so this binding class is now regression-guarded.
- **E2E infra fixes**: playwright.config webServer command npm→pnpm (EBADDEVENGINES), viewport 1920×1080 (sidebar hit-test overlap in headless at 1280), native el.click() for content buttons (sidebar overlay intercepts pointer events in headless).
- **Test updates**: CreateApiKeyDialog.test.ts added ui/form stubs; useApiKeys.test.ts +5 (useApiKeys query key/staleTime/listApiKeys, useCreateApiKey payload/invalidate/no-invalidate-on-error); RawKeyDialog.test.ts +1 (aria-labelledby/aria-describedby explicit assertion via $attrs pass-through mock); errors.spec.ts +1 (countdown toast when 429 body carries retryAfter instant — future-proof path now E2E-covered).
- **Round review fixes (dual-axis)**: +3 createApiKey unit tests (api-keys.test.ts — POST URL/body incl. optional expiresAt, envelope parse, AUTH_014 propagation); errors.spec.ts cleaned (removed dead `type Page` import + `export type { Page }`, replaced inline GET fulfill with `route.fallback()` → setup handler); helpers.ts submitCreateForm comment corrected (no longer references removed passive useVModel). RevokeApiKeyDialog double-click idempotency: NOT added — test already existed (lines 189-203, pending-guard verification); Spec-axis finding was stale.
- **Round-2 review fixes (user-mandated "fix all findings")**: (1) removed dead `defineField` mock from CreateApiKeyDialog.test.ts (standards-axis hard violation — component migrated to FormField, mock never called); (2) removed dead re-export `export { TEST_RAW_KEY, AUTH_014_BODY, ... }` from e2e/api-keys/helpers.ts (all specs already import from fixtures.js directly); (3) removed `as never` type escapes in useApiKeys.test.ts (typed `const request: CreateApiKeyRequest`); (4) added real-form integration tests for the two other bug-fixed dialogs — SetPasswordDialog.form.test.ts + EmailChangeDialog.form.test.ts (+6 total: empty-field schema error, typed-value→model sync, mismatch error, USER_013 password field sync) since the unit mocks cannot guard the binding class. Rejected with justification: ui/form mock block duplication across 3 test files (Vitest hoisting makes shared stubs cost > 15-line duplication; per-file self-contained mocks are community convention, not logic redundancy).
- **Lighthouse a11y audit (K acceptance #4)**: lighthouse@13.4.1 added as devDependency (user-approved, plan-scoped). Audited `/settings/api-keys` authenticated state via Playwright persistent-context keep-alive (port 9222) + puppeteer-core connect + `lighthouse(url, flags, config, page)` Node API — CLI alone cannot reach the guarded route. **Score 91/100** (≥90 acceptance met). Fix: `--muted-foreground` light mode `#8a8f98` → `#62666d` (aligns DESIGN.md; contrast 3.25:1 → 5.77:1, cleared 23 low-contrast nodes in the mobile card view). Known edges (not fixed, documented): shadcn default destructive `#e7000b` on white = 4.48:1 (0.02 under, global token consistent with table view); vue-devtools injected anchor triggers aria-prohibited-attr (dev-server-only, absent in production builds). Audit command is one-off (script was /tmp, removed after run); a repeatable script could be added later if CI lands.
- **Peer dep warning fix (zod)**: `pnpm peers check` flagged @vee-validate/zod@4.15.1 declaring peer `zod: ^3.24.0` vs installed zod 4.4.3. Research: zod 4 is a superset (v3 API preserved), real-form integration tests exercise toTypedSchema against zod 4 (1026/1026 green), and the project relies on zod-4-only APIs (`z.iso.datetime()`/`z.email()`/`z.uuid()`, 14 files) so downgrading is impossible. Declaration lag, not a conflict. Fixed via `peerDependencyRules.allowedVersions.zod: '^4.4.3'` in pnpm-workspace.yaml (same pattern as existing vite/vitest entries). `pnpm peers check` now clean.
- Version 0.15.0 → 0.15.1 (bug fixes → PATCH).

## Recent Activity (v0.15.0 — 2026-08-07)

### API Key Responsive Card View (J 节响应式，不延后 v2)

- User decision: implement the deferred <768px card view now instead of v2.
- `ApiKeysView.vue`: table branch wrapped in `hidden md:block` (desktop ≥768px, unchanged incl. caption/aria-labels); new sibling `md:hidden` card view — one card per key (`rounded-lg border p-4`, DeviceListView precedent): name + status badge, monospace key prefix, scope chips, Last used/Created/Expires metadata (formatRelativeTime/formatDate, null → "Never"), Revoke button only for ACTIVE (same destructive style + aria-label). No duplicate Create button (page header stays visible on mobile).
- Tests +3 → 1006/1006: card per-key render, ACTIVE-only Revoke with aria-label, metadata/Never values.
- **Round review fixes**: added `data-testid="api-key-table"` / `"api-key-cards"` / `"api-key-card"` (replaced fragile `.rounded-lg.border.p-4` / `[class*="md:hidden"]` selectors that could collide with skeleton/empty markup); unified card hover to `hover:bg-muted/30` (matches table row); added card Revoke click→dialog test (+1) and skeleton-period card-hidden assertion (+1) → 1008/1008.
- Version 0.14.0 → 0.15.0 (new feature → MINOR).

## Recent Activity (v0.14.0 — 2026-08-07)

### API Key Edge Polish (J): error mapping, skeleton anti-flicker, a11y, header entry

- **429 rate-limit countdown**: `getRetryAfterSeconds(error)` in `src/lib/utils/api-error.ts` (exported via index barrel) — dual-source: (a) HTTP `Retry-After` header (delta-seconds or HTTP-date), (b) `retryAfter` ISO-8601 Instant in error body; fully defensive, never throws, null when absent. `CreateApiKeyDialog` shows countdown toast ("Please try again in Ns.") when timing exists, else falls back to static mapped message. **Backend gap (verified ctt-server source)**: API key create 429 sends NO Retry-After header and NO retryAfter field — countdown is future-proof only; users currently see the static message.
- **First-load Skeleton anti-flicker**: `ApiKeysView` keeps skeleton visible ≥300ms (MIN_SKELETON_MS) even if the query resolves faster; gated so background refetches (data present) never re-show skeleton; timer cleared on unmount.
- **A11y**: sr-only table caption "API keys"; per-row Revoke button aria-label "Revoke {name}".
- **Header entry**: AppHeader avatar dropdown adds Settings item → `/settings/api-keys` (RouteNames.SETTINGS_API_KEYS constant), between Appearance submenu and Logout.
- **Tests +18** (1003 total): getRetryAfterSeconds 10 cases (fake-timer deterministic), CreateApiKeyDialog 429 countdown/static/AUTH_014 regression, ApiKeysView skeleton-min (success + error paths)/caption/aria-label, AppHeader Settings navigation.
- **Round review fixes**: removed speculative `error.retryAfter` top-level candidate in readBodyRetryAfter (ofetch body always at error.data; YAGNI — eliminated untested dead path); added Why comments for floor vs ceil rounding (RFC 7231 delta-seconds is whole; date-diff needs ceil to avoid premature retry); removed redundant `showSkeleton.value = false` in onUnmounted; added skeleton ≥300ms error-path test (+1). Kept: aria-label string concat (Vue template backtick literal breaks SFC compile).
- **Deviations (project-consistency)**: dayjs NOT introduced (R12 — existing formatRelativeTime is functionally equivalent incl. future dates); no breadcrumb component added (project has none, sidebar nav already covers it); ApiKeysErrorState.vue / SettingsLayout.vue NOT created (inline error state already complete, no reuse case; spec deliverable paths are stale).

## Recent Activity (v0.13.0 — 2026-08-03)

### API Key Revoke Flow (M3)

- **API layer**: `revokeApiKey(id)` in `src/lib/api/api-keys.ts` — DELETE, 204 empty body (idempotent, no RestApiResponseSchema parse since ofetch resolves null); `useRevokeApiKey()` in `src/composables/useApiKeys.ts` invalidates `['api-keys']` on success.
- **Interceptor fix (blocking)**: `instance.ts` `handle401Error` previously logged the user out on ANY non-retryable 401. AUTH_010 (BOLA: key not found / not owned) is a resource-level 401 for an authenticated user — now excluded from token removal + UNAUTHORIZED_EVENT, error propagates to caller for the generic "API key not found or no longer accessible" message (acceptance criterion 4).
- **UI**: `RevokeApiKeyDialog.vue` (AlertDialog destructive confirmation, key name + monospace prefix, Cancel default focus, pending guard blocks double-mutate/close, success toast + close, AUTH_010 error keeps dialog open + generic toast); `ApiKeysView.vue` Actions column Revoke button enabled for ACTIVE rows only.
- **New UI primitives**: `src/components/ui/alert-dialog/` reka-ui wrappers (8 files) — were missing from the project; shadcn-vue style, mirrors existing `dialog/` wrappers.
- **Tests**: api-keys.test.ts (+7), instance.test.ts (+3 AUTH_010 flat/wrapped), useApiKeys.test.ts (+5), RevokeApiKeyDialog.test.ts (+8 incl. focus), ApiKeysView.test.ts (+5, new). 985/985 pass (58 files); type-check + build + lint clean.
- **Round-2 review (spec-axis)**: view-level success-flow test added (list refresh → row REVOKED badge + button gone); instance.ts AUTH_010 comment corrected to reference getErrorMessage (not extractErrorCode); focus mechanism kept (Round-1 fix verified against reka-ui source: AlertDialogContent.js:43-59 nextTick-focuses registered AlertDialogCancel, FocusScope.js:96-98 first-tabbable suppressed by preventDefault).
- **Post-review fixes**: Cancel default focus made explicit via `@open-auto-focus` + preventDefault (reka-ui official mechanism — built-in AlertDialogContent handler focuses registered AlertDialogCancel; user handler runs first in mergeProps and suppresses first-tabbable default); `selectedKeyForRevoke` cleared on dialog close (stale-state cleanup, mirrors handleRawKeyDialogClose); JSDoc corrected (getErrorMessage not extractErrorCode; inline `@throws` type literal — importing ApiError triggered TS6133 as JSDoc-only reference); ApiKeysView integration test added (ACTIVE-only button, dialog wiring, fresh-key on reopen). AlertDialogAction kept (shadcn full primitive-set convention, matches dialog/).
- **Note**: component path follows actual `src/features/settings/components/` (Notion plan's `api-keys/` path is stale).

## Recent Activity (v0.12.0 — 2026-08-02)

### Notion H 节完成总结更新（2026-08-02）

- 已更新 Notion「🌐 ctt-web 开发计划」H 节（创建流程 + RawKey 一次性展示）为完成态：全部 checkbox `[x]`、交付物表格 `✅ 已完成`、验收标准逐条 `✅`、新增「完成记录」小节（v0.12.0）
- 修正计划中的 4 处与实现不符的描述：组件路径 `src/features/api-keys/components/` → `src/features/settings/components/`；API 文件 `lib/api/api-key.ts` → `src/lib/api/api-keys.ts`；invalidate key `['api-keys', 'list']` → `['api-keys']`（`API_KEYS_QUERY_KEY` 常量）；`expiresAt` 类型 `z.string().datetime()` → `z.iso.datetime()`（ISO 8601 with offset）
- 由子 agent（unspecified-high, bg_57515fc6）执行 `update_content` 精确替换整块 H 节；独立复核确认 G 节（2945 chars）与 I 节（1699 chars）字节级未变，仅 H 节被修改

## Recent Activity (v0.12.0 — 2026-08-02)

### Dependency Update (chore, no version bump)

- `vp update -L`: @playwright/test 1.62.0→1.62.1, lint-staged 17.2.0→17.3.0, vue-tsc 3.3.8→3.3.9
- TypeScript again auto-bumped to 7.0.2 by `-L` → re-pinned to 6.0.3 (TS7 removed programmatic APIs that vue-tsc/@vue/compiler-sfc depend on; must re-pin after every `-L` run)
- Verified: `pnpm type-check` exit 0, `pnpm build` exit 0
- Commits: develop `c8795ae`; cherry-picked to master `a79fa06` (non-AI content per R6.5)

## Recent Activity (v0.12.0 — 2026-07-31)

### API Key Create Flow + RawKeyDialog (M2)

- **CreateApiKeyDialog**: vee-validate + Zod form (name / scopes / expiration). Scope mode toggle (JetBrains recommended READ+SYNC vs custom 4-checkbox). Expiration presets (30/90/365 days, never) + custom native date input. 409 AUTH_014 shows inline limit banner without clearing the form; other errors toast.
- **RawKeyDialog (core)**: one-time raw key display. Hard to dismiss (overlay click, Escape, and X button all blocked; only "Copied, close" exits). Strong constraint: close button disabled until copy succeeds. Three-tier clipboard fallback via `useCopyToClipboard` (navigator.clipboard → execCommand → manual hint). `role="alertdialog"` + aria labels + focus/select on open.
- **CreateApiKeyRequestSchema**: `expiresAt` now `z.iso.datetime()` + future-time refine (UX only; server `@Future` remains authority).
- **API/composable**: `createApiKey()` in `api-keys.ts`; `useCreateApiKey()` mutation invalidates `['api-keys']` on success.
- **Error codes added**: `AUTH_014` (20-key limit), `AUTH_010` (BOLA generic) in `api-error.ts`.
- **Files**: `features/settings/components/CreateApiKeyDialog.vue`, `RawKeyDialog.vue`, `composables/useCopyToClipboard.ts`; ApiKeysView integrated with create flow.
- **Tests**: +28 (schema 8, clipboard 5, RawKeyDialog 9, CreateApiKeyDialog 6); 956/956 total.
- **Verification**: `pnpm build` exit 0; `pnpm test:unit` 956/956; `pnpm lint` clean.
- **Post-review fixes (sub-agent audit)**: `pendingRawKey` now cleared when RawKeyDialog closes (raw key not retained in memory after display); submit button disabled when scopes empty; added toast-error-path test (+1 → 957/957).

## Recent Activity (v0.11.0 — 2026-07-30)

### API Key List Page (M1) + Build Fixes

- **API Key Management M1**: Implemented `/settings/api-keys` list page with GitHub PAT-style table, loading skeleton, error state, empty state, status badges (ACTIVE/EXPIRED/REVOKED), scope chips, relative time formatting. Route was pre-registered; sidebar link added to Settings group.
- **TypeScript 7.0.2 → 6.0.3**: Downgraded because TS7 removed all programmatic APIs (`findConfigFile`, `sys`, etc.) that `vue-tsc` and `@vue/compiler-sfc` depend on. Vue toolchain has not yet adapted to TS7's new modular `unstable/*` API.
- **Rolldown build fix**: Added `script.fs` option to `@vitejs/plugin-vue` configuration for file system access when compiling SFC type-only props in Rolldown environment. Added `/* @vue-ignore */` workaround to `Sidebar.vue` for unresolvable `SidebarProps` type.
- **AppSidebar test fix**: Added `KeyRound` mock, `/settings/api-keys` route, and navigation assertions.
- **Bug fix**: `formatRelativeTime` now correctly handles future dates (`expiresAt`). Cleaned up unused `ApiKeysListResponseSchema` schema.
- **New files**: `src/lib/schemas/api-key.schema.ts`, `src/lib/api/api-keys.ts`, `src/composables/useApiKeys.ts`
- **Verification**: `pnpm build` exit 0; `pnpm test:unit` 928/928 pass; `pnpm lint` clean

## Recent Activity (v0.10.13 — 2026-07-06)

### Remove dead MSW infrastructure from E2E tests

- **Why**: The project had two parallel mock systems — MSW browser worker handlers (never used at runtime) and `page.route()` helpers (the actual working system). `setupWorker` from `msw/browser` requires `navigator.serviceWorker` which only exists in a browser context; Playwright's test runner runs in Node.js, making MSW browser workers architecturally incompatible. The dead MSW infrastructure added confusion, maintenance burden, and an unnecessary dependency.
- **Industry standard**: Playwright's `page.route()` / `browserContext.route()` is the first-class, officially recommended API for E2E network mocking. MSW is designed for unit/integration tests (vitest/jest + JSDOM), not Playwright E2E.
- **Deleted files**:
  - `e2e/mocks/browser.ts` — lazy Proxy of `setupWorker()` that could never work in Playwright's Node context
  - `e2e/global-setup.ts` — Playwright `globalSetup` with no-op body
  - `public/mockServiceWorker.js` — generated Service Worker file with no consumer
- **Modified files**:
  - `playwright.config.ts` — removed `globalSetup: './e2e/global-setup.ts'`
  - `e2e/mocks/handlers/auth.ts` — removed MSW imports (`http`, `HttpResponse`), converted to pure API contract reference with typed response constants
  - `package.json` — removed `msw` devDependency + `msw.workerDirectory` config; version bumped to 0.10.13
  - `pnpm-workspace.yaml` — removed `allowBuilds.msw: false`
- **Kept unchanged**:
  - `e2e/fixtures/auth.ts` — canonical test data, used by auth-helpers
  - `e2e/utils/auth-helpers.ts` — the working `page.route()` mock system
  - `e2e/tsconfig.json` — `dom` lib still needed for `page.evaluate()` callbacks
- **Verification**: `pnpm type-check` clean; `tsc --noEmit -p e2e/tsconfig.json` clean; 18/18 auth specs pass (chromium, 12.2s)

## Recent Activity (v0.10.12 — 2026-07-06)

### E2E MSW wiring + spec refactor

- **Why**: The auth spec files (login / logout / protected-routes) carried 150+ lines of inline `page.route()` mock data, each spec re-declaring the same `TEST_USER` / `TEST_TOKENS` / `RestApiResponse` envelope. The MSW handlers in `e2e/mocks/handlers/auth.ts` and the worker in `e2e/mocks/browser.ts` were infrastructure-only — no spec was using them. This refactor threads shared fixtures through every auth spec via `e2e/utils/auth-helpers.ts` + `e2e/fixtures/auth.ts`, so all spec data shapes now align with the MSW handlers. Specs still use `page.route()` via the helpers — the helper body is a 1:1 swap once MSW interception is wired at runtime, and MSW remains infrastructure-only for now.
- **New files**:
  - `e2e/global-setup.ts` — Playwright `globalSetup` module. Imports the MSW worker from `e2e/mocks/browser.js` and returns a teardown closure. **The body is a no-op in Node** because `setupWorker` accesses `navigator.serviceWorker` (browser-only); the comment block documents the Node-vs-browser boundary and points readers at the per-spec `test.beforeAll` / `page.addInitScript` patterns that future work will use to actually start the worker.
  - `public/mockServiceWorker.js` — generated by `pnpm exec msw init public/ --save` so the Service Worker that MSW's browser worker registers can be served by the dev server.
- **Modified files**:
  - `playwright.config.ts` — added `globalSetup: './e2e/global-setup.ts'`. Comment block explains why the actual `worker.start()` lives in the browser, not in `globalSetup`.
  - `e2e/mocks/browser.ts` — the eager `const worker = setupWorker(...authHandlers)` was rewritten as a lazy `Proxy<SetupWorkerApi>` that defers the `setupWorker` call until first access. The eager form crashes with `Invariant Violation: [MSW] Failed to execute setupWorker in a non-browser environment` as soon as the module is loaded from Node (which happens for both `globalSetup` and the Playwright test runner that loads the spec). The proxy is the only way the same module can be imported from both Node and browser contexts.
  - `package.json` — `msw.workerDirectory: ['public']` written by `msw init --save`; version bumped `0.10.11 → 0.10.12`.
  - `e2e/auth/login.spec.ts` — replaced 3 inline mock-data blocks (PUBLIC_CONFIG_RESPONSE, LOGIN_SUCCESS_RESPONSE, USER_PROFILE_RESPONSE, AUTH_001_RESPONSE) with `okEnvelope(TEST_LOGIN_RESPONSE)` / `okEnvelope(TEST_USER_PROFILE)` from `e2e/utils/auth-helpers.js` and the canonical `INVALID_CREDENTIALS` / `TEST_USER_CREDENTIALS` / `STORAGE_KEYS` from `e2e/fixtures/auth.js`. The `page.evaluate(... localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))` reference is fixed to pass the key as an argument so it survives both `tsc --strict` and the `eslint-plugin-playwright/no-unsafe-references` rule.
  - `e2e/auth/logout.spec.ts` — replaced inline `TEST_USER` / `TEST_TOKENS` / `okEnvelope` / `STORAGE_KEYS` with imports from `e2e/fixtures/auth.js` and `e2e/utils/auth-helpers.js`. The `page.evaluate` calls in the `clears localStorage` and `isAuthenticated` tests now pass the storage key as an argument (was previously an `unsafe-reference` lint error and a runtime `ReferenceError: STORAGE_KEYS is not defined` in the browser).
  - `e2e/auth/protected-routes.spec.ts` — replaced inline `mockAuthApis` / `loginViaForm` / `nowIso` / `okEnvelope` with imports from `e2e/utils/auth-helpers.js`. Same `page.evaluate` fix for the storage-key lookup.
- **Tests added by parallel agent** (not in original spec list — kept per "DO NOT remove any test cases"):
  - `e2e/auth/guest-guard.spec.ts` — 2 tests covering `guestOnly` redirect for `/auth/login` and `/auth/register`
  - `protected-routes.spec.ts` — 1 extra test: "login → navigate to /auth/login → redirect to /dashboard (guest guard)"
  - `login.spec.ts` — 3 extra tests covering 429 rate-limit toast, network-drop toast, and `termsExpired=true` TermsDialog
- **Architectural decision — MSW interception at runtime is NOT yet active.** The MSW browser worker requires `navigator.serviceWorker`, which doesn't exist in Node (where Playwright's `globalSetup` and `test.beforeAll` run). Two paths to actually intercept at runtime:
  1. **Per-spec `test.beforeAll(async () => { await page.addInitScript(...) })`** — requires the worker setup to be served by the dev server (e.g. via `public/msw-init.js`), which means either moving the `e2e/mocks/` modules into Vite's source path or configuring Vite to serve `e2e/`.
  2. **Move MSW bootstrap to `src/`** — wrap `setupWorker` in a dedicated module that Vite bundles, gated by `import.meta.env.MODE === 'test'`, and call from `main.ts`. Same effect, fewer moving parts.
  Either is a follow-up. The current state (lazy proxy + globalSetup + SW file in `public/`) is the prerequisite for either path; the spec files use shared fixtures and `page.route()` (via the auth-helpers) so the data shape is already aligned with the MSW handlers — migrating the mocking layer later is a 1:1 swap of the helper body.
- **Verification**:
  - `pnpm type-check` (vue-tsc --build) → clean
  - `pnpm exec tsc --noEmit -p e2e/tsconfig.json` → clean
  - `pnpm exec vp lint e2e/` → 0 errors, 0 warnings (10 files, 214 rules)
  - `pnpm exec playwright test --project=chromium e2e/auth/` → **18 passed (8.9s)**, 0 failed, 0 flaky

## Recent Activity (v0.10.11 — 2026-07-06)

### MSW (Mock Service Worker) integration for E2E auth mocking

- **Why**: Future E2E specs will exercise full login/logout/protected-route flows. Page-level `page.route()` mocks are verbose and per-test; MSW handlers in `e2e/mocks/` give a single source of truth that can be composed and overridden.
- **New files**:
  - `e2e/mocks/handlers/auth.ts` — handlers for `/api/v1/auth/{login,refresh,logout-all,register,verify-email,resend-verification,forgot-password,password-reset/confirm}` and `GET /api/v1/users/me`. All return `RestApiResponse<T>` envelopes matching the Zod schemas in `src/lib/schemas/{api,auth,user}.schema.ts`. Login short-circuits with 401 AUTH_001 when `email === 'fail@example.com'`.
  - `e2e/mocks/browser.ts` — `setupWorker(...authHandlers)` exported as `worker` (singleton `SetupWorkerApi`).
  - `e2e/fixtures/auth.ts` — canonical `TEST_USER_ID`, `TEST_USER_EMAIL`, `TEST_USER_CREDENTIALS`, `INVALID_CREDENTIALS`, `TEST_LOGIN_RESPONSE`, `TEST_USER_PROFILE`, `TEST_EMPTY_RESPONSE` constants for reuse in upcoming spec files.
- **Modified files**:
  - `package.json` — `msw` added as devDependency (2.14.6)
  - `pnpm-lock.yaml` — regenerated
  - `pnpm-workspace.yaml` — `allowBuilds.msw: false` (the install prompt offered the choice; we decline since the browser worker script is generated on demand, not at install time)
  - `e2e/tsconfig.json` — added `"dom"` to `lib` so MSW's `HttpResponseInit extends ResponseInit` resolves (pre-existing auth spec files also benefit)
- **NOT changed**: `playwright.config.ts`, `package.json` scripts, `src/**` (per task constraints)
- **Verification**:
  - `tsc --noEmit -p e2e/tsconfig.json` — clean (exit 0)
  - `pnpm type-check` (vue-tsc --build) — clean (exit 0)
  - `pnpm exec playwright test --project=chromium e2e/vue.spec.ts` — fails on the existing `visits the app root url` assertion (h1 = "Welcome back" instead of expected "Home"). Verified by `git stash` that this failure is **pre-existing on develop** (the app routes `/` to `/auth/login` for unauthenticated visitors; the test was authored before the router guard was tightened). MSW integration did not introduce or worsen the failure.

## Recent Activity (v0.10.10 — 2026-07-06)

### OAuth sessionStorage redirect + test coverage

- **Why**: Verification report found 3 gaps: sessionStorage redirect storage missing, OAuthCallbackView tests missing, OAuthErrorView tests missing
- **Changes**:
  - `src/features/auth/views/LoginView.vue` — store `route.query.redirect` in sessionStorage before GitHub redirect
  - `src/features/auth/views/OAuthCallbackView.vue` — read redirect from sessionStorage as fallback, clean up after reading
  - `src/features/auth/views/__tests__/OAuthCallbackView.test.ts` — 15 tests: happy path, missing tokens, termsExpired, safe/unsafe redirect, URL cleanup
  - `src/features/auth/views/__tests__/OAuthErrorView.test.ts` — 10 tests: error code mapping, button navigation, fallback messages
- **Verification**: `pnpm type-check` clean; full suite 928/928 pass

## Recent Activity (v0.10.9 — 2026-07-05)

### AccountSection reads `hasPassword` from auth store (deprecate usePasswordDetection composable)

- **Why**: `usePasswordDetection` composable called the **write endpoint** `setPassword('')` to detect password status. Even after v0.10.5 removed the auto-mount call, the composable itself was an anti-pattern (write side-effects just to read state).
- **Backend contract**: `GET /api/v1/users/me` now returns `hasPassword: boolean`. The auth store already exposes it as `hasPassword: Ref<boolean>` (default `false`), set from `fetchUserProfile()`.
- **Changes**:
  - `src/features/settings/components/AccountSection.vue` — read `authStore.hasPassword` directly; removed `usePasswordDetection` import + destructuring; simplified `handleOpenSetPasswordDialog()` to just open the dialog (no lazy check, no `toast.info` branch); removed `handleSetPasswordSuccess` handler + `@success` listener (state now flows from API); removed now-unused `vue-sonner` import
  - `src/features/settings/composables/usePasswordDetection.ts` — added `@deprecated` JSDoc pointing to `authStore.hasPassword`. Function body unchanged (still used by its own tests; removal deferred to a separate cleanup pass)
  - `src/features/settings/components/__tests__/AccountSection.test.ts` — removed `usePasswordDetection` mock + `hasPasswordValue`/`isPasswordCheckingValue` mutable vars; added `authStoreHasPassword` mutable + threaded into the `useAuthStore` mock; removed two obsolete tests (`hasPassword is null` initial-state test, `isPasswordChecking=true` loading-state test); kept `vue-sonner` and `SetPasswordDialog` mocks
- **Files changed**:
  - `src/features/settings/components/AccountSection.vue`
  - `src/features/settings/composables/usePasswordDetection.ts`
  - `src/features/settings/components/__tests__/AccountSection.test.ts`
  - `package.json` — version 0.10.8 → 0.10.9
  - `pnpm type-check` clean; full suite 902/902 pass

### Code review follow-up: fix SetPasswordDialog @success regression

- **Issue**: v0.10.9 removed `@success="handleSetPasswordSuccess"` listener from SetPasswordDialog, but didn't provide an alternative. After OAuth user sets password, `authStore.hasPassword` stays `false` because nothing triggers `fetchUserProfile()`.
- **Fix**: Re-added `@success="handleSetPasswordSuccess"` listener that calls `void authStore.fetchUserProfile()` to refresh profile including `hasPassword`.
- **File**: `src/features/settings/components/AccountSection.vue` — added `handleSetPasswordSuccess()` handler + `@success` listener on SetPasswordDialog
- **Verification**: type-check clean, AccountSection tests 26/26 pass

### Code review follow-up: JSDoc and comment fixes

- **Fix 1**: `src/lib/schemas/user.schema.ts` — reordered JSDoc and Zod schema fields to match backend DTO order: `emailChangePending, hasPassword, createdAt, lastLoginAt, termsVersion` (was: `createdAt, lastLoginAt, termsVersion, emailChangePending, hasPassword`)
- **Fix 2**: `src/stores/auth.ts` — added `hasPassword` to the profile fields group comment (lines 107-113)
- **Verification**: type-check clean

### Code review follow-up: 4 test fixes for v0.10.9 hasPassword coverage

- **Why**: Reviewer flagged gaps in v0.10.9's hasPassword test coverage (the field was newly added to `UserProfileSchema` and `authStore`).
- **Fixes** (all test-only, no production code changes):
  1. `src/stores/__tests__/auth.test.ts` — added `expect(store.hasPassword).toBe(true)` to the existing "populates displayName, email, emailVerified, lastLoginAt on success" test (the mock already had `hasPassword: true`, but the assertion was missing).
  2. `src/lib/schemas/__tests__/user.schema.test.ts` — added a parallel type-rejection test for `hasPassword: 'true'` mirroring the existing emailVerified type-rejection test at line 199. Schema enforces `z.boolean()` so this must fail.
  3. `src/features/settings/components/__tests__/AccountSection.test.ts` — added `hasPassword: false` to the "shows dash when display name is null" `mockReturnValueOnce` payload (was missing the field; component now reads `authStore.hasPassword`).
  4. `src/features/settings/components/__tests__/AccountSection.test.ts` — removed orphaned `vi.mock('vue-sonner', ...)` block. The v0.10.9 AccountSection refactor dropped the `vue-sonner` import, so the mock was dead code.
- **Verification**: `pnpm test:unit --run` → 903/903 pass (was 902; +1 from the new hasPassword schema test)
- **Files changed**: 3 test files (no production code touched)

## Recent Activity (v0.10.8 — 2026-07-05)

### Password button label: Set Password → Change Password

- **Issue**: "Set Password" label shown even for users who registered with email/password (should only show for OAuth users without password)
- **Fix**: Button now always visible; label dynamically changes based on `hasPassword` state:
  - `null` (unknown) or `false` (no password): "Set Password"
  - `true` (has password): "Change Password"
- **Files changed**:
  - `src/features/settings/components/AccountSection.vue` — added `passwordButtonLabel` computed property, removed `v-if` condition on password button
  - `package.json` — version 0.10.7 → 0.10.8

## Recent Activity (v0.10.7 — 2026-07-05)

### Tab title unified to "Code Time Tracker"

- **Change**: Browser tab title suffix changed from `- CTT` to `- Code Time Tracker` for consistency
- **Files changed**:
  - `src/router/guard.ts` — `document.title = `${title} - Code Time Tracker``
  - `src/router/__tests__/guard.test.ts` — updated test assertions to match new suffix
  - `package.json` — version 0.10.6 → 0.10.7

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
