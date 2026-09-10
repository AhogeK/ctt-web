# ai-workflow — practices

## Commit shapes (R6.5)

```
feat(dashboard): <what changed>          # code — one coherent change
chore: bump version to X.Y.Z             # version — separate, and always AFTER the code
chore(memory): <what was recorded>       # AI memory — never mixed with code
```

- Subject ≤72 chars (commitlint rejects longer; shorten rather than abbreviate unnaturally).
- Body states *why*, plus any measured values that justify the change.
- No AI attribution of any kind, no co-author trailers.
- `develop` first. `master` receives only individually cherry-picked non-AI commits:

```bash
git checkout master && git cherry-pick <feat-hash> <version-hash>
git diff develop master --stat -- src/ e2e/ package.json README.md   # must be empty
```

A non-empty diff here means either an AI commit leaked in, or a wrong (stale) commit was
cherry-picked — stop and investigate before pushing.

## Verification recipes

| Purpose                    | Command / method                                                   |
| -------------------------- | ------------------------------------------------------------------ |
| Types                      | `pnpm type-check`                                                   |
| Lint                       | `pnpm lint`                                                         |
| Unit tests                 | `pnpm test:unit --run`                                              |
| Build                      | `pnpm build`                                                        |
| E2E (specific spec)        | `env -u CI pnpm test:e2e e2e/<path>.spec.ts --project=chromium`      |
| Dark-mode rendering        | CDP `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])` then screenshot/pixel sample |
| Endpoint payload           | Direct `curl` with the panel's exact params (see `backend-contract`) |

`env -u CI` matters: with `CI` set, Playwright switches to a preview build instead of the running
dev server.

## Reading a rendered value instead of guessing it

```js
// computed style of a specific element
await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="x"]')).backgroundColor)
// rendered pixels, when a composited layer could differ from the declared value
// (screenshot the region, decode in-page with canvas, read the RGBA)
```

Declared CSS is not evidence of what a user sees — gradients, masks, opacity and stacking all
change the result. Sample the render.

## Capturing a transient UI state

- Screenshot from the same `tab.run` cell that triggered it; a separate call can miss the window.
- For hover/press states, dispatch the interaction then screenshot before the state expires.

## When an edit tool corrupts a file

Symptom: the file stops parsing, duplicate blocks appear, or a boundary line is echoed twice.

1. Stop patching. Re-read the whole file.
2. If the structure is damaged beyond a single hunk, **rewrite the file in one `write`** with the
   complete intended content.
3. Re-run the full verification (types + tests + build) — a silent structural change is exactly
   what tests are for.
4. Prefer one whole-file write over many hunks for template-heavy files in the first place.

## Memory upkeep mechanics

- Update **immediately** in the same round as the change (R2) — deferred updates are how the
  timeline falls behind reality.
- Before adding an entry, read the target file; extend the matching topic instead of appending.
- Keep one canonical location per fact (P6); elsewhere, link.
- Archive to `docs/archives/YYYY-MM-DD-<name>-archive.md` and leave a pointer line behind.

## Resource hygiene

- Long-running process → background it with its own log file; record the PID for teardown.
- Teardown: match the process command line against the resource you started, then stop it. Never
  kill by port alone.
- Persistent helper accounts/files survive between rounds; scratch payloads and profiles do not.
