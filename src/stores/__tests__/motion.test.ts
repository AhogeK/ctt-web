import { describe, it, expect, beforeEach, vi } from 'vite-plus/test'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useMotionStore, MOTION_STORAGE_KEY, MOTION_ATTRIBUTE, type MotionPreference } from '../motion'

/** Shared mock so each test can drive the system signal directly. */
const mockPrefersReduced = ref(false)

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useMediaQuery: () => mockPrefersReduced,
    useStorage: (_key: string, initial: string) => ref(initial),
  }
})

describe('Motion Store', () => {
  let store: ReturnType<typeof useMotionStore>

  beforeEach(() => {
    mockPrefersReduced.value = false
    setActivePinia(createPinia())
    document.documentElement.removeAttribute(MOTION_ATTRIBUTE)
    store = useMotionStore()
  })

  it('follows the system when nothing has been chosen', () => {
    expect(store.preference).toBe('system')
    expect(store.isReduced).toBe(false)
    // No preference and no system request: the attribute stays absent, so the
    // stylesheet's own default applies.
    expect(document.documentElement.hasAttribute(MOTION_ATTRIBUTE)).toBe(false)
  })

  it('marks the document when the system asks for less', () => {
    mockPrefersReduced.value = true

    expect(store.isReduced).toBe(true)
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('reduce')
  })

  it('an explicit reduce choice marks the document', () => {
    store.setPreference('reduce')

    expect(store.isReduced).toBe(true)
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('reduce')
  })

  it('an explicit full choice overrides a system that asks for less', () => {
    mockPrefersReduced.value = true
    store.setPreference('full')

    expect(store.isReduced).toBe(false)
    // "full" is written as a real value: it is the one conclusion the media
    // query alone could not express.
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('full')
  })

  it('going back to system hands control back to the system', () => {
    mockPrefersReduced.value = true
    store.setPreference('full')

    store.setPreference('system')

    expect(store.isReduced).toBe(true)
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('reduce')
  })

  it('applies a value written by another tab, not only through setPreference', () => {
    store.setPreference('reduce')
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('reduce')

    // Another tab writes storage; useStorage mirrors it into the same ref.
    store.preference = 'full'
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('full')
  })

  it('keeps its storage key distinct from the theme keys', () => {
    expect(MOTION_STORAGE_KEY).toBe('ctt.motion')
    expect(MOTION_STORAGE_KEY).not.toBe('vueuse-color-scheme')
    expect(MOTION_STORAGE_KEY).not.toBe('theme-appearance')
  })

  it('treats a stored value it does not recognise as no preference', () => {
    // A corrupt or hand-edited value must not decide anything: it follows the
    // system, exactly as `public/theme.js` treats it before the first paint.
    store.preference = 'nonsense' as MotionPreference

    expect(store.isReduced).toBe(false)
    expect(document.documentElement.hasAttribute(MOTION_ATTRIBUTE)).toBe(false)

    mockPrefersReduced.value = true

    expect(store.isReduced).toBe(true)
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('reduce')
  })
})
