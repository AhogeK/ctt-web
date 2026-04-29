import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

export default [
  {
    path: '/leaderboard',
    name: RouteNames.LEADERBOARD,
    component: () => import('@/features/leaderboard/views/LeaderboardView.vue'),
    meta: { title: 'Leaderboard', requiresAuth: true },
  },
] as RouteRecordRaw[]
