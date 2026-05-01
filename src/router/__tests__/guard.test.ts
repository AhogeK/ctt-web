import { describe, it, expect, beforeEach, afterEach, vi } from 'vite-plus/test'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { setupRouterGuards } from '../guard'
import { RouteNames } from '../route-names'
import { STORAGE_KEYS } from '@/stores/auth'

const { mockNProgressStart, mockNProgressDone } = vi.hoisted(() => {
  return {
    mockNProgressStart: vi.fn<() => void>(),
    mockNProgressDone: vi.fn<() => void>(),
  }
})

vi.mock('nprogress', () => ({
  default: {
    start: mockNProgressStart,
    done: mockNProgressDone,
    configure: vi.fn<() => void>(),
  },
}))

describe('Router Guards', () => {
  let router: ReturnType<typeof createRouter>

  const testRoutes: RouteRecordRaw[] = [
    {
      path: '/',
      name: RouteNames.HOME,
      component: { template: '<div>Home</div>' },
      meta: { title: 'Home' },
    },
    {
      path: '/dashboard',
      name: RouteNames.DASHBOARD,
      component: { template: '<div>Dashboard</div>' },
      meta: { title: 'Dashboard', requiresAuth: true },
    },
    {
      path: '/login',
      name: RouteNames.LOGIN,
      component: { template: '<div>Login</div>' },
      meta: { title: 'Login', requiresAuth: false, guestOnly: true },
    },
    {
      path: '/register',
      name: RouteNames.REGISTER,
      component: { template: '<div>Register</div>' },
      meta: { title: 'Register', requiresAuth: false, guestOnly: true },
    },
    {
      path: '/public',
      name: 'Public',
      component: { template: '<div>Public</div>' },
      meta: { title: 'Public', requiresAuth: false },
    },
    {
      path: '/no-title',
      name: 'NoTitle',
      component: { template: '<div>No Title</div>' },
    },
  ]

  beforeEach(() => {
    // Initialize Pinia for store access
    setActivePinia(createPinia())

    // Reset localStorage mock
    localStorage.clear()

    // Reset document.title
    document.title = 'CTT'

    // Create fresh router instance
    router = createRouter({
      history: createWebHistory(),
      routes: testRoutes,
    })

    // Setup guards
    setupRouterGuards(router)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Document title setting', () => {
    it('sets document title from route meta title', async () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token')

      await router.push('/dashboard')
      await router.isReady()

      expect(document.title).toBe('Dashboard - CTT')
    })

    it('appends "- CTT" suffix to title', async () => {
      await router.push('/')
      await router.isReady()

      expect(document.title).toBe('Home - CTT')
    })

    it('does not modify title when route has no meta title', async () => {
      const initialTitle = document.title
      await router.push('/no-title')
      await router.isReady()

      expect(document.title).toBe(initialTitle)
    })
  })

  describe('NProgress lifecycle', () => {
    it('calls NProgress.start on beforeEach', async () => {
      mockNProgressStart.mockClear()

      await router.push('/dashboard')
      await router.isReady()

      expect(mockNProgressStart).toHaveBeenCalled()
    })

    it('calls NProgress.done on afterEach', async () => {
      mockNProgressDone.mockClear()

      await router.push('/dashboard')
      await router.isReady()

      expect(mockNProgressDone).toHaveBeenCalled()
    })

    it('calls NProgress lifecycle methods in correct order', async () => {
      mockNProgressStart.mockClear()
      mockNProgressDone.mockClear()

      await router.push('/')
      await router.isReady()

      expect(mockNProgressStart).toHaveBeenCalledBefore(mockNProgressDone)
    })
  })

  describe('Protected route redirect', () => {
    it('redirects unauthenticated user to Login page', async () => {
      // No token in localStorage (unauthenticated)
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.LOGIN)
    })

    it('preserves original path as redirect query param', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
    })

    it('preserves full path including query params in redirect', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/dashboard?tab=settings&id=123')
      await router.isReady()

      expect(router.currentRoute.value.query.redirect).toBe('/dashboard?tab=settings&id=123')
    })

    it('allows authenticated user to access protected route', async () => {
      // Set token (authenticated)
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token')

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.DASHBOARD)
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('Public route access', () => {
    it('allows unauthenticated user to access public route', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/public')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Public')
    })

    it('allows unauthenticated user to access Login page', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.LOGIN)
    })

    it('allows unauthenticated user to access Register page', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/register')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.REGISTER)
    })

    it('allows authenticated user to access public route', async () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token')

      await router.push('/public')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Public')
    })
  })

  describe('Guest-only route redirect', () => {
    it('redirects authenticated user to dashboard when accessing login', async () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token')

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.DASHBOARD)
    })

    it('redirects authenticated user to dashboard when accessing register', async () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token')

      await router.push('/register')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.DASHBOARD)
    })

    it('allows unauthenticated user to access guest-only route', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe(RouteNames.LOGIN)
    })
  })

  describe('Route without requiresAuth meta', () => {
    it('allows access when requiresAuth is not defined', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

      await router.push('/no-title')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('NoTitle')
    })
  })
})
