import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import RawKeyDialog from '../RawKeyDialog.vue'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockCopy = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<boolean>>())
let copiedValue = false

// ==========================================
// Mocks
// ==========================================

vi.mock('@/composables/useCopyToClipboard', () => ({
  useCopyToClipboard: vi.fn<() => unknown>(() => ({
    copied: ref(copiedValue),
    copy: mockCopy,
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: {
    props: ['open'],
    template: '<div data-testid="dialog-root"><slot /></div>',
  },
  DialogContent: {
    props: ['showCloseButton'],
    template:
      '<div data-testid="dialog-content" :data-show-close-button="showCloseButton" v-bind="$attrs"><slot /></div>',
  },
  DialogDescription: { template: '<div data-testid="dialog-description" v-bind="$attrs"><slot /></div>' },
  DialogFooter: { template: '<div data-testid="dialog-footer"><slot /></div>' },
  DialogHeader: { template: '<div data-testid="dialog-header"><slot /></div>' },
  DialogTitle: { template: '<div data-testid="dialog-title" v-bind="$attrs"><slot /></div>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

const RAW_KEY = 'cttak_a1b2c3d4_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4'

describe('RawKeyDialog', () => {
  beforeEach(() => {
    copiedValue = false
    mockCopy.mockReset()
    mockCopy.mockResolvedValue(true)
  })

  function createWrapper(open = true) {
    return mount(RawKeyDialog, {
      props: {
        open,
        rawKey: RAW_KEY,
      },
    })
  }

  it('renders the raw key value', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe(RAW_KEY)
  })

  it('defers title/description aria wiring to the dialog primitives (no manual ids)', () => {
    // reka-ui's DialogContent generates the title/description ids and wires
    // aria-labelledby/aria-describedby itself. Passing manual ids would orphan
    // reka's generated ids and trip its dev-mode a11y warnings. The real
    // wiring (content -> title/description ids) is covered in
    // RawKeyDialog.a11y.test.ts with the real reka-ui stack.
    const wrapper = createWrapper()
    const content = wrapper.find('[data-testid="dialog-content"]')
    expect(content.attributes('aria-labelledby')).toBeUndefined()
    expect(content.attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.find('[data-testid="dialog-title"]').attributes('id')).toBeUndefined()
    expect(wrapper.find('[data-testid="dialog-description"]').attributes('id')).toBeUndefined()
  })

  it('shows the one-time warning text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('This key is shown only once')
  })

  it('keeps the close button disabled until the key is copied (strong constraint)', async () => {
    const wrapper = createWrapper()
    const closeButton = wrapper.findAll('button').at(-1)!
    expect(closeButton?.attributes('disabled')).toBeDefined()
  })

  it('enables the close button after a successful copy', async () => {
    const wrapper = createWrapper()
    const copyButton = wrapper.findAll('button')[0]!

    await copyButton.trigger('click')
    await vi.waitFor(() => {
      expect(mockCopy).toHaveBeenCalledWith(RAW_KEY)
    })

    const closeButton = wrapper.findAll('button').at(-1)!
    expect(closeButton?.attributes('disabled')).toBeUndefined()
  })

  it('changes the copy button label after copying', async () => {
    copiedValue = true
    const wrapper = createWrapper()
    expect(wrapper.findAll('button')[0]!.text()).toContain('Copied')
  })

  it('keeps the close button disabled when the copy attempt fails', async () => {
    mockCopy.mockResolvedValue(false)
    const wrapper = createWrapper()
    const copyButton = wrapper.findAll('button')[0]!

    await copyButton.trigger('click')
    await vi.waitFor(() => {
      expect(mockCopy).toHaveBeenCalled()
    })

    const closeButton = wrapper.findAll('button').at(-1)!
    expect(closeButton?.attributes('disabled')).toBeDefined()
  })

  it('emits update:open false when the close button is clicked after copying', async () => {
    mockCopy.mockResolvedValue(true)
    const wrapper = createWrapper()
    const copyButton = wrapper.findAll('button')[0]!

    await copyButton.trigger('click')
    await vi.waitFor(() => expect(mockCopy).toHaveBeenCalled())

    const closeButton = wrapper.findAll('button').at(-1)!
    await closeButton!.trigger('click')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('renders no visible close (X) button on the dialog content', () => {
    const wrapper = createWrapper()
    const content = wrapper.find('[data-testid="dialog-content"]')
    expect(content.attributes('data-show-close-button')).toBe('false')
  })

  it('emits update:open only through the explicit close button', async () => {
    const wrapper = createWrapper()
    // No interaction yet: the component itself must not emit update:open.
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})
