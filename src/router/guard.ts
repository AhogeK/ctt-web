import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { RouteNames } from './route-names'
import { useAuthStore } from '@/stores/auth'

NProgress.configure({ showSpinner: false })

/**
 * Setup global router guards for authentication and progress bar.
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach((to, _from) => {
    const title = to.meta.title
    if (title) {
      document.title = `${title} - Code Time Tracker`
    }

    NProgress.start()

    const authStore = useAuthStore()

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: RouteNames.DASHBOARD }
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: RouteNames.LOGIN, query: { redirect: to.fullPath } }
    }
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
