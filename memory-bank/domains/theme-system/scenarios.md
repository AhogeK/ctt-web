# theme-system · scenarios

## S1 — Moving a region tone

1. Restate the complaint in its own terms and pick the metric that maps onto it (tone → luminance ratio
   between **areas**; never a border ratio).
2. Solve the target values arithmetically first (reverse the WCAG formula for the ratio you want), then
   solve the text tokens that keep AA on the new fill — before touching the CSS.
3. Change the tokens, rebuild, re-probe (S2), and capture before/after from the **same** page + viewport.
4. Stop at the first render that reads correctly; two flat rounds means stop and report the open diagnostics.
5. Record: `DESIGN.md` table, `practices.md`, and the captures under `.omp/qa/dark-regions-<date>/`.

## S2 — The probe

Playwright, a throwaway spec, mocked auth, `emulateMedia({ colorScheme })`, and the token readout:

```ts
const root = getComputedStyle(document.documentElement)
;['--background','--secondary','--muted','--sidebar','--card','--popover','--border','--muted-foreground']
  .map(k => `${k}=${root.getPropertyValue(k).trim()}`).join(' ')
```

Traps, both paid for on 2026-09-25 (fuller note in `domains/ai-workflow/references.md`):

- **`CI=true` in this shell sends Playwright to the 4173 preview and the stale `dist`** — run with
  `env -u CI` to measure the working tree, and always read back which stylesheet the page loaded.
- **`getComputedStyle` returns `oklab(…)`** for these tokens; normalise through a 1×1 canvas before
  comparing (and remember `opacity` on an ancestor dims text too — measure the *effective* colour, not the
  declared one).

## S3 — Who decides what

Build, unit suite, tokens-in-the-render and the ratios are the AI's to produce. **The perceptual verdict is
the user's** (do the regions read as different tones · did the cards keep their polish · anything grey-mud).
Their acceptance freezes the item (R30); a fix proposed for a page they previously accepted is reported with
numbers and their ruling, never slipped in.
