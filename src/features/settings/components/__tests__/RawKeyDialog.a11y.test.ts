import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import RawKeyDialog from '../RawKeyDialog.vue'

vi.mock('@/composables/useCopyToClipboard', () => ({
  useCopyToClipboard: vi.fn<() => { copied: Ref<boolean>; copy: (text: string) => Promise<boolean> }>(() => ({
    copied: ref(false),
    copy: vi.fn<(text: string) => Promise<boolean>>(async () => true),
  })),
}))

const RAW_KEY = 'cttak_a1b2c3d4_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4'

describe('RawKeyDialog a11y wiring (real reka-ui)', () => {
  const warns: string[] = []
  const origWarn = console.warn

  beforeEach(() => {
    document.body.innerHTML = ''
    warns.length = 0
    // Intercept reka-ui dev warnings so a regression fails the test instead of polluting stdout.
    console.warn = (msg: unknown) => {
      if (String(msg).includes('DialogContent')) warns.push(String(msg))
    }
  })

  afterEach(() => {
    console.warn = origWarn
  })

  it('wires aria-labelledby/aria-describedby to existing title/description elements without warnings', async () => {
    const wrapper = mount(RawKeyDialog, {
      props: { open: true, rawKey: RAW_KEY },
    })
    await nextTick()
    await new Promise((r) => setTimeout(r, 30))

    const content = document.querySelector('[data-slot="dialog-content"]')
    const title = document.querySelector('[data-slot="dialog-title"]')
    const description = document.querySelector('[data-slot="dialog-description"]')

    expect(content).not.toBeNull()
    expect(content?.getAttribute('role')).toBe('alertdialog')

    const labelledBy = content?.getAttribute('aria-labelledby')
    const describedBy = content?.getAttribute('aria-describedby')
    expect(labelledBy).toBeTruthy()
    expect(describedBy).toBeTruthy()
    expect(title?.id).toBe(labelledBy)
    expect(description?.id).toBe(describedBy)

    wrapper.unmount()
    expect(warns).toEqual([])
  })
})
