import { z } from 'zod'

// ==========================================
// Login Schemas
// ==========================================

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

// ==========================================
// Registration Schemas
// ==========================================

/**
 * Display name regex matching ctt-server @Pattern constraint.
 * Allows: CJK (Chinese, Hiragana, Katakana, Korean), ASCII letters, digits, underscore, hyphen.
 * Length: 2-50 characters.
 */
export const REGEX_DISPLAY_NAME =
  /^[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z0-9_-]{2,50}$/

/**
 * Strong password validation matching ctt-server @StrongPassword annotation.
 *
 * Server-side regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$
 * - Minimum 8 characters, maximum 32
 * - At least one uppercase letter [A-Z]
 * - At least one lowercase letter [a-z]
 * - At least one digit [0-9]
 * - At least one special character (@$!%*?&)
 * - Allowed characters: A-Z, a-z, 0-9, @$!%*?& only
 *
 * Reused by RegisterRequestSchema, and future ChangePassword/ResetPassword schemas.
 */
export const StrongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(32, 'Password must not exceed 32 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/\d/, 'Must contain at least one digit')
  .regex(/[@$!%*?&]/, 'Must contain at least one special character (@$!%*?&)')
  .regex(/^[A-Za-z\d@$!%*?&]+$/, 'Password contains disallowed characters')

/**
 * Registration request schema matching ctt-server UserRegisterRequest DTO.
 *
 * Server-side validation (UserRegisterRequest.java):
 * - email: @NotBlank + @Email, server normalizes to lowercase
 * - displayName: @NotBlank + @Pattern, regex allows CJK + ASCII alphanumerics + _-
 * - password: @StrongPassword (min 8, max 32, upper + lower + digit + special)
 */
export const RegisterRequestSchema = z.object({
  // Email validated as proper format, server normalizes to lowercase
  email: z.email('Invalid email format').min(1, 'Email is required'),
  // Display name matching server @Pattern regex exactly
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .regex(REGEX_DISPLAY_NAME, 'Invalid display name format'),
  // Strong password policy enforced by server's @StrongPassword annotation
  password: StrongPasswordSchema,
})

/**
 * Registration form schema for frontend UI validation.
 *
 * Extends RegisterRequestSchema with confirmPassword field and cross-field
 * password matching validation. Used with Vee-Validate + Zod integration.
 */
export const RegisterFormSchema = RegisterRequestSchema.extend({
  // Confirm password for frontend UX — not sent to API
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Export inferred types for use in API layer and components
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type RegisterForm = z.infer<typeof RegisterFormSchema>
