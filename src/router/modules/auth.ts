import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: RouteNames.AUTH_LAYOUT,
    component: () => import('@/layouts/AuthLayout.vue'),
    // Parent records must redirect to their default child: reaching this record directly
    // (a typed URL, a stale bookmark) must not render the layout with an empty form panel.
    redirect: { name: RouteNames.LOGIN },
    meta: { title: 'Authentication', titleKey: 'pageTitles.authentication', hideInMenu: true },
    children: [
      {
        path: 'login',
        name: RouteNames.LOGIN,
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', titleKey: 'pageTitles.login', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'register',
        name: RouteNames.REGISTER,
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', titleKey: 'pageTitles.register', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'register-success',
        name: RouteNames.REGISTER_SUCCESS,
        component: () => import('@/features/auth/views/RegisterSuccessView.vue'),
        meta: { title: 'Check Your Email', titleKey: 'pageTitles.checkEmail', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'verify-email',
        name: RouteNames.VERIFY_EMAIL,
        component: () => import('@/features/auth/views/VerifyEmailView.vue'),
        meta: { title: 'Verify Email', titleKey: 'pageTitles.verifyEmail', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'change-email',
        name: RouteNames.CHANGE_EMAIL,
        component: () => import('@/features/auth/views/ChangeEmailView.vue'),
        meta: { title: 'Change Email', titleKey: 'pageTitles.changeEmail', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'forgot-password',
        name: RouteNames.FORGOT_PASSWORD,
        component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
        meta: { title: 'Forgot Password', titleKey: 'pageTitles.forgotPassword', requiresAuth: false, guestOnly: true },
      },
      {
        path: 'reset-password',
        name: RouteNames.RESET_PASSWORD,
        component: () => import('@/features/auth/views/ResetPasswordView.vue'),
        meta: { title: 'Reset Password', titleKey: 'pageTitles.resetPassword', requiresAuth: false, guestOnly: true },
      },
    ],
  },
]

export default authRoutes
