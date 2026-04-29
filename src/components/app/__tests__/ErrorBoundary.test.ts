import { describe, expect, it, vi, beforeEach, afterEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'

const ThrowError = defineComponent({
  name: 'ThrowError',
  setup() {
    throw new Error('Test error from ThrowError component')
  },
  template: '<div>This should not render</div>',
})

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  describe('rendering', () => {
    it('renders slot content when no error', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h('div', { class: 'child-content' }, 'Normal content'),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: false,
          },
        },
      })

      expect(wrapper.find('.child-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Normal content')
      expect(wrapper.find('[data-slot="error-boundary"]').exists()).toBe(false)
    })

    it('has correct data attributes in error state', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: false,
          },
        },
      })

      await nextTick()

      const errorDiv = wrapper.find('[data-slot="error-boundary"]')
      expect(errorDiv.exists()).toBe(true)
      expect(errorDiv.attributes('data-state')).toBe('error')
    })
  })

  describe('error capture', () => {
    it('displays fallback UI when child throws error', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.text()).toContain('Component Render Error')
      expect(wrapper.text()).toContain('Please refresh the page or contact administrator')
    })

    it('logs error to console with prefix', async () => {
      mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logCall = consoleErrorSpy.mock.calls[0]
      expect(logCall[0]).toBe('[ErrorBoundary Captured]')
      expect(logCall[1]).toBeInstanceOf(Error)
      expect(logCall[1].message).toBe('Test error from ThrowError component')
    })

    it('stores error info in component state', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.text()).toContain('Component Render Error')
    })
  })

  describe('retry', () => {
    it('shows retry button when error occurs', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      const retryButton = wrapper.find('button')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toBe('Try Again')
    })

    it('retry button can be clicked', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')

      // Verify button click does not throw error
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('stopPropagation', () => {
    it('stops error propagation by default', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('accepts stopPropagation prop', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          stopPropagation: false,
        },
        slots: {
          default: () => h('div', 'Normal content'),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(false)
      expect(wrapper.text()).toContain('Normal content')
    })
  })

  describe('development mode', () => {
    it('shows error details in DEV mode', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      const details = wrapper.find('details')
      expect(details.exists()).toBe(true)
      expect(details.text()).toContain('Error Details (Development Mode Only)')
    })

    it('displays error message and stack in DEV mode', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowError),
        },
        global: {
          stubs: {
            Button: false,
            TriangleAlert: true,
          },
        },
      })

      await nextTick()

      const details = wrapper.find('details')
      expect(details.text()).toContain('Message:')
      expect(details.text()).toContain('Test error from ThrowError component')
      expect(details.text()).toContain('Stack:')
      expect(details.text()).toContain('Component:')
      expect(details.text()).toContain('ThrowError')
    })
  })
})
