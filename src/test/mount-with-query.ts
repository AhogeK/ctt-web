import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Component } from 'vue'

/**
 * Mounts a component with a query client of its own.
 *
 * A component that calls `useMutation`/`useQuery` itself throws "No queryClient found" when it
 * is mounted bare, so any test of such a component needs one in the Vue context. The client is
 * per-call and never shared: retries are off, because a test that asserts a rejected mutation
 * cannot wait for the library's default back-off, and because a shared cache would carry state
 * from one test into the next.
 *
 * @param component - the component under test
 * @param options - mount options; `global.plugins` are appended after the query plugin
 * @returns the mounted wrapper
 */
export function mountWithQuery<C extends Component>(component: C, options: ComponentMountingOptions<C> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  // Typed through the mount options themselves: a bare array literal widens the plugin tuple to
  // "plugin or its options", which the mount signature rejects.
  const plugins: NonNullable<ComponentMountingOptions<C>['global']>['plugins'] = [
    [VueQueryPlugin, { queryClient }],
    ...(options.global?.plugins ?? []),
  ]

  return mount(component, {
    ...options,
    global: { ...options.global, plugins },
  })
}
