import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DangerZone from '../DangerZone.vue'

const emailStatusData = ref<{ email: string } | undefined>({ email: 'user@example.com' })
let authHasPassword = false
let authEmail: string | null = 'user@example.com'

vi.mock('@/features/settings/composables/useEmailStatus', () => ({
  useEmailStatus: vi.fn<() => unknown>(() => ({ data: emailStatusData, isPending: ref(false) })),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => unknown>(() => ({
    email: authEmail,
    hasPassword: authHasPassword,
  })),
}))

vi.mock('../DeleteAccountDialog.vue', () => ({
  default: {
    props: ['open', 'email', 'hasPassword'],
    emits: ['update:open'],
    template:
      '<div v-if="open" data-testid="delete-account-dialog" :data-email="email" :data-has-password="String(hasPassword)" />',
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

const confirmButton = (wrapper: ReturnType<typeof mount>) => wrapper.get('[data-testid="delete-account-button"]')

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    emailStatusData.value = { email: 'user@example.com' }
    authEmail = 'user@example.com'
    authHasPassword = false
  })

  it('offers deletion and keeps the dialog closed until asked', async () => {
    const wrapper = mount(DangerZone)

    expect(wrapper.find('[data-testid="delete-account-dialog"]').exists()).toBe(false)

    await confirmButton(wrapper).trigger('click')

    expect(wrapper.find('[data-testid="delete-account-dialog"]').exists()).toBe(true)
  })

  it('passes the resolved email and the account’s password state to the dialog', async () => {
    // The email arrives from whichever source has answered; the dialog must get the resolved value
    // rather than its own guess, because it is what the reader has to type back.
    emailStatusData.value = undefined
    authEmail = 'from-store@example.com'
    authHasPassword = true
    const wrapper = mount(DangerZone)

    await confirmButton(wrapper).trigger('click')

    const dialog = wrapper.get('[data-testid="delete-account-dialog"]')
    expect(dialog.attributes('data-email')).toBe('from-store@example.com')
    // Asserted, not merely set up: the name claims both halves, so both must be able to fail.
    expect(dialog.attributes('data-has-password')).toBe('true')
  })

  it('disables deletion until the email is known', async () => {
    // For a passwordless account the typed email is the only thing between a stray click and an
    // irreversible request. Falling back to an empty string would satisfy that comparison by
    // accident, so the guard has to be the disabled button, not an empty value.
    emailStatusData.value = undefined
    authEmail = null

    const wrapper = mount(DangerZone)

    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('enables deletion once the email is known', () => {
    const wrapper = mount(DangerZone)

    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
  })
})
