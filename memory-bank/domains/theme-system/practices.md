# theme-system · practices

## Dark regions

| Layer | Token | Value | vs. the layer below |
| --- | --- | --- | --- |
| Canvas — main content | `--background` | `#08090a` | — |
| Navigation, sidebar, panels, muted blocks | `--secondary` · `--muted` · `--sidebar` | `#131419` | **1.08:1** (was `#1f2023`/1.22:1 until the night-calibration pass, 2026-09-26) |
| Top bar (app shell) | **same tone as the content** — `AppHeader` stays `bg-background` | `#08090a` | a full-width lighter chrome bar reads worse than the sidebar does: it sits *between* the eye and the content. Tried and reverted 2026-09-26 ("顶部不同色反而变得好丑") — the header keeps only its hairline `border-b`. |
| Cards, panels, dropdowns, popovers | `--card` · `--popover` | `#101116` | **1.06:1** over the canvas — the plate is nearly black on purpose; its read comes from the rim, the gloss and the shadow |
| Structural border | `--border` · `--input` · `--sidebar-border` | `rgba(255,255,255,0.12)` | the card's rim; never the load-bearing cue |

## The dark card: resting-state craft only

**User ruling (2026-09-26): "只打磨静止态（不加 hover 光）".** No pointer tracking, no hover glow, and no
brand colour on cards — the accent budget belongs to CTAs and active states. Three quiet cues, all at rest:

| Cue | Value | Rendered | Perceptibility |
| --- | --- | --- | --- |
| Fill | `--card` / `--popover` = `#101116` | 1.06:1 over the canvas | the plate is near-black **by design** |
| **Material grain (the "体感" cue)** | an inline SVG `feTurbulence` noise, desaturated, 5 % rect opacity over a 140 px tile | ~2–3 % effective, invisible in values but breaks the flatness | a near-black perfectly flat fill reads as *paint*; grain makes it read as a **material** — and it removes gradient banding as a side effect |
| Top light | `linear-gradient(180deg, white 0.07 → 0.02 at 42% → 0 at 74%)` | top 1.22:1 over the canvas | the plate lifts at the top; **there is no bottom half** — a surface that "sinks" has no range left on a near-black canvas |

| Edge light | `inset 0 1px 0 rgba(255,255,255,0.08)` top, `inset 0 -1px 0 …0.06` bottom | 1.22:1 / 1.15:1 on the card | the top line is just past the perceptible floor |
| Sink | `0 1px 2px rgba(0,0,0,0.5)` + `0 18px 44px -22px rgba(0,0,0,0.85)` | — | reads as "sitting above the page" |
| Rim | a 1px masked gradient ring on `::before`: `white 0.19 → 0.12 at 34% → 0.07` | 1.95:1 at the top edge, 1.26:1 at the bottom | lit from above; in dark the flat `--border` is set transparent so exactly one rim is drawn |

Rules that produced this, each paid for:

1. **Resting only.** Application cards are static containers, so a hover light has no "why does this
   animate" — and the login showcase's indigo sheen + tilt are *its own* identity. Copying them was both a
   misread of the request ("我的意思并不是让你抄") and a spend of the accent budget.
2. **A hard band at the top is "突兀".** The rejected version put 13–16 % white in the top 9 % of the card
   (1.47:1 on the card). Its replacement keeps the same idea at half the strength with a long falloff.
3. **A cue below the perceptible floor is decoration.** The first pass shipped 0.05 / 0.028 lines (1.12:1 and
   1.06:1) and a review called them "effectively a no-op"; the shipped values sit just above 1.2:1.
4. **"深度" means the *feel* of the material, and the plate must FLOAT.** (User, 2026-09-26: "肯定是浮起来的效果比沉下去的效果好…我说的'深度'是那种高级的体感，不是沉下去的意思".) A "sinking" reading was my misreading and is also physically unavailable here: darkening a `#101116` plate toward a `#08090a` canvas has 1.06:1 of range in total (a 30 % black gradient measured 1.02:1 — invisible). The material cue that *is* available is grain plus a top light.
5. **Depth = light on the edge + a long shadow falloff.** The layered sink runs `0 1px 2px .5` → `0 12px 28px -18px .8` → `0 34px 80px -40px .95`; on a near-black canvas the shadow is the weak cue, so the rim carries the elevation.
5. **Static captures cannot judge 1 px cues.** Compressed screenshots resolve neither 1 px insets nor the
   bloom's falloff — that verdict is the user's, on their panel; the capture only proves nothing is *abrupt*.

## Hierarchy: the frame's edge must be at least as strong as the content's

Measured 2026-09-26, after a round where the cards "抢占了 navigation" ("色差太重…强烈的视觉冲突感"):

| Edge | Alpha | Against its own surface |
| --- | --- | --- |
| Sidebar / chrome border (the token) | 0.12 | **1.45:1** |
| Card rim — **rejected** | 0.19 | 1.77:1 ✗ the content edge out-shouted the frame |
| Card rim — **shipped** | 0.13 | **1.43:1** ✓ just under the chrome |

Only the **edge** was the problem: the card's fill step stayed at 1.06:1 throughout, so "色差太重" was never
about fills — and the two 1px inset edge lights that had accumulated on top of the rim were removed rather
than tuned (they were the actual overshoot). The chrome's own tone was left alone: the user had already
accepted it, and trimming it would have moved the goalposts instead of fixing the inversion.

## Never reset a stored theme choice on mount

**Rule**: page-load initialization may only *adopt* the system preference when the visitor has never chosen
one. `App.vue`'s mount runs on **every** full load, and an OAuth sign-in is exactly that (`location.href`
out, a fresh document back) — the unconditional `setTheme('auto')` that used to live there silently
overwrote a stored choice ("I switched to dark on the login page and it came back as system once I signed
in", 2026-09-26).

- Either stored key counts as a choice: `theme-appearance` (this store) and `vueuse-color-scheme` (read by
  `useDark` **and** by the first-paint script `public/theme.js`).
- The fix lives in the store (`initTheme()`), not in `App.vue`, so the key names have one owner.
- Regression tests in `src/stores/__tests__/theme.test.ts`: a stored dark survives and `matchMedia` is never
  consulted; a legacy `vueuse-color-scheme`-only choice survives; a fresh visitor still adopts the system.
- Browser replay of the exact sequence (login → one toggle to dark → sign in → reload) asserted
  `html.class`, `theme-appearance` and `vueuse-color-scheme` at each step.

## Lowering the surfaces: the edges and lights must come down with them

Measured 2026-09-26, after "到了晚上…太亮了，没有黑色高级感": every *surface* dropped one notch (chrome
1.22 → 1.08:1, cards 1.06 → 1.02:1) while the canvas stayed at `#08090a` and every text token was left alone
(5.66–18.37:1 on the new surfaces).

The rule this pass established: **when a surface gets darker, the same alpha on its border and light gets
*stronger* relative to it** — 0.12 hairline read 1.40:1 on the old chrome and would have read even higher on
the new one, so the token went to 0.09 and the card rim to 0.095. Light cues move with their surface or they
silently become the brightest thing on screen again.

Why one notch is enough at night: contrast sensitivity rises as the room darkens, so a *smaller numeric step*
still reads as a layer. The ladders here are 1.02 / 1.08 / (canvas) — deliberate, and judged on a real screen,
not in a bright room.



- **Grey-ish region fills are wanted** for *regions* (navigation vs main) — an earlier note generalised a
  light-theme button complaint into "never lift a dark surface with grey" ✗, which the user corrected
  ("本质没解决区块间的色差问题，比如 navigation 跟主区域"). What is rejected is (a) borders as structure and
  (b) pale matte *cards*.
- **`--surface` (`rgba(255,255,255,0.02)`) stays** — marketing token for the frozen landing page.

## Known open items (measured, not fixed)

- **Gloss ceiling:** shipped specular is read as "satin" by a screenshot review. Levers not yet used: a
  tighter/brighter top band, or a *pointer-tracked* reflection (the auth showcase already has that pattern).
- **Achievement "locked" cards** carry `opacity-70` on the whole card, dimming text with it (`3.02:1` on the
  old card, better now): fix belongs to the achievements page semantics and needs a user ruling.

## Remaining levers for more "depth" (not pulled)

In order of what they cost:

- **Rim alpha** — the cheapest: the top stop is 0.19 today (0.16 in the first depth pass); a 1px line at 0.19 does not read as the "突兀" band that 0.13 over a 9 %-tall strip did, so there is room.
- **Card fill step** — `#101116` is 1.06:1 over the canvas. Raising it is the robustness lever the reviews keep naming ("the plate effect collapses on a low-contrast display"), but `#191a1e` (1.11:1) and `#32333a` (1.59:1) were both rejected as "太白", so any move here needs the user's eye first.

## Default stays `auto`; light gets its own material (2026-10-02)

**A dark first-visit default was tried and rejected the same day.** The attempt read a line in the landing
plan's direction table ("已决：首次呈现用深色") as a settled user decision; the user's response was
"还有这个拍板？不行不行，得改，默认就系统" — the default is `auto` (follow the system). The code, the
first-paint script and the store test are all back to that. The lesson travels with the rejection: **a line
I wrote in a plan is my record, not the user's mandate** — treating it as one cost a rework cycle.

**What the attempt taught, still worth keeping** (measured, not theorised): VueUse writes its own defaults
into storage the moment the store is created — `vueuse-color-scheme` → `auto`, `theme-appearance` → `auto` —
so any "the visitor never chose" test in `initTheme()` is already false by the time it runs. Making a
first-visit default actually stick needs the first-paint script (`public/theme.js`) to seed storage *before*
the store exists, and seeding both keys to keep the mode menu honest. That machinery is gone with the
rejected default; this note is what remains, for anyone who tries again.

**Light-mode card material** (`main.css`, marketing scope only) — kept, and independent of the above. Dark
cards carry grain + top light + a masked rim; light cards had nothing and read as rectangles on a
248-luminance canvas. The values are the §6 ladder verbatim: the Level 1 contact layer plus the multi-layer
dialog stack. Selector:
`:where(:root:not(.dark) [data-surface-scope='marketing']) :where([data-surface='card']:not(.hero-plane > *))`.

- `:where()` is discipline, not style: an earlier attempt used a (0,3,0) selector that beat the hero panel's
  positioning guard and dropped the panel back into the document flow. (0,0,0) unlayered still outranks every
  Tailwind utility, and can never outrank the (0,2,0) guard.
- The scope lives on the marketing shell (`data-surface-scope="marketing"`), so the auth pages' frozen light
  items and every dashboard surface are untouched by construction (verified: the login page has no scope
  ancestor, and no `data-surface='card'` element at all).
- The hero's two plates are excluded — they keep their own `shadow-2xl` / brand shadow.
- Accepted cost: inside the scope a `hover:shadow-sm` utility is inert (unlayered beats layered). The demo
  tiles are display-only; the dashboard copy of the same component keeps its hover.

**Measured (1440×900)**: light canvas `rgb(247,248,248)` with 11/11 marketing cards carrying the stack; panel
`position: absolute` in both themes; geometry identical to the review baseline and identical between themes
(plane 306/567/735×629, panel 112/834/363×322); overflow 0; 0 `<img>`, 0 `<canvas>`. After the revert the
first-visit default is `auto` again — the store test asserts that the system preference is adopted and
`matchMedia` is consulted.
