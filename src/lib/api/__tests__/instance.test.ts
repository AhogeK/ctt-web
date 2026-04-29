import { describe, it, expect, beforeEach, vi, afterEach } from 'vite-plus/test'
import { toast } from 'vue-sonner'
import { UNAUTHORIZED_EVENT } from '../instance'

/* oxlint-disable no-explicit-any */

const capturedConfig = vi.hoisted(() => ({
  baseURL: '',
  timeout: 0,
  credentials: '',
  onRequest: null as ((context: any) => Promise<void>) | null,
  onResponseError: null as ((context: any) => Promise<void>) | null,
}))

const mockFetchInstance = vi.hoisted(() => {
  const fn = vi.fn<any>().mockResolvedValue({ success: true })
  fn.raw = vi.fn<any>()
  fn.create = vi.fn<any>().mockReturnThis()
  return fn
})

vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn<(config: any) => any>((config: any) => {
      capturedConfig.baseURL = config.baseURL
      capturedConfig.timeout = config.timeout
      capturedConfig.credentials = config.credentials
      capturedConfig.onRequest = config.onRequest
      capturedConfig.onResponseError = config.onResponseError
      return mockFetchInstance
    }),
  },
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn<() => void>(),
    success: vi.fn<() => void>(),
    info: vi.fn<() => void>(),
  },
}))

const mockAuthStore = vi.hoisted(() => ({
  refreshAccessToken: vi.fn<() => Promise<string>>().mockResolvedValue('new-access-token'),
  clearAuth: vi.fn<() => void>(),
  STORAGE_KEYS: { ACCESS_TOKEN: 'ctt_access_token' },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => typeof mockAuthStore>(() => mockAuthStore),
  STORAGE_KEYS: mockAuthStore.STORAGE_KEYS,
}))

const mockRouter = vi.hoisted(() => ({
  push: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  currentRoute: { value: { fullPath: '/dashboard' } },
}))

vi.mock('@/router', () => ({
  default: mockRouter,
}))

vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')

describe('API Instance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Instance Configuration', () => {
    it('creates apiFetch with correct base URL from environment', async () => {
      vi.resetModules()
      await import('../instance')

      expect(capturedConfig.baseURL).toBe('https://api.example.com')
    })

    it('uses fallback /api when VITE_API_BASE_URL is not set', async () => {
      vi.stubEnv('VITE_API_BASE_URL', undefined)
      vi.resetModules()

      await import('../instance')

      expect(capturedConfig.baseURL).toBe('/api')
    })

    it('sets timeout to 30 seconds (30000ms)', async () => {
      vi.resetModules()
      await import('../instance')

      expect(capturedConfig.timeout).toBe(30000)
    })

    it('sets credentials to include for CORS cookie handling', async () => {
      vi.resetModules()
      await import('../instance')

      expect(capturedConfig.credentials).toBe('include')
    })
  })

  describe('Request Interceptor (onRequest)', () => {
    it('adds Bearer Authorization header when access token exists', async () => {
      vi.resetModules()
      localStorage.setItem('ctt_access_token', 'test-access-token')
      await import('../instance')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: new Headers(),
        },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext)
      }

      const headers = mockContext.options.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer test-access-token')
    })

    it('preserves existing headers when adding Authorization', async () => {
      vi.resetModules()
      localStorage.setItem('ctt_access_token', 'token-123')
      await import('../instance')

      const existingHeaders = new Headers()
      existingHeaders.set('Content-Type', 'application/json')
      existingHeaders.set('X-Custom-Header', 'custom-value')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: existingHeaders,
        },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext)
      }

      const headers = mockContext.options.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer token-123')
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('X-Custom-Header')).toBe('custom-value')
    })

    it('skips Authorization header when no access token', async () => {
      vi.resetModules()
      localStorage.removeItem('ctt_access_token')
      await import('../instance')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: new Headers(),
        },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext)
      }

      const headers = mockContext.options.headers as Headers
      expect(headers.has('Authorization')).toBe(false)
    })

    it('does not modify headers when accessToken is empty string', async () => {
      vi.resetModules()
      localStorage.setItem('ctt_access_token', '')
      await import('../instance')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: new Headers(),
        },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext)
      }

      const headers = mockContext.options.headers as Headers
      expect(headers.has('Authorization')).toBe(false)
    })

    it('reads token lazily from localStorage inside interceptor', async () => {
      vi.resetModules()
      localStorage.removeItem('ctt_access_token')
      await import('../instance')

      const mockContext1 = {
        request: new Request('https://api.example.com/test1'),
        options: { headers: new Headers() },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext1)
      }
      expect((mockContext1.options.headers as Headers).has('Authorization')).toBe(false)

      localStorage.setItem('ctt_access_token', 'new-token')

      const mockContext2 = {
        request: new Request('https://api.example.com/test2'),
        options: { headers: new Headers() },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext2)
      }
      expect((mockContext2.options.headers as Headers).get('Authorization')).toBe('Bearer new-token')
    })
  })

  describe('Error Handling', () => {
    it('interceptor does not throw on successful header modification', async () => {
      vi.resetModules()
      localStorage.setItem('ctt_access_token', 'valid-token')
      await import('../instance')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: new Headers(),
        },
      }

      const interceptor = capturedConfig.onRequest
      expect(interceptor).toBeDefined()
      await interceptor!(mockContext)
    })

    it('interceptor handles Headers constructor with various input types', async () => {
      vi.resetModules()
      localStorage.setItem('ctt_access_token', 'token')
      await import('../instance')

      const mockContext = {
        request: new Request('https://api.example.com/test'),
        options: {
          headers: { 'X-Test': 'value' } as any,
        },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext)
      }

      const headers = mockContext.options.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer token')
    })
  })

  describe('Response Error Interceptor (onResponseError)', () => {
    let removeItemSpy: ReturnType<typeof vi.spyOn>
    let dispatchEventSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
      vi.resetModules()
      vi.spyOn(console, 'warn').mockImplementation(vi.fn())
      vi.spyOn(console, 'error').mockImplementation(vi.fn())
      dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(vi.fn())
      removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(vi.fn())
      await import('../instance')
      // Clear warnings emitted during module import (e.g., Vue Router route config warnings)
      ;(console.warn as ReturnType<typeof vi.fn>).mockClear()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should handle 401 by clearing token and dispatching event', async () => {
      const mockResponse = {
        status: 401,
        _data: { message: 'Unauthorized' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(removeItemSpy).toHaveBeenCalledWith('ctt_access_token')
      expect(dispatchEventSpy).toHaveBeenCalled()
      const dispatchedEvent = dispatchEventSpy.mock.calls[0]![0] as CustomEvent
      expect(dispatchedEvent.type).toBe(UNAUTHORIZED_EVENT)
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('should handle 403 by logging console warning', async () => {
      const mockResponse = {
        status: 403,
        _data: { message: 'Forbidden' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(console.warn).toHaveBeenCalledWith('Permission denied:', mockResponse._data)
      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })

    it('should handle 404 by logging console warning', async () => {
      const mockResponse = {
        status: 404,
        _data: { message: 'Not Found', path: '/api/users/999' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(console.warn).toHaveBeenCalledWith('Resource not found:', mockResponse._data)
      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })

    it('should skip handling for 422 Unprocessable Entity', async () => {
      const mockResponse = {
        status: 422,
        _data: { errors: { email: 'Invalid email format' } },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
      expect(dispatchEventSpy).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
    })

    it('should handle 500+ server errors by logging console error', async () => {
      const mockResponse = {
        status: 500,
        _data: { message: 'Internal Server Error' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(console.error).toHaveBeenCalledWith('Server error:', mockResponse._data)
      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })

    it('should handle 503 Service Unavailable', async () => {
      const mockResponse = {
        status: 503,
        _data: { message: 'Service Unavailable' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(console.error).toHaveBeenCalledWith('Server error:', mockResponse._data)
      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
    })

    it('should not show toast for other 4xx errors (handled by default case)', async () => {
      const mockResponse = {
        status: 400,
        _data: { message: 'Bad Request' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(toast.error).not.toHaveBeenCalled()
      expect(removeItemSpy).not.toHaveBeenCalled()
      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })

    it('should handle 401 with custom event details', async () => {
      const mockResponse = {
        status: 401,
        _data: { message: 'Token expired', expiredAt: '2024-01-01' },
        url: 'https://api.example.com/test',
      }
      const mockContext = { response: mockResponse }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(window.dispatchEvent).toHaveBeenCalledTimes(1)
      const event = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls[0]![0]
      expect(event instanceof CustomEvent).toBe(true)
    })
  })

  describe('Token Refresh & Terminal Auth Errors', () => {
    let removeItemSpy: ReturnType<typeof vi.spyOn>
    let dispatchEventSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
      vi.resetModules()

      const mockFn = mockFetchInstance as any
      mockFn.mockImplementation(async (_request: any, options: any) => {
        mockFn.lastOptions = options
        return { success: true }
      })
      mockFn.raw = vi.fn<() => void>()
      mockFn.create = vi.fn<() => any>().mockReturnThis()

      mockAuthStore.refreshAccessToken.mockClear().mockResolvedValue('new-access-token')
      mockAuthStore.clearAuth.mockClear()
      mockRouter.push.mockClear().mockResolvedValue(undefined)

      vi.spyOn(console, 'warn').mockImplementation(vi.fn())
      vi.spyOn(console, 'error').mockImplementation(vi.fn())
      dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(vi.fn())
      removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(vi.fn())

      await import('../instance')
      ;(console.warn as ReturnType<typeof vi.fn>).mockClear()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('triggers refresh on 401 with AUTH_003', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('triggers refresh on 401 with AUTH_002', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_002', message: 'Token invalid' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('retries request with __authRetry flag after successful refresh', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.refreshAccessToken).toHaveBeenCalledTimes(1)
      expect((mockFetchInstance as any).lastOptions).toBeDefined()
      expect((mockFetchInstance as any).lastOptions.__authRetry).toBe(true)
    })

    it('skips refresh when __authRetry flag is already set', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET', __authRetry: true },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.refreshAccessToken).not.toHaveBeenCalled()
      expect(removeItemSpy).toHaveBeenCalledWith('ctt_access_token')
      expect(dispatchEventSpy).toHaveBeenCalled()
    })

    it('handles refresh failure with AUTH_003 by clearing auth and redirecting to login', async () => {
      mockAuthStore.refreshAccessToken.mockRejectedValue({
        data: { code: 'AUTH_003', message: 'Refresh token expired' },
      })

      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Session expired. Please log in again.')
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'login' })
    })

    it('handles refresh failure with AUTH_007 as terminal auth error', async () => {
      mockAuthStore.refreshAccessToken.mockRejectedValue({
        data: { code: 'AUTH_007', message: 'Refresh token revoked' },
      })

      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Session expired. Please log in again.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('handles refresh failure with AUTH_009 as terminal auth error with security alert', async () => {
      mockAuthStore.refreshAccessToken.mockRejectedValue({
        data: { code: 'AUTH_009', message: 'Suspicious activity' },
      })

      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Security alert: Suspicious activity detected. Please log in again.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('handles refresh failure with network error (no data)', async () => {
      mockAuthStore.refreshAccessToken.mockRejectedValue(new Error('Network error'))

      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_003', message: 'Access token expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Connection failed. Please check your network and try again.')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('handles terminal auth AUTH_004 on 401 with account locked message', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_004', message: 'Account locked' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Account is locked. Please contact support.')
      expect(mockRouter.push).toHaveBeenCalledWith(`/auth/login?redirect=${encodeURIComponent('/dashboard')}`)
    })

    it('handles terminal auth AUTH_005 on 401 with account disabled message', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_005', message: 'Account disabled' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Account is disabled. Please contact support.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('handles terminal auth AUTH_006 on 401 with verify email redirect', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_006', message: 'Email not verified' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Please verify your email address to continue.')
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'verify-email' })
    })

    it('handles terminal auth AUTH_007 on 401 with session expired message', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_007', message: 'Session expired' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Session expired. Please log in again.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('handles terminal auth AUTH_008 on 401 with session revoked message', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_008', message: 'Session revoked' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Session revoked. Please log in again.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('handles terminal auth AUTH_004 on 403 with account locked message', async () => {
      const mockContext = {
        response: {
          status: 403,
          _data: { code: 'AUTH_004', message: 'Account locked' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Account is locked. Please contact support.')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('mutex prevents duplicate terminal auth handling', async () => {
      let pushResolve: (() => void) | undefined
      mockRouter.push.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            pushResolve = resolve
          }),
      )

      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_004', message: 'Account locked' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
        await capturedConfig.onResponseError(mockContext)
        pushResolve!()
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
    })

    it('getErrorCode returns code from flat format', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { code: 'AUTH_004', message: 'Account locked' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
    })

    it('getErrorCode returns code from wrapped format', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { data: { code: 'AUTH_004', message: 'Account locked' } },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).toHaveBeenCalledTimes(1)
    })

    it('getErrorCode returns null for missing code', async () => {
      const mockContext = {
        response: {
          status: 401,
          _data: { message: 'Unauthorized' },
          url: 'https://api.example.com/test',
        },
        request: 'https://api.example.com/test',
        options: { method: 'GET' },
      }

      if (capturedConfig.onResponseError) {
        await capturedConfig.onResponseError(mockContext)
      }

      expect(mockAuthStore.clearAuth).not.toHaveBeenCalled()
      expect(removeItemSpy).toHaveBeenCalledWith('ctt_access_token')
      expect(dispatchEventSpy).toHaveBeenCalled()
    })
  })
})
