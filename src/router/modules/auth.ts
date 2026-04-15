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
        meta: { title: 'Login', requiresAuth: false },
      },
      {
        path: 'register',
        name: RouteNames.REGISTER,
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false },
      },
      {
        path: 'register-success',
        name: RouteNames.REGISTER_SUCCESS,
        component: () => import('@/features/auth/views/RegisterSuccessView.vue'),
        meta: { title: 'Check Your Email', requiresAuth: false },
      },
      {
        path: 'verify-email',
        name: RouteNames.VERIFY_EMAIL,
        component: () => import('@/features/auth/views/VerifyEmailView.vue'),
        meta: { title: 'Verify Email', requiresAuth: false },
      },
    ],
  },
]

export default authRoutes
