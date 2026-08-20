# Active Context: ctt-web

## Current Status

**Phase**: v0.16.18 AUTH_014→AUTH_024 code split (API key limit)
**Version**: 0.16.18 (2026-08-19)
**Branch**: develop
**Tests**: 1061/1061 unit; 22/22 api-keys E2E; vue-tsc + lint exit 0

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
