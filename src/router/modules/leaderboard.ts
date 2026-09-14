import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

/*
 * Nested under `AppLayout` like every other app page. Registered flat, the view
 * rendered correctly but with **no sidebar and no navigation** — a defect that is
 * invisible in a screenshot because the page and its data look fine (the same bug
 * shipped once for `/achievements`; see the achievements domain memory).
 */
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
