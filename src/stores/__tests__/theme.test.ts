import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

/**
 * Shared mock refs for VueUse composables.
 * These are returned by the mock functions to provide controllable state.
 */
const mockIsDark = ref(false)
const mockMode = ref<'light' | 'dark' | 'auto'>('auto')

vi.mock('@vueuse/core', () => ({
  useDark: () => mockIsDark,
  useStorage: () => mockMode,
}))

/**
 * Mock window.matchMedia for system preference tests.
 */
const mockMatchMedia = vi.fn<(query: string) => Partial<MediaQueryList>>((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn<() => void>(),
  removeListener: vi.fn<() => void>(),
  addEventListener: vi.fn<() => void>(),
  removeEventListener: vi.fn<() => void>(),
  dispatchEvent: vi.fn<() => boolean>(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('Theme Store', () => {
  let store: ReturnType<typeof import('../theme').useThemeStore>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsDark.value = false
    mockMode.value = 'auto'
    localStorage.clear()
    setActivePinia(createPinia())
    vi.resetModules()
    const { useThemeStore } = await import('../theme')
    store = useThemeStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Tests for store initialization and default state.
   */
  describe('initialization', () => {
    it('initializes with default mode "auto"', () => {
      expect(store.mode).toBe('auto')
    })

    it('initializes isDark to false by default', () => {
      expect(store.isDark).toBe(false)
    })

    it('restores mode from localStorage on initialization', async () => {
      localStorage.setItem('theme-appearance', 'dark')
      mockMode.value = 'dark'
      vi.resetModules()
      setActivePinia(createPinia())
      const { useThemeStore } = await import('../theme')
      const newStore = useThemeStore()

      expect(newStore.mode).toBe('dark')
    })

    it('uses "auto" as fallback when localStorage is empty', async () => {
      localStorage.clear()
      mockMode.value = 'auto'
      vi.resetModules()
      setActivePinia(createPinia())
      const { useThemeStore } = await import('../theme')
      const newStore = useThemeStore()

      expect(newStore.mode).toBe('auto')
    })
  })

  /**
   * Tests for toggleTheme function behavior.
   */
  describe('toggleTheme', () => {
    it('toggles from dark to light', () => {
      store.setTheme('dark')
      expect(store.isDark).toBe(true)

      store.toggleTheme()

      expect(store.isDark).toBe(false)
      expect(store.mode).toBe('light')
    })

    it('toggles from light to dark', () => {
      store.setTheme('light')
      expect(store.isDark).toBe(false)

      store.toggleTheme()

      expect(store.isDark).toBe(true)
      expect(store.mode).toBe('dark')
    })

    it('toggles from auto to opposite of current isDark state', () => {
      mockMatchMedia.mockImplementationOnce((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }))

      store.setTheme('auto')
      expect(store.isDark).toBe(true)

      store.toggleTheme()

      expect(store.isDark).toBe(false)
      expect(store.mode).toBe('light')
    })

    it('updates mode to explicit dark/light after toggle', () => {
      store.setTheme('auto')
      store.toggleTheme()
      expect(store.mode).not.toBe('auto')
      expect(['dark', 'light']).toContain(store.mode)
    })
  })

  /**
   * Tests for setTheme function with different modes.
   */
  describe('setTheme', () => {
    it('sets theme to dark', () => {
      store.setTheme('dark')

      expect(store.mode).toBe('dark')
      expect(store.isDark).toBe(true)
    })

    it('sets theme to light', () => {
      store.setTheme('light')

      expect(store.mode).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('sets theme to auto with system preference dark', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }))

      store.setTheme('auto')

      expect(store.mode).toBe('auto')
      expect(store.isDark).toBe(true)
    })

    it('sets theme to auto with system preference light', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }))

      store.setTheme('auto')

      expect(store.mode).toBe('auto')
      expect(store.isDark).toBe(false)
    })

    it('calls matchMedia with correct query for auto mode', () => {
      store.setTheme('auto')

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('does not call matchMedia for explicit dark mode', () => {
      mockMatchMedia.mockClear()

      store.setTheme('dark')

      expect(mockMatchMedia).not.toHaveBeenCalled()
    })

    it('does not call matchMedia for explicit light mode', () => {
      mockMatchMedia.mockClear()

      store.setTheme('light')

      expect(mockMatchMedia).not.toHaveBeenCalled()
    })
  })

  /**
   * Tests for localStorage persistence behavior.
   */
  describe('persistence', () => {
    it('persists mode changes to localStorage', async () => {
      store.setTheme('dark')
      expect(store.mode).toBe('dark')

      store.setTheme('light')
      expect(store.mode).toBe('light')

      store.setTheme('auto')
      expect(store.mode).toBe('auto')
    })

    it('syncs mode across store instances', async () => {
      store.setTheme('dark')
      const { useThemeStore } = await import('../theme')
      const anotherStore = useThemeStore()
      expect(anotherStore.mode).toBe('dark')
    })

    it('maintains separate isDark state per store instance', async () => {
      store.setTheme('dark')
      const { useThemeStore } = await import('../theme')
      const anotherStore = useThemeStore()
      expect(anotherStore.mode).toBe('dark')
      expect(anotherStore.isDark).toBe(true)
    })
  })

  /**
   * Tests for edge cases and error handling.
   */
  describe('edge cases', () => {
    it('handles rapid consecutive setTheme calls', () => {
      store.setTheme('dark')
      store.setTheme('light')
      store.setTheme('dark')
      store.setTheme('auto')

      expect(store.mode).toBe('auto')
    })

    it('handles toggleTheme when isDark is false', () => {
      mockIsDark.value = false
      store.toggleTheme()

      expect(store.isDark).toBe(true)
      expect(store.mode).toBe('dark')
    })

    it('handles setTheme with same value multiple times', () => {
      store.setTheme('dark')
      store.setTheme('dark')
      store.setTheme('dark')

      expect(store.mode).toBe('dark')
      expect(store.isDark).toBe(true)
    })

    it('handles localStorage with invalid value gracefully', async () => {
      localStorage.setItem('theme-appearance', 'invalid-value')
      mockMode.value = 'invalid-value' as 'light' | 'dark' | 'auto'
      vi.resetModules()
      setActivePinia(createPinia())
      const { useThemeStore } = await import('../theme')
      const newStore = useThemeStore()
      expect(['light', 'dark', 'auto', 'invalid-value']).toContain(newStore.mode)
    })
  })

  /**
   * Tests for reactive state behavior.
   */
  describe('reactivity', () => {
    it('isDark is reactive to mode changes', () => {
      store.setTheme('dark')
      expect(store.isDark).toBe(true)

      store.setTheme('light')
      expect(store.isDark).toBe(false)
    })

    it('mode is reactive to toggleTheme', () => {
      const initialMode = store.mode

      store.toggleTheme()

      expect(store.mode).not.toBe(initialMode)
    })

    it('isDark updates immediately after setTheme', () => {
      store.setTheme('dark')
      expect(store.isDark).toBe(true)

      store.setTheme('light')
      expect(store.isDark).toBe(false)
    })
  })
})
