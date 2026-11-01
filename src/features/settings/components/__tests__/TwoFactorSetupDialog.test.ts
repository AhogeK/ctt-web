import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import TwoFactorSetupDialog from '../TwoFactorSetupDialog.vue'

const mockStart = vi.hoisted(() => vi.fn<(password?: string) => Promise<unknown>>())
const mockConfirm = vi.hoisted(() => vi.fn<(code: string) => Promise<unknown>>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())

vi.mock('../../composables/useTwoFactor', () => ({
  useStartTwoFactorSetup: () => ({ mutation: { mutateAsync: mockStart, isPending: ref(false) } }),
  useConfirmTwoFactorSetup: () => ({ mutation: { mutateAsync: mockConfirm, isPending: ref(false) } }),
}))

vi.mock('vue-sonner', () => ({ toast: { success: mockToastSuccess, error: vi.fn<() => void>() } }))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { name: 'DialogContent', props: ['showCloseButton'], template: '<div><slot /></div>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogFooter: { template: '<div><slot /></div>' },
}))

// The server encodes 20 random bytes once: 32 Base32 characters, no padding.
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
const SETUP = {
  secret: SECRET,
  otpauthUri:
    'otpauth://totp/Code%20Time%20Tracker:user@example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Code%20Time%20Tracker',
  digits: 6,
  period: 30,
  issuer: 'Code Time Tracker',
  expiresAt: '2026-11-01T10:40:00Z',
}

const CODES = Array.from({ length: 10 }, (_, index) => `CODE-${index}`)

function mountDialog(hasPassword = true) {
  return mount(TwoFactorSetupDialog, {
    props: { open: true, hasPassword, 'onUpdate:open': () => {} },
  })
}

describe('TwoFactorSetupDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the password first and shows the secret once the server accepts it', async () => {
    mockStart.mockResolvedValue(SETUP)
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="two-factor-password"]').setValue('SecurePass1!')
    await wrapper.get('[data-testid="two-factor-password-submit"]').trigger('click')
    await flushPromises()

    expect(mockStart).toHaveBeenCalledWith('SecurePass1!')
    // Exactly what the server issued: 32 characters, nothing stripped.
    expect(wrapper.get('[data-testid="two-factor-secret"]').text()).toBe(SECRET)
    expect(wrapper.get('[data-testid="two-factor-uri"]').attributes('href')).toBe(SETUP.otpauthUri)

    // The code itself has to be scannable, not just the key: the plate is white in both themes.
    const qr = wrapper.get('[data-testid="two-factor-qr"]')
    // Canvas rather than SVG: the modules land on whole pixels, which scanners read more reliably.
    expect(qr.element.tagName.toLowerCase()).toBe('canvas')
    // The code has to encode the exact otpauth URI, not just "something".
    expect(wrapper.findComponent(QrcodeVue).props('value')).toBe(SETUP.otpauthUri)
    expect(wrapper.get('[data-testid="two-factor-qr-plate"]').classes()).toContain('bg-white')
  })

  it('copies the setup key for readers who cannot scan', async () => {
    mockStart.mockResolvedValue(SETUP)
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="two-factor-password"]').setValue('SecurePass1!')
    await wrapper.get('[data-testid="two-factor-password-submit"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="two-factor-copy-secret"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(SECRET)
    expect(wrapper.get('[data-testid="two-factor-copy-secret"]').text()).toBe('Copied')
  })

  it('still copies the key where the async clipboard API is unavailable', async () => {
    mockStart.mockResolvedValue(SETUP)
    // Self-hosted http is an insecure context: `navigator.clipboard` is undefined there.
    Object.assign(navigator, { clipboard: undefined })
    const execCommand = vi.fn<() => boolean>().mockReturnValue(true)
    Object.assign(document, { execCommand })
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="two-factor-password"]').setValue('SecurePass1!')
    await wrapper.get('[data-testid="two-factor-password-submit"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="two-factor-copy-secret"]').trigger('click')
    await flushPromises()

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(wrapper.get('[data-testid="two-factor-copy-secret"]').text()).toBe('Copied')
  })

  it('keeps the reader on the password step when the password is refused', async () => {
    mockStart.mockRejectedValue(
      Object.assign(new Error('bad password'), { statusCode: 401, data: { code: 'USER_014' } }),
    )
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="two-factor-password"]').setValue('wrong')
    await wrapper.get('[data-testid="two-factor-password-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="two-factor-password"]').exists()).toBe(true)
    // The reader sees a sentence, never the raw code: the catalogue owns the wording.
    const alert = wrapper.get('[role="alert"]').text()
    expect(alert.length).toBeGreaterThan(0)
    expect(alert).not.toContain('USER_014')
  })

  it('reports a wrong code in place and only leaves the step once the code is accepted', async () => {
    mockStart.mockResolvedValue(SETUP)
    mockConfirm.mockRejectedValueOnce(
      Object.assign(new Error('bad code'), { statusCode: 401, data: { code: 'AUTH_027' } }),
    )
    mockConfirm.mockResolvedValueOnce(CODES)
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="two-factor-password"]').setValue('SecurePass1!')
    await wrapper.get('[data-testid="two-factor-password-submit"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="two-factor-secret-next"]').trigger('click')

    await wrapper.get('[data-testid="two-factor-setup-code"]').setValue('000000')
    await wrapper.get('[data-testid="two-factor-code-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="two-factor-setup-code"]').exists()).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain('not right')

    await wrapper.get('[data-testid="two-factor-setup-code"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-code-submit"]').trigger('click')
    await flushPromises()

    expect(mockConfirm).toHaveBeenLastCalledWith('123456')
    expect(wrapper.findAll('[data-testid="recovery-code"]')).toHaveLength(10)
    expect(wrapper.findComponent({ name: 'DialogContent' }).props('showCloseButton')).toBe(false)
  })

  it('skips the password step for an account without one and starts immediately', async () => {
    mockStart.mockResolvedValue(SETUP)
    const wrapper = mountDialog(false)
    await flushPromises()

    expect(mockStart).toHaveBeenCalledWith(undefined)
    expect(wrapper.find('[data-testid="two-factor-password"]').exists()).toBe(false)
    // Exactly what the server issued: 32 characters, nothing stripped.
    expect(wrapper.get('[data-testid="two-factor-secret"]').text()).toBe(SECRET)
  })
})
