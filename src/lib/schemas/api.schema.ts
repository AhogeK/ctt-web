import { z } from 'zod'

/**
 * Standard API error response schema.
 *
 * Matches the error interceptor logic in instance.ts:
 * - message: Primary error description (always present)
 * - error: Optional error type/classification
 * - statusCode: HTTP status code (optional, may be inferred from response)
 * - details: Field-level validation errors (key = field name, value = error messages)
 */
export const ApiErrorSchema = z.object({
  // Primary error message from server or interceptor
  message: z.string(),
  // Optional error classification (e.g., "Unauthorized", "ValidationError")
  error: z.string().optional(),
  // HTTP status code for the error response
  statusCode: z.number().int().optional(),
  // Field-level validation errors: field name -> array of error messages
  details: z.record(z.string(), z.array(z.string())).optional(),
})

/**
 * Factory function for creating wrapped API response schemas.
 *
 * Standard response structure used across all API endpoints:
 * - code: Numeric status code (0 = success, non-zero = error)
 * - message: Human-readable status message
 * - data: The actual response payload (schema provided by caller)
 *
 * @param dataSchema - Zod schema for the response data payload
 * @returns Zod schema for the complete wrapped response
 *
 * @example
 * ```ts
 * const UserResponseSchema = createApiResponseSchema(UserSchema)
 * // Validates: { code: 0, message: "Success", data: { id: "...", name: "..." } }
 * ```
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    // Numeric status code (0 for success, non-zero for errors)
    code: z.number().int(),
    // Human-readable status message
    message: z.string(),
    // Response payload validated by provided schema
    data: dataSchema,
  })
}

/**
 * Factory function for creating paginated API response schemas.
 *
 * Standard pagination structure for list endpoints:
 * - code: Numeric status code (0 = success)
 * - message: Human-readable status message
 * - data.items: Array of items (schema provided by caller)
 * - data.total: Total number of items across all pages
 * - data.page: Current page number (1-indexed)
 * - data.pageSize: Number of items per page
 * - data.totalPages: Total number of pages (optional)
 *
 * @param itemSchema - Zod schema for individual items in the list
 * @returns Zod schema for the complete paginated response
 *
 * @example
 * ```ts
 * const UsersPagedSchema = createPagedResponseSchema(UserSchema)
 * // Validates: { code: 0, message: "Success", data: { items: [...], total: 100, page: 1, pageSize: 20 } }
 * ```
 */
export const createPagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    // Numeric status code (0 for success, non-zero for errors)
    code: z.number().int(),
    // Human-readable status message
    message: z.string(),
    // Paginated data payload
    data: z.object({
      // Array of items on current page
      items: z.array(itemSchema),
      // Total count of items across all pages
      total: z.number().int().nonnegative(),
      // Current page number (1-indexed, positive integer)
      page: z.number().int().positive(),
      // Number of items per page (positive integer)
      pageSize: z.number().int().positive(),
      // Total number of pages (optional, may be calculated client-side)
      totalPages: z.number().int().nonnegative().optional(),
    }),
  })
}

// Export inferred types for use in API layer and components
export type ApiError = z.infer<typeof ApiErrorSchema>

// ==========================================
// REST API Response Schemas
// ==========================================

/**
 * Standard REST API response schema matching ctt-server RestApiResponse<T>.
 *
 * Used by registration, email verification, and other endpoints that return
 * a simple success/failure response without specific data payload.
 *
 * Structure: { success: boolean, message: string, data: T | null, timestamp: ISO8601 }
 */
export const RestApiResponseSchema = z.object({
  // Operation success flag (true = success, false = error)
  success: z.boolean(),
  // Human-readable response message
  message: z.string(),
  // Response data payload (may be null for empty responses)
  data: z.unknown().nullable().optional(),
  // Response timestamp in ISO 8601 format
  timestamp: z.iso.datetime(),
})

/**
 * Empty response type for API endpoints that return only success/message.
 *
 * Used by register, verifyEmail, resendVerification, and other state-changing
 * endpoints that don't return specific data on success.
 */
export type EmptyResponse = z.infer<typeof RestApiResponseSchema>
