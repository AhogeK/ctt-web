import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

const oauthRoutes: RouteRecordRaw[] = [
  {
    // The provider sends the reader back to `/oauth/callback`, so that URL is fixed. What this
    // record decides is the shell around it: these two pages are steps of the sign-in card, so a
    // screen-sized view rendered here replaces the whole card. Under the layout only the panel
    // changes, which is what keeps a step change from reading as a page reload.
    path: '/oauth',
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: { name: RouteNames.LOGIN },
    children: [
      {
        path: 'callback',
        name: RouteNames.OAUTH_CALLBACK,
        component: () => import('@/features/auth/views/OAuthCallbackView.vue'),
        meta: {
          title: 'OAuth Callback',
          titleKey: 'pageTitles.oauthCallback',
          requiresAuth: false,
          guestOnly: true,
          hideInMenu: true,
        },
      },
      {
        path: 'error',
        name: RouteNames.OAUTH_ERROR,
        component: () => import('@/features/auth/views/OAuthErrorView.vue'),
        meta: {
          title: 'OAuth Error',
          titleKey: 'pageTitles.oauthError',
          requiresAuth: false,
          guestOnly: true,
          hideInMenu: true,
        },
      },
    ],
  },
]

export default oauthRoutes
