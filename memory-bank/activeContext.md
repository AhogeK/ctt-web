
# Active Context: ctt-web

## Current Status

**Phase**: Placeholder cleanup + blank-view guard (pending commit)
**Version**: 0.28.1 (2026-09-04)
**Branch**: develop
**Tests**: 1222/1222 unit; vue-tsc + lint 0 error 0 warning; build green

### Uniform 2-col rhythm + vertical centering (user: "大伙都一样，没有个例")

- **All spans removed** — heatmap included. Every card is exactly half width at ≥lg; heatmap's cell renderer clamps to available width (44 weeks verified readable at 1139px). TOD lands alone on row 5 (5 odd cards) — accepted consequence of uniformity.
- **ChartSection rebuilt**: section is now `flex flex-col`; loading/error/empty/data branches all `flex-1` + `justify-center` → sparse panels center vertically and match their row sibling's height. Duplicate class-array leftover (two :class entries, one without bg gradient) collapsed; template rewritten clean via full-file write after a partial-edit mangling.
- **Verified live at 2621**: all 5 cards w=1139 equal, heatmap/weekly pair + hourly/trend pair rows aligned, empty card height matches. 1222/1222, tc/lint/build green.
### WeekHourPanel ramp: brand indigo mid-stop (user: "weekly 颜色不符合 DESIGN.md")

- **Root cause**: continuous `visualMap inRange` was a two-point lerp `#313a5c → #bcc2f4` — midpoint bottoms out at desaturated slate `#767ea8`, bypassing DESIGN.md's `#5e6ad2` entirely (the only chromatic color). Heatmap's discrete buckets pass through `#5e6ad2`, so weekly looked muddy next to it.
- **Fix**: 3-point spine `[dataLow, dataMid=#5e6ad2, dataHigh]` in both themes (dark: `#313a5c→#5e6ad2→#bcc2f4`; light: `#d9ddf2→#5e6ad2→#2f3a9e`). Dynamic-scale semantics (plugin-faithful) preserved; only the ramp shape changed.
- **Verified live**: dark-mode canvas pixel sampling shows mid cells at `#6878d8/#7888d8` (was muddy slate); e2e rewritten for the uniform-grid contract (equal-width + pair-rows + column alignment, 3/3 green).
- **Bootstrap notes**: JWT POST needs CSRF (cookie GET-trigger + `X-XSRF-TOKEN` header, raw value); `/sync/push` requires a pre-registered `deviceId` via `POST /api/v1/devices`.
## Dependency Update (2026-09-06, no version bump)

- `vp update -L`: vue-router 5.3.1, zod 4.5.4, vue-i18n 11.4.10, @lucide/vue 1.41.0, reka-ui 2.10.4, vue-echarts 8.2.0, @vueuse 14.4, @types/node 26.4.1, playwright 1.63.0 (+ chromium-1243 install), lint-staged 17.5.0, @vue/test-utils 2.5.0, simple-git-hooks 2.14.0, eslint-plugin-oxlint 1.81.0.
- **Held back**: typescript 6.0.3 exact (TS7 breaks vue-tsc/compiler-sfc — red line), vitest + coverage-v8 4.1.11 exact (vite-plus@0.3.0 hard-pin; 5.0.0 caused dual-instance peer conflict). pnpm-workspace.yaml peer rules untouched.
- **Fixed latent flaky**: useDashboardFilters custom-preset test used "5 days ago", which equals the month start on the 6th of any month → 'month' inference → failed today. Now anchors on the 2nd (provably never a preset start).
- Verified: peers 0 / vue-tsc 0 / build 0 / 1222 unit / lint 0 / e2e layout 3/3 on chromium-1243.
### TOD capsule ramp contrast fix (user: "各项之间色差没差距")

- Old dark ramp (#6a71d8/#8a92ea/#aab4ff/#7b85e0) had adjacent-segment contrast of only 1.45–1.70:1 — segments blur together. Quantified with WCAG luminance math, rebuilt both ramps around brand anchors: dark `#3a42a8 → #5e6ad2 → #7b85e0 → #b7c1ff` (adjacent 1.77/2.70/1.93:1), light `#1e2260 → #3f4ab0 → #5e6ad2 → #a3aef2` (1.94/3.51/2.21:1). Middle anchors sit exactly on `#5e6ad2`.
- **Theme-verification gotcha**: `App.vue` onMounted `setTheme('auto')` overrides any injected localStorage mode — headless dark screenshots MUST use CDP `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])`, not storage injection.
- Verified on seeded data (4 buckets 6/9/18/12h) via canvas pixel sampling: dark capsule renders `#3a42a8/#5e6ad2/#b7c1ff` family. tc/lint/build green.
### TOD dark ramp round 2 (user: "Morning 跟 Evening 差距不太明显")

- M(#5e6ad2) vs E(#7b85e0) measured 1.40:1 — the two middle stops were too close even after round 1. Full 4-stop re-anchor: NIGHT #3a42a8→#333b9a, MORNING #5e6ad2→#4d59c9, EVENING #7b85e0→#8b95ea, DAYTIME #b7c1ff (lifted). M-E now 2.11:1; adjacent ladder 1.61/3.50/1.66:1. Light ramp unchanged.
- Verified dark via CDP emulateMediaFeatures + seeded 4-bucket data. 0.28.3.
### TOD "data looks wrong" investigation (user report; no code change)

- Chain verified end-to-end with a seeded account: push 20d × (晨9h/昼12h/昏6h/夜3h local) → backend `distribution?type=TIME_OF_DAY&timezoneOffset=480` returns 270/360/180/90h → panel legend renders exactly 30/40/20/10% + Total 900h. **Frontend chain is correct; no bug.**
- Root of confusion #1: `.sisyphus/get-token.sh` registers a NEW timestamped account every run — earlier test data lived in throwaway accounts, so "the account" users check has none.
- Root of confusion #2: my earlier seed script generated hours in UTC, but the backend buckets by **session start hour in the aggregation timezone** (`timezoneOffset` param, browser-local). UTC 23:00 = next-day 07:00 in UTC+8 → NIGHT data landed in MORNING. Fixed seeding to generate local-time then convert.
- **Contract facts (read-only, verified in source)**: ctt-server `TimeOfDay.fromHour` buckets Morning 5-11 / Daytime 12-16 / Evening 17-21 / Night 22-4 **by session start hour, no cross-bucket splitting**. Plugin (JetBrains) splits sessions across bucket boundaries and uses Night 0-5 / Morning 6-11 / Daytime 12-17 / Evening 18-23 — **server vs plugin semantics differ**; flagged to user as backend-side product decision (report delivered, per R3 no cross-repo changes).
- TimeOfDayPanel JSDoc still says "plugin's hour buckets" — misleading vs actual server contract; note for next code touch.
### Backend v0.65.0 TOD contract landed (user relayed delivery note)

- Verified live with the delivery note's locked case: 11:00-13:00 + 23:50-00:10 (local UTC+8) → MORNING 3600s / DAYTIME 3600s / EVENING 600s / NIGHT 600s; bucket sum 8400 == summary.total ✓ (invariant holds).
- Panel E2E on seeded data: legend renders Night 10m 7% / Morning 1h 43% / Daytime 1h 43% / Evening 10m 7%, Total 2h20m — exact match. Response schema unchanged; frontend mapping untouched.
- Only frontend delta: TimeOfDayPanel JSDoc bucket boundaries corrected (old comment had stale 22-04/05-11/12-16/17-21 that matched neither old server nor plugin). No behavioral code change; 1222/1222 green.
- Pending commit (user confirmation per R6): AGENTS.md R6 line, activeContext entries, TimeOfDayPanel JSDoc.
### Container-query layout thresholds (user: 卡<830 占整行 / Summary 行<1430 换行)

- **Component-width semantics, not viewport** — user clarified both thresholds measure the component/row itself, so sidebar collapse and layout changes stay honest. Implemented with Tailwind v4 container queries: `@container/page` on DashboardHome's root column + `@[1684px]/page:grid-cols-2` on the panel grid (1684 = 2×830 + gap 24); `@container/sc` wrapper inside SummaryCards + `@[1430px]/sc:grid-cols-6` (below: md 3-col / base 2-col). Old `lg:grid-cols-2` / `xl:grid-cols-6` removed.
- **Gotcha (cost a round-trip)**: a container element cannot query ITSELF — `@container/x` and `@[..]/x:` on the same div silently never matches. The container declaration must sit on an ancestor (page root / a wrapper div).
- Verified with a multi-viewport probe (1600/1920/2048/2621): panel cols 1/1/2/2, summary cols 3/6/6/6 — exactly the 830/1430 floors (1920 card = 796px < 830 → single column; 2048 card = 860 ≥ 830 → pair).
- e2e rewritten to the threshold contract (4 cases: collapse@1920, pair@2100, summary 6@2100, summary 3@1600). 1222 unit + 4 e2e green.
### TOD panel redesign (user: "缺少设计，参考插件端 + chart-designer/lieflat-charts")

- Skill audit (R20): chart-designer (chart-type matrix), lieflat-charts (63-template taste system). Candidate audit per lieflat §1: G4 Dot Waffle (honest unit-decomposition but loses the clock metaphor), F4 Tick Donut (weak time semantics), **kept the stacked capsule** (the capsule IS the 24h day — strongest ontology for time-of-day) and absorbed lieflat design language instead.
- Redesign shipped: (1) 24h hairline ruler above the capsule with ticks at 00/06/12/18/24 — segment edges now visibly align with real bucket boundaries; (2) paper seams between segments via an HTML overlay at cumulative-percent positions (ECharts stacked bars overpaint any borderColor hack — lesson recorded); (3) legend upgraded from color dots to Lucide day-phase icons (Moon/Sunrise/Sun/Sunset — plugin emoji parity) in tinted chips, percent leading + duration secondary; (4) tooltip now shows clock range.
- Multi-edit gotcha: my edit-tool range repair left duplicated blocks (segments declared twice, a mangled textStyle) — rebuilt buildOption wholesale with a python regex replace, then deleted the orphan. Verify with a full-file read after any multi-hunk edit on this file.
- Verified light+dark screenshots (segment seams, ruler, legend legibility). 1222/1222 unit, tc/lint/build green.
### TOD panel feedback round (user: legend spacing / misleading ruler / endpoint contrast)

- Legend spread: `grid-cols-2` hugging left → `flex flex-wrap justify-around` — four entries distribute across the card width.
- Ruler honesty fix: the capsule encodes composition share, so clock-position ticks (00/06/12/18/24) could NOT align with data-driven segment positions — misleading. Ruler now shows percent ticks (0/25/50/75/100%) that line up exactly with the seams; clock ranges remain in legend labels (00–06 etc.).
- Endpoint contrast: light DAYTIME #a3aef2→#939ff0 (vs white 2.12→2.48), dark NIGHT #333b9a→#4149bd (vs surface 1.85→2.42). Adjacent-segment distinctness now leans on the 2px paper seams (part of the design), freeing the luminance budget for segment-vs-card contrast — the two constraints otherwise deadlock.
- 1222/1222 unit; light+dark screenshots verified (legend spread, aligned ruler, floating endpoints).
### TOD feedback round 2 (user: percent ruler meaningless / tooltip shows undefined)

- **Ruler deleted**: percent ticks carried no information (every segment has its own share; 0-100 adds nothing the capsule doesn't already show). The 24h clock version was dropped earlier for misalignment — lesson: this chart's x-axis is ordinal composition, any axis invites misreading; the legend's clock-range labels are the only time reference needed.
- **Tooltip `undefined` fixed**: stacked-bar `data` entries lacked `name` — ECharts `params.name` comes from `data.name`/`series.name`, neither was set. Added `name: seg.name`; verified live: hover renders "Daytime 12–18h · 84h · 30%".
- 1222/1222 unit, tc/lint/build green.
### TOD hover redesign (user: tooltip cursor-following felt off)

- **ECharts floating tooltip removed**; replaced with a fixed HTML info chip: hovering a segment raises a chip anchored to the segment's center-x (clamped 14-86% so it never overflows), showing icon + label + clock range + percent + duration. Non-hovered legend entries dim (opacity-45); legend entries also trigger the chip via mouseenter.
- Implementation: `activeSeg` ref driven by `chart.on('mouseover'/'mouseout')` (needs `series.name` set — `params.seriesName` reads series-level name, not data-level) + `segmentCenters` computed from cumulative percents. `tooltip: {show:false}`.
- **Test-mock compatibility**: the component test's mockChart lacks `.on` — `bindHoverEvents` guards `typeof chart.on === 'function'`.
- **Process lesson (self-inflicted, round-trips wasted)**: repeated edit-tool hunks on this file kept mis-registering (stale anchors + boundary echoes mangled the template twice). After the second corruption, wholesale `write` of the full file was the correct move — for template-heavy edits, prefer one full-file write over incremental hunks.
- 1222/1222 unit, tc/lint/build green; verified live (chip anchored at segment center, legend sync).
### Language Distribution panel shipped (user directive; chart-designer + lieflat audit)

- **Fixed test account**: `.sisyphus/get-token.sh` now persists `<prefix>` emails to `.sisyphus/.test-account-<prefix>` and logs straight in on later runs (FRESH=1 to force re-register) — test data accumulates on ONE account instead of piling up throwaway registrations (user request). Verified: reuse login → seeded 10-language data persists.
- **Design audit** (lieflat §1, ≥3 candidates): G4 Dot Waffle (honest units but loses label capacity), F4 Tick Donut (weak semantics for arbitrary-length names), **ranked horizontal bars won** — arbitrary language labels fit naturally, length ∝ time is honest composition encoding, BarChart already registered (zero bundle delta). Plugin uses pie+scroll-legend; user asked for own style.
- **LanguageDistributionPanel.vue**: ranked bars (entries arrive duration-descending), 0.1% floor folds tail into Others (plugin parity), indigo luminance ramp decaying with rank (same family as weekly heatmap), `% · duration` end labels, Total footer, tooltip with full info. Chart height = N rows × 26px, grows with language count. Filter reactivity + loading/error/empty via parent ChartSection.
- **DashboardHome**: panel added after TOD (grid auto-flows; 6 cards now). `useStatsDistribution('LANGUAGES', originFilter)` in the view.
- 4 new unit tests (rank order, Others folding, 0.1% threshold boundary, a11y label) — 1226/1226, tc/lint/build green; light+dark verified with seeded 10-language account.
### Feedback #1 investigated: TOTAL vs TOD vs summary mismatch (user report)

- **Backend-level check**: `summary.total` == `TIME_OF_DAY` bucket sum on identical requests (1011600 == 1011600, seeded repro). The pure data path is consistent.
- **Root cause confirmed — backend capability gap**: the filter bar's date range drives `summary` (start/end supported) but NOT the distribution panels. `GET /distribution` accepts only type/timezoneOffset/deviceId/ideName — **no start/end**; unknown params are silently ignored (verified: windowed request returns identical full-history sum). Frontend `filterQuery` already sends start/end when the parent provides them; distribution queries intentionally pass only originFilter (documented limitation).
- User-visible effect: switching the filter-bar preset changes the summary cards but leaves every distribution panel on all-history — the mismatch the user saw.
- **Per R3**: fix requires backend window params on `/distribution` (report handed to user). No frontend code change can close the gap.
### Backend v0.66.0 window params wired into distribution panels

- Backend shipped `start`/`end` on `/distribution` (inclusive, default full history, end<start → 400 COMMON_003). Verified live: full 1011600 vs single-day window 64800, 400 on inverted range.
- **TOD + LANGUAGES now follow the filter-bar window**: DashboardHome builds `distributionWindow` (start/end) into both queries; LanguageDistributionPanel takes start/end props (own query, TOD stays in the view per panel pattern). Verified live: All-time → summary.total 281h == TOD Total 281h; September window → TOD 143h (previously stuck at 281h forever).
- **Total semantics clarified** (user's backend ruling): time-axis distributions (TIME_OF_DAY) must equal summary.total (merged-dedup conservation) and KEEP their Total footer as a cross-check; categorical distributions (LANGUAGES/PROJECTS/…) sum ≥ real activity (parallel-session overlap is legal) so their Total has no business meaning — LANGUAGES footer removed, a11y label drops Total (test updated).
- 1226/1226 unit, tc/lint/build green.
### LANGUAGES percent precision (user: small values all read 0%)

- Percent values now full precision internally; displayed via `formatPercent` (2 decimals, trailing zeros trimmed — user ruling): 41.67% / 0.21% / 5%. Applied at all three readouts: bar-end label, tooltip, aria label (initially missed the bar-end formatter — floats leaked into the render; caught by screenshot).
- Tests updated to 2-decimal expectations (rank order [50, 31.25, 18.75]; a11y shares 61.54/38.46). 1226/1226, tc/lint/build green; verified with the 10-language fixed account (HTML 0.31% / CSS 0.21% now distinct).
### Language panel bounded display window (user: unbounded card growth)

- **Top-8 cap**: `MAX_VISIBLE = 8` — rank 1-8 render as bars; everything past that folds into the same Others bar as the sub-0.1% tail. Chart height now has a hard ceiling (9 rows × 26px + 16 = 250px; card ~318px), keeping the grid's row rhythm (TOD sibling 201px, content centered).
- Tooltip formatter surfaces `(N folded)` on the Others bar for information reachability. New unit test locks 12-language input → 9 rows (8 + Others).
- **Debug lesson**: dev-server `504 Outdated Optimize Dep` after dependency-graph changes — `rm -rf node_modules/.vite` + restart clears it; page then renders blank ("no #app") until refresh.
- 1227/1227 unit, tc/lint/build green.
### Language panel → treemap (user: small shares invisible in Others; right side wasted)

- **3-candidate audit**: G4/L14 waffle (1 dot = 1% cannot encode 0.21% shares — fails "see everything"; L14 limited to <=6 categories), F4 donut (ring leaves the exact whitespace being complained about, legend steals width) → **F13 Nested Treemap adopted** (single-level: language data is flat, so F13's parent bands become paper seams).
- **Fixes both complaints**: measured 92% ink coverage on the card (zero dead space, was empty on the right); area encodes time continuously so even 0.21% stays a visible tile; fixed 240px height so language count no longer stretches the grid row (Top-8 cap removed — 24-slice ceiling with Others beyond).
- **F13 hard rules honoured**: area already encodes the value so colour does NOT repeat it — one brand indigo fill + paper seams (Others gets a muted step of the same hue); over-long labels are dropped (never shrunk) and details live in the tooltip; Others tooltip lists the folded languages.
- **Verified with a 33-language tail account**: Others tooltip renders "9 folded / Lang19 0.31% … Rare0 0.02% / …and 3 more" — nothing unreachable. Bug caught on the way: treemap data carries seconds under `value`, so the tooltip's duration field was empty until it read `params.value`.
- 1229/1229 unit, tc/lint/build green.
### Language panel: treemap rejected → ranked bar list (user: treemap too heavy, slabs, short rows illegible)

- Treemap (single-hue fill, area = seconds) measured 92% ink coverage but read as one big colour slab when a language dominates, and small tiles were unreadable — user rejected it. Reverted the TreemapChart registration.
- **Third design, closest relative F5/C1 Tick Rows** (lieflat §6 translation): ranked rows of 8px capsules, bar length scaled to the LONGEST language (so rank 1 fills the row instead of leaving a gap), rank-driven indigo luminance ramp (light: deep→pale; dark: bright→deep) so no two neighbouring rows share a shade, percent + duration readout always visible next to every bar (the number carries precision where the bar is tiny), quarter ticks on the track turn the unused length into a measurable scale (lieflat 环境结构层: furniture rather than more data).
- **Empty right side solved structurally**: `@container/langs` + `@[1000px]/langs:columns-2` — on genuinely wide cards the list splits into two columns (column 1 = top ranks, column 2 = tail) so the card fills; below 1000px the single column keeps the track ≥ ~630px so the smallest bar stays a visible nub (8.4px at an 879px card).
- Entrance: IntersectionObserver reveal (threshold .25) with 55ms/row stagger; `motion-reduce:transition-none` for the reduced-motion path.
- 1229/1229 unit, tc/lint/build green; light + dark verified at 2100/2621 (cols 1/2, ramps correct).
### Language panel: completeness over truncation (user: "must see every language")

- **My error, corrected**: I had capped the list at 8 rows + Others. The user had already suggested internal scrolling in the original height feedback; I dismissed it on my own preference and substituted truncation — which is exactly what made languages 9+ invisible. Row caps removed.
- Now: **every language above the 0.1% floor gets a row**; the CARD bounds height (`max-h-[19rem] overflow-y-auto`), never the data. Verified with a 33-language account: 30 rows rendered (29 + Others), scrollHeight 768 vs clientHeight 304, card 397px; scrolling to the bottom hides both the fade cue and the "scroll for more" hint; the last row (Others 0.07% · 4m 48s) is reachable.
- Footer reports the listed count ("30 languages[ · scroll for more]") so the total is never a guess.
- Kept from the previous round: 8px capsules, longest-scaled bar length, rank luminance ramp (cycling after 8 stops so neighbouring rows stay distinct), quarter-tick rails, scroll-triggered entrance, and the Others hover list of folded names.
- 1230/1230 unit (new: no-cap 20-language case + count footer), tc/lint/build green; light + dark verified.
### Language list scroll area designed (user: default scrollbar was jarring)

- **Scrollbar follows the project's existing recipe** (TermsDialog.vue: `scrollbar-width: thin` + `scrollbar-color` + webkit fallbacks) extended to overlay behaviour: thumb fully transparent at rest, revealed on hover / `:focus-visible` / while `is-scrolling` (900ms idle timer in the component). A standing grey bar on a card reads as chrome; the edge fades and footer hint carry discoverability instead.
- **Scroll lane reserved** (`scrollbar-gutter: stable` + `pr-2`) — measured gap to card edge stays 36px and the readout column never shifts when the list starts overflowing. Chrome renders `thin` as an 11px lane (its webkit rules are ignored once `scrollbar-width` is set — same as TermsDialog).
- **Edge fades on both ends**, each shown only when it actually hides content (`atTop` / `moreBelow` tracked on scroll); card gradient vs `from-card` measured ~1.3% lightness apart, so the fade does not band.
- **Keyboard access fixed**: the scroll region is `tabindex="0"` with a `:focus-visible` inset ring (ring token at 45%) so WCAG 2.1.1 keyboard scrolling works — verified ArrowDown scrolls (80px) and focus-visible matches.
- 1231/1231 unit (new: scroll region is keyboard-focusable), tc/lint/build green; light + dark verified.
### Language panel: fade seam, value alignment, colour logic (3 user reports)

- **Fade seam (dark mode) — root cause**: the edge fades were painted overlays (`bg-gradient-to-b from-card`), but the card itself is a gradient (`from-card to-muted/40`) whose bottom is DARKER in dark mode — so the overlay's lighter `#191a1b` banded against it. Replaced with `mask-image` on the scroll viewport: a mask has no colour, so nothing can mismatch. Masks are applied per-edge via classes (`fade-top` / `fade-bottom`) so a short, non-scrolling list gets no mask at all (verified `maskImage: none` with 10 rows) and there are no duplicated gradient stops to clip a row.
- **Value alignment**: percent and duration now own fixed right-aligned lanes (`grid-cols-[5.5rem_minmax(0,1fr)_3.25rem_4rem]`, tabular-nums) instead of trailing each bar at a different x — measured identical right edges across rows (1435 / 1509 in both themes).
- **Colour logic (was "messy")**: the per-rank 8-stop ramp measured only 1.2-1.4:1 between neighbours AND cycled back to its first stop after 8 rows — no information, self-contradicting. Now colour encodes exactly one thing: rank 0 (the headline language) takes the brand accent, every other language is neutral, Others is the palest step. Contrast vs track — light 4.49 / 3.11 / 1.39, dark 4.87 / 3.87 / 1.59.
- 1232/1232 unit (new: headline-only-accent case), tc/lint/build green; dark + light verified.
### Language bars: one global gradient across the track (user's idea, adopted)

- Per-bar gradients replaced by a **single ramp spanning the whole bar region**: deepest at the track's left edge, brightest at its right edge. Implemented with `container-type: inline-size` on the track + `background-size: 100cqw 100%` on the bar — the bar paints a track-wide ramp and its own width clips it, so every row exposes the SAME scale (a long bar sweeps dark→bright; a short bar only touches the deep end).
- Pixel-verified: all rows start at the identical deep stop (#4338ca light / #6366f1 dark) while the right edge brightens with length (358px bar ends #7980e1 / #a2b1fc; a 72px bar ends #4d46ce / #6f74f3). Stops chosen so both ends clear 3:1 against the track (light 7.56 / 3.25; dark 4.19 / 9.39).
- Duration column widened (4rem → 4.75rem) + `whitespace-nowrap`; verified uniform 18px rows with zero wrapping across all 30 entries.
- **Process correction (user)**: only tear down services *I* started. Verified ownership by PID before killing; the 5173 server (46960, started 16:39) is the user's and was left running. A stale PID-file match is not proof of ownership — check the actual listener.
- 1233/1233 unit, tc/lint/build green; light + dark pixel-verified.
### Language bars: gradient restored (user: "渐变是渐变而不是分割", left end too dark)

- My stepped ladder was wrong twice over: discrete rungs read as SEGMENTS (a gradient must interpolate), and #1e1b4b at the deep end was near-black rather than brand indigo. Reverted to a smooth 3-stop gradient.
- **Stops copied from TrendChart** (the gradient the user pointed at as good): light `#3d49ad / #8290f0 / #8a97f2`, dark `#4a53b8 / #8290f0 / #b9c1ff`, offsets 0 / 48% / 100% mirroring the trend's own gradient — so both panels now speak one gradient language. Dark deep end nudged to `#4f58c0` purely to clear the 3:1 floor on the track.
- Kept the track-wide mechanism (`background-size: 100cqw`) so the sweep is one shared scale across the panel, per the earlier request.
- Verified by dense pixel sampling of the longest bar: 12 points climb continuously (`#3e4aae → #4a57ba → … → #8996f2`) with no jumps, and the left edge is indigo, not black. Dark: `#5059c1 → #b4bdfe`.
- 1233/1233 unit (assertion now also rejects stop-pair syntax so a future edit cannot silently re-segment the ramp), tc/lint/build green.
### Others row: design-system popover + same gradient (user feedback)

- **Native `title` replaced by the project Tooltip** (`@/components/ui/tooltip`, the AppHeader recipe): the aggregate row's hover now renders a structured popover — "N languages folded in" plus each folded language with its share (capped at 8, remainder reported as a count). Verified 146x108 with the design-system surface/radius/arrow, inverting correctly per theme (light: dark bubble, dark: light bubble). Rows without folded content render no popover (`v-if` on TooltipContent).
- **Others bar re-joined the gradient family**: it previously used a flat muted fill, which the user read as inconsistent with the language rows. It now paints the SAME shared ramp and steps back via `opacity: 0.75` — one gradient language across the panel, with the aggregate reading as part of the family without competing for attention.
- Tooltip DOM note: reka-ui mirrors the content into a 1x1 visually-hidden span for `aria-describedby`, so `textContent` reads doubled — the visible popup is single. Not a duplication bug.
- 1233/1233 unit (assertions updated: gradient + `lang-bar--aggregate` class, and no native title), tc/lint/build green; light + dark verified.
### Others bar: opacity removed (user: colours still differ)

- Root cause was my own addition: `opacity: 0.75` on `lang-bar--aggregate`, which dimmed the aggregate's gradient by 25% — the user's "others 的渐变颜色跟其他不一样" was exactly this. Removing it also removes a self-contradiction: the panel's premise is that colour carries NO data (length + label do), so tinting the aggregate could only re-imply "colour means something".
- Verified: 30 rows report ONE unique `backgroundImage` string and a single opacity value (1) — the aggregate is now painted byte-identically to every language row. Dead code (`isOthers` field, the empty modifier class) removed with it.
- 1233/1233 unit (assertion now compares the aggregate's gradient string against a language row's and forbids opacity), tc/lint/build green.
## Recent Activity (v0.28.1 — 2026-09-04)

### Placeholder removal + route blank-view guard (user: "只留开发过的")

- **Removed**: 4 `DistributionPanel` placeholders (LANGUAGES/PROJECTS/IDES/WEEKDAY — pure `{{ title }} chart` text) from `DashboardHome`; `DistributionPanel.vue` deleted (zero references after removal — verified). StreaksPanel KEPT (has own query + ChartSection tri-state + 3 e2e layout assertions in `heatmap-layout.spec.ts`).
- **Layout**: orphaned rows collapsed — Coding trend + Time-of-day each take a full row until their row partners ship ("no placeholders, slot in as siblings").
- **Blank-view guard (user: "偶发空白页")**: root cause = async route chunks can pend/fail with no fallback (`App.vue` had bare `<RouterView/>`; `onErrorCaptured` never fires on pending, only on throw). Fix: `RouterView v-slot` + `<Suspense>` skeleton fallback (`route-loading` testid); chunk double-failure now dispatches `chunk-load-failed` → App listens → persistent toast with Retry (was a silent `console.error`).
- **Import-loss incident resolved** (the "disordered cards" hunt): restored `DistributionPanel/StreaksPanel` imports swallowed by an earlier edit; re-measured 2-col at 1600px — all 10 live cards pair at equal y.
- **Verification**: tc 0, lint 0, 1222/1222, build green. 0.28.0 → 0.28.1 (PATCH).

## Recent Activity (v0.28.0 — 2026-09-04)

### TimeOfDayPanel: time of day distribution (4-bucket capsule strip)

- **Data**: `GET /stats/distribution?type=TIME_OF_DAY` (full history — endpoint has no start/end; requirement text handed to user for backend). Buckets by session START hour in aggregation timezone (ctt-server `TimeOfDay.fromHour`, verified from source R13).
- **KEY CONTRACT GOTCHA (the "all zeros" bug)**: backend returns bucket names as UPPERCASE enums (`EVENING/NIGHT/...` — `StatsService` uses `.name()`); the first implementation matched `'Night'` title-case and every lookup missed → all zeros. Fixed: `BUCKET_ORDER` uses enum keys + `BUCKET_LABEL` maps display names (legend/a11y/tooltip all consume the label). Tests rewritten on the enum contract so a case drift on either side goes red.
- **Design (chart-designer + lieflat-charts audit, user rejected donut v1)**: horizontal 100% stacked capsule — segment width = duration (honest part-to-whole), single-hue indigo ramp following the daylight metaphor (Night deepest → Daytime brightest), ALL text in HTML (legend 2-col + Total; canvas draws only the strip + tooltip — canvas glyphs in a half-width card were the v1 "messy text" failure). Zero-width segments drop out with rounded-end reattachment; lone segment fully rounded (regression-tested).
- **echarts-setup**: PieChart/LegendComponent registered for v1 donut then removed after redesign (no consumers — BarChart stacking reuses existing registration).
- **Component**: `TimeOfDayPanel.vue` (pure renderer; ChartSection three-state in DashboardHome `TIME_OF_DAY` slot). prefers-reduced-motion honored; aria-label carries bucket %s + total.
- **Tests**: +7 (init once, stacked clock order with zero-drop, lone-segment rounding, 100% single bucket, a11y label, zero-dash, dispose). 1222/1222, lint/tc/build green.
- **Verified live** (bootstrapped account, 4 sessions seeding all buckets UTC+8): strip widths match durations exactly (2h/28% · 1h30m/21% · 45m/10% · 3h/41%, Total 7h15m), light theme screenshot-checked. 0.27.0 → 0.28.0 (MINOR).
- **Layout incident (user: "卡片位置是乱的")**: `DashboardHome.vue` had silently lost its `import DistributionPanel` + `import StreaksPanel` lines — an earlier `PUT 1.=10:` JSDoc rewrite covered the import block and the auto-repair echo dropped them. Vue renders un-imported components as empty native custom elements with NO runtime warning → 5 cards vanished, right column collapsed, grid looked "disordered". Fixed by restoring the imports; TimeOfDayPanel reverted to a pure renderer with DashboardHome owning the `timeOfDay` query + ChartSection three-state (HourlyPanel mount-order precedent). 2-col layout re-measured at 1600px: all 10 cards render, rows pair at equal y. **Lesson: after ANY edit-tool warning that mentions dropped/echoed body lines, re-read the touched region — a swallowed import is a silent runtime failure type-check cannot catch (vue-tsc passes because the template's component refs resolve through script setup scope only when imported).**
- **Pending Phase 2**: distribution `start/end` passthrough once backend ships it (hourly v0.64.0 pattern; `StatsFilterParams` already carries the keys).

## Recent Activity (v0.27.0 — 2026-09-04)

### formatDuration: hours-capped with seconds precision

- **Root cause**: `formatDuration` in `src/lib/utils/time.ts:73` allowed days (`Xd Yh`) and truncated seconds (`61s → '1m'`)
- **Fix**: removed day branch, preserved seconds precision, omitted zero values (`24h` not `'24h 0m 0s'`)
- **Impact**: 6 consumers unified (SummaryCards + 4 chart tooltips + barrel export)
- **Tests**: time.test.ts (15 cases) + SummaryCards.test.ts (3 cases) updated
- **Verified**: 1215/1215 tests pass

## Recent Activity (v0.26.0 — 2026-09-04)

### HourlyPanel date-range wiring (backend v0.64.0)

- **Root cause (Spec review finding)**: HourlyPanel had its own `useStatsHourly` query that didn't receive `start`/`end` props, so the chart always rendered all-history data regardless of filter range. DashboardHome's query was only used for ChartSection's loading/error/empty states.
- **Fix**: Added `start?`/`end?` props to HourlyPanel (string | null), threaded into internal `useStatsHourly` computed. DashboardHome passes `:start="start ?? undefined"` `:end="end ?? undefined"` from filter bar state. Now both queries share the same range — single source of truth.
- **API layer** (`lib/api/stats.ts`): `StatsFilterParams` extended with `start?`/`end?`; `filterQuery` transmits them to backend.
- **Composable** (`composables/useStats.ts`): `STATS_QUERY_KEYS.hourly` now takes `(start, end, filter)`; `useStatsHourly` signature updated to `{ start?, end? } & StatsFilterParams`.
- **Backend verified** (ctt-server v0.64.0, user-relayed): `GET /api/v1/stats/hourly` accepts optional `start`/`end` (yyyy-MM-dd), clips sessions to `[start, end]`, `activeDays` reflects window-only count, invalid range → 400 COMMON_003. Verified live: 2025-06-15 + 2026-01-15 sessions → activeDays=2 unfiltered, activeDays=1 with `start=2025-06-01&end=2025-12-31`.
- **JSDoc fix**: HourlyPanel header docblock updated (was stale: "no date-range param — all history"; now cites backend v0.64.0).
- **Tests**: 1215/1215 (no new tests needed — existing HourlyPanel mocks cover the wiring; range propagation verified via live backend probe).
- **Verification**: vue-tsc 0, lint 0, build green. Full suite 1215/1215. Version 0.25.0 → 0.26.0 (MINOR, feature: hourly date-range support).

## Recent Activity (v0.25.0 — 2026-09-03)

### HourlyPanel: average hourly coding duration (24-bar chart)

- **Data**: reuses the existing `GET /stats/hourly` (per-hour averages + activeDays; backend v0.64.0 now accepts optional `start`/`end` to clip sessions). No new endpoint.
- **Component**: HourlyPanel.vue placeholder → live ECharts bar chart — 24 bars (hour 00–23, missing hours zero-fill), DESIGN.md indigo vertical gradient (bright top `#7b85e0`/`#5e6ad2` → deep base), rounded bar tops (heatmap cell language), Y axis reuses the shared `getHourAxisScale` (readable hour steps, explicit interval — peak never rides the top), X labels every 3h, tooltip `09:00 — 1h 15m coded`, footer `based on N active days`.
- **Shared-axis extraction + the "0/8/16 h" root cause (user round 1)**: TrendChart's local `getYAxisScale` extracted to `components/axis-scale.ts` as `getHourAxisScale` — consumed by TrendChart AND HourlyPanel. **Root cause of the user's "0 / 8 / 16 h" axis**: HOUR_STEPS bottomed at 0.25h with an 8h fallback — a minute-scale peak (90s avg = 0.025h) hit no step and fell to the 16h fallback axis. Fixed: HOUR_STEPS widened to 0.01h (36s) … 24h; getHourAxisScale(90s) → step 0.01h, 3 ticks, max 0.03h (exactly the plugin's scale for the same data). `formatHourLabel(seconds)` / `formatHourLabelHours(hours)` added — the old local `hourLabel` (which divided by 3600) was lost in the extraction, making labels read "108 h" instead of "0.03 h"; both panels consume the s…
- **Architecture fix (chart-render bug found in browser QA)**: HourlyPanel originally wrapped its own ChartSection — on mount the query was still pending so the section rendered the loading branch and the chart's `ref` container was never mounted (`container.value === null`, init skipped forever). Fixed to the project's panel pattern (same as WeekHourPanel/TrendChart): HourlyPanel is a PURE chart component, DashboardHome owns the hourly query + ChartSection three-state wrapper (loading/error/empty/retry).
- **echarts-setup**: +BarChart registration (tree-shaken alongside LineChart).
- **Tests**: +6 HourlyPanel component cases (init once, 24 bars zero-fill, Y scale headroom, a11y label with active-days, footer note, dispose).
- **Verified live** (real backend, seeded 5 non-zero hours): gradient bars with rounded tops, Y 0–1h 0.25h steps, X 00:00/03:00/… labels, footer note, both themes. Full suite 1215/1215 (+6), lint/tc/build green. Version 0.24.0 → 0.25.0 (MINOR, new chart).


## Recent Activity (v0.24.0 — 2026-09-03)

### WeekHourPanel: weekly coding activity by hour (7×24 heatmap)

- **Backend (ctt-server v0.63.0, user-relayed, NOT touched by me)**: `GET /api/v1/stats/week-hour` — sparse non-zero (dayOfWeek×hour) cells + weekdayCounts divisors; params timezoneOffset/start/end/deviceId/ideName (window optional = all history). Verified live: 10:30–12:15Z UTC+8 → hour 18/19/20 = 1800/3600/900s three cells + cross-day split (R13 probe with fresh account).
- **Contract layer**: `WeekHourStatPointSchema` + `WeekHourResponseSchema` (stats.schema.ts); `getStatsWeekHour({start?,end?}+filter)` (stats.ts, mirrors heatmap's optional-window pattern); `STATS_QUERY_KEYS.weekHour(start,end,filter)` + `useStatsWeekHour` (MaybeRefOrGetter, 60s staleTime).
- **Matrix builder** (`components/week-hour-matrix.ts`): `buildWeekHourMatrix` zero-fills the full 168-cell grid from sparse points (weekdayCounts divisor per cell, normalized to ISO key order regardless of backend Map iteration order); `WEEKDAY_LABELS` Mon-first; 6 unit tests.
- **Layout (user round 3)**: moved from a full-width row to a two-column row paired with HourlyPanel (both hour-dimension); Project distribution relocated to the Time-of-day row (fills its empty half). Week-hour canvas at half-card ~627px still yields square cells (cell clamped 8–26).
- **Rendering rewritten after user correction ("I clearly didn't study the plugin panel")**: native ECharts `heatmap` was WRONG on two plugin-fidelity axes — (a) FIXED bucket ladder vs the plugin's DYNAMIC scale, (b) rectangular cells. Final: ECharts **custom series with manual pixel layout** (same architecture as the main HeatmapChart) — **square cells** sized from the container width, centered via leftover-width split, and the **plugin's calculable visualMap** (continuous, vertical, right rail, min 0 → max=window peak) owns the color: `renderItem` uses `api.visual('color')` so dragging the scroll bar re-shades cells live. Legend shows the dynamic readout (`0 … maxH`). maxHoursLabel uses adaptive precision (3 decimals below 0.1h — a 10min peak reads "0.17 h", never "0.0 h").
- **Headless note**: the calculable handle drag cannot be automated in headless CDP (zrender gesture events don't fire) — verified the scroll bar renders (dual handles + ramp + 0/maxH ticks) and `api.visual` colors are live (value↔shade exact); handle interaction is ECharts' built-in `selectDataRange` action (ContinuousView), left for real-browser manual check.
- **3D lift (user round 4)**: cells carry `emphasis.style { shadowBlur: 10, shadowColor: palette.cellShadow, shadowOffsetY: 2 }` (dark rgba(0,0,0,0.55) / light 0.28) — the plugin's pop effect; visualMap `hoverLink: true` lifts cells in the hovered scroll-bar value range through the same emphasis state. Browser-verified: hovered cell (Tue 20:00) lifts with a clear drop shadow, neighbors stay flat.
- **Dynamic-scale semantics note**: a session is hour-sliced, so a single cell ≤ 1h (4h session → 4×1h cells); maxSeconds stays ≤ 3600s per single-week window, but multi-week windows shift cell averages via weekdayCounts — the shade moves with the window, as the plugin does.
- **Verified live** (real backend): square cells (pixel-measured 23×23), 7×24 complete, dynamic colors via api.visual exact (Tue 19=3600s deepest, 18=1800s / Wed 8=600s paler), hour labels, Mon→Sun order, tooltip, centered, two-column layout (grid lg:grid-cols-2 with HourlyPanel). Filter bar This-month writes `?start&end` and re-fires week-hour with the window. Full suite 1209/1209 (+6 matrix tests), lint/tc/build green. Version 0.23.0 → 0.24.0 (MINOR, new panel).

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
