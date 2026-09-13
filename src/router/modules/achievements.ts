import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const achievementsRoutes: RouteRecordRaw[] = [
  {
    path: '/achievements',
    name: RouteNames.ACHIEVEMENTS,
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'Achievements', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.ACHIEVEMENTS_CABINET,
        component: () => import('@/features/achievements/views/AchievementsView.vue'),
        meta: { title: 'Achievements', requiresAuth: true },
      },
    ],
  },
]

export default achievementsRoutes
