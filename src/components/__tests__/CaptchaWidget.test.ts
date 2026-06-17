import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Hoist mock references so they are available when vi.mock() is hoisted
const mockReset = vi.hoisted(() => vi.fn<() => void>())

vi.mock('@hcaptcha/vue3-hcaptcha', () => ({
  default: {
    name: 'VueHcaptchaStub',
    props: ['sitekey', 'theme', 'size', 'language'],
    expose: ['reset'],
    methods: {
      reset: mockReset,
    },
    template: '<div class="hcaptcha-stub" />',
  },
}))

import CaptchaWidget from '../CaptchaWidget.vue'

describe('CaptchaWidget', () => {
  const SITEKEY = '10000000-ffff-ffff-ffff-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders VueHcaptcha with the correct sitekey prop', () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    expect(stub.exists()).toBe(true)
    expect(stub.props('sitekey')).toBe(SITEKEY)
  })

  it('initializes with modelValue as null', () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    // No update:modelValue event should be emitted on mount
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits "verify" and sets modelValue when onVerify fires', async () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    await stub.vm.$emit('verify', 'test-token-abc')

    expect(wrapper.emitted('verify')).toHaveLength(1)
    expect(wrapper.emitted('verify')![0]).toEqual(['test-token-abc'])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['test-token-abc'])
  })

  it('sets modelValue to null and emits "expire" on token expiry', async () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    // Widget is visible, emit expired directly
    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    await stub.vm.$emit('expired')

    expect(wrapper.emitted('expire')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
  })

  it('sets modelValue to null and emits "error" on captcha error', async () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    // Widget is visible, emit error directly
    const errorPayload = new Error('captcha-failed')
    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    await stub.vm.$emit('error', errorPayload)

    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.emitted('error')![0]).toEqual([errorPayload])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
  })

  it('sets modelValue to null and emits "challengeExpired" when challenge dismissed', async () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    // Widget is visible, emit challengeExpired directly
    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    await stub.vm.$emit('challengeExpired')

    expect(wrapper.emitted('challengeExpired')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
  })

  it('reset() calls hcaptchaRef.reset() and clears modelValue', async () => {
    const wrapper = mount(CaptchaWidget, {
      props: { sitekey: SITEKEY },
    })

    // First verify to set modelValue
    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    await stub.vm.$emit('verify', 'active-token')
    await nextTick()

    // Widget should be hidden after verification
    expect(wrapper.findComponent({ name: 'VueHcaptchaStub' }).exists()).toBe(false)

    // Trigger reset via the exposed method
    ;(wrapper.vm as unknown as { reset: () => void }).reset()
    await nextTick()

    // Widget should be visible again after reset
    const stubAfterReset = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    expect(stubAfterReset.exists()).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([null])
  })

  it('passes theme, size, and language props through to VueHcaptcha', () => {
    const wrapper = mount(CaptchaWidget, {
      props: {
        sitekey: SITEKEY,
        theme: 'dark',
        size: 'compact',
        language: 'jpn',
      },
    })

    const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
    expect(stub.props('theme')).toBe('dark')
    expect(stub.props('size')).toBe('compact')
    expect(stub.props('language')).toBe('jpn')
  })
})
