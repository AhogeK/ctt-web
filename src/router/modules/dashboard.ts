import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: RouteNames.DASHBOARD,
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'Dashboard', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.DASHBOARD_HOME,
        component: () => import('@/features/dashboard/views/DashboardHome.vue'),
        meta: { title: 'Overview', requiresAuth: true },
      },
    ],
  },
]

export default dashboardRoutes
