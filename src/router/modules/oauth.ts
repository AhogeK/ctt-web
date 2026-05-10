import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

const oauthRoutes: RouteRecordRaw[] = [
  {
    path: '/oauth/callback',
    name: RouteNames.OAUTH_CALLBACK,
    component: () => import('@/features/auth/views/OAuthCallbackView.vue'),
    meta: { title: 'OAuth Callback', requiresAuth: false, guestOnly: true, hideInMenu: true },
  },
]

export default oauthRoutes
