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
 * and with src/stores/motion.ts for the motion attribute:
 *   - storage key   `ctt.motion`           (`system` | `reduce` | `full`)
 *   - DOM           attribute `data-motion` on <html>, carrying the resolved decision
 *                                           (`reduce` | `full`; absent = no preference)
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

    // Motion decision, mirrored before first paint for the same reason as the
    // theme: CSS cannot read localStorage, and applying it from the bundle
    // would animate the first frame and then stop. This mirrors the resolution
    // in src/stores/motion.ts — the attribute carries the conclusion, not the
    // stored choice, because the two signals have to be combined:
    //   reduce → motion is suppressed (by the visitor's choice or the system)
    //   full   → motion plays, even where the system asks for less
    //   absent → no preference, the system allows motion
    var motion = localStorage.getItem('ctt.motion')
    var systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motion === 'reduce' || (motion !== 'full' && systemReduced)) {
      root.setAttribute('data-motion', 'reduce')
    } else if (motion === 'full') {
      root.setAttribute('data-motion', 'full')
    }
  } catch {
    // Blocked storage (private mode, embedded webview): leave the default and let the
    // store correct it once the bundle runs.
  }
})()
