import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from '../guard'

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
      name: 'Home',
      component: { template: '<div>Home</div>' },
      meta: { title: 'Home' },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: { template: '<div>Dashboard</div>' },
      meta: { title: 'Dashboard', requiresAuth: true },
    },
    {
      path: '/auth/login',
      name: 'Login',
      component: { template: '<div>Login</div>' },
      meta: { title: 'Login', requiresAuth: false },
    },
    {
      path: '/auth/register',
      name: 'Register',
      component: { template: '<div>Register</div>' },
      meta: { title: 'Register', requiresAuth: false },
    },
    {
      path: '/public',
      name: 'Public',
      component: { template: '<div>Public</div>' },
      meta: { requiresAuth: false },
    },
    {
      path: '/no-title',
      name: 'NoTitle',
      component: { template: '<div>No Title</div>' },
    },
  ]

  beforeEach(() => {
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
      localStorage.setItem('token', 'valid-token')

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
      localStorage.removeItem('token')

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Login')
    })

    it('preserves original path as redirect query param', async () => {
      localStorage.removeItem('token')

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
    })

    it('preserves full path including query params in redirect', async () => {
      localStorage.removeItem('token')

      await router.push('/dashboard?tab=settings&id=123')
      await router.isReady()

      expect(router.currentRoute.value.query.redirect).toBe('/dashboard?tab=settings&id=123')
    })

    it('allows authenticated user to access protected route', async () => {
      // Set token (authenticated)
      localStorage.setItem('token', 'valid-token')

      await router.push('/dashboard')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('Public route access', () => {
    it('allows unauthenticated user to access public route', async () => {
      localStorage.removeItem('token')

      await router.push('/public')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Public')
    })

    it('allows unauthenticated user to access Login page', async () => {
      localStorage.removeItem('token')

      await router.push('/auth/login')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Login')
    })

    it('allows unauthenticated user to access Register page', async () => {
      localStorage.removeItem('token')

      await router.push('/auth/register')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Register')
    })

    it('allows authenticated user to access public route', async () => {
      localStorage.setItem('token', 'valid-token')

      await router.push('/public')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Public')
    })
  })

  describe('Route without requiresAuth meta', () => {
    it('allows access when requiresAuth is not defined', async () => {
      localStorage.removeItem('token')

      await router.push('/no-title')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('NoTitle')
    })
  })
})
