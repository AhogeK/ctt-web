import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

/**
 * Public marketing routes.
 *
 * `/` is the product's front door and must stay reachable without a session.
 * It is deliberately **not** marked `guestOnly`: the guest guard redirects
 * authenticated visitors to the dashboard, which would bounce them off the
 * root entirely. Here the same page renders for both states and only the
 * top-bar CTA changes.
 */
const landingRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: RouteNames.MARKETING_LAYOUT,
    component: () => import('@/layouts/MarketingLayout.vue'),
    meta: { title: 'Open-source coding analytics', requiresAuth: false },
    children: [
      {
        path: '',
        name: RouteNames.LANDING,
        component: () => import('@/features/landing/views/LandingView.vue'),
        meta: { title: 'Open-source coding analytics', requiresAuth: false },
      },
    ],
  },
]

export default landingRoutes
