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

  return {
    isDark,
    mode,
    toggleTheme,
    setTheme,
  }
})
