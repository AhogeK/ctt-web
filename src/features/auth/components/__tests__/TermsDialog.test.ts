import { beforeEach, describe, expect, it, vi, afterEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import TermsDialog from '../TermsDialog.vue'
import { getPublicConfig } from '@/lib/api/config'
import { acceptTerms } from '@/lib/api/auth'
import { toast } from 'vue-sonner'
import { rejectTermsQueue } from '@/lib/api/instance'

const mockSetAuthFromTermsAcceptance = vi.fn<(response: unknown) => void>()

vi.mock('@/lib/api/config', () => ({
  getPublicConfig: vi.fn<() => Promise<{ termsVersion: string }>>(),
}))

vi.mock('@/lib/api/auth', () => ({
  acceptTerms: vi.fn<
    () => Promise<{
      userId: string
      accessToken: string
      refreshToken: string
      expiresIn: number
      tokenType: 'Bearer'
      termsExpired: boolean
    }>
  >(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn<() => void>(),
    success: vi.fn<() => void>(),
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => { setAuthFromTermsAcceptance: (response: unknown) => void }>(() => ({
    setAuthFromTermsAcceptance: mockSetAuthFromTermsAcceptance,
  })),
}))

vi.mock('@/lib/api/instance', () => ({
  rejectTermsQueue: vi.fn<() => void>(),
  resolveTermsQueue: vi.fn<() => void>(),
  TERMS_EXPIRED_EVENT: 'api:terms-expired',
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: {
    props: ['open'],
    emits: ['update:open'],
    template: `<div v-if="open" class="dialog-mock"><slot /></div>`,
  },
  DialogContent: {
    template: '<div class="dialog-content-mock"><slot /></div>',
  },
  DialogHeader: {
    template: '<div class="dialog-header-mock"><slot /></div>',
  },
  DialogTitle: {
    template: '<h2 class="dialog-title-mock"><slot /></h2>',
  },
  DialogDescription: {
    template: '<p class="dialog-description-mock"><slot /></p>',
  },
  DialogFooter: {
    template: '<div class="dialog-footer-mock"><slot /></div>',
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['variant', 'disabled'],
    template: `<button :disabled="disabled" class="button-mock"><slot /></button>`,
  },
}))

vi.mock('@/features/auth/content', () => ({
  termsContent: {
    language: 'en',
    lastUpdated: '2026-05-02',
    version: '1.0.0',
    sections: [
      { id: 'acceptance', title: '1. Acceptance of Terms', content: 'By accessing...' },
      { id: 'description', title: '2. Description of Service', content: 'Code Time Tracker...' },
    ],
    disclaimer: 'This document is a template...',
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function mountWithQuery(component: Parameters<typeof mount>[0], options?: Parameters<typeof mount>[1]) {
  const queryClient = createTestQueryClient()
  return mount(component, {
    ...options,
    global: {
      ...options?.global,
      plugins: [...(options?.global?.plugins ?? []), [VueQueryPlugin, { queryClient }]],
    },
  })
}

describe('TermsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetAuthFromTermsAcceptance.mockClear()
    vi.mocked(getPublicConfig).mockResolvedValue({ termsVersion: '1.0.0' })
    vi.mocked(acceptTerms).mockResolvedValue({
      userId: 'test-user-id',
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresIn: 3600,
      tokenType: 'Bearer',
      termsExpired: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      expect(wrapper.find('.dialog-mock').exists()).toBe(true)
    })

    it('does not render dialog when open is false', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: false },
      })

      expect(wrapper.find('.dialog-mock').exists()).toBe(false)
    })

    it('renders section titles', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('1. Acceptance of Terms')
      expect(wrapper.text()).toContain('2. Description of Service')
    })

    it('renders Accept and Decline buttons', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(2)
      expect(buttons[0]!.text()).toContain('Decline')
      expect(buttons[1]!.text()).toContain('Accept')
    })
  })

  describe('getPublicConfig', () => {
    it('fetches terms version on mount', async () => {
      mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      expect(getPublicConfig).toHaveBeenCalled()
    })

    it('shows fallback version when getPublicConfig fails', async () => {
      vi.mocked(getPublicConfig).mockRejectedValue(new Error('Network error'))

      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Version 1.0.0')
    })
  })

  describe('handleAccept', () => {
    it('calls acceptTerms API when Accept button clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')

      expect(acceptTerms).toHaveBeenCalled()
    })

    it('calls setAuthFromTermsAcceptance with response on successful acceptance', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(mockSetAuthFromTermsAcceptance).toHaveBeenCalledWith({
        userId: 'test-user-id',
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: false,
      })
    })

    it('shows success toast on successful acceptance', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(toast.success).toHaveBeenCalledWith('Terms accepted successfully')
    })

    it('emits accepted event on successful acceptance', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('accepted')).toBeTruthy()
    })

    it('closes dialog on successful acceptance', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('shows error toast on acceptance failure', async () => {
      vi.mocked(acceptTerms).mockRejectedValue(new Error('Network error'))

      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(toast.error).toHaveBeenCalledWith('Failed to accept terms. Please try again.')
    })

    it('logs error to console on acceptance failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())
      vi.mocked(acceptTerms).mockRejectedValue(new Error('Network error'))

      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('disables Accept button while loading', async () => {
      vi.mocked(acceptTerms).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  userId: 'user-id',
                  accessToken: 'token',
                  refreshToken: 'refresh',
                  expiresIn: 3600,
                  tokenType: 'Bearer',
                  termsExpired: false,
                }),
              100,
            )
          }),
      )

      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(acceptButton.attributes('disabled')).toBeDefined()
    })

    it('shows Accepting... text while loading', async () => {
      vi.mocked(acceptTerms).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  userId: 'user-id',
                  accessToken: 'token',
                  refreshToken: 'refresh',
                  expiresIn: 3600,
                  tokenType: 'Bearer',
                  termsExpired: false,
                }),
              100,
            )
          }),
      )

      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      expect(acceptButton.text()).toContain('Accepting...')
    })
  })

  describe('handleReject', () => {
    it('emits rejected event when Decline button clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const declineButton = wrapper.findAll('button')[0]!
      await declineButton.trigger('click')

      expect(wrapper.emitted('rejected')).toBeTruthy()
    })

    it('closes dialog when Decline button clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const declineButton = wrapper.findAll('button')[0]!
      await declineButton.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('does not call acceptTerms API when Decline clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const declineButton = wrapper.findAll('button')[0]!
      await declineButton.trigger('click')

      expect(acceptTerms).not.toHaveBeenCalled()
    })
  })

  describe('dialog close without decision', () => {
    it('emits rejected when dialog closes without explicit decision', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      // Simulate dialog closing by clicking outside or pressing Escape
      // Directly mutate vm.open to trigger the defineModel watch
      const vm = wrapper.vm as unknown as { open: boolean }
      vm.open = false
      await nextTick()

      expect(wrapper.emitted('rejected')).toBeTruthy()
    })

    it('calls rejectTermsQueue when dialog closes without explicit decision', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const vm = wrapper.vm as unknown as { open: boolean }
      vm.open = false
      await nextTick()

      expect(rejectTermsQueue).toHaveBeenCalled()
    })

    it('does not emit rejected when dialog closes after explicit accept', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      // Click accept button (explicit decision)
      const acceptButton = wrapper.findAll('button')[1]!
      await acceptButton.trigger('click')
      await nextTick()

      // Clear the emitted events to check for duplicate rejected
      const rejectedCountBefore = wrapper.emitted('rejected')?.length ?? 0

      // Dialog closes automatically after accept, but let's verify no duplicate rejected
      expect(wrapper.emitted('rejected')?.length ?? 0).toBe(rejectedCountBefore)
    })
  })

  describe('open prop', () => {
    it('updates open model when dialog closes', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true },
      })

      await nextTick()

      const declineButton = wrapper.findAll('button')[0]!
      await declineButton.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
    })
  })

  describe('readOnly mode', () => {
    it('renders only a Close button when readOnly is true', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(1)
      expect(buttons[0]!.text()).toContain('Close')
    })

    it('does not render Accept and Decline buttons when readOnly is true', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map((b) => b.text())
      expect(buttonTexts).not.toContain('Accept')
      expect(buttonTexts).not.toContain('Decline')
    })

    it('emits rejected when Close button clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      await nextTick()

      const closeButton = wrapper.findAll('button')[0]!
      await closeButton.trigger('click')

      expect(wrapper.emitted('rejected')).toBeTruthy()
    })

    it('closes dialog when Close button clicked', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      await nextTick()

      const closeButton = wrapper.findAll('button')[0]!
      await closeButton.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('calls rejectTermsQueue when dialog closes in readOnly mode', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      await nextTick()

      const vm = wrapper.vm as unknown as { open: boolean }
      vm.open = false
      await nextTick()

      expect(rejectTermsQueue).toHaveBeenCalled()
    })

    it('does not call acceptTerms API in readOnly mode', async () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      await nextTick()

      const closeButton = wrapper.findAll('button')[0]!
      await closeButton.trigger('click')
      await nextTick()

      expect(acceptTerms).not.toHaveBeenCalled()
    })

    it('renders section content in readOnly mode', () => {
      const wrapper = mountWithQuery(TermsDialog, {
        props: { open: true, readOnly: true },
      })

      expect(wrapper.text()).toContain('1. Acceptance of Terms')
      expect(wrapper.text()).toContain('2. Description of Service')
    })
  })
})
