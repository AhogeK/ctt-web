import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: RouteNames.SETTINGS,
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'Settings', requiresAuth: true, layout: 'app' },
    redirect: { name: RouteNames.SETTINGS_PROFILE },
    children: [
      {
        path: 'profile',
        name: RouteNames.SETTINGS_PROFILE,
        component: () => import('@/features/settings/views/ProfileView.vue'),
        meta: { title: 'Profile', requiresAuth: true },
      },
      {
        path: 'api-keys',
        name: RouteNames.SETTINGS_API_KEYS,
        component: () => import('@/features/settings/views/ApiKeysView.vue'),
        meta: { title: 'API Keys', requiresAuth: true },
      },
    ],
  },
]

export default settingsRoutes
