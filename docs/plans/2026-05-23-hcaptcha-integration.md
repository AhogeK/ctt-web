# Plan: hCaptcha Integration for Auth Forms
Date: 2026-05-23
Status: completed

## Objective

Integrate hCaptcha (free tier) into ctt-web auth forms for bot protection. Requirement: "全球通用的同时中国也能正常使用" (global coverage including China mainland).

## Architecture Decision

**Selected**: hCaptcha Free Tier

| Factor | Value |
|--------|-------|
| Provider | hCaptcha |
| Plan | Basic (Free) |
| Monthly Limit | 100,000 verifications |
| China Access | ✅ Works |
| Vue 3 SDK | @hcaptcha/vue3-hcaptcha |
| Cost | $0 |
| UX Trade-off | Users see visible image challenges |

**Rejected Alternatives**:
- Cloudflare Turnstile: Blocked in China (GFW)
- reCAPTCHA v3: Blocked in China
- Dual Strategy (Turnstile + Alibaba): Too complex for project scale
- Altcha Self-hosted: High maintenance overhead

## Affected Files

### Frontend (ctt-web)
- `package.json` — Add `@hcaptcha/vue3-hcaptcha` dependency
- `src/lib/schemas/auth.schema.ts` — Add `captchaToken` to login/register/forgot-password schemas
- `src/lib/api/auth.ts` — Pass captcha token in API calls
- `src/lib/api/config.ts` — Extend PublicConfig type to include `captchaSiteKey`
- `src/features/auth/components/LoginForm.vue` — Add HCaptcha widget
- `src/features/auth/components/RegisterForm.vue` — Add HCaptcha widget
- `src/features/auth/components/ForgotPasswordForm.vue` — Add HCaptcha widget
- `src/features/auth/views/LoginView.vue` — Handle captcha token in mutation
- `src/features/auth/views/RegisterView.vue` — Handle captcha token in mutation
- `src/features/auth/views/ForgotPasswordView.vue` — Handle captcha token in mutation
- `src/features/auth/components/ResetPasswordForm.vue` — NO CHANGE (token-protected)

### Backend (ctt-server)
- `AuthController.java` — Add captchaToken field to login/register/forgot-password DTOs
- `CaptchaService.java` — New service for hCaptcha server-side verification
- `application.yml` — Add hCaptcha secret key config
- `PublicConfigController.java` — Return captchaSiteKey in public config

## Implementation Steps

### Phase 1: Frontend Foundation (2-3 hours)

**Step 1.1**: Install hCaptcha Vue 3 SDK
```bash
pnpm add @hcaptcha/vue3-hcaptcha
```

**Step 1.2**: Create `src/components/common/CaptchaWidget.vue`
- Wrapper component for hCaptcha
- Props: `siteKey`, `modelValue` (captcha token)
- Emits: `update:modelValue`
- Handles: expired, error events
- Uses `defineModel` for v-model binding

**Step 1.3**: Create `src/composables/useCaptcha.ts`
- Composable for captcha state management
- Returns: `captchaToken`, `resetCaptcha()`, `isExpired`
- Integrates with form validation

### Phase 2: Schema Updates (30 min)

**Step 2.1**: Update `src/lib/schemas/auth.schema.ts`
```typescript
// Add to loginSchema, registerSchema, forgotPasswordSchema
captchaToken: z.string().min(1, 'Please complete the captcha')
```

**Step 2.2**: Update `src/lib/api/config.ts`
- Extend `PublicConfigSchema` to include `captchaSiteKey: z.string().optional()`

### Phase 3: Form Integration (1-2 hours)

**Step 3.1**: Update LoginForm.vue
- Import CaptchaWidget
- Add to form template
- Bind with v-model to captchaToken field

**Step 3.2**: Update RegisterForm.vue
- Same pattern as LoginForm

**Step 3.3**: Update ForgotPasswordForm.vue
- Same pattern as LoginForm

**Step 3.4**: Update View components
- Pass captcha token in mutation payload
- Handle captcha reset on error

### Phase 4: Backend Integration (2-3 hours)

**Step 4.1**: Add hCaptcha dependency to ctt-server
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

**Step 4.2**: Create `CaptchaService.java`
```java
@Service
public class CaptchaService {
    // Verify hCaptcha token via POST to https://hcaptcha.com/siteverify
    // Return boolean: valid or not
    // Handle: network errors, invalid tokens, expired tokens
}
```

**Step 4.3**: Update auth DTOs
- Add `captchaToken` field to LoginRequest, RegisterRequest, ForgotPasswordRequest

**Step 4.4**: Update auth endpoints
- Inject CaptchaService
- Verify captcha before processing auth logic
- Return 400 with descriptive error if captcha invalid

**Step 4.5**: Update public config endpoint
- Return `captchaSiteKey` from application config

### Phase 5: Testing & Polish (1-2 hours)

**Step 5.1**: Unit tests
- Test CaptchaService with mock responses
- Test form validation with captcha token

**Step 5.2**: Integration tests
- Test full auth flow with captcha
- Test captcha expiration handling
- Test network error fallback

**Step 5.3**: Error handling
- User-friendly error messages
- Graceful degradation if hCaptcha unavailable
- Rate limiting on failed attempts

## Success Criteria

- [ ] hCaptcha widget displays on Login, Register, ForgotPassword forms
- [ ] Captcha token validated server-side before auth processing
- [ ] Captcha expires after 120 seconds, user must re-verify
- [ ] Form submission blocked if captcha not completed
- [ ] Public config returns captchaSiteKey
- [ ] All existing tests pass (451/451)
- [ ] New tests for captcha flow pass
- [ ] Works in China mainland (verified via VPN or proxy)

## Dependencies

- hCaptcha account (free tier): https://dashboard.hcaptcha.com
- Site key (public, for frontend)
- Secret key (private, for backend verification)

## Fallback Strategy

If hCaptcha service is unavailable:
1. Frontend: Show captcha widget with error state, allow retry
2. Backend: Accept request without captcha token but apply stricter rate limiting
3. Monitoring: Log captcha failures for alerting

## Effort Estimate

| Phase | Hours | Complexity |
|-------|-------|------------|
| Frontend Foundation | 2-3 | Low |
| Schema Updates | 0.5 | Low |
| Form Integration | 1-2 | Low |
| Backend Integration | 2-3 | Medium |
| Testing & Polish | 1-2 | Low |
| **Total** | **7-10** | **Medium** |

## Open Questions

1. Should captcha be always-required or progressive (show after N failures)?
2. Should we add captcha to password change flow (when user is logged in)?
3. How to handle captcha in E2E tests (mock or bypass)?
