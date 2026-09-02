# Active Context: ctt-web

## Current Status

**Phase**: 30-day trend chart (pending commit)
**Version**: 0.23.0 (2026-09-02)
**Branch**: develop
**Tests**: 1203/1203 unit; vue-tsc + lint 0 error 0 warning; build green

## Recent Activity (v0.23.0 — 2026-09-02)

### TrendChart: 30-day coding activity trend (placeholder → live chart)

- **Component** (`features/dashboard/components/TrendChart.vue`): ECharts smooth line (smooth 0.4) + gradient stroke + vertical linear-gradient area — single brand-indigo family by DESIGN.md, deliberately NOT the plugin's blue→green two-hue ramp.
- **Data**: reuses the existing `heatmap30` query (same HeatmapResponse contract, zero new endpoint); filter-independent window (last 30 days computed in DashboardHome) — mirror of the plugin panel's behavior.
- **Line gradient v3-final (user feedback round 4 — "top/bottom contrast not obvious enough")**: palette widened — dark `lineTop #b9c1ff` / `lineBottom #4a53b8`, light `#8a97f2` / `#3d49ad`, midstop `#8290f0`; channel delta up ~55% in light mode (50→77), dark verified by pixel sample (top rgb(137,150,242) vs bottom rgb(64,77,176)). Still DESIGN.md indigo family — spread widened within the hue, no new hue introduced.
- **echarts-setup**: +LineChart + GraphicComponent registrations (both tree-shaken; GraphicComponent omission caused the silent no-op above).
- **Tests**: +5 TrendChart component cases (init-once/setOption-on-change, equidistant-scale + split-line ramp assertions, dense-series mapping, a11y window label, dispose). Gotcha: `vi.mock` factories are hoisted — mocks referenced inside must come from `vi.hoisted` (test went through 3 iterations to land the shape).
- **Browser-verified final** (real backend, 1h peaks): gridlines `0 → 1.25 h` equidistant with visible bottom→top indigo fade (hue + alpha) in BOTH themes via real Appearance menu; peak plateau sits below the 1h line. Full suite 1203/1203, lint/tc/build green. Version 0.22.1 → 0.23.0 (MINOR, new chart).

## Recent Activity (v0.22.1 — 2026-09-02)

### Heatmap bucket recalibration (user direction)

- **Buckets**: `<5min / 5–15min / 15–60min / 1–3h / 3–6h / >6h` (plugin parity) → `<15min / 15–60min / 1–2h / 2–5h / 5–8h / >8h`. Rationale (user proposal + my 15m lower-bound tweak): old low-end was too fine (5m vs 15m days look identical on a year grid) while the 1–8h core where most days fall was coarse. Precision moved from the edges to the middle. LEGEND_LABELS + BUCKETS + component JSDoc updated together; plugin panel intentionally unchanged (parity break documented).
- **Boundary probe** (node, 10 edge cases): 15m→idx0, 15m+1s→idx1, 1h→idx1, 1h+1s→idx2, 2h→idx2, 3h→idx3, 5h→idx3, 8h→idx4, 8h+1s→idx5 — bucketIndex semantics (`seconds > bound` increments) preserved.
- **Browser-verified** (real backend): legend renders the 6 new labels; the seeded 1h days fill with bucket-1 color (#b7bfec, canvas pixel-sampled); light + dark themes both confirmed via real Appearance menu. Full suite 1197/1197, lint/tc/build green. Version 0.22.0 → 0.22.1 (visual calibration → PATCH).

## Recent Activity (v0.22.0 — 2026-09-02)

### Heatmap year selector (backend ctt-server v0.61.0 `GET /api/v1/stats/heatmap-years`)

- **Contract (R13, verified from StatsController/StatsService source)**: `heatmap-years` returns `List<Integer>` newest-first, derived from valid sessions (`start_time < end_time`, same aggregation rule as heatmap — listed years always render non-empty), empty user `[]`, JWT/READ 60/min. `data: [2026,2025,2024]` live-probed with a bootstrapped account (12 sessions across 2024/2025/2026 via device-register + sync/push).
- **Contract layer**: `HeatmapYearsResponseSchema = z.array(z.number().int())` (stats.schema.ts); `getStatsHeatmapYears()` (stats.ts, mirrors ide-filters two-step parse); `STATS_QUERY_KEYS.heatmapYears()` + `useStatsHeatmapYears()` (60s staleTime, server-cache aligned).
- **Design correction (user, same round)**: the heatmap's time axis is owned EXCLUSIVELY by the year selector — "Last 12 months" is a FIXED rolling window (366-day trailing span computed in DashboardHome), NOT the filter-bar range. Period (start/end) drives summary cards + all other panels only. Verified: switching Period (90d/This year) leaves `?year=` and the heatmap aria untouched; picking a year coexists with any Period range (`?year=2025&start=…&end=…`).
- **UI**: new `HeatmapYearSelect.vue` (Select with fixed "Last 12 months" item mapping null↔'rolling'); `ChartSection` gains optional `actions` header slot (hidden on loading/error/empty); DashboardHome `heatmapRange` computed = rolling 366-day span (no year) or `Y-01-01..Y-12-31` (year picked) + `windowLabel` prop for a11y.
- **Render-window root-cause fix (new `heatmap-window.ts` pure helpers, 9 unit tests)**: old `slice(-365)` dropped Jan 1 of leap years (366-point years) and the hard `WEEKS=53` would clip a 54-column grid (leap year starting Sunday, e.g. 2012: backfill → 372 days). Now: `heatmapRenderWindow` trims trailing 366-day span (short spans untouched), `countWeekColumns` derives columns from the real date span (geometry floors at 53 so partial windows still fill a GitHub grid). Verified live: 2024 = 366 days / 2025 = 365 days, both full Jan–Dec grids.
- **Browser-verified** (headless CDP instance, real backend): selector lists [Last 12 months, 2026, 2025, 2024]; pick 2024 → `?year=2024` + aria "Coding heatmap for 2024, 366 days from 2024-01-01 to 2024-12-31"; reload restores; 2025 ↔ default switch clears URL; light + dark palettes correct (dark verified through the real Appearance submenu). NOTE: headless hCaptcha widget does not auto-pass — login done via scripted API + localStorage token injection (initializeAuth validates via refresh endpoint; UI captcha untestable headless).
- **Pre-existing quirk documented**: App.vue:56 `setTheme('auto')` on every mount stomps a persisted dark preference on reload (theme resets to System each boot) — pre-existing, not touched this round.
- Tests 1181→1197 (+16: 9 heatmap-window, 3 getStatsHeatmapYears, 1 useStatsHeatmapYears, 3 useDashboardFilters year). type-check/lint/build green. Version 0.21.0 → 0.22.0 (MINOR, new feature).

## Recent Activity (v0.20.0 — 2026-09-01)

### Dashboard D2: dashboard framework + useDashboardFilters

- **useDashboardFilters** (`src/features/dashboard/composables/useDashboardFilters.ts`): URL SearchParams is the single source of truth (start/end/deviceId). `formatDate` local yyyy-MM-dd (matches backend LocalDate); `resolvePresetRange` (month / 90d / year); `inferPreset` derives preset from range (no params → 'year', matching server default); setters use `router.replace` (no history spam). 14 tests.
- **useStats upgrade (required for D2)**: D1 composables were static-param; upgraded all 7 to `MaybeRefOrGetter` with `queryKey: computed(...)` + `toValue` — reactive params (e.g. computed deviceId/range) now re-key the query and drive refetch. useStats.test.ts 8 cases (reactive re-key, staleTime 60s/30s, distribution type keys).
- **DashboardHome** (`src/features/dashboard/views/DashboardHome.vue`): filter bar + summary cards + heatmap (full width) + trend/language two-column grid. **DashboardFilters.vue** (period preset Select + device Select from useDevices + custom date inputs), **SummaryCards.vue** (today/week/month/total via useStatsSummary + formatDuration), **ChartSection.vue** (loading/error/empty states, retry).
- **formatDuration** added to lib/utils/time.ts (seconds → "2h 15m" / "2d 3h"), barrel-exported.
- **Real-backend verified**: dashboard renders, default preset This year; URL ?start=&end= restores custom range + inputs; heatmap request carries timezoneOffset+start+end from the filter chain. Screenshot ~/Pictures/screenshots/v0.20.0-dashboard-framework.png.
- Tests: 1179/1179 unit (71 files, +37) + 50/50 E2E (chromium). type-check / lint / build clean.
- E2E vue.spec.ts smoke test was stale (template artifact): unauthenticated `/` redirects to login ("Welcome back"), so the "Home" assertion never held. Fixed to log in first (mockAuthApis + loginViaForm) then assert HomeView — matches the project's auth E2E pattern.
- Version 0.19.0 → 0.20.0 (new feature → MINOR).

### Review fixes (post code-review, same v0.20.0)

- **Custom preset reachable from UI** (Spec gap): selecting "Custom range" was a no-op (inputs only appeared when the URL already encoded a non-preset range). DashboardFilters now keeps a local `customMode` ref; picking Custom reveals the date inputs and shows "Custom range" in the select (selectValue derived), without touching the URL until a range is entered. URL remains the only durable state.
- **Trend panel empty state**: was hardcoded `false`; now mirrors the heatmap data (trend is an aggregation view of the same daily points).
- **Dead code**: ChartSection error-branch Loader2 removed (loading is always false there); SummaryCards retry button was unreachable (isError was lumped into the skeleton branch) — error state now renders a "Failed to load — retry" action; retry path tested.
- **Consistency**: raw `<input type=date>` replaced with ui/Input (matches CreateApiKeyDialog tokens); DashboardHome onRangeChange Middle Man inlined to `@update:range="setDateRange"`; DashboardFilters `presetValue` computed dropped (bind preset directly); formatDuration omits zero parts ("2h" not "2h 0m", "1d" not "1d 0h").
- New component tests: SummaryCards (3) + DashboardFilters (4) cover the review-fixed contracts; browser-verified Custom select → inputs → preset switch → URL sync end-to-end.
- Language distribution intentionally does not respond to the date range: backend distribution endpoint accepts no start/end (contract constraint, verified against StatsController).

### Acceptance feedback fixes (user, same v0.20.0)

- **Default preset = All time** (was This year, to match the plugin panel): URL stays clean (no params) in the default view; the heatmap query resolves an explicit range (`start=2000-01-01` ALL_TIME_START → today) so it no longer rides the backend's this-year default. New `'all'` preset: `applyPreset('all')` clears start/end params; `inferPreset` maps no params and the explicit all-range back to 'all'. Select gains an "All time" item.
- **Summary cards completed to six fields** (plugin parity): added Daily avg (dailyAverage) and This year (thisYear) — both already in the D1 schema; grid 4-col → 3-col (2×3).
- Browser-verified: default All time with explicit heatmap range; This year ↔ All time switch writes/clears URL params; 6 cards render. Tests: 1180/1180 unit (+1), dashboard 26/26.
- **Summary card grid responsive** (user feedback): 6 cards in one row on wide screens (xl:grid-cols-6), 3-col at md, 2-col small — not fixed 2×3.

### Panel parity (user acceptance round 2, same v0.20.0)

- **All plugin-panel dimensions mounted as placeholder panels** (user direction: mount the panels, no content yet — plain-text stat lists were rejected as ugly): every panel is ChartSection (three states) wired to its query with the chart mount point reserved as an empty placeholder. Panels: Coding heatmap (filter range) / Coding trend last-30-days (own heatmap query, filter-independent) / Language / Yearly activity / Coding streaks / Project / Time of day / IDE distributions / Average hourly / Weekday. New components: DistributionPanel (generic, 1:1 to DistributionType), StreaksPanel, HourlyPanel — each query-wired, placeholder body.
- Backend verified: distribution supports LANGUAGES/PROJECTS/TIME_OF_DAY/WEEKDAY/DEVICES/IDES; hourly returns points + activeDays. Browser-verified all 10 panels render with correct endpoints fired.
- **IDE as a filter is NOT possible** (contract): stats endpoints only accept deviceId; IDE attribution derives from the device registry (devices.ide_name, one deviceId per machine install). IDE works only as a distribution dimension. Requirement text for backend IDE filtering drafted for the user to relay (see .omp/ide-filter-requirement.md).

### IDE filter wired end-to-end (backend v0.60.0 delivered, same v0.20.0)

- Backend shipped `ideName` on all 6 filterable stats endpoints + `GET /api/v1/stats/ide-filters` (distinct non-empty ide_name, alphabetical, includes revoked devices, mutual exclusion 400 COMMON_003 with deviceId, unregistered names 404 COMMON_002). Contract verified against StatsController source before wiring (R13).
- **API layer** (`lib/api/stats.ts`): `StatsFilterParams` (deviceId/ideName) + shared `filterQuery` across the 6 endpoints; new `getStatsIdeFilters` (z.array(z.string())).
- **Composables** (`useStats.ts`): `STATS_QUERY_KEYS` take the filter object via `filterKey()` (deviceId ?? ideName ?? 'all'); all 7 composables accept `StatsFilterParams`; new `useStatsIdeFilters` (60s staleTime).
- **URL state** (`useDashboardFilters`): `?ideName=` computed + `setIde()`; setDevice/setIde clear the other param (UI-level exclusivity ahead of the backend 400). Returned set grows: `ideName, setIde`.
- **Filter bar**: third Select "IDE" fed by useStatsIdeFilters; emits `update:ide`. **All 10 panels** wired with `:ide-name` through `originFilter` computed.
- Browser-verified closed loop (real backend, seeded device + 1h session): IDE dropdown lists registered names; picking IDE writes `?ideName=IntelliJ+IDEA`, heatmap carries `&ideName=`, summary 3600s filtered; picking Device clears ideName (and vice versa); dashboard 6 cards show 1h under both filters. Tests 1181/1181 (+1 IDE select mapping), type-check/lint/build green.

### Summary card visual design (user feedback: "too plain", same v0.20.0)

- Redesigned SummaryCards per DESIGN.md (Linear-inspired): uppercase tracked labels (11px medium), per-metric Lucide icon (primary tint for Today/Total accents, muted otherwise), 2xl semibold tracking-tight tabular-nums value, translucent gradient card surface (from-card to-card/60) with hairline border + hover border lift, and a short primary/40 accent underline on Today/Total. Both light and dark themes verified via screenshots (~/Pictures/screenshots/v0.20.0-summary-cards-{light,dark}.png). Retry-on-error behavior unchanged; tests 27/27 dashboard, lint/type-check/build green.

### Summary cards carry Lieflat micro charts (user: "still plain", same v0.20.0)

- Per lieflat-charts skill audit (3+ candidates): Tick Gauge rejected (no 0-100% goal semantics), full Calendar Heat/Dot Heat don't fit card size; landed on **B3 hairline-area micro variant** (basics-gallery skeleton: calendar floor + per-day hairline + peak emphasis) embedded at each card's bottom edge, and a **C6 dot-heat one-row variant** (1 dot = 1 hour, dot area = that hour's average) on Today. Data: heatmap slices per window (30/7/30/365/365 days) + hourly series; queries already existed in DashboardHome scope, now lifted into SummaryCards (deviceId + ideName props threaded).
- Color: custom single-hue indigo system derived from the project's `--primary` (#5e6ad2) per skill rule 6.5 (user brand color → custom palette, mono token structure unchanged); hairline opacity floors kept. Charts are context for the headline number — value stays the hero.
- Seeded multi-day sessions to verify chart shapes render (spike/valley visible in week/month/year cards). Tests updated (mocks for heatmap/hourly, ideName prop); 1181/1181, lint/type-check/build green. Screenshots: v0.20.0-summary-cards-micro-{light,dark}.png.
- **Micro charts REVERTED** (user: the chart-laden cards looked busier and worse than the clean version — user judgement wins): SummaryCards back to the typographic design (uppercase label + icon + big tabular value + accent underline + hover border); heatmap/hourly queries stay in DashboardHome, not the cards. Final screenshot: v0.20.0-summary-cards-final.png. Full suite green (1181/1181).
- **Final polish pass** (last iteration, user approved direction "简单好看"): value bumped to 26px leading-none, gradient card surface (from-card to-muted/40) + hover shadow, accent underline moved inline next to the value (Today/Total only), label opacity tuned to /90. Screenshots: v0.20.0-summary-cards-polished-{light,dark}.png. All 1181 tests green.

### Final review round (two-axis, same v0.20.0)

- **Accent underline removed** (user: the bare line on Today/Total was confusing) — icon-only tint remains on those two cards; accent flag deleted.
- **README R4 sync**: Stats Dashboard row added to Implemented Features. **progress.md** v0.20.0 entry rewritten (was stale at 1172/D2-only) + Dashboard milestone flipped to Complete 0.20.0.
- **StreaksPanel empty state wired**: 0/0 streaks = empty (backend resolves both fields, never undefined).
- **Yearly panel retitled** "Activity heatmap (selected range)" — it mirrors the filter-range query; the fixed-year title could misrepresent a 90d/custom selection.
- **Shared filter projection**: originFilter/deviceIdOrNull/ideNameOrNull moved into useDashboardFilters (was duplicated verbatim in DashboardHome + 4 panels); deviceId/ideName now surface as null-able.
- **JSDoc**: params.ideName added to all 6 endpoint docs. **Dead Loader2 mock** removed from ChartSection.test.
- Deliberately NOT done (judgement): API-level ideName test cases (contract is a 1-line query spread, covered end-to-end by browser verification; D1's 14-case suite covered the schema wiring this builds on); the unsound `as Exclude<...>` cast in DashboardFilters is guarded by the fixed SelectItem value set.
- Full suite: 1181/1181 unit + 50/50 E2E, lint/type-check/build green.

### D4: heatmap chart implemented (v0.21.0, in progress — pending commit)

- **HeatmapChart.vue** (`features/dashboard/components/`): GitHub-style calendar heatmap. ECharts 6 tree-shaken via `src/components/charts/echarts-setup.ts` (core + CanvasRenderer + HeatmapChart + Calendar + Tooltip + VisualMap, `echarts/renderers` export path). Square cells sized from live container width (`floor(usable/53)` clamped 7–16), chart height derived from cell size (no fixed h-*, no dead space). Palette from theme store (isDark watch → setOption update, never re-init → no flicker); tooltip = weekday + date + formatDuration; zero days render as visible quiet cells (#31343a dark / #e4e6e8 light) with 1px card-bg gaps and 3px radius.
- **Rolling 12-month render window**: All time = 14 years → calendar squeeze made cells invisible (first browser pass showed a thin band). Render trims to the trailing 366 days; full range stays queryable via date filter. No horizontal scrollbar (user rejected scroll approach).
- **Duplicate panel removed**: the placeholder-era "Activity heatmap (selected range)" mirrored the primary heatmap with the same query — deleted (live chart made the mirror visibly redundant); panels rebalanced to 2-col rows (streaks+hourly, project+time, IDE+weekday).
- **Layout fixes**: ChartSection gets `min-w-0`; heatmap wrapper `w-0 min-w-full overflow-x-auto` pattern was rejected with the scroll approach → final: content-height chart, no overflow needed. Placeholder panels centered in `min-h-36` so rows look intentional next to the heatmap card.
- **Chunk**: vite.config codeSplitting adds `vendor-echarts` group (echarts+zrender = 467KB raw / 156KB gzip, lazy-loaded with the dashboard route); vendor chunk back to 637KB raw / 205KB gzip (was 350KB with echarts merged). Chart body itself lives in feature-dashboard chunk (8KB gzip).
- **Verified in browser** (1920×1080, dark + light): square cells visible, tooltip renders (Tue, 2026-02-17 / 0s coded), theme switch updates palette via option update, empty/quiet cells distinguishable. Unit 1181/1181, lint/type-check/build green. Version 0.20.0 → 0.21.0 pending commit.
- **Typography + color fixes from user screenshots** (2 rounds): bucket colors were uniform because ECharts visualMap defaults to the LAST data dimension (bucket hint 0-5) while pieces were authored in seconds — fixed with `dimension: 1` (colors now match duration buckets exactly: 28800s → brightest). Palette switched to DESIGN.md brand indigo monotone ramp (#5e6ad2-derived; green was wrong). Footer/legend typography aligned with SummaryCards language: uppercase tracked muted labels + white tabular values (Total active days 15 · Max streak 3d · Current streak 1d), legend centered tracked. Light theme quiet cells read correctly (#e9ebf0 on white cards).
- **Panel title: unified with summary-card label language** (user feedback ×2: big H3 "宣兵夺主", then plain body style "缺少设计" — final = card-label treatment): 11px uppercase tracked muted, identical to the TODAY/DAILY AVG label row. H2 kept for a11y semantics, styled as label. Header spacing back to mb-4. All 9 panels inherit via ChartSection.

### Notion plan sync (post-delivery bookkeeping)

- Notion「🌐 ctt-web 开发计划」updated via MCP: D2 section rewritten to completed state (✅ v0.20.0 — full delivery record: user acceptance fixes, design iterations/revert, tests, dual-axis review, branch state) matching the D1 completed-section format; D3 section rewritten to completed state (✅ v0.20.0 — 6 cards, formatDuration rules, three states, responsive grid, design iteration history); Dashboard delivery checklist table D1/D2/D3 rows flipped from ⬜ to ✅ with corrected actuals (D1: 7 composables not 5). D4–D7 untouched.
- Note: D3 was delivered as part of the D2 batch (v0.20.0) — no separate commit; the Notion record documents this explicitly ("随 D2 框架同批交付").
- Delivery report for the summary cards added: `.omp/summary-cards-delivery-report.md` (data flow / formatDuration rules table / design iteration + revert rationale / acceptance matrix — mirrors the D2 report structure).

## Recent Activity (v0.19.0 — 2026-08-31)

### Dashboard D1: stats API contract layer

- **Contract source (R13)**: ctt-server StatsController (7 endpoints, JWT, 60 req/min, `timezoneOffset` ±720 min) + DTO records read from source — StatsSummaryResponse (6 longs, seconds), HeatmapResponse (dense points incl zero days), StreakStatsResponse (current/max), DistributionResponse (type enum LANGUAGES/PROJECTS/TIME_OF_DAY/WEEKDAY/DEVICES/IDES + entries desc), HourlyDistributionResponse (points + activeDays), RecentSessionResponse (sessionId/sessionUuid/projectName/language/startTime/endTime/durationSeconds), AchievementResponse (code/displayName/description/unlocked/unlockedAt nullable/progress/target/unit). All support optional `deviceId` filter (except achievements) — 404 COMMON_002 for unknown/foreign devices.
- **Schema** (`src/lib/schemas/stats.schema.ts`): all 7 response schemas + DailyStatPoint/DistributionEntry/HourlyStatPoint sub-schemas + DistributionTypeSchema enum; z.infer types only.
- **API** (`src/lib/api/stats.ts`): getStatsSummary/getStatsHeatmap({start,end})/getStatsStreaks/getStatsDistribution(type)/getStatsHourly/getStatsRecent({limit})/getStatsAchievements — private `timezoneOffset()` returns `-new Date().getTimezoneOffset()` per request (browser-following); optional deviceId omitted from query when absent.
- **Composables** (`src/composables/useStats.ts`): useStatsSummary/useStatsHeatmap/useStatsStreaks/useStatsDistribution(type)/useStatsHourly/useStatsRecent/useStatsAchievements — STATS_QUERY_KEYS factory isolates by endpoint+params (`['stats', endpoint, ...args, deviceId ?? 'all']`); staleTime 60s for summary/heatmap/achievements (server 60s cache), 30s for the rest.
- **Tests**: stats.test.ts 14 cases (query params incl timezoneOffset/deviceId/type/limit, envelope parse, error propagation RATE_LIMIT_001/COMMON_002).
- Tests: 1142/1142 (68 files). type-check / lint clean.
- Version 0.18.3 → 0.19.0 (new feature → MINOR).

## Recent Activity (v0.18.3 — 2026-08-30)

### Device revoked state (backend ctt-server v0.50.0 `revokedAt`)

- **Bug (user report)**: after confirming a device revoke, the list showed no change — the device stayed Active with the Revoke button visible, so the user could not tell the revoke took effect. Root cause: backend revoke kept the record and exposed NO status field (this was the original requirement report to ctt-server).
- **Backend (by user)**: v0.50.0 adds `revokedAt` (Instant | null) to DeviceResponse — set on revoke (refresh-token revoke point), cleared on device re-registration; pure additive, Jackson non_null omits null.
- **Frontend (this round)**:
  - `DeviceSchema` + `revokedAt: z.string().nullable().default(null)` (JSDoc updated).
  - `DeviceListView`: `isDeviceRevoked(device)` → destructive "Revoked" badge; Revoke button hidden (`v-if="!isDeviceRevoked(device)"`); Active/Inactive logic unchanged for non-revoked devices.
  - Tests: device.schema.test.ts (+1 revokedAt case, defaults-omitted now excludes revokedAt), devices.test.ts payload/deconstruct +revokedAt, DeviceListView.test.ts (+revokedDevice fixture + "Revoked badge, no Revoke button" case), E2E fixtures `revokedAt: string | null` + helper DELETE now SETS revokedAt (was: removed from list — corrected to backend contract) + revoke.spec asserts Revoked badge/button-gone/card-count-unchanged.
- **Real-backend verification (v0.50.0)**: register → `revokedAt: null`; revoke (DELETE 200) → `revokedAt: 2026-08-29T18:46:20Z`; browser: card flips to "Revoked" badge + Revoke button gone + record kept + toast. Screenshot ~/Pictures/screenshots/v0.18.3-device-revoked-state.png.
- Tests: 1128/1128 (67 files) + 9/9 devices E2E. type-check / build / lint clean.
- Version 0.18.2 → 0.18.3 (bug fix → PATCH).

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
