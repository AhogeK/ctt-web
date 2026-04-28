# Forgot Password Feature — API Contract Verification Approach

## Contract Discovery (Phase 1)

### Endpoints Verified from Backend Source

**1. POST /api/v1/auth/forgot-password**

- **Controller**: `AuthController.forgotPassword()` (line 480-493)
- **Request DTO**: `ForgotPasswordRequest { email: String }` — `@NotBlank` + `@Email`
- **Response**: `RestApiResponse<EmptyResponse>` — always 200 OK (anti-enumeration)
- **Rate Limit**: 3/10min per email, 30/hour per IP
- **Error Codes**: `COMMON_003` (400 validation), `COMMON_002` (429 rate limit)

**2. POST /api/v1/auth/password-reset/confirm**

- **Controller**: `AuthController.confirmPasswordReset()` (line 575-588)
- **Request DTO**: `ResetPasswordRequest { token: String, newPassword: String }` — `@NotBlank` + `@StrongPassword`
- **Response**: `RestApiResponse<EmptyResponse>` — 200 on success
- **Rate Limit**: 15/10min per IP
- **Error Codes**: `COMMON_003` (400), `AUTH_003` (401 invalid token), `PASSWORD_SAME_AS_OLD` (409), `COMMON_002` (429)

## Schema Definition (Phase 2)

### Zod Schemas Added to `auth.schema.ts`

```typescript
// Request schema — matches ForgotPasswordRequest DTO exactly
ForgotPasswordRequestSchema = z.object({ email: z.email() })

// Request schema — matches ResetPasswordRequest DTO exactly
ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: StrongPasswordSchema, // Reuses existing strong password policy
})

// Form schema — extends with confirmPassword for UX
ResetPasswordFormSchema = ResetPasswordRequestSchema.extend({
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword)
```

### Two-Step Parsing Pattern

Following the skill's Phase 2.3, API responses are parsed in two steps:

1. Parse wrapper with `RestApiResponseSchema`
2. Extract `data` field (which is `null`/`unknown` for empty responses)

## Implementation (Phase 3)

### Files Modified/Created

| File                                                  | Action   | Purpose                                                                     |
| ----------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `src/lib/schemas/auth.schema.ts`                      | Modified | Added ForgotPassword/ResetPassword Zod schemas                              |
| `src/lib/api/auth.ts`                                 | Modified | Added `forgotPassword()` and `resetPassword()` API functions                |
| `src/lib/api/index.ts`                                | Modified | Export new API functions                                                    |
| `src/lib/utils/api-error.ts`                          | Modified | Added AUTH_003, PASSWORD_SAME_AS_OLD, COMMON_002, COMMON_003 error mappings |
| `src/router/route-names.ts`                           | Modified | Added FORGOT_PASSWORD, RESET_PASSWORD constants                             |
| `src/router/modules/auth.ts`                          | Modified | Added /auth/forgot-password and /auth/reset-password routes                 |
| `src/features/auth/components/LoginForm.vue`          | Modified | Added "Forgot password?" link next to password label                        |
| `src/features/auth/views/ForgotPasswordView.vue`      | Created  | Email form view with success state                                          |
| `src/features/auth/components/ForgotPasswordForm.vue` | Created  | Email input form with Vee-Validate + Zod                                    |
| `src/features/auth/views/ResetPasswordView.vue`       | Created  | Token + new password view with success state                                |
| `src/features/auth/components/ResetPasswordForm.vue`  | Created  | Password + confirm password form with strength meter                        |

### Error Handling Strategy

Following the skill's Phase 3.4 (single toast location):

- **Component level**: All expected business errors (validation, rate limit, invalid token)
- **Global interceptor**: Only unexpected errors (network failures, 500s)
- **Never both** — prevents double toast bug from history

### Anti-Enumeration Compliance

The backend always returns 200 OK for forgot-password regardless of email existence.
The frontend mirrors this by showing a generic success message: "If your email address exists in our database, you will receive a password recovery link..."

## Self-Test (Phase 4)

### Verification Steps

To verify the integration:

```bash
# Test forgot-password success path
curl -X POST http://localhost:8080/ctt-server/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: 200 OK with RestApiResponse wrapper

# Test forgot-password validation error
curl -X POST http://localhost:8080/ctt-server/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'

# Expected: 400 with COMMON_003 error code

# Test reset-password (requires valid token from email)
curl -X POST http://localhost:8080/ctt-server/api/v1/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"valid-token-here","newPassword":"NewPass123!"}'

# Expected: 200 OK on success, 401 AUTH_003 on invalid token
```

### Checklist

- [x] Read Controller + DTO in ctt-server
- [x] Document request/response/error codes
- [x] Define wrapper schema + inner data schema
- [x] Parse in two steps (wrapper first, then data)
- [x] Use lib/api/ layer
- [x] Extract error from error.data.code
- [x] Use mapApiErrorCode() for known codes
- [x] Decide ONE toast location (component level for business errors)
- [ ] Call endpoint with curl/Swagger (requires running backend)
- [ ] Verify success response matches schema (requires running backend)
- [ ] Verify error response matches schema (requires running backend)
