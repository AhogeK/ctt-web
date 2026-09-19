import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: RouteNames.DASHBOARD,
    component: () => import('@/layouts/AppLayout.vue'),
    // Navigating to this record by NAME resolves the parent alone, leaving
    // AppLayout's <router-view> with no matched child — a blank content region
    // with no error anywhere. Redirecting to the default child makes the parent
    // name safe to use from the guard, the login redirect and the app shell.
    redirect: { name: RouteNames.DASHBOARD_HOME },
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
