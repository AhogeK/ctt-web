import { describe, it, expect } from 'vite-plus/test'
import { z } from 'zod'
import { ApiErrorSchema, createApiResponseSchema, createPagedResponseSchema } from '../api.schema'

/**
 * Test schemas for validating factory functions.
 * These are simple schemas used to test the wrapper behavior.
 */
const SimpleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const NestedItemSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.email(),
  }),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  }),
})

describe('ApiErrorSchema', () => {
  describe('valid error responses', () => {
    it('parses valid error response with message only', () => {
      const errorData = { message: 'Something went wrong' }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.message).toBe('Something went wrong')
      expect(result.data.error).toBeUndefined()
      expect(result.data.statusCode).toBeUndefined()
      expect(result.data.details).toBeUndefined()
    })

    it('parses error with all optional fields', () => {
      const errorData = {
        message: 'Validation failed',
        error: 'ValidationError',
        statusCode: 400,
        details: {
          email: ['Invalid email format', 'Email is required'],
          password: ['Password too short'],
        },
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.message).toBe('Validation failed')
      expect(result.data.error).toBe('ValidationError')
      expect(result.data.statusCode).toBe(400)
      expect(result.data.details).toStrictEqual({
        email: ['Invalid email format', 'Email is required'],
        password: ['Password too short'],
      })
    })

    it('parses error with statusCode only', () => {
      const errorData = {
        message: 'Unauthorized access',
        statusCode: 401,
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.statusCode).toBe(401)
    })

    it('parses error with empty details object', () => {
      const errorData = {
        message: 'No field errors',
        details: {},
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.details).toStrictEqual({})
    })

    it('parses error with single detail entry', () => {
      const errorData = {
        message: 'Field error',
        details: {
          username: ['Username already exists'],
        },
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.details?.username).toStrictEqual(['Username already exists'])
    })
  })

  describe('invalid error responses', () => {
    it('rejects missing message field', () => {
      const errorData = { error: 'SomeError', statusCode: 500 }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]?.path).toStrictEqual(['message'])
    })

    it('rejects wrong type for message', () => {
      const errorData = { message: 123 }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['message'])
    })

    it('rejects wrong type for error field', () => {
      const errorData = { message: 'Error', error: 123 }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['error'])
    })

    it('rejects non-integer statusCode', () => {
      const errorData = { message: 'Error', statusCode: 401.5 }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['statusCode'])
    })

    it('rejects string statusCode', () => {
      const errorData = { message: 'Error', statusCode: '401' }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
    })

    it('rejects wrong type for details values', () => {
      const errorData = {
        message: 'Error',
        details: { field: 'single string instead of array' },
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['details', 'field'])
    })

    it('rejects details with non-string array elements', () => {
      const errorData = {
        message: 'Error',
        details: { field: ['error1', 123, 'error2'] },
      }
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
    })

    it('rejects empty object', () => {
      const errorData = {}
      const result = ApiErrorSchema.safeParse(errorData)

      expect(result.success).toBe(false)
    })

    it('rejects null', () => {
      const result = ApiErrorSchema.safeParse(null)

      expect(result.success).toBe(false)
    })

    it('rejects array instead of object', () => {
      const result = ApiErrorSchema.safeParse([{ message: 'Error' }])

      expect(result.success).toBe(false)
    })
  })
})

describe('createApiResponseSchema', () => {
  describe('valid wrapped responses', () => {
    it('wraps simple object schema correctly', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: { id: 'user-123', name: 'John Doe' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.code).toBe(0)
      expect(result.data.message).toBe('Success')
      expect(result.data.data.id).toBe('user-123')
      expect(result.data.data.name).toBe('John Doe')
    })

    it('validates nested structures', () => {
      const ResponseSchema = createApiResponseSchema(NestedItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          user: { id: 1, email: 'test@example.com' },
          metadata: { createdAt: '2024-01-01', updatedAt: '2024-01-02' },
        },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.user.email).toBe('test@example.com')
      expect(result.data.data.metadata.updatedAt).toBe('2024-01-02')
    })

    it('accepts non-zero code for error responses', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 1001,
        message: 'User not found',
        data: { id: '', name: '' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.code).toBe(1001)
    })

    it('accepts negative code values', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: -1,
        message: 'System error',
        data: { id: 'error', name: 'error' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.code).toBe(-1)
    })

    it('validates with primitive data schema', () => {
      const StringResponseSchema = createApiResponseSchema(z.string())
      const responseData = {
        code: 0,
        message: 'Success',
        data: 'simple string response',
      }
      const result = StringResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data).toBe('simple string response')
    })

    it('validates with array data schema', () => {
      const ArrayResponseSchema = createApiResponseSchema(z.array(z.string()))
      const responseData = {
        code: 0,
        message: 'Success',
        data: ['item1', 'item2', 'item3'],
      }
      const result = ArrayResponseSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data).toStrictEqual(['item1', 'item2', 'item3'])
    })
  })

  describe('invalid wrapped responses', () => {
    it('rejects missing code field', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        message: 'Success',
        data: { id: '123', name: 'Test' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['code'])
    })

    it('rejects missing message field', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        data: { id: '123', name: 'Test' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['message'])
    })

    it('rejects missing data field', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data'])
    })

    it('rejects non-integer code', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0.5,
        message: 'Success',
        data: { id: '123', name: 'Test' },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['code'])
    })

    it('rejects invalid data according to schema', () => {
      const ResponseSchema = createApiResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: { id: '123', name: 456 }, // name should be string
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'name'])
    })

    it('rejects invalid nested data', () => {
      const ResponseSchema = createApiResponseSchema(NestedItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          user: { id: 1, email: 'invalid-email' }, // invalid email format
          metadata: { createdAt: '2024-01-01' },
        },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'user', 'email'])
    })

    it('rejects missing nested required field', () => {
      const ResponseSchema = createApiResponseSchema(NestedItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          user: { id: 1, email: 'test@example.com' },
          metadata: {}, // missing createdAt
        },
      }
      const result = ResponseSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'metadata', 'createdAt'])
    })
  })
})

describe('createPagedResponseSchema', () => {
  describe('valid paginated responses', () => {
    it('wraps array of items with pagination metadata', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
          total: 100,
          page: 1,
          pageSize: 20,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.items).toHaveLength(2)
      expect(result.data.data.total).toBe(100)
      expect(result.data.data.page).toBe(1)
      expect(result.data.data.pageSize).toBe(20)
      expect(result.data.data.totalPages).toBeUndefined()
    })

    it('validates all pagination fields including totalPages', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [{ id: '1', name: 'Item 1' }],
          total: 50,
          page: 2,
          pageSize: 10,
          totalPages: 5,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.totalPages).toBe(5)
    })

    it('handles optional totalPages and accepts zero total count', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          // totalPages omitted
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.total).toBe(0)
      expect(result.data.data.totalPages).toBeUndefined()
    })

    it('accepts zero totalPages', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.totalPages).toBe(0)
    })

    it('validates empty items array', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
    })

    it('validates nested item schema', () => {
      const PagedSchema = createPagedResponseSchema(NestedItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [
            {
              user: { id: 1, email: 'test@example.com' },
              metadata: { createdAt: '2024-01-01' },
            },
          ],
          total: 1,
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
      }
      expect(result.data.data.items[0]?.user.email).toBe('test@example.com')
    })

    it('accepts large pagination values', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 1000000,
          page: 50000,
          pageSize: 100,
          totalPages: 10000,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(true)
    })
  })

  describe('invalid pagination data', () => {
    it('rejects negative total count', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: -1,
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'total'])
    })

    it('rejects zero page number', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 0,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'page'])
    })

    it('rejects negative page number', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: -1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
    })

    it('rejects zero pageSize', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 0,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'pageSize'])
    })

    it('rejects negative pageSize', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: -5,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
    })

    it('rejects negative totalPages', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: -1,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'totalPages'])
    })

    it('rejects missing items field', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          total: 0,
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'items'])
    })

    it('rejects missing total field', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'total'])
    })

    it('rejects missing page field', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'page'])
    })

    it('rejects missing pageSize field', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          page: 1,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'pageSize'])
    })

    it('rejects invalid item in array', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [{ id: '1', name: 123 }], // name should be string
          total: 1,
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'items', 0, 'name'])
    })

    it('rejects non-integer pagination values', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: [],
          total: 10.5,
          page: 1.5,
          pageSize: 10.5,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
    })

    it('rejects items as non-array', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
        data: {
          items: { id: '1', name: 'Item' }, // should be array
          total: 1,
          page: 1,
          pageSize: 10,
        },
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data', 'items'])
    })

    it('rejects missing data object entirely', () => {
      const PagedSchema = createPagedResponseSchema(SimpleItemSchema)
      const responseData = {
        code: 0,
        message: 'Success',
      }
      const result = PagedSchema.safeParse(responseData)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected parse to fail but it succeeded')
      }
      expect(result.error.issues[0]?.path).toStrictEqual(['data'])
    })
  })
})
