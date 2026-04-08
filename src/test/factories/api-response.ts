import type { ApiError } from '@/lib/schemas/api.schema'

/**
 * Options for building a standard API response.
 */
export interface ApiResponseOptions {
  code?: number
  message?: string
}

/**
 * Options for building a paginated API response.
 */
export interface PagedResponseOptions {
  total?: number
  page?: number
  pageSize?: number
}

/**
 * Options for building an API error response.
 */
export interface ApiErrorOptions {
  error?: string
  statusCode?: number
  details?: Record<string, string[]>
}

/**
 * Build a standard API response: { code: number, message: string, data: T }
 *
 * Matches createApiResponseSchema<T> from api.schema.ts
 */
export function buildApiResponse<T>(
  data: T,
  options: ApiResponseOptions = {},
): { code: number; message: string; data: T } {
  return {
    code: options.code ?? 0,
    message: options.message ?? 'Success',
    data,
  }
}

/**
 * Build a paginated API response: { code: 0, message: 'Success', data: { items, total, page, pageSize, totalPages } }
 *
 * Matches createPagedResponseSchema<T> from api.schema.ts
 * Automatically calculates totalPages from total and pageSize.
 */
export function buildPagedResponse<T>(
  items: T[],
  options: PagedResponseOptions = {},
): {
  code: number
  message: string
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
} {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  const total = options.total ?? items.length
  const totalPages = Math.ceil(total / pageSize)

  return {
    code: 0,
    message: 'Success',
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages,
    },
  }
}

/**
 * Build an API error response matching ApiErrorSchema from api.schema.ts
 */
export function buildApiError(message: string, options: ApiErrorOptions = {}): ApiError {
  return {
    message,
    ...(options.error && { error: options.error }),
    ...(options.statusCode !== undefined && { statusCode: options.statusCode }),
    ...(options.details && { details: options.details }),
  }
}
