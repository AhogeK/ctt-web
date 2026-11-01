import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import DeleteAccountDialog from '../DeleteAccountDialog.vue'

const mockDeleteAccount = vi.hoisted(() => vi.fn<(password: string | null) => Promise<unknown>>())

vi.mock('../../composables/useDeleteAccount', () => ({
  useDeleteAccount: () => ({
    mutation: { mutate: mockDeleteAccount, isPending: { value: false } },
  }),
}))

/**
 * Both branches of the confirmation ask for something before the account can be deleted. An
 * untouched field must say which thing in the catalogue's words — Zod's own wording about the
 * runtime type has no place on a destructive dialog.
 */
async function submit(wrapper: ReturnType<typeof mount>): Promise<void> {
  // jsdom does not propagate `submit` through vee-validate's handleSubmit, so the handler is
  // invoked through setup state; the validation path itself is real.
  const onSubmit = (wrapper.vm as unknown as { $: { setupState: { onSubmit: () => Promise<void> } } }).$.setupState
    .onSubmit
  await onSubmit()
  await flushPromises()
}

describe('DeleteAccountDialog - empty submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the password when the account has one', async () => {
    const wrapper = mount(DeleteAccountDialog, {
      props: { open: true, email: 'me@example.com', hasPassword: true },
      attachTo: document.body,
    })
    await flushPromises()

    await submit(wrapper)

    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('Enter your password to confirm')
    expect(document.body.textContent).not.toContain('Invalid input')
    wrapper.unmount()
  })

  it('asks for the typed email when the account has no password', async () => {
    const wrapper = mount(DeleteAccountDialog, {
      props: { open: true, email: 'me@example.com', hasPassword: false },
      attachTo: document.body,
    })
    await flushPromises()

    await submit(wrapper)

    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('Type your email to confirm')
    expect(document.body.textContent).not.toContain('Invalid input')
    wrapper.unmount()
  })
})
