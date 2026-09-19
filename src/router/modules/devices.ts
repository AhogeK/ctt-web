import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const devicesRoutes: RouteRecordRaw[] = [
  {
    path: '/devices',
    name: RouteNames.DEVICES,
    component: () => import('@/layouts/AppLayout.vue'),
    // Parent records must redirect to their default child: navigating to this
    // record by NAME resolves the parent alone, so the layout's inner
    // <router-view> has no matched child and the content region renders blank —
    // with no error and a correct URL. See the same note in dashboard.ts.
    redirect: { name: RouteNames.DEVICES_LIST },
    meta: { title: 'Devices', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.DEVICES_LIST,
        component: () => import('@/features/devices/views/DeviceListView.vue'),
        meta: { title: 'Device Management', requiresAuth: true },
      },
    ],
  },
]

export default devicesRoutes
