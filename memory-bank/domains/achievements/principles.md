# achievements — principles

## P1. A trophy is a family, not a badge

The API returns 15 badges. They are **7 families of 2–3 tiers**, and the measured value is
**per family** — verified against a real account: all three `STREAK_*` badges reported
`progress = 7`, all three `TOTAL_*` badges reported `460860`.

So one card per badge would print the same number five times and imply 15 independent goals.
Render **one trophy per family**, carrying its ladder. A badge is a rung; a trophy is the object.

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

The server can ship a badge this build has no declaration for. Showing nothing would make a real
unlock invisible; showing it wrongly under another family would be worse. It becomes **its own
single-tier trophy**, labelled with the server's own `displayName`.

This is what makes "new achievements slot in seamlessly" true without a frontend release: a new
badge on an existing ladder appears at once (as its own trophy) and joins the shared ladder the
moment a declaration claims its code. See `scenarios.md` S2.

## P5. The server owns thresholds; the frontend owns only identity and presentation

Tier thresholds are read from each badge's own `target`, never copied into the declarations. A
rebalance on the server therefore flows through with no frontend change. The declarations hold
**only** what the server cannot express: family grouping, trophy label, blurb, and artwork.

## P6. A trophy system with only lifetime goals has a terminal state

All seven backend families are **lifetime-cumulative** — verified: `AchievementType` is
`STREAK / TOTAL_SECONDS / LANGUAGE_COUNT / EARLY_BIRD_DAYS / NIGHT_OWL_DAYS / MAX_DAILY_SECONDS /
PERFECT_MONTH`, none of which resets. The only calendar word in the source is `PERFECT_MONTH`'s
description, and no period/reset concept exists server-side.

Consequence, measured: a normal active account reaches **12 of 15 tiers** with nothing left to earn
and no reason to return. The page then reports a number that can never change.

Presentation cannot fix this — no rendering of a fixed, exhausted set stays interesting. The
achievement set needs **resetting goals** alongside lifetime ones:

| Horizon | Example | Resets |
| --- | --- | --- |
| Daily | Code 2h today / start before 09:00 | every local day |
| Weekly | 5 active days this week | every ISO week |
| Monthly | 20 active days this month / 40h this month | every calendar month |
| Yearly | 200 active days in 2026 / 1,000h in 2026 | every calendar year |
| Milestone (lifetime) | existing 15 | never |

Design rules if they arrive:

- A resetting trophy's `target` is still a plain threshold; only its **window** differs. So the
  model needs one extra notion — the window a trophy's progress is measured over — not a new
  rendering path.
- Window labels must be **local** (`August 2026`, not `2026-08`), matching every other panel, which
  localises through `timezoneOffset`.
- Reset must be visible: a trophy that silently drops to 0 on the 1st reads as data loss unless the
  card says which window it is measuring.
- Keep a lifetime tier of each family beside its periodic ones, so long-term progress is never lost
  when a period rolls over.

See `references.md` for the backend requirement text and the materialized-daily basis that already
exists to compute these.

## P7. Ordering compares fractions, never raw distances

`next.target - progress` is not a comparable quantity across families — it subtracts *days* from
*months* from *seconds*. Sorting on it put a barely-started calendar trophy ahead of one that was
80% of the way to its next rung (observed on real data). Order by the **unit-free fraction** that
P2 defines, so the ordering and the bars can never disagree.

Completed trophies sort last: the page should open on something the reader can act on.
