import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises } from '@vue/test-utils'
import { mountWithQuery } from '@/test/mount-with-query'
import DisplayNameDialog from '../DisplayNameDialog.vue'

/**
 * Integration test: real vee-validate + real ui/form + real ui/input chain.
 *
 * Mocking the form would hide exactly what this dialog depends on — a field bound through
 * `v-bind="componentField"` that must reach the model, and a schema whose messages come from the
 * catalogue. Only the network call, the store and the reka-ui boundaries are mocked.
 */

const mockUpdateDisplayName = vi.hoisted(() => vi.fn<(name: string) => Promise<unknown>>())
const mockApplyProfile = vi.hoisted(() => vi.fn<(profile: unknown) => void>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())
const mockExtractErrorCode = vi.hoisted(() => vi.fn<(error: unknown) => string | null>(() => null))
const mockMapApiErrorCode = vi.hoisted(() => vi.fn<(code: string) => string>(() => 'mapped'))

vi.mock('@/lib/api', () => ({
  updateDisplayName: mockUpdateDisplayName,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => unknown>(() => ({
    applyProfile: mockApplyProfile,
  })),
}))

vi.mock('vue-sonner', () => ({
  toast: { success: mockToastSuccess, error: vi.fn<(...args: unknown[]) => void>() },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: mockExtractErrorCode,
  mapApiErrorCode: mockMapApiErrorCode,
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled', 'variant', 'type'],
    template: '<button :disabled="disabled" :type="type" v-bind="$attrs"><slot /></button>',
  },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { props: ['open'], template: '<div data-testid="dialog-root"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}))

const PROFILE = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  emailVerified: true,
  emailChangePending: false,
  hasPassword: true,
  createdAt: '2026-07-01T00:00:00Z',
  lastLoginAt: null,
  termsVersion: '1.0',
}

interface ExposedForm {
  values: { displayName: string }
}

function exposedForm(wrapper: ReturnType<typeof mountWithQuery>): ExposedForm {
  return (wrapper.vm as unknown as { form: ExposedForm }).form
}

async function submitViaSetupState(wrapper: ReturnType<typeof mountWithQuery>): Promise<void> {
  const onSubmit = (wrapper.vm as unknown as { $: { setupState: { onSubmit: () => Promise<void> } } }).$.setupState
    .onSubmit
  await onSubmit()
  await flushPromises()
}

describe('DisplayNameDialog (real form integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExtractErrorCode.mockReturnValue(null)
  })

  it('prefills the field with the name on record when it opens', async () => {
    const wrapper = mountWithQuery(DisplayNameDialog, {
      props: { open: false, currentName: 'Ada Lovelace' },
      attachTo: document.body,
    })
    await flushPromises()

    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(exposedForm(wrapper).values.displayName).toBe('Ada Lovelace')
    expect((wrapper.find('[data-testid="display-name-input"]').element as HTMLInputElement).value).toBe('Ada Lovelace')
    wrapper.unmount()
  })

  it('does not call the API for a blank name and shows the required message', async () => {
    const wrapper = mountWithQuery(DisplayNameDialog, {
      props: { open: true, currentName: '' },
      attachTo: document.body,
    })
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockUpdateDisplayName).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Display name is required')
    wrapper.unmount()
  })

  it('rejects a name the server would refuse, before it leaves the browser', async () => {
    const wrapper = mountWithQuery(DisplayNameDialog, {
      props: { open: true, currentName: '' },
      attachTo: document.body,
    })
    await flushPromises()

    const input = wrapper.find('[data-testid="display-name-input"]')
    await input.setValue('x')
    await input.trigger('blur')
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockUpdateDisplayName).not.toHaveBeenCalled()
    expect(exposedForm(wrapper).values.displayName).toBe('x')
    wrapper.unmount()
  })

  it('keeps the profile the server returned and closes on success', async () => {
    mockUpdateDisplayName.mockResolvedValue(PROFILE)
    const wrapper = mountWithQuery(DisplayNameDialog, {
      props: { open: true, currentName: 'Old_Name' },
      attachTo: document.body,
    })
    await flushPromises()

    const input = wrapper.find('[data-testid="display-name-input"]')
    await input.setValue('Ada_Lovelace')
    await input.trigger('blur')
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockUpdateDisplayName).toHaveBeenCalledWith('Ada_Lovelace')
    expect(mockApplyProfile).toHaveBeenCalledWith(PROFILE)
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('shows the mapped message when the server refuses the change', async () => {
    mockExtractErrorCode.mockReturnValue('AUTH_022')
    mockMapApiErrorCode.mockReturnValue('This account is deactivated.')
    mockUpdateDisplayName.mockRejectedValue({ statusCode: 403, data: { code: 'AUTH_022' } })
    const wrapper = mountWithQuery(DisplayNameDialog, {
      props: { open: true, currentName: 'Ada_Lovelace' },
      attachTo: document.body,
    })
    await flushPromises()

    await submitViaSetupState(wrapper)

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('This account is deactivated.')
    expect(mockApplyProfile).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
