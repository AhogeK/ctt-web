import type { RouteRecordRaw } from 'vue-router'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'AuthLayout',
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: '/auth/login',
    meta: { title: 'Authentication', hideInMenu: true },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', requiresAuth: false, layout: 'auth' },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false, layout: 'auth' },
      },
    ],
  },
]

export default authRoutes
