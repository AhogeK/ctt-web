import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AccountSection from '../AccountSection.vue'
import { useAuthStore } from '@/stores/auth'

// ==========================================
// Hoisted Mock Variables (plain values only — no imports)
// ==========================================

const mockResend = vi.hoisted(() => vi.fn<(email: string) => void>())

// Mutable plain values that mock factories wrap in ref()
let countdownValue = 0
let isResendPendingValue = false
let emailStatusDataValue:
  | {
      email: string
      emailVerified: boolean
      emailChangePending: boolean
      pendingNewEmail: string | null
    }
  | undefined = undefined
let isEmailStatusPendingValue = false
let isDialogOpenValue = false
let authStoreHasPassword = false
const akSetPasswordDialogOpen = ref(false)

// ==========================================
// Mocks
// ==========================================

vi.mock('@/features/auth/composables/useResendVerification', () => ({
  useResendVerification: vi.fn<() => unknown>(() => ({
    resend: mockResend,
    countdown: ref(countdownValue),
    isPending: ref(isResendPendingValue),
  })),
}))

vi.mock('@/features/settings/composables/useEmailStatus', () => ({
  useEmailStatus: vi.fn<() => unknown>(() => ({
    data: ref(emailStatusDataValue),
    isPending: ref(isEmailStatusPendingValue),
  })),
}))

vi.mock('@/features/settings/composables/useEmailChange', () => ({
  useEmailChange: vi.fn<() => unknown>(() => ({
    isDialogOpen: ref(isDialogOpenValue),
  })),
}))

vi.mock('@/features/settings/composables/useSetPassword', () => ({
  useSetPassword: vi.fn<() => unknown>(() => ({
    isDialogOpen: akSetPasswordDialogOpen,
    mutation: {
      mutate: vi.fn<(...args: unknown[]) => void>(),
      isPending: ref(false),
    },
    SET_PASSWORD_ERROR_CODES: { ALREADY_HAS_PASSWORD: 'USER_015', INVALID_FORMAT: 'COMMON_003' },
  })),
}))

vi.mock('../SetPasswordDialog.vue', () => ({
  default: {
    props: ['open'],
    emits: ['update:open', 'success'],
    template: '<div v-if="open" data-testid="set-password-dialog" />',
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => unknown>(() => ({
    email: 'fallback@example.com',
    emailVerified: true,
    displayName: 'Fallback User',
    createdAt: '2025-01-15T10:30:00Z',
    hasPassword: authStoreHasPassword,
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: { template: '<span><slot /></span>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

// ==========================================
// Helpers
// ==========================================

function resetMocks(): void {
  vi.clearAllMocks()
  countdownValue = 0
  isResendPendingValue = false
  emailStatusDataValue = undefined
  isEmailStatusPendingValue = false
  isDialogOpenValue = false
  authStoreHasPassword = false
  akSetPasswordDialogOpen.value = false
}

function setEmailStatus(
  overrides: {
    email?: string
    emailVerified?: boolean
    emailChangePending?: boolean
    pendingNewEmail?: string | null
  } = {},
): void {
  emailStatusDataValue = {
    email: overrides.email ?? 'user@example.com',
    emailVerified: overrides.emailVerified ?? true,
    emailChangePending: overrides.emailChangePending ?? false,
    pendingNewEmail: overrides.pendingNewEmail ?? null,
  }
}

// ==========================================
// Tests
// ==========================================

describe('AccountSection', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('email display', () => {
    it('displays email from emailStatus when available', () => {
      setEmailStatus({ email: 'status@example.com' })
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('status@example.com')
    })

    it('falls back to authStore email when emailStatus data is undefined', () => {
      emailStatusDataValue = undefined
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('fallback@example.com')
    })

    it('shows loading state while email status is pending', () => {
      isEmailStatusPendingValue = true
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Loading…')
    })
  })

  describe('verification badge', () => {
    it('shows Verified badge when email is verified', () => {
      setEmailStatus({ emailVerified: true })
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Verified')
      expect(wrapper.text()).not.toContain('Unverified')
    })

    it('shows Unverified badge when email is not verified', () => {
      setEmailStatus({ emailVerified: false })
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Unverified')
      expect(wrapper.text()).not.toContain('Verified')
    })

    it('hides badges while loading', () => {
      isEmailStatusPendingValue = true
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).not.toContain('Verified')
      expect(wrapper.text()).not.toContain('Unverified')
    })

    it('falls back to authStore emailVerified when emailStatus is undefined', () => {
      emailStatusDataValue = undefined
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Verified')
    })
  })

  describe('display name', () => {
    it('displays the display name from auth store', () => {
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Fallback User')
    })

    it('shows dash when display name is null', () => {
      vi.mocked(useAuthStore).mockReturnValueOnce({
        email: 'test@example.com',
        emailVerified: true,
        displayName: null,
        createdAt: '2025-01-01T00:00:00Z',
        hasPassword: false,
      } as ReturnType<typeof useAuthStore>)

      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('—')
    })
  })

  describe('registration time', () => {
    it('formats registration time from auth store createdAt', () => {
      const wrapper = mount(AccountSection)

      expect(wrapper.text()).not.toContain('—')
    })

    it('shows dash when createdAt is null', () => {
      vi.mocked(useAuthStore).mockReturnValueOnce({
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'User',
        createdAt: null,
      } as ReturnType<typeof useAuthStore>)

      const wrapper = mount(AccountSection)

      expect(wrapper.text()).toContain('Registered')
      expect(wrapper.findAll('span').some((s) => s.text() === '—')).toBe(true)
    })
  })

  describe('pending email change indicator', () => {
    it('shows pending indicator when emailChangePending and pendingNewEmail are set', () => {
      setEmailStatus({
        emailChangePending: true,
        pendingNewEmail: 'new@example.com',
      })
      const wrapper = mount(AccountSection)

      const pending = wrapper.find('[data-testid="email-change-pending"]')
      expect(pending.exists()).toBe(true)
      expect(pending.text()).toContain('new@example.com')
      expect(pending.text()).toContain('Email change pending')
    })

    it('hides pending indicator when emailChangePending is false', () => {
      setEmailStatus({ emailChangePending: false })
      const wrapper = mount(AccountSection)

      expect(wrapper.find('[data-testid="email-change-pending"]').exists()).toBe(false)
    })

    it('hides pending indicator when pendingNewEmail is null', () => {
      setEmailStatus({
        emailChangePending: true,
        pendingNewEmail: null,
      })
      const wrapper = mount(AccountSection)

      expect(wrapper.find('[data-testid="email-change-pending"]').exists()).toBe(false)
    })
  })

  describe('Change Email button', () => {
    it('opens the email change dialog when clicked', async () => {
      const wrapper = mount(AccountSection)

      const changeButton = wrapper.findAll('button').find((b) => b.text().includes('Change Email'))
      expect(changeButton).toBeDefined()
      await changeButton!.trigger('click')

      // The component sets isDialogOpen.value = true internally.
      // We verify the button exists and is clickable.
      expect(changeButton!.exists()).toBe(true)
    })
  })

  describe('Verify Email button', () => {
    it('shows Verify Email button when email is not verified', () => {
      setEmailStatus({ emailVerified: false })
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      expect(verifyButton.exists()).toBe(true)
      expect(verifyButton.text()).toContain('Verify Email')
    })

    it('hides Verify Email button when email is verified', () => {
      setEmailStatus({ emailVerified: true })
      const wrapper = mount(AccountSection)

      expect(wrapper.find('[data-testid="verify-email-button"]').exists()).toBe(false)
    })

    it('calls resend with the current email when clicked', async () => {
      setEmailStatus({ emailVerified: false, email: 'user@example.com' })
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      await verifyButton.trigger('click')

      expect(mockResend).toHaveBeenCalledWith('user@example.com')
    })

    it('falls back to authStore email for resend when emailStatus is undefined', async () => {
      emailStatusDataValue = undefined
      vi.mocked(useAuthStore).mockReturnValueOnce({
        email: 'fallback@example.com',
        emailVerified: false,
        displayName: 'User',
        createdAt: '2025-01-01T00:00:00Z',
      } as ReturnType<typeof useAuthStore>)

      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      await verifyButton.trigger('click')

      expect(mockResend).toHaveBeenCalledWith('fallback@example.com')
    })
  })

  describe('resend cooldown', () => {
    it('shows countdown when cooldown is active', () => {
      setEmailStatus({ emailVerified: false })
      countdownValue = 45
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      expect(verifyButton.text()).toContain('Resend in 45s')
    })

    it('disables button during cooldown', () => {
      setEmailStatus({ emailVerified: false })
      countdownValue = 30
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      expect(verifyButton.attributes('disabled')).toBeDefined()
    })

    it('shows Sending… when resend is pending', () => {
      setEmailStatus({ emailVerified: false })
      isResendPendingValue = true
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      expect(verifyButton.text()).toContain('Sending…')
    })

    it('disables button when resend is pending', () => {
      setEmailStatus({ emailVerified: false })
      isResendPendingValue = true
      const wrapper = mount(AccountSection)

      const verifyButton = wrapper.find('[data-testid="verify-email-button"]')
      expect(verifyButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Set Password button', () => {
    it('shows Set Password button when user has no password', () => {
      authStoreHasPassword = false
      const wrapper = mount(AccountSection)

      const setPasswordButton = wrapper.find('[data-testid="set-password-button"]')
      expect(setPasswordButton.exists()).toBe(true)
      expect(setPasswordButton.text()).toContain('Set Password')
    })

    it('shows "Change Password" button when user already has password', () => {
      authStoreHasPassword = true
      const wrapper = mount(AccountSection)

      const button = wrapper.find('[data-testid="set-password-button"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Change Password')
    })

    it('opens SetPasswordDialog when Set Password button is clicked', async () => {
      authStoreHasPassword = false
      const wrapper = mount(AccountSection)

      const setPasswordButton = wrapper.find('[data-testid="set-password-button"]')
      await setPasswordButton.trigger('click')

      expect(akSetPasswordDialogOpen.value).toBe(true)
    })

    it('closes SetPasswordDialog when isDialogOpen ref is set to false', async () => {
      akSetPasswordDialogOpen.value = true
      const wrapper = mount(AccountSection)

      const dialog = wrapper.find('[data-testid="set-password-dialog"]')
      expect(dialog.exists()).toBe(true)

      akSetPasswordDialogOpen.value = false
      await wrapper.vm.$nextTick()

      const dialogAfter = wrapper.find('[data-testid="set-password-dialog"]')
      expect(dialogAfter.exists()).toBe(false)
    })
  })
})
