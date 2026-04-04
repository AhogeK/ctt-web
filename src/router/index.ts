import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guard'

const routeModules = import.meta.glob('./modules/*.ts', { eager: true })

const featureRoutes: RouteRecordRaw[] = []

Object.keys(routeModules).forEach((key) => {
  const mod = (routeModules[key] as { default: RouteRecordRaw[] }).default || []
  featureRoutes.push(...mod)
})

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'Home' },
    children: [
      {
        path: '',
        component: () => import('@/views/HomeView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Exception/404View.vue'),
    meta: { title: 'Not Found', hideInMenu: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, ...featureRoutes],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// Handle chunk load errors (e.g., new deployment deleted old files)
router.onError((error, to) => {
  const isChunkLoadFailed =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')

  if (isChunkLoadFailed && !to.query.retried) {
    console.warn('[Router] New version detected, reloading page...', error)
    const targetPath = to.fullPath
    const separator = targetPath.includes('?') ? '&' : '?'
    globalThis.location.href = `${targetPath}${separator}retried=1`
  } else if (isChunkLoadFailed) {
    console.error('[Router] Chunk load failed after retry, manual refresh required:', error)
  }
})

setupRouterGuards(router)

export default router
