import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

/**
 * Check if user is authenticated.
 * Currently uses localStorage as placeholder.
 * TODO: Replace with Pinia auth store check
 */
function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

/**
 * Setup global router guards for authentication and progress bar.
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach((to, _from, next) => {
    const title = to.meta.title
    if (title) {
      document.title = `${title} - CTT`
    }

    NProgress.start()

    if (to.meta.requiresAuth && !isAuthenticated()) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
