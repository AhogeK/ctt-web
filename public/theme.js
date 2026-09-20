/* First-paint theme.
 *
 * The bundle runs after the first paint, so a dark-first design would flash light on
 * every cold load. This file closes that gap: it is a classic (non-deferred) same-origin
 * script in <head>, so it runs before anything is painted.
 *
 * It must stay in sync with src/stores/theme.ts, which renders the same decision:
 *   - storage key   `vueuse-color-scheme`  (VueUse's useDark default; NOT `theme-appearance`,
 *                                           which only carries the user's chosen mode)
 *   - values        `dark` | `light` | `auto` (absent behaves as `auto`)
 *   - DOM           class `dark` on <html> drives Tailwind's dark: variants
 *
 * External file, not inline: index.html sets `script-src 'self'`, so an inline script
 * would be blocked by CSP.
 */
;(function () {
  try {
    var stored = localStorage.getItem('vueuse-color-scheme') || 'auto'
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var dark = stored === 'dark' || (stored !== 'light' && prefersDark)
    var root = document.documentElement
    if (dark) root.classList.add('dark')
    // Keeps native scrollbars and form controls in step with the theme.
    root.style.colorScheme = dark ? 'dark' : 'light'
  } catch {
    // Blocked storage (private mode, embedded webview): leave the default and let the
    // store correct it once the bundle runs.
  }
})()
