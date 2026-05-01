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
        meta: { title: 'Login', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'register',
        name: RouteNames.REGISTER,
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'register-success',
        name: RouteNames.REGISTER_SUCCESS,
        component: () => import('@/features/auth/views/RegisterSuccessView.vue'),
        meta: { title: 'Check Your Email', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'verify-email',
        name: RouteNames.VERIFY_EMAIL,
        component: () => import('@/features/auth/views/VerifyEmailView.vue'),
        meta: { title: 'Verify Email', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'forgot-password',
        name: RouteNames.FORGOT_PASSWORD,
        component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
        meta: { title: 'Forgot Password', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'reset-password',
        name: RouteNames.RESET_PASSWORD,
        component: () => import('@/features/auth/views/ResetPasswordView.vue'),
        meta: { title: 'Reset Password', requiresAuth: false, guestOnly: true },
      },
    ],
  },
]

export default authRoutes
