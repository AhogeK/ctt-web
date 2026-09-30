# 归档：ai-workflow/practices.md 的「Browser sessions for dashboard verification」段（2026-09-30 迁出）

迁出理由：**操作细节**（会话启动、CDP、profile 清理）篇幅 39 行 ✓，为守住 R24 的单文件 200 行上限 ✓；结论与陷阱仍按需引用 ✓。

---

## Browser sessions for dashboard verification

`get-token.sh` alone is not enough to drive the app: it prints an access token, but the app
authenticates by **refreshing**, so a page booting with an access token and no valid refresh token
bounces to `/auth/login` no matter how fresh the token is.

```bash
eval "$(SESSION=1 bash .sisyphus/get-token.sh <prefix>)"   # → ACCESS=… REFRESH=…
```

Then, in one `tab.run` call:

```js
await page.evaluate((c) => {
  localStorage.setItem('ctt_access_token', c.access)     // BARE string — see below
  localStorage.setItem('ctt_refresh_token', c.refresh)
}, creds)
await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' })
```

Traps — each one cost a full debugging round:

- **Write the tokens as bare strings.** `useStorage(key, null)` picks the *string* serializer for a
  `null` default, so a JSON-quoted value is sent verbatim (`"\"abc\""`) and every refresh returns
  `AUTH_003`. This is also why the app's own login looks broken when driven with a
  `JSON.stringify`'d token.
- **Write them before navigating, in the same `tab.run`.** `page.evaluateOnNewDocument` registers for
  the lifetime of the call, not the page — it never took effect and silently fell back to whatever
  token the profile already had (verification then ran against the *wrong account*, with no error).
- **A saved token pair is good for one run.** The refresh token rotates and reuse is detected
  (`AUTH_009`), so reuse gets `403 /auth/refresh` and a bounce to `/auth/login` — which looks exactly
  like "my change broke the page". Fetch a fresh pair per run.
- **One live tab per Chrome profile.** A second tab keeps its own silent-refresh timer running and
  rewrites the shared `localStorage`, rotating your token back mid-check. Kill the old instance or
  use a fresh profile per verification.
- **The app's CSP blocks `fetch()`/`Image()` on `data:` URLs**, so screenshots cannot be decoded
  in-page (canvas pixel sampling fails with `Failed to fetch` / `EncodingError`). Read *resolved*
  computed styles instead — for a track-sized gradient, `backgroundSize: "783.5px 100%"` proves the
  `cqw` container query resolved, which is the mechanism under test.
