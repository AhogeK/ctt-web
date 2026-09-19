import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const achievementsRoutes: RouteRecordRaw[] = [
  {
    path: '/achievements',
    name: RouteNames.ACHIEVEMENTS,
    component: () => import('@/layouts/AppLayout.vue'),
    // Parent records must redirect to their default child: navigating to this
    // record by NAME resolves the parent alone, so the layout's inner
    // <router-view> has no matched child and the content region renders blank —
    // with no error and a correct URL. See the same note in dashboard.ts.
    redirect: { name: RouteNames.ACHIEVEMENTS_CABINET },
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
