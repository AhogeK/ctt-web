import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockHcaptchaReset = vi.hoisted(() => vi.fn<() => void>())

// ==========================================
// Mocks
// ==========================================

vi.mock('@hcaptcha/vue3-hcaptcha', () => ({
  default: {
    name: 'VueHcaptchaStub',
    props: ['sitekey', 'theme', 'size', 'language'],
    expose: ['reset'],
    methods: {
      reset: mockHcaptchaReset,
    },
    template: '<div class="hcaptcha-stub" />',
  },
}))

// ==========================================
// Import component AFTER mocks
// ==========================================

import ForgotPasswordForm from '../ForgotPasswordForm.vue'

// ==========================================
// Tests
// ==========================================

describe('ForgotPasswordForm - hCaptcha integration', () => {
  const SITEKEY = '10000000-ffff-ffff-ffff-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CaptchaWidget rendering', () => {
    it('renders CaptchaWidget when captchaSiteKey provided', () => {
      const wrapper = mount(ForgotPasswordForm, {
        props: { captchaSiteKey: SITEKEY },
      })

      const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
      expect(stub.exists()).toBe(true)
      expect(stub.props('sitekey')).toBe(SITEKEY)
    })

    it('does NOT render CaptchaWidget when captchaSiteKey is null', () => {
      const wrapper = mount(ForgotPasswordForm, {
        props: { captchaSiteKey: null },
      })

      const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
      expect(stub.exists()).toBe(false)
    })

    it('does NOT render CaptchaWidget when captchaSiteKey is undefined', () => {
      const wrapper = mount(ForgotPasswordForm)

      const stub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
      expect(stub.exists()).toBe(false)
    })
  })

  describe('Captcha submission blocking', () => {
    it('blocks submission when captchaSiteKey set but no captchaToken', async () => {
      const wrapper = mount(ForgotPasswordForm, {
        props: { captchaSiteKey: SITEKEY },
      })

      const emailEl = wrapper.find('input[type="email"]').element as HTMLInputElement
      await fireEvent.update(emailEl, 'test@example.com')
      await flushPromises()

      // Submit the form without completing captcha
      // Note: trigger('submit') doesn't propagate through Vee-Validate's handleSubmit
      // in jsdom; call the handler directly via setup state instead.
      const onSubmit = (wrapper.vm as unknown as { $: { setupState: { onSubmit: () => Promise<void> } } }).$.setupState
        .onSubmit
      await onSubmit()
      await flushPromises()

      // Submit should NOT be emitted
      expect(wrapper.emitted('submit')).toBeUndefined()

      // Captcha error message should be visible (opacity-100)
      const errorMsg = wrapper.find('.text-destructive')
      expect(errorMsg.text()).toContain('Please complete the captcha verification')
      expect(errorMsg.classes()).toContain('opacity-100')
    })

    it('emits submit with captchaToken when captcha completed', async () => {
      const wrapper = mount(ForgotPasswordForm, {
        props: { captchaSiteKey: SITEKEY },
      })

      const emailEl = wrapper.find('input[type="email"]').element as HTMLInputElement
      await fireEvent.update(emailEl, 'test@example.com')

      const hcaptchaStub = wrapper.findComponent({ name: 'VueHcaptchaStub' })
      await hcaptchaStub.vm.$emit('verify', 'test-captcha-token')
      await flushPromises()

      // Submit the form
      const onSubmit = (wrapper.vm as unknown as { $: { setupState: { onSubmit: () => Promise<void> } } }).$.setupState
        .onSubmit
      await onSubmit()
      await flushPromises()

      // Submit should be emitted with captchaToken
      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')![0]).toEqual([
        {
          email: 'test@example.com',
          captchaToken: 'test-captcha-token',
        },
      ])
    })
  })
})
