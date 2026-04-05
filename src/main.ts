import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { Toaster } from '@/components/ui/sonner'

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

const app = createApp(App)

app.config.errorHandler = handleVueError

app.use(createPinia())
app.use(router)
app.component('Toaster', Toaster)

window.addEventListener('unhandledrejection', handleUnhandledRejection)

app.mount('#app')
