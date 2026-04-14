# Active Context: ctt-web

## Current Status

**Phase**: Live Metrics card polish — fake metric removed, animation quality improved
**Version**: 0.5.0-beta.56 (2026-04-14)

### Stale tsbuildinfo Cache Cleanup (0.5.0-beta.56)
- **Issue**: 5× TS6053 "file not found" in tsconfig.app.json for deleted auth components
- **Root Cause**: Multiple `.tsbuildinfo` cache files still referenced files removed in beta.47
- **Fix**: `find . -name "*.tsbuildinfo" -delete` — must delete ALL cache files, not just one
- **Result**: vue-tsc 0 errors

### AuthMetricsCard.vue TypeScript Fix (0.5.0-beta.55)
- **Issue**: TS2769 (no overload matches `useTransition`) + TS2345 (`Math.round` argument type mismatch)
- **Root Cause**: `as const` made easing array `readonly [number, number, number, number]`, incompatible with VueUse's mutable `CubicBezierPoints` type → overload resolution fell through to array variant → `ComputedRef<number[]>` instead of `ComputedRef<number>`
- **Fix**: Explicitly typed `springEasing: [number, number, number, number]` (mutable tuple)
- **Result**: vue-tsc 0 errors

### AuthMetricsCard.vue Metric + Animation Polish (0.5.0-beta.54)
- **Issue 1**: "Commits" metric displayed but ctt-server has no commits API/stats endpoint — entirely hardcoded fake data
- **Issue 2**: Counter animation showed decimals (e.g. "123.45h"), all three counters started simultaneously, basic ease-out felt cheap
- **Fix**:
  - Replaced "Commits" (2400) with "Projects" (28) — more aligned with CTT product semantics
  - Wrapped `useTransition` results with `Math.round()` computed for clean integer display
  - Staggered `onMounted` triggers: hours 0ms → projects 150ms → streak 300ms
  - Changed easing from `[0.25, 0.1, 0.25, 1]` to spring overshoot `[0.34, 1.56, 0.64, 1]`
- **Result**: vue-tsc 0 errors, build passes, animation feels premium with staggered integer counting

### Dashboard Initial State Fix (0.5.0-beta.53)
- **Issue**: "最上面的卡面在刷新后的初始状态依旧在，理应三张卡初始都不在"
- **Root Cause**: `.auth-dashboard` missing `opacity: 0` — animation has `animation-delay: 0.1s`, during delay element defaults to `opacity: 1` (visible)
- **Fix**: Added `opacity: 0` to `.auth-dashboard` (line 527), matching `.auth-card-3d` which already had it
- **Result**: All three cards hidden during animation delay, no flicker on page refresh

### AuthMetricsCard.vue Easing Restoration (0.5.0-beta.52)
- **Issue**: `easeOutQuart` function produced incorrect animation feel compared to original
- **Fix**: Restored original `[0.25, 0.1, 0.25, 1]` cubic-bezier array, assigned to `easing` option (v14+ API)
- **Result**: Animation matches original design, zero deprecation warnings

### AuthMetricsCard.vue API Fix (0.5.0-beta.51)
- **Issue**: `transition` option in `useTransition` is deprecated
- **Fix**: Renamed `transition` to `easing` (VueUse v14+ API change)
- **Result**: Zero deprecation warnings, build passes

### AuthMetricsCard.vue Deprecation Fix (0.5.0-beta.50)
- **Issue**: 3 warnings for deprecated `transition: [0.25, 0.1, 0.25, 1]` array syntax in `useTransition`
- **Root Cause**: VueUse v14 deprecated cubic-bezier array syntax in favor of function-based easing
- **Fix**: Defined local `easeOutQuart` function (`n => 1 - (1 - n) ** 4`) and passed it to `transition` option
- **Result**: Zero deprecation warnings, identical animation behavior

### WCAG Contrast False Positive Fix (0.5.0-beta.49)
- **Issue**: Linter flagged `#9ca3af` text in `.auth-dashboard__url` as low contrast against `rgba(255,255,255,0.04)` background
- **Root Cause**: Static analyzer cannot compute contrast on semi-transparent backgrounds, defaults to white assumption
- **Fix**: Replaced `rgba(255,255,255,0.04)` with `rgb(34,35,36)` (opaque equivalent computed from card bg `rgb(25,26,27)` + overlay)
- **Result**: Visual appearance unchanged, linter now correctly identifies dark background and passes contrast check

### AuthLayout.css Linter Fixes (0.5.0-beta.48)
- **8 errors fixed**: Declared `--sheen-x` / `--sheen-y` CSS custom properties at `.auth-root` level (set at runtime by `useCardTilt` composable, linter couldn't resolve them statically)
- **4 warnings fixed**: Removed redundant `%` unit from `0%` values in `@keyframes mesh-shift` (`0%` → `0`)
- **1 warning**: Contrast false positive on `#9ca3af` text — linter computed against transparent `rgba()` background instead of actual `rgb(25,26,27)` card background
- **Result**: 13 → 0 problems in AuthLayout.css

### Dead Code Cleanup (0.5.0-beta.47)
- **Deleted 5 unused components** from `src/features/auth/components/`:
  - `AuthDashboardMockup.vue` — 38 linter warnings (scoped `:root:not(.dark)` broken, contrast issues, deprecated symbols)
  - `AuthFeatureShowcase.vue` — 1 linter warning (unused selector)
  - `AuthCodePreview.vue` — unused
  - `AuthMetricsCard.vue` — duplicate of `src/layouts/components/AuthMetricsCard.vue`
  - `AuthTerminalCard.vue` — duplicate of `src/layouts/components/AuthTerminalCard.vue`
- **Remaining active components**: `LoginForm.vue`, `RegisterForm.vue`, `PasswordStrengthMeter.vue`
- **Result**: Zero linter warnings in auth components directory

### AuthLayout.vue Component Split (0.5.0-beta.46)
- **Problem**: 1773-line monolithic file (SonarQube complexity violation)
- **Solution**: Extracted template into 4 child components, CSS to external file
- **CSS Strategy**: `<style src="./AuthLayout.css">` (non-scoped) to preserve:
  - `:root:not(.dark)` theme selectors (scoped would break with `[data-v-xxx]:root`)
  - 3D perspective context (`.auth-visual` perspective + `.auth-3d-scene` preserve-3d)
  - All dark/light mode variants in single stylesheet
- **Components Created**:
  - `AuthBackground.vue` (33 lines) — mesh gradient, noise SVG, 6 orbs
  - `AuthDashboard.vue` (142 lines) — browser chrome, heatmap, stats, tilt
  - `AuthMetricsCard.vue` (142 lines) — animated counters, sparkline, language bars, tilt
  - `AuthTerminalCard.vue` (72 lines) — terminal stats, blinking cursor, tilt
- **AuthLayout.vue**: 1773 → 52 lines (97% reduction)
- **AuthLayout.css**: 1353 lines (extracted, non-scoped)
- **Verification**: `pnpm build` passes (628ms), vue-tsc 0 errors

### AuthLayout.vue SonarQube/IDE Warning Fixes (0.5.0-beta.45)
- **Contrast Issues Fixed**:
  - Line 1079: `.auth-dashboard__url` `#8a8f98` → `#9ca3af` (WCAG AA compliant)
  - Line 1561: `.auth-metrics__lang-pct` `#8a8f98` → `#9ca3af` (consistent)
  - Line 1659: `.auth-terminal__text` `#8a8f98` → `#9ca3af` (consistent)
- **Float px Fixed**: Line 696 `padding: 1.5px` → `padding: 1px` (added comment)
- **Documented Intentional**: `-webkit-mask-composite: xor` + `mask-composite: exclude` cross-browser pair
- **Result**: Build passes, lint clean, visual unchanged

### AuthTerminalCard.vue TS18048 Fix (0.5.0-beta.44)
- **Issue**: `TS18048: '__VLS_ctx.lines' is possibly 'undefined'` — optional prop used directly in template
- **Fix**: Added computed `terminalLines = computed(() => props.lines ?? [])`, replaced template usage
- **Result**: vue-tsc passes, build clean

### PasswordStrengthMeter.vue Lint Fixes (0.5.0-beta.43)
- **Issues Fixed**:
  1. `/[0-9]/` → `/\d/` (line 22) — concise character class syntax
  2. `dark:bg-white/[0.06]` → `dark:bg-white/6` (line 69) — simplified Tailwind opacity
- **Result**: Clean lint, build passes

### useCardTilt.ts Lint Fixes (0.5.0-beta.42)
- **Issues Fixed**:
  1. `depthMultiplier = 1.0` → `depthMultiplier = 1` (zero fraction removed)
  2. `lerp` function moved to module scope (lines 3-5)
  3. Redundant `const tz = translateZ` eliminated, using `translateZ` directly
- **Result**: Clean lint, build passes

### AuthLayout 3D Card Effects (0.5.0-beta.41) — BASE STATE
- Shared perspective `.auth-visual`, 3D scene `.auth-3d-scene` with `preserve-3d`
- Z-layering: Dashboard +40px, Metrics 0, Terminal -60px; each with unique base rotation
- Parallax: closer cards respond more (depthMultiplier: Dashboard 1.2x, Metrics 0.8x, Terminal 0.5x)
- `useCardTilt` options API: `baseRotateX/Y/Z`, `translateZ`, `depthMultiplier` → computed `transform`

### AuthLayout Left Panel Font Blur Fix (0.5.0-beta.39)
- **User Feedback**: "左侧三张卡片里的字体变模糊了，原先不是这样的，原先非常清晰"
- **Root Cause**: Two parent containers had redundant `perspective: 1000px`:
  - `.auth-visual` (line 730) — promoted Dashboard + all children to GPU compositing layer
  - `.auth-cards-container` (line 1100) — promoted Live Metrics + Terminal cards to GPU layer
  - GPU compositing disables subpixel antialiasing in Chromium → font blur
  - Child elements already have `transform: perspective(...) rotateX(...) rotateY(...)` — parent perspective was redundant
- **Fix**: Removed `perspective: 1000px` from both parent containers
  - `.auth-visual`: removed `perspective: 1000px` (child `.auth-dashboard` has its own perspective in transform)
  - `.auth-cards-container`: removed `perspective: 1000px` (child `.auth-card-3d` has its own rotateX/Y)
- **Result**: Fonts render sharply again, 3D tilt animations preserved (children handle their own perspective)

### PasswordStrengthMeter Polish (beta.34 ~ beta.38)
- Unified layout: icons always rendered (no v-if jump), neutral gray when empty
- Empty password false-pass fix: `pwd.length > 0` guard on max-length and allowed-chars rules
- Typography/spacing: caption-sized rules, proper hierarchy, DESIGN.md colors, breathing room

## Recent Changes Summary (2026-04-13 ~ 2026-04-14)

### Auth Visual Cards (beta.29 ~ beta.31)
- Removed `backdrop-filter` from all auth cards (root cause of grid-lines-showing-through)
- Negative z-index for grid (-1) and stars (-2) layers
- Edge gradient mask on grid layer for soft fade

### PasswordStrengthMeter (beta.32 ~ beta.38)
- Complete redesign: hidden progress bar when empty, unified icon layout (no v-if jump)
- Empty password false-pass fix: added `pwd.length > 0` guard to max-length and allowed-chars rules
- Typography + spacing polish: caption-sized rules, proper hierarchy, DESIGN.md colors

### AuthLayout Component Split (beta.46 ~ beta.53)
- 1773-line monolith → 52 lines + 4 child components + external CSS
- Dead code cleanup: deleted 5 unused auth components
- Font blur fix: removed redundant parent `perspective` causing GPU compositing
- Dashboard initial state: added `opacity: 0` to prevent pre-animation flicker

### Code Review Fixes (2026-04-12)
- Token key → `STORAGE_KEYS.ACCESS_TOKEN`, type guards → `isApiError()`, 7 password rules
- systemPatterns.md pruned 237→147 lines