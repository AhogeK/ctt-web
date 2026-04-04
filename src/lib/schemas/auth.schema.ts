import { z } from 'zod'

/**
 * Login request schema aligned with ctt-server LoginRequest DTO.
 *
 * Server-side validation (LoginRequest.java):
 * - email: @NotBlank + @Email, trimmed and lowercased before processing
 * - password: @StrongPassword (min 8 chars, uppercase, lowercase, digit, special char)
 * - deviceId: @NotBlank (required for device binding and tracking)
 */
export const LoginRequestSchema = z.object({
  // Email is validated as proper format and normalized to lowercase by server
  email: z.email('Invalid email format').min(1, 'Email is required'),
  // Strong password policy enforced by server's @StrongPassword annotation
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Device ID is required for device binding - server uses @NotBlank validation
  deviceId: z.string().min(1, 'Device ID is required'),
})

/**
 * Login response schema aligned with ctt-server LoginResponse DTO.
 *
 * Server returns (LoginResponse.java):
 * - userId: UUID format identifier
 * - accessToken: JWT token for API authentication
 * - refreshToken: Token for obtaining new access tokens
 * - expiresIn: Access token expiration in seconds (long type)
 * - tokenType: OAuth2 token type, defaults to "Bearer" per RFC 6750
 */
export const LoginResponseSchema = z.object({
  // User unique identifier in UUID format
  userId: z.uuid('Invalid user ID format'),
  // JWT access token for authenticating API requests
  accessToken: z.string().min(1, 'Access token is required'),
  // Refresh token for token renewal flow
  refreshToken: z.string().min(1, 'Refresh token is required'),
  // Token expiration duration in seconds
  expiresIn: z.number().int().positive('Expiration must be positive'),
  // OAuth2 token type per RFC 6750 specification
  tokenType: z.string().default('Bearer'),
})

// Export inferred types for use in API layer and components
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
