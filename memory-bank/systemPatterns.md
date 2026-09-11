# System Patterns: ctt-web

## Component Architecture

- Files: `PascalCase.vue` (components), `use`camelCase.ts` (composables), `kebab-case.schema.ts` (schemas); all code English, no Chinese/emoji
- Always `<script setup lang="ts">`; Props via `defineProps<{...}>()`, Emits via `defineEmits<{...}>()`, two-way via `defineModel`; Options API forbidden
- Headless UI via Radix Vue (reka-ui); styling via Tailwind; route views wrapped in ErrorBoundary
- Shadcn-vue components in `src/components/ui/` may be edited; no other UI libraries (AGENTS.md R9)

## State Management Layers

```
Server State → TanStack Query (stats/sessions/leaderboard/devices)
URL State    → vue-router SearchParams (date range, filters, pagination)
Global Store → Pinia (auth: JWT/user/expiry; theme: dark/light persisted)
```

- Never store API responses in Pinia; single HTTP boundary is `lib/api/` ofetch instance

## API Layer Pattern

```typescript
// lib/api/stats.ts — every response parsed through a Zod schema
export const fetchStats = (params: StatsParams) =>
  apiFetch('/api/v1/stats', { query: params }).then((r) => PagedResponseSchema(CodingSessionSchema).parse(r))
```

- All API types = Zod schemas in `lib/schemas/` aligned with ctt-server DTOs; runtime `.parse()` at network boundary
- Backend nullable fields MUST use `.nullable().default(null)` (ctt-server Jackson NON_NULL omits nulls → undefined)
- Error codes via `error.data.code` (never `error.error`); `mutationFn` signatures drive TanStack `TVariables` — literal discriminators need explicit annotation (e.g. `(_action: 'bind') => ...`), no-arg → 0-arg form

## Error Handling

- ErrorBoundary: `onErrorCaptured` → fallback UI + retry, dev-only details, no white-screen
- Query views: `<ErrorState v-if="isError"> <LoadingState v-else-if="isPending"> <template v-else>`; first-load skeleton ≥300ms anti-flicker (ApiKeysView precedent)

## Composable Mutation Return Shape (v0.18.1)

- Mutation composables return `{ mutation }` (e.g. `useRevokeApiKey`, `useRevokeDevice`) — call `mutation.mutate(...)`. Do NOT return the raw `useMutation(...)`; the wrapped shape is the project convention (v0.18.1 unified useRevokeDevice after drift was caught by a new test).

## Value Formatters

A formatter is **shared infrastructure, not a panel helper** — so it lives in `src/lib/utils/`
and is imported through the barrel (`@/lib/utils`), never co-located with the components that
happen to call it first.

| Formatter                                        | Home                        |
| ------------------------------------------------ | --------------------------- |
| `formatRelativeTime`, `formatDateTime`, `formatDuration` | `src/lib/utils/time.ts`     |
| `formatPercent`                                  | `src/lib/utils/percent.ts`  |

- **Do NOT inline per-view formatters.** `formatDuration` was unified this way in v0.18.0
  (`DeviceListView` + `ApiKeysView`); `formatPercent` was misplaced under
  `features/dashboard/components/` when first written and moved to `lib/utils/` in v0.35.0 for the
  same reason — same kind of thing as `formatDuration`, so it belongs in the same place.
- A formatter's *rules* may still come from a domain (percent precision follows
  `dashboard-visualization` P8); the *file* does not.
- No dayjs (R12); the hand-rolled formatters cover all cases.
- vue-tsc gotcha (v0.18.0): template inline arrow functions bound to a function-typed prop (e.g. `:success-description="(name) => ..."`) lose contextual typing when the component imports a helper that moves out of the SFC — annotate the param explicitly `(name: string)` to silence TS7006.

## Router Architecture

```
src/router/ index.ts (core) + guard.ts (auth + NProgress) + modules/ (auth|dashboard|devices|leaderboard|settings)
```

- Route meta: `{ title, requiresAuth?, roles?, layout?, hideInMenu? }`; layouts via `meta.layout` (auth/app)
- Auto-import modules via `import.meta.glob('./modules/*.ts', { eager: true })`
- Lazy loading all views; `manualChunks`: vendor/feature-auth/feature-dashboard/feature-settings
- Stale chunk auto-reload: `router.onError` + `?retried=1` query guard against reload loops
- `isPathActive(path)` exact-match helper for sidebar active state (prefix bleed across /settings siblings)

## Test File Naming

Test files mirror the source file they exercise — `<source-name>.test.ts` in a sibling
`__tests__/` directory:

| Source           | Test                                                   |
| ---------------- | ------------------------------------------------------ |
| `Foo.vue`        | `Foo.test.ts` (PascalCase, matching the component)     |
| `foo.ts` (helper)| `foo.test.ts` (the module's own kebab-case name)       |
| `useFoo.ts`      | `useFoo.test.ts` (the composable's own camelCase name) |

When one source needs more than one suite, split by **aspect**: `<Name>.<aspect>.test.ts`
(`CreateApiKeyDialog.form.test.ts`, `RawKeyDialog.a11y.test.ts`,
`RegisterForm.terms.test.ts`, `user.password.test.ts`). Name it after the source plus the
aspect — never after a concept that has no file of its own (`TermsCheckbox.test.ts` named a
component that did not exist; it was `RegisterForm.terms.test.ts`).

A test file with no corresponding subject is a smell: either the subject moved (rename the file)
or the test is a placeholder (delete it).

A directory that holds both components and helper modules therefore shows **both cases** — e.g.
`features/dashboard/components/__tests__/` has `TimeOfDayPanel.test.ts` next to
`heatmap-window.test.ts`. That is the rule working, not drift: the case tells you what kind of
subject the test covers. Repo-wide the split tracks file kinds (≈39 `.vue` → Pascal, ≈43 `.ts` →
lowercase). Do not "unify" it by renaming — that breaks find-by-source-name for ~39 files.
If a folder's mixed appearance is the real complaint, the fix is to relocate a misplaced file
(see Value Formatters above), not to restyle the names.

## Tailwind scans comments (class-like tokens become real CSS)

Tailwind v4 scans **raw source text**, comments included: a utility name written in a comment is
emitted into the production bundle. *Verified* — a comment naming the canonical form of a
max-height produced a dead rule in `dist/assets/*.css`; rewording it (prose "step 57" instead of
the class-shaped token) removed the rule and changed the CSS hash.

When explaining why a utility was declined, describe it in prose rather than quoting the class.
When auditing built CSS, `rm -rf dist` first — the build does not always purge stale chunks.

## Forbidden Patterns

- ❌ `v-html` without sanitization, `any`, Options API, `console.log`, hardcoded strings (i18n), direct `ofetch` in components, `error.error` (use `error.data.code`), outer shadows for buttons in dark mode
- ❌ `@vue-ignore` on `defineProps<Type>()` with circular type imports — Rolldown silently drops the whole props declaration (v0.15.4 sidebar-on-right incident)

## Button Variant System (Linear-style)

| Variant | Purpose | Visual |
| ------- | ------- | ------ |
| `primary` | Brand CTA (submit/confirm) | `bg-[#5e6ad2]` indigo |
| `secondary` | Container actions (cancel) | `bg-secondary` |
| `ghost` | Secondary CTAs, toolbar | Invisible default; hover 1px inset shadow edge highlight (`transition-all duration-200`, light `rgba(0,0,0,0.1)` / dark `rgba(255,255,255,0.08)`) |
| `default` | Minimal text-only | No bg/border |

## E2E API Mocking (page.route)

- Playwright `page.route()` (MSW browser worker is architecturally incompatible with Playwright's Node runner — removed v0.10.13)
- All mocks use `RestApiResponse<T>` envelope matching `RestApiResponseSchema`; canonical fixtures in `e2e/fixtures/auth.ts`; contract reference in `e2e/mocks/handlers/auth.ts`
- `e2e/tsconfig.json`: `"dom"` lib (page.evaluate), `nodenext` resolution (explicit `.js` imports)

## API Key View Pattern (v0.11.0)

- Four-state query view: skeleton → error (Retry) → empty (CTA) → GitHub PAT-style table
- Columns: Name | Key Prefix (mono) | Scopes (Badge) | Status (Badge: ACTIVE green / EXPIRED outline / REVOKED destructive) | Last Used | Created | Expires (italic "Never") | Actions
- Custom Tailwind table (no shadcn Table); `formatRelativeTime()` handles past + future; `break-all` on all key-name displays (long-name overflow fix v0.16.11)

## One-Time Secret Dialog Pattern (v0.12.0)

RawKeyDialog is hard to dismiss (raw key unrecoverable): overlay/Escape/X blocked (`@pointer-down-outside.prevent`, `@escape-key-down.prevent`, `show-close-button=false`); close gated on copy success (`hasCopied`); three-tier clipboard fallback (`navigator.clipboard` → execCommand → manual hint); `role="alertdialog"`; raw key held only in component ref, never persisted

## Create Form Dialog Pattern (v0.12.0+)

- vee-validate `useForm` + `toTypedSchema`(Zod) — request schema doubles as form schema
- Array field (`scopes`) driven via `form.values` + `form.setFieldValue`; mode toggles are local refs, not form fields
- Custom date: native `<input type="date">` as end-of-local-day (`T23:59:59` → ISO); click anywhere opens picker via `showPicker()` + mousedown `preventDefault` suppresses segment selection; focus styling faked via ref (Chrome auto-selects first segment on real focus; segment highlight is UA-internal, CSS cannot hide it — v0.16.15)
- **v0.16.13 lesson**: reka-ui Checkbox controlled API is `modelValue` + `update:modelValue` (NOT `checked`/`update:checked` — old listener never fires); checkbox must be wrapped in `<FormField name="scopes">` or payload falls back to initialValues
- **v0.16.16 lesson**: vee-validate 4 unregisters a field when its FormField unmounts (default `unregister: true`) → `form.values.<field>` becomes `undefined`. Any v-if-gated FormField whose value is read at render time (e.g. `values.scopes.length` in `:disabled`) needs `keepValuesOnUnmount: true` on useForm, or a defensive `?? []` / `|| ''` guard (EmailChangeDialog password precedent)
- 409 AUTH_014 renders inline banner without resetting form; other errors toast via `getErrorMessage`; FormMessage always renders its min-h wrapper (layout-shift-proof, v0.16.8-10)

## Email Change Patterns (v0.9.0)

- Shared dialog state via module-level `ref` in composable (not Pinia) — all consumers share one `isDialogOpen`
- Dynamic password field: `USER_013` error → `requiresPassword = true` → schema includes password via `.optional()` + `.refine()` when required
- Verification flow: change-request (+password) → email token → change-confirm; states unverified/pending/verified; atomic (old email active until confirm)

## Discriminated API Endpoints

`mutationFn` signature drives `TVariables`: literal discriminator → 1-arg literal form; structured payload → 1-arg payload form; no args → 0-arg form. Without literal annotation TS infers `undefined` and `mutate('bind')` fails type-check.

## Distribution Semantics

The conservation-vs-accumulation ruling (time-axis must equal `summary.total`; categorical
necessarily exceeds it) lives in one place only:
**[`domains/backend-contract/principles.md`](./domains/backend-contract/principles.md) P2**.
