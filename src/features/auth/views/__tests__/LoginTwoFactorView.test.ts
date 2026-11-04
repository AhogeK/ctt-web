import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import LoginTwoFactorView from '../LoginTwoFactorView.vue'
import { Input } from '@/components/ui/input'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockPush = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockResolve = vi.hoisted(() =>
  vi.fn<(raw: string) => { meta: { requiresAuth: boolean } }>((raw) => ({
    // Unit-boundary stub: the resolver only reads meta.requiresAuth; the real
    // route table is exercised by the login e2e specs.
    meta: { requiresAuth: !raw.startsWith('/auth') && raw !== '/' },
  })),
)
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockIsApiError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMapApiErrorCode = vi.hoisted(() => vi.fn<(code: string) => string>((code) => code))
const mockCompleteTwoFactorLogin = vi.hoisted(() => vi.fn<(code: string) => Promise<unknown>>())
const mockClearTwoFactorChallenge = vi.hoisted(() => vi.fn<() => void>())

const routeQueryState = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
const pendingTwoFactorState = vi.hoisted(() => ({ value: null as unknown }))
const isPendingRef = vi.hoisted(() => ({ __v_isRef: true, value: false }))

const mutations = vi.hoisted(
  () =>
    [] as Array<{
      onSuccess?: () => void
      onError?: (error: unknown) => void
      mutate: (...args: unknown[]) => unknown
      isPending: { value: boolean }
    }>,
)

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-router', () => ({
  useRouter: vi.fn<
    () => {
      replace: (...args: unknown[]) => unknown
      push: (...args: unknown[]) => unknown
      resolve: (raw: string) => unknown
    }
  >(() => ({ replace: mockReplace, push: mockPush, resolve: mockResolve })),
  useRoute: vi.fn<() => { query: Record<string, unknown> }>(() => ({
    query: routeQueryState.value,
  })),
  RouterLink: vi.fn<
    (_: unknown, ctx: { slots: { default?: () => unknown }; attrs: Record<string, unknown> }) => unknown
  >((_, { slots }) => slots?.default?.()),
  createRouter: vi.fn<() => { install: () => void; onError: () => void }>(() => ({
    install: vi.fn<() => void>(),
    onError: vi.fn<() => void>(),
  })),
  createWebHistory: vi.fn<() => void>(),
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn<() => void>(),
    currentRoute: { value: { fullPath: '/' } },
  },
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn<
    (options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
      mutate: (...args: unknown[]) => unknown
      isPending: { value: boolean }
    }
  >((options) => {
    const mutation = {
      onSuccess: options.onSuccess,
      onError: options.onError,
      mutate: mockMutate,
      isPending: isPendingRef,
    }
    mutations.push(mutation)
    return mutation
  }),
}))

vi.mock('@/stores/auth', async () => {
  return {
    useAuthStore: vi.fn<
      () => {
        pendingTwoFactor: unknown
        completeTwoFactorLogin: (code: string) => Promise<unknown>
        clearTwoFactorChallenge: () => void
      }
    >(() => ({
      // Pinia unwraps refs on the store object, so the fake must hand over the value too.
      get pendingTwoFactor() {
        return pendingTwoFactorState.value
      },
      completeTwoFactorLogin: mockCompleteTwoFactorLogin,
      clearTwoFactorChallenge: mockClearTwoFactorChallenge,
    })),
  }
})

vi.mock('@/lib/utils/api-error', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/api-error')>()
  // Only the two judgement calls are stubbed; code extraction stays the real implementation, so a
  // test cannot pass on a shape the app never produces.
  return { ...actual, isApiError: mockIsApiError, mapApiErrorCode: mockMapApiErrorCode }
})

vi.mock('@/router/route-names', () => ({
  RouteNames: {
    LOGIN: 'login',
    LOGIN_TWO_FACTOR: 'login-two-factor',
    DASHBOARD: 'dashboard',
  },
}))

// The ceremony itself is exercised in its own suite; here it is scripted, so the view can be
// checked for what it tells the reader when the attempt ends without a session.
const passkeyState = vi.hoisted(() => ({
  pending: { value: false },
  errorCode: { value: null as string | null },
  signIn: vi.fn<() => Promise<null>>(async () => null),
}))

vi.mock('../../composables/useSecondFactorPasskey', () => ({
  useSecondFactorPasskey: () => passkeyState,
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}))

// ==========================================
// Helpers
// ==========================================

function createApiError(statusCode: number, code?: string): unknown {
  return {
    statusCode,
    statusMessage: 'Error',
    message: 'An error occurred',
    data: code ? { code } : undefined,
  }
}

const CHALLENGE = { twoFactorRequired: true, challengeToken: 'challenge-token', expiresIn: 300, passkeyCount: 0 }

function resetMocks() {
  vi.clearAllMocks()
  routeQueryState.value = {}
  pendingTwoFactorState.value = CHALLENGE
  isPendingRef.value = false
  mutations.length = 0
  mockIsApiError.mockReset()
  mockMapApiErrorCode.mockReset().mockImplementation((code) => code)
}

async function mountAndSubmit(code = '123456') {
  const wrapper = mount(LoginTwoFactorView)
  // vee-validate binds the field through `modelValue`, so the value travels as a component event
  // rather than as a DOM edit of the inner <input>.
  wrapper.findComponent(Input).vm.$emit('update:modelValue', code)
  await wrapper.find('form').trigger('submit')
  // Validation is async: the submit handler only runs after it settles.
  await flushPromises()
  return wrapper
}

// ==========================================
// Tests
// ==========================================

describe('LoginTwoFactorView', () => {
  beforeEach(() => {
    resetMocks()
    passkeyState.errorCode.value = null
    passkeyState.signIn.mockClear()
  })

  it('sends the reader back to the password form when no challenge is pending', async () => {
    pendingTwoFactorState.value = null

    const wrapper = mount(LoginTwoFactorView)
    await wrapper.vm.$nextTick()

    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: undefined })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('asks for the code in the current language when the field was never touched', async () => {
    const wrapper = mount(LoginTwoFactorView)

    await wrapper.find('form').trigger('submit')
    // Submit validation settles on its own schedule; wait for the message instead of a tick count.
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Enter your verification code')
    })
    // Zod's own wording names the runtime type, which says nothing to the person reading it.
    expect(wrapper.text()).not.toContain('Invalid input')
  })

  it('does not ask for a code when the reader switches to the passkey', async () => {
    pendingTwoFactorState.value = { ...CHALLENGE, passkeyCount: 1 }
    Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, writable: true, value: class {} })

    const wrapper = mount(LoginTwoFactorView)
    await flushPromises()

    // The reader was about to type, then changed method: moving focus must not accuse them of
    // leaving the field empty.
    await wrapper.get('input').trigger('focus')
    // Clicking the button moves focus out of the field; jsdom does not do that on its own.
    await wrapper.get('input').trigger('blur')
    await wrapper.get('[data-testid="two-factor-passkey"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Enter your verification code')
  })

  it('says something when the reader asked for the passkey and nothing came back', async () => {
    pendingTwoFactorState.value = { ...CHALLENGE, passkeyCount: 1 }
    Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, writable: true, value: class {} })

    const wrapper = mount(LoginTwoFactorView)
    await flushPromises()
    await wrapper.get('[data-testid="two-factor-passkey"]').trigger('click')
    await flushPromises()

    // Dismissing the system prompt leaves no code and no message of its own: a button that appears
    // to do nothing is indistinguishable from a broken one.
    expect(passkeyState.signIn).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('No passkey answered')
  })

  it('hides the passkey alternative when the account has none', async () => {
    // The browser can run the ceremony, so the absence has to come from the count in the challenge.
    Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, writable: true, value: class {} })
    pendingTwoFactorState.value = { ...CHALLENGE, passkeyCount: 0 }

    const wrapper = mount(LoginTwoFactorView)

    expect(wrapper.find('[data-testid="two-factor-passkey"]').exists()).toBe(false)
  })

  it('offers the passkey alternative when the challenge says one is registered', async () => {
    pendingTwoFactorState.value = { ...CHALLENGE, passkeyCount: 2 }
    // jsdom has no Web Authentication API; the entry only exists when the browser can run it.
    Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, writable: true, value: class {} })

    const wrapper = mount(LoginTwoFactorView)

    expect(wrapper.find('[data-testid="two-factor-passkey"]').exists()).toBe(true)
  })

  it('submits the code the reader typed', async () => {
    const wrapper = await mountAndSubmit('123456')

    // vee-validate settles submit validation on its own schedule, so wait for the call itself.
    await vi.waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('123456')
    })
    expect(wrapper.text()).toContain('Two-factor authentication')
  })

  it('keeps the reader on the step when only the code was wrong', async () => {
    const wrapper = await mountAndSubmit('000000')
    mockIsApiError.mockReturnValue(true)

    mutations[0]!.onError!(createApiError(401, 'AUTH_027'))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('That code is not right')
    expect(mockClearTwoFactorChallenge).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('returns to sign-in once the challenge itself is dead', async () => {
    const wrapper = await mountAndSubmit()
    mockIsApiError.mockReturnValue(true)

    mutations[0]!.onError!(createApiError(401, 'AUTH_026'))
    await wrapper.vm.$nextTick()

    expect(mockClearTwoFactorChallenge).toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: undefined })
  })

  it('returns to sign-in when the step is rate limited', async () => {
    const wrapper = await mountAndSubmit()
    mockIsApiError.mockReturnValue(true)

    mutations[0]!.onError!(createApiError(429))
    await wrapper.vm.$nextTick()

    expect(mockClearTwoFactorChallenge).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: undefined })
  })

  it('lands on the dashboard after the code is accepted', async () => {
    const wrapper = await mountAndSubmit()

    mutations[0]!.onSuccess!()
    await wrapper.vm.$nextTick()

    expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('honours a redirect that survived the first step', async () => {
    routeQueryState.value = { redirect: '/settings/api-keys' }
    const wrapper = await mountAndSubmit()

    mutations[0]!.onSuccess!()
    await wrapper.vm.$nextTick()

    expect(mockReplace).toHaveBeenCalledWith('/settings/api-keys')
  })
})
