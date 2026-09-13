# achievements — scenarios

## S1. Adding an achievement to an existing family

Server ships `STREAK_365` (type `STREAK`, target 365).

Until a declaration claims it, it renders as its own single-tier trophy labelled "365-Day Streak" —
visible, never lost. To fold it into the ladder, append the code to `TROPHY_FAMILIES`'
`streak.codes` array. That is the **only** edit: threshold comes from the payload, artwork from the
family.

Order in `codes` is ascending threshold — a code placed out of order silently mis-renders the rung
strip and inverts the tier count.

## S2. Adding a whole new family

Needs one declaration (key, label, blurb, art, codes) and, if the shape is new, one path set in
`TrophyMedal.vue` plus a `TrophyArt` member. Until then the artwork falls back to `generic` — a
badge outline — so the trophy still renders legibly.

## S3. The API starts sending `type` (and ideally `tier`)

Then the declarations stop doing *matching* work and become pure presentation metadata (label,
blurb, artwork). Group by the server's `type` instead of by a code list; drop `codes`. Call sites do
not change — `buildTrophies(badges)` keeps its signature.

Prefer this: it removes the last piece of duplicated knowledge and makes S1 a no-op.

## S4. A tier's threshold is rebalanced

Change nothing here. `target` is read per badge from the response (P5); the bar, the "N / M unit"
line and the ordering all recompute. Only re-check that the `codes` array ordering still matches the
new ascending thresholds.

## S5. A progress value looks wrong (reads 100% immediately, or 0% when nearly there)

Check which of the two it is, because they have opposite causes:

- **100% on an unlocked rung** → something is dividing by the current rung. Should be P2's span.
- **0% while clearly progressing** → the previous rung's `target` is not being subtracted, or
  `currentTier` is `null` because the ladder's low rungs are missing from the response.

Both are `tierProgress`'s contract; it is unit-tested for each case.

## S6. A trophy reads "Locked" but the user has clearly earned something

`earned` counts `unlocked` flags, not progress. The server sets `unlocked` on read (it inserts the
row when `progress >= target`), so a value can exceed a rung's target while that rung is still
`unlocked: false` in the same response. That is expected and self-corrects on the next fetch —
do **not** infer unlock state from progress to "fix" it.

## S7. The page shows no sidebar / no navigation

The route is not wrapped in `AppLayout`. Every app page's route record must be a parent with
`component: AppLayout` and the view as a `path: ''` child — see `practices.md`. A route registered
as a bare single record renders the view in isolation with no shell (this happened; the page looked
right and had no navigation).

## S8. Deciding whether something belongs to this domain

If it is about *how trophies are grouped, graded, drawn or ordered* → here. If it is about *where
the numbers come from* (streak maths, session windows, time zones) → `backend-contract`. If it is
about *the indigo values themselves* → `DESIGN.md`.
