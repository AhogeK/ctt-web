import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterSuccessView from '../RegisterSuccessView.vue'
import { SESSION_STORAGE_KEYS } from '@/stores/auth'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { push: () => void }>(() => ({
    push: vi.fn<() => void>(),
  })),
  useRoute: vi.fn<() => { query: Record<string, unknown> }>(() => ({
    query: {},
  })),
}))

// Mock vue-sonner toast
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
    info: vi.fn<(message: string) => void>(),
  },
}))

// Mock useResendVerification composable
vi.mock('../../composables/useResendVerification', () => ({
  useResendVerification: vi.fn<
    () => {
      resend: (email: string) => void
      countdown: { value: number }
      isPending: { value: boolean }
    }
  >(() => ({
    resend: vi.fn<(email: string) => void>(),
    countdown: { value: 0 },
    isPending: { value: false },
  })),
}))

// Mock @vueuse/core - useSessionStorage and useClipboard
vi.mock('@vueuse/core', () => ({
  useSessionStorage: vi.fn<
    (
      key: string,
      defaultValue: unknown,
    ) => {
      value: unknown
    }
  >((key: string, defaultValue: unknown) => {
    return {
      get value() {
        return sessionStorage.getItem(key) ?? defaultValue
      },
      set value(newValue: unknown) {
        if (newValue === null || newValue === undefined) {
          sessionStorage.removeItem(key)
        } else {
          sessionStorage.setItem(key, String(newValue))
        }
      },
    }
  }),
  useClipboard: vi.fn<
    () => {
      copied: { value: boolean }
      copy: () => void
    }
  >(() => ({
    copied: { value: false },
    copy: vi.fn<() => void>(),
  })),
}))

describe('RegisterSuccessView', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('sessionStorage email reading', () => {
    it('reads email from sessionStorage when present', () => {
      const testEmail = 'session@example.com'
      sessionStorage.setItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, testEmail)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain(testEmail)
    })

    it('prioritizes sessionStorage over query param', async () => {
      const sessionEmail = 'session@example.com'
      const queryEmail = 'query@example.com'

      sessionStorage.setItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, sessionEmail)

      const { useRoute } = await import('vue-router')
      vi.mocked(useRoute).mockReturnValue({
        query: { email: queryEmail },
      } as unknown as ReturnType<typeof useRoute>)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain(sessionEmail)
      expect(wrapper.text()).not.toContain(queryEmail)
    })
  })

  describe('query param fallback', () => {
    it('falls back to query param when sessionStorage empty', async () => {
      const queryEmail = 'query@example.com'

      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL)).toBeNull()

      const { useRoute } = await import('vue-router')
      vi.mocked(useRoute).mockReturnValue({
        query: { email: queryEmail },
      } as unknown as ReturnType<typeof useRoute>)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain(queryEmail)
    })

    it('shows error state when both sessionStorage and query param are empty', async () => {
      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL)).toBeNull()

      const { useRoute } = await import('vue-router')
      vi.mocked(useRoute).mockReturnValue({
        query: {},
      } as unknown as ReturnType<typeof useRoute>)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain('Registration data lost')
      expect(wrapper.find('button').text()).toContain('Go to registration')
    })
  })

  describe('sessionStorage cleanup on unmount', () => {
    it('clears sessionStorage on component unmount', () => {
      const testEmail = 'test@example.com'
      sessionStorage.setItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, testEmail)

      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL)).toBe(testEmail)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain(testEmail)

      wrapper.unmount()

      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL)).toBeNull()
    })

    it('does not throw when unmounting with empty sessionStorage', async () => {
      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL)).toBeNull()

      const { useRoute } = await import('vue-router')
      vi.mocked(useRoute).mockReturnValue({
        query: { email: 'fallback@example.com' },
      } as unknown as ReturnType<typeof useRoute>)

      const wrapper = mount(RegisterSuccessView)

      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('email truncation', () => {
    it('displays full email when length <= 30 characters', () => {
      const shortEmail = 'short@example.com'
      sessionStorage.setItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, shortEmail)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain(shortEmail)
    })

    it('truncates long emails while keeping domain visible', () => {
      const longEmail = 'verylongemailaddress123456789@example.com'
      sessionStorage.setItem(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, longEmail)

      const wrapper = mount(RegisterSuccessView)

      expect(wrapper.text()).toContain('...@example.com')
      expect(wrapper.text()).not.toContain('verylongemailaddress123456789')
    })
  })
})
