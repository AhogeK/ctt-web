import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createTestingPinia } from '@pinia/testing'
import App from '../App.vue'
import ErrorBoundary from '../components/app/ErrorBoundary.vue'
import { Toaster } from '../components/ui/sonner'

/**
 * Integration tests for App.vue
 * Verifies component hierarchy, ErrorBoundary wrapper, and Toaster integration
 */
describe('App.vue', () => {
  /**
   * Creates a minimal router for testing RouterView rendering
   */
  const createTestRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' },
        },
      ],
    })
  }

  it('should wrap RouterView with ErrorBoundary', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          ErrorBoundary: false,
        },
      },
    })

    const errorBoundary = wrapper.findComponent(ErrorBoundary)
    expect(errorBoundary.exists()).toBe(true)

    const routerView = wrapper.findComponent({ name: 'RouterView' })
    expect(routerView.exists()).toBe(true)

    expect(errorBoundary.findComponent({ name: 'RouterView' }).exists()).toBe(true)

    wrapper.unmount()
  })

  it('should integrate Toaster with correct props', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          ErrorBoundary: false,
          Toaster: false,
        },
      },
    })

    const toaster = wrapper.findComponent(Toaster)
    expect(toaster.exists()).toBe(true)

    expect(toaster.props('position')).toBe('top-right')
    expect(toaster.props('expand')).toBe(true)
    expect(toaster.props('richColors')).toBe(true)

    wrapper.unmount()
  })

  it('should have correct component hierarchy', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          ErrorBoundary: false,
          Toaster: false,
        },
      },
    })

    const errorBoundary = wrapper.findComponent(ErrorBoundary)
    expect(errorBoundary.exists()).toBe(true)
    expect(errorBoundary.findComponent({ name: 'RouterView' }).exists()).toBe(true)

    const toaster = wrapper.findComponent(Toaster)
    expect(toaster.exists()).toBe(true)

    wrapper.unmount()
  })
})
