# Forgot Password Feature - Implementation Approach

## Overview

Implemented the forgot password feature for the ctt-web frontend, integrating with the ctt-server backend endpoints.

## Backend API Contract (Verified from ctt-server source)

### 1. Request Password Reset

- **Endpoint**: `POST /api/v1/auth/forgot-password`
- **Request Body**: `{ email: string }` (ForgotPasswordRequest DTO)
- **Response**: `RestApiResponse<EmptyResponse>` with success message
- **Rate Limits**: 3 requests/10min per email, 30 requests/hour per IP
- **Security**: Anti-enumeration protection (always returns success regardless of email existence)

### 2. Confirm Password Reset

- **Endpoint**: `POST /api/v1/auth/password-reset/confirm`
- **Request Body**: `{ token: string, newPassword: string }` (ResetPasswordRequest DTO)
- **Response**: `RestApiResponse<EmptyResponse>` with success message
- **Rate Limits**: 15 requests/10min per IP
- **Security**: Token validation, password strength validation, session termination on success

### Error Codes

| Code                 | HTTP Status | Description                  |
| -------------------- | ----------- | ---------------------------- |
| AUTH_003             | 401         | Token invalid or expired     |
| PASSWORD_SAME_AS_OLD | 409         | New password same as current |
| COMMON_002           | 429         | Rate limit exceeded          |

## Implementation Details

### Files Modified

1. **`src/lib/schemas/auth.schema.ts`** - Added Zod schemas:
   - `ForgotPasswordRequestSchema` - Email validation matching backend DTO
   - `ResetPasswordRequestSchema` - Token + newPassword validation
   - `ResetPasswordFormSchema` - UI form with confirmPassword cross-field validation

2. **`src/lib/api/auth.ts`** - Added API functions:
   - `forgotPassword(email)` - Calls POST /api/v1/auth/forgot-password
   - `resetPassword(data)` - Calls POST /api/v1/auth/password-reset/confirm
   - Both use two-step Zod parsing (request validation → response wrapper → data)

3. **`src/lib/api/index.ts`** - Exported new API functions

4. **`src/lib/utils/api-error.ts`** - Added error code mappings:
   - `AUTH_003` - Invalid/expired reset token
   - `PASSWORD_SAME_AS_OLD` - Password conflict
   - `COMMON_002` - Rate limiting

5. **`src/router/route-names.ts`** - Added route constants:
   - `FORGOT_PASSWORD`, `FORGOT_PASSWORD_SUCCESS`, `RESET_PASSWORD`

6. **`src/router/modules/auth.ts`** - Added route definitions:
   - `/auth/forgot-password` → ForgotPasswordView
   - `/auth/forgot-password-success` → ForgotPasswordSuccessView
   - `/auth/reset-password` → ResetPasswordView (token from query param)

7. **`src/features/auth/components/LoginForm.vue`** - Added "Forgot password?" link

### Files Created

1. **`src/features/auth/views/ForgotPasswordView.vue`**
   - Email input form with Vee-Validate + Zod validation
   - TanStack Query mutation for API call
   - Rate limit handling with cooldown timer
   - Redirects to success view on completion

2. **`src/features/auth/views/ForgotPasswordSuccessView.vue`**
   - Success confirmation with MailOpen icon
   - "Try another email" button (returns to forgot password form)
   - "Back to sign in" button

3. **`src/features/auth/views/ResetPasswordView.vue`**
   - Token extracted from URL query parameter (`?token=xxx`)
   - New password + confirm password form with strength meter
   - Password visibility toggle
   - Error handling for invalid/expired tokens (AUTH_003)
   - Inline field error for same-password conflict (PASSWORD_SAME_AS_OLD)
   - Redirects to login on success

## Error Handling Strategy

Following the established project patterns:

- **API errors**: Extracted via `isApiError()` type guard
- **Error codes**: Mapped via `mapApiErrorCode()` for user-friendly messages
- **Rate limits**: Cooldown timer prevents repeated attempts
- **Form errors**: Inline field errors via `form.setFieldError()`
- **Toast notifications**: Sonner toast for success/error feedback
- **Global interceptor**: 401/403/422 handled by ofetch interceptor (no double-toast)

## Design Consistency

All views follow the established Linear-inspired design system:

- Inter Variable with `cv01, ss03` OpenType features
- Weight 510 as signature emphasis weight
- Brand indigo (`#5e6ad2`) for primary CTAs
- Light mode: `#f3f4f5` backgrounds, `#d0d6e0` borders
- Dark mode: `rgba(255,255,255,0.08)` borders, `rgba(255,255,255,0.02)` surfaces
- Consistent spacing, typography, and component styling

## Verification

- `vp check` passes (format + lint + type check)
- Pre-existing test failures are unrelated to this feature
- All new code follows established patterns (Zod schemas, two-step parsing, TanStack Query mutations)
