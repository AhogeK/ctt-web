# achievements — scenarios

## S1. Adding an achievement to an existing family

Server ships a new rung, e.g. `STREAK_365` (`type: STREAK`, `tier: 8`, `window: LIFETIME`,
`target: 365`).

**No frontend change at all.** Since v0.71.0 the response carries `type` and `tier`, so the rung
joins its ladder on the next fetch — labelled and ordered from the payload. Nothing to append, no
code list to keep in sync, and no risk of an out-of-order declaration inverting the rung strip.

If the tier's **thresholds** shift, still nothing here: `target` is read per badge (P5).

## S2. Adding a whole new family

Needs one entry in `FAMILY_PRESENTATION` (`trophy-model.ts`): label, blurb, art. If the **shape** is
new, also one path set in `TrophyMedal.vue` plus a member on `TrophyArt`.

**Until then the family still renders** — it produces a trophy labelled with the server's own badge
name (single-tier) or its `type` (multi-tier), drawn with the `generic` medallion. Nothing is lost;
the only cost is that the copy is the server's identifier rather than curated text.

## S3. Adding a new *window* (e.g. a quarterly ladder)

Unlike §S1 and §S2 this one **is a frontend change**, because `AchievementWindowSchema` mirrors the
backend's closed `AchievementWindow` enum (the repo models backend enums as `z.enum` — see
`ApiKeyScopeEnum`). An unknown window fails schema validation and takes the whole page down with it.

Steps: add the member to `AchievementWindowSchema` in `stats.schema.ts`, then to
`WINDOW_PRESENTATION` in `trophy-model.ts` (label + display order). Ask the backend to ship it only
once this lands — there is no graceful degradation here by design (P4 covers families, not windows).

## S4. A tier's threshold is rebalanced

Change nothing. `target` comes from the response, so the ladder, the bar and the "N / M unit" line
all recompute. Since v0.71.0 the **order** also comes from the server (`tier`), so there is no local
list that could disagree with the new thresholds.

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

## S7. A periodic trophy shows 0 the day after it was complete

Expected — that is the window rolling over, not data loss. The server records each period
separately (`(user_id, achievement_code, period_key)`), so last period's rows survive as history and
only `unlocked` for the *current* window is reported.

Two consequences to respect:

- **Never cache a windowed trophy's progress across a period boundary.** A response fetched at
  23:59 is stale at 00:01 for the DAY ladder.
- The UI must make the reset legible (P6): the card names its window, and the page separates
  resetting ladders from lifetime ones. A silent drop to 0 reads as a bug.

## S8. The page shows no sidebar / no navigation

The route is not wrapped in `AppLayout`. Every app page's route record must be a parent with
`component: AppLayout` and the view as a `path: ''` child — see `practices.md`. A route registered
as a bare single record renders the view in isolation with no shell (this happened; the page looked
right and had no navigation).

## S9. Deciding whether something belongs to this domain

If it is about *how trophies are grouped, graded, drawn or ordered* → here. If it is about *where
the numbers come from* (streak maths, session windows, time zones, period keys) → `backend-contract`.
If it is about *the indigo values themselves* → `DESIGN.md`.
