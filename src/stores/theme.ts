import { defineStore } from 'pinia'
import { useDark, useStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * Theme store for managing dark/light mode and appearance preferences.
 *
 * Features:
 * - Automatic system preference detection (prefers-color-scheme)
 * - Persistent user preference storage
 * - DOM class synchronization for Tailwind dark: prefix
 * - Cross-tab synchronization via storage events
 */
export const useThemeStore = defineStore('theme', () => {
  // useDark handles system preference and DOM class sync
  // Automatically syncs to localStorage and HTML element class
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  })

  // Store user's manual theme preference
  const mode = useStorage<ThemeMode>('theme-appearance', 'auto')

  /**
   * Toggle between dark and light mode.
   * Updates both the visual state and user preference.
   */
  function toggleTheme(): void {
    isDark.value = !isDark.value
    mode.value = isDark.value ? 'dark' : 'light'
  }

  /**
   * Set a specific theme mode.
   * When 'auto', restores system preference detection.
   * When 'dark' or 'light', applies the specified mode.
   */
  function setTheme(newMode: ThemeMode): void {
    mode.value = newMode
    if (newMode === 'auto') {
      isDark.value = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDark.value = newMode === 'dark'
    }
  }

  /**
   * Adopt the system preference — but only for a visitor who has never chosen a theme.
   *
   * Note for anyone touching this default: VueUse writes its own `auto` defaults into storage when the
   * store is created, so a "nothing has ever been chosen" check can be false by the time this runs — a
   * first-visit default has to be seeded before the store exists.
   *
   * Runs on every page load, and an OAuth sign-in is a *full* load (`location.href` out, then a
   * fresh document back), so resetting the theme unconditionally would overwrite a stored choice — a
   * theme picked on the login page reverting to system after sign-in. Either key counts as a choice — `theme-appearance` belongs to this store, and
   * `vueuse-color-scheme` is the one `useDark` and `public/theme.js` both read.
   */
  function initTheme(): void {
    const stored = globalThis.localStorage
    if (stored.getItem('theme-appearance') || stored.getItem('vueuse-color-scheme')) return
    setTheme('auto')
  }

  return {
    isDark,
    mode,
    toggleTheme,
    setTheme,
    initTheme,
  }
})
