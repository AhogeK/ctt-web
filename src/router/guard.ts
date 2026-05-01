import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { RouteNames } from './route-names'
import { useAuthStore } from '@/stores/auth'

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

    const authStore = useAuthStore()

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      next({ name: RouteNames.DASHBOARD })
      return
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ name: RouteNames.LOGIN, query: { redirect: to.fullPath } })
      return
    }

    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
