import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

/* eslint-disable @typescript-eslint/no-explicit-any */

const capturedConfig = vi.hoisted(() => ({
  baseURL: '',
  timeout: 0,
  credentials: '',
  onRequest: null as ((context: any) => Promise<void>) | null,
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
      return mockFetchInstance
    }),
  },
}))

vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')

describe('API Instance', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    vi.clearAllMocks()

    setActivePinia(
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      }),
    )
    authStore = useAuthStore()
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
      await import('../instance')

      authStore.accessToken = 'test-access-token'

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
      await import('../instance')

      authStore.accessToken = 'token-123'

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
      await import('../instance')

      authStore.accessToken = null

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
      await import('../instance')

      authStore.accessToken = ''

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

    it('gets auth store lazily inside interceptor', async () => {
      vi.resetModules()
      await import('../instance')

      authStore.accessToken = null

      const mockContext1 = {
        request: new Request('https://api.example.com/test1'),
        options: { headers: new Headers() },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext1)
      }
      expect((mockContext1.options.headers as Headers).has('Authorization')).toBe(false)

      authStore.accessToken = 'new-token'

      const mockContext2 = {
        request: new Request('https://api.example.com/test2'),
        options: { headers: new Headers() },
      }

      if (capturedConfig.onRequest) {
        await capturedConfig.onRequest(mockContext2)
      }
      expect((mockContext2.options.headers as Headers).get('Authorization')).toBe(
        'Bearer new-token',
      )
    })
  })

  describe('Error Handling', () => {
    it('interceptor does not throw on successful header modification', async () => {
      vi.resetModules()
      await import('../instance')

      authStore.accessToken = 'valid-token'

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
      await import('../instance')

      authStore.accessToken = 'token'

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
})
