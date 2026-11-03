import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const mockSignIn = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const usedBefore = vi.hoisted(() => ({ value: false }))

vi.mock('@hcaptcha/vue3-hcaptcha', () => ({
  default: { name: 'VueHcaptchaStub', props: ['sitekey'], template: '<div class="hcaptcha-stub" />' },
}))
vi.mock('vue-router', () => ({
  RouterLink: { name: 'RouterLink', props: ['to'], template: '<a><slot /></a>' },
}))
vi.mock('@/router/route-names', () => ({ RouteNames: { FORGOT_PASSWORD: 'forgot-password' } }))
vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ isDark: false }) }))
vi.mock('@/lib/utils/passkey-preference', () => ({
  hasUsedPasskey: () => usedBefore.value,
  rememberPasskeyUse: vi.fn<() => void>(),
}))
vi.mock('../../composables/usePasskeySignIn', () => ({
  usePasskeySignIn: () => ({
    supported: true,
    conditionalSupported: computed(() => true),
    pending: ref(false),
    errorCode: ref<string | null>(null),
    signIn: mockSignIn,
    cancel: vi.fn<() => void>(),
  }),
}))

import LoginForm from '../LoginForm.vue'

describe('LoginForm passkey offering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usedBefore.value = false
    mockSignIn.mockResolvedValue(null)
  })

  it('opens the picker on load for a reader who used a passkey here before', async () => {
    usedBefore.value = true
    mount(LoginForm)
    await flushPromises()

    // No field interaction needed: this reader has already proven they hold one.
    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(mockSignIn).toHaveBeenCalledWith('optional')
  })

  it('waits to be asked on a browser that never used one', async () => {
    mount(LoginForm)
    await flushPromises()

    // A picker on every visit would open for people who hold no passkey at all.
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('arms the field-driven offer only when the username field is reached', async () => {
    const wrapper = mount(LoginForm)
    await flushPromises()

    await wrapper.find('input[type="email"]').trigger('focus')
    await flushPromises()

    expect(mockSignIn).toHaveBeenCalledWith('conditional')
  })
})
