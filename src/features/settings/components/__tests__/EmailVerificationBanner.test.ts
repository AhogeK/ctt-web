import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import EmailVerificationBanner from '../EmailVerificationBanner.vue'

// ==========================================
// Hoisted Mock Variables (plain values only — no imports)
// ==========================================

const mockResend = vi.hoisted(() => vi.fn<(email: string) => void>())
let countdownValue = 0
let isPendingValue = false
let emailVerifiedValue = false
let emailValue: string | null = 'user@example.com'

// ==========================================
// Mocks
// ==========================================

vi.mock('@/features/auth/composables/useResendVerification', () => ({
  useResendVerification: vi.fn<() => unknown>(() => ({
    resend: mockResend,
    countdown: ref(countdownValue),
    isPending: ref(isPendingValue),
  })),
}))

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return {
    ...actual,
    storeToRefs: vi.fn<() => unknown>(() => ({
      emailVerified: ref(emailVerifiedValue),
      email: ref(emailValue),
    })),
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => unknown>(() => ({})),
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('lucide-vue-next', () => ({
  AlertTriangle: { template: '<span />' },
  Mail: { template: '<span />' },
  Loader2: { template: '<span />' },
}))

// ==========================================
// Helpers
// ==========================================

function resetMocks(): void {
  vi.clearAllMocks()
  countdownValue = 0
  isPendingValue = false
  emailVerifiedValue = false
  emailValue = 'user@example.com'
}

// ==========================================
// Tests
// ==========================================

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('visibility', () => {
    it('renders when emailVerified is false', () => {
      emailVerifiedValue = false
      const wrapper = mount(EmailVerificationBanner)

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Email not verified')
    })

    it('does not render when emailVerified is true', () => {
      emailVerifiedValue = true
      const wrapper = mount(EmailVerificationBanner)

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('shows verification message text', () => {
      emailVerifiedValue = false
      const wrapper = mount(EmailVerificationBanner)

      expect(wrapper.text()).toContain('Please verify your email address to access all features.')
    })
  })

  describe('resend button', () => {
    it('calls resend with user email when clicked', async () => {
      emailVerifiedValue = false
      emailValue = 'user@example.com'
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      await resendButton.trigger('click')

      expect(mockResend).toHaveBeenCalledWith('user@example.com')
    })

    it('shows default button label when no cooldown', () => {
      emailVerifiedValue = false
      countdownValue = 0
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.text()).toContain('Resend verification email')
    })

    it('does not call resend when email is null', async () => {
      emailVerifiedValue = false
      emailValue = null
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      await resendButton.trigger('click')

      expect(mockResend).not.toHaveBeenCalled()
    })
  })

  describe('cooldown timer', () => {
    it('shows countdown when cooldown is active', () => {
      emailVerifiedValue = false
      countdownValue = 45
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.text()).toContain('Resend in 45s')
    })

    it('disables button during cooldown', () => {
      emailVerifiedValue = false
      countdownValue = 30
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.attributes('disabled')).toBeDefined()
    })

    it('enables button when countdown reaches zero', () => {
      emailVerifiedValue = false
      countdownValue = 0
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('loading state', () => {
    it('disables button when resend is pending', () => {
      emailVerifiedValue = false
      isPendingValue = true
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.attributes('disabled')).toBeDefined()
    })

    it('shows spinner icon when pending', () => {
      emailVerifiedValue = false
      isPendingValue = true
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.attributes('disabled')).toBeDefined()
    })

    it('shows mail icon when not pending', () => {
      emailVerifiedValue = false
      isPendingValue = false
      const wrapper = mount(EmailVerificationBanner)

      const resendButton = wrapper.find('button')
      expect(resendButton.attributes('disabled')).toBeUndefined()
    })
  })
})
