import { describe, expect, it, vi } from 'vite-plus/test'
import { toast } from 'vue-sonner'
import { flushPromises, mount } from '@vue/test-utils'
import RecoveryCodesPanel from '../RecoveryCodesPanel.vue'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn<(...args: unknown[]) => void>() } }))

const CODES = Array.from({ length: 10 }, (_, index) => `KYQV-BATK-MZVK-MMX${index}`)

function mountPanel(onConfirmed = vi.fn<() => void>()) {
  return mount(RecoveryCodesPanel, {
    props: {
      codes: CODES,
      acknowledged: false,
      'onUpdate:acknowledged': (value: boolean) => wrapper.setProps({ acknowledged: value }),
      onConfirmed,
    },
  })
}

let wrapper: ReturnType<typeof mount>

describe('RecoveryCodesPanel', () => {
  it('lists every code the server issued', () => {
    wrapper = mountPanel()
    const items = wrapper.findAll('[data-testid="recovery-code"]')
    expect(items).toHaveLength(10)
    expect(items[0]!.text()).toBe(CODES[0])
  })

  it('refuses to finish until the reader says the codes are stored', async () => {
    wrapper = mountPanel()
    const done = wrapper.get('[data-testid="recovery-done"]')
    expect(done.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="recovery-acknowledge"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="recovery-done"]').attributes('disabled')).toBeUndefined()
  })

  it('copies the batch as one block', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    wrapper = mountPanel()

    await wrapper.get('[data-testid="recovery-copy"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(CODES.join('\n'))
  })

  it('says so when the clipboard refuses, instead of silently doing nothing', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn<() => Promise<void>>().mockRejectedValue(new Error('denied')) },
    })
    wrapper = mountPanel()

    await wrapper.get('[data-testid="recovery-copy"]').trigger('click')
    await flushPromises()

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="recovery-copy"]').text()).not.toBe('Copied')
  })

  it('hands the codes over as a downloadable file', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>().mockReturnValue('blob:codes')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn<() => void>() })
    wrapper = mountPanel()

    await wrapper.get('[data-testid="recovery-download"]').trigger('click')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0]![0]
    expect(await blob.text()).toContain(CODES[0])
  })
})
