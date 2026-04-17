import './assets/main.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { Toaster } from '@/components/ui/sonner'
import { UNAUTHORIZED_EVENT } from '@/lib/api/instance'
import { vueQueryOptions } from '@/lib/query'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'

/**
 * Global error handler for Vue component errors.
 * Catches errors from component lifecycle hooks, event handlers, and watchers
 * that are not caught by ErrorBoundary components.
 *
 * @param err - The error object
 * @param instance - The Vue component instance where the error occurred
 * @param info - Vue-specific error info (e.g., which lifecycle hook)
 */
function handleVueError(err: unknown, instance: unknown, info: string): void {
  // TODO: Integrate with Sentry/Datadog for production error tracking
  console.error('[Vue Global Error]', {
    error: err,
    component: instance,
    info,
  })
}

/**
 * Global handler for unhandled Promise rejections.
 * Catches async errors that escape try-catch blocks and Promise chains.
 *
 * @param event - The unhandledrejection event containing the rejection reason
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // TODO: Integrate with Sentry/Datadog for production error tracking
  console.error('[Unhandled Promise Rejection]', event.reason)
  event.preventDefault()
}

/**
 * Global handler for API 401 unauthorized events.
 * Catches custom events dispatched by API instance when it receives 401 responses.
 * Clears authentication state and redirects to login page with current path as redirect target.
 *
 * @param _event - The CustomEvent dispatched by API instance (no detail payload)
 */
function handleUnauthorized(_event: Event): void {
  const authStore = useAuthStore()
  authStore.clearAuth()

  // Redirect to login with current path for post-login redirect
  const currentPath = router.currentRoute.value.fullPath
  void router.push({
    name: RouteNames.LOGIN,
    query: { redirect: currentPath },
  })
}

const app = createApp(App)

app.config.errorHandler = handleVueError

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, vueQueryOptions)
app.component('Toaster', Toaster)

globalThis.addEventListener('unhandledrejection', handleUnhandledRejection)
globalThis.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

app.mount('#app')
