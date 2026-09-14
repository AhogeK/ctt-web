# achievements — principles

## P1. A trophy is a (family, window) ladder, not a badge

The API returns **67 badges** (v0.71.0) across **14 ladders** — 7 lifetime families of 5–9 tiers
plus 7 windowed ladders of 2–3. The measured value is **per (family, window)** — verified against
a real account: every `STREAK_*` badge reported `progress = 7`, every `TOTAL_*` badge `460860`.

So one card per badge would print the same number many times over and imply dozens of independent
goals. Render **one trophy per (family, window)**, carrying its ladder. A badge is a rung; a trophy
is the object.

The grouping key is **(family, window), never family alone** — `TOTAL_SECONDS` has five independent
ladders whose `tier` each restart at 1, so grouping by `type` folds the 3 daily rungs into the
lifetime ladder as tiers 9–11.

## P2. Progress is measured between rungs, never against the current rung alone

A bar drawn as `progress / currentTier.target` reads 100% the instant that rung unlocks and says
nothing about what comes next. Draw it across the **span the reader is currently travelling**:
`(progress - current.target) / (next.target - current.target)`.

Consequence to expect: a trophy that just cleared rung 7 of 3/7/30 legitimately shows **0%**. That
is honest — the reader has just started the 7→30 leg — and it is the same number an
"X of Y to next tier" line would give.

## P3. Rank is carried by fill — and the accessible colour is the only colour

`DESIGN.md` is explicit: the palette is almost entirely achromatic, brand indigo is the only
chromatic colour, and it must not be used decoratively. Trophy rank is exactly where that rule gets
broken with bronze/silver/gold.

The first attempt kept one colour family but graded it by **walking the indigo ramp's bright end** —
and failed accessibility on measurement: the dark-mode stop `#b9c1ff` sits at **1.73:1** on a light
card, far under the 3:1 floor for non-text graphics, so a maxed trophy was nearly invisible in light
mode. Substituting the "correct" light stop `#8a97f2` only reached **2.70:1**: the real fault was
encoding rank as **luminance**, a quantity whose direction must invert between modes.

So the two signals are split, and neither is a second palette:

- **Stroke = accessibility, and it is always `#5e6ad2`.** The project's own brand indigo measures
  **4.70:1 on white and 3.71:1 on the dark surface** — the one value in the palette that clears 3:1
  in *both* modes — so it needs no mode branch at all.
- **Fill opacity = rank** (0 / .2 / .45 / .85). "How far along" stays legible without a ramp.
- A completed ladder adds a ring; locked also thins the stroke and drops to the muted foreground,
  deliberately redundant so "nothing earned" survives greyscale.

Contrast is computed, not eyeballed: `ratio(fg,bg)` over the real surfaces, both modes, for every
stop considered. Any future grade change gets the same treatment before it ships.

## P4. An unrecognised badge renders; it is never dropped

Grouping is a **partition** — every badge lands in exactly one trophy — so nothing can be lost.
A family this build has no entry for still produces a trophy, labelled with the server's own badge
name (single-tier) or its `type` (multi-tier) and drawn with `generic` artwork.

This is what makes "new achievements slot in seamlessly" true: since v0.71.0 the server ships
`type` and `tier`, so a new badge joins its ladder **with no frontend edit at all** — only its
label/artwork, if the family is new to this build, come from a declaration. See `scenarios.md` S1/S2.

## P5. The server owns thresholds; the frontend owns only identity and presentation

Tier thresholds are read from each badge's own `target`, never copied into the code. A rebalance on
the server therefore flows through with no frontend change. Since v0.71.0 the same holds for
**grouping and ordering** — `type` and `tier` arrive in the response — so the declarations hold
**only** what the server cannot express: trophy label, blurb and artwork.

## P6. Period windows: resetting goals now exist, and must be visibly separate

**Resolved in v0.71.0.** This principle used to record a measured terminal state — a normal active
account reached 12 of 15 tiers with nothing left, and the page then reported a number that could
never change, because all seven families were lifetime-cumulative with no reset concept server-side.

The backend closed it by adding **windowed ladders**: `window` is now
`LIFETIME | DAY | WEEK | MONTH | YEAR`, 16 of the 67 badges reset, and the response carries the
concrete range (`windowStart` / `windowEnd`, null for LIFETIME). The set is no longer exhaustible.

Design rules that survive, plus what was learned implementing them:

- A resetting trophy's `target` is still a plain threshold; only its **window** differs. Confirmed:
  the model needed one extra notion (the window), not a new rendering path.
- **A reset must be visible.** A trophy that silently drops to 0 on the 1st reads as data loss, so
  the card names its window (`This week`) and the page groups the resetting ladders into their own
  section, titled "Current period" and captioned "Resets when each period ends". Lifetime leads
  expiring goals sit below it. In one undifferentiated grid the two read as the same kind of goal.
- **The window is what distinguishes same-family ladders.** Five `TOTAL_SECONDS` ladders are all
  labelled "Total time"; without the window noun five cards look like duplicates.
- **Keep a lifetime ladder of each family beside its periodic ones** — asked for, and honoured: every
  windowed family except `ACTIVE_DAYS` also has a LIFETIME ladder, so rolling a period never erases
  long-term progress. `ACTIVE_DAYS` is the deliberate exception (periodic-only).

Windows are computed **server-side** in the requested timezone (`timezoneOffset`), with ISO weeks —
across a year boundary a week keeps one identity (2025-12-29 and 2026-01-04 are both `2026-W01`).

### The deadline belongs to the window, not the trophy

Every tier in a window resets at the same instant, so the range and the countdown are rendered
**once on the window's group header**, never per card. Putting them on cards duplicates one fact
two-to-three times per group and implies each card has its own expiry.

Consequence: the page's "Current period" section is **one sub-section per window** (Today / This
week / This month / This year), not a single grid. A grid holding four different expiry moments is
the same category error the lifetime/period split removes, one level down.

### Urgency is stated in words, and emphasis is a token swap, never a new colour

A countdown is a fact, not an alarm. `DESIGN.md` has no "urgent" hue — its status colours (green
`#27a644`, emerald `#10b981`) mean *success*, and P3 records what a bespoke urgency colour cost last
time (a mode-dependent ramp that failed contrast in light mode at 2.70:1). So the closing stretch —
`isClosing(daysLeft)` = today and tomorrow — is emphasised with **existing tokens only**:
`text-muted-foreground` → `text-foreground` **plus** a dotted underline. Two signals and neither is new
colour, so it survives greyscale. Both tokens are mode-aware and invert correctly between
modes because both tokens are mode-aware (measured: `#62666d` light / `#8a8f98` dark for muted,
`#08090a` / `#f7f8f8` for foreground).

The wording carries the urgency instead: `Ends today` for 0 days, not "0 days left" — the latter
reads as expired when the window is still live for the rest of the day.

**Weight is not available as a signal**: the page declares `font-family: Inter` but never loads it
(no `@font-face`, no font file, no fontsource package), so every `font-*` utility computes to the
fallback's single 400 face — measured, `font-semibold` on the h1 and h2 also reports 400. An emphasis
that only raises weight would be invisible. Underline/decoration is the reliable non-colour cue.

See `references.md` for the full ladder table.

## P7. Ordering compares fractions, never raw distances

`next.target - progress` is not a comparable quantity across families — it subtracts *days* from
*months* from *seconds*. Sorting on it put a barely-started calendar trophy ahead of one that was
80% of the way to its next rung (observed on real data). Order by the **unit-free fraction** that
P2 defines, so the ordering and the bars can never disagree.

Completed trophies sort last: the page should open on something the reader can act on.
