import type { RouteLocationNormalized, Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { i18n, onLocaleChange } from '@/i18n'
import { RouteNames } from './route-names'
import { useAuthStore } from '@/stores/auth'

NProgress.configure({ showSpinner: false })

/**
 * Write the tab title for a route.
 *
 * Resolved at call time rather than at module load so the catalogue follows the
 * active locale. The brand suffix is not translated; it is the product name.
 */
function applyDocumentTitle(to: RouteLocationNormalized) {
  const title = to.meta.titleKey ? i18n.global.t(to.meta.titleKey) : to.meta.title
  if (title) {
    document.title = `${title} - Code Time Tracker`
  }
}

/**
 * Setup global router guards for authentication and progress bar.
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach((to, _from) => {
    applyDocumentTitle(to)

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

  // A language switch does not navigate, so the tab would keep the previous
  // language's title. Re-apply it for the route already on screen.
  onLocaleChange(() => applyDocumentTitle(router.currentRoute.value))
}
