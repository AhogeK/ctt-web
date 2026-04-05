import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: RouteNames.AUTH_LAYOUT,
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: { name: RouteNames.LOGIN },
    meta: { title: 'Authentication', hideInMenu: true },
    children: [
      {
        path: 'login',
        name: RouteNames.LOGIN,
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', requiresAuth: false, layout: 'auth' },
      },
      {
        path: 'register',
        name: RouteNames.REGISTER,
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false, layout: 'auth' },
      },
    ],
  },
]

export default authRoutes
