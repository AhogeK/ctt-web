# theme-system · motion

Motion is a **preference axis**, not a theme variant. It has its own store, its own storage key and its own
document attribute, because "dark colours" and "no animation" are independent answers a visitor can give.

## One attribute carries the conclusion

`<html data-motion>` holds the **resolved decision**, not the stored choice:

| Stored (`ctt.motion`) | System asks for less? | Attribute | Meaning |
| --- | --- | --- | --- |
| `system` | no | *absent* | no preference, motion plays |
| `system` | yes | `reduce` | motion is suppressed |
| `reduce` | either | `reduce` | motion is suppressed |
| `full` | no | `full` | motion plays |
| `full` | yes | `full` | motion plays — the visitor overrode the system |

**Why the merge moved from CSS to JavaScript**: the stage plan asked for the preference to be *merged* with
the existing media query (`与既有 media query 合并`). It is merged — but in the store rather than in the
stylesheet, because CSS cannot combine a media query with a stored value. Keeping the media query in charge
of half the decision is what produced the two defects below; a single resolved value is the only way both
directions can hold.

**Why the landing page's motion blocks were rewritten**: the hero entrances, the reveal states and the pinned
stage were declared under `@media (prefers-reduced-motion: no-preference)`, so they belonged to the system
signal alone and could not honour the visitor's choice. Gating them on the attribute is not extra scope — it
is the same defect in the same mechanism, and leaving them out would have shipped a preference that silently
did nothing on the marketing page.

**Why the attribute holds the conclusion and not the choice**: CSS cannot combine a media query with a stored
value. A stylesheet that asked `prefers-reduced-motion` directly would ignore the visitor's choice entirely —
"Full motion" could never win, and "Reduce motion" would have no effect on a machine whose OS allows animation.
Resolving both signals in one place (the store) and handing CSS a single value is what makes the preference
actually work in both directions.

The first version of this feature mirrored the *choice* instead (`data-motion="reduce"` / `"full"` / absent) and
the media query stayed in charge of everything else. Two defects came out of it, both found by measurement
rather than by reading the code:

- With the choice mirrored, "Full motion" could not restore the marketing page's entrance: those animations
  are declared under `@media (prefers-reduced-motion: no-preference)`, so a system asking for less removed
  them regardless of the visitor's choice.
- With the choice mirrored, "Reduce motion" did not remove them either — the media query still matched, the
  animation still existed, and the document-wide rule only zeroed its *duration*. A zeroed animation still
  honours `animation-delay`, so the hero copy held its `from` frame (opacity 0) for 70ms and the panel for
  440ms: the page opened with pieces missing, which is worse than the system preference, where the
  animations do not exist at all.

## The stylesheet gates on the attribute

Every motion rule set is selected by `html:not([data-motion='reduce'])` — the hero entrances, the phone
reveal states, the desktop reveal bands, the scroll fades and the pinned stage. When motion is reduced the
animation does not exist, rather than existing with a zero duration, which is what avoids the delay trap.

The global rule that shortens what remains (spinners, dialog transitions) is likewise attribute-driven:

```css
html[data-motion='reduce'] *, html[data-motion='reduce'] *::before, … {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

**Nobody may reintroduce `motion-reduce:` Tailwind variants for coverage.** That variant is media-query-only, so
it cannot see the visitor's choice: five call sites (three preference cards, the trophy progress bar, the
ranked bar) each carried one and each would have kept animating under an explicit "Reduce motion". The global
rule replaces all of them — one place to add a declaration, and it covers components nobody has written yet.

Canvas animation is outside the cascade entirely: the time-of-day chart reads the store's resolved
`isReduced` instead of the media query, and re-renders when it changes.

## First paint

`public/theme.js` (a classic same-origin script in `<head>`, because CSP is `script-src 'self'` and forbids
inline) writes the attribute before the first paint, exactly like the theme class. It resolves the same way
the store does — a stored `full` wins over a system request, anything else follows the system — and without it
the bundle would animate the first frame and then stop.

## Who writes the attribute

`src/stores/motion.ts` owns it: `watch([preference, prefersReducedMotion], apply, { immediate: true, flush: 'sync' })`.

- `flush: 'sync'` on purpose — the attribute is a DOM write, not rendered state; a batched flush would let a
  caller read an attribute that contradicts the preference it just wrote.
- The watcher, not `setPreference`, is what writes, so **another tab's change** (which `useStorage` mirrors
  into the same ref) and a change of the OS setting are covered by one code path.
- `App.vue` instantiates the store on mount to keep that watcher alive for the session.

## Proving it, not asserting it

`e2e/settings/motion.spec.ts` reads `getComputedStyle` and takes the longest transition/animation duration in
the document — after unit conversion (`0.01ms` parsed as seconds is `0.01`, which a naive `parseFloat` would
call "animated"). It asserts: baseline > 1ms · after "Reduce" < 1ms · survives a reload · `emulateMedia`
reduce + "Full motion" > 1ms · back to "Follow system" reduces again.

Two further cases cover the marketing page, because that is where the traps live: the hero entrance must be
**absent** under "Reduce motion" (not merely short), and "Full motion" must keep it even when the system asks
for less.

## Copy and icons

- "Follow system" / "Reduce motion" / "Full motion", each with a one-line hint — without the hint, "Follow
  system" and "Reduce" read as the same choice to someone whose system already asks for less.
- The section reports the resolved value ("Current: Full motion"), so "system" is not a black box.
- Icons restate the choice: `Monitor` for follow-system (the same icon the theme group uses), `ZapOff` / `Zap`
  for the explicit pair. A magic-wand icon on "Follow system" was shipped for one pass and read as decoration.
