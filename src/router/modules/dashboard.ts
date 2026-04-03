import type { RouteRecordRaw } from 'vue-router'

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { title: 'Dashboard', requiresAuth: true, layout: 'dashboard' },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/features/dashboard/views/DashboardHome.vue'),
        meta: { title: 'Overview', requiresAuth: true },
      },
    ],
  },
]

export default dashboardRoutes
