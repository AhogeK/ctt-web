import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

const devicesRoutes: RouteRecordRaw[] = [
  {
    path: '/devices',
    name: RouteNames.DEVICES,
    component: () => import('@/layouts/AppLayout.vue'),
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
