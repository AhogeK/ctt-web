import type { RouteRecordRaw } from 'vue-router'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { title: 'Settings', requiresAuth: true, layout: 'default' },
    children: [
      {
        path: 'profile',
        name: 'SettingsProfile',
        component: () => import('@/features/settings/views/ProfileView.vue'),
        meta: { title: 'Profile', requiresAuth: true },
      },
      {
        path: 'api-keys',
        name: 'SettingsApiKeys',
        component: () => import('@/features/settings/views/ApiKeysView.vue'),
        meta: { title: 'API Keys', requiresAuth: true },
      },
    ],
  },
]

export default settingsRoutes
