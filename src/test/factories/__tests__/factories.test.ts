import { describe, it, expect, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'
import { z } from 'zod'
import {
  buildLoginRequest,
  buildLoginResponse,
  buildApiResponse,
  buildPagedResponse,
  buildApiError,
} from '@/test/factories'
import { LoginRequestSchema, LoginResponseSchema } from '@/lib/schemas/auth.schema'
import {
  ApiErrorSchema,
  createApiResponseSchema,
  createPagedResponseSchema,
} from '@/lib/schemas/api.schema'

afterEach(() => {
  faker.seed()
})

describe('Auth Factories', () => {
  describe('buildLoginRequest', () => {
    it('generates valid LoginRequest passing Zod validation', () => {
      const request = buildLoginRequest()
      const result = LoginRequestSchema.safeParse(request)

      expect(result.success).toBe(true)
    })

    it('allows field overrides', () => {
      const request = buildLoginRequest({
        email: 'test@example.com',
        password: 'Test1234!',
        deviceId: 'custom-device-id',
      })

      expect(request.email).toBe('test@example.com')
      expect(request.password).toBe('Test1234!')
      expect(request.deviceId).toBe('custom-device-id')
    })

    it('generates unique data each call (no seed)', () => {
      faker.seed()

      const request1 = buildLoginRequest()
      const request2 = buildLoginRequest()

      expect(request1.email).not.toBe(request2.email)
      expect(request1.deviceId).not.toBe(request2.deviceId)
    })

    it('generates consistent data with same seed', () => {
      faker.seed(12345)
      const request1 = buildLoginRequest()

      faker.seed(12345)
      const request2 = buildLoginRequest()

      expect(request1).toStrictEqual(request2)
    })
  })

  describe('buildLoginResponse', () => {
    it('generates valid LoginResponse passing Zod validation', () => {
      const response = buildLoginResponse()
      const result = LoginResponseSchema.safeParse(response)

      expect(result.success).toBe(true)
    })

    it('allows field overrides', () => {
      const response = buildLoginResponse({
        userId: '00000000-0000-0000-0000-000000000001',
        accessToken: 'custom-access-token',
        refreshToken: 'custom-refresh-token',
        expiresIn: 7200,
        tokenType: 'Custom',
      })

      expect(response.userId).toBe('00000000-0000-0000-0000-000000000001')
      expect(response.accessToken).toBe('custom-access-token')
      expect(response.refreshToken).toBe('custom-refresh-token')
      expect(response.expiresIn).toBe(7200)
      expect(response.tokenType).toBe('Custom')
    })

    it('default tokenType is Bearer', () => {
      const response = buildLoginResponse()

      expect(response.tokenType).toBe('Bearer')
    })

    it('expiresIn is within expected range (300-86400)', () => {
      const response = buildLoginResponse()

      expect(response.expiresIn).toBeGreaterThanOrEqual(300)
      expect(response.expiresIn).toBeLessThanOrEqual(86_400)
    })
  })
})

describe('API Response Factories', () => {
  describe('buildApiResponse', () => {
    it('wraps data in standard response format', () => {
      const data = { id: '1', name: 'Test' }
      const response = buildApiResponse(data)

      expect(response.code).toBe(0)
      expect(response.message).toBe('Success')
      expect(response.data).toBe(data)
    })

    it('allows code and message overrides', () => {
      const data = { id: '1' }
      const response = buildApiResponse(data, { code: 404, message: 'Not Found' })

      expect(response.code).toBe(404)
      expect(response.message).toBe('Not Found')
      expect(response.data).toBe(data)
    })

    it('output passes createApiResponseSchema validation', () => {
      const data = { id: '1', name: 'Test' }
      const response = buildApiResponse(data)
      const schema = createApiResponseSchema(z.object({ id: z.string(), name: z.string() }))
      const result = schema.safeParse(response)

      expect(result.success).toBe(true)
    })
  })

  describe('buildPagedResponse', () => {
    it('wraps items with pagination metadata', () => {
      const items = [{ id: '1' }, { id: '2' }]
      const response = buildPagedResponse(items)

      expect(response.code).toBe(0)
      expect(response.message).toBe('Success')
      expect(response.data.items).toBe(items)
      expect(response.data.total).toBe(2)
      expect(response.data.page).toBe(1)
      expect(response.data.pageSize).toBe(10)
    })

    it('calculates totalPages correctly', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))
      const response = buildPagedResponse(items, { total: 100, pageSize: 20 })

      expect(response.data.totalPages).toBe(5)
    })

    it('handles empty items with totalPages zero', () => {
      const response = buildPagedResponse([])

      expect(response.data.items).toStrictEqual([])
      expect(response.data.total).toBe(0)
      expect(response.data.totalPages).toBe(0)
    })

    it('calculates totalPages with remainder', () => {
      const response = buildPagedResponse([], { total: 101, pageSize: 20 })

      expect(response.data.totalPages).toBe(6)
    })

    it('uses provided total/page/pageSize overrides', () => {
      const items = [{ id: '1' }]
      const response = buildPagedResponse(items, {
        total: 50,
        page: 3,
        pageSize: 15,
      })

      expect(response.data.total).toBe(50)
      expect(response.data.page).toBe(3)
      expect(response.data.pageSize).toBe(15)
      expect(response.data.totalPages).toBe(4)
    })

    it('output passes createPagedResponseSchema validation', () => {
      const items = [{ id: '1' }, { id: '2' }]
      const response = buildPagedResponse(items)
      const itemSchema = z.object({ id: z.string() })
      const schema = createPagedResponseSchema(itemSchema)
      const result = schema.safeParse(response)

      expect(result.success).toBe(true)
    })
  })

  describe('buildApiError', () => {
    it('creates error with message only', () => {
      const error = buildApiError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.error).toBeUndefined()
      expect(error.statusCode).toBeUndefined()
      expect(error.details).toBeUndefined()
    })

    it('includes optional fields when provided', () => {
      const error = buildApiError('Validation failed', {
        error: 'ValidationError',
        statusCode: 422,
        details: { email: ['Invalid format'] },
      })

      expect(error.message).toBe('Validation failed')
      expect(error.error).toBe('ValidationError')
      expect(error.statusCode).toBe(422)
      expect(error.details).toStrictEqual({ email: ['Invalid format'] })
    })

    it('output passes ApiErrorSchema validation', () => {
      const error = buildApiError('Test error', {
        error: 'TestError',
        statusCode: 500,
      })
      const result = ApiErrorSchema.safeParse(error)

      expect(result.success).toBe(true)
    })

    it('statusCode 0 is included (falsy edge case)', () => {
      const error = buildApiError('Network error', { statusCode: 0 })

      expect(error.statusCode).toBe(0)
      expect(Object.prototype.hasOwnProperty.call(error, 'statusCode')).toBe(true)
    })
  })
})
