import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'

/**
 * Setup global router guards for authentication and progress bar.
 *
 * Uses Vue Router 4 return pattern instead of deprecated next() callback.
 * Return values:
 * - `true` or `undefined`: allow navigation
 * - `false`: cancel navigation
 * - Route object: redirect to specified route
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()

    const title = to.meta.title
    if (title) {
      document.title = `${title} - CTT`
    }

    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth !== false

    // Redirect unauthenticated users to login, preserving intended destination
    // for post-login navigation
    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'Login',
        query: { redirect: to.fullPath },
      }
    }

    // Prevent authenticated users from accessing auth pages (login/register)
    // to avoid unnecessary auth flow
    if (to.name === 'Login' || to.name === 'Register') {
      if (authStore.isAuthenticated) {
        return { path: '/' }
      }
    }

    return true
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
