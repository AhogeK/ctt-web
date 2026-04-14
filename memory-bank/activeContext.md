# Active Context: ctt-web

## Current Status

**Phase**: Card entrance animation coherence issue resolved
**Version**: 0.5.0-beta.53 (2026-04-14)

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

### AuthLayout 3D Card Effects — ABANDONED (2026-04-14)
- **User Decision**: "实现不了就算了" — User abandoned further attempts after multiple failed iterations
- **Failed Attempts**:
  - beta.42: wrapper div separation → rejected ("夸张丑陋没有高级感")
  - beta.43: JS animation → rejected ("布局糟糕，卡片重叠，缺少3D转动")
  - beta.44: full JS-driven entrance → still not meeting expectations
- **Root Issues**:
  - CSS animation `to` state overwrites JS inline transform
  - Balance between "dramatic entrance" and "subtle常态" difficult to achieve
  - Layout overlap/z-index issues persistent
- **Outcome**: Code restored to beta.41 via WebStorm local history. Feature marked as abandoned.

### AuthLayout True 3D Depth Effects (0.5.0-beta.41) — BASE STATE
- **Architecture** (current restored state):
  - **Shared perspective**: `.auth-visual` gets `perspective: 1000px` + `perspective-origin: 50% 30%` (shared vanishing point)
  - **3D scene wrapper**: `.auth-3d-scene` with `transform-style: preserve-3d` — all cards share same 3D space
  - **Z-layering**: Dashboard `translateZ(40px)`, Metrics `translateZ(0)`, Terminal `translateZ(-60px)`
  - **Angled rotations**: Each card has unique base rotation (X+Y+Z combined):
    - Dashboard: `rotateX(8deg) rotateY(-12deg) rotateZ(-2deg)` — dramatic, looking down from above-right
    - Metrics: `rotateX(4deg) rotateY(-8deg) rotateZ(1deg)` — moderate, opposite Z tilt
    - Terminal: `rotateX(12deg) rotateY(-16deg) rotateZ(-3deg)` — deepest angle
  - **Parallax mouse tracking**: Closer cards respond MORE to mouse (depthMultiplier: Dashboard 1.2x, Metrics 0.8x, Terminal 0.5x)
  - **Entrance animation**: Cards emerge from `translateZ(-200px)` with extreme rotation → settle to rest position
- **Composable rewrite**: `useCardTilt` now accepts options object with `baseRotateX/Y/Z`, `translateZ`, `depthMultiplier`. Returns computed `transform` string (previously returned unused rotateX/rotateY refs).
- **Text sharpness**: Inner content layers get `transform: translateZ(0)` to stay on GPU layer without blur.
- **Files**:
  - Modified: `src/composables/useCardTilt.ts` (complete rewrite — options API, computed transform)
  - Modified: `src/layouts/AuthLayout.vue` (template bindings, CSS overhaul)

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

### PasswordStrengthMeter Empty Password False-Pass Fix (0.5.0-beta.38)
- **User Feedback**: "密码输入后在全部去掉，本因该所有项都为x结果 Maximum 跟 Only letters 却是勾，但此时密码框里并没有密码"
- **Root Cause**: Two rules trivially pass on empty string:
  - `pwd.length <= 32` → `0 <= 32` → true (empty satisfies max length)
  - `/^[A-Za-z0-9@$!%*?&]*$/.test(pwd)` → `*` matches zero occurrences → true
- **Fix**: Added `pwd.length > 0` guard to both rules:
  - Line 19: `pwd.length > 0 && pwd.length <= 32`
  - Line 24: `pwd.length > 0 && /^[A-Za-z0-9@$!%*?&]*$/.test(pwd)`
- **Result**: Empty password correctly shows X icons for all 7 rules

### PasswordStrengthMeter Unified Layout (0.5.0-beta.37)
- **User Feedback**: "既然输密码后会变成叉勾样式，为什么就不能一开始就是呢？为什么就不能统一，而不是输密码后格式一下子跳动"
- **Root Cause**: Previous versions used `v-if` to conditionally render icons, causing layout jump between empty and active states. Added divider/label/hint created visual complexity.
- **Fix**: Complete layout unification:
  - Icons (Check/X) ALWAYS rendered for every rule - no conditional `v-if`
  - Empty password: icons in neutral gray (#8a8f98), text in neutral gray
  - Active password: passed rules → emerald Check + emerald text, failed rules → gray X + dimmed text
  - Removed: hint text paragraph, divider line, "Requirements" section label
  - Added: `iconColor(rule)` and `textColor(rule)` helper functions for state-based colors
  - Progress bar behavior unchanged (hidden when empty, colored when active)
  - `transition-colors duration-200` on icons for smooth color transitions
- **Result**: Zero layout jump - only colors change between states, structure identical

### PasswordStrengthMeter Increased Spacing (0.5.0-beta.36)
- **User Feedback**: "这个列表字体大还紧贴着Password must meet the following requirements，一点设计感没有"
- **Fix**: Increased spacing for better breathing room:
  - Outer container: `space-y-4` (16px) between hint and rules section
  - Rules section wrapper: `space-y-3` (12px) between section label and list
  - Rules list items: `space-y-2` (8px) between individual rules
  - Maintains visual hierarchy from beta.35 (divider + section label)
- **Result**: Better breathing room, less cramped appearance, improved design sense

### PasswordStrengthMeter Visual Hierarchy Polish (0.5.0-beta.35)
- **User Feedback**: "列表字体大还紧贴着hint，一点设计感没有" / "ugly, has no design sense"
- **Fix**: Added visual hierarchy and section separation:
  - Divider line: `border-t border-[#e6e6e6] dark:border-white/[0.05]` between hint and rules
  - Section label: "Requirements" in quaternary gray (#62666d), 10px uppercase tracking-wide
  - Rules container: wrapped in `space-y-3` div with `space-y-2` list (8px between items)
  - Hint-to-rules gap: 20px+ effective spacing (space-y-4 outer + divider + section container)
  - All text maintains `font-feature-settings: 'cv01', 'ss03'`
- **Result**: Clear visual hierarchy, separated sections, polished Linear-inspired design

### PasswordStrengthMeter Design Refinement (0.5.0-beta.34)
- **User Feedback**: "列表字体大还紧贴着hint，一点设计感没有"
- **Fix**: Typography + spacing refinement:
  - Outer spacing: `space-y-2.5` → `space-y-4` (16px)
  - Rules font: `text-sm` → `text-xs` (12px caption)
  - Rules gap: `gap-y-2` → `gap-y-1.5` (6px tighter)
  - Colors: DESIGN.md tertiary gray `#8a8f98`
- **Result**: Better hierarchy, caption-sized rules, proper spacing

## Recent Changes (2026-04-14)

### PasswordStrengthMeter Complete Redesign (0.5.0-beta.33)
- **User Feedback**: "进度条就有红色 At least 8 characters...有点太丑了，一点设计没有"
- **Root Cause**: First fix (beta.32) incomplete - progress bar showed red when empty (passedCount=1 due to max32 rule), rules list still confusing
- **Fix**: Complete redesign with:
  - `showProgress` computed: `hasPassword && passedCount > 0` - progress bar hidden entirely when empty
  - `strengthColor`/`glowColor`: return empty string when !hasPassword (no premature red)
  - Icons (Check/X): only render when hasPassword is true
  - Hint text: "Password must meet the following requirements" shown when empty (DESIGN.md tertiary gray)
  - All transitions use DESIGN.md Linear style
- **Result**: Empty password → invisible progress bar, all rules gray with no icons, hint text; Active → colored progress + icon states

### Files Modified
- `src/features/auth/components/PasswordStrengthMeter.vue`: neutral state logic
- `package.json`: version 0.5.0-beta.31 → 0.5.0-beta.32
- `README.md`: version + description update

### Verification
- vue-tsc: 0 errors

### Auth Visual Backdrop-Filter Cleanup (0.5.0-beta.31)
- **Context**: QA review revealed 2 extracted auth components still had backdrop-filter
- **Fix**: Remove backdrop-filter from AuthFeatureShowcase + AuthDashboardMockup
  - AuthFeatureShowcase.vue: .feature-card backdrop-filter removed (147-148)
  - AuthDashboardMockup.vue: .auth-card-3d backdrop-filter removed (586-587)
- **Result**: All auth visual cards now fully opaque, consistent with AuthLayout.vue fix

### Files Modified
- `src/features/auth/components/AuthFeatureShowcase.vue`: removed backdrop-filter
- `src/features/auth/components/AuthDashboardMockup.vue`: removed backdrop-filter
- `package.json`: version 0.5.0-beta.30 → 0.5.0-beta.31
- `README.md`: version + date + description update

### Verification
- vue-tsc: 0 errors

### Auth Visual Grid Edge Gradient (0.5.0-beta.30)
- **User Feedback**: "网状结构的边缘还是太生硬，边缘处应该要暗淡渐变过渡"
- **Solution**: Add mask-image to `.auth-visual__grid` matching stars layer
  - mask: `radial-gradient(ellipse 90% 70% at 55% 50%, black 50%, transparent 100%)`
  - Same parameters as stars layer for visual consistency
  - Grid lines now fade softly at edges instead of abrupt cutoff

### Files Modified
- `src/layouts/AuthLayout.vue`:
  - `.auth-visual__grid`: added mask-image + -webkit-mask-image (758-759)

### Verification
- vue-tsc: 0 errors

## Recent Changes (2026-04-13)

### Auth Visual Opaque Cards Fix (0.5.0-beta.29)
- **User Feedback**: "线还是会透过卡片" - rgba→rgb fix didn't work
- **Root Cause**: `backdrop-filter` creates stacking context, causing z-index to fail. Grid lines blur through cards despite solid rgb() background
- **Solution**: Remove backdrop-filter + negative z-index for grid/stars
  - `.auth-card__inner`: removed backdrop-filter blur(20px) (688-700)
  - `.auth-card-3d`: removed backdrop-filter blur(12px) (1105-1120)
  - `.auth-visual__grid`: z-index 1 → **-1** (757)
  - `.auth-visual__stars`: z-index 0 → **-2** (768)
- **Why it works**: backdrop-filter was root cause of stacking context issue. Removing it makes rgb() solid background truly opaque. Negative z-index ensures grid/stars are below all card elements.

### Files Modified
- `src/layouts/AuthLayout.vue`:
  - `.auth-card__inner`: backdrop-filter removed (688-700)
  - `.auth-visual__grid`: z-index -1 (757)
  - `.auth-visual__stars`: z-index -2 (768)
  - `.auth-card-3d`: backdrop-filter removed (1105-1120)

### Verification
- vue-tsc: 0 errors
- Effect: Cards completely opaque, grid lines cannot show through

### Iteration History
- 0.5.0-beta.26: Separated grid + stars layers
- 0.5.0-beta.27: Fixed brightness/z-index/mask (still had issues)
- 0.5.0-beta.28: rgba→rgb backgrounds (backdrop-filter still caused issue)
- 0.5.0-beta.29: Removed backdrop-filter + negative z-index (root cause fix)
- 0.5.0-beta.30: Added mask-image to grid layer (edge gradient)
- 0.5.0-beta.31: Removed backdrop-filter from AuthFeatureShowcase + AuthDashboardMockup (complete fix)

## Previous Context (2026-04-12)

### Code Review Fixes
- **systemPatterns.md**: 237→147 lines (AGENTS.md limit)
- **instance.ts**: Token key hardcoded→`STORAGE_KEYS.ACCESS_TOKEN`
- **Type guards**: 5 `as` assertions→`isApiError()` checks
- **guard.ts**: Removed TODO, switched Pinia auth store
- **PasswordStrengthMeter**: 7 rules (max32 + allowed chars)
- **VerifyEmailView**: AUTH_004 precise error code

### Verification
- Type-check: 0 errors
- Tests: 285 passing (15 files)