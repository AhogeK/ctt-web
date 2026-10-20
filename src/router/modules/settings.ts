import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: RouteNames.SETTINGS,
    component: () => import('@/layouts/AppLayout.vue'),
    // Parent records must redirect to their default child: navigating to this
    // record by NAME resolves the parent alone, so the layout's inner
    // <router-view> has no matched child and the content region renders blank —
    // with no error and a correct URL. See the same note in dashboard.ts.
    redirect: { name: RouteNames.SETTINGS_PROFILE },
    meta: { title: 'Settings', requiresAuth: true, layout: 'app' },
    children: [
      {
        // Section shell: owns the sub-navigation shared by every settings page
        // and renders the active section through its own <router-view>. The
        // pathless record keeps one URL per section (/settings/profile, …)
        // while the navigation is declared once instead of per view.
        path: '',
        component: () => import('@/features/settings/views/SettingsShell.vue'),
        redirect: { name: RouteNames.SETTINGS_PROFILE },
        children: [
          {
            path: 'profile',
            name: RouteNames.SETTINGS_PROFILE,
            component: () => import('@/features/settings/views/ProfileView.vue'),
            meta: { title: 'Profile', requiresAuth: true },
          },
          {
            // Devices (the tracker's sync subjects) live under settings: they
            // are an account-scoped resource, not a top-level destination.
            // The legacy /devices URL redirects here (modules/devices.ts).
            path: 'devices',
            name: RouteNames.SETTINGS_DEVICES,
            component: () => import('@/features/devices/views/DeviceListView.vue'),
            meta: { title: 'Devices', requiresAuth: true },
          },
          {
            path: 'preferences',
            name: RouteNames.SETTINGS_PREFERENCES,
            component: () => import('@/features/settings/views/PreferencesView.vue'),
            meta: { title: 'Preferences', requiresAuth: true },
          },
          {
            path: 'api-keys',
            name: RouteNames.SETTINGS_API_KEYS,
            component: () => import('@/features/settings/views/ApiKeysView.vue'),
            meta: { title: 'API Keys', requiresAuth: true },
          },
        ],
      },
    ],
  },
]

export default settingsRoutes
