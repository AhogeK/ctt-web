import { z } from 'zod'

// ==========================================
// Shared Schemas
// ==========================================

/**
 * Password validation matching ctt-server @StrongPassword annotation.
 *
 * Server-side validation (StrongPassword.java):
 * - 8-64 characters length (NIST SP 800-63B compliant)
 * - Only printable ASCII non-space characters (0x21-0x7E)
 * - NO complexity requirements (uppercase, digit, special char are optional)
 *
 * Reused by LoginRequestSchema, RegisterRequestSchema, and password reset schemas.
 */
export const StrongPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine((val) => /^[!-~]+$/.test(val), 'Password contains invalid characters')
  .refine((val) => val.length >= 8, 'Password must be at least 8 characters')
  .refine((val) => val.length <= 64, 'Password must not exceed 64 characters')

// ==========================================
// Login Schemas
// ==========================================

/**
 * Login request schema aligned with ctt-server LoginRequest DTO.
 *
 * Server-side validation (LoginRequest.java):
 * - email: @NotBlank + @Email, trimmed and lowercased before processing
 * - password: @StrongPassword (8-64 chars, printable ASCII only, no complexity requirements)
 * - deviceId: @NotBlank (required for device binding and tracking)
 */
export const LoginRequestSchema = z.object({
  // Email is validated as proper format and normalized to lowercase by server
  email: z.email('Invalid email format').min(1, 'Email is required'),
  // Strong password policy: min 8, max 32, uppercase, lowercase, digit, special char (@$!%*?&), allowed chars only
  password: StrongPasswordSchema,
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
  // OAuth2 token type per RFC 6750 — only 'Bearer' is accepted
  tokenType: z.literal('Bearer').default('Bearer'),
  // Whether terms of service need re-acceptance (optional, defaults to false)
  termsExpired: z.boolean().default(false),
})

// Export inferred types for use in API layer and components
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>

/**
 * Unified authentication response schema.
 *
 * Backend returns (AuthResponse.java):
 * - accessToken: JWT token for API authentication
 * - refreshToken: Token for obtaining new access tokens
 * - termsExpired: Whether user's terms acceptance is expired
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  termsExpired: z.boolean().default(false),
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

// ==========================================
// Registration Schemas
// ==========================================

/**
 * Display name regex matching ctt-server @Pattern constraint.
 * Allows: CJK (Chinese, Hiragana, Katakana, Korean), ASCII letters, digits, underscore, hyphen.
 * Length: 2-50 characters.
 */
export const REGEX_DISPLAY_NAME = /^[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z0-9_-]{2,50}$/

/**
 * Registration request schema matching ctt-server UserRegisterRequest DTO.
 *
 * Server-side validation (UserRegisterRequest.java):
 * - email: @NotBlank + @Email, server normalizes to lowercase
 * - displayName: @NotBlank + @Pattern, regex allows CJK + ASCII alphanumerics + _-
 * - password: @StrongPassword (8-64 chars, printable ASCII only, no complexity requirements)
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
  // Terms version accepted by user — must match server's current version
  termsVersion: z.string().min(1, 'Terms version is required'),
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
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Export inferred types for use in API layer and components
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type RegisterForm = z.infer<typeof RegisterFormSchema>

/**
 * Registration form data emitted by RegisterForm component.
 *
 * Excludes termsVersion (injected by RegisterView from publicConfig).
 * This is the form-layer type, not the API-layer RegisterRequest.
 */
export type RegisterFormData = Omit<RegisterRequest, 'termsVersion'>

// ==========================================
// Email Verification Schemas
// ==========================================

/**
 * Verify email query parameter schema.
 *
 * Backend endpoint: GET /api/v1/auth/verify-email?token=xxx
 * The token is a plain string query parameter (no DTO on backend).
 * Server validates: token existence, not expired (24h), not consumed, not revoked.
 */
export const VerifyEmailParamSchema = z.object({
  // Verification token from email link — required, non-empty
  token: z.string().min(1, 'Verification token is required'),
})

export type VerifyEmailParam = z.infer<typeof VerifyEmailParamSchema>

/**
 * Resend verification email request schema matching ctt-server ResendVerificationRequest DTO.
 *
 * Server-side validation (ResendVerificationRequest.java):
 * - email: @NotBlank + @Email, server normalizes to lowercase via compact constructor
 *
 * Backend endpoint: POST /api/v1/auth/resend-verification
 * Rate limited: 3 requests per minute per email.
 */
export const ResendVerificationRequestSchema = z.object({
  // Email address to resend verification to, server normalizes to lowercase
  email: z.email('Invalid email format').min(1, 'Email is required'),
})

export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequestSchema>

// ==========================================
// Password Reset Schemas
// ==========================================

/**
 * Forgot password request schema matching ctt-server ForgotPasswordRequest DTO.
 *
 * Server-side validation (ForgotPasswordRequest.java):
 * - email: @NotBlank + @Email, server normalizes to lowercase
 *
 * Backend endpoint: POST /api/v1/auth/forgot-password
 * Rate limited: 3 requests per 10 minutes per email, 30 per hour per IP.
 * Anti-enumeration: Always returns 200 OK regardless of email existence.
 */
export const ForgotPasswordRequestSchema = z.object({
  // Email address to send reset link to, server normalizes to lowercase
  email: z.email('Invalid email format').min(1, 'Email is required'),
})

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>

/**
 * Forgot password form schema for frontend UI validation.
 *
 * Extends ForgotPasswordRequestSchema with no additional fields since the
 * forgot password flow only requires email input. Used with Vee-Validate + Zod integration.
 */
export const ForgotPasswordFormSchema = ForgotPasswordRequestSchema

export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>

/**
 * Reset password request schema matching ctt-server ResetPasswordRequest DTO.
 *
 * Server-side validation (ResetPasswordRequest.java):
 * - token: @NotBlank, the reset token from email link
 * - newPassword: @StrongPassword (8-64 chars, printable ASCII only, no complexity requirements)
 *
 * Backend endpoint: POST /api/v1/auth/password-reset/confirm
 * Rate limited: 15 requests per 10 minutes per IP.
 */
export const ResetPasswordRequestSchema = z.object({
  // Reset token from email link — required, non-empty
  token: z.string().min(1, 'Reset token is required'),
  // Strong password policy enforced by server's @StrongPassword annotation
  newPassword: StrongPasswordSchema,
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

/**
 * Reset password form schema for frontend UI validation.
 *
 * Independent from ResetPasswordRequestSchema — does NOT include token field
 * because token is extracted from URL query param, not rendered in the form.
 * Used with Vee-Validate + Zod integration for client-side validation only.
 * Token validation is handled at submission time in the view component.
 */
export const ResetPasswordFormSchema = z
  .object({
    newPassword: StrongPasswordSchema,
    // Confirm password for frontend UX — not sent to API
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>
