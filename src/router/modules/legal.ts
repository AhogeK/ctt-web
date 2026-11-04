import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

/**
 * Public legal pages.
 *
 * The privacy notice must be reachable without an account and without JavaScript-gated dialogs:
 * it is the page a reader cites when they ask the operator what is stored about them.
 */
const legalRoutes: RouteRecordRaw[] = [
  {
    path: '/privacy',
    name: RouteNames.PRIVACY,
    component: () => import('@/features/legal/views/PrivacyView.vue'),
    meta: { title: 'Privacy and cookies', titleKey: 'pageTitles.privacy', requiresAuth: false, hideInMenu: true },
  },
]

export default legalRoutes
