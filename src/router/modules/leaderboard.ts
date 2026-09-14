import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

// Nested under `AppLayout` like every other app page. Registered flat, the view
// rendered correctly but inside no shell at all — no sidebar, so no way to navigate
// away except the browser's back button. It is invisible in a screenshot because the
// page and its data look fine (the same bug shipped once for `/achievements`; see the
// achievements domain memory).

// Note this restores the *shell*, not a nav entry: `AppSidebar` still has no
// `/leaderboard` item, so the page is reachable by URL or in-app link only. Adding one
// is a product decision, not part of this fix.

const leaderboardRoutes: RouteRecordRaw[] = [
  {
    path: '/leaderboard',
    name: RouteNames.LEADERBOARD,
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'Leaderboard', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.LEADERBOARD_GLOBAL,
        component: () => import('@/features/leaderboard/views/LeaderboardView.vue'),
        meta: { title: 'Leaderboard', requiresAuth: true },
      },
    ],
  },
]

export default leaderboardRoutes
