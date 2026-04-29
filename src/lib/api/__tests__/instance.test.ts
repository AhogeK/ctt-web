import { describe, it, expect, beforeEach, vi, afterEach } from 'vite-plus/test'
import { toast } from 'vue-sonner'
import { UNAUTHORIZED_EVENT } from '../instance'

/* oxlint-disable @typescript-eslint/no-explicit-any */

const capturedConfig = vi.hoisted(() => ({
  baseURL: '',
  timeout: 0,
  credentials: '',
  onRequest: null as ((context: any) => Promise<void>) | null,
  onResponseError: null as ((context: any) => Promise<void>) | null,
}))

const mockFetchInstance = vi.hoisted(() => ({
  raw: vi.fn<() => Promise<any>>(),
  create: vi.fn<() => any>().mockReturnThis(),
}))

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
})
