import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useCopyToClipboard } from '../useCopyToClipboard'

/**
 * Factory for the component-scoped hook instance.
 * @vue/test-utils mounting is not required; a plain composable test
 * works when the hook only touches browser globals and lifecycle hooks.
 */
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Mounts the hook inside a harness component and exposes its return value
 * through the wrapper's vm so tests can assert the reactive `copied` flag.
 */
function mountHook() {
  const harness = defineComponent({
    setup() {
      const { copied, copy } = useCopyToClipboard()
      return { copied, copy }
    },
    render: () => null,
  })
  return mount(harness)
}

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('copies via navigator.clipboard when available', async () => {
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const wrapper = mountHook()
    const vm = wrapper.vm as unknown as { copied: boolean; copy: (t: string) => Promise<boolean> }
    const ok = await vm.copy('cttak_secret')

    expect(writeText).toHaveBeenCalledWith('cttak_secret')
    expect(ok).toBe(true)
    expect(vm.copied).toBe(true)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('resets the copied flag after 2 seconds', async () => {
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const wrapper = mountHook()
    const vm = wrapper.vm as unknown as { copied: boolean; copy: (t: string) => Promise<boolean> }
    await vm.copy('cttak_secret')
    expect(vm.copied).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(vm.copied).toBe(false)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('falls back to execCommand when navigator.clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const execCommand = vi.fn<(command: string) => boolean>().mockReturnValue(true)
    document.execCommand = execCommand
    const appendChild = vi.spyOn(document.body, 'appendChild')

    const wrapper = mountHook()
    const vm = wrapper.vm as unknown as { copied: boolean; copy: (t: string) => Promise<boolean> }
    const ok = await vm.copy('cttak_secret')

    expect(appendChild).toHaveBeenCalled()
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(ok).toBe(true)
    expect(vm.copied).toBe(true)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('returns false and keeps copied false when all paths fail', async () => {
    vi.stubGlobal('navigator', {})
    document.execCommand = vi.fn<(command: string) => boolean>().mockReturnValue(false)

    const wrapper = mountHook()
    const vm = wrapper.vm as unknown as { copied: boolean; copy: (t: string) => Promise<boolean> }
    const ok = await vm.copy('cttak_secret')

    expect(ok).toBe(false)
    expect(vm.copied).toBe(false)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('falls back when navigator.clipboard.writeText rejects', async () => {
    const writeText = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const execCommand = vi.fn<(command: string) => boolean>().mockReturnValue(true)
    document.execCommand = execCommand

    const wrapper = mountHook()
    const vm = wrapper.vm as unknown as { copied: boolean; copy: (t: string) => Promise<boolean> }
    const ok = await vm.copy('cttak_secret')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(ok).toBe(true)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })
})
